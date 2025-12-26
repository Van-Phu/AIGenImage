
import React, { useState, useEffect } from 'react';
import { Prompt, AppSettings } from './types';
import { AlertIcon, SunIcon, MoonIcon, CheckIcon, XIcon, ClockIcon, HelpCircleIcon } from './components/Icons';
import { Drawer, ViewType } from './components/Drawer';
import { PromptManager } from './components/PromptManager';
import { translations } from './translations';
import { DEFAULT_PROMPT_CONTENT, DEFAULT_PROMPT_CONTENT_2, DEFAULT_LAYOUT_PROMPT_CONTENT, DEFAULT_BLUEPRINT_PROMPT_CONTENT, DEFAULT_AUTO_DESIGN_PROMPT_CONTENT } from './constants';

// Pages
import { EditLayoutPage } from './pages/EditLayoutPage';
import { CreateLayoutPage } from './pages/CreateLayoutPage';

const DEFAULT_PROMPTS: Prompt[] = [
  {
    id: 'default',
    name: 'Editor: Layout 1 (Full Details)',
    content: DEFAULT_PROMPT_CONTENT
  },
  {
    id: 'default_2',
    name: 'Editor: Layout 2 (Alternative)',
    content: DEFAULT_PROMPT_CONTENT_2
  },
  {
    id: 'layout_gen',
    name: 'Layout Gen: Standard Render',
    content: DEFAULT_LAYOUT_PROMPT_CONTENT
  },
  {
    id: 'blueprint_gen',
    name: 'Blueprint: Sketch to Real',
    content: DEFAULT_BLUEPRINT_PROMPT_CONTENT
  },
  {
    id: 'auto_design',
    name: 'Auto Design: Create Layout',
    content: DEFAULT_AUTO_DESIGN_PROMPT_CONTENT
  }
];

// Initial Settings (Global defaults)
const DEFAULT_SETTINGS: AppSettings = {
  language: 'vi',
  theme: 'light',
  resolution: '1K',
  activePromptId: 'default',
  filenamePattern: '(\\d{8,14})',
  layoutMode: 'reference'
};

function App() {
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [isCheckingKey, setIsCheckingKey] = useState<boolean>(true);
  const [storedApiKey, setStoredApiKey] = useState<string | null>(null);
  const [manualKeyInput, setManualKeyInput] = useState<string>('');
  
  // Navigation State (Router)
  const [currentView, setCurrentView] = useState<ViewType>('editor');
  const [isPromptManagerOpen, setIsPromptManagerOpen] = useState(false);

  // Global App Settings State (Language, Theme)
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('gemini_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Global Prompt State (Shared across pages)
  const [prompts, setPrompts] = useState<Prompt[]>(() => {
    try {
      const saved = localStorage.getItem('gemini_prompts');
      return saved ? JSON.parse(saved) : DEFAULT_PROMPTS;
    } catch {
      return DEFAULT_PROMPTS;
    }
  });

  const t = translations[settings.language];
  const isAIStudio = (window as any).aistudio !== undefined;

  // --- Effects ---

  // 1. Check API Key
  useEffect(() => {
    checkApiKey();
  }, []);

  // 2. Persist Settings & Prompts
  useEffect(() => {
    // Save minimal settings to global storage (mostly for theme/lang persistence)
    // Detailed settings are now handled inside the Pages.
    localStorage.setItem('gemini_settings', JSON.stringify({ 
        language: settings.language, 
        theme: settings.theme,
        layoutMode: settings.layoutMode
    }));
    
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('gemini_prompts', JSON.stringify(prompts));
  }, [prompts]);

  const checkApiKey = async () => {
    try {
      const win = window as any;
      if (win.aistudio) {
        const hasKey = await win.aistudio.hasSelectedApiKey();
        if (hasKey) {
          setHasApiKey(true);
          setIsCheckingKey(false);
          return;
        }
      }
      const savedKey = localStorage.getItem('gemini_api_key');
      if (savedKey) {
        setStoredApiKey(savedKey);
        setHasApiKey(true);
      } else {
        if (process.env.API_KEY) setHasApiKey(true);
        else setHasApiKey(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCheckingKey(false);
    }
  };

  const handleSelectKeyAIStudio = async () => {
    try {
      const win = window as any;
      if (win.aistudio) {
        await win.aistudio.openSelectKey();
        setHasApiKey(true);
      }
    } catch (e) { console.error(e); }
  };

  const handleSaveManualKey = () => {
    if (!manualKeyInput.trim()) return;
    const cleanKey = manualKeyInput.trim();
    localStorage.setItem('gemini_api_key', cleanKey);
    setStoredApiKey(cleanKey);
    setHasApiKey(true);
    setManualKeyInput('');
  };

  const handleSecureDisconnect = () => {
    setHasApiKey(false);
    setStoredApiKey(null);
    localStorage.removeItem('gemini_api_key');
  };

  const updateGlobalSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // --- Rendering ---

  if (isCheckingKey) {
    return <div className="h-screen bg-background flex items-center justify-center text-foreground">{t.loading}</div>;
  }

  // Auth Screen
  if (!hasApiKey) {
    return (
      <div className="h-screen bg-background flex flex-col items-center justify-center text-foreground px-4">
        <div className="mb-6 flex flex-col items-center">
             <img src="https://hachihachi.com.vn/Content/images/logo.png" alt="Hachi Hachi" className="h-20 w-auto object-contain mb-4" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
             <div className="hidden w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-lg shadow-primary/20"><span className="text-3xl font-bold">H</span></div>
        </div>
        <h1 className="text-3xl font-bold mb-2 text-center flex flex-col items-center gap-1">{t.appTitle} <span className="text-xl text-primary font-normal tracking-wide">mini tool</span></h1>
        <p className="text-secondary max-w-md text-center mb-6">{t.apiKeyDesc}</p>
        <div className="w-full max-w-md bg-surface border border-border rounded-xl p-6 shadow-xl">
           {isAIStudio ? (
               <button onClick={handleSelectKeyAIStudio} className="w-full px-8 py-3 bg-foreground text-background font-semibold rounded-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">{t.connectKey}</button>
           ) : (
             <div className="flex flex-col gap-3">
                <label className="text-sm font-medium text-foreground">{t.enterApiKey}</label>
                <div className="relative">
                  <input type="password" value={manualKeyInput} onChange={(e) => setManualKeyInput(e.target.value)} className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none" placeholder={t.apiKeyPlaceholder} autoComplete="off" />
                </div>
                <button onClick={handleSaveManualKey} disabled={manualKeyInput.length < 10} className={`w-full px-8 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${manualKeyInput.length < 10 ? 'bg-secondary/20 text-secondary cursor-not-allowed' : 'bg-primary text-white hover:bg-primary/90 hover:scale-[1.02]'}`}><CheckIcon />{t.saveKey}</button>
                <p className="text-xs text-secondary text-center mt-1">{t.apiKeyNote}</p>
             </div>
           )}
        </div>
        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="mt-6 text-sm text-secondary hover:text-primary transition-colors underline">{t.readBilling}</a>
      </div>
    );
  }

  // App Shell
  return (
    <div className="h-screen bg-background text-foreground selection:bg-primary/30 flex transition-colors duration-300 overflow-hidden">
      
      {/* Navigation Drawer */}
      <Drawer currentView={currentView} onChangeView={setCurrentView} language={settings.language} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-full">
        
        {/* Global Header */}
        <header className="border-b border-border bg-surface/50 backdrop-blur-md shrink-0 z-30">
          <div className="max-w-full px-4 lg:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(currentView === 'editor' || currentView === 'layout') && (
                  <>
                      <span className="text-secondary font-medium text-sm hidden sm:inline">{t.moduleMarketing}</span>
                      <span className="text-border hidden sm:inline">/</span>
                  </>
              )}
              <h1 className="font-bold text-lg tracking-tight">
                {currentView === 'editor' && t.batchEditor}
                {currentView === 'layout' && t.layoutGenerator}
                {currentView === 'history' && t.menuHistory}
                {currentView === 'help' && t.menuHelp}
              </h1>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <div className="hidden lg:block text-xs text-secondary font-mono bg-black/5 dark:bg-white/5 px-2 py-1 rounded">{t.model}: Gemini 3 Pro</div>
              <div className="h-6 w-px bg-border hidden sm:block"></div>
              
              {/* Language */}
              <div className="flex bg-black/5 dark:bg-white/5 rounded-lg p-0.5 border border-border">
                  <button onClick={() => updateGlobalSetting('language', 'vi')} className={`px-2 py-1 text-[10px] font-bold rounded transition-all ${settings.language === 'vi' ? 'bg-background shadow text-foreground' : 'text-secondary hover:text-foreground'}`}>VI</button>
                  <button onClick={() => updateGlobalSetting('language', 'en')} className={`px-2 py-1 text-[10px] font-bold rounded transition-all ${settings.language === 'en' ? 'bg-background shadow text-foreground' : 'text-secondary hover:text-foreground'}`}>EN</button>
              </div>

              {/* Theme */}
              <button onClick={() => updateGlobalSetting('theme', settings.theme === 'light' ? 'dark' : 'light')} className="p-2 text-secondary hover:text-foreground rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                {settings.theme === 'light' ? <MoonIcon /> : <SunIcon />}
              </button>

              <button onClick={handleSecureDisconnect} className="text-xs text-red-500 hover:text-red-600 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5">
                <XIcon /> <span className="hidden sm:inline">{t.switchKey}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content Area - Routing Logic */}
        <div className="flex-1 overflow-hidden relative h-full">
          {currentView === 'editor' && (
            <EditLayoutPage 
              apiKey={storedApiKey || process.env.API_KEY || null}
              prompts={prompts}
              globalSettings={settings}
              onOpenPromptManager={() => setIsPromptManagerOpen(true)}
              onDisconnect={handleSecureDisconnect}
            />
          )}
          
          {currentView === 'layout' && (
             <CreateLayoutPage 
              apiKey={storedApiKey || process.env.API_KEY || null}
              prompts={prompts}
              globalSettings={settings}
              onOpenPromptManager={() => setIsPromptManagerOpen(true)}
              onDisconnect={handleSecureDisconnect}
             />
          )}

          {(currentView === 'history' || currentView === 'help') && (
            <div className="h-full flex flex-col items-center justify-center text-secondary p-8">
               <div className="w-24 h-24 mb-6 rounded-2xl bg-surface border-2 border-dashed border-border flex items-center justify-center">
                 {currentView === 'history' && <div className="scale-150"><ClockIcon /></div>}
                 {currentView === 'help' && <div className="scale-150"><HelpCircleIcon /></div>}
               </div>
               <h2 className="text-2xl font-bold text-foreground mb-2">
                 {currentView === 'history' ? t.menuHistory : t.menuHelp}
               </h2>
               <p>{t.comingSoon}</p>
            </div>
          )}
        </div>
      </div>

      {/* Global Prompt Manager Overlay */}
      <PromptManager 
        isOpen={isPromptManagerOpen}
        onClose={() => setIsPromptManagerOpen(false)}
        prompts={prompts}
        setPrompts={setPrompts}
        activePromptId={settings.activePromptId}
        setActivePromptId={(id) => updateGlobalSetting('activePromptId', id)}
        language={settings.language}
      />
    </div>
  );
}

export default App;
