# 小红书无水印下载器前端 (XHS Downloader UI)

[English Documentation](README.md) | **中文文档**

一个极简、响应式的 Web UI，用于解析并下载小红书的高清无水印图片和视频。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)
![Tailwind](https://img.shields.io/badge/Tailwind-3.0-38bdf8.svg)

## ✨ 功能特性

- **无水印解析**: 直接提取高质量的原始图片和视频资源。
- **视频预览修复**: 解决了小红书视频外链产生的“403 Forbidden”或黑屏问题。通过前端 Blob 代理策略绕过 Referrer 限制。
- **批量下载**: 支持一键打包（ZIP格式）下载笔记中的所有素材。
- **响应式设计**: 完美适配桌面端和移动端浏览器。
- **元数据展示**: 直观展示点赞、收藏、评论数据，支持一键复制文案。
- **多语言支持**: 内置中文和英文界面。

## 🛠 技术栈

- **前端框架**: React 19, TypeScript
- **样式库**: Tailwind CSS
- **图标库**: Lucide React
- **工具库**: JSZip (用于打包下载)
- **构建工具**: Vite

## 🚀 快速开始

### 前置要求

1. **Node.js**: v16 或更高版本。
2. **后端 API**: 本项目仅包含前端代码。你需要一个运行中的后端服务（如 Python/Flask）来处理实际的链接解析请求。
   - 默认后端地址: `http://localhost:8000`

### 安装步骤

1. 克隆仓库:
   ```bash
   git clone https://github.com/yourusername/xhs-downloader-ui.git
   cd xhs-downloader-ui
   ```

2. 安装依赖:
   ```bash
   npm install
   # 或者
   yarn install
   ```

3. 启动开发服务器:
   ```bash
   npm run dev
   ```

4. 在浏览器中打开 `http://localhost:5173`。

## ⚙️ 配置说明

应用默认连接到 `http://localhost:8000`。
你可以点击右上角的 **设置 (Settings)** 图标修改后端 API 地址。

- **演示模式 (Demo Mode)**: 在 API 地址栏输入 `demo`，应用将使用模拟数据，方便在没有后端的情况下测试 UI 功能。

## 🧩 技术细节

### 关于视频防盗链 (403 Forbidden) 的解决方案
小红书的 CDN 开启了严格的防盗链（Referer 检查）。直接使用 `<video src="...">` 标签通常会因为浏览器发送了 Referer 头而被拒绝访问（403 Forbidden），导致视频黑屏无法播放。

**我们的解决方案**:
我们在前端实现了 **Blob 代理 (Blob Proxy)** 策略：
1. 使用 `fetch()` API 并设置 `referrerPolicy: 'no-referrer'` 将视频数据下载到浏览器内存中。
2. 使用 `URL.createObjectURL` 生成一个本地的 Blob URL。
3. 将这个本地 URL 赋值给播放器。

这种方法既能绕过防盗链限制，又能保证视频流畅播放。

## 🤝 参与贡献

欢迎提交 Pull Request！如果是重大更改，请先提交 Issue 讨论您想要改变的内容。

## 📄 许可证

MIT
