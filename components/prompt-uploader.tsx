'use client';

import { useState } from 'react';
import { Upload, File } from 'lucide-react';

interface PromptUploaderProps {
  onPromptParsed: (scenes: string[]) => void;
  disabled?: boolean;
}

export function PromptUploader({ onPromptParsed, disabled }: PromptUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');

  const parsePromptFile = (text: string) => {
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'));

    const scenes: string[] = [];
    let currentScene = '';

    lines.forEach((line) => {
      if (line.startsWith('-') || line.startsWith('Scene') || line.match(/^\d+\./)) {
        if (currentScene.trim()) {
          scenes.push(currentScene.trim());
        }
        currentScene = line.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, '').replace(/^Scene\s*\d+:\s*/i, '');
      } else {
        currentScene += (currentScene ? ' ' : '') + line;
      }
    });

    if (currentScene.trim()) {
      scenes.push(currentScene.trim());
    }

    return scenes.length > 0 ? scenes : lines;
  };

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const scenes = parsePromptFile(text);
      onPromptParsed(scenes);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md'))) {
      handleFile(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div className="p-8 bg-slate-800 border-slate-700 border-2 border-dashed hover:border-cyan-500/50 transition-colors rounded-lg">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
        onDrop={handleDrop}
        className="text-center"
      >
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-cyan-500/10 rounded-lg">
            <Upload className="w-6 h-6 text-cyan-400" />
          </div>
        </div>

        <h3 className="text-lg font-semibold text-white mb-2">
          Upload Prompt File
        </h3>
        <p className="text-slate-400 mb-4">
          Drag and drop your .txt or .md file, or click to browse
        </p>

        {fileName && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded flex items-center gap-2 justify-center">
            <File size={16} className="text-green-400" />
            <span className="text-green-400 text-sm">{fileName}</span>
          </div>
        )}

        <label>
          <input
            type="file"
            accept=".txt,.md"
            onChange={handleFileInput}
            disabled={disabled}
            className="hidden"
          />
          <button
            disabled={disabled}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg font-medium cursor-pointer disabled:bg-slate-600"
            onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
          >
            Select File
          </button>
        </label>

        <p className="text-xs text-slate-500 mt-4">
          Supports: .txt, .md | Each line or numbered item becomes a scene
        </p>
      </div>
    </div>
  );
}