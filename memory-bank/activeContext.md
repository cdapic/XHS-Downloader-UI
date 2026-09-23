# Active Context

> 上一轮结束时的状态 — 下次开会话先看这里。

## 当前焦点

✅ 全部闭环（2026-09-23）：
- nginx `/xhs/` 反代 + 前端同源 + dist 部署
- 后端已 `git pull` 对齐 upstream (含 .cn fix + HTTP 库更新)，重建镜像 `xhs-downloader-xhs-api` 容器 `Up`
- 前端错误卡片展示后端 `message`，不再黑盒显示"解析失败"
- Proxy `http://192.168.2.46:7890` 按需可用（用户选择不默认化）

🚫 无 Pending。

## 近期决策（避免重新讨论）

1. **同源 > 跨域**：浏览器永远只看 nginx，5556 端口对外可达性不再是约束 — 所有 auto-detect 逻辑统一走 `window.location.origin`
2. **后端改路由 > 前端改 URL**：碰到 CORS/路径问题，优先改 nginx / 后端，少改前端 baseUrl
3. **不做动前端架构**：项目体量很小，保持单文件 App + services + components，不引入 Redux/RTK Query
4. **后端是 docker 容器**：`git pull` + `compose build` 是唯一改动路径；不要 cp hack
5. **后端代码优先跟 upstream**：本地不要 fork 改后端，先 pull 试；如果 upstream 已经修了就别自己写
6. **Proxy 按需**：API 请求体里加 `"proxy": "http://192.168.2.46:7890"`，不开全局默认

## 下次开会话建议

1. 读 `tasks.md` 看是否有 Pending（当前没有）
2. 读本文件确认"当前焦点"是否还成立
3. 改 nginx 之前先看 `techContext.md` 的部署拓扑，避免覆盖反代段
4. 改后端前**先 `git fetch origin` + `git status`** 看本地是否落后、有无未提交改动；和 upstream diff 比对再决定 merge / cherry-pick / fork
5. 拿不到数据时，先看后端日志 `docker logs xhs-downloader-api --tail 50`，再用 proxy 试一次