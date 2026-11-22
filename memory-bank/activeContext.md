# Active Context

> 上一轮结束时的状态 — 下次开会话先看这里。

## 当前焦点

✅ **全部闭环（2026-11-20 部署完成，2026-11-22 收尾）** —— 后端 2.9 升级 + 前端鉴权适配 + 部署到新前端机

- **后端**：2.9.beta（`dfad51b`），容器 `xhs-downloader-api` 在本机 :5556 运行中
  - 破坏性变更：`POST /xhs/detail` 强制 `Authorization: Bearer <token>`，不带 → 403
- **前端已适配**（本仓库）：`services/auth.ts` + `xhsService`/`health` 带鉴权头 + 403 专门错误卡
  - 令牌两条路：nginx 注入（**当前部署用这个**）或同源 `xhs-token.txt`（前端读文件，兜底）
  - 三种部署方式都在真实浏览器（headless Chrome + CDP）验证过
- **前端机换 IP**：老 192.168.2.46 整机不通（ping/22/1234/7890 全无响应），
  新 **192.168.2.35**（同一台 ARM 机 `hi3798mv100`，nginx :1234 + Clash :7890 都在上面）
  → 脚本/README/记忆里的 2.46 已批量改成 2.35
- **鉴权配法 = nginx 注入**：令牌只在 2.35 的 `/etc/nginx/snippets/xhs-auth.conf`（600），
  站点配置 `location /xhs/` 里 `include` 它；前端**不**下发 `dist/xhs-token.txt`
  （`sync.sh` 默认 `WRITE_TOKEN=0`）
- **部署已验证**：`http://192.168.2.35:1234/` 正常；`POST /xhs/detail`（客户端不带令牌）→ 200；
  真实链接 `https://xhslink.cn/o/ZF48mtu9v2` → 标题/作者/18 张图全拿到；真实浏览器 6/6
- **部署入口**：`./scripts/deploy.sh`（幂等：构建 → 装令牌 include → 改站点配置 → rsync →
  `nginx -t` + 优雅 reload → 探活）；`scripts/fetch-token.sh` 取令牌；`scripts/verify.sh` 自检
  - ⚠️ 探活**必须轮询重试**：reload 后旧 worker 还会短暂接管，给 403 是假失败（见 techContext 陷阱）

🚫 无强制 Pending；v1.2 批量采集 / v2.0 素材库 / v2.x 创作辅助 三条线仍在 `tasks.md` 待启动。

## 历史闭环
**2026-11-20（后端 2.9 升级 + 鉴权适配 + 部署）**
- 后端升 2.9.beta 并重建容器；前端适配强制令牌；部署到 2.35 并端到端验证（详见上方「当前焦点」）

**2026-09-23**
- nginx `/xhs/` 反代 + 前端同源 + dist 部署
- 后端已 `git pull` 对齐 upstream (含 .cn fix + HTTP 库更新)，重建镜像 `xhs-downloader-xhs-api` 容器 `Up`
- 前端错误卡片展示后端 `message`，不再黑盒显示"解析失败"
- Proxy `http://192.168.2.35:7890` 按需可用（用户选择不默认化）

## 近期决策（避免重新讨论）

1. **同源 > 跨域**：浏览器永远只看 nginx，5556 端口对外可达性不再是约束 — 所有 auto-detect 逻辑统一走 `window.location.origin`
2. **后端改路由 > 前端改 URL**：碰到 CORS/路径问题，优先改 nginx / 后端，少改前端 baseUrl
3. **不做动前端架构**：项目体量很小，保持单文件 App + services + components，不引入 Redux/RTK Query
4. **后端是 docker 容器**：`git pull` + `compose build` 是唯一改动路径；不要 cp hack
5. **后端代码优先跟 upstream**：本地不要 fork 改后端，先 pull 试；如果 upstream 已经修了就别自己写
6. **Proxy 按需**：API 请求体里加 `"proxy": "http://192.168.2.35:7890"`，不开全局默认
7. **后端端口保持 0.0.0.0:5556 不收敛**（2026-10-12）：虽然 `5556:5556` 暴露给 LAN + openp2p + tailscale 所有接口，但用户明确选择保持现状 —— 不动 `docker-compose.yaml` 的 ports；nginx upstream backup (`10.2.3.10:5556`) 和 openp2p/tailscale 客户端直连 5556 都要继续可用。**不要在没确认前再提"端口收敛"建议**
8. **鉴权令牌走 nginx 注入**（2026-11-19 用户拍板）：令牌只留在 2.35 的
   `/etc/nginx/snippets/xhs-auth.conf`（600），由 `proxy_set_header Authorization` 注入，
   **不进浏览器**。前端仍保留"读同源 `xhs-token.txt`"的能力作为兜底（两种配法并存时以 nginx 为准），
   但部署时 `WRITE_TOKEN=0`，不同步令牌文件。
9. **前端机 IP 是 192.168.2.35**（2026-11-19 更正）：老地址 192.168.2.46 已不可达，
   同一台 ARM 机换到了 .35。脚本默认目标、README、部署命令一律用 .35。

## 下次开会话建议

1. 读 `tasks.md` 看是否有 Pending（当前：v1.2 批量采集 / v2.0 素材库 / v2.x 创作辅助，待用户启动）
2. 读本文件确认"当前焦点"是否还成立
3. **前端部署用 `scripts/deploy.sh`**（幂等：装令牌 → 改站点配置 → rsync → nginx -t + 优雅 reload → 探活）；
   只想同步文件用 `sync.sh`；改 nginx 前先读 `techContext.md` 的鉴权层小节
4. 改后端前**先 `git fetch origin` + `git status`** 看本地是否落后、有无未提交改动；和 upstream diff 比对再决定 merge / cherry-pick / fork
5. 后端升级后先查 `source/application/app.py` 的路由签名有没有破坏性变更（2.9 就是这么加的鉴权），
   再决定前端要不要跟着改 —— 靠 `grep -rn "Authorization\|verify_auth_token"` 提前发现
6. 拿不到数据时，先看后端日志 `docker logs xhs-downloader-api --tail 50`，再用 proxy 试一次
7. 改了 nginx 之后**先等 1~2 秒再探活**（reload 后旧 worker 还会短暂接管，403 是假失败）