# Tech Context

## 部署拓扑

```
[浏览器]
   │
   │  http://<host>:1234  (nginx xhs-ui server)
   ▼
[nginx :1234]               主机进程 (root)
   │
   │  /xhs/*  ──proxy_pass──►  127.0.0.1:5556
   │  /       ──try_files──►  /var/www/xhs-ui/index.html  (SPA fallback)
   │  /assets/*.js|css|... ──静态 7d 缓存
   ▼
[docker xhs-downloader-api]  容器，监听 0.0.0.0:5556
   │  (compose: /home/dingan/dev/XHS-Downloader/docker-compose.yaml)
   │  (镜像: xhs-downloader-xhs-api, FROM ./Dockerfile,command `python main.py api`)
   ▼
[FastAPI + uvicorn 容器内]  /app/source/application/app.py
```

- **nginx 站点配置**：`/etc/nginx/sites-available/xhs-ui`（symlink 到 `sites-enabled/xhs-ui`）
- **静态部署目录**：`/var/www/xhs-ui/`（root 拥有，sync 需 sudo）
- **后端**：Docker 容器 `xhs-downloader-api`，不是主机上的 python 进程
  - CORS 默认全放行（`source/application/app.py:715-727`），可用环境变量 `XHS_CORS_ORIGINS` 收敛白名单
- **同源策略生效**：浏览器只看 nginx，5556 端口对外可达性不再是约束；同源请求不带 CORS 预检

## 关键路径

| 用途 | 路径 |
|---|---|
| 前端入口 | `App.tsx` |
| API 调用 | `services/xhsService.ts` (`parseXHSLink`) |
| 自动嗅探/同源 URL | `constants.ts` 的 `getDefaultApiUrl()` |
| 后端路由 | `source/application/app.py:741-` (`setup_routes`)，`POST /xhs/detail` 在 `:750` |
| CORS 配置 | `source/application/app.py:715-727` |
| 后端 compose | `/home/dingan/dev/XHS-Downloader/docker-compose.yaml` |
| 后端镜像 | `/home/dingan/dev/XHS-Downloader/Dockerfile`（多阶段构建：builder → python:3.12-slim） |

## 构建/部署流程

```bash
# === 前端 ===
cd /home/dingan/dev/XHS-Downloader-UI
npm run build                                              # tsc + vite
sudo rsync -a --delete dist/ /var/www/xhs-ui/              # dist 同步到 nginx 目录

# === 后端（同步上游 + rebuild）===
cd /home/dingan/dev/XHS-Downloader
git fetch origin                                           # 看落后几个
git status                                                # 关键：先看是否有未提交改动
# 如果 source/application/app.py 有未提交改动:
#   git diff HEAD -- source/application/app.py
#   - 如果 diff 仅是 .com→.com|.cn 之类的等价改动 → git checkout -- <file> 丢弃（upstream 已含）
#   - 如果有本地独立改进 → 手动 cherry-pick 到新代码
git pull origin master                                     # merge upstream
docker compose build --no-cache xhs-api                    # 多阶段 rebuild
docker compose up -d xhs-api                               # 重建并起容器
docker ps --filter name=xhs-downloader-api                 # 确认 Up
```

## 已知陷阱

- **`nginx -t` 报 `open() "/run/nginx.pid" failed` 只是权限警告**（pid 文件是 root），**不代表语法错**；reload 看真实请求是否恢复即可
- **前端老 bundle 必须清掉**：rsync 务必带 `--delete`，避免浏览器命中旧 `/var/www/xhs-ui/assets/index-*.js`
- **后端是 docker 容器，不是主机 python**：ps 看 `PID python main.py api` 其实是 docker-proxy；改主机源码 ≠ 改容器内代码
  - **唯一正确做法**：`git pull` + `docker compose build --no-cache` + `up -d`
  - **永远不要用 `docker cp + restart`**（临时方案会被下次 rebuild 覆盖，本地修改 git status 会挡住 pull）
- **后端响应在解析失败时返回 `data: null` 或 `data: {}`（不是 HTTP 错误码）**；前端 App.tsx 已改为渲染 `result.message` 而不是干瘪的"解析失败"
- **短链域名**：`source/application/app.py:124` 的 SHORT 正则同时匹配 `xhslink.com` 和 `xhslink.cn`（upstream 已支持，自己别再改）

## 可用 Proxy（按需）

- **局域网 HTTP proxy**：`http://192.168.2.46:7890`（用户提供的应急通道）
- **怎么用**：在 API 请求体里加 `"proxy": "http://192.168.2.46:7890"`，per-request 生效
- **类型**：HTTP proxy（不是 SOCKS5），与 httpx 兼容
- **何时用**：被 XHS 限流、拿不到 explore 类直链数据、跨地区访问时；普通短链 `.com/.cn` 不需要
- **当前默认**：**不启用**（用户选择"按需"，2026-09-23）