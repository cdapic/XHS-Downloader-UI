import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw } from 'lucide-react';
import { Settings, Language } from '../types';
import { t } from '../utils/i18n';
import { DEFAULT_API_URL } from '../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSave: (newSettings: Settings) => void;
  language: Language;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  language,
}) => {
  const [localApiUrl, setLocalApiUrl] = useState(settings.apiUrl);

  useEffect(() => {
    setLocalApiUrl(settings.apiUrl);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleReset = () => {
    setLocalApiUrl(DEFAULT_API_URL);
  };

  const handleSave = () => {
    onSave({ ...settings, apiUrl: localApiUrl });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            {t(language, 'settings')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t(language, 'apiUrlLabel')}
            </label>
            <input
              type="text"
              value={localApiUrl}
              onChange={(e) => setLocalApiUrl(e.target.value)}
              placeholder="e.g., http://localhost:8000"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-xhs-red focus:border-transparent outline-none transition-all"
            />
            <p className="text-xs text-gray-400 mt-2">
              Default: {DEFAULT_API_URL} | Demo: demo
            </p>
          </div>
        </div>

        <div className="p-4 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
          >
            <RotateCcw size={16} />
            {t(language, 'reset')}
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-xhs-red text-white rounded-lg hover:bg-red-600 shadow-md shadow-red-200 transition-colors text-sm font-medium"
          >
            <Save size={16} />
            {t(language, 'save')}
          </button>
        </div>
      </div>
    </div>
  );
};