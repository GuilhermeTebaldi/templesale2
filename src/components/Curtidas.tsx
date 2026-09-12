import React from "react";
import { motion } from "motion/react";
import { X, Heart, ExternalLink, Trash2, Image as ImageIcon } from "lucide-react";
import { ProgressiveProductImage, type Product } from "./ProductCard";
import { type PublicationDto } from "../lib/api";
import { useI18n } from "../i18n/provider";
import { formatCompactPriceFromUnknown } from "../lib/currency";
import { getCategoryLabel } from "../i18n/categories";

interface CurtidasProps {
  products: Product[];
  publications?: PublicationDto[];
  onClose: () => void;
  onOpenProduct: (product: Product) => void;
  onOpenPublication?: (publication: PublicationDto) => void;
  onRemove: (id: number) => Promise<void>;
  onRemovePublication?: (id: number) => Promise<void>;
}

export default function Curtidas({
  products,
  publications = [],
  onClose,
  onOpenProduct,
  onOpenPublication,
  onRemove,
  onRemovePublication,
}: CurtidasProps) {
  const { t, locale } = useI18n();
  const [removingProductId, setRemovingProductId] = React.useState<number | null>(null);
  const [removingPublicationId, setRemovingPublicationId] = React.useState<number | null>(null);
  const [isDesktopDrawer, setIsDesktopDrawer] = React.useState(false);
  const hasItems = products.length > 0 || publications.length > 0;

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(min-width: 640px)");
    const updateDrawerMode = () => setIsDesktopDrawer(mediaQuery.matches);

    updateDrawerMode();
    mediaQuery.addEventListener("change", updateDrawerMode);
    return () => mediaQuery.removeEventListener("change", updateDrawerMode);
  }, []);

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

  const handleRemovePublication = async (id: number) => {
    if (removingPublicationId === id || !onRemovePublication) {
      return;
    }
    setRemovingPublicationId(id);
    try {
      await onRemovePublication(id);
    } finally {
      setRemovingPublicationId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: isDesktopDrawer ? -420 : "100%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isDesktopDrawer ? -420 : "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-150 flex flex-col bg-neutral-950 text-neutral-100 shadow-2xl shadow-black/50 sm:inset-y-16 sm:left-[72px] sm:right-auto sm:w-[390px] sm:border-r sm:border-neutral-800"
    >
      <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900/95 p-5 backdrop-blur-md sm:px-5 sm:py-4">
        <div className="flex items-center gap-4">
          <Heart className="h-6 w-6 text-red-300" />
          <h2 className="text-xl font-bold tracking-tight">{t("Preferiti")}</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-neutral-800 rounded-full transition-colors">
          <X className="w-6 h-6 text-neutral-300" />
        </button>
      </div>

      <div className="grow overflow-y-auto overscroll-contain p-4 sm:p-4">
        <div className="mx-auto max-w-4xl sm:max-w-none">
          {!hasItems ? (
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
              {publications.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1 text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                    <ImageIcon className="h-3.5 w-3.5" />
                    <span>Publicações curtidas</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {publications.map((publication) => {
                      const isRemoving = removingPublicationId === publication.id;
                      const title = publication.establishmentName || publication.caption || "Publicação";

                      return (
                        <motion.div
                          key={publication.id}
                          layout
                          className="group relative aspect-square overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 shadow-xl transition-colors hover:border-neutral-600"
                        >
                          <button
                            type="button"
                            onClick={() => onOpenPublication?.(publication)}
                            className="h-full w-full cursor-pointer"
                            title={title}
                          >
                            <ProgressiveProductImage
                              src={publication.imageUrl}
                              alt={title}
                              className="relative h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                              variant="thumbnail"
                            />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-2 text-left">
                              <p className="line-clamp-1 text-[10px] font-bold text-white">
                                {publication.establishmentName || "TempleSale"}
                              </p>
                            </div>
                          </button>
                          {onRemovePublication && (
                            <button
                              type="button"
                              disabled={isRemoving}
                              onClick={() => {
                                void handleRemovePublication(publication.id);
                              }}
                              className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-neutral-700/80 bg-neutral-950/85 text-neutral-300 transition-colors hover:border-red-500 hover:bg-red-600 hover:text-white disabled:opacity-50"
                              title="Remover curtida"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {products.map((product) => {
                const isRemoving = removingProductId === product.id;

                return (
                  <motion.div
                    key={product.id}
                    layout
                    className="group flex gap-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-3 shadow-2xl transition-colors hover:border-neutral-700"
                  >
                    <div className="w-24 h-32 bg-neutral-950 overflow-hidden shrink-0 rounded-xl border border-neutral-800">
                      <ProgressiveProductImage
                        src={product.image}
                        alt={product.name}
                        className="relative h-full w-full object-cover"
                        loading="lazy"
                        variant="thumbnail"
                      />
                    </div>

                    <div className="grow flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="text-base font-bold text-neutral-100">{product.name}</h3>
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
