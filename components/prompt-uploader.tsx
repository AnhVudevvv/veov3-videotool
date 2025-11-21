// components/prompt-uploader.tsx
'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Scissors } from 'lucide-react';

interface PromptUploaderProps {
  onPromptParsed: (scenes: string[]) => void;
  disabled?: boolean;
}

export function PromptUploader({ onPromptParsed, disabled }: PromptUploaderProps) {
  const [fileName, setFileName] = useState<string>('');
  const [sceneCount, setSceneCount] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const [manualInput, setManualInput] = useState<string>('');
  const [parseMode, setParseMode] = useState<'numbered' | 'linebreak'>('numbered');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusInput, setStatusInput] = useState<string>("upload");
  const parseScenes = (text: string): string[] => {
    if (!text.trim()) return [];

    let scenes: string[] = [];

    if (parseMode === 'numbered') {
      // Parse theo số thứ tự: "1. ", "2. ", "3. " hoặc "1) ", "2) "
      const numberedPattern = /^\d+[\.\)]\s+/gm;

      // Tách theo pattern
      const parts = text.split(numberedPattern);

      // Bỏ phần đầu nếu empty (trước số 1)
      scenes = parts
        .filter(s => s.trim().length > 0)
        .map(s => s.trim());

      // Fallback: Nếu không tìm thấy numbered format, thử line break
      if (scenes.length === 0) {
        console.log('[Parser] No numbered format found, falling back to line breaks');
        scenes = text
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);
      }
    } else {
      // Parse theo line breaks (mỗi dòng = 1 scene)
      scenes = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    }

    return scenes;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError('');

    try {
      const text = await file.text();
      const scenes = parseScenes(text);

      if (scenes.length === 0) {
        setError('File trống hoặc không có scenes nào được tìm thấy');
        setSceneCount(0);
        return;
      }

      setSceneCount(scenes.length);
      onPromptParsed(scenes);
      console.log('[PromptUploader] Parsed scenes:', scenes);
    } catch (err) {
      setError('Lỗi khi đọc file');
      console.error('[PromptUploader] File read error:', err);
    }
  };

  const handleManualParse = () => {
    if (!manualInput.trim()) {
      setError('Vui lòng nhập text');
      return;
    }

    setError('');
    const scenes = parseScenes(manualInput);

    if (scenes.length === 0) {
      setError('Không tìm thấy scenes nào. Hãy thử đổi parse mode.');
      setSceneCount(0);
      return;
    }

    setSceneCount(scenes.length);
    setFileName('Manual Input');
    onPromptParsed(scenes);
    console.log('[PromptUploader] Manually parsed scenes:', scenes);
  };

  const handleClear = () => {
    setFileName('');
    setSceneCount(0);
    setError('');
    setManualInput('');
    onPromptParsed([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-6 bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="text-cyan-400" size={24} />
          <h2 className="text-xl font-semibold text-white">Scene Prompts</h2>
        </div>

        {/* Parse Mode Toggle */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Parse mode:</span>
          <button
            onClick={() => setParseMode('numbered')}
            className={`px-3 py-1 rounded transition ${parseMode === 'numbered'
              ? 'bg-cyan-600 text-white'
              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
          >
            1. 2. 3.
          </button>
          <button
            onClick={() => setParseMode('linebreak')}
            className={`px-3 py-1 rounded transition ${parseMode === 'linebreak'
              ? 'bg-cyan-600 text-white'
              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
          >
            Lines
          </button>
        </div>
      </div>

      {/* Tab Selection */}
      <div className="flex gap-2 border-b border-slate-700">
        <button
          onClick={() => setStatusInput("upload")}
          className={`px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition border-b-2 ${statusInput === "upload" ? "border-cyan-500" : "border-transparent hover:border-cyan-500"
            }`}
        >
          📁 Upload File
        </button>
        <button
          onClick={() => setStatusInput("manual")}
          className={`px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition border-b-2 ${statusInput === "manual" ? "border-cyan-500" : "border-transparent hover:border-cyan-500"
            }`}
        >
          ✏️ Manual Input
        </button>
      </div>

      {/* Upload Section */}
      <div id="upload-tab" className="space-y-4">
        {statusInput === "upload" ? (
          <div className="flex items-center gap-4">
            <label
              htmlFor="file-upload"
              className={`flex-1 flex items-center justify-center gap-3 px-6 py-8 border-2 border-dashed rounded-lg cursor-pointer transition ${disabled
                ? 'border-slate-700 bg-slate-900/50 cursor-not-allowed'
                : 'border-slate-600 hover:border-cyan-500 hover:bg-slate-900/50'
                }`}
            >
              <input
                ref={fileInputRef}
                id="file-upload"
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                disabled={disabled}
                className="hidden"
              />
              <Upload className={disabled ? 'text-slate-600' : 'text-cyan-400'} size={32} />
              <div className="text-center">
                <p className={`font-medium ${disabled ? 'text-slate-600' : 'text-white'}`}>
                  Click to upload or drag & drop
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  .txt file with scene descriptions
                </p>
              </div>
            </label>
          </div>
        ) :
          (
            <div id="manual-tab" className="space-y-4">
              <textarea
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                disabled={disabled}
                placeholder={
                  parseMode === 'numbered'
                    ? "1. First scene description here\n2. Second scene description\n3. Third scene description"
                    : "First scene description here\nSecond scene description\nThird scene description"
                }
                className="w-full h-64 px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm"
              />
              <button
                onClick={handleManualParse}
                disabled={disabled || !manualInput.trim()}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-700 text-white px-4 py-2 rounded-lg font-medium disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                <Scissors size={16} />
                Parse Scenes
              </button>
            </div>
          )}


        {/* Parse Mode Info */}
        <div className="p-3 bg-blue-900/20 border border-blue-800 rounded text-xs text-blue-300">
          <div className="flex items-center gap-2 mb-1">
            <Scissors size={14} />
            <span className="font-semibold">Parse Mode: {parseMode === 'numbered' ? 'Numbered' : 'Line Break'}</span>
          </div>
          {parseMode === 'numbered' ? (
            <div>
              Tách scenes theo số thứ tự: <code className="bg-blue-950 px-1 rounded">1. Scene one</code>, <code className="bg-blue-950 px-1 rounded">2. Scene two</code>
            </div>
          ) : (
            <div>
              Tách scenes theo dòng mới (mỗi dòng = 1 scene)
            </div>
          )}
        </div>
      </div>

      {/* Manual Input Section */}


      {/* Status Display */}
      {fileName && (
        <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-700">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-green-400" size={20} />
            <div>
              <p className="text-sm font-medium text-white">{fileName}</p>
              <p className="text-xs text-slate-400">
                {sceneCount} scene{sceneCount !== 1 ? 's' : ''} detected
              </p>
            </div>
          </div>
          <button
            onClick={handleClear}
            className="text-sm text-red-400 hover:text-red-300 transition"
          >
            Clear
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-900/50 border border-red-700 rounded-lg">
          <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Format Examples */}
      <details className="text-xs text-slate-500">
        <summary className="cursor-pointer hover:text-slate-400 flex items-center gap-2">
          <span>📋 Format Examples</span>
        </summary>
        <div className="mt-3 space-y-3 p-3 bg-slate-900/50 rounded border border-slate-800">
          <div>
            <div className="font-semibold text-slate-400 mb-1">Numbered Format (Recommended):</div>
            <pre className="text-slate-500 whitespace-pre-wrap">
              {`1. A detailed description of the first scene...
2. The second scene description...
3. The third scene description...`}
            </pre>
          </div>

          <div>
            <div className="font-semibold text-slate-400 mb-1">Line Break Format:</div>
            <pre className="text-slate-500 whitespace-pre-wrap">
              {`First scene description
Second scene description
Third scene description`}
            </pre>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <div className="font-semibold text-yellow-500 mb-1">⚠️ Important Tips:</div>
            <ul className="list-disc list-inside space-y-1 text-slate-500">
              <li>Scene 1 should be EXTREMELY detailed (300+ words)</li>
              <li>Scenes 2+ can be brief (just describe the new action)</li>
              <li>Use "Numbered" mode if your text has "1. 2. 3." format</li>
              <li>Use "Line Break" mode if each line is a separate scene</li>
            </ul>
          </div>
        </div>
      </details>
    </div>
  );
}