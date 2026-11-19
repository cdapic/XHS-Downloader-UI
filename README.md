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

This UI is a pure frontend that talks to the backend through **same-origin reverse proxy** in nginx. There are three moving parts:

```
[Browser] ──► http://<nginx-host>:1234    (nginx serves dist/)
                  │
                  └─ /xhs/* ──proxy_pass──► http://<backend-host>:5556/xhs/

[Backend] ──► docker xhs-downloader-api     (FastAPI :5556)
```

You don't configure the backend URL in the frontend — you configure nginx's `proxy_pass`.

### Prerequisites

1. **Node.js**: v16 or higher (only needed to build the frontend).
2. **Backend**: Clone and run [**XHS-Downloader**](https://github.com/JoeanAmier/XHS-Downloader) in API mode (Docker recommended). It listens on `0.0.0.0:5556`.
3. **Web server**: nginx (or anything that serves static files and reverse-proxies `/xhs/*`).

### Build the frontend

```bash
git clone https://github.com/cdapic/XHS-Downloader-UI.git
cd XHS-Downloader-UI
npm install
npm run build         # outputs dist/
```

### Configure nginx

Example server block:

```nginx
server {
    listen 1234;
    server_name _;

    root /var/www/xhs-ui;            # point this at your dist/ directory
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API reverse proxy (the ONLY place to set backend host)
    location /xhs/ {
        proxy_pass http://<backend-host>:5556/xhs/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_http_version 1.1;
        proxy_read_timeout 120s;
    }

    # Static asset cache
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf)$ {
        expires 7d;
    }
}
```

Then sync `dist/` to your nginx host:

```bash
rsync -avz --delete dist/ <user>@<nginx-host>:/var/www/xhs-ui/
```

(The repo ships `sync.sh` for this — see `TARGET_HOST` / `TARGET_DIR` env vars.)

### 🚀 One-command deploy

`scripts/deploy.sh` does the whole thing — build, install the auth token, patch the
nginx site, sync files, reload, verify:

```bash
./scripts/deploy.sh                 # default target root@192.168.2.35, UI on :1234
./scripts/deploy.sh --no-build      # skip the build
TARGET_HOST=root@my.host ./scripts/deploy.sh
```

What it does, in order:

1. fetch the auth token from the local backend container
2. write it to `<target>:/etc/nginx/snippets/xhs-auth.conf` (mode 600) — via stdin, so the
   token never appears in argv or in logs
3. insert `include /etc/nginx/snippets/xhs-auth.conf;` into the site's `location /xhs/`
   block (idempotent; the original config is backed up as `xhs-ui.bak.<timestamp>`)
4. `rsync --delete dist/` → `<target>:/var/www/xhs-ui/`
5. `nginx -t` then a **graceful reload** (`systemctl reload nginx` / `nginx -s reload` —
   never a restart, existing connections are kept)
6. probe `POST <target>/xhs/detail` — must come back 200 through the injected token

### 🔐 Auth token (required since backend 2.9)

Since **2.9** the backend enforces `Authorization: Bearer <token>` on `POST /xhs/detail`;
a missing or invalid token is answered with **403**. The token is signed by the backend
with a local secret (HMAC-SHA256); that secret lives in the backend's Volume, so it
survives container rebuilds.

Two ways to wire it up — pick one, or run both (nginx wins):

**A. Token file (`sync.sh` does it for you)**

`sync.sh` writes the token to `dist/xhs-token.txt` before syncing; the frontend reads it
from the same origin at runtime and attaches the header. Trade-off: anyone on the LAN
who can open the page can also read that file.

```bash
WRITE_TOKEN=1 ./sync.sh      # opt in (default is 0)
XHS_TOKEN=<token> ./sync.sh  # explicit token (default: fetched from the backend container)
```

**B. Inject it in nginx (keeps the token out of the browser — recommended)**

```nginx
location /xhs/ {
    include /etc/nginx/snippets/xhs-auth.conf;   # proxy_set_header Authorization "Bearer …"
    proxy_pass http://<backend-host>:5556/xhs/;
    ...
}
```

No token file is needed then (the default). nginx's `proxy_set_header` replaces any
client-sent header, so running both at once is harmless — `deploy.sh` implements exactly
this layout (`xhs-auth.conf`, mode 600, included from the site config).

Getting a token:

```bash
./scripts/fetch-token.sh                              # from the local backend container
docker exec xhs-downloader-api python main.py TOKEN    # same thing, inside the container
```

> If the token file is missing, nginx's SPA fallback serves `index.html` for
> `/xhs-token.txt`. The frontend detects that the payload isn't a token and treats it as
> "no token" instead of sending HTML as a bearer credential.

### Pre-deploy self-check

Before syncing, sanity-check the three moving parts in one go:

```bash
./scripts/verify.sh                       # default target 192.168.2.35
TARGET_HOST=my.host ./scripts/verify.sh   # custom target
```

The script runs three checks (and fails fast on the first that breaks):
1. `sudo nginx -t` — config syntax
2. `docker ps` — `xhs-downloader-api` container is Up
3. `curl POST http://<host>/xhs/detail` — backend reachable (200) through nginx proxy

Step 3 sends the auth token automatically (`XHS_TOKEN` env var, or fetched from the
local backend container). Without a token, a 403 counts as "reachable, auth required"
rather than a failure.

> The script inspects the target's nginx and the backend container, so run it where both are
> reachable — in the split setup (nginx on the frontend box, backend container on the dev box)
> run step 3 from the dev box (`TARGET_HOST` + `TARGET_PORT` pointing at the frontend box).

### Open the UI

Browse to `http://<nginx-host>:1234/`. Done.

## ⚙️ Configuration

**The frontend does not need backend configuration.** It connects to `${window.location.origin}/xhs/detail` automatically — same-origin via the nginx reverse proxy. Whichever host/port you access the UI from is where it will call the backend.

To change the backend host: **edit your nginx config** (`proxy_pass` directive), not this app.

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
