import React from 'react';
import { AlertCircle } from 'lucide-react';
import { AppError } from '../types';

interface ErrorCardProps {
    appError: AppError | null;
}

/**
 * 三分类错误卡:
 * - network → 红色
 * - backend → 琥珀
 * - parse   → 蓝
 */
export const ErrorCard: React.FC<ErrorCardProps> = ({ appError }) => {
    if (!appError) return null;

    const className =
        appError.category === 'network'
            ? 'mt-4 p-4 bg-red-50 text-red-600 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2'
            : appError.category === 'backend'
              ? 'mt-4 p-4 bg-amber-50 text-amber-700 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2'
              : 'mt-4 p-4 bg-blue-50 text-blue-700 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2';

    return (
        <div className={className}>
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
                <p className="font-semibold">{appError.title}</p>
                <p className="text-sm mt-1 opacity-90 break-words">
                    {appError.message}
                </p>
            </div>
        </div>
    );
};