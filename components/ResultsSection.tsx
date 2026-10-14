import React from 'react';
import { Language, XHSNoteData } from '../types';
import { ResultCard } from './ResultCard';
import { MediaGrid } from './MediaGrid';

interface ResultsSectionProps {
    data: XHSNoteData;
    language: Language;
}

/**
 * 解析结果展示:左侧元数据卡片 + 右侧媒体网格。
 * 由父组件 (App) 保证 data 已非空。
 */
export const ResultsSection: React.FC<ResultsSectionProps> = ({
    data,
    language,
}) => {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-5 space-y-6">
                    <ResultCard data={data} language={language} />
                </div>
                <div className="lg:col-span-7">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <MediaGrid data={data} language={language} />
                    </div>
                </div>
            </div>
        </div>
    );
};