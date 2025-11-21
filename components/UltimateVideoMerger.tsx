// components/UltimateVideoMerger.tsx
'use client';

import { useState, useRef } from 'react';
import { Download, Loader2, Video, Film, Sparkles } from 'lucide-react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

interface UltimateVideoMergerProps {
  videoUrls: string[];
  apiKey: string;
  disabled?: boolean;
  durationSeconds?: number;
  crossfadeDuration?: number;
}

export function UltimateVideoMerger({ 
  videoUrls, 
  apiKey, 
  disabled, 
  durationSeconds = 8,
  crossfadeDuration = 0.3 // Giảm xuống 0.3s cho tự nhiên hơn
}: UltimateVideoMergerProps) {
  const [isMerging, setIsMerging] = useState(false);
  const [mergeProgress, setMergeProgress] = useState('');
  const [error, setError] = useState('');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);

  const loadFFmpeg = async () => {
    if (ffmpegLoaded) return;
    
    try {
      setMergeProgress('⚙️ Đang tải FFmpeg engine...');
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
      console.log('✓ FFmpeg loaded');
    } catch (err) {
      throw new Error('Không thể tải FFmpeg engine');
    }
  };

  const handleUltimateMerge = async () => {
    try {
      setIsMerging(true);
      setError('');
      setDownloadProgress(0);

      await loadFFmpeg();
      const ffmpeg = ffmpegRef.current;
      if (!ffmpeg) throw new Error('FFmpeg not initialized');

      // ═══════════════════════════════════════════════
      // STEP 1: DOWNLOAD ALL VIDEOS
      // ═══════════════════════════════════════════════
      setMergeProgress('📥 Downloading videos from cloud...');
      const videoBlobs: Blob[] = [];
      
      for (let i = 0; i < videoUrls.length; i++) {
        setMergeProgress(`📥 Downloading video ${i + 1}/${videoUrls.length}...`);
        setDownloadProgress((i / videoUrls.length) * 30);
        
        const response = await fetch('/api/download-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gcsUrl: videoUrls[i],
            geminiApiKey: apiKey,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to download video ${i + 1}`);
        }

        videoBlobs.push(await response.blob());
      }

      setDownloadProgress(35);

      // ═══════════════════════════════════════════════
      // STEP 2: WRITE TO FFMPEG FILESYSTEM
      // ═══════════════════════════════════════════════
      setMergeProgress('💾 Preparing videos...');
      for (let i = 0; i < videoBlobs.length; i++) {
        await ffmpeg.writeFile(`input${i}.mp4`, await fetchFile(videoBlobs[i]));
      }

      setDownloadProgress(40);

      // ═══════════════════════════════════════════════
      // STEP 3: RE-ENCODE + MERGE WITH CROSSFADE
      // ═══════════════════════════════════════════════
      if (videoUrls.length === 1) {
        // Single video - just re-encode for compatibility
        setMergeProgress('🎬 Re-encoding for universal playback...');
        
        await ffmpeg.exec([
          '-i', 'input0.mp4',
          '-c:v', 'libx264',        // H.264 codec
          '-preset', 'medium',       // Balance quality/speed
          '-crf', '23',              // Constant quality
          '-pix_fmt', 'yuv420p',     // Compatible pixel format
          '-movflags', '+faststart', // Web optimization
          '-c:a', 'aac',             // AAC audio
          '-b:a', '128k',            // Audio bitrate
          'output.mp4'
        ]);
        
      } else {
        // Multiple videos - crossfade + re-encode
        setMergeProgress(`🎬 Merging ${videoUrls.length} videos with smooth transitions...`);
        setDownloadProgress(45);

        // Build complex filter for crossfade
        let filterComplex = '';
        
        if (videoUrls.length === 2) {
          // Simple 2-video crossfade
          const offset = durationSeconds - crossfadeDuration;
          filterComplex = `[0:v][1:v]xfade=transition=fade:duration=${crossfadeDuration}:offset=${offset}[v]`;
          
        } else {
          // Chain multiple crossfades
          let previousLabel = '[0:v]';
          
          for (let i = 1; i < videoUrls.length; i++) {
            const isLast = i === videoUrls.length - 1;
            const outputLabel = isLast ? '[v]' : `[v${i}]`;
            const offset = (durationSeconds - crossfadeDuration) * i;
            
            filterComplex += `${previousLabel}[${i}:v]xfade=transition=fade:duration=${crossfadeDuration}:offset=${offset}${outputLabel};`;
            previousLabel = outputLabel;
          }
          
          filterComplex = filterComplex.slice(0, -1); // Remove trailing semicolon
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

      // ═══════════════════════════════════════════════
      // STEP 4: READ OUTPUT & DOWNLOAD
      // ═══════════════════════════════════════════════
      setMergeProgress('💾 Saving final video...');
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
      a.download = `ultimate_video_${videoUrls.length}scenes_${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadProgress(100);
      setMergeProgress('✅ Complete! Video saved and optimized for all devices.');
      
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
    ? (durationSeconds * videoUrls.length) - (crossfadeDuration * (videoUrls.length - 1))
    : durationSeconds * videoUrls.length;
  
  const minutes = Math.floor(effectiveDuration / 60);
  const seconds = Math.round(effectiveDuration % 60);
  const durationText = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  return (
    <div className="p-6 bg-gradient-to-br from-purple-900/50 via-pink-900/50 to-orange-900/50 border-2 border-purple-500/50 rounded-lg shadow-2xl">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles size={22} className="text-yellow-400" />
            Ultimate Video Merger
          </h3>
          <p className="text-sm text-slate-300 mt-1">
            Crossfade transitions + Universal codec for all devices
          </p>
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1.5 text-slate-300 text-sm bg-slate-800/50 px-3 py-1 rounded-full">
              <Video size={14} />
              <span>{videoUrls.length} videos</span>
            </div>
            {videoUrls.length > 1 && (
              <div className="flex items-center gap-1.5 text-amber-400 text-sm bg-amber-900/30 px-3 py-1 rounded-full">
                <Film size={14} />
                <span>{crossfadeDuration}s fade</span>
              </div>
            )}
            <div className="font-bold text-cyan-400 text-lg">
              → {durationText}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
          ⚠️ {error}
        </div>
      )}

      {mergeProgress && (
        <div className="mb-4 p-4 bg-blue-900/50 border border-blue-700 rounded-lg">
          <div className="flex items-center gap-2 text-blue-300 text-sm mb-3">
            <Loader2 size={18} className="animate-spin" />
            <span className="font-medium">{mergeProgress}</span>
          </div>
          {downloadProgress > 0 && (
            <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-700">
              <div
                className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-full transition-all duration-500 relative"
                style={{ width: `${downloadProgress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleUltimateMerge}
        disabled={isMerging || disabled || videoUrls.length === 0}
        className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 text-white px-6 py-4 rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-2xl hover:shadow-purple-500/50 hover:scale-[1.02] active:scale-[0.98]"
      >
        {isMerging ? (
          <>
            <Loader2 size={22} className="animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Download size={22} />
            Merge & Download ({durationText})
          </>
        )}
      </button>

      <div className="mt-4 p-4 bg-slate-800/70 rounded-lg border border-slate-600">
        <div className="text-xs text-slate-300 space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            <span><strong>Image-to-Video:</strong> Seamless continuity between scenes</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            <span><strong>Crossfade:</strong> Smooth {crossfadeDuration}s fade transitions</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            <span><strong>H.264 + AAC:</strong> Plays on Windows, Mac, phone, web</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            <span><strong>Fast-start:</strong> Optimized for streaming & preview</span>
          </div>
        </div>
      </div>
    </div>
  );
}