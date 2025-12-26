
import React, { useRef, useState, useEffect } from 'react';
import { QueueItem, AppSettings, Prompt, Language, ProductAttribute } from '../types';
import { translations } from '../translations';
import { UploadIcon, LayoutIcon, StopIcon, DownloadIcon, AlertIcon, TrashIcon, PlusIcon, XIcon, CheckIcon, SettingsIcon, MagicIcon, RefreshIcon, GridIcon } from './Icons';
import { LoadingOverlay } from './LoadingOverlay';

interface LayoutWorkspaceProps {
  queue: QueueItem[]; // Products OR Blueprints
  selectedId: string | null;
  settings: AppSettings;
  prompts: Prompt[];
  isProcessing: boolean;
  isSaving: boolean;
  errorMsg: string | null;
  language: Language;
  
  onFilesSelected: (files: FileList | null) => void;
  onSelectQueueItem: (id: string) => void;
  onDeleteItem: (id: string, e: React.MouseEvent) => void;
  onClearAll: () => void;
  onProcess: () => void;
  onStop: () => void;
  onRegenerate: (id: string) => void;
  onRefine: (id: string, prompt: string) => void;
  onDownloadItem: (item: QueueItem) => void;
  onDownloadAll: () => void;
  onUpdateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  onManagePrompts: () => void;
  onUpdateItemData: (id: string, data: Partial<NonNullable<QueueItem['layoutData']>>) => void;
  onAddEmptyProduct: () => void;
  onUpdateProductImage: (id: string, file: File) => void;
}

export const LayoutWorkspace: React.FC<LayoutWorkspaceProps> = ({
  queue,
  selectedId,
  settings,
  prompts,
  isProcessing,
  isSaving,
  errorMsg,
  language,
  onFilesSelected,
  onSelectQueueItem,
  onDeleteItem,
  onClearAll,
  onProcess,
  onStop,
  onRegenerate,
  onRefine,
  onDownloadItem,
  onDownloadAll,
  onUpdateSetting,
  onManagePrompts,
  onUpdateItemData,
  onAddEmptyProduct,
  onUpdateProductImage
}) => {
  const t = translations[language];
  const referenceInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const blueprintBatchInputRef = useRef<HTMLInputElement>(null);
  
  // Specific inputs
  const attributeIconInputRef = useRef<HTMLInputElement>(null);
  const productItemImageInputRef = useRef<HTMLInputElement>(null);
  
  // Modal State
  const [isConfigModalOpen, setConfigModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [activeAttrIdForUpload, setActiveAttrIdForUpload] = useState<string | null>(null);

  // Refine State
  const [refinePrompt, setRefinePrompt] = useState('');

  const activeItem = queue.find(i => i.id === selectedId);
  const editingItem = queue.find(i => i.id === editingItemId);
  const pendingCount = queue.filter(i => i.status === 'pending').length;
  const successCount = queue.filter(i => i.status === 'success').length;

  useEffect(() => {
    // Reset refine prompt when switching items
    setRefinePrompt('');
  }, [selectedId]);

  // --- HANDLERS ---

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); onFilesSelected(e.dataTransfer.files); };

  const handleReferenceLayoutChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateSetting('layoutReferenceImage', reader.result as string);
        onUpdateSetting('layoutReferenceImageMime', file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateSetting('savedLogo', reader.result as string);
        onUpdateSetting('savedLogoMime', file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBlueprintBatchUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      onFilesSelected(e.target.files);
      if (e.target) e.target.value = '';
  }

  const handleRefineClick = () => {
      if (activeItem && refinePrompt.trim()) {
          onRefine(activeItem.id, refinePrompt.trim());
          setRefinePrompt('');
      }
  };

  const getFilenamePreview = () => {
    // Use the first item in queue or a dummy name
    const sampleName = queue.length > 0 && queue[0].file 
        ? queue[0].file.name 
        : "8934567890123_Product.jpg";
        
    if (!settings.filenamePattern) return sampleName.replace(/\.[^/.]+$/, "");

    try {
        const regex = new RegExp(settings.filenamePattern);
        const match = sampleName.match(regex);
        if (match && match.length > 0) return match[1] || match[0];
    } catch {}
    return sampleName.replace(/\.[^/.]+$/, "");
  };

  // --- ITEM CONFIGURATION LOGIC ---

  const openConfigModal = (id: string) => {
      setEditingItemId(id);
      setConfigModalOpen(true);
  };

  const handleAddEmptyProductAndEdit = () => {
      onAddEmptyProduct();
  };

  const handleAddAttribute = () => {
    if (!editingItem) return;
    const currentAttrs = editingItem.layoutData?.attributes || [];
    const newAttr: ProductAttribute = { id: Date.now().toString(), text: '' };
    onUpdateItemData(editingItem.id, { attributes: [...currentAttrs, newAttr] });
  };

  const handleRemoveAttribute = (attrId: string) => {
    if (!editingItem) return;
    const currentAttrs = editingItem.layoutData?.attributes || [];
    onUpdateItemData(editingItem.id, { attributes: currentAttrs.filter(a => a.id !== attrId) });
  };

  const handleAttributeTextChange = (attrId: string, text: string) => {
    if (!editingItem) return;
    const currentAttrs = editingItem.layoutData?.attributes || [];
    onUpdateItemData(editingItem.id, { attributes: currentAttrs.map(a => a.id === attrId ? { ...a, text } : a) });
  };

  const triggerIconUpload = (attrId: string) => {
    setActiveAttrIdForUpload(attrId);
    attributeIconInputRef.current?.click();
  };

  const handleAttributeIconChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/') && activeAttrIdForUpload && editingItem) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const currentAttrs = editingItem.layoutData?.attributes || [];
            onUpdateItemData(editingItem.id, {
                attributes: currentAttrs.map(a => a.id === activeAttrIdForUpload ? { 
                    ...a, iconBase64: reader.result as string, iconMime: file.type
                } : a)
            });
            setActiveAttrIdForUpload(null);
        };
        reader.readAsDataURL(file);
    }
    if (event.target) event.target.value = '';
  };
  
  const handleProductImageUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && file.type.startsWith('image/') && editingItem) {
          onUpdateProductImage(editingItem.id, file);
      }
      if (event.target) event.target.value = '';
  };

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden bg-background relative">
      {/* Hidden inputs for uploads */}
      <input type="file" ref={attributeIconInputRef} onChange={handleAttributeIconChange} accept="image/*" className="hidden" />
      <input type="file" ref={productItemImageInputRef} onChange={handleProductImageUpdate} accept="image/*" className="hidden" />
      <input type="file" ref={blueprintBatchInputRef} onChange={handleBlueprintBatchUpload} accept="image/*" multiple className="hidden" />

      {/* --- SIDEBAR --- */}
      <div className="w-full lg:w-[400px] bg-surface/50 border-r border-border flex flex-col h-full overflow-hidden shrink-0 z-20">
        
        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6">
          
          {/* 1. GLOBAL ASSETS (Tabbed) */}
          <div>
              <h2 className="text-sm font-semibold mb-3">{t.globalSettings}</h2>
              
              {/* Tab Switcher */}
              <div className="flex bg-black/5 dark:bg-white/5 rounded-lg p-1 mb-3">
                  <button 
                      onClick={() => onUpdateSetting('layoutMode', 'reference')}
                      className={`flex-1 text-[10px] sm:text-xs py-1.5 rounded-md font-bold transition-all ${settings.layoutMode === 'reference' ? 'bg-background shadow text-foreground' : 'text-secondary hover:text-foreground'}`}
                  >
                      {t.modeReference}
                  </button>
                  <button 
                      onClick={() => onUpdateSetting('layoutMode', 'blueprint')}
                      className={`flex-1 text-[10px] sm:text-xs py-1.5 rounded-md font-bold transition-all ${settings.layoutMode === 'blueprint' ? 'bg-background shadow text-foreground' : 'text-secondary hover:text-foreground'}`}
                  >
                      {t.modeBlueprint}
                  </button>
                  <button 
                      onClick={() => onUpdateSetting('layoutMode', 'auto_design')}
                      className={`flex-1 text-[10px] sm:text-xs py-1.5 rounded-md font-bold transition-all ${settings.layoutMode === 'auto_design' ? 'bg-background shadow text-foreground' : 'text-secondary hover:text-foreground'}`}
                  >
                      {t.modeAutoDesign}
                  </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                  {/* Reference Image - Only show if mode is reference */}
                  {settings.layoutMode === 'reference' && (
                      <div>
                        <label className="text-[10px] text-secondary font-semibold mb-1.5 block">{t.referenceLayout}</label>
                        <div 
                            onClick={() => referenceInputRef.current?.click()}
                            className={`
                            relative h-24 border border-border rounded-xl flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all
                            ${settings.layoutReferenceImage ? 'border-primary/30 bg-primary/5' : 'hover:border-primary/30 hover:bg-black/5'}
                            `}
                        >
                            {settings.layoutReferenceImage ? (
                                <img src={settings.layoutReferenceImage} className="w-full h-full object-contain p-2" alt="Ref" />
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-secondary">
                                    <LayoutIcon />
                                    <span className="text-xs">{t.clickUpload}</span>
                                </div>
                            )}
                            <input type="file" ref={referenceInputRef} onChange={handleReferenceLayoutChange} accept="image/*" className="hidden" />
                        </div>
                     </div>
                  )}

                 {/* Global Logo (Shared across all modes) */}
                 <div className={settings.layoutMode === 'reference' ? '' : 'col-span-2'}>
                    <label className="text-[10px] text-secondary font-semibold mb-1.5 block">{t.newLogo}</label>
                    <div 
                        onClick={() => logoInputRef.current?.click()}
                        className={`
                        relative h-24 border border-border rounded-xl flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all
                        ${settings.savedLogo ? 'border-primary/30 bg-primary/5' : 'hover:border-primary/30 hover:bg-black/5'}
                        `}
                    >
                        {settings.savedLogo ? (
                            <img src={settings.savedLogo} className="w-full h-full object-contain p-2" alt="Logo" />
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-secondary">
                                <UploadIcon />
                                <span className="text-xs">{t.clickUpload}</span>
                            </div>
                        )}
                        <input type="file" ref={logoInputRef} onChange={handleLogoChange} accept="image/*" className="hidden" />
                    </div>
                 </div>
              </div>
          </div>

          {/* 2. PROMPT SETTINGS */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">{t.promptSettings}</h2>
              <button onClick={onManagePrompts} className="text-xs text-primary hover:text-primary/80 font-medium">
                  {t.manage}
              </button>
            </div>
            <div className="relative">
              <select 
                value={settings.activePromptId}
                onChange={(e) => onUpdateSetting('activePromptId', e.target.value)}
                className="w-full bg-surface border border-border rounded-xl p-3 pr-10 text-sm text-foreground focus:outline-none focus:border-primary/50 appearance-none cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                {prompts.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. SETTINGS (Resolution Only) */}
          <div>
            <h2 className="text-sm font-semibold mb-3">{t.settings}</h2>
            <div className="bg-surface border border-border rounded-xl p-3">
                <label className="text-[10px] text-secondary uppercase font-semibold block mb-1.5">{t.resolutionConfig}</label>
                <div className="flex bg-black/5 dark:bg-white/5 rounded-lg p-0.5">
                    {['1K', '2K', '4K'].map(res => (
                    <button 
                    key={res}
                    onClick={() => onUpdateSetting('resolution', res as any)}
                    className={`flex-1 text-xs py-1.5 rounded-md transition-all font-medium ${settings.resolution === res ? 'bg-background shadow text-foreground' : 'text-secondary hover:text-foreground'}`}
                    >
                        {res}
                    </button>
                    ))}
                </div>
            </div>
          </div>

          {/* 4. PRODUCT LIST (Single Button) */}
          <div>
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                {settings.layoutMode === 'blueprint' ? t.importBlueprints : t.importLayouts}
                {queue.length > 0 && <span className="text-xs bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded-full text-secondary">{queue.length}</span>}
              </h2>
              
              {settings.layoutMode === 'blueprint' ? (
                <button 
                    onClick={() => blueprintBatchInputRef.current?.click()}
                    disabled={queue.length >= 10}
                    className="w-full py-3 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group shadow-sm hover:shadow-md"
                >
                    <UploadIcon />
                    {t.addBlueprints}
                </button>
              ) : (
                <button 
                    onClick={handleAddEmptyProductAndEdit}
                    disabled={queue.length >= 10}
                    className="w-full py-3 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group shadow-sm hover:shadow-md"
                >
                    {t.addProduct}
                </button>
              )}
          </div>

          {/* 5. QUEUE LIST */}
          <div className="flex-1 min-h-[200px] flex flex-col pb-4">
              <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold">{t.queue}</h2>
                  {queue.length > 0 && !isProcessing && (
                      <button onClick={onClearAll} className="text-xs text-red-500 hover:text-red-600">{t.clearAll}</button>
                  )}
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/5 dark:bg-black/20 rounded-xl border border-border p-2 space-y-2">
                  {queue.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-secondary text-xs">
                          <p>{t.noImages}</p>
                      </div>
                  ) : (
                      queue.map(item => (
                          <div 
                              key={item.id}
                              onClick={() => onSelectQueueItem(item.id)}
                              className={`
                                  flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors border group
                                  ${selectedId === item.id ? 'bg-background border-primary/50 shadow-sm' : 'bg-surface border-transparent hover:bg-black/5 dark:hover:bg-white/5'}
                              `}
                          >
                              <div className="w-10 h-10 rounded bg-black/10 shrink-0 overflow-hidden flex items-center justify-center border border-border">
                                {item.originalPreview ? (
                                    <img src={item.originalPreview} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <span className="text-[8px] text-center text-secondary leading-tight p-0.5">{t.productImageMissing}</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                  <p className="text-xs text-foreground truncate font-bold">{item.layoutData?.title || "Untitled"}</p>
                                  <div className="flex items-center gap-2">
                                    {settings.layoutMode === 'reference' && (
                                        <p className="text-[10px] text-secondary">{(item.layoutData?.attributes?.length || 0)} attrs</p>
                                    )}
                                    {settings.layoutMode === 'auto_design' && (
                                        <p className="text-[10px] text-secondary">{(item.layoutData?.attributes?.length || 0)} attrs</p>
                                    )}
                                    <p className="text-[10px] text-secondary uppercase">• {item.status}</p>
                                  </div>
                              </div>
                              <div className="shrink-0 flex items-center gap-1">
                                  {/* Config Button */}
                                  <button 
                                      onClick={(e) => { e.stopPropagation(); openConfigModal(item.id); }}
                                      className="p-1.5 text-secondary hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                                      title={t.configure}
                                  >
                                      <SettingsIcon />
                                  </button>

                                  {item.status === 'processing' && <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />}
                                  {item.status === 'success' && <div className="text-green-500 text-xs p-1">✓</div>}
                                  {item.status === 'error' && (
                                    <button onClick={(e) => { e.stopPropagation(); onRegenerate(item.id); }} className="text-red-500 hover:text-red-600 text-xs p-1"><RefreshIcon /></button>
                                  )}
                                  {item.status === 'pending' && !isProcessing && (
                                      <button 
                                          onClick={(e) => onDeleteItem(item.id, e)}
                                          className="p-1.5 text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-md"
                                      >
                                          <XIcon />
                                      </button>
                                  )}
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>
        </div>

        {/* ACTION BAR */}
        <div className="p-4 border-t border-border bg-surface/80 backdrop-blur-md flex flex-col gap-2 shrink-0 z-10 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.1)]">
          {errorMsg && <div className="mb-2 text-xs text-red-500 flex items-center gap-1"><AlertIcon /> {errorMsg}</div>}
          
          <div>
            {isProcessing ? (
                <button
                  onClick={onStop}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20"
                >
                  <StopIcon />
                  <span className="text-sm">{t.stop}</span>
                </button>
            ) : (
                <button
                  onClick={onProcess}
                  disabled={pendingCount === 0 || isSaving || (settings.layoutMode === 'reference' && !settings.layoutReferenceImage)}
                  className={`
                  w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200
                  ${(pendingCount === 0 || isSaving || (settings.layoutMode === 'reference' && !settings.layoutReferenceImage)) 
                      ? 'bg-black/5 dark:bg-white/10 text-secondary cursor-not-allowed' 
                      : 'bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.02] text-white'}
                  `}
                >
                  <MagicIcon />
                  <span className="text-sm">{t.generateAll} ({pendingCount})</span>
                </button>
            )}
          </div>

          <div className="pt-3 border-t border-border/50 flex flex-col gap-2">
             
             {/* Filename Regex Config */}
             <div>
               <div className="flex justify-between items-center mb-1">
                 <label className="text-[10px] text-secondary uppercase font-semibold">{t.filenameConfig}</label>
                 <span className="text-[10px] font-mono text-primary truncate max-w-[150px]">{getFilenamePreview()}</span>
               </div>
               <input 
                 type="text" 
                 value={settings.filenamePattern || ''}
                 onChange={(e) => onUpdateSetting('filenamePattern', e.target.value)}
                 placeholder={t.regexPlaceholder}
                 className="w-full bg-black/5 dark:bg-white/5 border border-transparent focus:border-primary/50 rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none font-mono"
               />
             </div>

             <div className="flex gap-2 mb-1">
                  <div className="flex-1">
                    <input 
                      type="number" 
                      value={settings.downloadWidth || ''}
                      onChange={(e) => onUpdateSetting('downloadWidth', e.target.value ? Number(e.target.value) : undefined)}
                      placeholder={t.widthPx}
                      className="w-full bg-black/5 dark:bg-white/5 border border-transparent focus:border-primary/50 rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <input 
                      type="number" 
                      value={settings.downloadHeight || ''}
                      onChange={(e) => onUpdateSetting('downloadHeight', e.target.value ? Number(e.target.value) : undefined)}
                      placeholder={t.heightPx}
                      className="w-full bg-black/5 dark:bg-white/5 border border-transparent focus:border-primary/50 rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none"
                    />
                  </div>
              </div>
            <button
                onClick={onDownloadAll}
                disabled={isSaving || successCount === 0}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200
                    ${(isSaving || successCount === 0) ? 'bg-black/5 dark:bg-white/10 text-secondary cursor-not-allowed' : 'bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-foreground'}
                `}
                title={t.download}
            >
                <DownloadIcon />
                <span className="text-sm">{isSaving ? t.saving : t.download} ({successCount})</span>
            </button>
          </div>
        </div>
      </div>

       {/* --- MAIN AREA (RIGHT) --- */}
       <div className="flex-1 flex flex-col overflow-hidden bg-background relative">
          <div className="h-12 border-b border-border bg-surface/20 backdrop-blur px-6 flex items-center justify-between shrink-0">
                <span className="text-xs text-secondary truncate max-w-[300px]">
                    {activeItem ? (activeItem.layoutData?.title || activeItem.file?.name) : t.selectToView}
                </span>
                
                <div className="flex items-center gap-3">
                   {(activeItem?.status === 'success' || activeItem?.status === 'error') && (
                      <button 
                          onClick={() => activeItem && onRegenerate(activeItem.id)}
                          className="flex items-center gap-2 text-xs font-medium text-secondary hover:text-foreground transition-colors"
                      >
                          <RefreshIcon /> {t.regenerate}
                      </button>
                  )}
                  {activeItem?.status === 'success' && activeItem.resultPreview && (
                      <button 
                          onClick={() => activeItem && onDownloadItem(activeItem)}
                          className="flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                          <DownloadIcon /> {t.download}
                      </button>
                  )}
              </div>
          </div>
          
          <div className="flex-1 p-8 relative flex flex-col items-center justify-center bg-black/5 dark:bg-black/20 overflow-hidden">
             {!activeItem ? (
                 <div className="text-secondary text-center opacity-50">
                     <div className="w-16 h-16 mx-auto mb-4 border-2 border-dashed border-border rounded-2xl flex items-center justify-center">
                        <LayoutIcon />
                     </div>
                     <p>{t.selectToView}</p>
                 </div>
             ) : (
                 <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                    {activeItem.status === 'success' && activeItem.resultPreview ? (
                        <>
                            <div className="relative max-w-full flex-1 aspect-square group overflow-hidden">
                                <img src={activeItem.resultPreview} className="w-full h-full object-contain shadow-2xl rounded-lg bg-black/5 dark:bg-white/5" alt="Result" />
                                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-xs text-green-400 font-medium pointer-events-none">
                                    {t.generatedResult} {activeItem.duration && `(${activeItem.duration.toFixed(1)}s)`}
                                </div>
                            </div>
                            
                            {/* REFINE SECTION */}
                            <div className="w-full max-w-2xl bg-surface border border-border rounded-xl p-3 flex gap-2 shrink-0 animate-pulse-fast-once">
                                <input
                                    type="text"
                                    value={refinePrompt}
                                    onChange={(e) => setRefinePrompt(e.target.value)}
                                    placeholder={t.refinePlaceholder}
                                    className="flex-1 bg-transparent text-sm px-2 focus:outline-none placeholder-secondary/50"
                                    onKeyDown={(e) => e.key === 'Enter' && handleRefineClick()}
                                />
                                <button
                                    onClick={handleRefineClick}
                                    disabled={!refinePrompt.trim() || isProcessing}
                                    className={`
                                        px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1
                                        ${!refinePrompt.trim() || isProcessing ? 'bg-black/5 text-secondary cursor-not-allowed' : 'bg-primary text-white hover:bg-primary/90'}
                                    `}
                                >
                                    {isProcessing ? <div className="w-3 h-3 border-2 border-white/50 border-t-transparent animate-spin rounded-full"></div> : <MagicIcon />}
                                    {t.refineButton}
                                </button>
                            </div>
                        </>
                    ) : (
                         <div className="flex items-center justify-center gap-8 w-full h-full opacity-60">
                             {/* Preview of inputs */}
                             {settings.layoutMode === 'reference' && settings.layoutReferenceImage && (
                                 <div className="relative group max-w-[40%] max-h-[80%] aspect-[3/4] border-2 border-dashed border-secondary/30 rounded-lg p-2 flex flex-col items-center">
                                     <img src={settings.layoutReferenceImage} className="h-full object-contain" alt="Ref" />
                                     <span className="absolute bottom-2 bg-black/50 text-white text-[10px] px-2 rounded">Reference</span>
                                 </div>
                             )}

                             {/* In Blueprint Mode, the Queue item IS the blueprint */}
                             {settings.layoutMode === 'blueprint' && activeItem.originalPreview && (
                                 <div className="relative group max-w-[40%] max-h-[80%] aspect-[3/4] border-2 border-dashed border-secondary/30 rounded-lg p-2 flex flex-col items-center">
                                     <img src={activeItem.originalPreview} className="h-full object-contain" alt="Blueprint" />
                                     <span className="absolute bottom-2 bg-black/50 text-white text-[10px] px-2 rounded">Blueprint Source</span>
                                 </div>
                             )}

                             {/* In Auto Design Mode, Show Product + Logo if available */}
                             {settings.layoutMode === 'auto_design' && (
                                <>
                                   {/* If there's a logo, show it small */}
                                   {settings.savedLogo && (
                                        <div className="relative group max-w-[30%] max-h-[30%] aspect-square border-2 border-dashed border-secondary/30 rounded-lg p-2 flex flex-col items-center">
                                            <img src={settings.savedLogo} className="h-full object-contain" alt="Logo" />
                                            <span className="absolute bottom-1 bg-black/50 text-white text-[10px] px-2 rounded">Logo</span>
                                        </div>
                                   )}
                                   <span className="text-2xl text-secondary">+</span>
                                </>
                             )}

                             {(settings.layoutMode === 'reference' || settings.layoutMode === 'auto_design') && (
                                <>
                                    {activeItem.originalPreview ? (
                                        <div className="relative group max-w-[40%] max-h-[80%] aspect-[3/4] border-2 border-dashed border-secondary/30 rounded-lg p-2 flex flex-col items-center">
                                            <img src={activeItem.originalPreview} className="h-full object-contain" alt="Product" />
                                            <span className="absolute bottom-2 bg-black/50 text-white text-[10px] px-2 rounded">Product</span>
                                        </div>
                                    ) : (
                                        <div className="w-40 h-40 border-2 border-dashed border-red-300 rounded-lg flex items-center justify-center text-red-400 text-xs">
                                            {t.productImageMissing}
                                        </div>
                                    )}
                                </>
                             )}
                         </div>
                    )}
                    
                    {/* SCOPED OVERLAY */}
                    {activeItem.status === 'processing' && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-lg">
                            <LoadingOverlay />
                        </div>
                    )}
                    
                    {activeItem.status === 'error' && (
                        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-lg">
                            <div className="bg-surface p-6 rounded-xl shadow-2xl max-w-sm text-center border border-red-500/20">
                                <AlertIcon />
                                <h3 className="text-red-500 font-bold mt-2">{t.error}</h3>
                                <p className="text-sm text-secondary my-2">{activeItem.error}</p>
                                <button onClick={() => onRegenerate(activeItem.id)} className="px-4 py-2 bg-red-500 text-white rounded-lg text-xs font-bold mt-2">{t.tryAgain}</button>
                            </div>
                        </div>
                    )}
                 </div>
             )}
          </div>
       </div>

      {/* --- CONFIGURATION MODAL (POPUP) --- */}
      {isConfigModalOpen && editingItem && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-surface w-full max-w-4xl h-[85vh] rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden animate-pulse-fast-once">
                  
                  {/* Modal Header */}
                  <div className="h-14 border-b border-border flex items-center justify-between px-6 bg-background/50">
                      <h2 className="text-lg font-bold flex items-center gap-2">
                          {settings.layoutMode === 'blueprint' ? "Blueprint Details" : t.editProductDetails}
                          <span className="text-xs font-normal text-secondary px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10">{editingItem.layoutData?.title || "Untitled"}</span>
                      </h2>
                      <button onClick={() => setConfigModalOpen(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-secondary hover:text-foreground transition-colors">
                          <XIcon />
                      </button>
                  </div>

                  {/* Modal Body */}
                  <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                      {/* Left: Image Uploader */}
                      <div className="w-full md:w-1/3 p-6 border-r border-border bg-black/5 dark:bg-white/5 flex flex-col">
                           <h3 className="text-xs font-bold uppercase text-secondary mb-3">
                                {settings.layoutMode === 'blueprint' ? t.uploadBlueprint : t.uploadProductImage}
                           </h3>
                           <div 
                                onClick={() => productItemImageInputRef.current?.click()}
                                className="flex-1 border-2 border-dashed border-border rounded-xl bg-surface relative overflow-hidden flex items-center justify-center group cursor-pointer hover:border-primary/50 transition-all"
                           >
                                {editingItem.originalPreview ? (
                                    <img src={editingItem.originalPreview} className="w-full h-full object-contain p-4" alt="Product" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-secondary">
                                        <div className="w-12 h-12 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mb-2"><UploadIcon /></div>
                                        <span className="text-xs font-medium">{t.clickUpload}</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                     <span className="text-white text-xs font-bold bg-black/50 px-3 py-1.5 rounded-full">Change Image</span>
                                </div>
                           </div>
                      </div>

                      {/* Right: Form Data */}
                      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-surface">
                           <div className="max-w-xl mx-auto flex flex-col gap-6">
                                {/* Name - Hidden in Blueprint Mode if user shouldn't input it */}
                                {(settings.layoutMode === 'reference' || settings.layoutMode === 'auto_design') && (
                                    <div>
                                        <label className="text-xs font-bold uppercase text-secondary block mb-2">{t.productName}</label>
                                        <input 
                                            type="text" 
                                            value={editingItem.layoutData?.title || ''}
                                            onChange={(e) => onUpdateItemData(editingItem.id, { title: e.target.value })}
                                            className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary/50 focus:outline-none"
                                            placeholder="Enter product title..."
                                        />
                                        {editingItem.file && (
                                            <div className="mt-1.5 text-[10px] text-secondary flex items-center gap-1">
                                                <span>Original File:</span>
                                                <span className="font-mono bg-black/5 dark:bg-white/5 px-1 rounded">{editingItem.file.name}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {settings.layoutMode === 'blueprint' && (
                                    <div className="flex flex-col gap-3">
                                        <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-sm text-secondary">
                                            <p className="font-bold text-foreground mb-1">Blueprint Mode Active</p>
                                            <p>The AI will automatically detect the structure. Use the box below to describe the product or specific details you want.</p>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold uppercase text-secondary block mb-2">{t.blueprintInstructions}</label>
                                            <textarea
                                                value={editingItem.layoutData?.userInstructions || ''}
                                                onChange={(e) => onUpdateItemData(editingItem.id, { userInstructions: e.target.value })}
                                                className="w-full h-32 bg-background border border-border rounded-lg px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary/50 focus:outline-none resize-none"
                                                placeholder={t.blueprintInstructionsPlaceholder}
                                            />
                                        </div>
                                     </div>
                                )}

                                {/* Attributes - HIDDEN IN BLUEPRINT MODE */}
                                {(settings.layoutMode === 'reference' || settings.layoutMode === 'auto_design') && (
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-xs font-bold uppercase text-secondary">{t.productAttributes}</label>
                                            <button 
                                                onClick={handleAddAttribute} 
                                                className="text-xs bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-md font-bold transition-colors flex items-center gap-1"
                                            >
                                                {t.addAttribute}
                                            </button>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            {(editingItem.layoutData?.attributes || []).map((attr, idx) => (
                                                <div key={attr.id} className="flex items-center gap-3 bg-background border border-border p-3 rounded-xl group hover:border-primary/30 transition-colors">
                                                    <span className="text-[10px] text-secondary font-mono w-4">{idx + 1}.</span>
                                                    
                                                    {/* Icon */}
                                                    <div 
                                                        onClick={() => triggerIconUpload(attr.id)}
                                                        className={`
                                                            w-10 h-10 shrink-0 rounded-lg border border-dashed flex items-center justify-center cursor-pointer overflow-hidden transition-all relative group/icon
                                                            ${attr.iconBase64 ? 'border-primary/50 bg-white' : 'border-secondary/40 hover:border-primary/50 hover:bg-primary/5'}
                                                        `}
                                                        title={attr.iconBase64 ? t.hasIcon : t.iconOptional}
                                                    >
                                                        {attr.iconBase64 ? (
                                                            <img src={attr.iconBase64} className="w-full h-full object-contain p-1" alt="icon" />
                                                        ) : (
                                                            <div className="text-center">
                                                                <span className="text-[8px] text-secondary leading-tight block">{t.autoGenIcon}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Text */}
                                                    <input
                                                        type="text"
                                                        value={attr.text}
                                                        onChange={(e) => handleAttributeTextChange(attr.id, e.target.value)}
                                                        className="flex-1 bg-transparent text-sm focus:outline-none py-1 border-b border-transparent focus:border-primary/30 transition-colors"
                                                        placeholder={t.attributesPlaceholder}
                                                    />

                                                    {/* Delete */}
                                                    <button 
                                                        onClick={() => handleRemoveAttribute(attr.id)} 
                                                        className="w-8 h-8 flex items-center justify-center text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                </div>
                                            ))}
                                            {(editingItem.layoutData?.attributes?.length || 0) === 0 && (
                                                <div className="text-center py-8 text-secondary text-sm italic bg-black/5 dark:bg-white/5 rounded-lg border border-dashed border-border">
                                                    No attributes added.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                           </div>
                      </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="h-16 border-t border-border bg-background/50 flex items-center justify-end px-6 gap-3">
                      <button 
                          onClick={() => setConfigModalOpen(false)}
                          className="px-6 py-2.5 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
                      >
                          {t.close}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
