
import React, { useRef, useState, useEffect } from 'react';
import { QueueItem, AppSettings, Prompt, Language } from '../types';
import { translations } from '../translations';
import { UploadIcon, MagicIcon, StopIcon, DownloadIcon, RefreshIcon, AlertIcon } from './Icons';
import { LoadingOverlay } from './LoadingOverlay';

// THIS IS NOW STRICTLY THE BATCH EDITOR WORKSPACE
// All Layout Generator logic has been moved to LayoutWorkspace.tsx

interface EditorWorkspaceProps {
  queue: QueueItem[];
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
}

export const EditorWorkspace: React.FC<EditorWorkspaceProps> = ({
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
  onManagePrompts
}) => {
  const t = translations[language];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [refinePrompt, setRefinePrompt] = useState('');

  const activeItem = queue.find(i => i.id === selectedId);
  const pendingCount = queue.filter(i => i.status === 'pending').length;
  const successCount = queue.filter(i => i.status === 'success').length;

  useEffect(() => {
    setRefinePrompt('');
  }, [selectedId]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFilesSelected(e.dataTransfer.files);
  };

  const handleEditLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        onUpdateSetting('savedLogo', base64);
        onUpdateSetting('savedLogoMime', file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRefineClick = () => {
      if (activeItem && refinePrompt.trim()) {
          onRefine(activeItem.id, refinePrompt.trim());
          setRefinePrompt('');
      }
  };

  const getFilenamePreview = () => {
    // Use active item, or first item, or dummy
    const sampleName = activeItem?.file?.name || (queue.length > 0 ? queue[0].file.name : "8934567890123_Product.jpg");
        
    if (!settings.filenamePattern) return sampleName.replace(/\.[^/.]+$/, "");

    try {
        const regex = new RegExp(settings.filenamePattern);
        const match = sampleName.match(regex);
        if (match && match.length > 0) return match[1] || match[0];
    } catch {}
    return sampleName.replace(/\.[^/.]+$/, "");
  };

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden">
      {/* --- SIDEBAR: BATCH EDITOR CONTROLS --- */}
      <div className="w-full lg:w-[400px] bg-surface/50 border-r border-border flex flex-col h-full overflow-hidden shrink-0 z-20">
        
        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6">
          
          {/* 1. Upload Images to Edit */}
          <div>
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                {t.importImages}
                {queue.length > 0 && <span className="text-xs bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded-full text-secondary">{queue.length}</span>}
              </h2>
              <div 
                className={`
                  relative group rounded-xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center overflow-hidden
                  ${queue.length === 0 ? 'h-40 border-border hover:border-primary/50 hover:bg-black/5 dark:hover:bg-white/5' : 'h-24 border-border hover:border-primary/50 hover:bg-black/5 dark:hover:bg-white/5'}
                  cursor-pointer
                `}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={(e) => { onFilesSelected(e.target.files); if(e.target) e.target.value = ''; }} 
                  accept="image/*" 
                  multiple
                  className="hidden" 
                />
                <div className="text-center p-2">
                  <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform text-foreground">
                      <UploadIcon />
                  </div>
                  {queue.length === 0 ? (
                      <>
                          <p className="text-sm font-medium mb-1">{t.uploadText}</p>
                          <p className="text-xs text-secondary">{t.uploadSubText}</p>
                      </>
                  ) : (
                      <p className="text-xs text-secondary">{t.dropMore}</p>
                  )}
                </div>
              </div>
          </div>

          {/* 2. Logo Upload */}
          <div>
            <h2 className="text-sm font-semibold mb-3">{t.newLogo} <span className="text-xs font-normal text-secondary">{t.logoSubText}</span></h2>
            <div className={`
                  relative rounded-xl border border-border bg-surface p-3 flex items-center gap-3 transition-colors
                  ${settings.savedLogo ? 'border-primary/30' : 'hover:border-primary/30'}
              `}>
                <div className="h-12 w-12 bg-black/5 dark:bg-white/5 rounded-lg border border-dashed border-border flex items-center justify-center shrink-0 overflow-hidden relative">
                    {settings.savedLogo ? (
                      <img src={settings.savedLogo} alt="New Logo" className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-secondary"><UploadIcon /></div>
                    )}
                    <input 
                      type="file" 
                      ref={logoInputRef}
                      onChange={handleEditLogoChange} 
                      accept="image/*" 
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      title={t.clickUpload}
                    />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-secondary truncate">{settings.savedLogo ? t.logoUploaded : t.clickUpload}</p>
                </div>
                {settings.savedLogo && (
                  <button onClick={() => { onUpdateSetting('savedLogo', null); if(logoInputRef.current) logoInputRef.current.value=''; }} className="text-xs text-red-500 hover:text-red-600">
                      {t.remove}
                  </button>
                )}
              </div>
          </div>

          {/* 3. Prompt Settings */}
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
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
          </div>

          {/* 4. General Settings */}
          <div>
            <h2 className="text-sm font-semibold mb-3">{t.settings}</h2>
            <div className="bg-surface border border-border rounded-xl p-3">
                <label className="text-[10px] text-secondary uppercase font-semibold block mb-1.5">{t.resolution}</label>
                  <div className="flex bg-black/5 dark:bg-white/5 rounded-lg p-0.5">
                    {['1K', '2K', '4K'].map(res => (
                       <button 
                       key={res}
                       onClick={() => onUpdateSetting('resolution', res as any)}
                       className={`flex-1 text-xs py-1.5 rounded-md transition-all ${settings.resolution === res ? 'bg-background shadow text-foreground' : 'text-secondary hover:text-foreground'}`}
                       >
                         {res}
                       </button>
                    ))}
                </div>
            </div>
          </div>

          {/* Queue List */}
          <div className="flex-1 min-h-[300px] flex flex-col pb-4">
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
                                  flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors border
                                  ${selectedId === item.id ? 'bg-background border-primary/50 shadow-sm' : 'bg-surface border-transparent hover:bg-black/5 dark:hover:bg-white/5'}
                              `}
                          >
                              <img src={item.originalPreview} alt="thumb" className="w-10 h-10 rounded object-cover bg-black" />
                              <div className="flex-1 min-w-0">
                                  <p className="text-xs text-foreground truncate font-medium">{item.file.name}</p>
                                  <div className="flex items-center gap-2">
                                    <p className="text-[10px] text-secondary uppercase">{item.status}</p>
                                    {item.duration && (
                                      <span className="text-[10px] bg-black/10 dark:bg-white/10 px-1.5 rounded text-secondary font-mono">
                                        {item.duration.toFixed(1)}s
                                      </span>
                                    )}
                                  </div>
                              </div>
                              <div className="shrink-0 flex items-center gap-2">
                                  {item.status === 'processing' && <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />}
                                  {item.status === 'success' && <div className="text-green-500 text-xs">✓</div>}
                                  {item.status === 'error' && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onRegenerate(item.id); }}
                                        className="text-red-500 hover:text-red-600 text-xs"
                                    >
                                        <RefreshIcon />
                                    </button>
                                  )}
                                  {item.status === 'pending' && !isProcessing && (
                                      <button 
                                          onClick={(e) => onDeleteItem(item.id, e)}
                                          className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-black/10 text-secondary hover:text-foreground"
                                      >
                                          ×
                                      </button>
                                  )}
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>
        </div>

        {/* Action Bar */}
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
                  disabled={pendingCount === 0 || isSaving}
                  className={`
                  w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200
                  ${(pendingCount === 0 || isSaving) 
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

      {/* --- VIEWER AREA --- */}
      <div className="flex-1 bg-background/50 dark:bg-black/40 flex flex-col overflow-hidden relative transition-colors">
          <div className="h-12 border-b border-border flex items-center justify-between px-6 bg-surface/20 backdrop-blur-sm shrink-0">
              <span className="text-xs text-secondary truncate max-w-[300px]">
                  {activeItem ? activeItem.file.name : t.noImageSelected}
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

          <div className="flex-1 relative p-8 flex flex-col items-center justify-center overflow-hidden">
              {!activeItem ? (
                  <div className="text-center text-secondary">
                      <div className="w-16 h-16 mx-auto mb-4 border-2 border-dashed border-border rounded-2xl flex items-center justify-center">
                          <MagicIcon />
                      </div>
                      <p>{t.selectToView}</p>
                  </div>
              ) : (
                  <div className="w-full h-full flex flex-col gap-4 items-center justify-center">
                      {activeItem.status === 'success' && activeItem.resultPreview ? (
                          <>
                            <div className="relative max-w-full flex-1 aspect-square group overflow-hidden">
                                <img 
                                    src={activeItem.resultPreview} 
                                    alt="Result" 
                                    className="w-full h-full object-contain shadow-2xl rounded-lg bg-black/5 dark:bg-white/5"
                                />
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
                          <div className="relative max-w-full max-h-full aspect-square">
                              <img 
                                  src={activeItem.originalPreview} 
                                  alt="Original" 
                                  className={`w-full h-full object-contain shadow-2xl rounded-lg bg-black/5 dark:bg-white/5 ${activeItem.status === 'processing' ? 'opacity-50' : ''}`}
                              />
                              <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-xs text-white/90 font-medium pointer-events-none">
                                  {t.originalInput}
                              </div>
                              {activeItem.status === 'processing' && (
                                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                      <LoadingOverlay />
                                  </div>
                              )}
                              {activeItem.status === 'error' && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                                      <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-200 text-center max-w-sm">
                                          <p className="font-bold mb-1">{t.error}</p>
                                          <p className="text-sm truncate">{activeItem.error}</p>
                                          <button 
                                              onClick={() => onRegenerate(activeItem.id)}
                                              className="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-xs font-medium transition-colors w-full"
                                          >
                                              {t.tryAgain}
                                          </button>
                                      </div>
                                  </div>
                              )}
                          </div>
                      )}
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};
