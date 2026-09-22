import React from 'react';
import { Search, X, Plus, AlertCircle, Sun, Moon } from 'lucide-react';
import { StoreTypeConfig } from '../types';

interface HeaderProps {
  storeName: string;
  storeConfig: StoreTypeConfig;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  activeFilter: 'all' | 'in_stock' | 'low_stock';
  onFilterChange: (filter: 'all' | 'in_stock' | 'low_stock') => void;
  onAddNewProduct: () => void;
  lowStockCount: number;
  totalProducts: number;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  storeName,
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  onAddNewProduct,
  lowStockCount,
  totalProducts,
  isDark = false,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors text-right shadow-2xs">
      <div className="max-w-lg mx-auto px-4 py-3 space-y-3">
        {/* Top Branding Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <img
                src="/logo.png"
                alt="شعار المتجر"
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-xl object-cover shadow-xs border border-slate-200 dark:border-slate-700 shrink-0"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">لوحة المتجر</span>
              <h1 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                {storeName}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onToggleTheme && (
              <button
                id="header-theme-toggle-btn"
                type="button"
                onClick={onToggleTheme}
                title={isDark ? 'التحويل للوضع النهاري' : 'التحويل للوضع الليلي'}
                className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                aria-label="تبديل المظهر"
              >
                {isDark ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-slate-600" />}
              </button>
            )}

            {/* Quick Add Product Button */}
            <button
              id="header-add-product-btn"
              type="button"
              onClick={onAddNewProduct}
              className="h-10 px-3.5 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 active:scale-95 text-white dark:text-slate-900 text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة منتج</span>
            </button>
          </div>
        </div>

        {/* Search Input Bar - 44px Mobile Ergonomics */}
        <div className="relative">
          <input
            id="products-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="بحث بالاسم، التصنيف، أو السعر..."
            className="w-full pr-10 pl-9 h-11 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-700/60 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all shadow-inner"
          />
          <Search className="w-4.5 h-4.5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute left-2 top-1/2 -translate-y-1/2 cursor-pointer"
              aria-label="مسح البحث"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Pills Row */}
        <div className="flex items-center gap-2 text-xs pt-0.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => onFilterChange('all')}
            className={`h-9 px-3.5 rounded-xl font-bold transition-all shrink-0 active:scale-95 cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/50 dark:border-slate-700/50'
            }`}
          >
            <span>جميع المنتجات</span>
            <span className="text-[11px] opacity-80">({totalProducts})</span>
          </button>

          {lowStockCount > 0 && (
            <button
              type="button"
              onClick={() => onFilterChange(activeFilter === 'low_stock' ? 'all' : 'low_stock')}
              className={`h-9 px-3.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 active:scale-95 cursor-pointer ${
                activeFilter === 'low_stock'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>مخزون منخفض ({lowStockCount})</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
