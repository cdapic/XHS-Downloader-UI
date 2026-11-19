#!/usr/bin/env bash
# fetch-token.sh — 从后端容器取当前鉴权令牌,打印到 stdout(不带换行)
#
# 后端 2.9 起 `POST /xhs/detail` 强制校验 `Authorization: Bearer <token>`,
# 缺失/无效一律 403。令牌由后端用本地 secret(HMAC-SHA256)签发,
# secret 存在后端 Volume 里,容器重建不失效,默认永不过期。
#
# 用法:
#   ./scripts/fetch-token.sh
#   TOKEN="$(./scripts/fetch-token.sh)"
#
# 环境变量:
#   XHS_API_CONTAINER  容器名,默认 xhs-downloader-api
set -euo pipefail

CONTAINER="${XHS_API_CONTAINER:-xhs-downloader-api}"

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
    echo "错误: 容器 ${CONTAINER} 未运行" >&2
    exit 1
fi

# 后端输出形如「鉴权令牌: <token>」;取第一个冒号之后的部分并压掉换行。
# 令牌本身是 base64url(payload).base64url(签名),不含冒号。
docker exec "$CONTAINER" python main.py TOKEN \
    | tr -d '\r' \
    | sed 's/^[^:]*:[[:space:]]*//' \
    | tr -d '\n'
