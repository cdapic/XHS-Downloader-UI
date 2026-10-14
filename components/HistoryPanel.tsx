import React, { useState } from 'react';
import {
    History,
    Trash2,
    ChevronDown,
    ChevronUp,
    AlertCircle,
    CheckCircle2,
} from 'lucide-react';
import { HistoryItem } from '../hooks/useHistory';
import { Language } from '../types';
import { t } from '../utils/i18n';

interface HistoryPanelProps {
    items: HistoryItem[];
    onPick: (text: string) => void;
    onClear: () => void;
    /** 单条删除;不传则不渲染每行的删除按钮 */
    onRemove?: (id: string) => void;
    language: Language;
}

// 简短相对时间（不依赖 i18n 插值）；> 7 天回落到日期。
const formatRelative = (ts: number): string => {
    const diff = Date.now() - ts;
    if (diff < 60_000) return '< 1m';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
    if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d`;
    return new Date(ts).toLocaleDateString();
};

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
    items,
    onPick,
    onClear,
    onRemove,
    language,
}) => {
    const [expanded, setExpanded] = useState(false);

    // 空历史不渲染——保留输入区简洁。
    if (items.length === 0) return null;

    return (
        <div className="mt-2 bg-white rounded-xl border border-gray-100 overflow-hidden">
            <button
                onClick={() => setExpanded((prev) => !prev)}
                className="w-full flex items-center justify-between px-4 py-2 min-h-[44px] text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                aria-expanded={expanded}
            >
                <div className="flex items-center gap-2">
                    <History size={16} />
                    <span className="font-medium">
                        {t(language, 'history')}
                    </span>
                    <span className="text-xs text-gray-400">
                        ({items.length})
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    {expanded && (
                        <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                                e.stopPropagation();
                                onClear();
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.stopPropagation();
                                    onClear();
                                }
                            }}
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors cursor-pointer min-h-[44px] sm:min-h-0 px-2"
                        >
                            <Trash2 size={14} />
                            {t(language, 'historyClear')}
                        </span>
                    )}
                    {expanded ? (
                        <ChevronUp size={16} />
                    ) : (
                        <ChevronDown size={16} />
                    )}
                </div>
            </button>

            {expanded && (
                <div className="border-t border-gray-100 max-h-60 overflow-y-auto">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => onPick(item.text)}
                            className="flex items-start gap-3 px-4 py-2.5 min-h-[44px] hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors border-b border-gray-50 last:border-b-0"
                        >
                            <div className="shrink-0 mt-0.5">
                                {item.status === 'success' ? (
                                    <CheckCircle2
                                        size={14}
                                        className="text-green-500"
                                    />
                                ) : (
                                    <AlertCircle
                                        size={14}
                                        className="text-red-400"
                                    />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm text-gray-700 truncate">
                                    {item.noteTitle || item.text}
                                </div>
                                <div className="text-xs text-gray-400 mt-0.5 truncate font-mono">
                                    {item.text}
                                </div>
                            </div>
                            <div className="shrink-0 text-xs text-gray-400 mt-0.5 tabular-nums">
                                {formatRelative(item.createdAt)}
                            </div>
                            {onRemove && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemove(item.id);
                                    }}
                                    aria-label="Remove from history"
                                    className="shrink-0 mt-0.5 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};