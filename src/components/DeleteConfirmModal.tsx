import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Product } from '../types';

interface DeleteConfirmModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  product,
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}) => {
  if (!isOpen || !product) return null;

  return (
    <div
      id="delete-confirm-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div
        id="delete-confirm-modal-card"
        className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 text-center animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 mx-auto flex items-center justify-center mb-4">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
          تأكيد حذف المنتج
        </h3>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          هل أنت متأكد من رغبتك في حذف <span className="font-bold text-slate-800 dark:text-slate-200">"{product.name}"</span>؟ لا يمكن التراجع عن هذا الإجراء لاحقاً.
        </p>

        <div className="flex items-center gap-3">
          <button
            id="cancel-delete-product-btn"
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            إلغاء
          </button>
          <button
            id="confirm-delete-product-btn"
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
          >
            {isDeleting ? 'جاري الحذف...' : 'نعم، احذف'}
          </button>
        </div>
      </div>
    </div>
  );
};
