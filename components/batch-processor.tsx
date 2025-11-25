// components/BatchProcessor.tsx
'use client';

import { useState } from 'react';
import { Zap, Pause, Play } from 'lucide-react';
import React from 'react';

interface BatchProcessorProps {
  scenes: string[];
  config: {
    geminiApiKey: string;
    batchSize: number;
    aspectRatio: string;
    globalContext: string;
  };
  onBatchComplete: (videoUrl: string) => void;
  onProcessingStart: () => void;
  onProcessingEnd: () => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export function BatchProcessor({
  scenes,
  config,
  onBatchComplete,
  onProcessingStart,
  onProcessingEnd,
  onError,
  disabled,
}: BatchProcessorProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>('');

  const isPausedRef = React.useRef(isPaused);
  React.useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const generateVideoForScene = async (sceneDescription: string): Promise<string> => {
    try {
      setCurrentStatus(`Đang tạo: ${sceneDescription.substring(0, 50)}...`);

      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: sceneDescription,
          geminiApiKey: config.geminiApiKey,
          aspectRatio: config.aspectRatio,
          sceneContext: config.globalContext,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Video generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.gcsUrl;
    } catch (error) {
      throw new Error(`Failed to generate video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const processBatch = async (batchScenes: string[]) => {
    const promises = batchScenes.map(scene => generateVideoForScene(scene));
    const results = await Promise.allSettled(promises);

    for (let i = 0; i < results.length; i++) {
      if (isPausedRef.current) break;

      const result = results[i];
      const scene = batchScenes[i];

      if (result.status === 'fulfilled') {
        onBatchComplete(result.value);
      } else {
        const errorMsg = result.reason instanceof Error ? result.reason.message : 'Unknown error';
        onError(`Lỗi cảnh "${scene.substring(0, 30)}...": ${errorMsg}`);
      }
    }
  };

  const handleStartProcessing = async () => {
    onProcessingStart();
    setIsPaused(false);

    try {
      const totalBatches = Math.ceil(scenes.length / config.batchSize);

      for (let i = 0; i < totalBatches; i++) {
        if (isPausedRef.current) {
          break;
        }

        setCurrentStatus(`Đang xử lý batch ${i + 1}/${totalBatches}`);

        const start = i * config.batchSize;
        const end = Math.min(start + config.batchSize, scenes.length);
        const batchScenes = scenes.slice(start, end);

        await processBatch(batchScenes);

        if (i < totalBatches - 1 && !isPausedRef.current) {
          setCurrentStatus(`Đang chờ 60s (tránh rate limit)...`);
          await new Promise((resolve) => setTimeout(resolve, 60000));
        }
      }

      if (isPaused) {
        setCurrentStatus('Tạm dừng.');
      } else {
        setCurrentStatus('Tất cả video đã được tạo!');
      }
    } catch (error) {
      console.error("Batch processing failed:", error);
      onError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      onProcessingEnd();
    }
  };

  const totalBatches = Math.ceil(scenes.length / config.batchSize);

  return (
    <div className="p-6 bg-slate-800 border border-slate-700 rounded-lg">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-2">Batch Processing</h3>
        <p className="text-slate-400 text-sm">
          {scenes.length} scenes will be processed in {totalBatches} batch{totalBatches !== 1 ? 'es' : ''} ({config.batchSize} per batch)
        </p>
        {currentStatus && (
          <p className="text-cyan-400 text-sm mt-2">{currentStatus}</p>
        )}
        
        {config.globalContext && (
          <div className="mt-3 p-3 bg-purple-900/20 border border-purple-500/30 rounded">
            <p className="text-xs text-purple-300 font-semibold mb-1">
              ✨ Using Global Context:
            </p>
            <p className="text-xs text-slate-400 line-clamp-3">
              {config.globalContext}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {Array.from({ length: totalBatches }).map((_, i) => {
          const start = i * config.batchSize;
          const end = Math.min(start + config.batchSize, scenes.length);
          return (
            <div
              key={i}
              className="p-3 bg-slate-700 rounded border border-slate-600"
            >
              <p className="text-sm text-slate-300">
                Batch {i + 1}: Scenes {start + 1}-{end}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {scenes.slice(start, end).map((s) => s.substring(0, 40) + '...').join(', ')}
              </p>
            </div>
          );
        })}
      </div>
      
      <div className="flex gap-3 mt-6">
        <button
          onClick={handleStartProcessing}
          disabled={disabled || isPaused}
          className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium disabled:bg-slate-600 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
        >
          <Zap size={16} />
          Start Processing
        </button>
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="border border-slate-600 text-slate-300 hover:bg-slate-700 px-4 py-2 rounded-lg transition"
        >
          {isPaused ? <Play size={16} /> : <Pause size={16} />}
        </button>
      </div>
    </div>
  );
}