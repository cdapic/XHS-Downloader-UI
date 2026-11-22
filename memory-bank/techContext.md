# Tech Context

## 部署拓扑（分家版，2026-10-12）

```
[浏览器]
   │
   │  http://192.168.2.35:1234
   ▼
[nginx :1234 @ hi3798mv100]   192.168.2.35  (LAN 上的独立前端机, ARM 嵌入式)
   │  /etc/nginx/sites-available/xhs-ui
   │  /xhs/*  ──proxy_pass──►  http://xhs_backend/xhs/
   │  /       ──try_files──►  /var/www/xhs-ui/index.html  (SPA fallback)
   │  /assets/*.js|css|... ──静态 7d 缓存
   ▼
[upstream xhs_backend]
   ├─ 192.168.2.3:5556         LAN 主（本机物理网卡 eno1）
   └─ 10.2.3.10:5556  backup   openp2p 虚拟局域网备援（本机 openp2p IP）

[本机 192.168.2.3]  (主机名待补)
   ├─ eno1       192.168.2.3       物理 LAN, nginx 2.35 反代目标
   ├─ openp2p    10.2.3.10         虚拟组网, nginx upstream backup
   ├─ tailscale  100.107.84.111    虚拟组网
   └─ docker xhs-downloader-api   容器, 监听 0.0.0.0:5556
      compose:  /home/dingan/dev/XHS-Downloader/docker-compose.yaml
      镜像:     xhs-downloader-xhs-api (FROM ./Dockerfile, command `python main.py api`)
   ▼
[FastAPI + uvicorn 容器内]  /app/source/application/app.py
```

- **前端机 2.35** 是独立主机 (`hi3798mv100`, ARM)，不是本机容器；改 nginx 需 ssh 2.35
- **后端容器在本机**：`xhs-downloader-api`，compose 在 `/home/dingan/dev/XHS-Downloader/`
- **同源策略生效**：浏览器只看 nginx（192.168.2.35:1234），fetch 走 `${window.location.origin}/xhs/detail`，**不触发 CORS 预检**；2.35 后端/网络可达性才是约束
- **CORS 兜底**：后端 2.9 起**已无 CORS 中间件**（`source/application/app.py` 搜不到 `CORSMiddleware`），
  跨域直连 5556 不再可行 —— **必须走 nginx 同源反代**

## 鉴权层（后端 2.9+，2026-11-19 落地，**当前部署 = nginx 注入**，2026-11-20 已上线验证）

```
[浏览器] ── POST /xhs/detail（不带 Authorization）
   │
   ▼
[nginx @2.35 :1234]
   │  location /xhs/ {
   │      include /etc/nginx/snippets/xhs-auth.conf;   ← proxy_set_header Authorization "Bearer …"
   │      proxy_pass http://192.168.2.3:5556/xhs/;
   │  }
   ▼
[后端 2.9 @2.3 :5556]  verify_auth_token() → 有效才放行,否则 403
```

- 后端 `POST /xhs/detail` **强制**校验 `Authorization: Bearer <token>`，缺失/无效 → **403**
- 令牌 = `base64url(payload).base64url(HMAC-SHA256 签名)`，secret 存在后端 `Volume/auth_secret.key`
  （宿主机 `/home/dingan/Downloads/xhs_download/auth_secret.key`），容器重建不失效，默认永不过期
- 取令牌：`./scripts/fetch-token.sh` 或 `docker exec xhs-downloader-api python main.py TOKEN`
- **当前生效方式 = B nginx 注入**（用户 2026-11-19 拍板）：令牌只存在 2.35 的
  `/etc/nginx/snippets/xhs-auth.conf`（600），**不进浏览器**；部署时 `WRITE_TOKEN=0`，
  前端不下发 `dist/xhs-token.txt`
- 前端保留的另一条路径（`services/auth.ts`）：
  - **A 令牌文件**：`dist/xhs-token.txt`，前端同源拉取后缓存，403 时清缓存重取
  - 两种并存以 nginx 为准（`proxy_set_header` 覆盖客户端头）→ 换配法不用改前端代码
- 前端**格式防呆**：令牌必须匹配 `^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$`，
  否则当"没有令牌"（防 nginx SPA fallback 把 index.html 当令牌发出去）

## 关键路径

| 用途 | 路径 / 位置 |
|---|---|
| 前端入口 | `App.tsx` |
| API 调用 | `services/xhsService.ts` (`parseXHSLink`) |
| 鉴权令牌获取 | `services/auth.ts` (`getAuthToken` / `buildAuthHeaders` / `invalidateAuthToken`) |
| 取令牌脚本 | `scripts/fetch-token.sh`（从后端容器取，打印到 stdout） |
| 自动嗅探/同源 URL | `constants.ts` 的 `getDefaultApiUrl()` / `getAuthTokenUrl()` |
| 健康探针 | `services/health.ts` (`probeBackend` / `probeBackendDetailed`,`HealthStatus` 多一个 `'auth'`) |
| 后端路由 | `source/application/app.py:741-` (`setup_routes`)，`POST /xhs/detail` 在 `:750` |
| 后端鉴权 | `source/module/auth.py` (`generate_auth_token` / `verify_auth_token`)，secret 在 `Volume/auth_secret.key` |
| 后端 compose | `/home/dingan/dev/XHS-Downloader/docker-compose.yaml` |
| 后端镜像 | `/home/dingan/dev/XHS-Downloader/Dockerfile`（多阶段构建：builder → python:3.12-slim） |
| nginx 站点配置 | `@2.35` `/etc/nginx/sites-available/xhs-ui`（symlink 到 sites-enabled） |
| nginx 令牌注入 | `@2.35` `/etc/nginx/snippets/xhs-auth.conf`（600，存 `proxy_set_header Authorization "Bearer …";`） |
| 前端部署目录 | `@2.35` `/var/www/xhs-ui/`（root:www-data owned, sync 需 sudo via ssh） |
| 一键部署脚本 | `scripts/deploy.sh`（构建→装令牌→改站点→rsync→nginx -t+reload→探活，幂等） |
| 前端 sync 脚本 | `sync.sh`（gitignored, 默认 `root@192.168.2.35:22` → `/var/www/xhs-ui/`）；`WRITE_TOKEN=0` 默认 |

## 构建/部署流程

```bash
# === 前端（推荐：一键，幂等）===
cd /home/dingan/dev/XHS-Downloader-UI
./scripts/deploy.sh                     # 目标默认 root@192.168.2.35:1234
./scripts/deploy.sh --no-build          # 跳过构建

# === 前端（只同步文件，不碰 nginx）===
npm run build
./sync.sh --no-build                    # WRITE_TOKEN 默认 0（nginx 注入模式，不下发令牌文件）

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
- **nginx 在 192.168.2.35（`hi3798mv100`），不在本机**：改配置必须 `ssh root@192.168.2.35`，**不是**本机 nginx
- **nginx upstream backup 是本机 openp2p IP** `10.2.3.10:5556`：本机若改后端端口绑定（如 `5556:5556` → `192.168.2.3:5556:5556`），**10.2.3.10 不再监听 → nginx backup 失效**；若需要保留 backup，端口绑定必须同时包含 `192.168.2.3` 和 `10.2.3.10` 两个接口
- **前端老 bundle 必须清掉**：rsync 务必带 `--delete`，避免浏览器命中旧 `/var/www/xhs-ui/assets/index-*.js`；sync.sh 已带 `--delete`
- **`sync.sh` 默认 `root@192.168.2.35:22`**：依赖 2.35 sshd 允许 root + 22 端口；哪天收紧就 sync 失败。建议改用 `~/.ssh/config` 别名 + 强制命令的 key（防止 root 被滥用）
- **后端是 docker 容器，不是主机 python**：ps 看 `PID python main.py api` 其实是 docker-proxy；改主机源码 ≠ 改容器内代码
  - **唯一正确做法**：`git pull` + `docker compose build --no-cache` + `up -d`
  - **永远不要用 `docker cp + restart`**（临时方案会被下次 rebuild 覆盖，本地修改 git status 会挡住 pull）
- **后端响应在解析失败时返回 `data: null` 或 `data: {}`（不是 HTTP 错误码）**；前端 App.tsx 已改为渲染 `result.message` 而不是干瘪的"解析失败"
- **短链域名**：`source/application/app.py:124` 的 SHORT 正则同时匹配 `xhslink.com` 和 `xhslink.cn`（upstream 已支持，自己别再改）
- **2.35 是嵌入式 ARM**：负载/重启慢（本次重启后 nginx 起来前 `load average` 飙到 5.35），不要假设它瞬间恢复
- **⚠️ 前端机换过 IP：老地址 192.168.2.46 已整机不通**（2026-11-19 实测 ping/22/1234/7890 全无响应），
  同一台 ARM 机（`hi3798mv100`）现在是 **192.168.2.35**（nginx :1234 + Clash :7890 都在上面）
  → 脚本/README/记忆里的目标地址一律用 .35；老 .46 相关配置属于历史遗留
- **2.35 的 :80 是另一个站点**（"海纳思系统"登录页，`default` 站点），XHS UI 在 **:1234**；
  打错端口会得到 404 而不是 XHS 页面
- **⚠️ 本机 nginx 是分家前的残留**：`/etc/nginx/sites-available/xhs-ui` 还在（proxy 到 `127.0.0.1:5556`），
  `/var/www/xhs-ui/` 也还在（但内容是 2026-09-23 的老构建），systemd `nginx.service` 是 disabled+inactive
  → 真要临时在本机起前端，是一条独立于 2.35 的路（需先跟用户确认，不要自己改架构）
- **令牌只放 2.35 一处**：`/etc/nginx/snippets/xhs-auth.conf`（600）。
  改令牌只改这一个文件（`./scripts/fetch-token.sh` 取新的 → 重跑 `deploy.sh`）；
  站点配置里那行 `include` 不要手改，删了就会退回 403
- **⚠️ nginx 优雅 reload 后，旧 worker 会短暂接管新连接**（2026-11-19 实测踩到）：
  reload 完**立刻**探活 `/xhs/detail` 会拿到 **403**（旧配置没有 Authorization 头），
  1~2 秒后新 worker 接管就变成 200 —— 典型的**假失败**。
  `scripts/deploy.sh` 的探活已改成**轮询重试(最多 15 秒)**；
  手工验证时同理：reload 后先等两秒再探。
  排查口诀：配置对、令牌对（直接打后端 200）、reload 也发生了，但经 nginx 仍 403
  → 先怀疑"旧 worker 还在"，再怀疑别的
- **后端 2.9 鉴权是破坏性变更**：升级后 `POST /xhs/detail` 不带 Bearer 令牌一律 403，
  前端必须同步适配（`services/auth.ts`），否则"后端升级完前端全挂"
- **后端 2.9 已移除 CORS 中间件**：`Access-Control-Allow-Origin: *` 没有了，
  任何跨源直连 5556 的浏览器调用都会被拦 —— 同源反代从"性能优化"变成"唯一可行路径"

## 可用 Proxy（按需）

- **局域网 HTTP proxy**：`http://192.168.2.35:7890`（用户提供的应急通道）
- **怎么用**：在 API 请求体里加 `"proxy": "http://192.168.2.35:7890"`，per-request 生效
- **类型**：HTTP proxy（不是 SOCKS5），与 httpx 兼容
- **何时用**：被 XHS 限流、拿不到 explore 类直链数据、跨地区访问时；普通短链 `.com/.cn` 不需要
- **当前默认**：**不启用**（用户选择"按需"，2026-09-23）