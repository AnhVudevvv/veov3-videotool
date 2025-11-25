// components/StoryboardBuilder.tsx
'use client';

import { useState } from 'react';
import { Plus, Trash2, GripVertical, Play } from 'lucide-react';

interface Scene {
  id: string;
  prompt: string;
  duration: number;
}

interface StoryboardBuilderProps {
  onScenesGenerated: (scenes: string[]) => void;
  disabled?: boolean;
}

export function StoryboardBuilder({ onScenesGenerated, disabled }: StoryboardBuilderProps) {
  const [scenes, setScenes] = useState<Scene[]>([
    { id: '1', prompt: '', duration: 5 },
  ]);

  const addScene = () => {
    const newId = (Math.max(...scenes.map(s => parseInt(s.id)), 0) + 1).toString();
    setScenes([...scenes, { id: newId, prompt: '', duration: 5 }]);
  };

  const removeScene = (id: string) => {
    if (scenes.length > 1) {
      setScenes(scenes.filter(s => s.id !== id));
    }
  };

  const updateScene = (id: string, field: 'prompt' | 'duration', value: string | number) => {
    setScenes(scenes.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const handleGenerate = () => {
    const validScenes = scenes
      .filter(s => s.prompt.trim().length > 0)
      .map(s => s.prompt.trim());
    
    if (validScenes.length === 0) {
      alert('Vui lòng nhập ít nhất 1 scene!');
      return;
    }
    
    onScenesGenerated(validScenes);
  };

  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);

  return (
    <div className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Play size={20} className="text-purple-400" />
            Storyboard
            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-500/30">
              BETA
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Draft your video scene by scene
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Total duration</p>
          <p className="text-lg font-bold text-cyan-400">{totalDuration}s</p>
        </div>
      </div>

      {/* Scenes List */}
      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 mb-6">
        {scenes.map((scene, index) => (
          <div
            key={scene.id}
            className="group bg-slate-700/30 border border-slate-600 rounded-xl p-4 hover:border-purple-500/50 transition-all"
          >
            {/* Scene Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300"
                  title="Drag to reorder"
                >
                  <GripVertical size={18} />
                </button>
                <h3 className="font-bold text-white">Scene {index + 1}</h3>
              </div>
              
              {scenes.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeScene(scene.id)}
                  disabled={disabled}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 transition disabled:opacity-50"
                  title="Delete scene"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>

            {/* Scene Prompt */}
            <textarea
              value={scene.prompt}
              onChange={(e) => updateScene(scene.id, 'prompt', e.target.value)}
              placeholder="Describe this scene... who, where, what happens?"
              disabled={disabled}
              rows={3}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white text-sm placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none disabled:opacity-50 resize-none transition mb-3"
            />

            {/* Duration Selector */}
            <div className="flex items-center gap-3">
              <label className="text-xs text-slate-400 font-medium">Duration:</label>
              <div className="flex items-center gap-2">
                {[5, 7.5, 10].map(dur => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => updateScene(scene.id, 'duration', dur)}
                    disabled={disabled}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      scene.duration === dur
                        ? 'bg-purple-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    } disabled:opacity-50`}
                  >
                    {dur}s
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={addScene}
          disabled={disabled}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition disabled:opacity-50 border border-slate-600"
        >
          <Plus size={18} />
          Add Scene
        </button>
        
        <button
          type="button"
          onClick={handleGenerate}
          disabled={disabled || scenes.every(s => !s.prompt.trim())}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition disabled:opacity-50 shadow-lg shadow-purple-500/20"
        >
          <Play size={18} />
          Generate Video
        </button>
      </div>

      {/* Info */}
      <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <p className="text-xs text-blue-300">
          <span className="mr-2">💡</span>
          {scenes.filter(s => s.prompt.trim()).length} of {scenes.length} scenes ready • Total: {totalDuration}s video
        </p>
      </div>
    </div>
  );
}