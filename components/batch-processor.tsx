// components/batch-processor.tsx (ULTIMATE VERSION)
'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Loader2, AlertCircle, Film } from 'lucide-react';

interface BatchProcessorProps {
  scenes: string[];
  config: any;
  batchSize: number;
  onBatchComplete: (url: string) => void;
  onProcessingStart: () => void;
  onProcessingEnd: () => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export function BatchProcessor({
  scenes,
  config,
  batchSize,
  onBatchComplete,
  onProcessingStart,
  onProcessingEnd,
  onError,
  disabled
}: BatchProcessorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [sceneContext, setSceneContext] = useState<string | null>(null);
  const [lastFrameBase64, setLastFrameBase64] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const shouldContinue = useRef(true);

  const processScene = async (sceneIndex: number) => {
    const isFirstScene = sceneIndex === 0;
    const prompt = scenes[sceneIndex];

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🎬 SCENE ${sceneIndex + 1}/${scenes.length}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Prompt: ${prompt.substring(0, 100)}...`);

    try {
      setLastError(null);
      setProcessingStatus(`Scene ${sceneIndex + 1}: Generating video...`);

      // ═══════════════════════════════════════════════
      // STEP 1: GENERATE VIDEO (với last frame nếu có)
      // ═══════════════════════════════════════════════
      console.log('📹 Step 1: Generate video');
      if (lastFrameBase64 && !isFirstScene) {
        console.log('   ✓ Using last frame from previous video for continuity');
      }

      const generateResponse = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          geminiApiKey: config.geminiApiKey,
          aspectRatio: config.aspectRatio,
          durationSeconds: config.durationSeconds,
          sceneContext: isFirstScene ? null : sceneContext,
          isFirstScene,
          referenceImage: isFirstScene ? null : lastFrameBase64,
        }),
      });

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Video generation failed');
      }

      const { gcsUrl, usedReferenceImage } = await generateResponse.json();
      console.log(`   ✓ Video generated${usedReferenceImage ? ' (with frame continuity)' : ''}`);
      console.log(`   URL: ${gcsUrl.substring(0, 60)}...`);
      
      onBatchComplete(gcsUrl);

      // ═══════════════════════════════════════════════
      // STEP 2: EXTRACT CONTEXT (chỉ scene đầu)
      // ═══════════════════════════════════════════════
      if (isFirstScene) {
        setProcessingStatus(`Scene ${sceneIndex + 1}: Extracting visual context...`);
        console.log('📝 Step 2: Extract visual context');
        
        try {
          const contextResponse = await fetch('/api/extract-context', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt,
              geminiApiKey: config.geminiApiKey,
            }),
          });

          if (contextResponse.ok) {
            const { context } = await contextResponse.json();
            setSceneContext(context);
            console.log('   ✓ Context extracted:', context.substring(0, 150) + '...');
          }
        } catch (err) {
          console.warn('   ⚠️ Context extraction failed, continuing...');
        }
      }

      // ═══════════════════════════════════════════════
      // STEP 3: EXTRACT LAST FRAME (cho scene tiếp theo)
      // ═══════════════════════════════════════════════
      if (sceneIndex < scenes.length - 1) {
        setProcessingStatus(`Scene ${sceneIndex + 1}: Extracting last frame...`);
        console.log('🖼️ Step 3: Extract last frame for next scene');
        
        try {
          const frameResponse = await fetch('/api/extract-last-frame', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              videoUrl: gcsUrl,
              geminiApiKey: config.geminiApiKey,
            }),
          });

          if (frameResponse.ok) {
            const { imageBase64 } = await frameResponse.json();
            setLastFrameBase64(imageBase64);
            console.log('   ✓ Last frame extracted for continuity');
          } else {
            console.warn('   ⚠️ Frame extraction failed, will use context only');
            setLastFrameBase64(null);
          }
        } catch (err) {
          console.warn('   ⚠️ Frame extraction error:', err);
          setLastFrameBase64(null);
        }
      }

      console.log(`✅ Scene ${sceneIndex + 1} COMPLETED\n`);
      setProcessingStatus('');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Scene ${sceneIndex + 1} FAILED:`, error);
      
      setLastError(errorMessage);
      onError(`Scene ${sceneIndex + 1}: ${errorMessage}`);
      setProcessingStatus('');
      
      throw error;
    }
  };

  const startProcessing = async () => {
    if (scenes.length === 0) return;

    setIsProcessing(true);
    setIsPaused(false);
    setLastError(null);
    shouldContinue.current = true;
    onProcessingStart();

    console.log('\n╔═══════════════════════════════════════════════╗');
    console.log('║  🎬 ULTIMATE BATCH PROCESSING START           ║');
    console.log('╚═══════════════════════════════════════════════╝');
    console.log(`📹 Total scenes: ${scenes.length}`);
    console.log(`⚙️  Mode: Image-to-Video Continuity`);
    console.log('');

    try {
      for (let i = currentSceneIndex; i < scenes.length; i++) {
        if (!shouldContinue.current) {
          console.log('⏸️ Processing paused');
          setIsPaused(true);
          setCurrentSceneIndex(i);
          return;
        }

        setCurrentSceneIndex(i);
        await processScene(i);
      }

      console.log('\n╔═══════════════════════════════════════════════╗');
      console.log('║  ✅ ALL SCENES COMPLETED SUCCESSFULLY         ║');
      console.log('╚═══════════════════════════════════════════════╝\n');

      setCurrentSceneIndex(0);
      setSceneContext(null);
      setLastFrameBase64(null);
      
    } catch (error) {
      console.error('❌ Fatal error:', error);
    } finally {
      setIsProcessing(false);
      setIsPaused(false);
      onProcessingEnd();
    }
  };

  const pauseProcessing = () => {
    shouldContinue.current = false;
  };

  const resumeProcessing = () => {
    startProcessing();
  };

  useEffect(() => {
    setCurrentSceneIndex(0);
    setSceneContext(null);
    setLastFrameBase64(null);
    setIsProcessing(false);
    setIsPaused(false);
    setLastError(null);
  }, [scenes]);

  return (
    <div className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Film size={20} className="text-cyan-400" />
          Ultimate Batch Processing
        </h3>
        {lastFrameBase64 && isProcessing && (
          <div className="flex items-center gap-2 text-xs bg-green-900/30 text-green-400 px-3 py-1 rounded-full border border-green-700">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>Frame Continuity Active</span>
          </div>
        )}
      </div>

      {scenes.length > 0 && (
        <div className="mb-4 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-3">
              <span className="text-slate-300">📹 {scenes.length} scenes</span>
              {isProcessing && (
                <span className="text-cyan-400 font-medium">
                  Processing: {currentSceneIndex + 1}/{scenes.length}
                </span>
              )}
            </div>
          </div>
          
          {sceneContext && (
            <div className="mt-2 flex items-center gap-2 text-xs text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              Visual context locked from Scene 1
            </div>
          )}
        </div>
      )}

      {lastError && (
        <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-lg">
          <div className="flex items-center gap-2 text-red-300 mb-2">
            <AlertCircle size={18} />
            <span className="font-semibold">Error</span>
          </div>
          <div className="text-sm text-red-200 font-mono bg-red-950/50 p-2 rounded">
            {lastError}
          </div>
        </div>
      )}

      {processingStatus && (
        <div className="mb-4 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
          <div className="flex items-center gap-2 text-blue-300 text-sm">
            <Loader2 size={16} className="animate-spin" />
            {processingStatus}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {!isProcessing && !isPaused && (
          <button
            onClick={startProcessing}
            disabled={disabled || scenes.length === 0 || !config.geminiApiKey}
            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
          >
            <Play size={18} />
            Start Ultimate Processing
          </button>
        )}

        {isProcessing && !isPaused && (
          <button
            onClick={pauseProcessing}
            className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
          >
            <Pause size={18} />
            Pause
          </button>
        )}

        {isPaused && (
          <button
            onClick={resumeProcessing}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
          >
            <Play size={18} />
            Resume from Scene {currentSceneIndex + 1}
          </button>
        )}
      </div>

      {isProcessing && scenes[currentSceneIndex] && (
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-700 rounded-lg">
          <div className="text-xs text-blue-400 font-semibold mb-2">
            Current Scene {currentSceneIndex + 1}:
          </div>
          <div className="text-sm text-slate-300 leading-relaxed">
            {scenes[currentSceneIndex]}
          </div>
        </div>
      )}
    </div>
  );
}