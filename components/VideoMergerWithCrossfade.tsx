// components/VideoMergerWithCrossfade.tsx
'use client';

import { useState, useRef } from 'react';
import { Download, Loader2, Video, Film } from 'lucide-react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

interface VideoMergerWithCrossfadeProps {
  videoUrls: string[];
  apiKey: string;
  disabled?: boolean;
  durationSeconds?: number;
  crossfadeDuration?: number; // Thời gian crossfade giữa các video (giây)
}

export function VideoMergerWithCrossfade({ 
  videoUrls, 
  apiKey, 
  disabled, 
  durationSeconds = 8,
  crossfadeDuration = 0.5 // Default 0.5 giây crossfade
}: VideoMergerWithCrossfadeProps) {
  const [isMerging, setIsMerging] = useState(false);
  const [mergeProgress, setMergeProgress] = useState('');
  const [error, setError] = useState('');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);

  const loadFFmpeg = async () => {
    if (ffmpegLoaded) return;
    
    try {
      setMergeProgress('Đang tải FFmpeg engine...');
      const ffmpeg = new FFmpeg();
      
      ffmpeg.on('log', ({ message }) => {
        console.log('FFmpeg:', message);
      });
      
      ffmpeg.on('progress', ({ progress }) => {
        const percent = Math.round(progress * 100);
        setMergeProgress(`Đang ghép video với hiệu ứng chuyển cảnh: ${percent}%`);
        setDownloadProgress(50 + percent / 2);
      });

      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      ffmpegRef.current = ffmpeg;
      setFfmpegLoaded(true);
      console.log('FFmpeg loaded successfully');
    } catch (err) {
      console.error('Failed to load FFmpeg:', err);
      throw new Error('Không thể tải FFmpeg engine');
    }
  };

  const handleMergeWithCrossfade = async () => {
    try {
      setIsMerging(true);
      setError('');
      setDownloadProgress(0);

      await loadFFmpeg();
      
      const ffmpeg = ffmpegRef.current;
      if (!ffmpeg) {
        throw new Error('FFmpeg not initialized');
      }

      // Download tất cả video
      setMergeProgress('Đang tải video từ cloud...');
      const videoBlobs: Blob[] = [];
      
      for (let i = 0; i < videoUrls.length; i++) {
        setMergeProgress(`Đang tải video ${i + 1}/${videoUrls.length}...`);
        setDownloadProgress((i / videoUrls.length) * 40);
        
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

      setMergeProgress('Đang chuẩn bị video...');
      setDownloadProgress(45);

      // Ghi video vào FFmpeg filesystem
      for (let i = 0; i < videoBlobs.length; i++) {
        await ffmpeg.writeFile(`video${i}.mp4`, await fetchFile(videoBlobs[i]));
      }

      setMergeProgress('Đang tạo hiệu ứng chuyển cảnh mượt mà...');
      setDownloadProgress(50);

      // TẠO CROSSFADE GIỮA CÁC VIDEO
      if (videoUrls.length === 1) {
        // Chỉ 1 video - không cần crossfade
        await ffmpeg.exec(['-i', 'video0.mp4', '-c', 'copy', 'output.mp4']);
      } else if (videoUrls.length === 2) {
        // 2 videos - crossfade đơn giản
        await ffmpeg.exec([
          '-i', 'video0.mp4',
          '-i', 'video1.mp4',
          '-filter_complex',
          `[0:v][1:v]xfade=transition=fade:duration=${crossfadeDuration}:offset=${durationSeconds - crossfadeDuration}[v]`,
          '-map', '[v]',
          '-c:v', 'libx264',
          '-preset', 'fast',
          '-crf', '23',
          'output.mp4'
        ]);
      } else {
        // 3+ videos - chain multiple crossfades
        let filterComplex = '';
        let previousLabel = '[0:v]';
        
        for (let i = 1; i < videoUrls.length; i++) {
          const isLast = i === videoUrls.length - 1;
          const outputLabel = isLast ? '[v]' : `[v${i}]`;
          const offset = (durationSeconds - crossfadeDuration) * i;
          
          filterComplex += `${previousLabel}[${i}:v]xfade=transition=fade:duration=${crossfadeDuration}:offset=${offset}${outputLabel};`;
          previousLabel = outputLabel;
        }
        
        // Remove trailing semicolon
        filterComplex = filterComplex.slice(0, -1);

        const inputs = videoUrls.map((_, i) => ['-i', `video${i}.mp4`]).flat();
        
        await ffmpeg.exec([
          ...inputs,
          '-filter_complex',
          filterComplex,
          '-map', '[v]',
          '-c:v', 'libx264',
          '-preset', 'fast',
          '-crf', '23',
          'output.mp4'
        ]);
      }

      setMergeProgress('Đang đọc video...');
      setDownloadProgress(95);

      const data = await ffmpeg.readFile('output.mp4');
      const blob = new Blob([data], { type: 'video/mp4' });

      // Cleanup
      for (let i = 0; i < videoUrls.length; i++) {
        await ffmpeg.deleteFile(`video${i}.mp4`);
      }
      await ffmpeg.deleteFile('output.mp4');

      // Download
      setMergeProgress('Đang lưu file...');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smooth_video_${videoUrls.length}scenes_${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadProgress(100);
      setMergeProgress('✓ Hoàn thành! Video với chuyển cảnh mượt đã được tải xuống.');
      
      setTimeout(() => {
        setMergeProgress('');
        setDownloadProgress(0);
      }, 5000);

    } catch (err) {
      console.error('Merge error:', err);
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
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
    <div className="p-6 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-700 rounded-lg">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Film size={20} className="text-indigo-400" />
            Ghép Video với Chuyển Cảnh Mượt Mà
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1 text-slate-300 text-sm">
              <Video size={14} />
              <span>{videoUrls.length} video</span>
            </div>
            {videoUrls.length > 1 && (
              <>
                <span className="text-slate-500">•</span>
                <span className="text-amber-400 text-sm">
                  {crossfadeDuration}s crossfade
                </span>
              </>
            )}
            <span className="text-slate-500">→</span>
            <span className="font-bold text-cyan-400 text-lg">{durationText}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-300 text-sm">
          ⚠️ {error}
        </div>
      )}

      {mergeProgress && (
        <div className="mb-4 p-3 bg-blue-900/50 border border-blue-700 rounded">
          <div className="flex items-center gap-2 text-blue-300 text-sm mb-2">
            <Loader2 size={16} className="animate-spin" />
            {mergeProgress}
          </div>
          {downloadProgress > 0 && (
            <div className="w-full bg-blue-950 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleMergeWithCrossfade}
        disabled={isMerging || disabled || videoUrls.length === 0}
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 shadow-lg"
      >
        {isMerging ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Đang xử lý...
          </>
        ) : (
          <>
            <Download size={18} />
            Ghép với Crossfade ({durationText})
          </>
        )}
      </button>

      <div className="mt-3 p-3 bg-slate-800/50 rounded border border-slate-700">
        <p className="text-xs text-slate-400 flex items-center gap-2">
          <span>✨</span>
          <span>
            Sử dụng fade transition giữa các video để chuyển cảnh mượt mà hơn. 
            Mỗi chuyển cảnh mất {crossfadeDuration}s.
          </span>
        </p>
      </div>
    </div>
  );
}