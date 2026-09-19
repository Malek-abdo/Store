import React, { useState } from 'react';
import { Edit3, Trash2, AlertTriangle, CheckCircle2, XCircle, Image as ImageIcon } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  primaryColor: string;
  accentColor: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onEdit,
  onDelete,
  primaryColor,
}) => {
  const [imageError, setImageError] = useState(false);

  const isOutOfStock = product.quantity <= 0;
  const isLowStock = product.quantity > 0 && product.quantity < 5;

  return (
    <div
      id={`product-card-${product.id}`}
      className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col group relative"
    >
      {/* Product Image Container */}
      <div className="relative aspect-4/3 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        {!imageError && product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 gap-1.5 p-4 text-center">
            <ImageIcon className="w-8 h-8 opacity-60" />
            <span className="text-xs">لا تتوفر صورة</span>
          </div>
        )}

        {/* Stock Status Badge */}
        <div className="absolute top-2.5 right-2.5">
          {isOutOfStock ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/90 text-white backdrop-blur-xs shadow-xs">
              <XCircle className="w-3 h-3" />
              نفد المخزون
            </span>
          ) : isLowStock ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/95 text-white backdrop-blur-xs shadow-xs">
              <AlertTriangle className="w-3 h-3" />
              متبقي {product.quantity} فقط
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-600/90 text-white backdrop-blur-xs shadow-xs">
              <CheckCircle2 className="w-3 h-3" />
              {product.quantity} متوفر
            </span>
          )}
        </div>

        {/* Category tag if available */}
        {product.category && (
          <div className="absolute bottom-2.5 right-2.5">
            <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-black/60 text-white backdrop-blur-xs">
              {product.category}
            </span>
          </div>
        )}
      </div>

      {/* Product Content Details */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-2.5">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-1 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>

        {/* Price & Action Row */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">السعر</span>
            <span className="text-base font-bold text-slate-900 dark:text-white">
              {product.price.toLocaleString('ar-EG')}{' '}
              <span className="text-xs font-normal text-slate-500">ر.س</span>
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Edit Button */}
            <button
              id={`edit-product-btn-${product.id}`}
              type="button"
              onClick={() => onEdit(product)}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="تعديل"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            {/* Delete Button */}
            <button
              id={`delete-product-btn-${product.id}`}
              type="button"
              onClick={() => onDelete(product)}
              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="حذف"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
