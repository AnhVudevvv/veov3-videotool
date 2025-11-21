
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
// type.ts

export interface AppConfig {
  geminiApiKey: string;
  batchSize: number;
  aspectRatio: AspectRatio;
  durationSeconds: number;
}

export interface VideoGenerationRequest {
  prompt: string;
  geminiApiKey: string;
  aspectRatio: AspectRatio;
  seed?: number;
  sceneContext?: string;
  isFirstScene?: boolean;
}

export interface VideoGenerationResponse {
  gcsUrl: string;
  success: boolean;
  usedContext?: boolean;
}

export interface ContextExtractionRequest {
  prompt: string;
  geminiApiKey: string;
}

export interface ContextExtractionResponse {
  context: string;
  success: boolean;
}

export interface BatchProgress {
  completed: number;
  total: number;
  currentBatch: number;
  videoUrls: string[];
}