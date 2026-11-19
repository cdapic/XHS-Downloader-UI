#!/usr/bin/env bash
# deploy.sh — 一键部署前端到 nginx 主机(鉴权走 nginx 注入)
#
# 做四件事:
#   1. 构建 dist/(可 --no-build 跳过)
#   2. rsync dist/ → 目标机 /var/www/xhs-ui/(带 --delete,清掉老 bundle)
#   3. 把后端鉴权令牌装进目标机的独立 include 文件,并在站点配置的
#      location /xhs/ 里加上 include 行(已有则跳过)
#   4. nginx -t 通过后 reload,然后探活验证
#
# 令牌怎么来:后端容器 `python main.py TOKEN`(scripts/fetch-token.sh),
# 本地后端容器与 nginx 同机时可用;否则用 XHS_TOKEN 显式指定。
#
# 用法:
#   ./scripts/deploy.sh                     # 构建 + 部署 + 验证
#   ./scripts/deploy.sh --no-build          # 跳过构建
#   TARGET_HOST=root@1.2.3.4 ./scripts/deploy.sh
#
# 环境变量:
#   TARGET_HOST    默认 root@192.168.2.35
#   TARGET_PORT    默认 1234(xhs-ui 站点监听端口;2.35 的 :80 是另一个站点)
#   TARGET_DIR     默认 /var/www/xhs-ui
#   TARGET_SITE    默认 /etc/nginx/sites-available/xhs-ui
#   AUTH_SNIPPET   默认 /etc/nginx/snippets/xhs-auth.conf
#   XHS_TOKEN      显式指定令牌(默认从本机后端容器取)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"   # scripts/ 目录
REPO_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"   # 仓库根
cd "$REPO_DIR"

TARGET_HOST="${TARGET_HOST:-root@192.168.2.35}"
TARGET_PORT="${TARGET_PORT:-1234}"
TARGET_DIR="${TARGET_DIR:-/var/www/xhs-ui}"
TARGET_SITE="${TARGET_SITE:-/etc/nginx/sites-available/xhs-ui}"
AUTH_SNIPPET="${AUTH_SNIPPET:-/etc/nginx/snippets/xhs-auth.conf}"

HOST_ONLY="${TARGET_HOST##*@}"
TARGET_URL="http://${HOST_ONLY}:${TARGET_PORT}"

NO_BUILD=""
while [[ $# -gt 0 ]]; do
    case "$1" in
        --no-build) NO_BUILD=1; shift ;;
        -h|--help) sed -n '2,25p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
        *) echo "未知参数: $1" >&2; exit 1 ;;
    esac
done

SSH_OPTS=( -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10 )

say() { printf '\n==> %s\n' "$*"; }

# ---------------------------------------------------------------- 0) 前置检查
say "检查后端容器"
if ! docker ps --format '{{.Names}}' | grep -qx "${XHS_API_CONTAINER:-xhs-downloader-api}"; then
    echo "错误: 后端容器未运行,无法取令牌" >&2
    exit 1
fi

# ---------------------------------------------------------------- 1) 令牌
say "取鉴权令牌"
TOKEN="${XHS_TOKEN:-}"
if [[ -z "$TOKEN" ]]; then
    TOKEN="$("${SCRIPT_DIR}/fetch-token.sh")"
fi
if [[ -z "$TOKEN" ]]; then
    echo "错误: 取不到令牌(可用 XHS_TOKEN=<token> 指定)" >&2
    exit 1
fi
echo "  令牌已获取 (${#TOKEN} 字符)"

# ---------------------------------------------------------------- 2) 构建
if [[ -z "$NO_BUILD" ]]; then
    say "构建 dist/"
    npm run build
fi
[[ -d "${REPO_DIR}/dist" ]] || { echo "错误: dist/ 不存在" >&2; exit 1; }

# ---------------------------------------------------------------- 3) 令牌注入(nginx)
say "安装 nginx 令牌注入 (${AUTH_SNIPPET})"
# 令牌走 stdin 管道,不进 argv、不进本机日志
printf 'proxy_set_header Authorization "Bearer %s";\n' "$TOKEN" \
    | ssh "${SSH_OPTS[@]}" "$TARGET_HOST" \
        "umask 077; mkdir -p \"\$(dirname ${AUTH_SNIPPET})\"; cat > ${AUTH_SNIPPET}; chmod 600 ${AUTH_SNIPPET}"
echo "  已写入并置为 600"

say "在站点配置中加入 include 行"
ssh "${SSH_OPTS[@]}" "$TARGET_HOST" bash -s <<EOF
set -euo pipefail
SITE="${TARGET_SITE}"

if grep -q "include[[:space:]]\+${AUTH_SNIPPET}" "\$SITE"; then
    echo "  include 行已存在,跳过"
else
    cp -a "\$SITE" "\$SITE.bak.\$(date +%Y%m%d-%H%M%S)"
    awk -v inc="include ${AUTH_SNIPPET};" '
        BEGIN { inxhs = 0 }
        {
            print
            if (\$0 ~ /location[[:space:]]+\/xhs\//) { inxhs = 1; next }
            if (inxhs && \$0 ~ /proxy_pass/) { print "            " inc; inxhs = 0 }
        }
    ' "\$SITE" > "\$SITE.tmp"
    if cmp -s "\$SITE" "\$SITE.tmp"; then
        echo "  错误: 没找到 location /xhs/ 里的 proxy_pass 行,未改动" >&2
        rm -f "\$SITE.tmp"
        exit 1
    fi
    mv "\$SITE.tmp" "\$SITE"
    echo "  已插入 include 行"
fi
EOF

# ---------------------------------------------------------------- 4) 同步静态文件
say "同步 dist/ → ${TARGET_HOST}:${TARGET_DIR}/"
rsync -avz --delete \
    --chown=root:www-data \
    -e "ssh ${SSH_OPTS[*]}" \
    "${REPO_DIR}/dist/" \
    "${TARGET_HOST}:${TARGET_DIR}/"

# ---------------------------------------------------------------- 5) 重载 + 验证
say "nginx -t 并优雅 reload(不断连接,不重启服务)"
ssh "${SSH_OPTS[@]}" "$TARGET_HOST" bash -s <<'EOF'
set -euo pipefail
nginx -t
if command -v systemctl >/dev/null 2>&1 && systemctl list-unit-files 2>/dev/null | grep -q '^nginx.service'; then
    systemctl reload nginx
    echo "  nginx reloaded (systemctl reload)"
else
    nginx -s reload
    echo "  nginx reloaded (nginx -s reload)"
fi
EOF

say "探活验证"
# ⚠️ nginx 优雅 reload 后,**旧 worker 还会短暂接管新连接**(它们用的是旧配置)。
#    reload 完立刻探活会拿到旧配置的 403 —— 那是假失败。
#    所以这里轮询重试,等新 worker 接管(通常 1~2 秒内)。
HTTP=""
for i in $(seq 1 15); do
    HTTP=$(curl -s -o /dev/null -w '%{http_code}' --noproxy '*' \
        -X POST "${TARGET_URL}/xhs/detail" \
        -H 'Content-Type: application/json' \
        -d '{"url":"","download":false}' || true)
    if [[ "$HTTP" == "200" ]]; then
        break
    fi
    [[ $i -lt 15 ]] && sleep 1
done
if [[ "$HTTP" == "200" ]]; then
    echo "  ${TARGET_URL}/xhs/detail 经 nginx 注入令牌后返回 200 ✅"
else
    echo "  ${TARGET_URL}/xhs/detail 返回 HTTP ${HTTP} ❌" >&2
    echo "  hint: 检查 ${AUTH_SNIPPET} 与站点配置的 include 行" >&2
    echo "  hint: 也可能是 nginx reload 后旧 worker 还没退干净,等几秒再手工试一次" >&2
    exit 1
fi

echo
echo "部署完成: ${TARGET_HOST}:${TARGET_DIR} (前端入口 ${TARGET_URL}/)"
