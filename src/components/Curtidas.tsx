import React from "react";
import { motion } from "motion/react";
import { X, Heart, ExternalLink, Trash2 } from "lucide-react";
import { type Product } from "./ProductCard";
import { useI18n } from "../i18n/provider";
import { formatCompactPriceFromUnknown } from "../lib/currency";
import { getCategoryLabel } from "../i18n/categories";

interface CurtidasProps {
  products: Product[];
  onClose: () => void;
  onOpenProduct: (product: Product) => void;
  onRemove: (id: number) => Promise<void>;
}

export default function Curtidas({
  products,
  onClose,
  onOpenProduct,
  onRemove,
}: CurtidasProps) {
  const { t, locale } = useI18n();
  const [removingProductId, setRemovingProductId] = React.useState<number | null>(null);

  const handleRemove = async (id: number) => {
    if (removingProductId === id) {
      return;
    }
    setRemovingProductId(id);
    try {
      await onRemove(id);
    } finally {
      setRemovingProductId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: "100%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-150 bg-neutral-950 text-neutral-100 flex flex-col"
    >
      <div className="p-5 sm:p-8 flex justify-between items-center border-b border-neutral-800 bg-neutral-900/95 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Heart className="w-6 h-6 text-red-300" />
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{t("Preferiti")}</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-neutral-800 rounded-full transition-colors">
          <X className="w-6 h-6 text-neutral-300" />
        </button>
      </div>

      <div className="grow overflow-y-auto overscroll-contain p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          {products.length === 0 ? (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-10 text-center shadow-2xl">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-neutral-800 bg-neutral-950">
                <Heart className="w-7 h-7 text-neutral-500" />
              </div>
              <p className="text-neutral-400 uppercase tracking-[0.18em] text-xs">
                {t("Non hai ancora salvato prodotti o attività.")}
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {products.map((product) => {
                const isRemoving = removingProductId === product.id;

                return (
                  <motion.div
                    key={product.id}
                    layout
                    className="flex gap-4 sm:gap-6 p-3 sm:p-4 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl transition-colors hover:border-neutral-700 group"
                  >
                    <div className="w-24 h-32 bg-neutral-950 overflow-hidden shrink-0 rounded-xl border border-neutral-800">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    </div>

                    <div className="grow flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-base sm:text-lg text-neutral-100">{product.name}</h3>
                          <span className="text-sm font-mono text-neutral-200">
                            {formatCompactPriceFromUnknown(product.price, locale, {
                              priceNegotiable: product.priceNegotiable,
                            })}
                          </span>
                        </div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-400 mt-1">
                          {getCategoryLabel(product.category, locale)}
                          {product.establishmentName ? ` · ${product.establishmentName}` : ""}
                        </p>
                      </div>

                      <div className="flex gap-4 mt-4">
                        <button
                          onClick={() => onOpenProduct(product)}
                          className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] font-bold text-neutral-400 hover:text-amber-300 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {t("Apri prodotto")}
                        </button>
                        <button
                          disabled={isRemoving}
                          onClick={() => {
                            void handleRemove(product.id);
                          }}
                          className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] font-bold text-neutral-400 hover:text-red-300 disabled:text-neutral-600 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          {isRemoving ? t("Removendo...") : t("Rimuovi")}
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
    </motion.div>
  );
}
