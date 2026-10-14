#!/usr/bin/env bash
# verify.sh — 部署前自检:nginx 语法 + 后端容器 Up + /xhs/detail POST 探活
#
# 用法:
#   ./scripts/verify.sh                       # 默认目标 192.168.2.46
#   TARGET_HOST=my.host ./scripts/verify.sh   # 自定义目标
#
# 必须在**部署目标主机**(NAS)上运行,因为它检查的是该机的 nginx + docker。
#
# 退出码:
#   0 — 三项全过
#   非 0 — 任一步骤失败即退出(可定位)
set -euo pipefail

TARGET_HOST="${TARGET_HOST:-192.168.2.46}"
PROBE_URL="http://${TARGET_HOST}/xhs/detail"

echo "== verify =="
echo "  target: ${TARGET_HOST}"
echo

# 1) nginx 语法检查
echo "[1/3] nginx -t ..."
if sudo nginx -t; then
    echo "  nginx config OK"
else
    echo "  nginx config FAILED" >&2
    exit 1
fi
echo

# 2) 后端容器 Up
echo "[2/3] docker ps grep xhs-downloader-api ..."
if docker ps --format '{{.Names}}' | grep -q '^xhs-downloader-api$'; then
    echo "  backend container OK"
else
    echo "  backend container NOT UP" >&2
    echo "  hint: docker compose up -d xhs-api" >&2
    exit 1
fi
echo

# 3) /xhs/detail POST 探活(同源反代架构下 OPTIONS 由 FastAPI 默认 405,
#     CORS 不需要 — 浏览器不会触发 preflight,因此用 POST 验证链路更准)
echo "[3/3] curl POST ${PROBE_URL} ..."
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' \
    -X POST "${PROBE_URL}" \
    -H "Content-Type: application/json" \
    -d '{"url":"https://xhslink.com/__verify__","download":false}')
if [ "$HTTP_CODE" = "200" ]; then
    echo "  backend reachable (200)"
else
    echo "  backend probe FAILED (HTTP ${HTTP_CODE})" >&2
    echo "  hint: 检查 nginx /xhs/ 反代与 5556 端口" >&2
    exit 1
fi
echo

echo "OK: nginx + backend + proxy all green"