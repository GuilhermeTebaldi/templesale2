import React from "react";
import { motion } from "motion/react";
import { Heart, MapPin, MessageCircle } from "lucide-react";
import { getCategoryLabel } from "../i18n/categories";
import { useI18n } from "../i18n/provider";
import { formatCompactPriceFromUnknown } from "../lib/currency";
import { ProgressiveProductImage, type Product } from "./ProductCard";

interface ArtGalleryProductCardProps {
  product: Product;
  onClick?: () => void;
  isLiked?: boolean;
  onToggleLike?: () => void;
  onAddToCart?: () => void;
  imageLoading?: "eager" | "lazy";
  imageFetchPriority?: "high" | "low" | "auto";
}

export default function ArtGalleryProductCard({
  product,
  onClick,
  isLiked = false,
  onToggleLike,
  onAddToCart,
  imageLoading = "lazy",
  imageFetchPriority = "auto",
}: ArtGalleryProductCardProps) {
  const { t, locale } = useI18n();
  const imageUrl = String(product.images?.[0] ?? product.image ?? "").trim();
  const normalizedCity = String(product.city ?? "").trim();

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      viewport={{ once: true }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex h-full flex-col cursor-pointer"
      onClick={onClick}
    >
      <div className="relative w-full aspect-[4/5] border border-stone-100 bg-[#f9f9f7] p-3 transition-colors duration-500 group-hover:border-stone-300 sm:p-4">
        <div className="relative h-full w-full overflow-hidden border border-stone-200 bg-white">
          <ProgressiveProductImage
            src={imageUrl}
            alt={product.name}
            loading={imageLoading}
            fetchPriority={imageFetchPriority}
            variant="card"
            className="relative h-full w-full object-contain p-1.5 transition-all duration-1000 ease-out group-hover:scale-[1.035]"
          />
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleLike?.();
          }}
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-white/85 text-stone-600 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:text-stone-950"
          aria-label={isLiked ? t("Remover dos salvos") : t("Salvar produto")}
        >
          <Heart className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
        </button>

        {onAddToCart && (
          <div className="absolute bottom-6 left-1/2 w-[calc(100%-3rem)] -translate-x-1/2 opacity-100 transition-opacity duration-300 ease-out sm:bottom-7 sm:w-[calc(100%-3.5rem)] md:opacity-0 md:group-hover:opacity-100">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onAddToCart();
              }}
              className="mx-auto flex w-full max-w-[15rem] items-center justify-center gap-1.5 bg-stone-950 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white shadow-[0_8px_20px_rgba(0,0,0,0.16)] transition-colors hover:bg-black md:px-4 md:py-2 md:text-xs md:tracking-widest"
            >
              <MessageCircle className="h-2.5 w-2.5 md:h-3 md:w-3" />
              {t("Contatta")}
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 flex grow flex-col items-center gap-1.5 text-center sm:mt-5">
        <span className="max-w-full truncate text-[10px] font-mono uppercase tracking-widest text-stone-400">
          {getCategoryLabel(product.category, locale)}
        </span>
        <h3 className="max-w-full text-[13px] font-medium leading-snug tracking-tight text-stone-900 transition-colors group-hover:text-stone-600 sm:text-sm">
          <span className="[display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] overflow-hidden [overflow-wrap:anywhere]">
            {product.name}
          </span>
        </h3>

        {normalizedCity && (
          <span className="inline-flex max-w-full items-center gap-1 truncate text-[10px] text-stone-400">
            <MapPin className="h-3 w-3 shrink-0" />
            {normalizedCity}
          </span>
        )}

        <div className="my-1 h-px w-6 bg-stone-200" />

        <span className="text-sm font-semibold tracking-wide text-stone-950">
          {formatCompactPriceFromUnknown(product.price, locale, {
            priceNegotiable: product.priceNegotiable,
          })}
        </span>

        <div className="mt-auto h-8" />
      </div>
    </motion.article>
  );
}
