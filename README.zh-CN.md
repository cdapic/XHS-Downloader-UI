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

本前端是个纯静态页面，通过 nginx **同源反代**与后端通信。整套部署有三个角色：

```
[浏览器] ──► http://<nginx 主机>:1234    (nginx 提供 dist/ 静态服务)
                  │
                  └─ /xhs/* ──proxy_pass──► http://<后端主机>:5556/xhs/

[后端] ──► docker xhs-downloader-api       (FastAPI :5556)
```

**后端地址不写在前端代码里，写在 nginx 的 `proxy_pass` 里**。

### 前置要求

1. **Node.js**: v16 或更高版本（仅构建前端时需要）。
2. **后端**: 克隆并运行 [**XHS-Downloader**](https://github.com/JoeanAmier/XHS-Downloader) 的 API 模式（推荐 Docker），监听 `0.0.0.0:5556`。
3. **Web 服务器**: nginx（或任何能提供静态文件 + 反代 `/xhs/*` 的服务器）。

### 构建前端

```bash
git clone https://github.com/cdapic/XHS-Downloader-UI.git
cd XHS-Downloader-UI
npm install
npm run build         # 输出 dist/
```

### 配置 nginx

参考 server 段：

```nginx
server {
    listen 1234;
    server_name _;

    root /var/www/xhs-ui;            # 指向你的 dist/ 目录
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 反代（**唯一**指定后端地址的地方）
    location /xhs/ {
        proxy_pass http://<后端主机>:5556/xhs/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_http_version 1.1;
        proxy_read_timeout 120s;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf)$ {
        expires 7d;
    }
}
```

把 `dist/` 同步到 nginx 主机：

```bash
rsync -avz --delete dist/ <用户>@<nginx 主机>:/var/www/xhs-ui/
```

（仓库自带 `sync.sh`，可通过 `TARGET_HOST` / `TARGET_DIR` 环境变量调整目标。）

### 打开 UI

浏览器访问 `http://<nginx 主机>:1234/`，完事。

## ⚙️ 配置说明

**前端不需要配置后端地址**。前端通过 `${window.location.origin}/xhs/detail` 自动连接后端（nginx 同源反代），用户从哪个主机/端口访问 UI，就从那里调到后端。

要改后端地址：**改 nginx 配置**（`proxy_pass` 指令），**不是改前端**。

### 演示模式 (Demo Mode)

想在没有真实后端的情况下预览 UI，点右上角 **设置 (Settings)** 图标，在 API 地址栏输入 `demo`，UI 会加载模拟数据。设置**仅在当前会话有效** —— 刷新页面会自动恢复为 nginx 反代的真实端点。

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

## 📝 更新日志

### 2026-04-14
- 配合后端 XHS-Downloader API Server 添加 CORS 中间件，解决通过 VPN / 虚拟局域网 / 本地局域网访问时的跨域请求失败问题

> © 2025 cdapic. 本项目基于 [MIT 许可证](LICENSE) 开源。
