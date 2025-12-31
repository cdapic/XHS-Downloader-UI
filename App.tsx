import React, { useState, useEffect } from "react";
import {
    Settings as SettingsIcon,
    Languages,
    Link2,
    Search,
    AlertCircle,
    Info,
} from "lucide-react";
import { Settings, Language, ParseStatus, XHSApiResponse } from "./types";
import { DEFAULT_API_URL, DEMO_API_KEY } from "./constants";
import { parseXHSLink } from "./services/xhsService";
import { t } from "./utils/i18n";
import { SettingsModal } from "./components/SettingsModal";
import { ResultCard } from "./components/ResultCard";
import { MediaGrid } from "./components/MediaGrid";

function App() {
    // State
    const [language, setLanguage] = useState<Language>(Language.ZH);
    const [settings, setSettings] = useState<Settings>({
        apiUrl: DEFAULT_API_URL,
    });
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const [inputText, setInputText] = useState("");
    const [status, setStatus] = useState<ParseStatus>("idle");
    const [result, setResult] = useState<XHSApiResponse | null>(null);

    // Notification State
    const [notification, setNotification] = useState<{
        show: boolean;
        message: string;
    } | null>(null);

    // Initialization Logic: Load settings & Auto-detect API URL
    useEffect(() => {
        const savedSettingsStr = localStorage.getItem("xhs_settings");
        let settingsToUse: Settings = { apiUrl: DEFAULT_API_URL };

        if (savedSettingsStr) {
            try {
                settingsToUse = JSON.parse(savedSettingsStr);
            } catch (e) {
                console.error("Failed to parse settings", e);
            }
        }

        // Smart Auto-Discovery Logic
        // If the app is accessed via a non-localhost IP (e.g., LAN 192.168.x.x, VPN 100.x.x.x),
        // automatically configure the API URL to match that IP on port 5556 with /xhs/detail path.
        const hostname = window.location.hostname;
        const isLocalhost =
            hostname === "localhost" || hostname === "127.0.0.1";

        if (!isLocalhost) {
            // User requirement: specific port 5556 and path /xhs/detail for network IPs
            const autoUrl = `http://${hostname}:5556/xhs/detail`;

            // If the current saved URL is different from the auto-detected one, update it
            // This handles moving between networks (e.g. from 192.168.1.5 to 10.0.0.5)
            if (settingsToUse.apiUrl !== autoUrl) {
                settingsToUse = { ...settingsToUse, apiUrl: autoUrl };

                // Save to local storage immediately
                localStorage.setItem(
                    "xhs_settings",
                    JSON.stringify(settingsToUse),
                );

                // Trigger notification
                setNotification({
                    show: true,
                    message: `${t(language, "apiAutoUpdated")}${autoUrl}`,
                });

                // Auto hide notification
                setTimeout(() => setNotification(null), 5000);
            }
        }

        setSettings(settingsToUse);
    }, [language]); // Depend on language so the initial toast (if any) could potentially use correct lang if set early, though usually lang is set after.

    // Save settings when changed manually
    const handleSaveSettings = (newSettings: Settings) => {
        setSettings(newSettings);
        localStorage.setItem("xhs_settings", JSON.stringify(newSettings));
    };

    // Toggle Language
    const toggleLanguage = () => {
        setLanguage((prev) =>
            prev === Language.ZH ? Language.EN : Language.ZH,
        );
    };

    // Parse Action
    const handleParse = async () => {
        if (!inputText.trim()) return;

        setStatus("loading");
        setResult(null);

        try {
            const data = await parseXHSLink(inputText, settings.apiUrl);
            if (data && data.data) {
                setResult(data);
                setStatus("success");
            } else {
                setStatus("error");
            }
        } catch (error) {
            setStatus("error");
        }
    };

    // Key press (Enter)
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleParse();
        }
    };

    const isDemoMode = settings.apiUrl === DEMO_API_KEY;

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-red-100">
            {/* Toast Notification */}
            {notification && notification.show && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300 w-[90%] max-w-md">
                    <div className="bg-gray-800 text-white px-4 py-3 rounded-lg shadow-xl flex items-start gap-3 border border-gray-700">
                        <Info
                            className="text-blue-400 shrink-0 mt-0.5"
                            size={20}
                        />
                        <div className="flex-1 text-sm leading-relaxed break-all">
                            {notification.message}
                        </div>
                        <button
                            onClick={() => setNotification(null)}
                            className="text-gray-400 hover:text-white shrink-0"
                        >
                            <span className="sr-only">Close</span>×
                        </button>
                    </div>
                </div>
            )}

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
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
                            title="Switch Language"
                        >
                            <Languages size={20} />
                            <span className="text-xs font-medium uppercase">
                                {language}
                            </span>
                        </button>
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Settings"
                        >
                            <SettingsIcon size={20} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Demo Mode Banner */}
            {isDemoMode && (
                <div className="bg-blue-50 border-b border-blue-100 py-2 px-4 text-center">
                    <p className="text-xs font-medium text-blue-600 flex items-center justify-center gap-2">
                        <AlertCircle size={14} />
                        <span className="font-bold">
                            {t(language, "demoMode")}:
                        </span>
                        {t(language, "demoModeDesc")}
                    </p>
                </div>
            )}

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
                            />
                        </div>
                        <div className="flex justify-end px-2 pb-2">
                            <button
                                onClick={handleParse}
                                disabled={
                                    status === "loading" || !inputText.trim()
                                }
                                className="flex items-center gap-2 bg-xhs-red hover:bg-red-600 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-red-200 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed active:scale-95"
                            >
                                {status === "loading" ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Search size={18} />
                                )}
                                {status === "loading"
                                    ? t(language, "parsing")
                                    : t(language, "parseBtn")}
                            </button>
                        </div>
                    </div>

                    {status === "error" && (
                        <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle size={20} className="shrink-0" />
                            <div>
                                <p className="font-semibold">
                                    {t(language, "errorTitle")}
                                </p>
                                <p className="text-sm opacity-80">
                                    {t(language, "errorDesc")}
                                </p>
                                <p className="text-xs mt-1 text-red-400 font-mono break-all">
                                    {settings.apiUrl}
                                </p>
                            </div>
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

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                settings={settings}
                onSave={handleSaveSettings}
                language={language}
            />
        </div>
    );
}

export default App;
