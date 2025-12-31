# XHS Downloader UI

**[中文](README_zh-CN.md)** | English

A minimal and responsive web UI for parsing and downloading high-quality, watermark-free images and videos from Xiaohongshu (XHS).

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)
![Tailwind](https://img.shields.io/badge/Tailwind-3.0-38bdf8.svg)

> ⚠️ **Important Notice**: This tool is intended **strictly for personal, non-commercial use**, such as backing up your own content or educational purposes. Please comply with Xiaohongshu’s [Terms of Service](https://www.xiaohongshu.com) and copyright policies. **Do not use it for mass scraping, commercial redistribution, or infringing on others' intellectual property. The author disclaims all liability for misuse.**

---

## ✨ Features

- **Watermark-Free Extraction**: Fetch original high-resolution images and videos.
- **Batch Download**: One-click ZIP download of all media in a note.
- **Responsive Design**: Works seamlessly on desktop and mobile browsers.
- **Metadata Display**: Shows likes, collects, comments, and supports one-click text copying.
- **Multi-Language**: Built-in support for English and Chinese.

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript  
- **Styling**: Tailwind CSS  
- **Icons**: Lucide React  
- **Utilities**: JSZip (for ZIP packaging)  
- **Build Tool**: Vite  

## 🚀 Quick Start

### Prerequisites

1. **Node.js**: v16 or higher.  
2. **Backend API**: This UI is designed to work with [**XHS-Downloader**](https://github.com/JoeanAmier/XHS-Downloader).  
   - Clone and run the backend in API mode.  
   - Default backend URL: `http://localhost:8000`

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/cdapic/XHS-Downloader-UI.git
cd XHS-Downloader-UI

# 2. Install dependencies
npm install
# or
yarn install

# 3. Start dev server
npm run dev
```

4. Open your browser at `http://localhost:5173`.

## ⚙️ Configuration

The app defaults to connecting to `http://localhost:8000`.  
Click the **Settings** icon (top-right) to change the backend API URL.

- **Demo Mode**: Enter `demo` as the API URL to load mock data—ideal for testing the UI without a backend.

## 🧩 Technical Notes

### Solving Video Anti-Hotlinking (403 Forbidden)

Xiaohongshu’s CDN enforces strict Referer-based anti-hotlinking. Direct `<video src="...">` requests often fail with **403 Forbidden** due to browser-sent Referer headers.

**Our Solution: Blob Proxy in the Browser**
1. Fetch video using `fetch(url, { referrerPolicy: 'no-referrer' })` to avoid sending Referer.
2. Create a local Blob URL via `URL.createObjectURL()`.
3. Use this Blob URL as the video source for playback and download.

> This approach runs entirely in the **user’s browser**—no server-side proxying involved.

## 📜 Compliance & Usage Policy

- This project is an **open-source tool** provided for **technical demonstration only**.
- **Permitted uses**:
  - Backing up **your own** Xiaohongshu posts.
  - Personal, non-commercial learning or research.
- **Strictly prohibited**:
  - Bulk scraping of others’ content.
  - Commercial reuse, redistribution, or removal of watermarks for profit.
  - Automated crawling that violates platform terms.
- By using this software, you agree to assume **full legal responsibility** for your actions.  
  **The author provides no warranty and bears no liability for any misuse.**

## 💬 About This Project

This is a personal side project, primarily deployed on my NAS for self-use. Issues and PRs are welcome, but **long-term maintenance or support is not guaranteed**.

---

> © 2025 cdapic. Licensed under the [MIT License](LICENSE).
