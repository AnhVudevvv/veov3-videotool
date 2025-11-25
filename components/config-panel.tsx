
// 'use client';

// import { useState, useEffect } from 'react';
// import { Eye, EyeOff, Palette, Users, MapPin, Info } from 'lucide-react';
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
//   disabled?: boolean;
// }

// const STYLE_PRESETS = [
//   { 
//     value: 'pixar', 
//     label: '3D Pixar',
//     prompt: 'Pixar 3D animation style, colorful, smooth textures, expressive characters, warm lighting, high quality render'
//   },
//   { 
//     value: 'anime', 
//     label: 'Anime',
//     prompt: 'Japanese anime style, cel-shaded, vibrant colors, detailed backgrounds, dynamic camera angles'
//   },
//   { 
//     value: 'ghibli', 
//     label: 'Studio Ghibli',
//     prompt: 'Studio Ghibli watercolor style, hand-drawn aesthetic, soft colors, peaceful atmosphere, detailed nature'
//   },
//   { 
//     value: 'realistic', 
//     label: 'Realistic',
//     prompt: 'Photorealistic cinematic style, natural lighting, shallow depth of field, film grain, 4K quality'
//   },
//   { 
//     value: 'disney', 
//     label: 'Disney',
//     prompt: 'Classic Disney animation, smooth movements, vibrant colors, expressive faces, whimsical'
//   },
//   { 
//     value: 'cyberpunk', 
//     label: 'Cyberpunk',
//     prompt: 'Cyberpunk futuristic style, neon lights, rainy streets, dark atmosphere, blade runner aesthetic'
//   },
// ];

// export function ConfigPanel({ config, onConfigChange, disabled }: ConfigPanelProps) {
//   const [showKey, setShowKey] = useState(false);
//   const [localConfig, setLocalConfig] = useState(config);
  
//   // Consistency fields
//   const [selectedStyle, setSelectedStyle] = useState('');
//   const [characters, setCharacters] = useState('');
//   const [setting, setSetting] = useState('');
//   const [customStyle, setCustomStyle] = useState('');

//   useEffect(() => {
//     const saved = localStorage.getItem('veoConfig');
//     const apiKey = sessionStorage.getItem('veoApiKey');
    
//     let needsUpdate = false;
//     let newConfig = { ...localConfig };

//     if (saved) {
//       const parsed = JSON.parse(saved);
//       newConfig = { ...newConfig, ...parsed };
      
//       // Load advanced settings
//       if (parsed.characters) setCharacters(parsed.characters);
//       if (parsed.setting) setSetting(parsed.setting);
//       if (parsed.selectedStyle) setSelectedStyle(parsed.selectedStyle);
//       if (parsed.customStyle) setCustomStyle(parsed.customStyle);
      
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

//   // Auto-build globalContext
//   const buildGlobalContext = () => {
//     const parts: string[] = [];
    
//     // 1. Style
//     if (selectedStyle) {
//       const stylePreset = STYLE_PRESETS.find(s => s.value === selectedStyle);
//       if (stylePreset) {
//         parts.push(`VISUAL STYLE: ${stylePreset.prompt}`);
//       }
//     }
    
//     if (customStyle.trim()) {
//       parts.push(`ADDITIONAL STYLE: ${customStyle}`);
//     }
    
//     // 2. Characters
//     if (characters.trim()) {
//       parts.push(`CHARACTERS:\n${characters}`);
//     }
    
//     // 3. Setting
//     if (setting.trim()) {
//       parts.push(`SETTING/LOCATION:\n${setting}`);
//     }
    
//     const globalContext = parts.join('\n\n');
    
//     // Update config
//     handleChange('globalContext', globalContext);
    
//     // Save to localStorage
//     localStorage.setItem('veoConfig', JSON.stringify({
//       ...localConfig,
//       globalContext,
//       characters,
//       setting,
//       selectedStyle,
//       customStyle,
//     }));
//   };

//   // Auto-update when fields change
//   useEffect(() => {
//     buildGlobalContext();
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [selectedStyle, characters, setting, customStyle]);

//   return (
//     <div className="p-6 bg-slate-800 border border-slate-700 rounded-lg space-y-5">
//       <h2 className="text-lg font-semibold text-white">Configuration</h2>

//       {/* API Key */}
//       <div>
//         <label className="block text-sm font-medium text-slate-300 mb-2">
//           Gemini API Key
//         </label>
//         <div className="relative">
//           <input
//             type={showKey ? 'text' : 'password'}
//             value={localConfig.geminiApiKey}
//             onChange={(e) => handleChange('geminiApiKey', e.target.value)}
//             placeholder="AIza..."
//             disabled={disabled}
//             className="w-full pr-10 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:ring-2 focus:ring-cyan-500 outline-none disabled:opacity-50"
//           />
//           <button
//             onClick={() => setShowKey(!showKey)}
//             className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
//           >
//             {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
//           </button>
//         </div>
//         <p className="text-xs text-slate-500 mt-1">
//           Get from aistudio.google.com
//         </p>
//       </div>

//       {/* Aspect Ratio */}
//       <div>
//         <label className="block text-sm font-medium text-slate-300 mb-2">
//           Aspect Ratio
//         </label>
//         <div className="flex gap-2">
//           {(['16:9', '9:16'] as AspectRatio[]).map(ratio => (
//             <button
//               key={ratio}
//               onClick={() => handleChange('aspectRatio', ratio)}
//               disabled={disabled}
//               className={`flex-1 py-2 px-3 rounded text-sm font-medium transition disabled:opacity-50 ${
//                 localConfig.aspectRatio === ratio
//                   ? 'bg-cyan-600 text-white'
//                   : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
//               }`}
//             >
//               {ratio}
//             </button>
//           ))}
//         </div>
//       </div>

//       <div className="grid grid-cols-2 gap-3">
//         {/* Batch Size */}
//         <div>
//           <label className="block text-sm font-medium text-slate-300 mb-2">
//             Batch Size
//           </label>
//           <input
//             type="number"
//             value={localConfig.batchSize}
//             onChange={(e) => handleChange('batchSize', parseInt(e.target.value))}
//             min="1"
//             max="5"
//             disabled={disabled}
//             className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:ring-2 focus:ring-cyan-500 outline-none disabled:opacity-50"
//           />
//         </div>

//         {/* Duration */}
//         <div>
//           <label className="block text-sm font-medium text-slate-300 mb-2">
//             Duration (s)
//           </label>
//           <input
//             type="number"
//             value={localConfig.durationSeconds}
//             onChange={(e) => handleChange('durationSeconds', parseInt(e.target.value))}
//             min="5"
//             max="10"
//             disabled={disabled}
//             className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:ring-2 focus:ring-cyan-500 outline-none disabled:opacity-50"
//           />
//         </div>
//       </div>

//       {/* CONSISTENCY SECTION */}
//       <div className="pt-4 border-t border-slate-700 space-y-4">
//         <div className="flex items-center gap-2">
//           <h3 className="text-sm font-bold text-purple-300">
//             Consistency Settings
//           </h3>
//           <div className="group relative">
//             <Info size={14} className="text-slate-500 cursor-help" />
//             <div className="hidden group-hover:block absolute left-0 top-6 w-64 p-2 bg-slate-900 border border-slate-600 rounded text-xs text-slate-300 z-10">
//               Thiết lập này đảm bảo nhân vật, bối cảnh và phong cách nhất quán cho TẤT CẢ các scene
//             </div>
//           </div>
//         </div>

//         {/* Style Preset */}
//         <div>
//           <label className="flex items-center gap-2 text-xs font-medium text-slate-300 mb-2">
//             <Palette size={12} />
//             Thể loại (Visual Style)
//           </label>
//           <select
//             value={selectedStyle}
//             onChange={(e) => setSelectedStyle(e.target.value)}
//             disabled={disabled}
//             className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:ring-2 focus:ring-cyan-500 outline-none disabled:opacity-50"
//           >
//             <option value="">-- Chọn style --</option>
//             {STYLE_PRESETS.map(style => (
//               <option key={style.value} value={style.value}>
//                 {style.label}
//               </option>
//             ))}
//           </select>
//         </div>

//         {/* Custom Style */}
//         {selectedStyle && (
//           <div>
//             <label className="block text-xs font-medium text-slate-300 mb-2">
//               Custom Style (optional)
//             </label>
//             <input
//               type="text"
//               value={customStyle}
//               onChange={(e) => setCustomStyle(e.target.value)}
//               placeholder="e.g., Cinematic 4K, warm lighting..."
//               disabled={disabled}
//               className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:ring-2 focus:ring-cyan-500 outline-none disabled:opacity-50"
//             />
//           </div>
//         )}

//         {/* Characters */}
//         <div>
//           <label className="flex items-center gap-2 text-xs font-medium text-slate-300 mb-2">
//             <Users size={12} />
//             Nhân vật (Characters)
//           </label>
//           <textarea
//             value={characters}
//             onChange={(e) => setCharacters(e.target.value)}
//             placeholder="VD: Sarah - cô gái tóc vàng, váy xanh, 25 tuổi&#10;Alex - chàng trai tóc đen, áo khoác đen"
//             disabled={disabled}
//             rows={3}
//             className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:ring-2 focus:ring-cyan-500 outline-none disabled:opacity-50 resize-none"
//           />
//           <p className="text-xs text-slate-500 mt-1">
//             Mô tả chi tiết: tên, ngoại hình, trang phục
//           </p>
//         </div>

//         {/* Setting */}
//         <div>
//           <label className="flex items-center gap-2 text-xs font-medium text-slate-300 mb-2">
//             <MapPin size={12} />
//             Bối cảnh (Setting)
//           </label>
//           <textarea
//             value={setting}
//             onChange={(e) => setSetting(e.target.value)}
//             placeholder="VD: Phòng khách ấm áp, ánh sáng chiều, đồ gỗ, cửa sổ lớn"
//             disabled={disabled}
//             rows={2}
//             className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:ring-2 focus:ring-cyan-500 outline-none disabled:opacity-50 resize-none"
//           />
//           <p className="text-xs text-slate-500 mt-1">
//             Mô tả không gian, ánh sáng, môi trường
//           </p>
//         </div>

//         {/* Preview */}
//         {localConfig.globalContext && (
//           <div className="p-3 bg-slate-900/60 border border-purple-500/20 rounded">
//             <p className="text-xs text-purple-300 font-semibold mb-1">
//               📝 Global Context Preview:
//             </p>
//             <pre className="text-xs text-slate-400 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
//               {localConfig.globalContext}
//             </pre>
//           </div>
//         )}
//       </div>

//       <div className="pt-3 border-t border-slate-700 space-y-1">
//         <p className="text-xs text-slate-400 flex items-center gap-1">
//           <span>✓</span>
//           <span>Settings được lưu vào localStorage</span>
//         </p>
//         <p className="text-xs text-amber-400 flex items-center gap-1">
//           <span>💡</span>
//           <span>Càng chi tiết → Video càng nhất quán</span>
//         </p>
//       </div>
//     </div>
//   );
// }

// components/ConfigPanel.tsx
'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Palette, Users, MapPin, Info } from 'lucide-react';
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
  disabled?: boolean;
}

const STYLE_PRESETS = [
  { 
    value: 'pixar', 
    label: '3D Pixar',
    prompt: 'Pixar 3D animation style, colorful, smooth textures, expressive characters, warm lighting, high quality render'
  },
  { 
    value: 'anime', 
    label: 'Anime',
    prompt: 'Japanese anime style, cel-shaded, vibrant colors, detailed backgrounds, dynamic camera angles'
  },
  { 
    value: 'ghibli', 
    label: 'Studio Ghibli',
    prompt: 'Studio Ghibli watercolor style, hand-drawn aesthetic, soft colors, peaceful atmosphere, detailed nature'
  },
  { 
    value: 'realistic', 
    label: 'Realistic',
    prompt: 'Photorealistic cinematic style, natural lighting, shallow depth of field, film grain, 4K quality'
  },
  { 
    value: 'disney', 
    label: 'Disney',
    prompt: 'Classic Disney animation, smooth movements, vibrant colors, expressive faces, whimsical'
  },
  { 
    value: 'cyberpunk', 
    label: 'Cyberpunk',
    prompt: 'Cyberpunk futuristic style, neon lights, rainy streets, dark atmosphere, blade runner aesthetic'
  },
];

export function ConfigPanel({ config, onConfigChange, disabled }: ConfigPanelProps) {
  const [showKey, setShowKey] = useState(false);
  const [localConfig, setLocalConfig] = useState(config);
  
  // Consistency fields
  const [selectedStyle, setSelectedStyle] = useState('');
  const [characters, setCharacters] = useState('');
  const [setting, setSetting] = useState('');
  const [customStyle, setCustomStyle] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('veoConfig');
    const apiKey = sessionStorage.getItem('veoApiKey');
    
    let needsUpdate = false;
    let newConfig = { ...localConfig };

    if (saved) {
      const parsed = JSON.parse(saved);
      newConfig = { ...newConfig, ...parsed };
      
      // Load advanced settings
      if (parsed.characters) setCharacters(parsed.characters);
      if (parsed.setting) setSetting(parsed.setting);
      if (parsed.selectedStyle) setSelectedStyle(parsed.selectedStyle);
      if (parsed.customStyle) setCustomStyle(parsed.customStyle);
      
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (field: string, value: string | number) => {
    const updated = { ...localConfig, [field]: value };
    setLocalConfig(updated);
    onConfigChange(updated);
  };

  // Auto-build globalContext
  const buildGlobalContext = () => {
    const parts: string[] = [];
    
    // 1. Style
    if (selectedStyle) {
      const stylePreset = STYLE_PRESETS.find(s => s.value === selectedStyle);
      if (stylePreset) {
        parts.push(`VISUAL STYLE: ${stylePreset.prompt}`);
      }
    }
    
    if (customStyle.trim()) {
      parts.push(`ADDITIONAL STYLE: ${customStyle}`);
    }
    
    // 2. Characters
    if (characters.trim()) {
      parts.push(`CHARACTERS:\n${characters}`);
    }
    
    // 3. Setting
    if (setting.trim()) {
      parts.push(`SETTING/LOCATION:\n${setting}`);
    }
    
    const globalContext = parts.join('\n\n');
    
    // Update config
    handleChange('globalContext', globalContext);
    
    // Save to localStorage
    localStorage.setItem('veoConfig', JSON.stringify({
      ...localConfig,
      globalContext,
      characters,
      setting,
      selectedStyle,
      customStyle,
    }));
  };

  // Auto-update when fields change
  useEffect(() => {
    buildGlobalContext();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStyle, characters, setting, customStyle]);

  return (
    <div className="p-6 bg-slate-800 border border-slate-700 rounded-lg space-y-5">
      <h2 className="text-lg font-semibold text-white">Configuration</h2>

      {/* API Key */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Gemini API Key
        </label>
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={localConfig.geminiApiKey}
            onChange={(e) => handleChange('geminiApiKey', e.target.value)}
            placeholder="AIza..."
            disabled={disabled}
            className="w-full pr-10 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:ring-2 focus:ring-cyan-500 outline-none disabled:opacity-50"
          />
          <button
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
          >
            {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Get from aistudio.google.com
        </p>
      </div>

      {/* Aspect Ratio */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Aspect Ratio
        </label>
        <div className="flex gap-2">
          {(['16:9', '9:16'] as AspectRatio[]).map(ratio => (
            <button
              key={ratio}
              onClick={() => handleChange('aspectRatio', ratio)}
              disabled={disabled}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition disabled:opacity-50 ${
                localConfig.aspectRatio === ratio
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
            >
              {ratio}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Batch Size */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Batch Size
          </label>
          <input
            type="number"
            value={localConfig.batchSize}
            onChange={(e) => handleChange('batchSize', parseInt(e.target.value))}
            min="1"
            max="5"
            disabled={disabled}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:ring-2 focus:ring-cyan-500 outline-none disabled:opacity-50"
          />
          <p className="text-xs text-slate-500 mt-1">
            {localConfig.batchSize} videos tạo cùng lúc
          </p>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Duration (s)
          </label>
          <input
            type="number"
            value={localConfig.durationSeconds}
            onChange={(e) => handleChange('durationSeconds', parseInt(e.target.value))}
            min="5"
            max="10"
            disabled={disabled}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:ring-2 focus:ring-cyan-500 outline-none disabled:opacity-50"
          />
        </div>
      </div>

      {/* CONSISTENCY SECTION */}
      <div className="pt-4 border-t border-slate-700 space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-purple-300">
            Consistency Settings
          </h3>
          <div className="group relative">
            <Info size={14} className="text-slate-500 cursor-help" />
            <div className="hidden group-hover:block absolute left-0 top-6 w-64 p-2 bg-slate-900 border border-slate-600 rounded text-xs text-slate-300 z-10">
              Thiết lập này đảm bảo nhân vật, bối cảnh và phong cách nhất quán cho TẤT CẢ các scene
            </div>
          </div>
        </div>

        {/* Style Preset */}
        <div>
          <label className="flex items-center gap-2 text-xs font-medium text-slate-300 mb-2">
            <Palette size={12} />
            Thể loại (Visual Style)
          </label>
          <select
            value={selectedStyle}
            onChange={(e) => setSelectedStyle(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:ring-2 focus:ring-cyan-500 outline-none disabled:opacity-50"
          >
            <option value="">-- Không chọn (optional) --</option>
            {STYLE_PRESETS.map(style => (
              <option key={style.value} value={style.value}>
                {style.label}
              </option>
            ))}
          </select>
        </div>

        {/* Custom Style */}
        {selectedStyle && (
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Custom Style (optional)
            </label>
            <input
              type="text"
              value={customStyle}
              onChange={(e) => setCustomStyle(e.target.value)}
              placeholder="e.g., Cinematic 4K, warm lighting..."
              disabled={disabled}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:ring-2 focus:ring-cyan-500 outline-none disabled:opacity-50"
            />
          </div>
        )}

        {/* Characters */}
        <div>
          <label className="flex items-center gap-2 text-xs font-medium text-slate-300 mb-2">
            <Users size={12} />
            Nhân vật (Characters)
          </label>
          <textarea
            value={characters}
            onChange={(e) => setCharacters(e.target.value)}
            placeholder="VD: Sarah - cô gái tóc vàng, váy xanh, 25 tuổi&#10;Alex - chàng trai tóc đen, áo khoác đen"
            disabled={disabled}
            rows={3}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:ring-2 focus:ring-cyan-500 outline-none disabled:opacity-50 resize-none"
          />
          <p className="text-xs text-slate-500 mt-1">
            Mô tả chi tiết: tên, ngoại hình, trang phục
          </p>
        </div>

        {/* Setting */}
        <div>
          <label className="flex items-center gap-2 text-xs font-medium text-slate-300 mb-2">
            <MapPin size={12} />
            Bối cảnh (Setting)
          </label>
          <textarea
            value={setting}
            onChange={(e) => setSetting(e.target.value)}
            placeholder="VD: Phòng khách ấm áp, ánh sáng chiều, đồ gỗ, cửa sổ lớn"
            disabled={disabled}
            rows={2}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:ring-2 focus:ring-cyan-500 outline-none disabled:opacity-50 resize-none"
          />
          <p className="text-xs text-slate-500 mt-1">
            Mô tả không gian, ánh sáng, môi trường
          </p>
        </div>

        {/* Preview */}
        {localConfig.globalContext && (
          <div className="p-3 bg-slate-900/60 border border-purple-500/20 rounded">
            <p className="text-xs text-purple-300 font-semibold mb-1">
              📝 Global Context Preview:
            </p>
            <pre className="text-xs text-slate-400 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
              {localConfig.globalContext}
            </pre>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-slate-700 space-y-1">
        <p className="text-xs text-slate-400 flex items-center gap-1">
          <span>✓</span>
          <span>Settings được lưu vào localStorage</span>
        </p>
        <p className="text-xs text-amber-400 flex items-center gap-1">
          <span>💡</span>
          <span>Càng chi tiết → Video càng nhất quán</span>
        </p>
      </div>
    </div>
  );
}
