
export interface ImageState {
  original: string | null;
  generated: string | null;
  mimeType: string;
}

export interface GenerationConfig {
  aspectRatio: string;
  imageSize: string;
}

export interface ProductAttribute {
  id: string;
  text: string;
  iconBase64?: string;
  iconMime?: string;
}

export interface QueueItem {
  id: string;
  file?: File; // Optional now
  originalPreview?: string; // Optional now
  mimeType: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  resultPreview?: string;
  error?: string;
  duration?: number; // Duration in seconds
  
  // Layout Generator Specific Data (Per Product)
  layoutData?: {
    title: string;
    attributes: ProductAttribute[];
    userInstructions?: string; // New field for specific blueprint context
  };
}

export interface Prompt {
  id: string;
  name: string;
  content: string;
}

export type Language = 'vi' | 'en';
export type Theme = 'light' | 'dark';
export type Resolution = '1K' | '2K' | '4K';
export type LayoutMode = 'reference' | 'blueprint' | 'auto_design';

export interface AppSettings {
  language: Language;
  theme: Theme;
  resolution: Resolution;
  activePromptId: string;
  savedLogo?: string | null; // Base64 string
  savedLogoMime?: string;
  
  // Layout Generator Global Inputs
  layoutMode: LayoutMode; // New: Switch between Reference Image and Blueprint
  layoutReferenceImage?: string | null; 
  layoutReferenceImageMime?: string;
  
  layoutBlueprintImage?: string | null; // New: Blueprint image
  layoutBlueprintImageMime?: string; // New: Blueprint mime

  downloadWidth?: number; // Cache user preference for width
  downloadHeight?: number; // Cache user preference for height
  filenamePattern?: string; // Regex pattern for extracting barcode/name
}

export enum AppStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}
