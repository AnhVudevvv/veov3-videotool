// app/page.tsx (UPDATED)
'use client';

import { useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { ConfigPanel } from '@/components/config-panel';
import { PromptUploader } from '@/components/prompt-uploader';
import { BatchProcessor } from '@/components/batch-processor'; // Ultimate version
import { ProgressDashboard } from '@/components/progress-dashboard';
import { VideoDownloader } from '@/components/video-downloader';
import { UltimateVideoMerger } from '@/components/UltimateVideoMerger'; // NEW
import type { AspectRatio } from '../type';

interface AppConfig {
  geminiApiKey: string;
  batchSize: number;
  aspectRatio: AspectRatio;
  durationSeconds: number;
}

export default function Home() {
  const [config, setConfig] = useState<AppConfig>({
    geminiApiKey: '',
    batchSize: 5,
    aspectRatio: '16:9',
    durationSeconds: 8,
  });

  const [scenes, setScenes] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<number>(Date.now());

  const handleConfigChange = (newConfig: AppConfig) => {
    setConfig(newConfig);
    sessionStorage.setItem('veoApiKey', newConfig.geminiApiKey);
    localStorage.setItem(
      'veoConfig',
      JSON.stringify({
        batchSize: newConfig.batchSize,
        aspectRatio: newConfig.aspectRatio,
        durationSeconds: newConfig.durationSeconds,
      })
    );
  };

  const handlePromptParsed = (parsedScenes: string[]) => {
    console.log('[App] 🔄 New prompt uploaded - Resetting all state');
    
    setScenes(parsedScenes);
    setVideoUrls([]);
    setErrors([]);
    setIsProcessing(false);
    setSessionId(Date.now());
  };

  const handleBatchComplete = (newUrl: string) => {
    setVideoUrls((prev) => [...prev, newUrl]);
  };

  const handleError = (errorMsg: string) => {
    setErrors((prev) => [...prev, errorMsg]);
  };

  const handleManualReset = () => {
    console.log('[App] 🔄 Manual reset triggered');
    setScenes([]);
    setVideoUrls([]);
    setErrors([]);
    setIsProcessing(false);
    setSessionId(Date.now());
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mb-3 animate-pulse">
            Veo 3 Ultimate Video Generator
          </h1>
          <p className="text-slate-300 text-sm flex items-center justify-center gap-2">
            <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Image-to-Video Continuity + Crossfade Transitions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN - SETUP */}
          <div className="space-y-6">
            <ConfigPanel 
              config={config} 
              onConfigChange={handleConfigChange} 
            />
            <PromptUploader 
              onPromptParsed={handlePromptParsed} 
              disabled={isProcessing} 
            />
            
            {(scenes.length > 0 || videoUrls.length > 0) && !isProcessing && (
              <button
                onClick={handleManualReset}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 border border-slate-600 hover:border-slate-500"
              >
                <RefreshCw size={18} />
                Reset All (Start New Project)
              </button>
            )}
          </div>

          {/* RIGHT COLUMN - PROCESSING & RESULTS */}
          <div className="space-y-6">
            <BatchProcessor
              key={sessionId}
              scenes={scenes}
              config={config}
              batchSize={config.batchSize}
              onBatchComplete={handleBatchComplete}
              onProcessingStart={() => {
                setIsProcessing(true);
                setErrors([]);
              }}
              onProcessingEnd={() => setIsProcessing(false)}
              onError={handleError}
              disabled={
                isProcessing || 
                scenes.length === 0 || 
                !config.geminiApiKey
              }
            />

            {errors.length > 0 && (
              <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg space-y-2">
                <h3 className="font-semibold text-red-400 flex items-center gap-2">
                  <AlertTriangle size={16} /> Errors
                </h3>
                <ul className="list-disc list-inside text-sm text-red-300 max-h-32 overflow-y-auto">
                  {errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}

            <ProgressDashboard
              progress={{
                completed: videoUrls.length,
                total: scenes.length,
                currentBatch: 0,
                videoUrls: videoUrls,
              }}
              isProcessing={isProcessing}
            />

            {/* ULTIMATE VIDEO MERGER - PRIORITY #1 */}
            {videoUrls.length > 0 && !isProcessing && (
              <>
                <UltimateVideoMerger
                  videoUrls={videoUrls}
                  apiKey={config.geminiApiKey}
                  disabled={isProcessing}
                  durationSeconds={config.durationSeconds}
                  crossfadeDuration={0.3}
                />
                
                {/* Individual downloads - secondary */}
                <VideoDownloader
                  videoUrls={videoUrls}
                  apiKey={config.geminiApiKey}
                />
              </>
            )}
          </div>
        </div>

        {/* FOOTER INFO */}
        <div className="mt-12 p-6 bg-gradient-to-r from-purple-900/40 via-pink-900/40 to-orange-900/40 border-2 border-purple-500/50 rounded-lg shadow-2xl">
          <h3 className="text-xl font-bold text-purple-300 mb-4 flex items-center gap-2">
            <span className="text-2xl">🎬</span>
            How Ultimate Processing Works
          </h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm text-slate-300">
            <div className="space-y-3 bg-slate-800/50 p-4 rounded-lg border border-slate-700">
              <div className="text-cyan-400 font-bold text-base flex items-center gap-2">
                <span className="text-xl">1️⃣</span> Extract Context + Frame
              </div>
              <p className="leading-relaxed">
                Scene 1 được phân tích chi tiết về setting, lighting, camera. 
                <strong className="text-white"> Frame cuối được lưu lại</strong> làm reference.
              </p>
            </div>
            <div className="space-y-3 bg-slate-800/50 p-4 rounded-lg border border-slate-700">
              <div className="text-cyan-400 font-bold text-base flex items-center gap-2">
                <span className="text-xl">2️⃣</span> Image-to-Video Chain
              </div>
              <p className="leading-relaxed">
                <strong className="text-white">Frame cuối của video trước</strong> được dùng làm 
                điểm bắt đầu cho video tiếp theo, đảm bảo continuity hoàn hảo.
              </p>
            </div>
            <div className="space-y-3 bg-slate-800/50 p-4 rounded-lg border border-slate-700">
              <div className="text-cyan-400 font-bold text-base flex items-center gap-2">
                <span className="text-xl">3️⃣</span> Crossfade + Re-encode
              </div>
              <p className="leading-relaxed">
                Videos được ghép với <strong className="text-white">fade transitions</strong> và 
                re-encode sang H.264 để chạy mượt trên mọi thiết bị.
              </p>
            </div>
          </div>
        </div>

        {/* READY INDICATOR */}
        {scenes.length > 0 && videoUrls.length === 0 && !isProcessing && (
          <div className="mt-6 p-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-2 border-green-500/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse" />
              <div className="text-sm text-green-300">
                <strong className="text-white text-base">Ready to start!</strong> {scenes.length} scene{scenes.length > 1 ? 's' : ''} loaded with ultimate processing enabled.
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}