# Tasks

## Pending（用户明确说"后续考虑"）

### [待启动] UI/UX 增量（2026-10-12 登记）
- **候选改动**（未定优先级，用户启动时再排）：
  - 历史记录：localStorage 存最近 N 条短链，列表展示 + 一键复用  ✅ 已落地 (8749654)，从待办移除
  - 批量粘贴：textarea 支持多行 URL，一次提交多条（复用 `parseXHSLink`）  ← v1.2 主线
  - 下载进度条：jszip 打包 / 单文件下载时显示进度  ✅ 已落地 (a180c36)
  - 缩略图网格预览：拿到数据后先渲染图片网格，用户点下载才触发打包  ✅ 已落地 (a180c36)
- **触发时机**：用户明确开始推进时
- **不要顺手做的**：baseUrl / CORS / 同源逻辑（已闭环，2026-09-23）

### [待启动] 健壮性（2026-10-12 登记）
- **候选改动**（未定优先级）：
  - 输入校验：只接受 `xhslink.com/cn` + `xiaohongshu.com` 域名，超长截断 / 非法字符提示  ← v1.1 FR-04 在做
  - 超时 / abort：fetch 加 `AbortController` + "取消" 按钮（卡死时可点）  ✅ 已落地 (12c5f65, FR-02)
  - 网络断线 toast：失败卡片区分 网络错 / 后端错 / 解析错（不要一律"解析失败"）  ✅ 已落地 (7ecc937, FR-03)
- **触发时机**：用户明确开始推进时

### [待启动] 代码质量（2026-10-12 登记）
- **候选改动**（未定优先级）：
  - `vitest` 单测：`xhsService`（解析、错误透传、success/error 分支）+ 关键组件（输入区 / 结果区）  ← v1.1 NFR 在做
  - 拆 `App.tsx`（已 13KB 偏大）：按功能切 输入区 / 结果区 / 设置 / 错误卡片  ← v1.1 FR-06 在做
- **触发时机**：用户明确开始推进时
- **约束**：不引入 Redux / RTK Query（沿用 activeContext 第 3 条决策）

### [待启动] 部署工具（2026-10-12 登记）
- **候选改动**（未定优先级）：
  - `verify` 脚本：检查 nginx 站点配置 syntax + `xhs-downloader-api` 容器 Up + 探测 `/xhs/detail` OPTIONS 预检 200  ← v1.1 NFR 在做
  - `sync.sh`（已 gitignored）：`npm run build` + `sudo rsync -a --delete`，支持 `--dry-run` / `--no-build`；扩展（nginx reload / 后端 `git pull` 提示）延后到 v1.2
- **触发时机**：用户明确开始推进时

---

## Done（倒序，最多 20 条；旧条目归档到 `archive/`）

### 2026-10-12 — 粘贴按钮 + 移动端适配（前端落地）
- **粘贴按钮**：
  - `App.tsx` 输入区操作行新增"粘贴"按钮（解析按钮左侧，`justify-between` 布局），点击调 `navigator.clipboard.readText()`
  - 成功 → 替换 textarea 内容（trim）；失败 / API 不存在 / 非 HTTPS → 输入区下方显示琥珀色提示条，3 秒自动消失（`useEffect` + `setTimeout`）
  - `status === "loading"` 时禁用；图标用 lucide-react `ClipboardPaste`；次要按钮样式 `border border-gray-200 text-gray-600 hover:bg-gray-50`
  - i18n 新增 `pasteBtn`（"粘贴" / "Paste"）、`pasteFailed`（"无法读取剪贴板，请手动粘贴" / "Cannot read clipboard, please paste manually"）双语 key
- **移动端适配（前端可落地部分）**：
  - textarea 加 `autoComplete/autoCorrect/autoCapitalize="off"` + `spellCheck={false}` + `enterKeyHint="go"`（移动端键盘回车键显示"前往"）
  - 触摸目标 ≥ 44px：Header 语言切换（`min-w-[44px] min-h-[44px]`）、粘贴/解析按钮（`min-h-[44px]`）、ResultCard 复制文案按钮（`min-h-[44px] sm:min-h-0` 桌面端还原）、HistoryPanel 展开头 / 清空 / 列表项
  - MediaGrid 浮动按钮（打开原图、下载原图）：移动端常驻 `opacity-100`，桌面端恢复 hover `sm:opacity-0 sm:group-hover:opacity-100`；补 `min-h-[44px] min-w-[44px]`
  - 响应式：MediaGrid gap `gap-4 sm:gap-6`；ResultCard stats `grid-cols-2 sm:grid-cols-4`（手机 2 列，sm 起 4 列）
  - viewport meta 已存在（index.html L5），本次未改；index.html Play CDN（IS-01 P0）不在本次范围
- **后端遗留项（不在本仓库，另记）**：
  - CORS 白名单收敛（当前 `ACAO:*`）
  - 响应分页 / 延迟加载单图直链（多图 note 首屏 payload 几 MB）
  - nginx gzip 开启
- **构建**：`npm run build`（tsc + vite build）零错误零警告

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