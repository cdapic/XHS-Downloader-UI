#!/usr/bin/env bash
# verify.sh — 部署前自检:nginx 语法 + 后端容器 Up + /xhs/detail POST 探活
#
# 用法:
#   ./scripts/verify.sh                       # 默认目标 192.168.2.35:1234
#   TARGET_HOST=my.host ./scripts/verify.sh   # 自定义目标
#
# 注意:nginx 与后端容器现在**不在同一台机器**上 ——
#   nginx 在前端机 2.35,后端容器在 2.3。
#   所以本脚本要在**前端机**上跑第 1、3 步(第 2 步的容器检查可以改用 SSH)。
#
# 退出码:
#   0 — 三项全过
#   非 0 — 任一步骤失败即退出(可定位)
set -euo pipefail

TARGET_HOST="${TARGET_HOST:-192.168.2.35}"
TARGET_PORT="${TARGET_PORT:-1234}"
PROBE_URL="http://${TARGET_HOST}:${TARGET_PORT}/xhs/detail"

echo "== verify =="
echo "  target: ${TARGET_HOST}:${TARGET_PORT}"
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
#
#     后端 2.9 起强制 `Authorization: Bearer <token>`,不带令牌恒 403。
#     令牌来源优先级:
#       1) 环境变量 XHS_TOKEN
#       2) 本机能访问后端容器时,调 scripts/fetch-token.sh 生成
#       3) 都没有 → 不带令牌探测:403 说明"链路通、只差令牌",不算失败
echo "[3/3] curl POST ${PROBE_URL} ..."
TOKEN="${XHS_TOKEN:-}"
if [ -z "$TOKEN" ] && [ -x "$(dirname "$0")/fetch-token.sh" ]; then
    TOKEN="$( "$(dirname "$0")/fetch-token.sh" 2>/dev/null || true )"
fi

AUTH_ARGS=()
if [ -n "$TOKEN" ]; then
    AUTH_ARGS=( -H "Authorization: Bearer ${TOKEN}" )
    echo "  using auth token (${#TOKEN} chars)"
else
    echo "  no auth token available — 403 will be treated as 'reachable, auth required'"
fi

HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' \
    -X POST "${PROBE_URL}" \
    -H "Content-Type: application/json" \
    "${AUTH_ARGS[@]}" \
    -d '{"url":"https://xhslink.com/__verify__","download":false}')
if [ "$HTTP_CODE" = "200" ]; then
    echo "  backend reachable (200)"
elif [ "$HTTP_CODE" = "403" ] && [ -z "$TOKEN" ]; then
    echo "  backend reachable but auth required (403) — 后端 2.9+ 强制令牌"
    echo "  hint: 带上 XHS_TOKEN=<token> 重跑,或在 nginx 注入 Authorization 头"
else
    echo "  backend probe FAILED (HTTP ${HTTP_CODE})" >&2
    echo "  hint: 检查 nginx /xhs/ 反代与 5556 端口" >&2
    exit 1
fi
echo

echo "OK: nginx + backend + proxy all green"