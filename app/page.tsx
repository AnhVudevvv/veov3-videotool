'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Settings, Play, Loader2, Download, Film } from 'lucide-react';

interface Scene {
  id: number;
  prompt: string;
  duration: number;
  videoUrl?: string;
  status?: 'pending' | 'generating' | 'complete' | 'error';
}

interface AppConfig {
  geminiApiKey: string;
  batchSize: number;
  aspectRatio: '16:9' | '9:16';
  durationSeconds: number;
  globalContext: string;
}

export default function VeoApp() {
  // UI State
  const [showStoryboard, setShowStoryboard] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('');

  // Config
  const [config, setConfig] = useState<AppConfig>({
    geminiApiKey: '',
    batchSize: 3,
    aspectRatio: '16:9',
    durationSeconds: 8,
    globalContext: '',
  });

  // Scenes
  const [scenes, setScenes] = useState<Scene[]>([
    { id: 1, prompt: '', duration: 5, status: 'pending' },
    { id: 2, prompt: '', duration: 5.3, status: 'pending' }
  ]);
  const [nextId, setNextId] = useState(3);
  const [errors, setErrors] = useState<string[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved config
  useEffect(() => {
    const savedConfig = localStorage.getItem('veoConfig');
    const apiKey = sessionStorage.getItem('veoApiKey');
    
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      setConfig(prev => ({ ...prev, ...parsed }));
    }
    
    if (apiKey) {
      setConfig(prev => ({ ...prev, geminiApiKey: apiKey }));
    }
  }, []);

  // Save config
  const saveConfig = (newConfig: AppConfig) => {
    setConfig(newConfig);
    sessionStorage.setItem('veoApiKey', newConfig.geminiApiKey);
    localStorage.setItem('veoConfig', JSON.stringify({
      batchSize: newConfig.batchSize,
      aspectRatio: newConfig.aspectRatio,
      durationSeconds: newConfig.durationSeconds,
      globalContext: newConfig.globalContext,
    }));
  };

  // Scene management
  const addScene = () => {
    setScenes([...scenes, { id: nextId, prompt: '', duration: 5, status: 'pending' }]);
    setNextId(nextId + 1);
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
  };

  const removeScene = (id: number) => {
    if (scenes.length > 1) {
      setScenes(scenes.filter(s => s.id !== id));
    }
  };

  const updateScene = (id: number, field: keyof Scene, value: any) => {
    setScenes(scenes.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleSceneClick = (id: number) => {
    if (id === scenes[scenes.length - 1].id) {
      addScene();
    }
  };

  // File upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length > 0) {
        const newScenes = lines.map((line, index) => ({
          id: nextId + index,
          prompt: line.trim(),
          duration: 5,
          status: 'pending' as const
        }));
        setScenes(newScenes);
        setNextId(nextId + lines.length);
      }
    };
    reader.readAsText(file);
  };

  // Video generation
  const generateVideoForScene = async (scene: Scene, previousVideoUrl?: string): Promise<string> => {
    try {
      setCurrentStatus(`Generating: ${scene.prompt.substring(0, 50)}...`);
      updateScene(scene.id, 'status', 'generating');

      // Extract last frame from previous video if exists
      let lastFrameImage = null;
      if (previousVideoUrl) {
        try {
          lastFrameImage = await extractLastFrame(previousVideoUrl);
        } catch (err) {
          console.warn('Could not extract last frame:', err);
        }
      }

      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: scene.prompt,
          geminiApiKey: config.geminiApiKey,
          aspectRatio: config.aspectRatio,
          sceneContext: config.globalContext,
          lastFrameImage: lastFrameImage,
          durationSeconds: scene.duration,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Video generation failed');
      }

      const data = await response.json();
      updateScene(scene.id, 'videoUrl', data.gcsUrl);
      updateScene(scene.id, 'status', 'complete');
      
      return data.gcsUrl;
    } catch (error) {
      updateScene(scene.id, 'status', 'error');
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setErrors(prev => [...prev, `Scene ${scene.id}: ${errorMsg}`]);
      throw error;
    }
  };

  // Extract last frame for temporal continuity
  const extractLastFrame = async (videoUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.src = videoUrl;

      video.onloadedmetadata = () => {
        video.currentTime = video.duration - 0.1; // Last frame
      };

      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(dataUrl);
        } else {
          reject(new Error('Could not get canvas context'));
        }
      };

      video.onerror = () => reject(new Error('Video load failed'));
    });
  };

  // Batch processing with temporal continuity
  const handleStartProcessing = async () => {
    if (!config.geminiApiKey) {
      setErrors(['Please provide Gemini API key']);
      return;
    }

    if (scenes.some(s => !s.prompt.trim())) {
      setErrors(['All scenes must have prompts']);
      return;
    }

    setIsProcessing(true);
    setErrors([]);
    
    // Reset all scenes status
    setScenes(scenes.map(s => ({ ...s, status: 'pending' as const, videoUrl: undefined })));

    try {
      let previousVideoUrl: string | undefined = undefined;

      // Process scenes sequentially for temporal continuity
      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];
        setCurrentStatus(`Processing scene ${i + 1}/${scenes.length}`);

        try {
          const videoUrl = await generateVideoForScene(scene, previousVideoUrl);
          previousVideoUrl = videoUrl;

          // Wait between scenes to avoid rate limiting
          if (i < scenes.length - 1) {
            setCurrentStatus(`Waiting 10s before next scene...`);
            await new Promise(resolve => setTimeout(resolve, 10000));
          }
        } catch (error) {
          console.error(`Failed to generate scene ${i + 1}:`, error);
          // Continue with next scene even if this one failed
        }
      }

      setCurrentStatus('All scenes processed!');
    } catch (error) {
      console.error('Batch processing error:', error);
      setErrors(prev => [...prev, 'Processing failed: ' + (error instanceof Error ? error.message : 'Unknown error')]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Merge videos
  const handleMergeVideos = async () => {
    const completedUrls = scenes.filter(s => s.videoUrl).map(s => s.videoUrl!);
    
    if (completedUrls.length === 0) {
      setErrors(['No videos to merge']);
      return;
    }

    try {
      setCurrentStatus('Merging videos...');
      
      const response = await fetch('/api/merge-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrls: completedUrls,
          geminiApiKey: config.geminiApiKey,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to merge videos');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `merged_video_${completedUrls.length}scenes.mp4`;
      a.click();
      URL.revokeObjectURL(url);
      
      setCurrentStatus('Video merged successfully!');
    } catch (error) {
      setErrors(prev => [...prev, 'Merge failed: ' + (error instanceof Error ? error.message : 'Unknown error')]);
    }
  };

  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);
  const completedCount = scenes.filter(s => s.status === 'complete').length;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">
          Storyboard <span className="ml-2 text-xs bg-gray-700 px-2 py-1 rounded">BETA</span>
        </h1>
      </div>

      <div className="w-full max-w-7xl">
        {/* Main View - When Storyboard is NOT active */}
        {!showStoryboard && (
          <div className="flex flex-col items-center justify-center min-h-[500px]">
            {/* Preview Area */}
            <div className="w-full max-w-4xl grid grid-cols-3 gap-4 mb-8">
              {scenes.slice(0, 3).map((scene, i) => (
                <div key={scene.id} className="aspect-video bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
                  {scene.videoUrl ? (
                    <video 
                      src={scene.videoUrl} 
                      className="w-full h-full object-cover"
                      controls
                      muted
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600">
                      {scene.status === 'generating' ? (
                        <Loader2 className="animate-spin" size={24} />
                      ) : (
                        `Scene ${i + 1}`
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Status Display */}
            {currentStatus && (
              <div className="mb-4 text-sm text-cyan-400">
                {currentStatus}
              </div>
            )}

            {/* Progress */}
            {isProcessing && (
              <div className="mb-6 w-full max-w-2xl">
                <div className="bg-zinc-900 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-purple-600 h-full transition-all duration-500"
                    style={{ width: `${(completedCount / scenes.length) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-zinc-500 mt-2 text-center">
                  {completedCount} / {scenes.length} scenes completed
                </p>
              </div>
            )}

            {/* Errors */}
            {errors.length > 0 && (
              <div className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-lg max-w-2xl w-full">
                <h3 className="text-red-400 font-semibold mb-2">Errors:</h3>
                <ul className="text-sm text-red-300 space-y-1">
                  {errors.map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="w-full max-w-2xl">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowStoryboard(true)}
                  disabled={isProcessing}
                  className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-full px-4 py-2 text-sm transition-colors disabled:opacity-50"
                >
                  <Plus size={18} />
                  <span>Storyboard</span>
                </button>

                <button
                  onClick={() => setShowConfig(true)}
                  disabled={isProcessing}
                  className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-full px-4 py-2 text-sm transition-colors disabled:opacity-50"
                >
                  <Settings size={18} />
                  <span>Settings</span>
                </button>

                <div className="flex-1" />

                {completedCount > 0 && !isProcessing && (
                  <button
                    onClick={handleMergeVideos}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 rounded-full px-6 py-2 text-sm font-medium transition-colors"
                  >
                    <Download size={18} />
                    <span>Merge & Download</span>
                  </button>
                )}

                <button
                  onClick={handleStartProcessing}
                  disabled={isProcessing || !config.geminiApiKey || scenes.length === 0}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 rounded-full px-6 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Play size={18} />
                      <span>Generate</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Storyboard View */}
        {showStoryboard && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* LEFT - Draft Video */}
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">Draft your video</h2>
                <button
                  onClick={() => setShowStoryboard(false)}
                  className="text-zinc-500 hover:text-zinc-300 text-sm"
                >
                  Close
                </button>
              </div>
              
              {/* Scenes */}
              <div 
                ref={scrollRef}
                className="space-y-4 max-h-[500px] overflow-y-auto pr-2 mb-4"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#3f3f46 transparent'
                }}
              >
                {scenes.map((scene, index) => (
                  <div 
                    key={scene.id} 
                    onClick={() => handleSceneClick(scene.id)}
                    className={`bg-zinc-800 rounded-xl p-4 border transition-all cursor-pointer ${
                      scene.id === scenes[scenes.length - 1].id
                        ? 'border-purple-500/50 hover:border-purple-500'
                        : 'border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-zinc-300">Scene {index + 1}</h3>
                        {scene.status === 'complete' && (
                          <span className="text-green-400 text-xs">✓</span>
                        )}
                        {scene.status === 'generating' && (
                          <Loader2 size={14} className="animate-spin text-cyan-400" />
                        )}
                        {scene.status === 'error' && (
                          <span className="text-red-400 text-xs">✗</span>
                        )}
                      </div>
                      {scenes.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeScene(scene.id);
                          }}
                          className="text-zinc-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    
                    <textarea
                      value={scene.prompt}
                      onChange={(e) => {
                        e.stopPropagation();
                        updateScene(scene.id, 'prompt', e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Describe this scene... who, where, what happens?"
                      className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-300 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                      rows={3}
                    />
                    
                    <div className="mt-3 bg-zinc-900/50 rounded px-3 py-1.5 inline-block">
                      <span className="text-sm text-zinc-400">{scene.duration}s</span>
                    </div>

                    {scene.id === scenes[scenes.length - 1].id && (
                      <div className="mt-2 text-xs text-purple-400">
                        Click to add next scene
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Upload */}
              <div className="pt-4 border-t border-zinc-800">
                <p className="text-sm text-zinc-500 text-center mb-4">
                  Write your vision and we'll create every scene.
                </p>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-full p-3 transition-colors"
                  >
                    <Plus size={20} />
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.md"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  <input
                    type="text"
                    placeholder="Describe your video..."
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-full px-6 py-3 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        setScenes([...scenes, {
                          id: nextId,
                          prompt: e.currentTarget.value.trim(),
                          duration: 5,
                          status: 'pending'
                        }]);
                        setNextId(nextId + 1);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                </div>
              </div>

              <div className="mt-4 text-center">
                <p className="text-sm text-zinc-500">
                  Total: <span className="text-purple-400 font-semibold">
                    {Math.floor(totalDuration / 60)}m {Math.round(totalDuration % 60)}s
                  </span>
                </p>
              </div>
            </div>

            {/* RIGHT - Settings */}
            <div className="space-y-6">
              {/* Consistency Settings */}
              <div className="bg-gradient-to-br from-indigo-950/30 to-purple-950/30 rounded-2xl p-6 border border-indigo-800/20">
                <h3 className="text-lg font-semibold mb-3">Consistency Settings</h3>
                <textarea
                  value={config.globalContext}
                  onChange={(e) => saveConfig({ ...config, globalContext: e.target.value })}
                  placeholder="Describe consistent elements across all scenes...&#10;&#10;Example:&#10;Style: Pixar 3D animation, colorful and expressive&#10;Characters: Sarah (blonde girl, blue dress, 25), Alex (dark hair, black jacket)&#10;Setting: Cozy living room, warm afternoon light, wooden furniture"
                  className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg p-4 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  rows={8}
                />
                <p className="text-xs text-zinc-500 mt-2">
                  💡 Describe style, characters, and setting for consistency
                </p>
              </div>

              {/* Config */}
              <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                <h3 className="text-lg font-semibold mb-4">Configuration</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-zinc-300 mb-2">API Key</label>
                    <input
                      type="password"
                      value={config.geminiApiKey}
                      onChange={(e) => saveConfig({ ...config, geminiApiKey: e.target.value })}
                      placeholder="AIza..."
                      className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-300 mb-2">Aspect Ratio</label>
                    <div className="flex gap-2">
                      {(['16:9', '9:16'] as const).map(ratio => (
                        <button
                          key={ratio}
                          onClick={() => saveConfig({ ...config, aspectRatio: ratio })}
                          className={`flex-1 py-2.5 rounded-lg text-sm transition ${
                            config.aspectRatio === ratio
                              ? 'bg-purple-600 text-white'
                              : 'bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          {ratio}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-zinc-300 mb-2">Batch Size</label>
                      <input
                        type="number"
                        value={config.batchSize}
                        onChange={(e) => saveConfig({ ...config, batchSize: parseInt(e.target.value) })}
                        min="1"
                        max="5"
                        className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-zinc-300 mb-2">Duration (s)</label>
                      <input
                        type="number"
                        value={config.durationSeconds}
                        onChange={(e) => saveConfig({ ...config, durationSeconds: parseInt(e.target.value) })}
                        min="5"
                        max="10"
                        className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showConfig && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 rounded-2xl p-6 max-w-md w-full border border-zinc-800">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Settings</h2>
                <button
                  onClick={() => setShowConfig(false)}
                  className="text-zinc-500 hover:text-zinc-300"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-300 mb-2">Gemini API Key</label>
                  <input
                    type="password"
                    value={config.geminiApiKey}
                    onChange={(e) => saveConfig({ ...config, geminiApiKey: e.target.value })}
                    className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-300 mb-2">Aspect Ratio</label>
                  <div className="flex gap-2">
                    {(['16:9', '9:16'] as const).map(ratio => (
                      <button
                        key={ratio}
                        onClick={() => saveConfig({ ...config, aspectRatio: ratio })}
                        className={`flex-1 py-2 rounded-lg text-sm ${
                          config.aspectRatio === ratio
                            ? 'bg-purple-600 text-white'
                            : 'bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setShowConfig(false)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}