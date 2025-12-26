
import React, { useState, useRef, useEffect } from 'react';
import { LayoutWorkspace } from '../components/LayoutWorkspace';
import { runLayoutGenerator, runBatchEditor } from '../services/geminiService';
import { AppSettings, QueueItem, Prompt } from '../types';
import { translations } from '../translations';

interface CreateLayoutPageProps {
  apiKey: string | null;
  prompts: Prompt[];
  globalSettings: AppSettings;
  onOpenPromptManager: () => void;
  onDisconnect: () => void;
}

const MAX_QUEUE_SIZE = 10;
const DEFAULT_PAGE_SETTINGS: Partial<AppSettings> = {
  resolution: '1K',
  activePromptId: 'layout_gen',
  filenamePattern: '(\\d{8,14})',
  layoutMode: 'reference' // Default to Reference Mode
};

export const CreateLayoutPage: React.FC<CreateLayoutPageProps> = ({
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
        const saved = localStorage.getItem('gemini_settings_layout');
        return saved ? { ...globalSettings, ...JSON.parse(saved) } : { ...globalSettings, ...DEFAULT_PAGE_SETTINGS };
    } catch {
        return { ...globalSettings, ...DEFAULT_PAGE_SETTINGS };
    }
  });

  // Switch prompt automatically when mode changes
  useEffect(() => {
    if (localSettings.layoutMode === 'blueprint') {
        if (localSettings.activePromptId !== 'blueprint_gen') {
            setLocalSettings(prev => ({ ...prev, activePromptId: 'blueprint_gen' }));
        }
    } else if (localSettings.layoutMode === 'auto_design') {
        if (localSettings.activePromptId !== 'auto_design') {
             setLocalSettings(prev => ({ ...prev, activePromptId: 'auto_design' }));
        }
    } else {
        // Reference Mode
        if (localSettings.activePromptId !== 'layout_gen') {
             setLocalSettings(prev => ({ ...prev, activePromptId: 'layout_gen' }));
        }
    }
    // Clear queue when switching modes to avoid confusion
    if (queue.length > 0 && !isProcessing) {
        setQueue([]);
        setSelectedId(null);
    }
  }, [localSettings.layoutMode]);

  useEffect(() => {
    setLocalSettings(prev => ({ ...prev, language: globalSettings.language, theme: globalSettings.theme }));
  }, [globalSettings.language, globalSettings.theme]);

  useEffect(() => {
    localStorage.setItem('gemini_settings_layout', JSON.stringify(localSettings));
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
        } else { reject(new Error("Canvas")); }
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
    } catch (e) {}
    return originalName.replace(/\.[^/.]+$/, "");
  };

  // --- ACTIONS ---

  const handleAddEmptyProduct = () => {
      if (queue.length >= MAX_QUEUE_SIZE) { alert(t.maxImagesWarning); return; }
      const newId = Math.random().toString(36).substring(7) + Date.now();
      const newItem: QueueItem = {
          id: newId,
          // No file initially
          mimeType: 'image/png', // Default placeholder type
          status: 'pending',
          layoutData: {
              title: "Product " + (queue.length + 1),
              attributes: []
          }
      };
      setQueue(prev => [...prev, newItem]);
      setSelectedId(newId);
  };

  const handleUpdateProductImage = async (id: string, file: File) => {
      try {
          const preview = await readFileAsBase64(file);
          setQueue(prev => prev.map(item => {
              if (item.id === id) {
                  return {
                      ...item,
                      file: file,
                      originalPreview: preview,
                      mimeType: file.type,
                      layoutData: {
                          ...item.layoutData!,
                          title: item.layoutData?.title === ("Product " + (queue.findIndex(q => q.id === id) + 1)) 
                                ? file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ") 
                                : item.layoutData!.title
                      }
                  };
              }
              return item;
          }));
      } catch (e) { console.error(e); }
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
          // Initialize layoutData with default title (filename)
          newItems.push({
            id: Math.random().toString(36).substring(7) + Date.now() + i, 
            file, 
            originalPreview: preview, 
            mimeType: file.type, 
            status: 'pending',
            layoutData: {
                title: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
                attributes: []
            }
          });
        } catch (e) { console.error(e); }
      }
    }
    setQueue(prev => [...prev, ...newItems]);
    setErrorMsg(null);
    if (newItems.length > 0 && !selectedId) setSelectedId(newItems[0].id);
  };

  const handleUpdateItemData = (id: string, data: Partial<NonNullable<QueueItem['layoutData']>>) => {
      setQueue(prev => prev.map(item => {
          if (item.id === id) {
              return {
                  ...item,
                  layoutData: {
                      ...item.layoutData!,
                      ...data
                  }
              };
          }
          return item;
      }));
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

  const processQueue = async () => {
    if (isProcessing || isSaving) return;
    const activePrompt = prompts.find(p => p.id === localSettings.activePromptId);
    if (!activePrompt) { setErrorMsg(t.error + ": " + t.selectToView); return; }
    
    const mode = localSettings.layoutMode || 'reference';

    // VALIDATION
    if (mode === 'reference' && !localSettings.layoutReferenceImage) {
        setErrorMsg("Missing Reference Layout Image!");
        return;
    }
    // Note: For Blueprint/Auto Design, validation is item-based.

    setIsProcessing(true);
    stopProcessingRef.current = false;
    setErrorMsg(null);

    // Filter items that need processing. 
    const pendingItems = queue.filter(item => item.status === 'pending');
    
    if (pendingItems.length === 0) { setIsProcessing(false); return; }

    for (const item of pendingItems) {
      if (stopProcessingRef.current) { setIsProcessing(false); return; }
      
      // VALIDATION PER ITEM
      if (!item.originalPreview) {
          setQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error', error: "Missing Input Image" } : i));
          continue;
      }

      setSelectedId(item.id);
      setQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'processing' } : i));
      
      const itemData = queue.find(q => q.id === item.id); 
      if (!itemData || !itemData.originalPreview) continue;

      const startTime = Date.now();
      
      try {
        // CALL LAYOUT GENERATOR SERVICE
        const resultImage = await runLayoutGenerator({
          mode: mode,
          // Product Image handling differs by mode:
          // Blueprint: Reference Layout is the item.
          // Reference/Auto: Product Image is the item.
          productImageBase64: mode === 'blueprint' ? "" : itemData.originalPreview, 
          productMimeType: mode === 'blueprint' ? "" : itemData.mimeType,
          
          referenceLayoutBase64: mode === 'blueprint' ? itemData.originalPreview : (localSettings.layoutReferenceImage || ""),
          referenceLayoutMimeType: mode === 'blueprint' ? itemData.mimeType : (localSettings.layoutReferenceImageMime || 'image/png'),
          
          prompt: activePrompt.content, 
          logoBase64: localSettings.savedLogo,
          logoMimeType: localSettings.savedLogoMime,
          
          titleText: itemData.layoutData?.title || "",
          attributes: itemData.layoutData?.attributes || [],
          userInstructions: itemData.layoutData?.userInstructions,
          
          imageSize: localSettings.resolution,
          apiKey: apiKey
        });

        const endTime = Date.now();
        setQueue(prev => prev.map(i => i.id === item.id ? { 
          ...i, status: 'success', resultPreview: resultImage, duration: (endTime - startTime) / 1000 
        } : i));
      } catch (err: any) {
        if (err.message === "API_KEY_INVALID") {
            onDisconnect(); setErrorMsg(t.apiKeyInvalid); setIsProcessing(false); return;
        }
        setQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error', error: err.message || "Failed" } : i));
      }
      await new Promise(r => setTimeout(r, 500));
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
          const fileName = item.file ? item.file.name : `item_${item.id}.png`;
          const baseName = extractFilename(fileName, localSettings.filenamePattern);
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
          } catch (e) {}
        }
        setIsSaving(false); alert(t.saveSuccess); return;
      } catch (err) { setIsSaving(false); }
    }
    // Fallback
    for (const item of successItems) {
      if (item.resultPreview) {
        const fileName = item.file ? item.file.name : `item_${item.id}.png`;
        const baseName = extractFilename(fileName, localSettings.filenamePattern);
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
    <LayoutWorkspace 
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
         const fileName = item.file ? item.file.name : `item_${item.id}.png`;
         const baseName = extractFilename(fileName, localSettings.filenamePattern);
         const link = document.createElement('a'); link.href = processedImage; link.download = `${baseName} (1).png`;
         document.body.appendChild(link); link.click(); document.body.removeChild(link);
      }}
      onDownloadAll={handleDownloadAll}
      onUpdateSetting={(k, v) => setLocalSettings(prev => ({ ...prev, [k]: v }))}
      onManagePrompts={onOpenPromptManager}
      onUpdateItemData={handleUpdateItemData}
      onAddEmptyProduct={handleAddEmptyProduct}
      onUpdateProductImage={handleUpdateProductImage}
    />
  );
};
