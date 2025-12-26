
import React, { useState } from 'react';
import { GridIcon, ClockIcon, HelpCircleIcon, LayoutIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';
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

  // Initialize collapse state from local storage or default to false
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
        return localStorage.getItem('drawer_collapsed') === 'true';
    } catch {
        return false;
    }
  });

  const toggleCollapse = () => {
      const newState = !isCollapsed;
      setIsCollapsed(newState);
      localStorage.setItem('drawer_collapsed', String(newState));
  };

  const marketingItems = [
    { id: 'editor' as ViewType, label: t.menuEditor, icon: <GridIcon /> },
    { id: 'layout' as ViewType, label: t.menuLayout, icon: <LayoutIcon /> },
  ];

  const systemItems = [
    { id: 'history' as ViewType, label: t.menuHistory, icon: <ClockIcon /> },
    { id: 'help' as ViewType, label: t.menuHelp, icon: <HelpCircleIcon /> },
  ];

  const renderItem = (item: { id: ViewType; label: string; icon: React.ReactNode }) => (
    <button
      key={item.id}
      onClick={() => onChangeView(item.id)}
      className={`
        w-full flex items-center justify-center ${!isCollapsed ? 'lg:justify-start' : 'justify-center'} gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative
        ${currentView === item.id 
          ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/20' 
          : 'text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground'}
      `}
      title={item.label}
    >
      <span className={`shrink-0 ${currentView === item.id ? 'text-white' : ''}`}>
        {item.icon}
      </span>
      <span className={`hidden ${!isCollapsed ? 'lg:block' : ''} font-medium text-sm whitespace-nowrap overflow-hidden transition-all`}>
        {item.label}
      </span>
      
      {/* Active Indicator (Mobile or Collapsed) */}
      {(currentView === item.id && (isCollapsed || typeof window !== 'undefined' && window.innerWidth < 1024)) && (
         <div className="absolute left-0 w-1 h-8 bg-primary rounded-r-full" />
      )}
    </button>
  );

  return (
    <aside className={`w-20 ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} bg-surface border-r border-border flex flex-col h-full transition-all duration-300 z-40 shrink-0`}>
      {/* App Logo Area */}
      <div className={`h-20 flex items-center justify-center ${!isCollapsed ? 'lg:justify-start lg:px-6' : ''} border-b border-border transition-all`}>
        {/* Logo Image */}
        <div className="shrink-0">
          <img 
            src="https://hachihachi.com.vn/Content/images/logo.png" 
            alt="Hachi Hachi" 
            className="w-auto h-12 object-contain"
            onError={(e) => {
               // Fallback if image fails
               e.currentTarget.style.display = 'none';
               e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
          {/* Fallback Text Logo */}
          <div className="hidden w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
            H
          </div>
        </div>
        
        <div className={`hidden ${!isCollapsed ? 'lg:flex' : ''} flex-col ml-3 justify-center overflow-hidden transition-all whitespace-nowrap`}>
            <span className="font-bold text-lg tracking-tight leading-none text-foreground">
              Hachi Hachi
            </span>
            <span className="text-[10px] text-primary font-medium tracking-wider uppercase mt-0.5">
              mini tool
            </span>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-6 px-3 flex flex-col gap-6 overflow-y-auto custom-scrollbar overflow-x-hidden">
        
        {/* Marketing Module */}
        <div>
           <div className={`px-3 mb-2 text-[10px] font-bold text-secondary uppercase tracking-wider hidden ${!isCollapsed ? 'lg:block' : ''} transition-all whitespace-nowrap`}>
              {t.moduleMarketing}
           </div>
           <div className={`${!isCollapsed ? 'lg:hidden' : 'block'} px-1 mb-2 text-[10px] font-bold text-secondary uppercase text-center`}>
              MKT
           </div>
           <div className="flex flex-col gap-1">
              {marketingItems.map(renderItem)}
           </div>
        </div>

        {/* System Module */}
        <div>
           <div className={`px-3 mb-2 text-[10px] font-bold text-secondary uppercase tracking-wider hidden ${!isCollapsed ? 'lg:block' : ''} transition-all whitespace-nowrap`}>
              {t.moduleSystem}
           </div>
           <div className={`${!isCollapsed ? 'lg:hidden' : 'block'} px-1 mb-2 text-[10px] font-bold text-secondary uppercase text-center`}>
              SYS
           </div>
           <div className="flex flex-col gap-1">
              {systemItems.map(renderItem)}
           </div>
        </div>

      </nav>

      {/* Footer / Toggle & Version */}
      <div className="p-4 border-t border-border flex flex-col gap-3 items-center">
        {!isCollapsed && (
            <p className="text-xs text-secondary text-center hidden lg:block whitespace-nowrap">v1.4.0</p>
        )}
        
        <button 
            onClick={toggleCollapse} 
            className="hidden lg:flex w-full h-8 items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-secondary transition-colors"
            title={isCollapsed ? "Expand" : "Collapse"}
        >
            {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </button>
      </div>
    </aside>
  );
};
