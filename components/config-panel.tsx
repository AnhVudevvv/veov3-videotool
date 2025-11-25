// components/ConfigPanel.tsx
// 'use client';

// import { useState, useEffect } from 'react';
// import { Eye, EyeOff, Sparkles, HelpCircle, ChevronDown, ChevronUp, Wand2, Upload, Layers, Plus, Trash2, File, Play } from 'lucide-react';
// import type { AspectRatio } from '../type';

// interface Scene {
//   id: string;
//   prompt: string;
//   duration: number;
// }

// interface ConfigPanelProps {
//   config: {
//     geminiApiKey: string;
//     batchSize: number;
//     aspectRatio: string;
//     durationSeconds: number;
//     globalContext: string;
//   };
//   onConfigChange: (config: any) => void;
//   onScenesGenerated: (scenes: string[]) => void;
//   disabled?: boolean;
// }

// type InputMode = 'upload' | 'storyboard';

// export function ConfigPanel({ config, onConfigChange, onScenesGenerated, disabled }: ConfigPanelProps) {
//   const [showKey, setShowKey] = useState(false);
//   const [localConfig, setLocalConfig] = useState(config);
//   const [showTutorial, setShowTutorial] = useState(false);
  
//   const [videoDescription, setVideoDescription] = useState('');
//   const [inputMode, setInputMode] = useState<InputMode>('storyboard');
  
//   const [scenes, setScenes] = useState<Scene[]>([
//     { id: '1', prompt: '', duration: 5 },
//     { id: '2', prompt: '', duration: 5 },
//     { id: '3', prompt: '', duration: 5 },
//   ]);
  
//   const [fileName, setFileName] = useState('');
//   const [isDragging, setIsDragging] = useState(false);

//   useEffect(() => {
//     const saved = localStorage.getItem('veoConfig');
//     const apiKey = sessionStorage.getItem('veoApiKey');
    
//     let needsUpdate = false;
//     let newConfig = { ...localConfig };

//     if (saved) {
//       const parsed = JSON.parse(saved);
//       newConfig = { ...newConfig, ...parsed };
      
//       if (parsed.videoDescription) setVideoDescription(parsed.videoDescription);
      
//       needsUpdate = true;
//     }
    
//     if (apiKey) {
//       newConfig.geminiApiKey = apiKey;
//       needsUpdate = true;
//     }

//     if (needsUpdate) {
//       setLocalConfig(newConfig);
//       onConfigChange(newConfig);
//     }
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const handleChange = (field: string, value: string | number) => {
//     const updated = { ...localConfig, [field]: value };
//     setLocalConfig(updated);
//     onConfigChange(updated);
//   };

//   useEffect(() => {
//     handleChange('globalContext', videoDescription);
    
//     localStorage.setItem('veoConfig', JSON.stringify({
//       ...localConfig,
//       globalContext: videoDescription,
//       videoDescription,
//     }));
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [videoDescription]);

//   // Storyboard functions
//   const addScene = () => {
//     const newId = (Math.max(...scenes.map(s => parseInt(s.id)), 0) + 1).toString();
//     setScenes([...scenes, { id: newId, prompt: '', duration: 5 }]);
//   };

//   const removeScene = (id: string) => {
//     if (scenes.length > 1) {
//       setScenes(scenes.filter(s => s.id !== id));
//     }
//   };

//   const updateScene = (id: string, field: 'prompt' | 'duration', value: string | number) => {
//     setScenes(scenes.map(s => 
//       s.id === id ? { ...s, [field]: value } : s
//     ));
//   };

//   const handleGenerateFromStoryboard = () => {
//     const validScenes = scenes
//       .filter(s => s.prompt.trim().length > 0)
//       .map(s => s.prompt.trim());
    
//     if (validScenes.length === 0) {
//       alert('Vui lòng nhập ít nhất 1 scene!');
//       return;
//     }
    
//     onScenesGenerated(validScenes);
//   };

//   const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);

//   // Upload functions
//   const parsePromptFile = (text: string) => {
//     const lines = text
//       .split('\n')
//       .map((line) => line.trim())
//       .filter((line) => line.length > 0 && !line.startsWith('#'));

//     const parsedScenes: string[] = [];
//     let currentScene = '';

//     lines.forEach((line) => {
//       if (line.startsWith('-') || line.startsWith('Scene') || line.match(/^\d+\./)) {
//         if (currentScene.trim()) {
//           parsedScenes.push(currentScene.trim());
//         }
//         currentScene = line.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, '').replace(/^Scene\s*\d+:\s*/i, '');
//       } else {
//         currentScene += (currentScene ? ' ' : '') + line;
//       }
//     });

//     if (currentScene.trim()) {
//       parsedScenes.push(currentScene.trim());
//     }

//     return parsedScenes.length > 0 ? parsedScenes : lines;
//   };

//   const handleFile = (file: File) => {
//     setFileName(file.name);
//     const reader = new FileReader();
//     reader.onload = (e) => {
//       const text = e.target?.result as string;
//       const parsedScenes = parsePromptFile(text);
//       onScenesGenerated(parsedScenes);
//     };
//     reader.readAsText(file);
//   };

//   const handleDrop = (e: React.DragEvent) => {
//     e.preventDefault();
//     setIsDragging(false);
//     const file = e.dataTransfer.files[0];
//     if (file && (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md'))) {
//       handleFile(file);
//     }
//   };

//   const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.currentTarget.files?.[0];
//     if (file) {
//       handleFile(file);
//     }
//   };

//   return (
//     <div className="space-y-6">
//       {/* Main Config */}
//       <div className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl shadow-2xl space-y-6">
//         <div className="flex items-center justify-between">
//           <h2 className="text-xl font-bold text-white flex items-center gap-2">
//             <Sparkles size={20} className="text-cyan-400" />
//             Video Settings
//           </h2>
//         </div>

//         {/* API Key */}
//         <div>
//           <label className="block text-sm font-semibold text-slate-200 mb-2">
//             API Key *
//           </label>
//           <div className="relative">
//             <input
//               type={showKey ? 'text' : 'password'}
//               value={localConfig.geminiApiKey}
//               onChange={(e) => handleChange('geminiApiKey', e.target.value)}
//               placeholder="Nhập Gemini API Key..."
//               disabled={disabled}
//               className="w-full pr-10 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none disabled:opacity-50 transition"
//             />
//             <button
//               type="button"
//               onClick={() => setShowKey(!showKey)}
//               className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition"
//             >
//               {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
//             </button>
//           </div>
//           <p className="text-xs text-slate-400 mt-1.5">
//             Lấy tại{' '}
//             <a 
//               href="https://aistudio.google.com/apikey" 
//               target="_blank" 
//               rel="noopener noreferrer"
//               className="text-cyan-400 hover:text-cyan-300 underline"
//             >
//               aistudio.google.com
//             </a>
//           </p>
//         </div>

//         {/* Video Description + Buttons */}
//         <div>
//           <label className="block text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
//             <Wand2 size={16} className="text-purple-400" />
//             Describe your video...
//           </label>
//           <textarea
//             value={videoDescription}
//             onChange={(e) => setVideoDescription(e.target.value)}
//             placeholder="Style: Cinematic 4K, warm lighting&#10;&#10;Characters: Baby, 8 months, blue shirt... Puppy, golden fur...&#10;&#10;Setting: Modern living room, white carpet, natural sunlight..."
//             disabled={disabled}
//             rows={6}
//             className="w-full px-4 py-4 bg-slate-700/30 border-2 border-slate-600 rounded-xl text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none disabled:opacity-50 resize-none transition placeholder:text-slate-500"
//           />
          
//           {/* TWO BUTTONS SIDE BY SIDE */}
//           <div className="flex items-center gap-3 mt-3">
//             <button
//               type="button"
//               onClick={() => setInputMode('storyboard')}
//               disabled={disabled}
//               className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
//                 inputMode === 'storyboard'
//                   ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg ring-2 ring-purple-400/50'
//                   : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600 hover:text-white hover:shadow-md'
//               } disabled:opacity-50 disabled:cursor-not-allowed`}
//             >
//               <Layers size={18} />
//               Storyboard
//             </button>
            
//             <button
//               type="button"
//               onClick={() => setInputMode('upload')}
//               disabled={disabled}
//               className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
//                 inputMode === 'upload'
//                   ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg ring-2 ring-cyan-400/50'
//                   : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600 hover:text-white hover:shadow-md'
//               } disabled:opacity-50 disabled:cursor-not-allowed`}
//             >
//               <Upload size={18} />
//               Upload File
//             </button>
//           </div>
          
//           <div className="flex items-center justify-between mt-2 mb-4">
//             <p className="text-xs text-slate-400">
//               {inputMode === 'storyboard' ? 'Tạo scenes thủ công' : 'Tải file .txt với nhiều scenes'}
//             </p>
//             <p className="text-xs text-slate-500">
//               {videoDescription.length} ký tự
//             </p>
//           </div>

//           {/* CONTENT APPEARS HERE IMMEDIATELY */}
//           <div className="mt-4 p-4 bg-slate-700/20 border border-slate-600 rounded-xl">
//             {inputMode === 'storyboard' ? (
//               // STORYBOARD MODE
//               <div className="space-y-4">
//                 <div className="flex items-center justify-between mb-4">
//                   <h3 className="text-sm font-semibold text-white flex items-center gap-2">
//                     <Layers size={16} className="text-purple-400" />
//                     Draft your scenes
//                   </h3>
//                   <p className="text-xs text-slate-400">Total: <span className="text-cyan-400 font-bold">{totalDuration}s</span></p>
//                 </div>

//                 <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
//                   {scenes.map((scene, index) => (
//                     <div
//                       key={scene.id}
//                       className="group bg-slate-800/50 border border-slate-600 rounded-lg p-3 hover:border-purple-500/50 transition"
//                     >
//                       <div className="flex items-center justify-between mb-2">
//                         <h4 className="text-sm font-bold text-white">Scene {index + 1}</h4>
//                         {scenes.length > 1 && (
//                           <button
//                             type="button"
//                             onClick={() => removeScene(scene.id)}
//                             disabled={disabled}
//                             className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 transition"
//                           >
//                             <Trash2 size={16} />
//                           </button>
//                         )}
//                       </div>

//                       <textarea
//                         value={scene.prompt}
//                         onChange={(e) => updateScene(scene.id, 'prompt', e.target.value)}
//                         placeholder="Describe this scene..."
//                         disabled={disabled}
//                         rows={2}
//                         className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded text-white text-sm placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500 outline-none disabled:opacity-50 resize-none mb-2"
//                       />

//                       <div className="flex items-center gap-2">
//                         <span className="text-xs text-slate-500">Duration:</span>
//                         {[5, 7.5, 10].map(dur => (
//                           <button
//                             key={dur}
//                             type="button"
//                             onClick={() => updateScene(scene.id, 'duration', dur)}
//                             disabled={disabled}
//                             className={`px-2 py-1 rounded text-xs font-semibold transition ${
//                               scene.duration === dur
//                                 ? 'bg-purple-500 text-white'
//                                 : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
//                             }`}
//                           >
//                             {dur}s
//                           </button>
//                         ))}
//                       </div>
//                     </div>
//                   ))}
//                 </div>

//                 <div className="flex gap-2 pt-3 border-t border-slate-600">
//                   <button
//                     type="button"
//                     onClick={addScene}
//                     disabled={disabled}
//                     className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition"
//                   >
//                     <Plus size={16} />
//                     Add Scene
//                   </button>
                  
//                   <button
//                     type="button"
//                     onClick={handleGenerateFromStoryboard}
//                     disabled={disabled || scenes.every(s => !s.prompt.trim())}
//                     className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
//                   >
//                     <Play size={16} />
//                     Generate
//                   </button>
//                 </div>

//                 <p className="text-xs text-blue-300 text-center">
//                   {scenes.filter(s => s.prompt.trim()).length} of {scenes.length} scenes ready
//                 </p>
//               </div>
//             ) : (
//               // UPLOAD MODE
//               <div
//                 onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
//                 onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
//                 onDrop={handleDrop}
//                 className={`border-2 border-dashed rounded-xl p-8 text-center transition ${
//                   isDragging 
//                     ? 'border-cyan-500 bg-cyan-500/10' 
//                     : 'border-slate-600 hover:border-cyan-500/50'
//                 }`}
//               >
//                 <div className="flex justify-center mb-4">
//                   <div className="p-3 bg-cyan-500/10 rounded-lg">
//                     <Upload className="w-8 h-8 text-cyan-400" />
//                   </div>
//                 </div>

//                 <h3 className="text-lg font-semibold text-white mb-2">
//                   Upload Prompt File
//                 </h3>
//                 <p className="text-slate-400 mb-4 text-sm">
//                   Drag and drop your .txt or .md file
//                 </p>

//                 {fileName && (
//                   <div className="mb-4 p-3 bg-green-900/20 border border-green-500/30 rounded flex items-center gap-2 justify-center">
//                     <File size={16} className="text-green-400" />
//                     <span className="text-green-400 text-sm">{fileName}</span>
//                   </div>
//                 )}

//                 <label>
//                   <input
//                     type="file"
//                     accept=".txt,.md"
//                     onChange={handleFileInput}
//                     disabled={disabled}
//                     className="hidden"
//                   />
//                   <span className="inline-block bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg font-medium cursor-pointer transition">
//                     Select File
//                   </span>
//                 </label>

//                 <p className="text-xs text-slate-500 mt-4">
//                   Supports .txt, .md | Each line = 1 scene
//                 </p>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Quick Settings */}
//         <div className="pt-4 border-t border-slate-700">
//           <div className="grid grid-cols-3 gap-3">
//             <div>
//               <label className="block text-xs font-medium text-slate-400 mb-2">Tỉ lệ</label>
//               <div className="flex gap-1.5">
//                 {(['16:9', '9:16'] as AspectRatio[]).map(ratio => (
//                   <button
//                     key={ratio}
//                     type="button"
//                     onClick={() => handleChange('aspectRatio', ratio)}
//                     disabled={disabled}
//                     className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
//                       localConfig.aspectRatio === ratio
//                         ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
//                         : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600'
//                     } disabled:opacity-50`}
//                   >
//                     {ratio}
//                   </button>
//                 ))}
//               </div>
//             </div>

//             <div>
//               <label className="block text-xs font-medium text-slate-400 mb-2">Batch</label>
//               <input
//                 type="number"
//                 value={localConfig.batchSize}
//                 onChange={(e) => handleChange('batchSize', parseInt(e.target.value))}
//                 min="1"
//                 max="5"
//                 disabled={disabled}
//                 className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm text-center font-semibold focus:ring-2 focus:ring-cyan-500 outline-none disabled:opacity-50"
//               />
//             </div>

//             <div>
//               <label className="block text-xs font-medium text-slate-400 mb-2">Giây/cảnh</label>
//               <input
//                 type="number"
//                 value={localConfig.durationSeconds}
//                 onChange={(e) => handleChange('durationSeconds', parseInt(e.target.value))}
//                 min="5"
//                 max="10"
//                 disabled={disabled}
//                 className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm text-center font-semibold focus:ring-2 focus:ring-cyan-500 outline-none disabled:opacity-50"
//               />
//             </div>
//           </div>
//         </div>

//         {/* Status */}
//         <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-700">
//           <div className="flex items-center gap-3">
//             <span className={localConfig.geminiApiKey ? 'text-green-400' : 'text-amber-400'}>
//               {localConfig.geminiApiKey ? '✓ API Key OK' : '⚠️ Cần API Key'}
//             </span>
//             <span className={videoDescription ? 'text-green-400' : 'text-slate-500'}>
//               {videoDescription ? '✓ Có mô tả' : '○ Chưa mô tả'}
//             </span>
//           </div>
//           <span className="text-slate-500">Auto-save</span>
//         </div>
//       </div>

//       {/* Tutorial */}
//       <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-xl overflow-hidden">
//         <button
//           type="button"
//           onClick={() => setShowTutorial(!showTutorial)}
//           className="w-full px-6 py-3 flex items-center justify-between hover:bg-white/5 transition"
//         >
//           <div className="flex items-center gap-3">
//             <HelpCircle size={18} className="text-blue-400" />
//             <span className="font-semibold text-white text-sm">Hướng dẫn sử dụng</span>
//           </div>
//           {showTutorial ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
//         </button>

//         {showTutorial && (
//           <div className="px-6 pb-6 text-sm text-slate-300 space-y-3">
//             <div className="space-y-2">
//               <p className="font-semibold text-white">1. Nhập API Key</p>
//               <p className="text-xs">Lấy tại aistudio.google.com → Create API key → Paste vào ô trên</p>
//             </div>
            
//             <div className="space-y-2">
//               <p className="font-semibold text-white">2. Mô tả video</p>
//               <p className="text-xs">Ghi rõ: Style (Cinematic/Pixar...), Characters (chi tiết ngoại hình), Setting (bối cảnh)</p>
//             </div>
            
//             <div className="space-y-2">
//               <p className="font-semibold text-white">3. Chọn cách nhập</p>
//               <p className="text-xs">Click <strong>Storyboard</strong> (tạo từng scene) hoặc <strong>Upload File</strong> (.txt với nhiều dòng)</p>
//             </div>
            
//             <div className="space-y-2">
//               <p className="font-semibold text-white">4. Generate!</p>
//               <p className="text-xs">Click Generate → Bật Consistency Mode → Start Processing → Tải video</p>
//             </div>
//           </div>
//         )}
//       </div>

//       <style jsx>{`
//         .custom-scrollbar::-webkit-scrollbar {
//           width: 6px;
//         }
//         .custom-scrollbar::-webkit-scrollbar-track {
//           background: rgba(51, 65, 85, 0.3);
//           border-radius: 10px;
//         }
//         .custom-scrollbar::-webkit-scrollbar-thumb {
//           background: rgba(148, 163, 184, 0.5);
//           border-radius: 10px;
//         }
//         .custom-scrollbar::-webkit-scrollbar-thumb:hover {
//           background: rgba(148, 163, 184, 0.7);
//         }
//       `}</style>
//     </div>
//   );
// }

// components/ConfigPanel.tsx
// components/ConfigPanel.tsx
// SORA-STYLE: Single textarea input for everything

// components/ConfigPanel.tsx
// Upload file section moved above tutorial

// 'use client';

// import { useState, useEffect, useRef } from 'react';
// import { Eye, EyeOff, Sparkles, HelpCircle, ChevronDown, ChevronUp, Wand2, Upload, FileText, X, Check } from 'lucide-react';
// import type { AspectRatio } from '../type';

// interface ConfigPanelProps {
//   config: {
//     geminiApiKey: string;
//     batchSize: number;
//     aspectRatio: string;
//     durationSeconds: number;
//     globalContext: string;
//   };
//   onConfigChange: (config: any) => void;
//   onPromptParsed: (scenes: string[]) => void;
//   disabled?: boolean;
// }

// export function ConfigPanel({ config, onConfigChange, onPromptParsed, disabled }: ConfigPanelProps) {
//   const [showKey, setShowKey] = useState(false);
//   const [localConfig, setLocalConfig] = useState(config);
//   const [showTutorial, setShowTutorial] = useState(false);
  
//   // Single big textarea (Sora style)
//   const [videoDescription, setVideoDescription] = useState('');

//   // File upload states
//   const [fileName, setFileName] = useState<string | null>(null);
//   const [sceneCount, setSceneCount] = useState(0);
//   const [isDragging, setIsDragging] = useState(false);
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   useEffect(() => {
//     const saved = localStorage.getItem('veoConfig');
//     const apiKey = sessionStorage.getItem('veoApiKey');
    
//     let needsUpdate = false;
//     let newConfig = { ...localConfig };

//     if (saved) {
//       const parsed = JSON.parse(saved);
//       newConfig = { ...newConfig, ...parsed };
      
//       if (parsed.videoDescription) setVideoDescription(parsed.videoDescription);
      
//       needsUpdate = true;
//     }
    
//     if (apiKey) {
//       newConfig.geminiApiKey = apiKey;
//       needsUpdate = true;
//     }

//     if (needsUpdate) {
//       setLocalConfig(newConfig);
//       onConfigChange(newConfig);
//     }
//   }, []);

//   const handleChange = (field: string, value: string | number) => {
//     const updated = { ...localConfig, [field]: value };
//     setLocalConfig(updated);
//     onConfigChange(updated);
//   };

//   // Auto-save when textarea changes
//   useEffect(() => {
//     handleChange('globalContext', videoDescription);
    
//     localStorage.setItem('veoConfig', JSON.stringify({
//       ...localConfig,
//       globalContext: videoDescription,
//       videoDescription,
//     }));
//   }, [videoDescription]);

//   // File upload handlers
//   const parseFile = (text: string) => {
//     const lines = text
//       .split('\n')
//       .map(l => l.trim())
//       .filter(l => l.length > 0);
    
//     setSceneCount(lines.length);
//     onPromptParsed(lines);
//   };

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     setFileName(file.name);
//     const reader = new FileReader();
//     reader.onload = (evt) => {
//       const text = evt.target?.result as string;
//       parseFile(text);
//     };
//     reader.readAsText(file);
//   };

//   const handleDragOver = (e: React.DragEvent) => {
//     e.preventDefault();
//     if (!disabled) setIsDragging(true);
//   };

//   const handleDragLeave = () => {
//     setIsDragging(false);
//   };

//   const handleDrop = (e: React.DragEvent) => {
//     e.preventDefault();
//     setIsDragging(false);
    
//     if (disabled) return;

//     const file = e.dataTransfer.files[0];
//     if (file && file.type === 'text/plain') {
//       setFileName(file.name);
//       const reader = new FileReader();
//       reader.onload = (evt) => {
//         const text = evt.target?.result as string;
//         parseFile(text);
//       };
//       reader.readAsText(file);
//     }
//   };

//   const handleClear = () => {
//     setFileName(null);
//     setSceneCount(0);
//     onPromptParsed([]);
//     if (fileInputRef.current) {
//       fileInputRef.current.value = '';
//     }
//   };

//   return (
//     <div className="space-y-6">
//       {/* Main Config Panel */}
//       <div className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl shadow-2xl space-y-6">
//         <div className="flex items-center justify-between">
//           <h2 className="text-xl font-bold text-white flex items-center gap-2">
//             <Sparkles size={20} className="text-cyan-400" />
//             Video Generator
//           </h2>
//         </div>

//         {/* API Key */}
//         <div>
//           <label className="block text-sm font-semibold text-slate-200 mb-2">
//             API Key *
//           </label>
//           <div className="relative">
//             <input
//               type={showKey ? 'text' : 'password'}
//               value={localConfig.geminiApiKey}
//               onChange={(e) => handleChange('geminiApiKey', e.target.value)}
//               placeholder="Nhập Gemini API Key..."
//               disabled={disabled}
//               className="w-full pr-10 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none disabled:opacity-50 transition"
//             />
//             <button
//               type="button"
//               onClick={() => setShowKey(!showKey)}
//               className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition"
//             >
//               {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
//             </button>
//           </div>
//           <p className="text-xs text-slate-400 mt-1.5">
//             Lấy tại{' '}
//             <a 
//               href="https://aistudio.google.com/apikey" 
//               target="_blank" 
//               rel="noopener noreferrer"
//               className="text-cyan-400 hover:text-cyan-300 underline"
//             >
//               aistudio.google.com
//             </a>
//           </p>
//         </div>

//         {/* MAIN TEXTAREA - SORA STYLE */}
//         <div>
//           <label className="block text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
//             <Wand2 size={16} className="text-purple-400" />
//             Describe your video...
//           </label>
//           <textarea
//             value={videoDescription}
//             onChange={(e) => setVideoDescription(e.target.value)}
//             placeholder="Ví dụ:&#10;&#10;Style: Pixar 3D animation&#10;&#10;Characters:&#10;- Em bé trai 1 tuổi, tóc vàng xù, áo xanh có hình gấu&#10;- Chú chó Corgi vàng nhạt, tai nhọn, cổ vòng đỏ&#10;&#10;Setting:&#10;Phòng khách ấm áp, thảm xám mềm, ánh sáng tự nhiên từ cửa sổ lớn"
//             disabled={disabled}
//             rows={8}
//             className="w-full px-4 py-4 bg-slate-700/30 border-2 border-slate-600 rounded-xl text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none disabled:opacity-50 resize-none transition placeholder:text-slate-500"
//           />
//           <div className="flex items-center justify-between mt-2">
//             <p className="text-xs text-slate-400">
//               Mô tả style, nhân vật, bối cảnh - càng chi tiết càng tốt
//             </p>
//             <p className="text-xs text-slate-500">
//               {videoDescription.length} ký tự
//             </p>
//           </div>
//         </div>

//         {/* Quick Settings - Compact */}
//         <div className="pt-4 border-t border-slate-700">
//           <div className="grid grid-cols-3 gap-3">
//             {/* Aspect Ratio */}
//             <div>
//               <label className="block text-xs font-medium text-slate-400 mb-2">
//                 Tỉ lệ
//               </label>
//               <div className="flex gap-1.5">
//                 {(['16:9', '9:16'] as AspectRatio[]).map(ratio => (
//                   <button
//                     key={ratio}
//                     type="button"
//                     onClick={() => handleChange('aspectRatio', ratio)}
//                     disabled={disabled}
//                     className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
//                       localConfig.aspectRatio === ratio
//                         ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
//                         : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600'
//                     } disabled:opacity-50`}
//                   >
//                     {ratio}
//                   </button>
//                 ))}
//               </div>
//             </div>

//             {/* Batch Size */}
//             <div>
//               <label className="block text-xs font-medium text-slate-400 mb-2">
//                 Batch
//               </label>
//               <input
//                 type="number"
//                 value={localConfig.batchSize}
//                 onChange={(e) => handleChange('batchSize', parseInt(e.target.value))}
//                 min="1"
//                 max="5"
//                 disabled={disabled}
//                 className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm text-center font-semibold focus:ring-2 focus:ring-cyan-500 outline-none disabled:opacity-50"
//               />
//             </div>

//             {/* Duration */}
//             <div>
//               <label className="block text-xs font-medium text-slate-400 mb-2">
//                 Giây/cảnh
//               </label>
//               <input
//                 type="number"
//                 value={localConfig.durationSeconds}
//                 onChange={(e) => handleChange('durationSeconds', parseInt(e.target.value))}
//                 min="5"
//                 max="10"
//                 disabled={disabled}
//                 className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm text-center font-semibold focus:ring-2 focus:ring-cyan-500 outline-none disabled:opacity-50"
//               />
//             </div>
//           </div>
//         </div>

//         {/* Status */}
//         <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-700">
//           <div className="flex items-center gap-3">
//             <span className={localConfig.geminiApiKey ? 'text-green-400' : 'text-amber-400'}>
//               {localConfig.geminiApiKey ? '✓ API Key OK' : '⚠️ Cần API Key'}
//             </span>
//             <span className={videoDescription ? 'text-green-400' : 'text-slate-500'}>
//               {videoDescription ? '✓ Có mô tả' : '○ Chưa mô tả'}
//             </span>
//           </div>
//           <span className="text-slate-500">
//             Auto-save
//           </span>
//         </div>
//       </div>

//       {/* FILE UPLOAD SECTION - Sora Style (Moved here, above tutorial) */}
//       <div className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl shadow-2xl space-y-3">
//         <h3 className="text-lg font-bold text-white flex items-center gap-2">
//           <FileText size={18} className="text-cyan-400" />
//           Upload Scenes File
//         </h3>

//         <div
//           onDragOver={handleDragOver}
//           onDragLeave={handleDragLeave}
//           onDrop={handleDrop}
//           className={`
//             relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300
//             ${isDragging 
//               ? 'border-cyan-400 bg-cyan-500/10 scale-[1.02]' 
//               : fileName 
//                 ? 'border-green-500/50 bg-green-500/5'
//                 : 'border-slate-600 bg-slate-800/30 hover:border-slate-500 hover:bg-slate-800/50'
//             }
//             ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
//           `}
//         >
//           <input
//             ref={fileInputRef}
//             type="file"
//             accept=".txt"
//             onChange={handleFileChange}
//             disabled={disabled}
//             className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
//           />

//           <div className="px-8 py-10 flex flex-col items-center justify-center text-center">
//             {fileName ? (
//               <>
//                 <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mb-4 shadow-lg shadow-green-500/50">
//                   <Check size={32} className="text-white" strokeWidth={3} />
//                 </div>
//                 <div className="flex items-center gap-2 mb-2">
//                   <FileText size={18} className="text-green-400" />
//                   <span className="font-semibold text-white">{fileName}</span>
//                 </div>
//                 <p className="text-sm text-green-400 font-medium">
//                   {sceneCount} scenes loaded
//                 </p>
//               </>
//             ) : (
//               <>
//                 <div className={`
//                   w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-300
//                   ${isDragging 
//                     ? 'bg-gradient-to-br from-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/50 scale-110' 
//                     : 'bg-gradient-to-br from-slate-700 to-slate-800'
//                   }
//                 `}>
//                   <Upload size={28} className={isDragging ? 'text-white' : 'text-slate-400'} strokeWidth={2.5} />
//                 </div>
                
//                 <h3 className="text-lg font-bold text-white mb-2">
//                   {isDragging ? 'Drop your file here' : 'Upload scenes'}
//                 </h3>
                
//                 <p className="text-sm text-slate-400 mb-4">
//                   Drag & drop or click to browse
//                 </p>
                
//                 <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700/50 rounded-full text-xs text-slate-300 border border-slate-600">
//                   <FileText size={14} />
//                   .txt files only
//                 </div>
//               </>
//             )}
//           </div>

//           {fileName && !disabled && (
//             <button
//               type="button"
//               onClick={(e) => {
//                 e.stopPropagation();
//                 handleClear();
//               }}
//               className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-400 hover:text-white transition-all duration-200 z-20 shadow-lg"
//             >
//               <X size={18} />
//             </button>
//           )}
//         </div>

//         <div className="flex items-start gap-2 text-xs text-slate-400 px-1">
//           <div className="w-1 h-1 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
//           <p>
//             Each line in your .txt file = one scene. Example: <span className="text-slate-300 font-mono">"Baby crawling on carpet"</span>
//           </p>
//         </div>
//       </div>

//       {/* Tutorial Section - Moved Below Upload */}
//       <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-xl overflow-hidden">
//         <button
//           type="button"
//           onClick={() => setShowTutorial(!showTutorial)}
//           className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition"
//         >
//           <div className="flex items-center gap-3">
//             <HelpCircle size={20} className="text-blue-400" />
//             <span className="font-semibold text-white">Hướng dẫn sử dụng</span>
//           </div>
//           {showTutorial ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
//         </button>

//         {showTutorial && (
//           <div className="px-6 pb-6 space-y-6">
//             {/* Step 1 */}
//             <div className="space-y-2">
//               <div className="flex items-center gap-2">
//                 <div className="w-8 h-8 rounded-full bg-cyan-500 text-white font-bold flex items-center justify-center text-sm">
//                   1
//                 </div>
//                 <h3 className="font-bold text-white">Lấy API Key</h3>
//               </div>
//               <div className="ml-10 space-y-2 text-sm text-slate-300">
//                 <p>• Truy cập: <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" className="text-cyan-400 underline">aistudio.google.com</a></p>
//                 <p>• Click <strong className="text-white">"Create API key"</strong></p>
//                 <p>• Copy và paste vào ô trên</p>
//               </div>
//             </div>

//             {/* Step 2 */}
//             <div className="space-y-2">
//               <div className="flex items-center gap-2">
//                 <div className="w-8 h-8 rounded-full bg-purple-500 text-white font-bold flex items-center justify-center text-sm">
//                   2
//                 </div>
//                 <h3 className="font-bold text-white">Mô tả video của bạn</h3>
//               </div>
//               <div className="ml-10 space-y-3 text-sm text-slate-300">
//                 <p className="text-yellow-300 font-semibold">💡 Ghi rõ 3 phần:</p>
                
//                 <div className="space-y-2">
//                   <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
//                     <p className="text-xs font-bold text-cyan-400 mb-1">1. Style (Phong cách)</p>
//                     <p className="text-xs text-white">
//                       Pixar 3D / Anime / Realistic / Studio Ghibli...
//                     </p>
//                   </div>

//                   <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
//                     <p className="text-xs font-bold text-purple-400 mb-1">2. Characters (Nhân vật)</p>
//                     <p className="text-xs text-white">
//                       Mô tả CHI TIẾT: tuổi, tóc, mắt, quần áo, đặc điểm
//                     </p>
//                   </div>

//                   <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
//                     <p className="text-xs font-bold text-pink-400 mb-1">3. Setting (Bối cảnh)</p>
//                     <p className="text-xs text-white">
//                       Không gian, ánh sáng, màu sắc, đồ vật
//                     </p>
//                   </div>
//                 </div>

//                 <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
//                   <p className="text-xs text-green-400 font-semibold mb-2">✅ Ví dụ HOÀN HẢO:</p>
//                   <pre className="text-xs text-white leading-relaxed whitespace-pre-wrap">
// {`Style: Pixar 3D animation

// Characters:
// - Baby boy, 1 year old, blonde curly hair, 
//   blue shirt with bear, white shorts
// - Corgi dog, golden fur, pointy ears, 
//   red collar with bell

// Setting:
// Warm living room, soft gray carpet, 
// natural sunlight from large window, 
// beige sofa, scattered toys`}
//                   </pre>
//                 </div>
//               </div>
//             </div>

//             {/* Step 3 */}
//             <div className="space-y-2">
//               <div className="flex items-center gap-2">
//                 <div className="w-8 h-8 rounded-full bg-green-500 text-white font-bold flex items-center justify-center text-sm">
//                   3
//                 </div>
//                 <h3 className="font-bold text-white">Upload file scenes</h3>
//               </div>
//               <div className="ml-10 space-y-2 text-sm text-slate-300">
//                 <p>• Tạo file <code className="px-1.5 py-0.5 bg-slate-800 rounded text-cyan-400">.txt</code> với các scenes</p>
//                 <p>• Mỗi dòng = 1 cảnh</p>
//                 <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 font-mono text-xs">
//                   <p className="text-green-400">Scene 1: Baby crawling on carpet</p>
//                   <p className="text-green-400">Scene 2: Dog enters room</p>
//                   <p className="text-green-400">Scene 3: Baby sees dog</p>
//                 </div>
//               </div>
//             </div>

//             {/* Step 4 */}
//             <div className="space-y-2">
//               <div className="flex items-center gap-2">
//                 <div className="w-8 h-8 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center text-sm">
//                   4
//                 </div>
//                 <h3 className="font-bold text-white">Start & Download</h3>
//               </div>
//               <div className="ml-10 space-y-2 text-sm text-slate-300">
//                 <p>• Click <strong className="text-cyan-400">"Start Processing"</strong></p>
//                 <p>• Chờ {Math.ceil(20 / localConfig.batchSize)} batches (~{Math.ceil(20 / localConfig.batchSize) * 70}s)</p>
//                 <p>• Tải xuống hoặc ghép video</p>
//               </div>
//             </div>

//             {/* Tips */}
//             <div className="pt-4 border-t border-blue-500/30 space-y-2">
//               <h4 className="font-bold text-blue-300 text-sm flex items-center gap-2">
//                 <Sparkles size={16} />
//                 Pro Tips
//               </h4>
//               <ul className="space-y-1 text-xs text-slate-300 ml-6">
//                 <li className="list-disc">Dùng tiếng Anh cho nhân vật = chính xác hơn</li>
//                 <li className="list-disc">Batch 3-4 = tốc độ tối ưu</li>
//                 <li className="list-disc">Mô tả chi tiết = video nhất quán</li>
//                 <li className="list-disc">10-20 scenes = video hoàn chỉnh</li>
//               </ul>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// components/ConfigPanel.tsx
// Separated: Description (characters/setting) + Upload (actions/scenes)

'use client';

import { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Sparkles, HelpCircle, ChevronDown, ChevronUp, Wand2, Upload, FileText, X, Check, Users, Video } from 'lucide-react';
import type { AspectRatio } from '../type';

interface ConfigPanelProps {
  config: {
    geminiApiKey: string;
    batchSize: number;
    aspectRatio: string;
    durationSeconds: number;
    globalContext: string;
  };
  onConfigChange: (config: any) => void;
  onPromptParsed: (scenes: string[]) => void;
  disabled?: boolean;
}

export function ConfigPanel({ config, onConfigChange, onPromptParsed, disabled }: ConfigPanelProps) {
  const [showKey, setShowKey] = useState(false);
  const [localConfig, setLocalConfig] = useState(config);
  const [showTutorial, setShowTutorial] = useState(false);
  
  // Description for characters/setting
  const [videoDescription, setVideoDescription] = useState('');

  // File upload for actions/scenes
  const [fileName, setFileName] = useState<string | null>(null);
  const [sceneCount, setSceneCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('veoConfig');
    const apiKey = sessionStorage.getItem('veoApiKey');
    
    let needsUpdate = false;
    let newConfig = { ...localConfig };

    if (saved) {
      const parsed = JSON.parse(saved);
      newConfig = { ...newConfig, ...parsed };
      
      if (parsed.videoDescription) setVideoDescription(parsed.videoDescription);
      
      needsUpdate = true;
    }
    
    if (apiKey) {
      newConfig.geminiApiKey = apiKey;
      needsUpdate = true;
    }

    if (needsUpdate) {
      setLocalConfig(newConfig);
      onConfigChange(newConfig);
    }
  }, []);

  const handleChange = (field: string, value: string | number) => {
    const updated = { ...localConfig, [field]: value };
    setLocalConfig(updated);
    onConfigChange(updated);
  };

  // Auto-save when textarea changes
  useEffect(() => {
    handleChange('globalContext', videoDescription);
    
    localStorage.setItem('veoConfig', JSON.stringify({
      ...localConfig,
      globalContext: videoDescription,
      videoDescription,
    }));
  }, [videoDescription]);

  // File upload handlers
  const parseFile = (text: string) => {
    const lines = text
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);
    
    setSceneCount(lines.length);
    onPromptParsed(lines);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      parseFile(text);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file && file.type === 'text/plain') {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        parseFile(text);
      };
      reader.readAsText(file);
    }
  };

  const handleClear = () => {
    setFileName(null);
    setSceneCount(0);
    onPromptParsed([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Config Panel */}
      <div className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles size={20} className="text-cyan-400" />
            Video Generator
          </h2>
        </div>

        {/* API Key */}
        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-2">
            API Key *
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={localConfig.geminiApiKey}
              onChange={(e) => handleChange('geminiApiKey', e.target.value)}
              placeholder="Nhập Gemini API Key..."
              disabled={disabled}
              className="w-full pr-10 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none disabled:opacity-50 transition"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition"
            >
              {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            Lấy tại{' '}
            <a 
              href="https://aistudio.google.com/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 underline"
            >
              aistudio.google.com
            </a>
          </p>
        </div>

        {/* DESCRIPTION - Characters & Setting */}
        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
            <Users size={16} className="text-purple-400" />
            Nhân vật & Bối cảnh
          </label>
          <textarea
            value={videoDescription}
            onChange={(e) => setVideoDescription(e.target.value)}
            placeholder="Mô tả nhân vật và bối cảnh chung cho toàn bộ video:&#10;&#10;Style: Pixar 3D animation&#10;&#10;Characters:&#10;- Baby boy, 1 year old, blonde curly hair, blue shirt with bear&#10;- Corgi dog, golden fur, pointy ears, red collar&#10;&#10;Setting:&#10;Warm living room, soft gray carpet, natural sunlight from window"
            disabled={disabled}
            rows={5}
            className="w-full px-4 py-4 bg-slate-700/30 border-2 border-slate-600 rounded-xl text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none disabled:opacity-50 resize-none transition placeholder:text-slate-500"
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-slate-400">
              💡 Mô tả chi tiết style, nhân vật, không gian chung
            </p>
            <p className="text-xs text-slate-500">
              {videoDescription.length} ký tự
            </p>
          </div>
        </div>

        {/* FILE UPLOAD - Actions/Scenes */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-700"></div>
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-700/50 rounded-full">
              <Video size={14} className="text-cyan-400" />
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Hành động / Scenes</span>
            </div>
            <div className="flex-1 h-px bg-slate-700"></div>
          </div>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative overflow-hidden rounded-xl border-2 border-dashed transition-all duration-300
              ${isDragging 
                ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]' 
                : fileName 
                  ? 'border-green-500/50 bg-green-500/5'
                  : 'border-slate-600 bg-slate-800/30 hover:border-slate-500 hover:bg-slate-800/50'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              onChange={handleFileChange}
              disabled={disabled}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
            />

            <div className="px-6 py-8 flex flex-col items-center justify-center text-center">
              {fileName ? (
                <>
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mb-3 shadow-lg shadow-green-500/50">
                    <Check size={28} className="text-white" strokeWidth={3} />
                  </div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <FileText size={16} className="text-green-400" />
                    <span className="font-semibold text-white text-sm">{fileName}</span>
                  </div>
                  <p className="text-xs text-green-400 font-medium">
                    {sceneCount} scenes loaded ✓
                  </p>
                </>
              ) : (
                <>
                  <div className={`
                    w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-all duration-300
                    ${isDragging 
                      ? 'bg-gradient-to-br from-cyan-400 to-blue-500 shadow-lg shadow-cyan-500/50 scale-110' 
                      : 'bg-gradient-to-br from-slate-700 to-slate-800'
                    }
                  `}>
                    <Upload size={24} className={isDragging ? 'text-white' : 'text-slate-400'} strokeWidth={2.5} />
                  </div>
                  
                  <p className="text-sm font-semibold text-white mb-1">
                    {isDragging ? 'Drop file here' : 'Upload actions file'}
                  </p>
                  
                  <p className="text-xs text-slate-400 mb-3">
                    Drag & drop or click to browse
                  </p>
                  
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/50 rounded-full text-xs text-slate-300 border border-slate-600">
                    <FileText size={12} />
                    .txt only
                  </div>
                </>
              )}
            </div>

            {fileName && !disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-400 hover:text-white transition-all duration-200 z-20 shadow-lg"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg space-y-1.5">
            <p className="text-xs text-blue-300 font-semibold">📹 File chứa các hành động theo thứ tự:</p>
            <div className="space-y-1 text-xs text-slate-300 ml-3">
              <p>• <span className="text-cyan-400 font-mono">Scene 1:</span> Baby crawling on carpet</p>
              <p>• <span className="text-cyan-400 font-mono">Scene 2:</span> Dog enters room, wagging tail</p>
              <p>• <span className="text-cyan-400 font-mono">Scene 3:</span> Baby sees dog, smiles</p>
            </div>
          </div> */}
        </div>

        {/* Quick Settings - Compact */}
        <div className="pt-4 border-t border-slate-700">
          <div className="grid grid-cols-3 gap-3">
            {/* Aspect Ratio */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">
                Tỉ lệ
              </label>
              <div className="flex gap-1.5">
                {(['16:9', '9:16'] as AspectRatio[]).map(ratio => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => handleChange('aspectRatio', ratio)}
                    disabled={disabled}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
                      localConfig.aspectRatio === ratio
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600'
                    } disabled:opacity-50`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* Batch Size */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">
                Batch Size
              </label>
              <input
                type="number"
                value={localConfig.batchSize}
                onChange={(e) => handleChange('batchSize', parseInt(e.target.value))}
                min="1"
                max="8"
                disabled={disabled}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm text-center font-semibold focus:ring-2 focus:ring-cyan-500 outline-none disabled:opacity-50"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">
                Giây/cảnh
              </label>
              <input
                type="number"
                value={localConfig.durationSeconds}
                onChange={(e) => handleChange('durationSeconds', parseInt(e.target.value))}
                min="5"
                max="8"
                disabled={disabled}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm text-center font-semibold focus:ring-2 focus:ring-cyan-500 outline-none disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-700">
          <div className="flex items-center gap-3">
            <span className={localConfig.geminiApiKey ? 'text-green-400' : 'text-amber-400'}>
              {localConfig.geminiApiKey ? '✓ API Key' : '⚠️ API Key'}
            </span>
            <span className={videoDescription ? 'text-green-400' : 'text-slate-500'}>
              {videoDescription ? '✓ Mô tả' : '○ Mô tả'}
            </span>
            <span className={sceneCount > 0 ? 'text-green-400' : 'text-slate-500'}>
              {sceneCount > 0 ? `✓ ${sceneCount} scenes` : '○ Scenes'}
            </span>
          </div>
          <span className="text-slate-500">
            Auto-save
          </span>
        </div>
      </div>

      {/* Tutorial Section */}
      <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowTutorial(!showTutorial)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition"
        >
          <div className="flex items-center gap-3">
            <HelpCircle size={20} className="text-blue-400" />
            <span className="font-semibold text-white">Hướng dẫn sử dụng</span>
          </div>
          {showTutorial ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
        </button>

        {showTutorial && (
          <div className="px-6 pb-6 space-y-6">
            {/* Step 1 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-cyan-500 text-white font-bold flex items-center justify-center text-sm">
                  1
                </div>
                <h3 className="font-bold text-white">Lấy API Key</h3>
              </div>
              <div className="ml-10 space-y-2 text-sm text-slate-300">
                <p>• Truy cập: <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" className="text-cyan-400 underline">aistudio.google.com</a></p>
                <p>• Click <strong className="text-white">"Create API key"</strong></p>
                <p>• Copy và paste vào ô API Key</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-500 text-white font-bold flex items-center justify-center text-sm">
                  2
                </div>
                <h3 className="font-bold text-white">Mô tả Nhân vật & Bối cảnh</h3>
              </div>
              <div className="ml-10 space-y-3 text-sm text-slate-300">
                <p className="text-purple-300 font-semibold">👥 Phần này mô tả <u>chung</u> cho toàn bộ video:</p>
                
                <div className="space-y-2">
                  <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                    <p className="text-xs font-bold text-cyan-400 mb-1">Style (Phong cách)</p>
                    <p className="text-xs text-white">
                      Pixar 3D / Anime / Realistic / Studio Ghibli...
                    </p>
                  </div>

                  <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                    <p className="text-xs font-bold text-purple-400 mb-1">Characters (Nhân vật)</p>
                    <p className="text-xs text-white">
                      Mô tả CHI TIẾT: tuổi, tóc, mắt, quần áo, đặc điểm
                    </p>
                  </div>

                  <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                    <p className="text-xs font-bold text-pink-400 mb-1">Setting (Bối cảnh)</p>
                    <p className="text-xs text-white">
                      Không gian, ánh sáng, màu sắc, đồ vật
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-500 text-white font-bold flex items-center justify-center text-sm">
                  3
                </div>
                <h3 className="font-bold text-white">Upload File Hành động</h3>
              </div>
              <div className="ml-10 space-y-2 text-sm text-slate-300">
                <p className="text-green-300 font-semibold">🎬 Phần này là các <u>hành động theo thứ tự</u>:</p>
                <p>• Tạo file <code className="px-1.5 py-0.5 bg-slate-800 rounded text-cyan-400">.txt</code></p>
                <p>• Mỗi dòng = 1 hành động/cảnh</p>
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 font-mono text-xs space-y-1">
                  <p className="text-green-400">Baby crawling on carpet toward toys</p>
                  <p className="text-green-400">Dog enters room, wagging tail happily</p>
                  <p className="text-green-400">Baby sees dog, eyes widen, smiles</p>
                  <p className="text-green-400">Baby reaches out hand to dog</p>
                  <p className="text-green-400">Dog sniffs baby's hand gently</p>
                </div>
                <p className="text-amber-300 text-xs">⚡ Không cần mô tả lại nhân vật/bối cảnh, chỉ ghi hành động!</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center text-sm">
                  4
                </div>
                <h3 className="font-bold text-white">Start & Download</h3>
              </div>
              <div className="ml-10 space-y-2 text-sm text-slate-300">
                <p>• Click <strong className="text-cyan-400">"Start Processing"</strong></p>
                <p>• Chờ xử lý (~70s/batch)</p>
                <p>• Tải xuống hoặc ghép video</p>
              </div>
            </div>

            {/* Tips */}
            <div className="pt-4 border-t border-blue-500/30 space-y-2">
              <h4 className="font-bold text-blue-300 text-sm flex items-center gap-2">
                <Sparkles size={16} />
                Pro Tips
              </h4>
              <ul className="space-y-1 text-xs text-slate-300 ml-6">
                <li className="list-disc">Mô tả nhân vật/bối cảnh 1 lần → Tất cả scenes giống nhau</li>
                <li className="list-disc">File actions chỉ ghi hành động ngắn gọn</li>
                <li className="list-disc">Dùng tiếng Anh = chính xác hơn</li>
                <li className="list-disc">10-20 scenes = video hoàn chỉnh</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}