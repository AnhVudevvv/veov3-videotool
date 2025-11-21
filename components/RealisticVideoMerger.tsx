// components/RealisticVideoMerger.tsx
// Giải pháp thực tế: Chấp nhận sự khác biệt nhỏ + làm mượt transitions
'use client';

import { useState, useRef } from 'react';
import { Download, Loader2, Video, Film, Info } from 'lucide-react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

interface RealisticVideoMergerProps {
  videoUrls: string[];
  apiKey: string;
  disabled?: boolean;
  durationSeconds?: number;
}

export function RealisticVideoMerger({ 
  videoUrls, 
  apiKey, 
  disabled, 
  durationSeconds = 8
}: RealisticVideoMergerProps) {
  const [isMerging, setIsMerging] = useState(false);
  const [mergeProgress, setMergeProgress] = useState('');
  const [error, setError] = useState('');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  
  // Transition type selection
  const [transitionType, setTransitionType] = useState<'fade' | 'dissolve' | 'wipeleft' | 'wiperight'>('dissolve');
  const [transitionDuration, setTransitionDuration] = useState(0.5);

  const loadFFmpeg = async () => {
    if (ffmpegLoaded) return;
    
    try {
      setMergeProgress('⚙️ Loading FFmpeg engine...');
      const ffmpeg = new FFmpeg();
      
      ffmpeg.on('log', ({ message }) => {
        console.log('[FFmpeg]', message);
      });
      
      ffmpeg.on('progress', ({ progress }) => {
        const percent = Math.round(progress * 100);
        setDownloadProgress(50 + percent / 2);
      });

      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      ffmpegRef.current = ffmpeg;
      setFfmpegLoaded(true);
    } catch (err) {
      throw new Error('Cannot load FFmpeg engine');
    }
  };

  const handleMerge = async () => {
    try {
      setIsMerging(true);
      setError('');
      setDownloadProgress(0);

      await loadFFmpeg();
      const ffmpeg = ffmpegRef.current;
      if (!ffmpeg) throw new Error('FFmpeg not initialized');

      // Download videos
      setMergeProgress('📥 Downloading videos...');
      const videoBlobs: Blob[] = [];
      
      for (let i = 0; i < videoUrls.length; i++) {
        setMergeProgress(`📥 Downloading ${i + 1}/${videoUrls.length}...`);
        setDownloadProgress((i / videoUrls.length) * 30);
        
        const response = await fetch('/api/download-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gcsUrl: videoUrls[i],
            geminiApiKey: apiKey,
          }),
        });

        if (!response.ok) throw new Error(`Download failed: video ${i + 1}`);
        videoBlobs.push(await response.blob());
      }

      setDownloadProgress(35);
      setMergeProgress('💾 Writing to FFmpeg...');

      for (let i = 0; i < videoBlobs.length; i++) {
        await ffmpeg.writeFile(`input${i}.mp4`, await fetchFile(videoBlobs[i]));
      }

      setDownloadProgress(40);

      // Merge with advanced transitions
      if (videoUrls.length === 1) {
        setMergeProgress('🎬 Re-encoding...');
        await ffmpeg.exec([
          '-i', 'input0.mp4',
          '-c:v', 'libx264',
          '-preset', 'medium',
          '-crf', '23',
          '-pix_fmt', 'yuv420p',
          '-movflags', '+faststart',
          'output.mp4'
        ]);
      } else {
        setMergeProgress(`🎬 Merging with ${transitionType} transitions...`);
        
        // Build filter based on transition type
        let filterComplex = '';
        
        if (videoUrls.length === 2) {
          const offset = durationSeconds - transitionDuration;
          filterComplex = `[0:v][1:v]xfade=transition=${transitionType}:duration=${transitionDuration}:offset=${offset}[v]`;
        } else {
          let previousLabel = '[0:v]';
          for (let i = 1; i < videoUrls.length; i++) {
            const isLast = i === videoUrls.length - 1;
            const outputLabel = isLast ? '[v]' : `[v${i}]`;
            const offset = (durationSeconds - transitionDuration) * i;
            
            filterComplex += `${previousLabel}[${i}:v]xfade=transition=${transitionType}:duration=${transitionDuration}:offset=${offset}${outputLabel};`;
            previousLabel = outputLabel;
          }
          filterComplex = filterComplex.slice(0, -1);
        }

        const inputs = videoUrls.map((_, i) => ['-i', `input${i}.mp4`]).flat();
        
        await ffmpeg.exec([
          ...inputs,
          '-filter_complex', filterComplex,
          '-map', '[v]',
          '-c:v', 'libx264',
          '-preset', 'medium',
          '-crf', '23',
          '-pix_fmt', 'yuv420p',
          '-movflags', '+faststart',
          'output.mp4'
        ]);
      }

      setDownloadProgress(95);
      setMergeProgress('💾 Finalizing...');

      const data = await ffmpeg.readFile('output.mp4');
      const blob = new Blob([data], { type: 'video/mp4' });

      // Cleanup
      for (let i = 0; i < videoUrls.length; i++) {
        await ffmpeg.deleteFile(`input${i}.mp4`);
      }
      await ffmpeg.deleteFile('output.mp4');

      // Download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `merged_${transitionType}_${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadProgress(100);
      setMergeProgress('✅ Complete!');
      
      setTimeout(() => {
        setMergeProgress('');
        setDownloadProgress(0);
      }, 5000);

    } catch (err) {
      console.error('Merge error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setMergeProgress('');
    } finally {
      setIsMerging(false);
    }
  };

  const effectiveDuration = videoUrls.length > 1 
    ? (durationSeconds * videoUrls.length) - (transitionDuration * (videoUrls.length - 1))
    : durationSeconds * videoUrls.length;
  
  const minutes = Math.floor(effectiveDuration / 60);
  const seconds = Math.round(effectiveDuration % 60);
  const durationText = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  return (
    <div className="p-6 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border-2 border-indigo-500/50 rounded-lg shadow-xl">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
          <Film size={22} className="text-indigo-400" />
          Smart Video Merger
        </h3>
        <p className="text-sm text-slate-300">
          Advanced transitions to smooth out scene variations
        </p>
      </div>

      {/* Transition Settings */}
      <div className="mb-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700 space-y-3">
        <div>
          <label className="text-sm text-slate-300 mb-2 block">Transition Effect:</label>
          <div className="grid grid-cols-2 gap-2">
            {(['fade', 'dissolve', 'wipeleft', 'wiperight'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setTransitionType(type)}
                disabled={isMerging}
                className={`px-3 py-2 rounded text-sm font-medium transition-all ${
                  transitionType === type
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                } disabled:opacity-50`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm text-slate-300 mb-2 block">
            Transition Duration: {transitionDuration}s
          </label>
          <input
            type="range"
            min="0.2"
            max="2"
            step="0.1"
            value={transitionDuration}
            onChange={(e) => setTransitionDuration(parseFloat(e.target.value))}
            disabled={isMerging}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>Quick (0.2s)</span>
            <span>Smooth (2s)</span>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="mb-4 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
        <div className="flex items-start gap-2 text-xs text-blue-300">
          <Info size={14} className="mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p><strong>Reality Check:</strong> Veo 3 may create slight variations between scenes even with context chaining.</p>
            <p><strong>Solution:</strong> Longer transitions (0.5-1s) help blend differences smoothly.</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-300 text-sm">
          ⚠️ {error}
        </div>
      )}

      {mergeProgress && (
        <div className="mb-4 p-4 bg-blue-900/50 border border-blue-700 rounded">
          <div className="flex items-center gap-2 text-blue-300 text-sm mb-2">
            <Loader2 size={16} className="animate-spin" />
            {mergeProgress}
          </div>
          {downloadProgress > 0 && (
            <div className="w-full bg-blue-950 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleMerge}
        disabled={isMerging || disabled || videoUrls.length === 0}
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-4 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg"
      >
        {isMerging ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Download size={20} />
            Merge & Download ({durationText})
          </>
        )}
      </button>

      <div className="mt-4 p-4 bg-slate-800/50 rounded border border-slate-700">
        <div className="text-xs text-slate-400 space-y-1">
          <div className="flex items-center gap-2">
            <Video size={12} />
            <span>{videoUrls.length} videos • {durationText} total</span>
          </div>
          <div className="flex items-center gap-2">
            <Film size={12} />
            <span>{transitionType} transition • {transitionDuration}s duration</span>
          </div>
        </div>
      </div>
    </div>
  );
}