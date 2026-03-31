import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingBag, Heart, ChevronLeft, ChevronRight } from "lucide-react";
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
      viewport={{ once: true }}
      className="group relative flex flex-col cursor-pointer"
      onClick={onClick}
    >
      <div className="relative aspect-3/4 overflow-hidden bg-stone-100 rounded-sm">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentImageIndex}
            src={images[currentImageIndex]}
            alt={product.name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
        </AnimatePresence>

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
            className="p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isLiked ? "fill-red-500 text-red-500" : "text-stone-600"
              }`}
            />
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 translate-y-0 md:translate-y-full transition-transform duration-300 md:group-hover:translate-y-0 bg-linear-to-t from-black/20 to-transparent">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart?.();
            }}
            className="mx-auto w-auto max-w-full px-3 py-1.5 md:w-full md:px-4 md:py-2 bg-white text-black text-[10px] md:text-xs font-medium uppercase tracking-[0.12em] md:tracking-widest flex items-center justify-center gap-1.5 md:gap-2 hover:bg-stone-100 transition-colors"
          >
            <ShoppingBag className="w-2.5 h-2.5 md:w-3 md:h-3" />
            {t("Adicionar ao carrinho")}
          </button>
        </div>
      </div>
      
      <div className="mt-3 sm:mt-4 flex flex-col gap-2 sm:gap-1.5">
        <span className="inline-flex w-fit max-w-full truncate items-center rounded-sm border border-stone-200/80 bg-stone-50 px-2 py-1 text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-600 shadow-[0_4px_10px_rgba(0,0,0,0.1)] sm:border-transparent sm:bg-transparent sm:px-0 sm:py-0 sm:tracking-[0.2em] sm:text-stone-500 sm:shadow-none">
          {getCategoryLabel(product.category, locale)}
        </span>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-3">
          <h3 className="text-[15px] sm:text-[17px] font-medium text-stone-900 leading-[1.35] tracking-[0.01em] [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] overflow-hidden">
            {product.name}
          </h3>
          <span className="text-[13px] sm:text-sm font-medium text-stone-800 tracking-[0.01em] whitespace-nowrap sm:mt-0.5">
            {formatCompactPriceFromUnknown(product.price, locale, {
              priceNegotiable: product.priceNegotiable,
            })}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
