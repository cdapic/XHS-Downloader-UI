# 小红书下载器 UI (XHS Downloader UI)

[English](README.md) | **中文**

一个极简、响应式的 Web UI，用于解析并下载小红书的高清无水印图片和视频。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)
![Tailwind](https://img.shields.io/badge/Tailwind-3.0-38bdf8.svg)

> ⚠️ **重要提示：本工具仅供个人学习、研究或备份自己发布的内容使用。请严格遵守小红书平台《用户协议》及《版权政策》，切勿用于批量爬取、商业用途或侵犯他人知识产权。开发者不对任何违规使用行为承担责任。**

---

## ✨ 功能特性

- **无水印解析**: 直接提取高质量的原始图片和视频资源。
- **批量下载**: 支持一键打包（ZIP格式）下载笔记中的所有素材。
- **响应式设计**: 完美适配桌面端和移动端浏览器。
- **元数据展示**: 直观展示点赞、收藏、评论数据，支持一键复制文案。
- **多语言支持**: 内置中文和英文界面。

## 🛠 技术栈

- **前端框架**: React 19, TypeScript  
- **样式库**: Tailwind CSS  
- **图标库**: Lucide React  
- **工具库**: JSZip（用于打包下载）  
- **构建工具**: Vite  

## 🚀 快速开始

### 前置要求

1. **Node.js**: v16 或更高版本。  
2. **后端 API**: 本项目专为配合 [**XHS-Downloader**](https://github.com/JoeanAmier/XHS-Downloader) 设计。  
   - 请先克隆并运行该后端服务（API 模式）。  
   - 默认后端地址：`http://localhost:8000`

### 安装步骤

```bash
# 1. 克隆仓库
git clone https://github.com/cdapic/XHS-Downloader-UI.git
cd XHS-Downloader-UI

# 2. 安装依赖
npm install
# 或
yarn install

# 3. 启动开发服务器
npm run dev
```

4. 在浏览器中打开 `http://localhost:5173`。

## ⚙️ 配置说明

应用默认连接到 `http://localhost:8000`。  
点击右上角 **设置 (Settings)** 图标可修改后端 API 地址。

- **演示模式 (Demo Mode)**: 在 API 地址栏输入 `demo`，应用将使用模拟数据，方便在没有后端的情况下测试 UI 功能。

## 🧩 技术细节

### 关于视频防盗链（403 Forbidden）的解决方案

小红书的 CDN 启用了严格的 Referer 防盗链机制。若直接使用 `<video src="...">`，浏览器会携带 Referer 头，导致请求被拒绝（403），视频无法播放。

**本项目采用 Blob 代理策略绕过限制**：
1. 使用 `fetch(url, { referrerPolicy: 'no-referrer' })` 下载视频到内存；
2. 通过 `URL.createObjectURL()` 生成本地 Blob URL；
3. 将该 URL 作为视频源，实现无 Referer 播放与下载。

> 此方法完全在**用户浏览器端完成**，不涉及服务器代理，符合前端安全模型。

## 📜 合规与使用声明

- 本项目为**开源工具**，仅提供技术实现，**不鼓励也不支持任何违反平台规则的行为**。
- 请仅用于：
  - 下载**你自己发布**的小红书内容（如个人备份）；
  - **非商业目的**的学习、研究或技术测试。
- **禁止用于**：
  - 批量抓取他人内容；
  - 二次分发、商用、去水印转卖等侵犯著作权的行为；
  - 绕过平台反爬机制进行自动化采集。
- 使用本工具即表示你已阅读并同意自行承担相关法律责任。**作者不提供任何形式的担保，亦不对任何滥用后果负责**。

## 💬 关于本项目

这是一个个人练手项目，主要用于在 NAS 上部署，方便自己管理内容。欢迎提 Issue 或 PR，但**不承诺长期维护或技术支持**。

---

> © 2025 cdapic. 本项目基于 [MIT 许可证](LICENSE) 开源。
