# Tasks

## Pending（用户明确说"后续考虑"）

> 当前**没有 Pending**。所有项都已闭环或被用户主动选择保持现状（proxy 按需、不重启 nginx 等）。

---

## Done（倒序，最多 20 条；旧条目归档到 `archive/`）

### 2026-09-23 — 与官方上游对齐 (git pull + rebuild)
- **背景**：本地后端落后官方 master 79 个 commit（2 个月）；用户的"前面的问题"根因之一就是 `.cn` 修复没跟上游
- **重要节点**：官方 `d54b08f (2026-07-23) fix(app): 修复部分分享链接提取失败的问题` 已经加了 `xhslink\.(?:com|cn)/`；跟我之前的 cp hack byte-for-byte 一致
- **操作**：
  - `cd /home/dingan/dev/XHS-Downloader && git pull origin master` → 合并 79 commit，进度推到 `47840a1 feat(app): 发布 2.8 版本`
  - 丢弃本地对 `source/application/app.py` 的手改（git checkout -- file；因与 upstream 一致）
  - `docker compose build --no-cache xhs-api && docker compose up -d xhs-api`
  - 容器 `xhs-downloader-api` 重建后正常 Up
- **教训**：(a) `git pull` 之前先看 `git diff HEAD -- <file>` 判断本地手改和 upstream 是否一致 — 一致就可以放心丢弃；(b) docker 容器场景下**永远不要 cp hack**，pull+rebuild 是 1 分钟的事

### 2026-09-23 — 修后端 SHORT 正则支持 xhslink.cn + 前端展示后端 message
- **问题**：用户复制分享的是 `xhslink.cn/o/...`（XHS 移动端新格式），后端正则只识别 `.com`，extract_links 返回空 → 前端"解析失败"；同时前端不展示后端的真实 message
- **根因**：
  1. `source/application/app.py:112` 的 `SHORT = compile(r"(?:https?://)?xhslink\.com/...")` 没覆盖 `xhslink.cn`
  2. `App.tsx:107` 的 `if (data && data.data)` 把 `data: null/{}` 一律当 error 红字
- **改动**：
  - 后端：`SHORT = compile(r"(?:https?://)?xhslink\.(?:com|cn)/...")`；用 `docker cp` 同步进 `xhs-downloader-api` 容器并 `docker restart`（**已在上一次合并 upstream 后废弃**）
  - 前端 `App.tsx`：分离 `hasData` 判断（`data.data` 是非空对象才算 success；否则 error 但保留 `setResult(data)`），并在错误卡片里渲染 `result.message`
- **部署**：`npm run build` 出 `dist/assets/index-t_IDNfRX.js`；`sudo rsync -a --delete dist/ /var/www/xhs-ui/`
- **验证**：
  - 干净 `xhslink.cn/o/ZF48mtu9v2` → 18 张图完整数据 ✅
  - 用户原样（分享全文含 `.cn`）走 nginx 1234 → 18 张图完整数据 ✅
  - `xhslink.com/...` 回归 → 18 张图完整数据 ✅（未破坏旧域）

### 2026-09-23 — nginx 加 /xhs/ 反代 + 前端切同源
- **问题**：项目挂 nginx (1234) 后前端"解析失败"
- **根因**：(1) `xhs-ui` 没有反代 `/xhs` 到 5556，前端 fetch 经 nginx 被静态模块 405；(2) `App.tsx:58` 把 apiUrl 硬写成 `${hostname}:5556`，5556 对外不通（curl 跨接口都超时）；(3) 后端 CORS 虽已放行但被前两个问题绕过
- **改动**：
  - `/etc/nginx/sites-available/xhs-ui`：新增 `location /xhs/ { proxy_pass http://127.0.0.1:5556/xhs/; ... }`
  - `constants.ts`：删 `DEFAULT_API_URL`，加 `getDefaultApiUrl()` 返回 `${window.location.origin}/xhs/detail`
  - `App.tsx`：useState/useEffect 改用 `getDefaultApiUrl()`；**移除** localhost 特殊分支，一律走同源
  - `components/SettingsModal.tsx`：placeholder / 帮助文本 / Reset 同步改用 `getDefaultApiUrl()`
- **部署**：`npm run build` 出 `dist/assets/index-BznWgL3C.js`；`sudo rsync -a --delete dist/ /var/www/xhs-ui/`
- **验证**：`POST /xhs/detail` 经 nginx 从 405 翻到 200；`OPTIONS` 预检 200 + `ACAO:*`；SPA fallback 200