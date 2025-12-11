import React from 'react';
import { GridIcon, ClockIcon, HelpCircleIcon, MagicIcon, LayoutIcon } from './Icons';
import { Language } from '../types';
import { translations } from '../translations';

export type ViewType = 'editor' | 'layout' | 'history' | 'help';

interface DrawerProps {
  currentView: ViewType;
  onChangeView: (view: ViewType) => void;
  language: Language;
}

export const Drawer: React.FC<DrawerProps> = ({ currentView, onChangeView, language }) => {
  const t = translations[language];

  const menuItems: { id: ViewType; label: string; icon: React.ReactNode }[] = [
    { id: 'editor', label: t.menuEditor, icon: <GridIcon /> },
    { id: 'layout', label: t.menuLayout, icon: <LayoutIcon /> },
    { id: 'history', label: t.menuHistory, icon: <ClockIcon /> },
    { id: 'help', label: t.menuHelp, icon: <HelpCircleIcon /> },
  ];

  return (
    <aside className="w-20 lg:w-64 bg-surface border-r border-border flex flex-col h-full transition-all duration-300 z-40 shrink-0">
      {/* App Logo Area */}
      <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shrink-0">
          <MagicIcon />
        </div>
        <span className="hidden lg:block ml-3 font-bold text-lg tracking-tight truncate">
          VP GEN
        </span>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-6 flex flex-col gap-2 px-3">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={`
              flex items-center justify-center lg:justify-start gap-3 px-3 py-3 rounded-xl transition-all duration-200 group
              ${currentView === item.id 
                ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                : 'text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground'}
            `}
            title={item.label}
          >
            <span className={`shrink-0 ${currentView === item.id ? 'text-white' : ''}`}>
              {item.icon}
            </span>
            <span className="hidden lg:block font-medium text-sm">
              {item.label}
            </span>
            
            {/* Active Indicator (Mobile/Collapsed) */}
            {currentView === item.id && (
               <div className="lg:hidden absolute left-0 w-1 h-8 bg-primary rounded-r-full" />
            )}
          </button>
        ))}
      </nav>

      {/* Footer / Version Info */}
      <div className="p-4 border-t border-border hidden lg:block">
        <p className="text-xs text-secondary text-center">v1.2.0 Pro</p>
      </div>
    </aside>
  );
};