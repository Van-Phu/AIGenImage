import React, { useState, useRef, useEffect } from 'react';
import { editImageWithGemini } from './services/geminiService';
import { AppStatus, QueueItem, Prompt, AppSettings, Resolution, Theme, Language } from './types';
import { UploadIcon, MagicIcon, DownloadIcon, AlertIcon, RefreshIcon, SettingsIcon, SunIcon, MoonIcon } from './components/Icons';
import { LoadingOverlay } from './components/LoadingOverlay';
import { PromptManager } from './components/PromptManager';
import { translations } from './translations';

// The default fixed prompt moved to a constant for initialization
const DEFAULT_PROMPT_CONTENT = `1. Giữ nguyên bố cục 100%

Không được dịch chuyển, không thay đổi vị trí, không thay đổi khoảng cách của bất kỳ thành phần nào: sản phẩm, text, icon, bullet, layout tổng thể.

Không thay đổi kích thước sản phẩm hay các thành phần khác.

Bố cục phải giống ảnh gốc 100%.

Chỉ được phép crop hoặc mở rộng nền để loại bỏ vùng trắng dư và đảm bảo nền phủ kín 100%.
Không được căn giữa, không được căn chỉnh lại bố cục theo bất kỳ hướng nào.

2. Nền chuẩn #f0f0f0

Nền phải là solid color #f0f0f0.

Không bóng, không noise, không gradient, không đổi sáng.

Bao phủ 100% toàn bộ vùng nền bằng cách crop hoặc mở rộng vùng nền, không thay đổi vị trí các thành phần.

3. Thay logo header

Thay logo “Hàng Nhật Chính Hãng” cũ bằng logo mới tôi cung cấp.

Giữ đúng vị trí và kích thước hiển thị y hệt logo cũ.

Resize đúng tỉ lệ gốc, không méo.

4. Quy định font chữ
Tất cả văn bản dùng Plus Jakarta Sans.

Tiêu đề sản phẩm:

In đậm (bold)

Màu chữ #026415

Có viền trắng

Không đổ bóng

Icon + text mô tả:

Màu chữ và màu viền icon có chính xác màu #32352f

5. Các thành phần khác giữ nguyên 100%
Không thay đổi:

kích thước sản phẩm

vị trí icon

text mô tả

layout 3 bullet

bố cục tổng thể

khoảng cách giữa các phần tử

(Chỉ được crop/mở rộng nền để nền phủ đều 100%.)

6. Kết quả cuối

Kích thước ảnh 1024 × 1024 px

Nền #f0f0f0 phủ 100%

Tiêu đề bold, #026415 có viền trắng

Màu chữ và màu viền icon của nội dung có chính xác màu #32352f

Logo mới đúng vị trí + đúng tỉ lệ + đúng kích thước

Không lệch bố cục

Không dịch chuyển bất kỳ thành phần nào

Nền phẳng đều, không còn khung trắng`;

const DEFAULT_PROMPTS: Prompt[] = [
  {
    id: 'default',
    name: 'Standard Layout (Default)',
    content: DEFAULT_PROMPT_CONTENT
  }
];

// Initial Settings
const DEFAULT_SETTINGS: AppSettings = {
  language: 'vi', // Default Vietnamese
  theme: 'light', // Default Light Mode
  resolution: '1K', // Default 1K
  activePromptId: 'default'
};

function App() {
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [isCheckingKey, setIsCheckingKey] = useState<boolean>(true);
  
  // App Settings State
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('gemini_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Prompt State
  const [prompts, setPrompts] = useState<Prompt[]>(() => {
    try {
      const saved = localStorage.getItem('gemini_prompts');
      return saved ? JSON.parse(saved) : DEFAULT_PROMPTS;
    } catch {
      return DEFAULT_PROMPTS;
    }
  });

  const [showPromptManager, setShowPromptManager] = useState(false);

  // Batch processing state
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Derived Values
  const t = translations[settings.language];

  // --- Effects ---

  // 1. Check API Key
  useEffect(() => {
    checkApiKey();
  }, []);

  // 2. Persist Settings & Apply Theme
  useEffect(() => {
    localStorage.setItem('gemini_settings', JSON.stringify(settings));
    
    // Apply theme class to HTML element
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  // 3. Persist Prompts
  useEffect(() => {
    localStorage.setItem('gemini_prompts', JSON.stringify(prompts));
  }, [prompts]);

  const checkApiKey = async () => {
    try {
      const win = window as any;
      if (win.aistudio) {
        const hasKey = await win.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      }
    } catch (e) {
      console.error("Error checking API key status", e);
    } finally {
      setIsCheckingKey(false);
    }
  };

  const handleSelectKey = async () => {
    try {
      const win = window as any;
      if (win.aistudio) {
        await win.aistudio.openSelectKey();
        setHasApiKey(true);
        setErrorMsg(null);
      }
    } catch (e) {
      console.error("Error selecting API key", e);
    }
  };

  // Helper to read file as base64
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Update specific setting helper
  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Handle Main Image Upload (Multiple)
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newItems: QueueItem[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        try {
          const preview = await readFileAsBase64(file);
          newItems.push({
            id: Math.random().toString(36).substring(7) + Date.now() + i, 
            file,
            originalPreview: preview,
            mimeType: file.type,
            status: 'pending'
          });
        } catch (e) {
          console.error("Error reading file", file.name, e);
        }
      }
    }

    setQueue(prev => [...prev, ...newItems]);
    setErrorMsg(null);
    
    if (newItems.length > 0 && !selectedId) {
      setSelectedId(newItems[0].id);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
    if (event.target) event.target.value = '';
  };

  // Handle Generation Logo Upload
  const handleEditLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Update state and save to settings for persistence
        updateSetting('savedLogo', base64);
        updateSetting('savedLogoMime', file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFiles(e.dataTransfer.files);
  };

  // Process Queue
  const processQueue = async () => {
    if (isProcessing) return;

    const activePrompt = prompts.find(p => p.id === settings.activePromptId);
    if (!activePrompt) {
        setErrorMsg(t.error + ": " + t.selectToView);
        return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    const pendingIds = queue.filter(item => item.status === 'pending').map(item => item.id);

    if (pendingIds.length === 0) {
      setIsProcessing(false);
      return;
    }

    for (const id of pendingIds) {
      setSelectedId(id);
      setQueue(prev => prev.map(i => i.id === id ? { ...i, status: 'processing' } : i));

      const itemData = queue.find(q => q.id === id); 
      if (!itemData) continue;

      try {
        const resultImage = await editImageWithGemini({
          base64Image: itemData.originalPreview,
          mimeType: itemData.mimeType,
          prompt: activePrompt.content, 
          logoBase64: settings.savedLogo,
          logoMimeType: settings.savedLogoMime,
          imageSize: settings.resolution
        });

        setQueue(prev => prev.map(i => i.id === id ? { ...i, status: 'success', resultPreview: resultImage } : i));
      } catch (err: any) {
        if (err.message === "API_KEY_INVALID") {
            setHasApiKey(false);
            setErrorMsg(t.apiKeyInvalid);
            setIsProcessing(false);
            return;
        }
        setQueue(prev => prev.map(i => i.id === id ? { ...i, status: 'error', error: err.message || "Failed" } : i));
      }

      await new Promise(r => setTimeout(r, 500));
    }

    setIsProcessing(false);
  };

  const handleRegenerate = (id: string) => {
    setQueue(prev => prev.map(i => i.id === id ? { ...i, status: 'pending', resultPreview: undefined, error: undefined } : i));
  };

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setQueue(prev => prev.filter(i => i.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  const handleClearAll = () => {
    if (isProcessing) return;
    setQueue([]);
    setSelectedId(null);
  };

  const handleDownload = () => {
    const activeItem = queue.find(i => i.id === selectedId);
    if (activeItem && activeItem.resultPreview) {
      const link = document.createElement('a');
      link.href = activeItem.resultPreview;
      link.download = activeItem.file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDownloadAll = async () => {
    const successItems = queue.filter(i => i.status === 'success' && i.resultPreview);
    if (successItems.length === 0) return;

    for (const item of successItems) {
      if (item.resultPreview) {
        const link = document.createElement('a');
        link.href = item.resultPreview;
        link.download = item.file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        await new Promise(r => setTimeout(r, 300));
      }
    }
  };

  const activeItem = queue.find(i => i.id === selectedId);
  const successCount = queue.filter(i => i.status === 'success').length;
  const pendingCount = queue.filter(i => i.status === 'pending').length;

  // 1. Loading State
  if (isCheckingKey) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">{t.loading}</div>;
  }

  // 2. API Key Landing
  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground px-4">
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 shadow-lg shadow-primary/20 text-white">
          <MagicIcon />
        </div>
        <h1 className="text-3xl font-bold mb-2 text-center">{t.appTitle} <span className="text-primary">Pro</span></h1>
        <p className="text-secondary max-w-md text-center mb-8">
          {t.apiKeyDesc}
        </p>
        <button 
          onClick={handleSelectKey}
          className="px-8 py-3 bg-foreground text-background font-semibold rounded-full hover:scale-105 transition-transform shadow-xl flex items-center gap-2"
        >
          {t.connectKey}
        </button>
        <a 
          href="https://ai.google.dev/gemini-api/docs/billing" 
          target="_blank" 
          rel="noreferrer"
          className="mt-6 text-sm text-secondary hover:text-primary transition-colors underline"
        >
          {t.readBilling}
        </a>
        {errorMsg && (
          <div className="mt-8 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-300 text-sm flex items-center gap-2">
            <AlertIcon />
            {errorMsg}
          </div>
        )}
      </div>
    );
  }

  // 3. Main App UI
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 flex flex-col transition-colors duration-300">
      <PromptManager 
         isOpen={showPromptManager} 
         onClose={() => setShowPromptManager(false)}
         prompts={prompts}
         setPrompts={setPrompts}
         activePromptId={settings.activePromptId}
         setActivePromptId={(id) => updateSetting('activePromptId', id)}
         language={settings.language}
      />

      {/* Header */}
      <header className="border-b border-border bg-surface/50 backdrop-blur-md sticky top-0 z-50 shrink-0">
        <div className="max-w-full px-4 lg:px-6 h-16 flex items-center justify-between">
          
          {/* Left: Logo & Title */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white">
              <MagicIcon />
            </div>
            <h1 className="font-bold text-xl tracking-tight hidden sm:block">{t.appTitle} <span className="text-primary font-normal">Pro</span></h1>
            <h1 className="font-bold text-xl tracking-tight sm:hidden">G<span className="text-primary">Lens</span></h1>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
             {/* Model Info (Hidden on mobile) */}
             <div className="hidden lg:block text-xs text-secondary font-mono bg-black/5 dark:bg-white/5 px-2 py-1 rounded">
              {t.model}: gemini-3-pro-image-preview
            </div>

            <div className="h-6 w-px bg-border hidden sm:block"></div>

            {/* Language Switcher */}
            <div className="flex bg-black/5 dark:bg-white/5 rounded-lg p-0.5 border border-border">
                <button 
                onClick={() => updateSetting('language', 'vi')}
                className={`px-2 py-1 text-[10px] font-bold rounded transition-all ${settings.language === 'vi' ? 'bg-background shadow text-foreground' : 'text-secondary hover:text-foreground'}`}
                >
                    VI
                </button>
                <button 
                onClick={() => updateSetting('language', 'en')}
                className={`px-2 py-1 text-[10px] font-bold rounded transition-all ${settings.language === 'en' ? 'bg-background shadow text-foreground' : 'text-secondary hover:text-foreground'}`}
                >
                    EN
                </button>
            </div>

            {/* Theme Switcher */}
            <button 
              onClick={() => updateSetting('theme', settings.theme === 'light' ? 'dark' : 'light')}
              className="p-2 text-secondary hover:text-foreground rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              title={settings.theme === 'light' ? t.dark : t.light}
            >
               {settings.theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </button>

            {/* API Key */}
            <button 
              onClick={() => setHasApiKey(false)}
              className="text-xs text-secondary hover:text-foreground border border-border px-3 py-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              Key
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        
        {/* Left Sidebar: Controls & Queue */}
        <div className="w-full lg:w-[400px] bg-surface/50 border-r border-border flex flex-col h-full overflow-hidden shrink-0">
          
          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6">
            
            {/* 1. Upload Section */}
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
                    onChange={handleFileChange} 
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
                    <button onClick={() => { updateSetting('savedLogo', null); if(logoInputRef.current) logoInputRef.current.value=''; }} className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300">
                        {t.remove}
                    </button>
                  )}
                </div>
            </div>

            {/* 3. Prompt Configuration */}
            <div>
              <div className="flex items-center justify-between mb-3">
                 <h2 className="text-sm font-semibold">{t.promptSettings}</h2>
                 <button 
                   onClick={() => setShowPromptManager(true)}
                   className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                 >
                   <SettingsIcon /> {t.manage}
                 </button>
              </div>
              <div className="relative">
                <select 
                  value={settings.activePromptId}
                  onChange={(e) => updateSetting('activePromptId', e.target.value)}
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

             {/* 4. Output Settings (Resolution) */}
             <div>
              <h2 className="text-sm font-semibold mb-3">{t.settings}</h2>
              <div className="bg-surface border border-border rounded-xl p-2 flex flex-col gap-1">
                <label className="text-xs text-secondary uppercase font-semibold">{t.resolution}</label>
                  <div className="flex bg-black/5 dark:bg-white/5 rounded-lg p-0.5">
                    <button 
                    onClick={() => updateSetting('resolution', '1K')}
                    className={`flex-1 text-xs py-1.5 rounded-md transition-all ${settings.resolution === '1K' ? 'bg-background shadow text-foreground' : 'text-secondary hover:text-foreground'}`}
                    >
                      1K
                    </button>
                    <button 
                    onClick={() => updateSetting('resolution', '2K')}
                    className={`flex-1 text-xs py-1.5 rounded-md transition-all ${settings.resolution === '2K' ? 'bg-background shadow text-foreground' : 'text-secondary hover:text-foreground'}`}
                    >
                      2K
                    </button>
                    <button 
                    onClick={() => updateSetting('resolution', '4K')}
                    className={`flex-1 text-xs py-1.5 rounded-md transition-all ${settings.resolution === '4K' ? 'bg-background shadow text-foreground' : 'text-secondary hover:text-foreground'}`}
                    >
                      4K
                    </button>
                </div>
              </div>
             </div>

            {/* Queue List */}
            <div className="flex-1 min-h-[150px] flex flex-col">
                 <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold">{t.queue}</h2>
                    {queue.length > 0 && !isProcessing && (
                        <button onClick={handleClearAll} className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300">{t.clearAll}</button>
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
                                onClick={() => setSelectedId(item.id)}
                                className={`
                                    flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors border
                                    ${selectedId === item.id ? 'bg-background border-primary/50 shadow-sm' : 'bg-surface border-transparent hover:bg-black/5 dark:hover:bg-white/5'}
                                `}
                            >
                                <img src={item.originalPreview} alt="thumb" className="w-10 h-10 rounded object-cover bg-black" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-foreground truncate font-medium">{item.file.name}</p>
                                    <p className="text-[10px] text-secondary uppercase">{item.status}</p>
                                </div>
                                <div className="shrink-0 flex items-center gap-2">
                                    {item.status === 'processing' && <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />}
                                    {item.status === 'success' && <div className="text-green-500 text-xs">✓</div>}
                                    {item.status === 'error' && (
                                       <button 
                                          onClick={(e) => { e.stopPropagation(); handleRegenerate(item.id); }}
                                          className="text-red-500 dark:text-red-400 hover:text-red-600 text-xs flex items-center"
                                          title={t.regenerate}
                                       >
                                          <RefreshIcon />
                                       </button>
                                    )}
                                    {item.status === 'pending' && !isProcessing && (
                                        <button 
                                            onClick={(e) => handleDeleteItem(item.id, e)}
                                            className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/20 text-secondary hover:text-foreground"
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
          <div className="p-4 border-t border-border bg-surface/50 backdrop-blur-md flex flex-col gap-2">
            {errorMsg && <div className="mb-2 text-xs text-red-500 dark:text-red-400">{errorMsg}</div>}
            
            <div className="flex gap-2">
              <button
                  onClick={processQueue}
                  disabled={pendingCount === 0 || isProcessing}
                  className={`
                  flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200
                  ${(pendingCount === 0 || isProcessing) 
                      ? 'bg-black/5 dark:bg-white/10 text-secondary cursor-not-allowed' 
                      : 'bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.02] text-white'}
                  `}
              >
                  {isProcessing ? (
                  <span className="flex items-center gap-2 text-sm">{t.processing}</span>
                  ) : (
                  <>
                      <MagicIcon />
                      <span className="text-sm">{t.generateAll} ({pendingCount})</span>
                  </>
                  )}
              </button>
              
              {successCount > 0 && !isProcessing && (
                 <button
                    onClick={handleDownloadAll}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-foreground transition-all duration-200"
                    title={t.download}
                 >
                    <DownloadIcon />
                    <span className="sr-only sm:not-sr-only text-sm">{t.download} ({successCount})</span>
                 </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Area: Viewer */}
        <div className="flex-1 bg-background/50 dark:bg-black/40 flex flex-col overflow-hidden relative transition-colors">
            {/* Top Bar of Viewer */}
            <div className="h-12 border-b border-border flex items-center justify-between px-6 bg-surface/20 backdrop-blur-sm">
                <span className="text-xs text-secondary truncate max-w-[300px]">
                    {activeItem ? activeItem.file.name : t.noImageSelected}
                </span>
                <div className="flex items-center gap-3">
                    {(activeItem?.status === 'success' || activeItem?.status === 'error') && (
                        <button 
                            onClick={() => handleRegenerate(activeItem.id)}
                            className="flex items-center gap-2 text-xs font-medium text-secondary hover:text-foreground transition-colors"
                        >
                            <RefreshIcon /> {t.regenerate}
                        </button>
                    )}
                    {activeItem?.status === 'success' && activeItem.resultPreview && (
                        <button 
                            onClick={handleDownload}
                            className="flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                            <DownloadIcon /> {t.download}
                        </button>
                    )}
                </div>
            </div>

            {/* Image Canvas */}
            <div className="flex-1 relative p-8 flex items-center justify-center overflow-hidden">
                {!activeItem ? (
                     <div className="text-center text-secondary">
                        <div className="w-16 h-16 mx-auto mb-4 border-2 border-dashed border-border rounded-2xl flex items-center justify-center">
                            <MagicIcon />
                        </div>
                        <p>{t.selectToView}</p>
                    </div>
                ) : (
                    <div className="w-full h-full flex gap-4 items-center justify-center">
                        {/* Only show Result if available, otherwise show Original */}
                        
                        {activeItem.status === 'success' && activeItem.resultPreview ? (
                            <div className="relative max-w-full max-h-full aspect-square group">
                                <img 
                                    src={activeItem.resultPreview} 
                                    alt="Result" 
                                    className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                                />
                                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-xs text-green-400 font-medium">
                                    {t.generatedResult}
                                </div>
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => handleRegenerate(activeItem.id)}
                                        className="bg-black/60 p-2 rounded-lg text-white hover:bg-white/20 text-xs"
                                        title={t.regenerate}
                                    >
                                        <RefreshIcon />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="relative max-w-full max-h-full aspect-square">
                                <img 
                                    src={activeItem.originalPreview} 
                                    alt="Original" 
                                    className={`max-w-full max-h-full object-contain shadow-2xl rounded-lg ${activeItem.status === 'processing' ? 'opacity-50' : ''}`}
                                />
                                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-xs text-white/90 font-medium">
                                    {t.originalInput}
                                </div>
                                {activeItem.status === 'processing' && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <LoadingOverlay />
                                    </div>
                                )}
                                {activeItem.status === 'error' && (
                                     <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                                        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-200 text-center max-w-sm">
                                            <p className="font-bold mb-1">{t.error}</p>
                                            <p className="text-sm">{activeItem.error}</p>
                                            <button 
                                                onClick={() => handleRegenerate(activeItem.id)}
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
      </main>
    </div>
  );
}

export default App;