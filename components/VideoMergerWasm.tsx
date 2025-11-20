// components/VideoMergerWasm.tsx
'use client';

import { useState, useRef } from 'react';
import { Download, Loader2, Video, Film } from 'lucide-react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

interface VideoMergerWasmProps {
  videoUrls: string[];
  apiKey: string;
  disabled?: boolean;
  durationSeconds?: number;
}

export function VideoMergerWasm({ videoUrls, apiKey, disabled, durationSeconds = 8 }: VideoMergerWasmProps) {
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
        setMergeProgress(`Đang ghép video: ${percent}%`);
        setDownloadProgress(50 + percent / 2); // 50-100%
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

  const handleMergeAndDownload = async () => {
    try {
      setIsMerging(true);
      setError('');
      setDownloadProgress(0);

      // Load FFmpeg nếu chưa load
      await loadFFmpeg();
      
      const ffmpeg = ffmpegRef.current;
      if (!ffmpeg) {
        throw new Error('FFmpeg not initialized');
      }

      // Download tất cả video qua proxy
      setMergeProgress('Đang tải video từ cloud...');
      const videoBlobs: Blob[] = [];
      
      for (let i = 0; i < videoUrls.length; i++) {
        setMergeProgress(`Đang tải video ${i + 1}/${videoUrls.length}...`);
        setDownloadProgress((i / videoUrls.length) * 40); // 0-40%
        
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

      setMergeProgress('Đang chuẩn bị video để ghép...');
      setDownloadProgress(45);

      // Ghi video vào filesystem ảo của FFmpeg
      for (let i = 0; i < videoBlobs.length; i++) {
        await ffmpeg.writeFile(`video${i}.mp4`, await fetchFile(videoBlobs[i]));
      }

      // Tạo file concat list
      const concatList = videoUrls
        .map((_, i) => `file 'video${i}.mp4'`)
        .join('\n');
      await ffmpeg.writeFile('concat.txt', concatList);

      setMergeProgress('Đang ghép video...');
      setDownloadProgress(50);

      // Thực hiện ghép video
      await ffmpeg.exec([
        '-f', 'concat',
        '-safe', '0',
        '-i', 'concat.txt',
        '-c', 'copy',
        'output.mp4'
      ]);

      setMergeProgress('Đang đọc video đã ghép...');
      setDownloadProgress(95);

      // Đọc file output
      const data = await ffmpeg.readFile('output.mp4');
      const blob = new Blob([data], { type: 'video/mp4' });

      // Dọn dẹp
      for (let i = 0; i < videoUrls.length; i++) {
        await ffmpeg.deleteFile(`video${i}.mp4`);
      }
      await ffmpeg.deleteFile('concat.txt');
      await ffmpeg.deleteFile('output.mp4');

      // Download file
      setMergeProgress('Đang lưu file...');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `merged_video_${videoUrls.length}scenes_${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadProgress(100);
      setMergeProgress('✓ Hoàn thành! Video đã được tải xuống.');
      
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

  const totalDuration = videoUrls.length * durationSeconds;
  const minutes = Math.floor(totalDuration / 60);
  const seconds = totalDuration % 60;
  const durationText = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  return (
    <div className="p-6 bg-gradient-to-br from-purple-900/50 to-pink-900/50 border border-purple-700 rounded-lg">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Film size={20} className="text-purple-400" />
            Ghép Video Thành Phim Hoàn Chỉnh
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1 text-slate-300 text-sm">
              <Video size={14} />
              <span>{videoUrls.length} phân cảnh</span>
            </div>
            <span className="text-slate-500">×</span>
            <span className="text-slate-300 text-sm">{durationSeconds}s</span>
            <span className="text-slate-500">=</span>
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
                className="bg-blue-500 h-full transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleMergeAndDownload}
        disabled={isMerging || disabled || videoUrls.length === 0}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 shadow-lg"
      >
        {isMerging ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Đang xử lý...
          </>
        ) : (
          <>
            <Download size={18} />
            Ghép & Tải Video ({durationText})
          </>
        )}
      </button>

      <div className="mt-3 p-3 bg-slate-800/50 rounded border border-slate-700">
        <p className="text-xs text-slate-400 flex items-center gap-2">
          <span>🚀</span>
          <span>Sử dụng FFmpeg.wasm - xử lý hoàn toàn trên trình duyệt của bạn!</span>
        </p>
      </div>
    </div>
  );
}