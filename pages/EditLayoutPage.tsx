
import React, { useState, useRef, useEffect } from 'react';
import { EditorWorkspace } from '../components/EditorWorkspace';
import { runBatchEditor } from '../services/geminiService';
import { AppSettings, QueueItem, Prompt } from '../types';
import { translations } from '../translations';

interface EditLayoutPageProps {
  apiKey: string | null;
  prompts: Prompt[];
  globalSettings: AppSettings;
  onOpenPromptManager: () => void;
  onDisconnect: () => void;
}

const MAX_QUEUE_SIZE = 10;
const DEFAULT_PAGE_SETTINGS: Partial<AppSettings> = {
  resolution: '1K',
  activePromptId: 'default',
  filenamePattern: '(\\d{8,14})',
};

export const EditLayoutPage: React.FC<EditLayoutPageProps> = ({
  apiKey,
  prompts,
  globalSettings,
  onOpenPromptManager,
  onDisconnect
}) => {
  const t = translations[globalSettings.language];
  
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [localSettings, setLocalSettings] = useState<AppSettings>(() => {
    try {
        const saved = localStorage.getItem('gemini_settings_editor');
        return saved ? { ...globalSettings, ...JSON.parse(saved) } : { ...globalSettings, ...DEFAULT_PAGE_SETTINGS };
    } catch {
        return { ...globalSettings, ...DEFAULT_PAGE_SETTINGS };
    }
  });

  useEffect(() => {
    setLocalSettings(prev => ({ ...prev, language: globalSettings.language, theme: globalSettings.theme }));
  }, [globalSettings.language, globalSettings.theme]);

  useEffect(() => {
    localStorage.setItem('gemini_settings_editor', JSON.stringify(localSettings));
  }, [localSettings]);

  const stopProcessingRef = useRef<boolean>(false);

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const resizeImage = (base64Str: string, targetWidth?: number, targetHeight?: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!targetWidth && !targetHeight) { resolve(base64Str); return; }
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const finalWidth = targetWidth || (targetHeight ? (img.width * targetHeight) / img.height : img.width);
        const finalHeight = targetHeight || (targetWidth ? (img.height * targetWidth) / img.width : img.height);
        canvas.width = finalWidth;
        canvas.height = finalHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, finalWidth, finalHeight);
          resolve(canvas.toDataURL('image/png'));
        } else { reject(new Error("Canvas context failed")); }
      };
      img.onerror = reject;
      img.src = base64Str;
    });
  };

  const extractFilename = (originalName: string, pattern?: string) => {
    if (!pattern) return originalName.replace(/\.[^/.]+$/, "");
    try {
      const regex = new RegExp(pattern);
      const match = originalName.match(regex);
      if (match && match.length > 0) return match[1] || match[0];
    } catch (e) { console.warn(e); }
    return originalName.replace(/\.[^/.]+$/, "");
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (queue.length + files.length > MAX_QUEUE_SIZE) { alert(t.maxImagesWarning); return; }

    const newItems: QueueItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        try {
          const preview = await readFileAsBase64(file);
          newItems.push({
            id: Math.random().toString(36).substring(7) + Date.now() + i, 
            file, originalPreview: preview, mimeType: file.type, status: 'pending'
          });
        } catch (e) { console.error(e); }
      }
    }
    setQueue(prev => [...prev, ...newItems]);
    setErrorMsg(null);
    if (newItems.length > 0 && !selectedId) setSelectedId(newItems[0].id);
  };

  const processQueue = async () => {
    if (isProcessing || isSaving) return;
    const activePrompt = prompts.find(p => p.id === localSettings.activePromptId);
    if (!activePrompt) { setErrorMsg(t.error + ": " + t.selectToView); return; }

    setIsProcessing(true);
    stopProcessingRef.current = false;
    setErrorMsg(null);

    const pendingIds = queue.filter(item => item.status === 'pending').map(item => item.id);
    if (pendingIds.length === 0) { setIsProcessing(false); return; }

    for (const id of pendingIds) {
      if (stopProcessingRef.current) { setIsProcessing(false); return; }
      setSelectedId(id);
      setQueue(prev => prev.map(i => i.id === id ? { ...i, status: 'processing' } : i));

      const itemData = queue.find(q => q.id === id); 
      if (!itemData) continue;
      const startTime = Date.now();
      
      try {
        // CALL BATCH EDITOR SERVICE
        const resultImage = await runBatchEditor({
          originalImageBase64: itemData.originalPreview,
          mimeType: itemData.mimeType,
          prompt: activePrompt.content, 
          logoBase64: localSettings.savedLogo,
          logoMimeType: localSettings.savedLogoMime,
          imageSize: localSettings.resolution,
          apiKey: apiKey
        });
        
        const endTime = Date.now();
        setQueue(prev => prev.map(i => i.id === id ? { 
          ...i, status: 'success', resultPreview: resultImage, duration: (endTime - startTime) / 1000 
        } : i));

      } catch (err: any) {
        if (err.message === "API_KEY_INVALID") {
            onDisconnect(); setErrorMsg(t.apiKeyInvalid); setIsProcessing(false); return;
        }
        setQueue(prev => prev.map(i => i.id === id ? { ...i, status: 'error', error: err.message || "Failed" } : i));
      }
      await new Promise(r => setTimeout(r, 500));
    }
    setIsProcessing(false);
  };

  const handleRefine = async (id: string, prompt: string) => {
      const item = queue.find(q => q.id === id);
      if (!item || !item.resultPreview) return;

      setIsProcessing(true);
      setErrorMsg(null);
      
      // Temporarily mark as processing
      setQueue(prev => prev.map(i => i.id === id ? { ...i, status: 'processing' } : i));

      const startTime = Date.now();
      try {
          // Use runBatchEditor for image-to-image refinement
          const resultImage = await runBatchEditor({
              originalImageBase64: item.resultPreview, // Use previous result as input
              mimeType: 'image/png',
              prompt: prompt,
              imageSize: localSettings.resolution,
              apiKey: apiKey
          });
          
          const endTime = Date.now();
          setQueue(prev => prev.map(i => i.id === id ? { 
              ...i, status: 'success', resultPreview: resultImage, duration: (endTime - startTime) / 1000 
          } : i));
          
      } catch (err: any) {
          if (err.message === "API_KEY_INVALID") {
            onDisconnect(); setErrorMsg(t.apiKeyInvalid);
          }
          // Revert to success state with old image if failed, but show error
          setQueue(prev => prev.map(i => i.id === id ? { ...i, status: 'success', error: err.message || "Refine Failed" } : i));
          setErrorMsg(err.message || "Refinement failed");
      }
      setIsProcessing(false);
  };

  const handleDownloadAll = async () => {
    const successItems = queue.filter(i => i.status === 'success' && i.resultPreview);
    if (successItems.length === 0) return;
    const nameCounts = new Map<string, number>();
    const useDirectoryPicker = 'showDirectoryPicker' in window;
    
    if (useDirectoryPicker) {
      try {
        const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite', startIn: 'downloads' });
        setIsSaving(true);
        for (const item of successItems) {
          if (!item.resultPreview) continue;
          const baseName = extractFilename(item.file.name, localSettings.filenamePattern);
          const currentCount = (nameCounts.get(baseName) || 0) + 1;
          nameCounts.set(baseName, currentCount);
          const newName = `${baseName} (${currentCount}).png`;
          try {
            const processedImage = await resizeImage(item.resultPreview, localSettings.downloadWidth, localSettings.downloadHeight);
            const response = await fetch(processedImage);
            const blob = await response.blob();
            const fileHandle = await handle.getFileHandle(newName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();
          } catch (e) { console.error(e); }
        }
        setIsSaving(false); alert(t.saveSuccess); return;
      } catch (err) { setIsSaving(false); }
    }
    // Fallback
    for (const item of successItems) {
      if (item.resultPreview) {
        const baseName = extractFilename(item.file.name, localSettings.filenamePattern);
        const currentCount = (nameCounts.get(baseName) || 0) + 1;
        nameCounts.set(baseName, currentCount);
        const newName = `${baseName} (${currentCount}).png`;
        const processedImage = await resizeImage(item.resultPreview, localSettings.downloadWidth, localSettings.downloadHeight);
        const link = document.createElement('a'); link.href = processedImage; link.download = newName;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        await new Promise(r => setTimeout(r, 300));
      }
    }
  };

  return (
    <EditorWorkspace 
      queue={queue}
      selectedId={selectedId}
      settings={localSettings}
      prompts={prompts}
      isProcessing={isProcessing}
      isSaving={isSaving}
      errorMsg={errorMsg}
      language={globalSettings.language}
      onFilesSelected={handleFilesSelected}
      onSelectQueueItem={setSelectedId}
      onDeleteItem={(id, e) => { e.stopPropagation(); setQueue(prev => prev.filter(i => i.id !== id)); if(selectedId === id) setSelectedId(null); }}
      onClearAll={() => { if(!isProcessing) { setQueue([]); setSelectedId(null); } }}
      onProcess={processQueue}
      onStop={() => stopProcessingRef.current = true}
      onRegenerate={(id) => setQueue(prev => prev.map(i => i.id === id ? { ...i, status: 'pending', resultPreview: undefined, error: undefined } : i))}
      onRefine={handleRefine}
      onDownloadItem={async (item) => {
         if (!item.resultPreview) return;
         const processedImage = await resizeImage(item.resultPreview, localSettings.downloadWidth, localSettings.downloadHeight);
         const baseName = extractFilename(item.file.name, localSettings.filenamePattern);
         const link = document.createElement('a'); link.href = processedImage; link.download = `${baseName} (1).png`;
         document.body.appendChild(link); link.click(); document.body.removeChild(link);
      }}
      onDownloadAll={handleDownloadAll}
      onUpdateSetting={(k, v) => setLocalSettings(prev => ({ ...prev, [k]: v }))}
      onManagePrompts={onOpenPromptManager}
    />
  );
};
