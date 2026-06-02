import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingBag, Heart, ChevronLeft, ChevronRight, Eye, MapPin } from "lucide-react";
import { useI18n } from "../i18n/provider";
import { formatCompactPriceFromUnknown } from "../lib/currency";
import { getCategoryLabel } from "../i18n/categories";
import { resolveProductImages } from "../lib/product-images";

export interface Product {
  id: number;
  slug?: string;
  name: string;
  category: string;
  clickCount?: number;
  price: string;
  priceNegotiable?: boolean;
  quantity?: number;
  image: string;
  images?: string[];
  description?: string;
  details?: Record<string, string>;
  ownerId?: number;
  latitude?: number;
  longitude?: number;
  city?: string;
  sellerName?: string;
  sellerWhatsappCountryIso?: string;
  sellerWhatsappNumber?: string;
}

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
  isLiked?: boolean;
  onToggleLike?: () => void;
  onAddToCart?: () => void;
}

export default function ProductCard({
  product,
  onClick,
  isLiked = false,
  onToggleLike,
  onAddToCart,
}: ProductCardProps) {
  const { t, locale } = useI18n();
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const images = React.useMemo(() => resolveProductImages(product), [product]);
  const normalizedCity = String(product.city ?? "").trim();
  const normalizedDescription = String(product.description ?? "").trim();
  const viewCount = Math.max(0, Number(product.clickCount ?? 0));

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      viewport={{ once: true }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex h-full flex-col cursor-pointer overflow-hidden rounded-lg border border-stone-200/80 bg-white shadow-[0_1px_2px_rgba(28,25,23,0.04),0_14px_34px_rgba(28,25,23,0.04)] transition-[border-color,box-shadow,transform] duration-300 hover:border-stone-300 hover:shadow-[0_12px_32px_rgba(28,25,23,0.10)]"
      onClick={onClick}
    >
      <div className="relative aspect-square overflow-hidden bg-linear-to-br from-stone-50 via-[#f4f2ef] to-stone-100">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentImageIndex}
            src={images[currentImageIndex]}
            alt={product.name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="h-full w-full object-contain p-1 sm:p-1.5 scale-[1.03] transition-transform duration-500 ease-out group-hover:scale-[1.07]"
            referrerPolicy="no-referrer"
          />
        </AnimatePresence>

        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          {viewCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/85 px-2 py-1 text-[9px] font-medium text-stone-600 shadow-sm backdrop-blur-sm">
              <Eye className="h-3 w-3" />
              {viewCount}
            </span>
          )}
          {isLiked && (
            <span className="inline-flex items-center rounded-full bg-red-50/90 px-2 py-1 text-[9px] font-semibold text-red-600 shadow-sm backdrop-blur-sm">
              {t("Salvo")}
            </span>
          )}
        </div>

        {/* Mini Carousel Controls (Visible on Hover) */}
        {images.length > 1 && (
          <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button 
              onClick={prevImage}
              className="p-1.5 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
            >
              <ChevronLeft className="w-3 h-3 text-stone-600" />
            </button>
            <button 
              onClick={nextImage}
              className="p-1.5 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
            >
              <ChevronRight className="w-3 h-3 text-stone-600" />
            </button>
          </div>
        )}

        {/* Image Indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {images.map((_, idx) => (
              <div 
                key={idx}
                className={`w-1 h-1 rounded-full transition-all duration-300 ${
                  idx === currentImageIndex ? "bg-white w-3" : "bg-white/40"
                }`}
              />
            ))}
          </div>
        )}

        <div className="absolute top-4 right-4 opacity-100 md:opacity-0 transition-opacity duration-300 md:group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleLike?.();
            }}
            className="p-2 bg-white/85 backdrop-blur-sm rounded-full shadow-sm hover:bg-white hover:scale-105 transition-all"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isLiked ? "fill-red-500 text-red-500" : "text-stone-600"
              }`}
            />
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 translate-y-full opacity-0 pointer-events-none transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-hover:pointer-events-auto bg-linear-to-t from-black/25 to-transparent">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart?.();
            }}
            className="mx-auto w-auto max-w-full px-3 py-1.5 md:w-full md:px-4 md:py-2 bg-yellow-400 text-black text-[10px] md:text-xs font-semibold uppercase tracking-[0.12em] md:tracking-widest flex items-center justify-center gap-1.5 md:gap-2 shadow-[0_8px_20px_rgba(0,0,0,0.16)] hover:bg-yellow-300 transition-colors"
          >
            <ShoppingBag className="w-2.5 h-2.5 md:w-3 md:h-3" />
            {t("Adicionar ao carrinho")}
          </button>
        </div>
      </div>
      
      <div className="flex min-w-0 grow flex-col gap-2 px-3 py-3 sm:px-4 sm:py-4">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex min-w-0 max-w-full truncate text-[10px] uppercase tracking-[0.14em] text-stone-400">
            {getCategoryLabel(product.category, locale)}
          </span>
          {normalizedCity && (
            <span className="hidden sm:inline-flex shrink-0 items-center gap-1 text-[10px] text-stone-400">
              <MapPin className="h-3 w-3" />
              {normalizedCity}
            </span>
          )}
        </div>
        <div className="flex min-w-0 grow flex-col gap-1.5 sm:gap-2">
          <h3 className="min-h-[3.35rem] break-words text-[13px] font-medium leading-snug text-stone-900 [display:-webkit-box] [-webkit-line-clamp:3] [-webkit-box-orient:vertical] overflow-hidden [overflow-wrap:anywhere] sm:min-h-[2.75rem] sm:text-[15px] sm:[-webkit-line-clamp:2]">
            {product.name}
          </h3>
          <p className="hidden min-h-[2.25rem] break-words text-[11px] leading-relaxed text-stone-500 [-webkit-line-clamp:2] [-webkit-box-orient:vertical] overflow-hidden sm:[display:-webkit-box]">
            {normalizedDescription || getCategoryLabel(product.category, locale)}
          </p>
          <span className="mt-auto break-words text-[19px] font-semibold leading-tight text-stone-950 sm:text-[24px] sm:leading-none">
            {formatCompactPriceFromUnknown(product.price, locale, {
              priceNegotiable: product.priceNegotiable,
            })}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
