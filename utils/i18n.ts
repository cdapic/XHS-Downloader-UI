import { Language } from "../types";

const translations = {
    [Language.ZH]: {
        appTitle: "XHS 下载器",
        inputPlaceholder: "在此粘贴小红书分享文案或链接...",
        parseBtn: "解析素材",
        parsing: "解析中...",
        downloadAll: "打包下载",
        downloading: "打包中...",
        compressing: "压缩中...",
        errorTitle: "解析失败",
        errorDesc: "请检查链接是否有效或后端服务是否启动。",
        history: "历史",
        historyClear: "清空",
        author: "作者",
        published: "发布于",
        images: "图片",
        videos: "视频",
        copySuccess: "链接已复制",
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
        parsing: "Parsing...",
        downloadAll: "Download All",
        downloading: "Zipping...",
        compressing: "Compressing...",
        errorTitle: "Parse Failed",
        errorDesc:
            "Check if the link is valid or if the backend service is running.",
        history: "History",
        historyClear: "Clear",
        author: "Author",
        published: "Published",
        images: "Images",
        videos: "Videos",
        copySuccess: "Link Copied",
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
