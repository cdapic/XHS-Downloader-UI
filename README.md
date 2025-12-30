# XHS Downloader UI

[中文文档](README.zh-CN.md) | **English**

A minimalist, responsive Web UI for downloading high-quality images and videos from Xiaohongshu (Little Red Book) without watermarks.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)
![Tailwind](https://img.shields.io/badge/Tailwind-3.0-38bdf8.svg)

## ✨ Features

- **No Watermark Parsing**: Extract high-quality images and videos directly from source.
- **Video Preview Fix**: Solves the "403 Forbidden" / black screen issue on video previews using a custom Blob Proxy strategy to bypass Referrer checks.
- **Batch Download**: Download all media in a post as a single ZIP file with one click.
- **Responsive Design**: Optimized for both Desktop and Mobile experiences.
- **Metadata Viewer**: View detailed post statistics (Likes, Collects, Comments) and easily copy the description.
- **Multi-language**: Built-in support for English and Chinese.

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Utilities**: JSZip (for batch downloading)
- **Build Tool**: Vite

## 🚀 Getting Started

### Prerequisites

1. **Node.js**: v16 or higher.
2. **Backend API**: This is a frontend-only project. You need a running backend service (e.g., Python/Flask) to handle the actual link parsing and API requests.
   - Default API URL: `http://localhost:8000`

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

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173` in your browser.

## ⚙️ Configuration

By default, the app connects to `http://localhost:8000`. 
You can change this in the UI by clicking the **Settings** icon in the top right corner.

- **Demo Mode**: Enter `demo` as the API URL to use mock data for testing UI functionality without a real backend.

## 🧩 Technical Details

### Solving the Video Hotlink Protection (403 Forbidden)
Xiaohongshu employs strict hotlink protection (Referrer checks) on their CDN. Standard `<video src="...">` tags often fail with `403 Forbidden` or display a black screen because browsers automatically send the `Referer` header.

**Our Solution**:
We implemented a **Blob Proxy** strategy in the frontend:
1. Use `fetch()` with `referrerPolicy: 'no-referrer'` to download the video binary to browser memory.
2. Create a local `Blob URL` (`URL.createObjectURL`).
3. Feed this local URL to the HTML5 video player.

This ensures the video plays smoothly while fully respecting browser security policies.

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

MIT
