import React, { useState, useEffect } from 'react';
import { Prompt, Language } from '../types';
import { PlusIcon, TrashIcon, XIcon, CheckIcon } from './Icons';
import { translations } from '../translations';

interface PromptManagerProps {
  isOpen: boolean;
  onClose: () => void;
  prompts: Prompt[];
  setPrompts: (prompts: Prompt[]) => void;
  activePromptId: string;
  setActivePromptId: (id: string) => void;
  language: Language;
}

export const PromptManager: React.FC<PromptManagerProps> = ({
  isOpen,
  onClose,
  prompts,
  setPrompts,
  activePromptId,
  setActivePromptId,
  language
}) => {
  const [selectedId, setSelectedId] = useState<string>(activePromptId);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const t = translations[language];

  useEffect(() => {
    if (isOpen) {
      setSelectedId(activePromptId);
    }
  }, [isOpen, activePromptId]);

  useEffect(() => {
    const prompt = prompts.find(p => p.id === selectedId);
    if (prompt) {
      setName(prompt.name);
      setContent(prompt.content);
      setIsDirty(false);
    }
  }, [selectedId, prompts]);

  if (!isOpen) return null;

  const handleSave = () => {
    const updatedPrompts = prompts.map(p => 
      p.id === selectedId ? { ...p, name, content } : p
    );
    setPrompts(updatedPrompts);
    setIsDirty(false);
  };

  const handleCreate = () => {
    const newId = Date.now().toString();
    const newPrompt: Prompt = {
      id: newId,
      name: t.newPrompt,
      content: '',
    };
    setPrompts([...prompts, newPrompt]);
    setSelectedId(newId);
  };

  const handleDelete = (id: string) => {
    if (prompts.length <= 1) {
      alert(t.minOnePrompt);
      return;
    }
    
    const confirmDelete = window.confirm(t.deletePromptConfirm);
    if (!confirmDelete) return;

    const newPrompts = prompts.filter(p => p.id !== id);
    setPrompts(newPrompts);
    
    if (id === selectedId) {
      setSelectedId(newPrompts[0].id);
    }
    if (id === activePromptId) {
      setActivePromptId(newPrompts[0].id);
    }
  };

  const handleSelect = (id: string) => {
    if (isDirty) {
      const confirmSwitch = window.confirm(t.discardChanges);
      if (!confirmSwitch) return;
    }
    setSelectedId(id);
  };

  const handleClose = () => {
    if (isDirty) {
      const confirmClose = window.confirm(t.discardChanges);
      if (!confirmClose) return;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface w-full max-w-5xl h-[80vh] rounded-xl border border-border shadow-2xl flex flex-col overflow-hidden text-foreground">
        
        {/* Header */}
        <div className="h-14 border-b border-border flex items-center justify-between px-6 bg-background/50">
          <h2 className="text-lg font-semibold">{t.promptManager}</h2>
          <button onClick={handleClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-secondary hover:text-foreground transition-colors">
            <XIcon />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          
          {/* Sidebar List */}
          <div className="w-1/3 border-r border-border flex flex-col bg-background/50">
            <div className="p-4 border-b border-border">
              <button 
                onClick={handleCreate}
                className="w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/50 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors"
              >
                <PlusIcon /> {t.newPrompt}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {prompts.map(prompt => (
                <div 
                  key={prompt.id}
                  onClick={() => handleSelect(prompt.id)}
                  className={`
                    group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors
                    ${selectedId === prompt.id ? 'bg-black/5 dark:bg-white/10 border border-border' : 'hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'}
                  `}
                >
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${selectedId === prompt.id ? 'text-foreground' : 'text-foreground/70'}`}>
                      {prompt.name}
                    </p>
                    <p className="text-xs text-secondary truncate mt-0.5">
                      {prompt.content ? prompt.content.slice(0, 30) : '...'}...
                    </p>
                  </div>
                  {prompts.length > 1 && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(prompt.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 text-secondary hover:text-red-500 rounded transition-all"
                      title={t.remove}
                    >
                      <TrashIcon />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content Editor */}
          <div className="flex-1 flex flex-col bg-background">
            <div className="p-6 flex-1 flex flex-col gap-4 overflow-hidden">
              <div>
                <label className="block text-xs font-medium text-secondary uppercase mb-1.5">{t.promptName}</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => { setName(e.target.value); setIsDirty(true); }}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-foreground placeholder-secondary/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                  placeholder="e.g. Standard Product Layout"
                />
              </div>
              
              <div className="flex-1 flex flex-col min-h-0">
                <label className="block text-xs font-medium text-secondary uppercase mb-1.5">{t.promptContent}</label>
                <textarea 
                  value={content}
                  onChange={(e) => { setContent(e.target.value); setIsDirty(true); }}
                  className="flex-1 w-full bg-surface border border-border rounded-lg p-4 text-sm text-foreground/90 font-mono leading-relaxed resize-none focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all custom-scrollbar"
                  placeholder="Detailed instructions for the AI..."
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="h-16 border-t border-border bg-background/50 flex items-center justify-between px-6">
               <div className="text-xs text-secondary">
                  {isDirty ? t.unsavedChanges : t.allSaved}
               </div>
               <div className="flex gap-3">
                 {isDirty && (
                    <button 
                      onClick={() => {
                        const prompt = prompts.find(p => p.id === selectedId);
                        if (prompt) {
                          setName(prompt.name);
                          setContent(prompt.content);
                          setIsDirty(false);
                        }
                      }}
                      className="px-4 py-2 text-sm text-secondary hover:text-foreground transition-colors"
                    >
                      {t.reset}
                    </button>
                 )}
                 <button 
                    onClick={handleSave}
                    disabled={!isDirty}
                    className={`
                      px-6 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all
                      ${isDirty 
                        ? 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20' 
                        : 'bg-black/5 dark:bg-white/5 text-secondary cursor-not-allowed'}
                    `}
                 >
                    <CheckIcon /> {t.saveChanges}
                 </button>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};