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
    <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors text-right">
      <div className="max-w-lg mx-auto px-4 py-3 space-y-2.5">
        {/* Top Branding Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="شعار المتجر"
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-xl object-cover shadow-xs border border-slate-200/80 dark:border-slate-700/80 shrink-0"
            />
            <h1 className="text-base font-bold text-slate-900 dark:text-white">
              {storeName}
            </h1>
            {onToggleTheme && (
              <button
                id="header-theme-toggle-btn"
                type="button"
                onClick={onToggleTheme}
                title={isDark ? 'التحويل للوضع النهاري' : 'التحويل للوضع الليلي'}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>
            )}
          </div>

          {/* Quick Add Product Button */}
          <button
            id="header-add-product-btn"
            type="button"
            onClick={onAddNewProduct}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة منتج</span>
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="relative">
          <input
            id="products-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="بحث عن منتج..."
            className="w-full pr-9 pl-8 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute left-2 top-1/2 -translate-y-1/2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills Row */}
        <div className="flex items-center gap-2 text-xs pt-0.5">
          <button
            type="button"
            onClick={() => onFilterChange('all')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all shrink-0 ${
              activeFilter === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            الكل ({totalProducts})
          </button>

          {lowStockCount > 0 && (
            <button
              type="button"
              onClick={() => onFilterChange(activeFilter === 'low_stock' ? 'all' : 'low_stock')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all shrink-0 flex items-center gap-1 ${
                activeFilter === 'low_stock'
                  ? 'bg-amber-500 text-white'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              مخزون منخفض ({lowStockCount})
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
