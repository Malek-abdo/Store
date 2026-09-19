import React, { useState, useRef } from 'react';
import { 
  LogOut, 
  Moon, 
  Sun, 
  Bell, 
  BellOff, 
  Store, 
  Check, 
  ShieldCheck,
  Camera,
  RotateCcw
} from 'lucide-react';
import { UserProfile, StoreSettings } from '../types';
import { getGoogleAvatar } from '../lib/firebase';

interface SettingsViewProps {
  user: UserProfile;
  settings: StoreSettings;
  onUpdateSettings: (newSettings: Partial<StoreSettings>) => void;
  onLogout: () => void;
  onUpdatePhoto?: (newPhoto: string) => void;
  primaryColor?: string;
  accentColor?: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  settings,
  onUpdateSettings,
  onLogout,
  onUpdatePhoto,
  accentColor,
}) => {
  const [storeNameInput, setStoreNameInput] = useState(settings.storeName);
  const [savedNotification, setSavedNotification] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveStoreName = () => {
    if (storeNameInput.trim()) {
      onUpdateSettings({ storeName: storeNameInput.trim() });
      triggerSavedToast();
    }
  };

  const handleToggleDark = () => {
    const nextTheme = settings.theme === 'light' ? 'dark' : 'light';
    onUpdateSettings({ theme: nextTheme });
  };

  const handleToggleNotifications = () => {
    onUpdateSettings({ notificationsEnabled: !settings.notificationsEnabled });
    triggerSavedToast();
  };

  const triggerSavedToast = () => {
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 2000);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpdatePhoto) {
      if (file.size > 2 * 1024 * 1024) {
        alert('حجم الصورة كبير، يرجى اختيار صورة أقل من 2 ميغابايت');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          onUpdatePhoto(result);
          triggerSavedToast();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetGoogleAvatar = () => {
    if (onUpdatePhoto) {
      const avatar = getGoogleAvatar(user.name, user.email);
      onUpdatePhoto(avatar);
      triggerSavedToast();
    }
  };

  return (
    <div id="settings-view-container" className="max-w-md mx-auto p-4 pb-24 space-y-4 text-right">
      {savedNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5 animate-in fade-in">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>تم الحفظ</span>
        </div>
      )}

      {/* Hidden File Input for Avatar */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoUpload}
        className="hidden"
      />

      {/* Google Account Profile Card */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          {/* Avatar and Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0 group">
              <img
                src={user.photoURL}
                alt={user.name}
                className="w-13 h-13 rounded-full object-cover border-2 border-slate-100 dark:border-slate-700 shadow-xs"
              />
              {/* Google G Logo Badge */}
              <div 
                className="absolute -bottom-1 -right-1 w-5 h-5 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-xs border border-slate-200 dark:border-slate-700"
                title="حساب جوجل"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  {user.name}
                </h3>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate font-mono" dir="ltr">
                {user.email}
              </p>
            </div>
          </div>

          {/* Logout Button (never overlaps) */}
          <button
            id="logout-btn"
            type="button"
            onClick={onLogout}
            className="shrink-0 py-1.5 px-3 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center gap-1 text-xs font-bold"
            title="تسجيل الخروج"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>خروج</span>
          </button>
        </div>

        {/* Quick photo change actions */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 text-[11px] font-medium flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>تغيير الصورة</span>
          </button>
          <button
            type="button"
            onClick={handleResetGoogleAvatar}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-[11px] font-medium flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="إعادة ضبط لصورة جوجل الافتراضية"
          >
            <RotateCcw className="w-3 h-3" />
            <span>صورة جوجل الأصلية</span>
          </button>
        </div>
      </div>

      {/* App Logo & Branding */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="شعار التطبيق"
            referrerPolicy="no-referrer"
            className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs shrink-0"
          />
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-white block">
              شعار وهوية التطبيق
            </span>
            <span className="text-[11px] text-slate-400">
              تم تصميمه بدقة عالية متصل بأيقونة المتصفح (Favicon)
            </span>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300">
          نشط
        </span>
      </div>

      {/* Store Name */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-slate-800 dark:text-white font-bold text-xs">
          <Store className="w-4 h-4 text-slate-500" />
          <span>اسم المتجر</span>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="store-name-input"
            type="text"
            value={storeNameInput}
            onChange={(e) => setStoreNameInput(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
          <button
            type="button"
            onClick={handleSaveStoreName}
            className="py-2 px-3.5 rounded-xl text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all cursor-pointer"
            style={{ backgroundColor: accentColor || '#0ea5e9' }}
          >
            تحديث
          </button>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2.5">
              {settings.theme === 'dark' ? (
                <Moon className="w-4 h-4 text-indigo-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-white block">
                  مظهر التطبيق
                </span>
                <span className="text-[11px] text-slate-400">
                  {settings.theme === 'dark' ? 'الوضع الليلي (الداكن) مفعّل' : 'الوضع النهاري (الفاتح) مفعّل'}
                </span>
              </div>
            </div>
          </div>

          {/* Segmented Day / Night Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <button
              id="theme-light-btn"
              type="button"
              onClick={() => {
                onUpdateSettings({ theme: 'light' });
                triggerSavedToast();
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                settings.theme !== 'dark'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Sun className={`w-4 h-4 ${settings.theme !== 'dark' ? 'text-amber-500' : ''}`} />
              <span>نهاري (فاتح)</span>
            </button>

            <button
              id="theme-dark-btn"
              type="button"
              onClick={() => {
                onUpdateSettings({ theme: 'dark' });
                triggerSavedToast();
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                settings.theme === 'dark'
                  ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>ليلي (داكن)</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            {settings.notificationsEnabled ? (
              <Bell className="w-4 h-4 text-emerald-500" />
            ) : (
              <BellOff className="w-4 h-4 text-slate-400" />
            )}
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-white block">
                إشعارات انخفاض المخزون
              </span>
              <span className="text-[11px] text-slate-400">
                تنبيه للمنتجات الأقل من 5 قطع
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleToggleNotifications}
            className={`w-10 h-5 rounded-full transition-colors relative p-0.5 cursor-pointer ${
              settings.notificationsEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                settings.notificationsEnabled ? '-translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
