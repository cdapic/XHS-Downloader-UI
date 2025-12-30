import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Languages, Link2, Search, AlertCircle } from 'lucide-react';
import { Settings, Language, ParseStatus, XHSApiResponse } from './types';
import { DEFAULT_API_URL, DEMO_API_KEY } from './constants';
import { parseXHSLink } from './services/xhsService';
import { t } from './utils/i18n';
import { SettingsModal } from './components/SettingsModal';
import { ResultCard } from './components/ResultCard';
import { MediaGrid } from './components/MediaGrid';

function App() {
  // State
  const [language, setLanguage] = useState<Language>(Language.ZH);
  const [settings, setSettings] = useState<Settings>({ apiUrl: DEFAULT_API_URL });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [inputText, setInputText] = useState('');
  const [status, setStatus] = useState<ParseStatus>('idle');
  const [result, setResult] = useState<XHSApiResponse | null>(null);

  // Load settings from local storage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('xhs_settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Save settings when changed
  const handleSaveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    localStorage.setItem('xhs_settings', JSON.stringify(newSettings));
  };

  // Toggle Language
  const toggleLanguage = () => {
    setLanguage(prev => prev === Language.ZH ? Language.EN : Language.ZH);
  };

  // Parse Action
  const handleParse = async () => {
    if (!inputText.trim()) return;

    setStatus('loading');
    setResult(null);

    try {
      const data = await parseXHSLink(inputText, settings.apiUrl);
      if (data && data.data) {
        setResult(data);
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
  };

  // Key press (Enter)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleParse();
    }
  };

  const isDemoMode = settings.apiUrl === DEMO_API_KEY;

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
              {t(language, 'appTitle')}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={toggleLanguage}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
              title="Switch Language"
            >
              <Languages size={20} />
              <span className="text-xs font-medium uppercase">{language}</span>
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
            <span className="font-bold">{t(language, 'demoMode')}:</span> 
            {t(language, 'demoModeDesc')}
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
                placeholder={t(language, 'inputPlaceholder')}
                className="w-full pl-10 pr-4 py-3 min-h-[60px] max-h-[120px] outline-none text-gray-700 placeholder:text-gray-400 resize-none bg-transparent"
                rows={2}
              />
            </div>
            <div className="flex justify-end px-2 pb-2">
              <button
                onClick={handleParse}
                disabled={status === 'loading' || !inputText.trim()}
                className="flex items-center gap-2 bg-xhs-red hover:bg-red-600 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-red-200 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed active:scale-95"
              >
                {status === 'loading' ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Search size={18} />
                )}
                {status === 'loading' ? t(language, 'parsing') : t(language, 'parseBtn')}
              </button>
            </div>
          </div>

          {status === 'error' && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={20} className="shrink-0" />
              <div>
                <p className="font-semibold">{t(language, 'errorTitle')}</p>
                <p className="text-sm opacity-80">{t(language, 'errorDesc')}</p>
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
                <ResultCard data={result.data} language={language} />
              </div>

              {/* Right Col: Media */}
              <div className="lg:col-span-7">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <MediaGrid data={result.data} language={language} />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-400 text-xs">
        <p>© {new Date().getFullYear()} XHS Downloader UI. MIT License.</p>
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