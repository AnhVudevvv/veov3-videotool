
export type RenderStatus = 'idle' | 'rendering' | 'paused' | 'completed' | 'error';

export type SceneStatus = 'pending' | 'rendering' | 'completed' | 'error';

export interface Scene {
    id: number;
    prompt: string;
    status: SceneStatus;
    error?: string;
}

export interface GeneratedClip {
    prompt: string;
    url: string;
    blob: Blob;
}

export type AspectRatio = '16:9' | '9:16';

export interface AppConfig {
  geminiApiKey: string;
  batchSize: number;
  aspectRatio: AspectRatio;
  durationSeconds: number;
  globalContext: string;
}