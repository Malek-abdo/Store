import React, { useState } from 'react';
import { Store, Shield } from 'lucide-react';

interface OnboardingViewProps {
  onGoogleSignIn: () => Promise<void>;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({ onGoogleSignIn }) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await onGoogleSignIn();
    } catch {
      setLoading(false);
    }
  };

  return (
    <div
      id="onboarding-screen"
      className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 max-w-sm mx-auto"
    >
      {/* Brand Header */}
      <div className="pt-16 text-center space-y-4">
        <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl mx-auto overflow-hidden p-1.5 flex items-center justify-center">
          <img
            src="/logo.png"
            alt="شعار التطبيق"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover rounded-2xl"
          />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          إدارة المتجر الذكي
        </h1>
        <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
          إدارة منتجاتك ومخزونك بسهولة مع مساعد ذكاء اصطناعي مدمج.
        </p>
      </div>

      {/* Login CTA */}
      <div className="pb-12 space-y-4">
        <button
          id="google-signin-btn"
          type="button"
          disabled={loading}
          onClick={handleClick}
          className="w-full py-3.5 px-6 rounded-xl bg-white hover:bg-slate-100 active:scale-98 text-slate-900 font-bold text-sm shadow-md flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50"
        >
          {/* Official Google SVG */}
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{loading ? 'جاري الدخول...' : 'تسجيل الدخول عبر جوجل'}</span>
        </button>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <Shield className="w-3.5 h-3.5" />
          <span>دخول آمن ومباشر</span>
        </div>
      </div>
    </div>
  );
};
