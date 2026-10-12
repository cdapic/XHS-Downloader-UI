# Tech Context

## 部署拓扑（分家版，2026-10-12）

```
[浏览器]
   │
   │  http://192.168.2.46:1234
   ▼
[nginx :1234 @ hi3798mv100]   192.168.2.46  (LAN 上的独立前端机, ARM 嵌入式)
   │  /etc/nginx/sites-available/xhs-ui
   │  /xhs/*  ──proxy_pass──►  http://xhs_backend/xhs/
   │  /       ──try_files──►  /var/www/xhs-ui/index.html  (SPA fallback)
   │  /assets/*.js|css|... ──静态 7d 缓存
   ▼
[upstream xhs_backend]
   ├─ 192.168.2.3:5556         LAN 主（本机物理网卡 eno1）
   └─ 10.2.3.10:5556  backup   openp2p 虚拟局域网备援（本机 openp2p IP）

[本机 192.168.2.3]  (主机名待补)
   ├─ eno1       192.168.2.3       物理 LAN, nginx 2.46 反代目标
   ├─ openp2p    10.2.3.10         虚拟组网, nginx upstream backup
   ├─ tailscale  100.107.84.111    虚拟组网
   └─ docker xhs-downloader-api   容器, 监听 0.0.0.0:5556
      compose:  /home/dingan/dev/XHS-Downloader/docker-compose.yaml
      镜像:     xhs-downloader-xhs-api (FROM ./Dockerfile, command `python main.py api`)
   ▼
[FastAPI + uvicorn 容器内]  /app/source/application/app.py
```

- **前端机 2.46** 是独立主机 (`hi3798mv100`, ARM)，不是本机容器；改 nginx 需 ssh 2.46
- **后端容器在本机**：`xhs-downloader-api`，compose 在 `/home/dingan/dev/XHS-Downloader/`
- **同源策略生效**：浏览器只看 nginx（192.168.2.46:1234），fetch 走 `${window.location.origin}/xhs/detail`，**不触发 CORS 预检**；2.46 后端/网络可达性才是约束
- **CORS 兜底**：后端仍 `Access-Control-Allow-Origin: *` 全放行，仅在用户改 SettingsModal API URL 跨域或 LAN 客户端直连 5556 时起作用

## 关键路径

| 用途 | 路径 / 位置 |
|---|---|
| 前端入口 | `App.tsx` |
| API 调用 | `services/xhsService.ts` (`parseXHSLink`) |
| 自动嗅探/同源 URL | `constants.ts` 的 `getDefaultApiUrl()` |
| 后端路由 | `source/application/app.py:741-` (`setup_routes`)，`POST /xhs/detail` 在 `:750` |
| CORS 配置 | `source/application/app.py:715-727` |
| 后端 compose | `/home/dingan/dev/XHS-Downloader/docker-compose.yaml` |
| 后端镜像 | `/home/dingan/dev/XHS-Downloader/Dockerfile`（多阶段构建：builder → python:3.12-slim） |
| nginx 站点配置 | `@2.46` `/etc/nginx/sites-available/xhs-ui`（symlink 到 sites-enabled） |
| 前端部署目录 | `@2.46` `/var/www/xhs-ui/`（root:www-data owned, sync 需 sudo via ssh） |
| 前端 sync 脚本 | `sync.sh`（gitignored, 默认 `root@192.168.2.46:22` → `/var/www/xhs-ui/`） |

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
- **nginx 在 192.168.2.46（`hi3798mv100`），不在本机**：改配置必须 `ssh root@192.168.2.46`，**不是**本机 nginx
- **nginx upstream backup 是本机 openp2p IP** `10.2.3.10:5556`：本机若改后端端口绑定（如 `5556:5556` → `192.168.2.3:5556:5556`），**10.2.3.10 不再监听 → nginx backup 失效**；若需要保留 backup，端口绑定必须同时包含 `192.168.2.3` 和 `10.2.3.10` 两个接口
- **前端老 bundle 必须清掉**：rsync 务必带 `--delete`，避免浏览器命中旧 `/var/www/xhs-ui/assets/index-*.js`；sync.sh 已带 `--delete`
- **`sync.sh` 默认 `root@192.168.2.46:22`**：依赖 2.46 sshd 允许 root + 22 端口；哪天收紧就 sync 失败。建议改用 `~/.ssh/config` 别名 + 强制命令的 key（防止 root 被滥用）
- **后端是 docker 容器，不是主机 python**：ps 看 `PID python main.py api` 其实是 docker-proxy；改主机源码 ≠ 改容器内代码
  - **唯一正确做法**：`git pull` + `docker compose build --no-cache` + `up -d`
  - **永远不要用 `docker cp + restart`**（临时方案会被下次 rebuild 覆盖，本地修改 git status 会挡住 pull）
- **后端响应在解析失败时返回 `data: null` 或 `data: {}`（不是 HTTP 错误码）**；前端 App.tsx 已改为渲染 `result.message` 而不是干瘪的"解析失败"
- **短链域名**：`source/application/app.py:124` 的 SHORT 正则同时匹配 `xhslink.com` 和 `xhslink.cn`（upstream 已支持，自己别再改）
- **2.46 是嵌入式 ARM**：负载/重启慢（本次重启后 nginx 起来前 `load average` 飙到 5.35），不要假设它瞬间恢复

## 可用 Proxy（按需）

- **局域网 HTTP proxy**：`http://192.168.2.46:7890`（用户提供的应急通道）
- **怎么用**：在 API 请求体里加 `"proxy": "http://192.168.2.46:7890"`，per-request 生效
- **类型**：HTTP proxy（不是 SOCKS5），与 httpx 兼容
- **何时用**：被 XHS 限流、拿不到 explore 类直链数据、跨地区访问时；普通短链 `.com/.cn` 不需要
- **当前默认**：**不启用**（用户选择"按需"，2026-09-23）