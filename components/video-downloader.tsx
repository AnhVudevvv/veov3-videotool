// components/VideoDownloader.tsx
'use client';

import { useState } from 'react';
import { Download, Archive } from 'lucide-react';
import JSZip from 'jszip'; // Vẫn dùng JSZip

interface VideoDownloaderProps {
  // KHẮC PHỤC: Đây là mảng GCS URLs, không phải Base64
  videoUrls: string[]; 
  // KHẮC PHỤC: Cần API key để xác thực với proxy
  apiKey: string; 
}

export function VideoDownloader({ videoUrls, apiKey }: VideoDownloaderProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState('');

  // KHẮC PHỤC: Hàm helper mới để gọi proxy và lấy Blob
  const fetchVideoBlob = async (gcsUrl: string): Promise<Blob> => {
    try {
      const response = await fetch(
        `/api/fetch-video?url=${encodeURIComponent(gcsUrl)}`,
        {
          headers: {
            // Gửi key qua Authorization header như API của bạn mong đợi
            Authorization: `Bearer ${apiKey}`, 
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Proxy failed to fetch video: ${response.statusText}`);
      }
      
      // Trả về video dưới dạng Blob
      return await response.blob(); 
    } catch (error) {
      console.error('Error fetching blob:', error);
      throw error;
    }
  };

  // KHẮC PHỤC: Logic tải 1 video đã thay đổi
  const downloadSingleVideo = async (url: string, index: number) => {
    try {
      setDownloadStatus(`Đang tải Scene ${index + 1}...`);
      const blob = await fetchVideoBlob(url);
      
      // Tạo link object URL từ Blob
      const objectUrl = URL.createObjectURL(blob); 
      
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `scene-${index + 1}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Thu hồi object URL để giải phóng bộ nhớ
      URL.revokeObjectURL(objectUrl); 
      setDownloadStatus(`Đã tải Scene ${index + 1}!`);
    } catch (error) {
      console.error(`Failed to download video ${index + 1}:`, error);
      setDownloadStatus(`Lỗi tải Scene ${index + 1}.`);
    }
  };

  // KHẮC PHỤC: Logic tải file ZIP đã thay đổi
  const downloadAllAsZip = async () => {
    setIsDownloading(true);
    setDownloadStatus('Đang chuẩn bị file zip...');
    try {
      const zip = new JSZip();

      // Tải tất cả video blobs song song
      const videoBlobs = await Promise.all(
        videoUrls.map((url, index) => {
          setDownloadStatus(`Đang tải video ${index + 1}/${videoUrls.length}...`);
          return fetchVideoBlob(url);
        })
      );

      // Thêm các blob vào file zip
      setDownloadStatus('Đang nén file zip...');
      videoBlobs.forEach((blob, index) => {
        zip.file(`scene_${index + 1}.mp4`, blob);
      });

      // Tạo file zip
      const content = await zip.generateAsync({ type: 'blob' });

      // Tải file zip về
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = 'video_scenes.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      setDownloadStatus('Đã tải file zip thành công!');
    } catch (error) {
      console.error('Failed to create zip file:', error);
      setDownloadStatus('Lỗi khi tạo file zip.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="p-6 bg-slate-800 border border-slate-700 rounded-lg">
      <h3 className="text-lg font-semibold text-white mb-4">Download Videos</h3>
      
      {downloadStatus && (
         <p className="text-sm text-cyan-400 mb-4">{downloadStatus}</p>
      )}

      {/* Video List */}
      <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
        {videoUrls.map((url, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-slate-700 rounded border border-slate-600"
          >
            <span className="text-sm text-slate-300">Scene {index + 1}</span>
            <button
              onClick={() => downloadSingleVideo(url, index)} // KHẮC PHỤC
              disabled={isDownloading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm disabled:bg-slate-600 transition flex items-center gap-1"
            >
              <Download size={14} />
              Download
            </button>
          </div>
        ))}
      </div>

      {/* Download All Button */}
      <button
        onClick={downloadAllAsZip} // KHẮC PHỤC
        disabled={isDownloading || videoUrls.length === 0}
        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-4 py-3 rounded-lg font-medium disabled:opacity-50 transition flex items-center justify-center gap-2"
      >
        <Archive size={16} />
        {isDownloading ? 'Đang xử lý...' : `Tải tất cả (${videoUrls.length}) dưới dạng .ZIP`}
      </button>

      <p className="text-xs text-slate-500 mt-4 text-center">
        File sẽ được lưu vào thư mục Downloads mặc định của bạn.
      </p>
    </div>
  );
}