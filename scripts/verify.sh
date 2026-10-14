#!/usr/bin/env bash
# verify.sh — 部署前自检:nginx 语法 + 后端容器 Up + /xhs/detail OPTIONS 200
#
# 用法:
#   ./scripts/verify.sh                       # 默认目标 192.168.2.46
#   TARGET_HOST=my.host ./scripts/verify.sh   # 自定义目标
#
# 前置依赖:nginx + docker + curl 在 PATH;sudo 可用
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

# 3) /xhs/detail OPTIONS 预检
echo "[3/3] curl OPTIONS ${PROBE_URL} ..."
if curl -fsS -X OPTIONS "${PROBE_URL}" \
    -H "Origin: http://${TARGET_HOST}" \
    -H "Access-Control-Request-Method: POST" \
    -o /dev/null; then
    echo "  preflight OK"
else
    echo "  preflight FAILED" >&2
    exit 1
fi
echo

echo "OK: nginx + backend + preflight all green"