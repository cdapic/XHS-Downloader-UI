import React, { useState } from "react";
import {
    Heart,
    Star,
    MessageCircle,
    Share2,
    Calendar,
    User,
    Copy,
    Check,
} from "lucide-react";
import { XHSNoteData, Language } from "../types";
import { t } from "../utils/i18n";

interface ResultCardProps {
    data: XHSNoteData;
    language: Language;
}

export const ResultCard: React.FC<ResultCardProps> = ({ data, language }) => {
    const [copied, setCopied] = useState(false);

    const handleCopyText = async () => {
        if (!data.作品描述) return;

        // Try modern Clipboard API first
        if (navigator.clipboard && navigator.clipboard.writeText) {
            try {
                await navigator.clipboard.writeText(data.作品描述);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
                return;
            } catch (err) {
                console.warn("Clipboard API failed, trying fallback...", err);
            }
        }

        // Fallback for older browsers or non-secure contexts (HTTP)
        try {
            const textArea = document.createElement("textarea");
            textArea.value = data.作品描述;

            // Ensure it's not visible but part of DOM to be selectable
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            textArea.style.top = "0";
            document.body.appendChild(textArea);

            textArea.focus();
            textArea.select();

            const successful = document.execCommand("copy");
            document.body.removeChild(textArea);

            if (successful) {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } else {
                console.error("Fallback copy failed.");
            }
        } catch (fallbackErr) {
            console.error("Failed to copy text", fallbackErr);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="p-5">
                <h2 className="text-xl font-bold text-gray-800 leading-snug mb-3">
                    {data.作品标题 || "No Title"}
                </h2>

                {/* Author Info */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                            <User size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">
                                {data.作者昵称}
                            </p>
                            <p className="text-xs text-gray-500">
                                ID: {data.作者ID}
                            </p>
                        </div>
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar size={14} />
                        {data.发布时间?.split("_")[0]}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                    <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
                        <Heart size={18} className="text-gray-400 mb-1" />
                        <span className="text-xs font-medium text-gray-700">
                            {data.点赞数量}
                        </span>
                        <span className="text-[10px] text-gray-400">
                            {t(language, "stats.likes")}
                        </span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
                        <Star size={18} className="text-gray-400 mb-1" />
                        <span className="text-xs font-medium text-gray-700">
                            {data.收藏数量}
                        </span>
                        <span className="text-[10px] text-gray-400">
                            {t(language, "stats.collects")}
                        </span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
                        <MessageCircle
                            size={18}
                            className="text-gray-400 mb-1"
                        />
                        <span className="text-xs font-medium text-gray-700">
                            {data.评论数量}
                        </span>
                        <span className="text-[10px] text-gray-400">
                            {t(language, "stats.comments")}
                        </span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
                        <Share2 size={18} className="text-gray-400 mb-1" />
                        <span className="text-xs font-medium text-gray-700">
                            {data.分享数量}
                        </span>
                        <span className="text-[10px] text-gray-400">Share</span>
                    </div>
                </div>

                {/* Description Header with Copy Button */}
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">
                        {language === Language.ZH ? "作品文案" : "Description"}
                    </span>
                    <button
                        onClick={handleCopyText}
                        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-xhs-red transition-colors px-2 py-1 rounded-md hover:bg-red-50"
                    >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        {copied
                            ? t(language, "textCopied")
                            : t(language, "copyText")}
                    </button>
                </div>

                {/* Description Body */}
                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                    {data.作品描述}
                </div>

                {/* Tags */}
                {data.作品标签 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                        {data.作品标签.split(" ").map((tag, i) => (
                            <span
                                key={i}
                                className="text-xs text-xhs-red bg-red-50 px-2 py-1 rounded-full"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
