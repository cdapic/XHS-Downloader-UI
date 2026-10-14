import React, { useEffect, useState } from 'react';
import { Link2, Search, AlertCircle, ClipboardPaste } from 'lucide-react';
import { Language, ParseStatus } from '../types';
import { t } from '../utils/i18n';

interface InputCardProps {
    inputText: string;
    status: ParseStatus;
    language: Language;
    onInputChange: (text: string) => void;
    onSubmit: () => void;
    onCancel: () => void;
    onPaste: () => Promise<void> | void;
}

/**
 * 输入卡片:粘贴按钮 + textarea + 解析/取消按钮。
 * 粘贴失败 toast 自管(3 秒自动消失),不外泄。
 */
export const InputCard: React.FC<InputCardProps> = ({
    inputText,
    status,
    language,
    onInputChange,
    onSubmit,
    onCancel,
    onPaste,
}) => {
    const [pasteError, setPasteError] = useState(false);

    useEffect(() => {
        if (!pasteError) return;
        const timer = setTimeout(() => setPasteError(false), 3000);
        return () => clearTimeout(timer);
    }, [pasteError]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
        }
    };

    const handlePaste = async () => {
        try {
            await onPaste();
        } catch {
            setPasteError(true);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-2 border border-gray-100 transition-all focus-within:ring-4 focus-within:ring-red-50 focus-within:border-red-200">
            <div className="relative">
                <div className="absolute top-3 left-3 text-gray-400">
                    <Link2 size={20} />
                </div>
                <textarea
                    value={inputText}
                    onChange={(e) => onInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t(language, 'inputPlaceholder')}
                    className="w-full pl-10 pr-4 py-3 min-h-[60px] max-h-[120px] outline-none text-gray-700 placeholder:text-gray-400 resize-none bg-transparent"
                    rows={2}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    enterKeyHint="go"
                />
            </div>
            <div className="flex justify-between items-center px-2 pb-2">
                <button
                    onClick={handlePaste}
                    disabled={status === 'loading'}
                    className="flex items-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 px-4 py-2.5 rounded-xl font-medium transition-all min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                    <ClipboardPaste size={18} />
                    {t(language, 'pasteBtn')}
                </button>
                <button
                    onClick={status === 'loading' ? onCancel : onSubmit}
                    disabled={status !== 'loading' && !inputText.trim()}
                    className={
                        status === 'loading'
                            ? 'flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2.5 rounded-xl font-medium transition-all min-h-[44px] active:scale-95'
                            : 'flex items-center gap-2 bg-xhs-red hover:bg-red-600 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-red-200 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed active:scale-95'
                    }
                >
                    {status === 'loading' ? (
                        <>
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                            {t(language, 'cancel')}
                        </>
                    ) : (
                        <>
                            <Search size={18} />
                            {t(language, 'parseBtn')}
                        </>
                    )}
                </button>
            </div>
            {pasteError && (
                <div className="mt-2 p-3 bg-amber-50 text-amber-700 rounded-xl flex items-center gap-2 text-sm animate-in fade-in slide-in-from-top-2">
                    <AlertCircle size={16} className="shrink-0" />
                    {t(language, 'pasteFailed')}
                </div>
            )}
        </div>
    );
};