// components/VideoMerger.tsx
'use client';

import { useState } from 'react';
import { Download, Loader2, Video, Film } from 'lucide-react';

interface VideoMergerProps {
  videoUrls: string[];
  apiKey: string;
  disabled?: boolean;
  durationSeconds?: number; // THÊM MỚI
}

export function VideoMerger({ videoUrls, apiKey, disabled, durationSeconds = 8 }: VideoMergerProps) {
  const [isMerging, setIsMerging] = useState(false);
  const [mergeProgress, setMergeProgress] = useState('');
  const [error, setError] = useState('');
  const [downloadProgress, setDownloadProgress] = useState(0);

  const handleMergeAndDownload = async () => {
    try {
      setIsMerging(true);
      setError('');
      setDownloadProgress(0);
      setMergeProgress('Đang chuẩn bị ghép video...');

      // Gọi API để ghép video (API sẽ tự download với API key)
      const response = await fetch('/api/merge-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrls,
          geminiApiKey: apiKey, // ✅ API key sẽ được dùng để download
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Không thể ghép video');
      }

      setMergeProgress('Đang tải video đã ghép...');

      // Nhận file video đã ghép với progress tracking
      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      
      const reader = response.body?.getReader();
      const chunks: Uint8Array[] = [];
      let receivedLength = 0;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          chunks.push(value);
          receivedLength += value.length;
          
          if (total > 0) {
            const percent = Math.round((receivedLength / total) * 100);
            setDownloadProgress(percent);
            setMergeProgress(`Đang tải xuống: ${percent}%`);
          }
        }
      }

      // Tạo blob từ chunks
      const blob = new Blob(chunks, { type: 'video/mp4' });
      
      setMergeProgress('Đang lưu file...');

      // Tạo link download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `merged_video_${videoUrls.length}scenes_${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      
      // Dọn dẹp
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
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

  const totalDuration = videoUrls.length * durationSeconds; // Sử dụng duration từ props
  const minutes = Math.floor(totalDuration / 60);
  const seconds = totalDuration % 60;
  const durationText = minutes > 0 
    ? `${minutes}m ${seconds}s` 
    : `${seconds}s`;

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
            <span className="text-slate-300 text-sm">8s</span>
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
            Ghép & Tải Video Hoàn Chỉnh ({durationText})
          </>
        )}
      </button>

      <div className="mt-3 p-3 bg-slate-800/50 rounded border border-slate-700">
        <p className="text-xs text-slate-400 flex items-center gap-2">
          <span>ℹ️</span>
          <span>Video sẽ được ghép tuần tự theo thứ tự các phân cảnh. Quá trình có thể mất vài phút tùy thuộc vào số lượng video.</span>
        </p>
      </div>
    </div>
  );
}