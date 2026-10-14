import React, { useEffect, useRef, useState } from 'react';
import { Languages, AlertCircle, RefreshCw } from 'lucide-react';
import { AppError, Language, ParseStatus, XHSApiResponse } from './types';
import { parseXHSLink, ParseAbortError, ParseNetworkError } from './services/xhsService';
import { probeBackend, HealthStatus } from './services/health';
import { validateInput } from './utils/validation';
import { t } from './utils/i18n';
import { InputCard } from './components/InputCard';
import { ErrorCard } from './components/ErrorCard';
import { ResultsSection } from './components/ResultsSection';
import { HistoryPanel } from './components/HistoryPanel';
import { useHistory } from './hooks/useHistory';

function App() {
    // State
    const [language, setLanguage] = useState<Language>(Language.ZH);
    const [inputText, setInputText] = useState('');
    const [status, setStatus] = useState<ParseStatus>('idle');
    const [result, setResult] = useState<XHSApiResponse | null>(null);
    const [appError, setAppError] = useState<AppError | null>(null);

    // FR-07 后端健康状态
    const [health, setHealth] = useState<HealthStatus>('unknown');
    const [isProbing, setIsProbing] = useState(false);
    const runProbe = async () => {
        if (isProbing) return;
        setIsProbing(true);
        const ok = await probeBackend();
        setHealth(ok ? 'up' : 'down');
        setIsProbing(false);
    };

    // 当前进行中的解析请求控制器(FR-02 用于取消)
    const parseAbortRef = useRef<AbortController | null>(null);

    // 卸载时若仍在解析,主动中止以避免对已卸载组件 setState
    useEffect(() => {
        return () => {
            parseAbortRef.current?.abort();
        };
    }, []);

    // mount 时探测后端
    useEffect(() => {
        runProbe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // History (localStorage)
    const {
        items: historyItems,
        push: pushHistory,
        clear: clearHistory,
        remove: removeHistory,
    } = useHistory();

    const toggleLanguage = () => {
        setLanguage((prev) =>
            prev === Language.ZH ? Language.EN : Language.ZH,
        );
    };

    const handleParse = async () => {
        const submitted = inputText.trim();
        if (!submitted) return;

        // FR-04 输入校验:不合法输入不发请求,直接归 parse 错误
        const validation = validateInput(submitted);
        if (!validation.ok) {
            const messageKey =
                validation.reason === 'tooLong'
                    ? 'inputTooLong'
                    : 'inputNoDomain';
            setStatus('error');
            setAppError({
                category: 'parse',
                title: t(language, 'errorParseTitle'),
                message: t(language, messageKey),
            });
            return;
        }

        // 若已有进行中的请求,先中止
        parseAbortRef.current?.abort();
        const controller = new AbortController();
        parseAbortRef.current = controller;

        setStatus('loading');
        setResult(null);
        setAppError(null);

        try {
            const data = await parseXHSLink(submitted, {
                signal: controller.signal,
            });
            if (data) {
                const hasData =
                    data.data &&
                    typeof data.data === 'object' &&
                    Object.keys(data.data).length > 0;
                if (hasData) {
                    setResult(data);
                    setStatus('success');
                    pushHistory({
                        text: submitted,
                        status: 'success',
                        noteTitle: data.data?.作品标题,
                    });
                } else {
                    // 后端业务类:HTTP 200 但 data 为 null/空
                    setStatus('error');
                    setAppError({
                        category: 'backend',
                        title: t(language, 'errorBackendTitle'),
                        message:
                            data.message?.trim() ||
                            t(language, 'errorBackendDesc'),
                    });
                    pushHistory({ text: submitted, status: 'error' });
                }
            } else {
                setStatus('error');
                setAppError({
                    category: 'backend',
                    title: t(language, 'errorBackendTitle'),
                    message: t(language, 'errorBackendDesc'),
                });
                pushHistory({ text: submitted, status: 'error' });
            }
        } catch (error) {
            if (error instanceof ParseAbortError && error.reason === 'cancelled') {
                setStatus('idle');
                return;
            }
            if (error instanceof ParseAbortError && error.reason === 'timeout') {
                console.warn('Parse request timed out');
                setStatus('error');
                setAppError({
                    category: 'network',
                    title: t(language, 'errorNetworkTitle'),
                    message: t(language, 'timeoutError'),
                });
                return;
            }
            if (error instanceof ParseNetworkError) {
                console.error('Parse network error:', error);
                setStatus('error');
                setAppError({
                    category: 'network',
                    title: t(language, 'errorNetworkTitle'),
                    message: t(language, 'errorNetworkDesc'),
                });
                return;
            }
            console.error('Parse failed unexpectedly:', error);
            setStatus('error');
            setAppError({
                category: 'parse',
                title: t(language, 'errorParseTitle'),
                message: t(language, 'errorParseDesc'),
            });
        } finally {
            if (parseAbortRef.current === controller) {
                parseAbortRef.current = null;
            }
        }
    };

    const handleCancel = () => {
        parseAbortRef.current?.abort();
    };

    const handlePaste = async () => {
        if (status === 'loading') return;
        if (
            navigator.clipboard &&
            typeof navigator.clipboard.readText === 'function'
        ) {
            const text = await navigator.clipboard.readText();
            if (text && text.trim()) {
                setInputText(text.trim());
                return;
            }
        }
        throw new Error('paste unavailable');
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-red-100">
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-xhs-red rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
                            X
                        </div>
                        <h1 className="font-bold text-lg tracking-tight hidden sm:block">
                            {t(language, 'appTitle')}
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleLanguage}
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1 min-w-[44px] min-h-[44px] justify-center"
                            title="Switch Language"
                        >
                            <Languages size={20} />
                            <span className="text-xs font-medium uppercase">
                                {language}
                            </span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">
                {health === 'down' && (
                    <div className="max-w-2xl mx-auto mb-4 p-3 bg-amber-50 text-amber-700 rounded-xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-2">
                        <AlertCircle size={18} className="shrink-0" />
                        <span className="flex-1">
                            {t(language, 'healthBannerText')}
                        </span>
                        <button
                            onClick={runProbe}
                            disabled={isProbing}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors min-h-[44px] sm:min-h-0 disabled:opacity-50"
                        >
                            <RefreshCw
                                size={14}
                                className={
                                    isProbing ? 'animate-spin' : undefined
                                }
                            />
                            {t(language, 'healthRetry')}
                        </button>
                    </div>
                )}
                <div className="max-w-2xl mx-auto mb-12">
                    <InputCard
                        inputText={inputText}
                        status={status}
                        language={language}
                        onInputChange={setInputText}
                        onSubmit={handleParse}
                        onCancel={handleCancel}
                        onPaste={handlePaste}
                    />

                    <HistoryPanel
                        items={historyItems}
                        onPick={setInputText}
                        onClear={clearHistory}
                        onRemove={removeHistory}
                        language={language}
                    />

                    {status === 'error' && <ErrorCard appError={appError} />}
                </div>

                {result?.data && (
                    <ResultsSection data={result.data} language={language} />
                )}
            </main>

            <footer className="py-8 text-center text-gray-400 text-xs">
                <p>© {new Date().getFullYear()} XHS Downloader UI. MIT License.</p>
            </footer>
        </div>
    );
}

export default App;