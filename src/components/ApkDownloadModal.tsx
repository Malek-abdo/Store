import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Smartphone, 
  Copy, 
  Check, 
  Share2, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Wifi, 
  ExternalLink,
  Sparkles,
  Chrome
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface ApkDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeName: string;
}

export const ApkDownloadModal: React.FC<ApkDownloadModalProps> = ({
  isOpen,
  onClose,
  storeName,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: storeName,
          text: `تطبيق ${storeName} لإدارة المنتجات والمخزون`,
          url: currentUrl,
        });
      } catch {
        // user cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDirectInstall = async () => {
    if (isInstallable) {
      const res = await install();
      if (res) {
        onClose();
      }
    }
  };

  return (
    <div 
      id="google-install-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 text-right"
      onClick={onClose}
    >
      <div 
        id="google-install-modal-card"
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src="/logo.png"
                alt="أيقونة التطبيق"
                className="w-12 h-12 rounded-2xl object-cover shadow-sm border border-slate-200 dark:border-slate-700"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] text-white">
                ✓
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  تنزيل التطبيق من Google
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  Google WebAPK
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                تثبيت رسمي معتمد يعمل بدون متجر وبشاشة كاملة
              </p>
            </div>
          </div>

          <button
            id="close-google-install-modal-btn"
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* App Icons Showcase (أيقونة التطبيق والأيقونة الخارجية) */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>أيقونة التطبيق والشاشة الرئيسية</span>
              </span>
              <span className="text-[10px] text-slate-400">تصميم فاخر وعصري</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Internal App Icon */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col items-center text-center shadow-2xs">
                <div className="relative mb-2">
                  <img
                    src="/logo.png"
                    alt="أيقونة التطبيق الداخلية"
                    className="w-14 h-14 rounded-2xl object-cover shadow-sm border border-slate-200 dark:border-slate-700"
                  />
                  <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/5 dark:ring-white/10" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                  أيقونة التطبيق
                </span>
                <span className="text-[10px] text-slate-400">
                  واجهة المتجر الداخلية
                </span>
              </div>

              {/* External Launcher Icon */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col items-center text-center shadow-2xs">
                <div className="relative mb-2">
                  <div className="w-14 h-14 rounded-2xl p-1 bg-gradient-to-br from-slate-800 to-slate-950 shadow-md flex items-center justify-center">
                    <img
                      src="/icon.png"
                      alt="الأيقونة الخارجية على شاشة الهاتف"
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                  </div>
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                  الأيقونة الخارجية
                </span>
                <span className="text-[10px] text-slate-400">
                  على شاشة الهاتف الرئيسية
                </span>
              </div>
            </div>
          </div>

          {/* Quick Features */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2 text-slate-800 dark:text-slate-200 font-medium">
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
              <span>تطبيق مستقل بدون شريط متصفح</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2 text-slate-800 dark:text-slate-200 font-medium">
              <Wifi className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>يدعم العمل دون إنترنت</span>
            </div>
          </div>

          {/* Direct Install Button (When browser supports 1-click prompt) */}
          {isInstallable && (
            <button
              id="direct-google-install-action-btn"
              type="button"
              onClick={handleDirectInstall}
              className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition-all transform active:scale-98 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>تحميل وتثبيت فوري الآن من Google</span>
            </button>
          )}

          {isInstalled && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>التطبيق مثبت بالفعل على جهازك ويعمل بصورة مستقلة!</span>
            </div>
          )}

          {/* Method: Steps to download & install from Google Chrome on Android */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-3">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
              <Chrome className="w-4 h-4 text-sky-500" />
              <span>طريقة التنزيل والتثبيت من Google Chrome:</span>
            </div>

            <ol className="list-decimal list-inside space-y-2.5 text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed pr-1 font-medium">
              <li>
                افتح رابط المتجر في متصفح <strong>Google Chrome</strong> على هاتفك الأندرويد.
              </li>
              <li>
                اضغط على زر القائمة (<strong>الثلاث نقاط ⋮</strong>) في أعلى المتصفح.
              </li>
              <li>
                اختر من القائمة <strong className="text-sky-600 dark:text-sky-400">"تثبيت التطبيق"</strong> (Install App) أو <strong>"إضافة إلى الشاشة الرئيسية"</strong>.
              </li>
              <li>
                اضغط <strong>"تثبيت"</strong> وسيقوم نظام Google Android بإنشاء التطبيق فوراً بشاشته وأيقونته المستقلة.
              </li>
            </ol>
          </div>

          {/* iOS Safari Fallback Note */}
          {isIOS && (
            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-[11px] text-indigo-900 dark:text-indigo-200 space-y-1">
              <strong className="block font-bold">لمستخدمي آيفون (Safari):</strong>
              <p>اضغط على زر المشاركة (Share ⬆️) أسفل الشاشة ثم اختر "إضافة إلى الشاشة الرئيسية" (Add to Home Screen).</p>
            </div>
          )}

          {/* Action Buttons: Open in New Window & Share */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              id="open-in-chrome-btn"
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>فتح في Google Chrome</span>
            </a>

            <button
              id="share-app-link-btn"
              type="button"
              onClick={handleShare}
              className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-500" />
              <span>مشاركة الرابط لهاتفك</span>
            </button>
          </div>

          {/* Copy URL Bar */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-[11px] text-slate-400 font-mono truncate max-w-[230px]" dir="ltr">
              {currentUrl}
            </span>
            <button
              id="copy-store-url-btn"
              type="button"
              onClick={handleCopyLink}
              className="py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'تم النسخ!' : 'نسخ الرابط'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>تطبيق سريع، خفيف، وآمن 100%</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
