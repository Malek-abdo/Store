import { useState, useEffect, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  Bot, 
  Search,
  PackageOpen
} from 'lucide-react';
import { Product, StoreSettings, UserProfile } from './types';
import { STORE_THEMES } from './lib/theme';
import { 
  subscribeToAuth, 
  loginWithGoogle, 
  logoutUser, 
  fetchProducts, 
  saveProduct, 
  deleteProduct, 
  fetchUserSettings, 
  saveUserSettings, 
  updateStoredUserPhoto,
  DEFAULT_SETTINGS 
} from './lib/firebase';
import { BottomNav, ActiveTab } from './components/BottomNav';
import { Header } from './components/Header';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { AiAssistant } from './components/AiAssistant';
import { SettingsView } from './components/SettingsView';
import { OnboardingView } from './components/OnboardingView';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(() => {
    try {
      const savedTheme = localStorage.getItem('store_app_theme') as 'light' | 'dark' | null;
      if (savedTheme === 'dark' || savedTheme === 'light') {
        return { ...DEFAULT_SETTINGS, theme: savedTheme };
      }
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });
  const [loadingData, setLoadingData] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'in_stock' | 'low_stock'>('all');

  // Modal states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Subscribe to authentication
  useEffect(() => {
    const unsubscribe = subscribeToAuth((authedUser) => {
      setUser(authedUser);
      setAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  // Load user data & settings when user logs in
  useEffect(() => {
    if (user) {
      setLoadingData(true);
      Promise.all([fetchProducts(user.uid), fetchUserSettings(user.uid)])
        .then(([fetchedProducts, fetchedSettings]) => {
          setProducts(fetchedProducts);
          // Preserve local theme override if present
          try {
            const savedTheme = localStorage.getItem('store_app_theme') as 'light' | 'dark' | null;
            if (savedTheme) {
              fetchedSettings.theme = savedTheme;
            }
          } catch {
            // ignore
          }
          setSettings(fetchedSettings);
        })
        .catch((err) => console.error('Error loading data:', err))
        .finally(() => setLoadingData(false));
    } else {
      setProducts([]);
    }
  }, [user]);

  // Sync dark mode class on document and body
  useEffect(() => {
    const isDark = settings.theme === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [settings.theme]);

  // Active store theme colors based on 60-30-10 palette rules
  const currentThemeConfig = useMemo(() => {
    return STORE_THEMES[settings.storeType] || STORE_THEMES.fashion;
  }, [settings.storeType]);

  // Handle Google Login
  const handleGoogleSignIn = async () => {
    const loggedInUser = await loginWithGoogle();
    setUser(loggedInUser);
    setActiveTab('products');
  };

  // Handle Logout
  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setActiveTab('products');
  };

  // Handle Profile Photo Update
  const handleUpdateUserPhoto = (newPhoto: string) => {
    const updated = updateStoredUserPhoto(newPhoto);
    if (updated) {
      setUser({ ...updated });
    } else {
      setUser((prev) => (prev ? { ...prev, photoURL: newPhoto } : null));
    }
  };

  // Handle Save (Add or Edit) Product
  const handleSaveProduct = async (
    productData: Omit<Product, 'id' | 'ownerId' | 'createdAt'>,
    editingId?: string
  ): Promise<Product | undefined> => {
    if (!user) return undefined;

    if (editingId) {
      const existing = products.find((p) => p.id === editingId);
      if (existing) {
        const updated: Product = {
          ...existing,
          ...productData,
          updatedAt: Date.now(),
        };
        await saveProduct(updated);
        setProducts((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
        return updated;
      }
    } else {
      const newProduct: Product = {
        id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        ownerId: user.uid,
        ...productData,
        createdAt: Date.now(),
      };
      await saveProduct(newProduct);
      setProducts((prev) => [newProduct, ...prev]);
      return newProduct;
    }
  };

  // Handle Delete Confirmation
  const handleConfirmDelete = async () => {
    if (!user || !deletingProduct) return;
    try {
      setIsDeleting(true);
      await deleteProduct(deletingProduct.id, user.uid);
      setProducts((prev) => prev.filter((p) => p.id !== deletingProduct.id));
      setDeletingProduct(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Settings Update
  const handleUpdateSettings = async (newProps: Partial<StoreSettings>) => {
    const updated: StoreSettings = { ...settings, ...newProps };
    setSettings(updated);
    if (newProps.theme) {
      try {
        localStorage.setItem('store_app_theme', newProps.theme);
      } catch {
        // ignore
      }
    }
    if (user) {
      await saveUserSettings(user.uid, updated);
    }
  };

  // Low stock products count (< 5 items)
  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.quantity < 5).length;
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Search text filter
      const matchesSearch =
        !searchQuery.trim() ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // Status pill filter
      if (activeFilter === 'low_stock') {
        return product.quantity < 5;
      }
      if (activeFilter === 'in_stock') {
        return product.quantity >= 5;
      }
      return true;
    });
  }, [products, searchQuery, activeFilter]);

  // If still checking auth on initial render
  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white gap-3">
        <div className="w-10 h-10 border-3 border-sky-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-400">جاري تحميل المتجر...</span>
      </div>
    );
  }

  // If not logged in, show single onboarding screen as mandated
  if (!user) {
    return <OnboardingView onGoogleSignIn={handleGoogleSignIn} />;
  }

  return (
    <div
      id="mobile-store-app"
      className={`${settings.theme === 'dark' ? 'dark ' : ''}min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col transition-colors`}
    >
      {/* Main Container constrained to mobile max-width for realistic PWA experience */}
      <div className="flex-1 flex flex-col w-full max-w-lg mx-auto bg-white dark:bg-slate-900 shadow-2xl relative min-h-screen">
        
        {/* VIEW 1: PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div className="flex-1 flex flex-col pb-24">
            <Header
              storeName={settings.storeName}
              storeConfig={currentThemeConfig}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              onAddNewProduct={() => {
                setEditingProduct(null);
                setIsProductModalOpen(true);
              }}
              lowStockCount={lowStockCount}
              totalProducts={products.length}
              isDark={settings.theme === 'dark'}
              onToggleTheme={() =>
                handleUpdateSettings({
                  theme: settings.theme === 'dark' ? 'light' : 'dark',
                })
              }
            />

            {/* Products Main List / Grid */}
            <main className="p-4 flex-1">
              {loadingData ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                  <div className="w-8 h-8 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs">جاري مزامنة المنتجات...</span>
                </div>
              ) : filteredProducts.length === 0 ? (
                /* Clear Empty State */
                <div
                  id="empty-products-state"
                  className="flex flex-col items-center justify-center py-16 px-6 text-center"
                >
                  <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-4">
                    {searchQuery ? <Search className="w-8 h-8" /> : <PackageOpen className="w-8 h-8" />}
                  </div>

                  <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1.5">
                    {searchQuery
                      ? 'لم يتم العثور على أي نتائج مطابقة'
                      : activeFilter === 'low_stock'
                      ? 'لا توجد منتجات بمخزون منخفض'
                      : 'لا توجد منتجات مضافة حتى الآن'}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-6 leading-relaxed">
                    {searchQuery
                      ? `جرب البحث بكلمات أخرى أو قم بإلغاء التصفية.`
                      : 'ابدأ بإضافة أول منتج لمتجرك لتتمكن من متابعة مخزونه والاستفادة من المساعد الذكي.'}
                  </p>

                  {searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                    >
                      إعادة ضبط البحث
                    </button>
                  ) : (
                    <button
                      id="empty-state-add-btn"
                      type="button"
                      onClick={() => {
                        setEditingProduct(null);
                        setIsProductModalOpen(true);
                      }}
                      className="px-6 py-3 rounded-2xl text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                      style={{ backgroundColor: currentThemeConfig.accent }}
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة أول منتج للمتجر</span>
                    </button>
                  )}
                </div>
              ) : (
                /* Products Grid */
                <div
                  id="products-grid"
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-300"
                >
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onEdit={(prod) => {
                        setEditingProduct(prod);
                        setIsProductModalOpen(true);
                      }}
                      onDelete={(prod) => setDeletingProduct(prod)}
                      primaryColor={currentThemeConfig.primary}
                      accentColor={currentThemeConfig.accent}
                    />
                  ))}
                </div>
              )}
            </main>

            {/* Floating Action Button (FAB) for Quick Add */}
            <div className="fixed bottom-22 left-5 z-30 sm:left-[calc(50%-230px)]">
              <button
                id="floating-add-product-btn"
                type="button"
                onClick={() => {
                  setEditingProduct(null);
                  setIsProductModalOpen(true);
                }}
                className="w-13 h-13 rounded-2xl text-white dark:text-slate-950 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 shadow-xl hover:shadow-2xl active:scale-95 transition-all flex items-center justify-center cursor-pointer border border-slate-700/20 dark:border-slate-200/50"
                title="إضافة منتج جديد"
                aria-label="إضافة منتج جديد"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: AI ASSISTANT TAB */}
        {activeTab === 'assistant' && (
          <div className="flex-1 flex flex-col h-screen max-h-screen">
            <AiAssistant
              user={user}
              products={products}
              primaryColor={currentThemeConfig.primary}
              accentColor={currentThemeConfig.accent}
              onAddProduct={async (productData) => {
                return await handleSaveProduct(productData);
              }}
              onSwitchToProductsTab={() => setActiveTab('products')}
            />
          </div>
        )}

        {/* VIEW 3: SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="flex-1 flex flex-col">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                الإعدادات
              </h2>
            </div>

            <SettingsView
              user={user}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onLogout={handleLogout}
              onUpdatePhoto={handleUpdateUserPhoto}
              primaryColor={currentThemeConfig.primary}
              accentColor={currentThemeConfig.accent}
            />
          </div>
        )}

        {/* Persistent Bottom Navigation Bar */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          lowStockCount={lowStockCount}
          primaryColor={currentThemeConfig.primary}
        />

        {/* Add/Edit Product Bottom Sheet Modal */}
        <ProductModal
          isOpen={isProductModalOpen}
          onClose={() => {
            setIsProductModalOpen(false);
            setEditingProduct(null);
          }}
          onSave={handleSaveProduct}
          productToEdit={editingProduct}
          primaryColor={currentThemeConfig.primary}
          accentColor={currentThemeConfig.accent}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          isOpen={!!deletingProduct}
          product={deletingProduct}
          onClose={() => setDeletingProduct(null)}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
        />
      </div>
    </div>
  );
}
