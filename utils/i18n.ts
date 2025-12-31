import { Language } from "../types";

const translations = {
    [Language.ZH]: {
        appTitle: "XHS 下载器",
        settings: "设置",
        apiUrlLabel: "后端 API 地址",
        save: "保存",
        reset: "重置",
        cancel: "取消",
        inputPlaceholder: "在此粘贴小红书分享文案或链接...",
        parseBtn: "解析素材",
        parsing: "解析中...",
        downloadAll: "打包下载",
        downloading: "打包中...",
        errorTitle: "解析失败",
        errorDesc: "请检查链接是否有效或后端服务是否启动。",
        demoMode: "演示模式",
        demoModeDesc: "当前未连接真实后端，仅展示模拟数据。",
        author: "作者",
        published: "发布于",
        images: "图片",
        videos: "视频",
        copySuccess: "链接已复制",
        copyText: "复制文案",
        textCopied: "文案已复制",
        stats: {
            likes: "点赞",
            collects: "收藏",
            comments: "评论",
        },
        apiAutoUpdated: "检测到网络环境变化，API 地址已自动更新为: ",
    },
    [Language.EN]: {
        appTitle: "XHS Downloader",
        settings: "Settings",
        apiUrlLabel: "Backend API URL",
        save: "Save",
        reset: "Reset",
        cancel: "Cancel",
        inputPlaceholder: "Paste XHS share text or link here...",
        parseBtn: "Parse Content",
        parsing: "Parsing...",
        downloadAll: "Download All",
        downloading: "Zipping...",
        errorTitle: "Parse Failed",
        errorDesc:
            "Check if the link is valid or if the backend service is running.",
        demoMode: "Demo Mode",
        demoModeDesc: "Using mock data. Connect a backend for real usage.",
        author: "Author",
        published: "Published",
        images: "Images",
        videos: "Videos",
        copySuccess: "Link Copied",
        copyText: "Copy Text",
        textCopied: "Copied!",
        stats: {
            likes: "Likes",
            collects: "Favs",
            comments: "Chat",
        },
        apiAutoUpdated: "Network change detected. API URL auto-set to: ",
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
