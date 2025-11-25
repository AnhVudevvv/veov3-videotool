// app/page.tsx
'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { ConfigPanel } from '@/components/config-panel';
import { PromptUploader } from '@/components/prompt-uploader';
import { BatchProcessor } from '@/components/batch-processor';
import { ProgressDashboard } from '@/components/progress-dashboard';
import { VideoDownloader } from '@/components/video-downloader';
import { VideoMergerWasm } from '@/components/VideoMergerWasm';
import type { AspectRatio } from '../type';

interface AppConfig {
  geminiApiKey: string;
  batchSize: number;
  aspectRatio: AspectRatio;
  durationSeconds: number;
  globalContext: string;
}

export default function Home() {
  const [config, setConfig] = useState<AppConfig>({
    geminiApiKey: '',
    batchSize: 3,
    aspectRatio: '16:9',
    durationSeconds: 8,
    globalContext: '',
  });

  const [scenes, setScenes] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleConfigChange = (newConfig: AppConfig) => {
    setConfig(newConfig);
    sessionStorage.setItem('veoApiKey', newConfig.geminiApiKey);
    localStorage.setItem(
      'veoConfig',
      JSON.stringify({
        batchSize: newConfig.batchSize,
        aspectRatio: newConfig.aspectRatio,
        durationSeconds: newConfig.durationSeconds,
        globalContext: newConfig.globalContext,
      })
    );
  };

  const handlePromptParsed = (parsedScenes: string[]) => {
    setScenes(parsedScenes);
    setVideoUrls([]);
    setErrors([]);
  };

  const handleBatchComplete = (newUrl: string) => {
    setVideoUrls((prev) => [...prev, newUrl]);
  };

  const handleError = (errorMsg: string) => {
    setErrors((prev) => [...prev, errorMsg]);
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
          Veo 3 Batch Video Generator
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN (SETUP) */}
          <div className="space-y-6">
            <ConfigPanel 
              config={config} 
              onConfigChange={handleConfigChange} 
              onPromptParsed={handlePromptParsed}
              disabled={isProcessing}
            />
            {/* <PromptUploader 
              onPromptParsed={handlePromptParsed} 
              disabled={isProcessing} 
            /> */}
            <PromptUploader 
              onPromptParsed={handlePromptParsed} 
              disabled={isProcessing} 
            />
          </div>

          {/* RIGHT COLUMN (PROCESSING & RESULTS) */}
          <div className="space-y-6">
            <BatchProcessor
              scenes={scenes}
              config={config}
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

            {/* Error Display */}
            {errors.length > 0 && (
              <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg space-y-2">
                <h3 className="font-semibold text-red-400 flex items-center gap-2">
                  <AlertTriangle size={16} /> Lỗi Xử Lý
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
                currentBatch: Math.ceil(videoUrls.length / config.batchSize),
                videoUrls: videoUrls,
              }}
              isProcessing={isProcessing}
            />

            {/* VIDEO MERGER & DOWNLOADER */}
            {videoUrls.length > 0 && !isProcessing && (
              <>
                <VideoMergerWasm
                  videoUrls={videoUrls}
                  apiKey={config.geminiApiKey}
                  disabled={isProcessing}
                  durationSeconds={config.durationSeconds}
                />
                
                <VideoDownloader
                  videoUrls={videoUrls}
                  apiKey={config.geminiApiKey}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

// app/page.tsx
// SIMPLIFIED: ConfigPanel bao gồm tất cả

// 'use client';

// import { useState } from 'react';
// import { AlertTriangle } from 'lucide-react';
// import { ConfigPanel } from '@/components/config-panel';
// import { BatchProcessor } from '@/components/batch-processor';
// import { ProgressDashboard } from '@/components/progress-dashboard';
// import { VideoDownloader } from '@/components/video-downloader';
// import { VideoMergerWasm } from '@/components/VideoMergerWasm';
// import type { AspectRatio } from '../type';

// interface AppConfig {
//   geminiApiKey: string;
//   batchSize: number;
//   aspectRatio: AspectRatio;
//   durationSeconds: number;
//   globalContext: string;
// }

// export default function Home() {
//   const [config, setConfig] = useState<AppConfig>({
//     geminiApiKey: '',
//     batchSize: 3,
//     aspectRatio: '16:9',
//     durationSeconds: 8,
//     globalContext: '',
//   });

//   const [scenes, setScenes] = useState<string[]>([]);
//   const [videoUrls, setVideoUrls] = useState<string[]>([]);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [errors, setErrors] = useState<string[]>([]);

//   const handleConfigChange = (newConfig: AppConfig) => {
//     setConfig(newConfig);
//     sessionStorage.setItem('veoApiKey', newConfig.geminiApiKey);
//     localStorage.setItem(
//       'veoConfig',
//       JSON.stringify({
//         batchSize: newConfig.batchSize,
//         aspectRatio: newConfig.aspectRatio,
//         durationSeconds: newConfig.durationSeconds,
//         globalContext: newConfig.globalContext,
//       })
//     );
//   };

//   const handleScenesGenerated = (parsedScenes: string[]) => {
//     setScenes(parsedScenes);
//     setVideoUrls([]);
//     setErrors([]);
//   };

//   const handleBatchComplete = (newUrl: string) => {
//     setVideoUrls((prev) => [...prev, newUrl]);
//   };

//   const handleError = (errorMsg: string) => {
//     setErrors((prev) => [...prev, errorMsg]);
//   };

//   return (
//     <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white p-4 md:p-8">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="text-center mb-8">
//           <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
//             Veo 3 Video Generator
//           </h1>
//           <p className="text-slate-400">Create consistent AI videos like Sora</p>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           {/* LEFT COLUMN - All-in-One Config Panel */}
//           <div>
//             <ConfigPanel 
//               config={config} 
//               onConfigChange={handleConfigChange}
//               onScenesGenerated={handleScenesGenerated}
//               disabled={isProcessing}
//             />
//           </div>

//           {/* RIGHT COLUMN - Processing & Results */}
//           <div className="space-y-6">
//             <BatchProcessor
//               scenes={scenes}
//               config={config}
//               onBatchComplete={handleBatchComplete}
//               onProcessingStart={() => {
//                 setIsProcessing(true);
//                 setErrors([]);
//               }}
//               onProcessingEnd={() => setIsProcessing(false)}
//               onError={handleError}
//               disabled={
//                 isProcessing ||
//                 scenes.length === 0 ||
//                 !config.geminiApiKey
//               }
//             />

//             {errors.length > 0 && (
//               <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg space-y-2">
//                 <h3 className="font-semibold text-red-400 flex items-center gap-2">
//                   <AlertTriangle size={16} /> Lỗi Xử Lý
//                 </h3>
//                 <ul className="list-disc list-inside text-sm text-red-300 max-h-32 overflow-y-auto">
//                   {errors.map((e, i) => (
//                     <li key={i}>{e}</li>
//                   ))}
//                 </ul>
//               </div>
//             )}

//             <ProgressDashboard
//               progress={{
//                 completed: videoUrls.length,
//                 total: scenes.length,
//                 currentBatch: Math.ceil(videoUrls.length / config.batchSize),
//                 videoUrls: videoUrls,
//               }}
//               isProcessing={isProcessing}
//             />

//             {videoUrls.length > 0 && !isProcessing && (
//               <>
//                 <VideoMergerWasm
//                   videoUrls={videoUrls}
//                   apiKey={config.geminiApiKey}
//                   disabled={isProcessing}
//                   durationSeconds={config.durationSeconds}
//                 />
                
//                 <VideoDownloader
//                   videoUrls={videoUrls}
//                   apiKey={config.geminiApiKey}
//                 />
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//     </main>
//   );
// }