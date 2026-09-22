import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Check, Loader2, X, Sparkles, Cloud, ArrowUp } from 'lucide-react';
import { PendingProduct, Product } from '../types';
import { uploadImageToImageKit, fileToBase64 } from '../lib/imagekit';

interface ImageKitProductUploaderProps {
  pendingProduct: PendingProduct;
  onProductCreated: (productData: Omit<Product, 'id' | 'ownerId' | 'createdAt'>) => Promise<Product | undefined | void>;
  onCancel?: () => void;
  onSwitchToProductsTab?: () => void;
}

export const ImageKitProductUploader: React.FC<ImageKitProductUploaderProps> = ({
  pendingProduct,
  onProductCreated,
  onCancel,
  onSwitchToProductsTab,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedProduct, setCompletedProduct] = useState<Product | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('يرجى اختيار ملف صورة صالح (JPG, PNG, WEBP)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('حجم الصورة كبير جداً، الحد الأقصى 10 ميغابايت');
      return;
    }

    try {
      setErrorMsg(null);
      setSelectedFile(file);
      const b64 = await fileToBase64(file);
      setPreviewUrl(b64);
    } catch {
      setErrorMsg('فشل قراءة ملف الصورة، يرجى اختيار صورة أخرى');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleUploadAndSave = async () => {
    if (!selectedFile) {
      setErrorMsg('يرجى اختيار صورة للمنتج أولاً');
      return;
    }

    try {
      setIsUploading(true);
      setErrorMsg(null);
      setUploadStatus('جاري الرفع السحابي عبر ImageKit...');

      // 1. Upload to ImageKit
      const uploadResult = await uploadImageToImageKit(
        selectedFile,
        `product_${Date.now()}_${selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      );

      setUploadStatus('تم الرفع بنجاح! جاري حفظ المنتج...');

      // 2. Add product to store with ImageKit URL
      const created = await onProductCreated({
        name: pendingProduct.name,
        price: pendingProduct.price,
        description: pendingProduct.description,
        quantity: pendingProduct.quantity,
        category: pendingProduct.category,
        imageUrl: uploadResult.url,
      });

      if (created && 'name' in created) {
        setCompletedProduct(created as Product);
      } else {
        setCompletedProduct({
          id: `prod_${Date.now()}`,
          ownerId: 'current_user',
          name: pendingProduct.name,
          price: pendingProduct.price,
          description: pendingProduct.description,
          quantity: pendingProduct.quantity,
          category: pendingProduct.category,
          imageUrl: uploadResult.url,
          createdAt: Date.now(),
        });
      }
    } catch (err: any) {
      console.error('Error in upload and save:', err);
      setErrorMsg('حدث خطأ أثناء الرفع إلى ImageKit، يرجى المحاولة مرة أخرى');
    } finally {
      setIsUploading(false);
    }
  };

  // If successfully completed, show success card
  if (completedProduct) {
    return (
      <div className="mt-3 p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-slate-800 dark:text-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
            <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center">
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </span>
            <span>تم حفظ المنتج بنجاح مع صورة ImageKit!</span>
          </div>
          <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-extrabold flex items-center gap-1">
            <span>{completedProduct.price.toLocaleString('ar-EG')}</span>
            <span className="text-[10px]">ج.م</span>
          </span>
        </div>

        <div className="flex items-start gap-3">
          <img
            src={completedProduct.imageUrl}
            alt={completedProduct.name}
            className="w-16 h-16 rounded-xl object-cover border border-emerald-200 dark:border-emerald-800/40 shrink-0"
            referrerPolicy="no-referrer"
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate">
              {completedProduct.name}
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 mt-0.5">
              {completedProduct.description}
            </p>
            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 font-medium">
                <Cloud className="w-3 h-3" />
                مرفوع سحابياً عبر ImageKit
              </span>
              <span>•</span>
              <span>الكمية: {completedProduct.quantity}</span>
            </div>
          </div>
        </div>

        {onSwitchToProductsTab && (
          <button
            type="button"
            onClick={onSwitchToProductsTab}
            className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span>عرض المنتج في قائمة المنتجات</span>
            <ArrowUp className="w-3.5 h-3.5 rotate-45" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mt-3 p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 text-slate-800 dark:text-slate-200 space-y-3">
      {/* Product Summary Header */}
      <div className="flex items-center justify-between border-b border-amber-200/60 dark:border-amber-800/40 pb-2">
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-700 dark:text-amber-400">
            <Sparkles className="w-3 h-3" />
          </span>
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            {pendingProduct.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold px-2.5 py-1 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 flex items-center gap-1">
            <span>{pendingProduct.price.toLocaleString('ar-EG')}</span>
            <span className="text-[10px]">ج.م</span>
          </span>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              title="إلغاء إضافة المنتج"
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Mandatory Image Upload Callout */}
      <div className="flex items-center justify-between text-[11px] text-amber-800 dark:text-amber-300 font-medium">
        <span>📸 خطوة مطلوبة: يرجى رفع صورة المنتج لإتمام إضافته</span>
        <span className="inline-flex items-center gap-1 text-[10px] text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-950/50 px-2 py-0.5 rounded-full font-semibold">
          <Cloud className="w-2.5 h-2.5" />
          ImageKit CDN
        </span>
      </div>

      {/* Dropzone & Preview */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {previewUrl ? (
        <div className="relative group rounded-xl overflow-hidden border border-amber-200 dark:border-amber-800/80 bg-white dark:bg-slate-900 p-2 flex items-center gap-3">
          <img
            src={previewUrl}
            alt="معاينة الصورة"
            className="w-16 h-16 rounded-lg object-cover border border-slate-200 dark:border-slate-800 shrink-0"
          />
          <div className="flex-1 min-w-0 text-right">
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {selectedFile?.name}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              الحجم: {((selectedFile?.size || 0) / (1024 * 1024)).toFixed(2)} ميغابايت
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline mt-1 font-semibold"
            >
              تغيير الصورة
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedFile(null);
              setPreviewUrl(null);
            }}
            className="p-1 rounded-full text-slate-400 hover:text-rose-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/30'
              : 'border-amber-300 dark:border-amber-700/80 bg-white/60 dark:bg-slate-900/60 hover:bg-amber-100/40 dark:hover:bg-amber-950/40'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-400 mx-auto flex items-center justify-center mb-2">
            <Upload className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
            انقر هنا لاختيار صورة المنتج من جهازك
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            أو اسحب الصورة وأفلتها هنا (PNG, JPG, WEBP حتى 10MB)
          </p>
        </div>
      )}

      {errorMsg && (
        <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold text-right">
          {errorMsg}
        </p>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={handleUploadAndSave}
          disabled={!selectedFile || isUploading}
          className={`flex-1 h-11 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98 ${
            !selectedFile || isUploading
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
          }`}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{uploadStatus || 'جاري الرفع...'}</span>
            </>
          ) : (
            <>
              <Cloud className="w-4 h-4" />
              <span>رفع عبر ImageKit وحفظ المنتج</span>
            </>
          )}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isUploading}
            className="h-11 px-3.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            تخطي
          </button>
        )}
      </div>
    </div>
  );
};
