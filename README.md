# XHS Downloader UI

**English Documentation** | [中文](README.zh-CN.md)

A minimalist, responsive Web UI designed to parse and download high-definition, watermark-free images and videos from Xiaohongshu (XHS).

## ✨ Features

* **Watermark-free Parsing**: Directly extract high-quality original image and video resources.
* **Batch Download**: Supports one-click packaging (ZIP format) for all assets in a post.
* **Responsive Design**: Optimized for both desktop and mobile browsers.
* **Metadata Display**: View likes, favorites, and comments at a glance; includes one-click copy for captions.
* **Multi-language Support**: Built-in Chinese and English interface.

## 🛠 Tech Stack

* **Frontend Framework**: React 19, TypeScript
* **Styling**: Tailwind CSS
* **Icons**: Lucide React
* **Utilities**: JSZip (for packaged downloads)
* **Build Tool**: Vite

## 🚀 Quick Start

### Prerequisites

1. **Node.js**: v16 or higher.
2. **Backend API**: This project is specifically designed to work with **[XHS-Downloader](https://github.com/JoeanAmier/XHS-Downloader)**.
* Please clone that repository and run it in API server mode.
* Default backend address: `http://localhost:8000`



### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/xhs-downloader-ui.git
cd xhs-downloader-ui

```


2. Install dependencies:
```bash
npm install
# or
yarn install

```


3. Start the development server:
```bash
npm run dev

```


4. Open `http://localhost:5173` in your browser.

## ⚙️ Configuration

The app connects to `http://localhost:8000` by default.
You can modify the backend API address by clicking the **Settings** icon in the top right corner.

* **Demo Mode**: Enter `demo` in the API address field to use mock data. This allows you to test the UI functionality without a running backend.

## 🧩 Technical Details

### Solving Video Hotlinking Issues (403 Forbidden)

Xiaohongshu's CDN implements strict hotlinking protection (Referer checks). Using a standard `<video src="...">` tag usually results in an access denial (403 Forbidden) because the browser sends a Referer header, causing the video to fail to load.

**Solution**:
The frontend implements a **Blob Proxy** strategy:

1. Use the `fetch()` API with `referrerPolicy: 'no-referrer'` to download the video data into browser memory.
2. Generate a local Blob URL using `URL.createObjectURL`.
3. Assign this local URL to the video player.

## PS

This is a personal practice project; I primarily deploy it on my NAS for personal use.
