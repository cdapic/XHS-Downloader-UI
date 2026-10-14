import React, { useState, useEffect, useRef } from "react";
import { Languages, Link2, Search, AlertCircle, ClipboardPaste } from "lucide-react";
import { Language, ParseStatus, XHSApiResponse, AppError } from "./types";
import { parseXHSLink, ParseAbortError, ParseNetworkError } from "./services/xhsService";
import { t } from "./utils/i18n";
import { ResultCard } from "./components/ResultCard";
import { MediaGrid } from "./components/MediaGrid";
import { HistoryPanel } from "./components/HistoryPanel";
import { useHistory } from "./hooks/useHistory";

function App() {
    // State
    const [language, setLanguage] = useState<Language>(Language.ZH);
    const [inputText, setInputText] = useState("");
    const [status, setStatus] = useState<ParseStatus>("idle");
    const [result, setResult] = useState<XHSApiResponse | null>(null);
    const [appError, setAppError] = useState<AppError | null>(null);
    const [pasteError, setPasteError] = useState(false);

    // Auto-dismiss paste error toast after 3 seconds
    useEffect(() => {
        if (!pasteError) return;
        const timer = setTimeout(() => setPasteError(false), 3000);
        return () => clearTimeout(timer);
    }, [pasteError]);

    // 当前进行中的解析请求控制器（FR-02 用于取消）
    const parseAbortRef = useRef<AbortController | null>(null);

    // 卸载时若仍在解析,主动中止以避免对已卸载组件 setState
    useEffect(() => {
        return () => {
            parseAbortRef.current?.abort();
        };
    }, []);

    // History (localStorage)
    const {
        items: historyItems,
        push: pushHistory,
        clear: clearHistory,
        remove: removeHistory,
    } = useHistory();
    const handleHistoryPick = (text: string) => {
        setInputText(text);
    };

    // Toggle Language
    const toggleLanguage = () => {
        setLanguage((prev) =>
            prev === Language.ZH ? Language.EN : Language.ZH,
        );
    };

    // Parse Action
    const handleParse = async () => {
        const submitted = inputText.trim();
        if (!submitted) return;

        // 若已有进行中的请求,先中止(避免串行触发两次网络)
        parseAbortRef.current?.abort();
        const controller = new AbortController();
        parseAbortRef.current = controller;

        setStatus("loading");
        setResult(null);
        setAppError(null);

        try {
            const data = await parseXHSLink(submitted, { signal: controller.signal });
            // 后端在解析失败时返回 data: null 或 data: {} (200 状态),
            // 这两种都视为前端"失败",归类为 backend(后端已收到但未能解析)。
            if (data) {
                const hasData =
                    data.data &&
                    typeof data.data === "object" &&
                    Object.keys(data.data).length > 0;
                if (hasData) {
                    setResult(data);
                    setStatus("success");
                    pushHistory({
                        text: submitted,
                        status: "success",
                        noteTitle: data.data?.作品标题,
                    });
                } else {
                    // 后端业务类:HTTP 200 但 data 为 null/空
                    setStatus("error");
                    setAppError({
                        category: "backend",
                        title: t(language, "errorBackendTitle"),
                        message:
                            data.message?.trim() ||
                            t(language, "errorBackendDesc"),
                    });
                    pushHistory({ text: submitted, status: "error" });
                }
            } else {
                // 防御:正常不会到这里(parseXHSLink 应总是返回非 null)
                setStatus("error");
                setAppError({
                    category: "backend",
                    title: t(language, "errorBackendTitle"),
                    message: t(language, "errorBackendDesc"),
                });
                pushHistory({ text: submitted, status: "error" });
            }
        } catch (error) {
            // 主动取消 → 静默回到 idle,不显示错误卡片,不写入历史
            if (error instanceof ParseAbortError && error.reason === "cancelled") {
                setStatus("idle");
                return;
            }
            // 超时 → 归类为网络类
            if (error instanceof ParseAbortError && error.reason === "timeout") {
                console.warn("Parse request timed out");
                setStatus("error");
                setAppError({
                    category: "network",
                    title: t(language, "errorNetworkTitle"),
                    message: t(language, "timeoutError"),
                });
                return;
            }
            // 网络层错误 (CORS / nginx 5xx / 后端挂掉 / fetch reject / JSON 解析失败)
            if (error instanceof ParseNetworkError) {
                console.error("Parse network error:", error);
                setStatus("error");
                setAppError({
                    category: "network",
                    title: t(language, "errorNetworkTitle"),
                    message: t(language, "errorNetworkDesc"),
                });
                return;
            }
            // 未知异常:兜底归类为 parse(可能是输入或响应结构异常)
            console.error("Parse failed unexpectedly:", error);
            setStatus("error");
            setAppError({
                category: "parse",
                title: t(language, "errorParseTitle"),
                message: t(language, "errorParseDesc"),
            });
        } finally {
            // 清理 ref:仅当仍是当前控制器时清空(避免新请求被误清)
            if (parseAbortRef.current === controller) {
                parseAbortRef.current = null;
            }
        }
    };

    // Cancel current parse
    const handleCancel = () => {
        parseAbortRef.current?.abort();
    };

    // Key press (Enter)
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleParse();
        }
    };

    // Paste from clipboard
    const handlePaste = async () => {
        if (status === "loading") return;
        try {
            if (
                navigator.clipboard &&
                typeof navigator.clipboard.readText === "function"
            ) {
                const text = await navigator.clipboard.readText();
                if (text && text.trim()) {
                    setInputText(text.trim());
                } else {
                    setPasteError(true);
                }
            } else {
                setPasteError(true);
            }
        } catch (err) {
            console.warn("Clipboard read failed:", err);
            setPasteError(true);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-red-100">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-xhs-red rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
                            X
                        </div>
                        <h1 className="font-bold text-lg tracking-tight hidden sm:block">
                            {t(language, "appTitle")}
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

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">
                {/* Input Section */}
                <div className="max-w-2xl mx-auto mb-12">
                    <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-2 border border-gray-100 transition-all focus-within:ring-4 focus-within:ring-red-50 focus-within:border-red-200">
                        <div className="relative">
                            <div className="absolute top-3 left-3 text-gray-400">
                                <Link2 size={20} />
                            </div>
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={t(language, "inputPlaceholder")}
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
                                disabled={status === "loading"}
                                className="flex items-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 px-4 py-2.5 rounded-xl font-medium transition-all min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                            >
                                <ClipboardPaste size={18} />
                                {t(language, "pasteBtn")}
                            </button>
                            <button
                                onClick={
                                    status === "loading"
                                        ? handleCancel
                                        : handleParse
                                }
                                disabled={
                                    status !== "loading" &&
                                    !inputText.trim()
                                }
                                className={
                                    status === "loading"
                                        ? "flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2.5 rounded-xl font-medium transition-all min-h-[44px] active:scale-95"
                                        : "flex items-center gap-2 bg-xhs-red hover:bg-red-600 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-red-200 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed active:scale-95"
                                }
                            >
                                {status === "loading" ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                                        {t(language, "cancel")}
                                    </>
                                ) : (
                                    <>
                                        <Search size={18} />
                                        {t(language, "parseBtn")}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <HistoryPanel
                        items={historyItems}
                        onPick={handleHistoryPick}
                        onClear={clearHistory}
                        onRemove={removeHistory}
                        language={language}
                    />

                    {status === "error" && appError && (
                        <div
                            className={
                                appError.category === "network"
                                    ? "mt-4 p-4 bg-red-50 text-red-600 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2"
                                    : appError.category === "backend"
                                      ? "mt-4 p-4 bg-amber-50 text-amber-700 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2"
                                      : "mt-4 p-4 bg-blue-50 text-blue-700 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2"
                            }
                        >
                            <AlertCircle
                                size={20}
                                className="shrink-0 mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold">
                                    {appError.title}
                                </p>
                                <p className="text-sm mt-1 opacity-90 break-words">
                                    {appError.message}
                                </p>
                            </div>
                        </div>
                    )}

                    {pasteError && (
                        <div className="mt-4 p-3 bg-amber-50 text-amber-700 rounded-xl flex items-center gap-2 text-sm animate-in fade-in slide-in-from-top-2">
                            <AlertCircle size={16} className="shrink-0" />
                            {t(language, "pasteFailed")}
                        </div>
                    )}
                </div>

                {/* Results Section */}
                {result && result.data && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Left Col: Metadata */}
                            <div className="lg:col-span-5 space-y-6">
                                <ResultCard
                                    data={result.data}
                                    language={language}
                                />
                            </div>

                            {/* Right Col: Media */}
                            <div className="lg:col-span-7">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                    <MediaGrid
                                        data={result.data}
                                        language={language}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="py-8 text-center text-gray-400 text-xs">
                <p>
                    © {new Date().getFullYear()} XHS Downloader UI. MIT License.
                </p>
            </footer>
        </div>
    );
}

export default App;