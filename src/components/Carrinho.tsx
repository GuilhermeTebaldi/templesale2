import React from "react";
import { motion } from "motion/react";
import { X, ShoppingBag, ExternalLink, Trash2, Minus, Plus, RotateCcw } from "lucide-react";
import { type Product } from "./ProductCard";
import { useI18n } from "../i18n/provider";
import { formatEuroFromUnknown, parsePriceToNumber } from "../lib/currency";
import { getCategoryLabel } from "../i18n/categories";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CarrinhoProps {
  items: CartItem[];
  onClose: () => void;
  onOpenProduct: (product: Product) => void;
  onRemove: (productId: number) => void;
  onClear: () => void;
  onUpdateQuantity: (productId: number, quantity: number) => void;
}

function getStockQuantity(product: Product): number {
  const raw = Number(product.quantity);
  if (!Number.isFinite(raw)) {
    return 1;
  }
  const normalized = Math.floor(raw);
  return normalized >= 0 ? normalized : 0;
}

export default function Carrinho({
  items,
  onClose,
  onOpenProduct,
  onRemove,
  onClear,
  onUpdateQuantity,
}: CarrinhoProps) {
  const { t, locale } = useI18n();

  const totalItems = React.useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );
  const totalValue = React.useMemo(
    () =>
      items.reduce((sum, item) => {
        const unitPrice = parsePriceToNumber(item.product.price);
        if (unitPrice === null) {
          return sum;
        }
        return sum + unitPrice * item.quantity;
      }, 0),
    [items],
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: "100%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-150 bg-[#fdfcfb] flex flex-col"
    >
      <div className="p-8 flex justify-between items-center border-b border-stone-100">
        <div className="flex items-center gap-4">
          <ShoppingBag className="w-6 h-6 text-stone-800" />
          <div>
            <h2 className="text-2xl font-serif tracking-widest uppercase">{t("Carrinho")}</h2>
            <p className="text-[10px] uppercase tracking-[0.18em] text-stone-400 mt-1">
              {t("{count} itens", { count: String(totalItems) })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClear}
            disabled={items.length === 0}
            className="inline-flex items-center gap-2 px-3 py-2 text-[10px] uppercase tracking-[0.15em] border border-stone-200 text-stone-500 hover:text-stone-800 hover:border-stone-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-3 h-3" />
            {t("Limpar carrinho")}
          </button>
          <button onClick={onClose} className="p-2 hover:bg-stone-50 rounded-full transition-colors">
            <X className="w-6 h-6 text-stone-600" />
          </button>
        </div>
      </div>

      <div className="grow overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          {items.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag className="w-12 h-12 text-stone-200 mx-auto mb-4" />
              <p className="text-stone-400 uppercase tracking-widest text-xs">
                {t("Seu carrinho está vazio.")}
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {items.map((item) => {
                const stockQuantity = getStockQuantity(item.product);
                const canIncrement = item.quantity < stockQuantity;

                return (
                  <motion.div
                    key={item.product.id}
                    layout
                    className="flex gap-6 p-4 bg-white border border-stone-100 rounded-sm hover:shadow-md transition-shadow group"
                  >
                    <div className="w-24 h-32 bg-stone-100 overflow-hidden shrink-0">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="grow flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start gap-4">
                          <h3 className="font-serif italic text-lg text-stone-800">
                            {item.product.name}
                          </h3>
                          <span className="text-sm font-mono text-stone-900">
                            {formatEuroFromUnknown(item.product.price, locale)}
                          </span>
                        </div>
                        <p className="text-[10px] uppercase tracking-widest text-stone-400 mt-1">
                          {getCategoryLabel(item.product.category, locale)}
                        </p>
                        <p className="text-[10px] uppercase tracking-[0.15em] text-stone-400 mt-3">
                          {t("Disponível: {count}", { count: String(stockQuantity) })}
                        </p>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-4">
                        <div className="flex items-center border border-stone-200 rounded-sm">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))
                            }
                            className="p-2 hover:bg-stone-50 transition-colors"
                          >
                            <Minus className="w-3 h-3 text-stone-600" />
                          </button>
                          <span className="min-w-10 text-center font-mono text-sm text-stone-700">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                            disabled={!canIncrement}
                            className="p-2 hover:bg-stone-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-3 h-3 text-stone-600" />
                          </button>
                        </div>

                        <button
                          onClick={() => onOpenProduct(item.product)}
                          className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-stone-400 hover:text-stone-800 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {t("Ver produto")}
                        </button>

                        <button
                          onClick={() => onRemove(item.product.id)}
                          className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-stone-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          {t("Remover")}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-stone-100 bg-white px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400">
            {t("Total estimado")}
          </span>
          <strong className="font-mono text-lg text-stone-900">
            {formatEuroFromUnknown(totalValue, locale)}
          </strong>
        </div>
      </div>
    </motion.div>
  );
}
