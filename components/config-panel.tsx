// components/ConfigPanel.tsx
'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { AspectRatio } from '../type'; // Bạn cần tạo file này

// Tạo file 'src/types.ts' (hoặc 'types.ts' ở gốc)
// export type AspectRatio = '16:9' | '9:16';

interface ConfigPanelProps {
  config: {
    geminiApiKey: string;
    batchSize: number;
    aspectRatio: string;
  };
  onConfigChange: (config: any) => void;
}

export function ConfigPanel({ config, onConfigChange }: ConfigPanelProps) {
  const [showKey, setShowKey] = useState(false);
  const [localConfig, setLocalConfig] = useState(config);

  useEffect(() => {
    // Tải config (không có key) từ localStorage
    const saved = localStorage.getItem('veoConfig');
    // Tải key từ sessionStorage
    const apiKey = sessionStorage.getItem('veoApiKey');
    
    let needsUpdate = false;
    let newConfig = { ...localConfig };

    if (saved) {
      const parsed = JSON.parse(saved);
      newConfig = { ...newConfig, ...parsed };
      needsUpdate = true;
    }
    
    if (apiKey) {
      newConfig.geminiApiKey = apiKey;
      needsUpdate = true;
    }

    if (needsUpdate) {
      setLocalConfig(newConfig);
      onConfigChange(newConfig);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (field: string, value: string | number) => {
    const updated = { ...localConfig, [field]: value };
    setLocalConfig(updated);
    onConfigChange(updated);
  };

  return (
    <div className="p-6 bg-slate-800 border border-slate-700 rounded-lg">
      <h2 className="text-lg font-semibold text-white mb-6">API Configuration</h2>

      <div className="space-y-4">
        {/* Gemini API Key */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Gemini API Key
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={localConfig.geminiApiKey}
              onChange={(e) => handleChange('geminiApiKey', e.target.value)}
              placeholder="Enter Gemini API Key"
              className="w-full pr-10 px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Lấy từ aistudio.google.com
          </p>
        </div>

        {/* Xóa Labs Project ID */}
        {/* Xóa Labs Token */}

        {/* Aspect Ratio */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Aspect Ratio
          </label>
          <div className="flex gap-2">
            {(['16:9', '9:16'] as const).map(ratio => (
              <button
                key={ratio}
                onClick={() => handleChange('aspectRatio', ratio)}
                className={`flex-1 p-2 rounded-md text-sm font-semibold transition-colors ${
                  localConfig.aspectRatio === ratio
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
              >
                {ratio === '16:9' ? 'Landscape (16:9)' : 'Portrait (9:16)'}
              </button>
            ))}
          </div>
        </div>

        {/* Batch Size */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Batch Size
          </label>
          <input
            type="number"
            value={localConfig.batchSize}
            onChange={(e) => handleChange('batchSize', parseInt(e.target.value))}
            min="1"
            max="10"
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white"
          />
          <p className="text-xs text-slate-500 mt-1">
            Số cảnh xử lý mỗi lần (1-10)
          </p>
        </div>

        <div className="pt-4 border-t border-slate-700">
          <p className="text-xs text-slate-400">
            ✓ Config (ngoại trừ API key) được lưu vào local storage.
          </p>
        </div>
      </div>
    </div>
  );
}