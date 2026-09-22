import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Loader2, Cloud, Check } from 'lucide-react';
import { Product } from '../types';
import { uploadImageToImageKit } from '../lib/imagekit';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Omit<Product, 'id' | 'ownerId' | 'createdAt'>, editingId?: string) => Promise<Product | void> | Promise<void> | void;
  productToEdit?: Product | null;
  primaryColor: string;
  accentColor: string;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  productToEdit,
  accentColor,
}) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadedViaImageKit, setIsUploadedViaImageKit] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setPrice(productToEdit.price.toString());
      setQuantity(productToEdit.quantity.toString());
      setCategory(productToEdit.category || '');
      setDescription(productToEdit.description || '');
      setImageUrl(productToEdit.imageUrl || '');
      setIsUploadedViaImageKit(productToEdit.imageUrl?.includes('imagekit.io') || false);
    } else {
      setName('');
      setPrice('');
      setQuantity('1');
      setCategory('');
      setDescription('');
      setImageUrl('');
      setIsUploadedViaImageKit(false);
    }
    setErrorMsg('');
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg('حجم الصورة كبير، يرجى اختيار صورة أقل من 10 ميغابايت');
        return;
      }

      try {
        setIsUploadingImage(true);
        setErrorMsg('');
        const res = await uploadImageToImageKit(
          file,
          `prod_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
        );
        if (res && res.url) {
          setImageUrl(res.url);
          setIsUploadedViaImageKit(true);
        }
      } catch (err) {
        console.error('ImageKit upload error in ProductModal:', err);
        setErrorMsg('تعذر رفع الصورة عبر ImageKit، يرجى المحاولة ثانية');
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const numPrice = parseFloat(price);
    const numQuantity = parseInt(quantity, 10);

    if (!cleanName) {
      setErrorMsg('يرجى إدخال اسم المنتج');
      return;
    }
    if (isNaN(numPrice) || numPrice < 0) {
      setErrorMsg('يرجى إدخال سعر صحيح');
      return;
    }
    if (isNaN(numQuantity) || numQuantity < 0) {
      setErrorMsg('يرجى إدخال كمية صحيحة');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await onSave(
        {
          name: cleanName,
          price: numPrice,
          quantity: numQuantity,
          imageUrl: imageUrl.trim(),
          category: category.trim(),
          description: description.trim(),
        },
        productToEdit?.id
      );
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('حدث خطأ أثناء الحفظ، يرجى المحاولة ثانية');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="product-modal-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
    >
      <div
        id="product-modal-container"
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-[28px] sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in duration-150 border-t border-slate-200/80 dark:border-slate-800"
      >
        {/* Mobile Drag Indicator Handle */}
        <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {productToEdit ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'}
          </h2>
          <button
            id="close-product-modal-btn"
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 text-right">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Product Image */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                صورة المنتج
              </label>
              <div className="flex items-center gap-1 text-[10px] text-sky-600 dark:text-sky-400 font-semibold bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded-full">
                <Cloud className="w-2.5 h-2.5" />
                <span>ImageKit CDN</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center relative">
                {imageUrl ? (
                  <img src={imageUrl} alt="معاينة" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-slate-400" />
                )}
                {isUploadingImage && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 transition-colors"
                >
                  {isUploadingImage ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
                      <span>جاري الرفع إلى ImageKit...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      <span>{imageUrl ? 'تغيير الصورة عبر ImageKit' : 'رفع صورة عبر ImageKit'}</span>
                    </>
                  )}
                </button>
                {imageUrl && !isUploadingImage && (
                  <div className="flex items-center justify-between px-1">
                    {isUploadedViaImageKit ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        <Check className="w-3 h-3 text-emerald-500" />
                        مرفوعة على ImageKit
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">رابط صورة</span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setImageUrl('');
                        setIsUploadedViaImageKit(false);
                      }}
                      className="text-[11px] text-rose-500 hover:underline cursor-pointer"
                    >
                      إزالة الصورة
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="product-name-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              اسم المنتج <span className="text-rose-500">*</span>
            </label>
            <input
              id="product-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="اكتب اسم المنتج..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          {/* Price & Quantity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="product-price-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                السعر (ج.م) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="product-price-input"
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-600 dark:text-amber-400 pointer-events-none">
                  ج.م
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="product-quantity-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                الكمية <span className="text-rose-500">*</span>
              </label>
              <input
                id="product-quantity-input"
                type="number"
                min="0"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="product-category-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              التصنيف (اختياري)
            </label>
            <input
              id="product-category-input"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="مثال: أزياء، إلكترونيات..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="product-desc-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              وصف مختصر (اختياري)
            </label>
            <textarea
              id="product-desc-input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف مختصر لمساعدة المساعد الذكي..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
            />
          </div>

          {/* Action */}
          <div className="pt-2">
            <button
              id="save-product-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-xl text-white font-bold text-sm shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: accentColor || '#0ea5e9' }}
            >
              {isSubmitting ? 'جاري الحفظ...' : productToEdit ? 'حفظ التعديلات' : 'إضافة المنتج إلى المتجر'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
