import React from 'react';
import { Package, Bot, Settings as SettingsIcon } from 'lucide-react';

export type ActiveTab = 'products' | 'assistant' | 'settings';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  lowStockCount: number;
  primaryColor?: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  lowStockCount,
}) => {
  return (
    <nav
      id="bottom-navigation-bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 transition-colors shadow-lg max-w-lg mx-auto"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 8px), 8px)' }}
    >
      <div className="flex items-center justify-around h-16 px-3">
        {/* Products Tab */}
        <button
          id="nav-tab-products"
          type="button"
          onClick={() => onTabChange('products')}
          className={`relative flex flex-col items-center justify-center flex-1 h-13 py-1 rounded-2xl transition-all active:scale-95 cursor-pointer ${
            activeTab === 'products'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
          }`}
        >
          <div className="relative flex items-center justify-center">
            <Package className="w-5 h-5 mb-0.5" />
            {lowStockCount > 0 && (
              <span
                id="low-stock-nav-badge"
                className="absolute -top-1.5 -left-2.5 min-w-4 h-4 px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs"
              >
                {lowStockCount}
              </span>
            )}
          </div>
          <span className="text-[11px] leading-tight">المنتجات</span>
        </button>

        {/* AI Assistant Tab */}
        <button
          id="nav-tab-assistant"
          type="button"
          onClick={() => onTabChange('assistant')}
          className={`relative flex flex-col items-center justify-center flex-1 h-13 py-1 rounded-2xl transition-all active:scale-95 cursor-pointer ${
            activeTab === 'assistant'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
          }`}
        >
          <div className="relative flex items-center justify-center">
            <Bot className="w-5 h-5 mb-0.5" />
          </div>
          <span className="text-[11px] leading-tight">المساعد الذكي</span>
        </button>

        {/* Settings Tab */}
        <button
          id="nav-tab-settings"
          type="button"
          onClick={() => onTabChange('settings')}
          className={`relative flex flex-col items-center justify-center flex-1 h-13 py-1 rounded-2xl transition-all active:scale-95 cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
          }`}
        >
          <div className="relative flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 mb-0.5" />
          </div>
          <span className="text-[11px] leading-tight">الإعدادات</span>
        </button>
      </div>
    </nav>
  );
};
