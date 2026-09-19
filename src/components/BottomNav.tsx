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
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 transition-colors shadow-lg max-w-lg mx-auto"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
    >
      <div className="flex items-center justify-around h-16 px-4">
        {/* Products Tab */}
        <button
          id="nav-tab-products"
          type="button"
          onClick={() => onTabChange('products')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'products'
              ? 'text-sky-600 dark:text-sky-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <div className="relative">
            <Package className="w-5 h-5 mb-1" />
            {lowStockCount > 0 && (
              <span
                id="low-stock-nav-badge"
                className="absolute -top-1 -left-2 min-w-4 h-4 px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center"
              >
                {lowStockCount}
              </span>
            )}
          </div>
          <span className="text-xs">المنتجات</span>
        </button>

        {/* AI Assistant Tab */}
        <button
          id="nav-tab-assistant"
          type="button"
          onClick={() => onTabChange('assistant')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'assistant'
              ? 'text-sky-600 dark:text-sky-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <Bot className="w-5 h-5 mb-1" />
          <span className="text-xs">المساعد</span>
        </button>

        {/* Settings Tab */}
        <button
          id="nav-tab-settings"
          type="button"
          onClick={() => onTabChange('settings')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'settings'
              ? 'text-sky-600 dark:text-sky-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <SettingsIcon className="w-5 h-5 mb-1" />
          <span className="text-xs">الإعدادات</span>
        </button>
      </div>
    </nav>
  );
};
