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
