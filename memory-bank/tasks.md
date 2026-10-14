# Tasks

## Pending（用户明确说"后续考虑"）

### [待启动] v1.2 批量采集（2026-10-12 路线图确定，FR-09~14）
- **前置条件**：v1.1 验收通过 ✅ (10 个 commit 已推送),且实际使用中有批量需求
- **路线**：方向 A→B→C 递进中的「效率台阶」,先于 v2.0 素材库
- **Must**：
  - FR-09 多行批量输入（textarea 支持多行 + 链接抽取,允许附带分享文案）
  - FR-10 解析队列与逐条状态（建议并发 2,单条失败不阻塞,可单条重试）
- **Should**：
  - FR-11 批量打包下载（单 ZIP,每篇一文件夹 `${作品ID}_${标题}`,含 `metadata.json`）
  - FR-12 去重入队（同作品ID 不重复入队）
  - FR-13 剪贴板粘贴按钮降级提示（基础版 2026-10-12 已落地,HTTP 场景需复核降级路径）
- **Could**：
  - FR-14 移动端适配（iPhone Safari + Android Chrome 真机全流程,Lighthouse ≥70）
- **风险提示**：批量 = 合规红线,产品层必须保单用户语义 + 小并发（见方向约束）

### [待启动] v2.0 素材库（2026-10-12 路线图确定，FR-15~24,价值分水岭）
- **前置条件**：v1.2 批量链路稳定 + 3 个关键问题已拍板（2026-10-14 决策见下）
- **决策（2026-10-14）**：
  - **Q1 存什么?** → 元数据 + 缩略图（默认）。媒体本体走"可选落盘到本地目录"（需浏览器支持 OPFS / File System Access,后续评估）
  - **Q2 是否跨设备?** → 不需要（零服务端,FR-22/FR-24 导出/导入单文件作为替代）
  - **Q3 是否纯自用?** → 是（README 自述一致,跳过用户体系与权限设计）
- **Must**：
  - FR-15 存储升级 IndexedDB（替代 localStorage 50 条/5MB 上限,封装统一存储层 `utils/vault.ts`,版本号与迁移）
  - FR-16 自动入库零操作（解析成功即写入素材库,同作品ID 二次采集按"更新"处理）
  - FR-17 素材卡片墙（封面/标题/作者/标签/类型/采集时间,分页或虚拟滚动,500 条下流畅）
  - FR-18 本地检索（标题/正文/作者/标签关键词,500 条下 <300ms,标签/作者/类型筛选）
  - FR-19 软删除与回收站（可恢复,清空需二次确认）
- **Should**：
  - FR-20 存储配额守卫（`navigator.storage.estimate` ≥80% 提示,处置:清回收站/仅元数据/导出后清库）
  - FR-21 增量更新提示（同链接二次采集,元数据变化时给"该素材有更新"）
  - FR-22 导出素材清单（JSON/CSV,按当前筛选导出,导出文件可重导入）
- **Could**：
  - FR-23 标签/作者聚合视图
  - FR-24 数据备份与恢复（单文件导入导出,浏览器存储驱逐后可恢复）

### [待启动] v2.x 创作辅助（FR-25~29,所有项待评估,不做承诺）
- **前置条件**：库内 ≥200 篇 + 真实检索/导出行为
- **建议首发**：FR-25 文案结构化导出（Markdown + front-matter → Obsidian,无外部依赖,风险低）
- **⚠️ 强约束**：FR-29 AI 辅助摘要/聚类 三项前置评估（数据合规 / 模型成本 / AI 行为边界）全部通过才得开工

### [待启动] 杂项（不属于主线）
- `sync.sh` 扩展：nginx reload + 后端 `git pull` 提示（路线图建议 v1.2 阶段做）
- 后端 CORS 收敛 `ACAO:*` → 白名单（不在本仓库）
- 后端响应分页/懒加载单图直链（不在本仓库,首屏 payload 几 MB）
- nginx gzip 开启（不在本仓库）

### 已锁定的不做清单（不要再讨论）
- **合规硬约束**：自动化登录 / Cookie 托管 / 定时任务 / 风控绕过 / 版权标识修改 / 多平台聚合抓取 / 第三方 AI 服务
- **架构沿用决策**：不引入 Redux/RTK Query / 不 fork 后端 / 不改 5556 端口绑定 / 不改同源反代 / 不引入服务端用户体系
- **阶段性暂不做**：跨设备同步 / 图片本地编辑 / 发布/回传小红书

---

## Done（倒序，最多 20 条；旧条目归档到 `archive/`）

### 2026-10-14 — v1.1 收尾全量（10 个 commit,见 git log）
- **FR-04 输入校验**：`utils/validation.ts` + XHS_DOMAIN_RE / MAX_INPUT_LEN=2000；i18n `inputNoDomain` / `inputTooLong`；handleParse 入口校验,失败发 parse 类错误
- **FR-05 扩展名修正**：`utils/url-helpers.ts` 共享 `getExtension`；`downloader.ts` 签名加 `getFilename` 回调；MediaGrid 删本地副本,`.webp`/`.jpg` 不再被改 `.png`
- **FR-06 组件拆分**：VideoItem → `components/VideoItem.tsx`(135);InputCard → `InputCard.tsx`(110);ErrorCard → `ErrorCard.tsx`(35);ResultsSection → `ResultsSection.tsx`(32)。App.tsx 354→270,MediaGrid.tsx 347→209
- **FR-07 健康探针**：`services/health.ts` `probeBackend` (5s 超时);App.tsx mount 时探测 + 顶部琥珀色非阻断提示条(带「重试」)
- **FR-08 工程债**：删 8 个死 i18n key;删 README 演示模式章节;刷 tasks.md 过期项;`useHistory.remove` 接入为 HistoryPanel 单条删除按钮
- **NFR 测试基建**：vitest 2.1.9 + happy-dom + testing-library;`xhsService` 6 分支 / `url-helpers` 5 case / `validation` 7 case;18/18 通过
- **NFR 部署自检**：`scripts/verify.sh` (+x) 三步:nginx -t / 容器 Up / OPTIONS 预检 200;README 双语增补「部署前自检」小节
- **构建**：JS 328 KB(+2.6 KB),CSS 20 KB;dist 内 CDN 引用 0

### 2026-10-12 — 粘贴按钮 + 移动端适配（前端落地）

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