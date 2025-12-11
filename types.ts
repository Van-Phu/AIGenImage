
export interface ImageState {
  original: string | null;
  generated: string | null;
  mimeType: string;
}

export interface GenerationConfig {
  aspectRatio: string;
  imageSize: string;
}

export interface QueueItem {
  id: string;
  file: File;
  originalPreview: string;
  mimeType: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  resultPreview?: string;
  error?: string;
  duration?: number; // Duration in seconds
}

export interface Prompt {
  id: string;
  name: string;
  content: string;
}

export type Language = 'vi' | 'en';
export type Theme = 'light' | 'dark';
export type Resolution = '1K' | '2K' | '4K';

export interface AppSettings {
  language: Language;
  theme: Theme;
  resolution: Resolution;
  activePromptId: string;
  savedLogo?: string | null; // Base64 string
  savedLogoMime?: string;
  downloadWidth?: number; // Cache user preference for width
  downloadHeight?: number; // Cache user preference for height
}

export enum AppStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}