// components/config-panel.tsx
'use client';

import { useEffect, useState } from 'react';
import { Settings, Key, Layers, Ratio, Clock } from 'lucide-react';
import type { AspectRatio } from '../type';
import { Eye, EyeOff } from "lucide-react";

interface ConfigPanelProps {
  config: {
    geminiApiKey: string;
    batchSize: number;
    aspectRatio: AspectRatio;
    durationSeconds: number;
  };
  onConfigChange: (config: {
    geminiApiKey: string;
    batchSize: number;
    aspectRatio: AspectRatio;
    durationSeconds: number;
  }) => void;
}

export function ConfigPanel({ config, onConfigChange }: ConfigPanelProps) {
  // Load saved config từ localStorage khi component mount
  useEffect(() => {
    const savedApiKey = sessionStorage.getItem('veoApiKey');
    const savedConfig = localStorage.getItem('veoConfig');

    if (savedApiKey || savedConfig) {
      onConfigChange({
        geminiApiKey: savedApiKey || config.geminiApiKey,
        ...(savedConfig ? JSON.parse(savedConfig) : {
          batchSize: config.batchSize,
          aspectRatio: config.aspectRatio,
          durationSeconds: config.durationSeconds,
        }),
      });
    }
  }, []);

  const handleChange = (field: keyof typeof config, value: string | number) => {
    const newConfig = { ...config, [field]: value };
    onConfigChange(newConfig);
  };
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="p-6 bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="text-cyan-400" size={24} />
        <h2 className="text-xl font-semibold text-white">Configuration</h2>
      </div>

      {/* API Key */}
      {/* API Key */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
          <Key size={16} className="text-cyan-400" />
          Gemini API Key
        </label>

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={config.geminiApiKey}
            onChange={(e) => handleChange('geminiApiKey', e.target.value)}
            placeholder="Enter your Gemini API key"
            className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Get your API key from{" "}
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 underline"
          >
            Google AI Studio
          </a>
        </p>
      </div>


      {/* Batch Size */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
          <Layers size={16} className="text-cyan-400" />
          Batch Delay (seconds)
        </label>
        <input
          type="number"
          min="1"
          max="60"
          value={config.batchSize}
          onChange={(e) => handleChange('batchSize', parseInt(e.target.value) || 5)}
          className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
        />
        <p className="text-xs text-slate-500">
          Delay between video generation requests (prevents rate limiting)
        </p>
      </div>

      {/* Aspect Ratio */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
          <Ratio size={16} className="text-cyan-400" />
          Aspect Ratio
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleChange('aspectRatio', '16:9')}
            className={`px-4 py-2 rounded-lg font-medium transition ${config.aspectRatio === '16:9'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
          >
            16:9 (Landscape)
          </button>
          <button
            onClick={() => handleChange('aspectRatio', '9:16')}
            className={`px-4 py-2 rounded-lg font-medium transition ${config.aspectRatio === '9:16'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
          >
            9:16 (Portrait)
          </button>
        </div>
      </div>

      {/* Duration */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
          <Clock size={16} className="text-cyan-400" />
          Video Duration (seconds)
        </label>
        <input
          type="number"
          min="5"
          max="8"
          value={config.durationSeconds}
          onChange={(e) => handleChange('durationSeconds', parseInt(e.target.value) || 8)}
          className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
        />
        <p className="text-xs text-slate-500">
          Duration for each video scene (5-30 seconds)
        </p>
      </div>

      {/* Status Info */}
      <div className="pt-4 border-t border-slate-700">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">API Status:</span>
          <span
            className={`px-2 py-1 rounded-full font-medium ${config.geminiApiKey
                ? 'bg-green-900/50 text-green-400'
                : 'bg-red-900/50 text-red-400'
              }`}
          >
            {config.geminiApiKey ? '● Connected' : '○ Not Configured'}
          </span>
        </div>
      </div>
    </div>
  );
}