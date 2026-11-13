import { Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { useState } from 'react';
import { formatCurrency } from '../lib/api';
import { resolveProductImage } from '../lib/images';
import type { Product } from '../types';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export function ProductModal({ product, onClose, onAddToCart }: ProductModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [imgError, setImgError] = useState(false);

  if (!product) return null;

  const maxQty = Math.max(1, product.stock);
  const outOfStock = product.stock <= 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#3B202C]/45 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdp-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-[#FFFBFD] dark:bg-[#1E1319] border border-[#F5D0DF] dark:border-[#3A232E] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 dark:bg-[#1E1319]/95 border border-[#F5D0DF] dark:border-[#3A232E] text-[#3B202C] dark:text-white hover:bg-[#FFEAF3] dark:hover:bg-[#2E1D25] cursor-pointer"
          aria-label="Fechar detalhes do doce"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 items-stretch">
          {/* Media column */}
          <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[380px] bg-[#FFF0F6] dark:bg-[#2A1B23]">
            {!imgError ? (
              <img
                src={resolveProductImage(product.imageUrl)}
                alt={product.name}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center p-6 text-center text-sm text-[#8C6173] dark:text-[#CBA8B8]">
                {product.name}
              </div>
            )}
          </div>

          {/* Contiguous Purchase Module */}
          <div className="flex flex-col justify-between p-6 sm:p-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-medium tracking-wide uppercase text-[#8C6173] dark:text-[#CBA8B8]">
                <span>{product.category}</span>
                <span aria-hidden="true">·</span>
                <span className={outOfStock ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}>
                  {outOfStock ? 'Esgotado' : `${product.stock} disponíveis`}
                </span>
              </div>

              <h2 id="pdp-title" className="font-display text-2xl font-semibold text-[#3B202C] dark:text-[#FCEEF4] pr-8">
                {product.name}
              </h2>

              <p className="font-mono-num text-2xl font-semibold text-[#C92C65] dark:text-[#FF8FB8]">
                {formatCurrency(product.price)}
              </p>

              <p className="text-sm leading-relaxed text-[#6E4455] dark:text-[#E5C5D2]">
                {product.description}
              </p>

              <div className="pt-4 border-t border-[#F5D0DF] dark:border-[#3A232E]">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8C6173] dark:text-[#CBA8B8] mb-1.5">
                  Informação Nutricional
                </h3>
                <p className="text-xs leading-relaxed text-[#6E4455] dark:text-[#E5C5D2]">
                  {product.nutritionalInfo}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-[#F5D0DF] dark:border-[#3A232E] flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center rounded-full border border-[#F3C4D7] dark:border-[#3A232E] bg-white dark:bg-[#170F14] px-1">
                <button
                  type="button"
                  disabled={quantity <= 1 || outOfStock}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="inline-flex h-10 w-9 items-center justify-center text-[#6E4455] dark:text-[#E5C5D2] disabled:opacity-40 cursor-pointer"
                  aria-label="Diminuir quantidade"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="font-mono-num w-9 text-center text-sm font-medium">
                  {quantity}
                </span>
                <button
                  type="button"
                  disabled={quantity >= maxQty || outOfStock}
                  onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                  className="inline-flex h-10 w-9 items-center justify-center text-[#6E4455] dark:text-[#E5C5D2] disabled:opacity-40 cursor-pointer"
                  aria-label="Aumentar quantidade"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                disabled={outOfStock}
                onClick={() => {
                  onAddToCart(product, quantity);
                  onClose();
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-[#E03E78] px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#C92C65] hover:-translate-y-0.5 disabled:bg-neutral-400 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
              >
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                <span>{outOfStock ? 'Indisponível' : 'Adicionar ao Carrinho'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
