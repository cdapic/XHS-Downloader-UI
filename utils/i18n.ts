import { Language } from "../types";

const translations = {
    [Language.ZH]: {
        appTitle: "XHS 下载器",
        inputPlaceholder: "在此粘贴小红书分享文案或链接...",
        parseBtn: "解析素材",
        downloading: "下载中...",
        compressing: "压缩中...",
        downloadAll: "打包下载",
        history: "历史",
        historyClear: "清空",
        images: "图片",
        videos: "视频",
        copyText: "复制文案",
        textCopied: "文案已复制",
        pasteBtn: "粘贴",
        pasteFailed: "无法读取剪贴板，请手动粘贴",
        cancel: "取消",
        timeoutError: "解析超时，后端可能无响应。请稍后重试或检查后端服务。",
        // FR-03 错误三分类
        errorNetworkTitle: "无法连接到服务",
        errorNetworkDesc: "请检查 nginx 与后端容器是否运行,以及本机网络是否通畅。",
        errorBackendTitle: "后端未能解析此链接",
        errorBackendDesc: "链接可能无效、已删除,或需要登录。请确认链接仍可访问后再试。",
        errorParseTitle: "输入无法识别",
        errorParseDesc: "请粘贴有效的小红书分享文案或链接(xhslink.com / xiaohongshu.com)。",
        inputNoDomain: "未识别到小红书链接。请粘贴 xhslink.com / xiaohongshu.com 的分享文案或链接。",
        inputTooLong: "输入过长(超过 2000 字符),请精简后重试。",
        // FR-07 健康探针
        healthBannerText: "后端服务未就绪,部分功能可能不可用。",
        healthRetry: "重试",
        stats: {
            likes: "点赞",
            collects: "收藏",
            comments: "评论",
        },
    },
    [Language.EN]: {
        appTitle: "XHS Downloader",
        inputPlaceholder: "Paste XHS share text or link here...",
        parseBtn: "Parse Content",
        downloading: "Downloading...",
        compressing: "Compressing...",
        downloadAll: "Download All",
        history: "History",
        historyClear: "Clear",
        images: "Images",
        videos: "Videos",
        copyText: "Copy Text",
        textCopied: "Copied!",
        pasteBtn: "Paste",
        pasteFailed: "Cannot read clipboard, please paste manually",
        cancel: "Cancel",
        timeoutError: "Request timeout: backend may be unresponsive. Retry or check the backend service.",
        // FR-03 error taxonomy
        errorNetworkTitle: "Cannot reach service",
        errorNetworkDesc: "Check that nginx and the backend container are running, and that your network is reachable.",
        errorBackendTitle: "Backend could not parse this link",
        errorBackendDesc: "The link may be invalid, deleted, or require login. Verify it is still accessible and try again.",
        errorParseTitle: "Input not recognized",
        errorParseDesc: "Please paste a valid XHS share text or link (xhslink.com / xiaohongshu.com).",
        inputNoDomain: "No XHS link detected. Please paste share text or link from xhslink.com / xiaohongshu.com.",
        inputTooLong: "Input too long (over 2000 chars). Please shorten and retry.",
        // FR-07 health banner
        healthBannerText: "Backend service is not ready. Some features may be unavailable.",
        healthRetry: "Retry",
        stats: {
            likes: "Likes",
            collects: "Favs",
            comments: "Chat",
        },
    },
};

export const t = (lang: Language, key: string): string => {
    const keys = key.split(".");
    let current: any = translations[lang];

    for (const k of keys) {
        if (current[k] === undefined) return key;
        current = current[k];
    }

    return current as string;
};