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
      className="group relative flex flex-col cursor-pointer overflow-hidden rounded-md border border-stone-200 bg-white transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <div className="relative aspect-square overflow-hidden bg-[#f3f3f3]">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentImageIndex}
            src={images[currentImageIndex]}
            alt={product.name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="h-full w-full object-contain p-2 sm:p-3"
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
        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 translate-y-full opacity-0 pointer-events-none transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-hover:pointer-events-auto bg-linear-to-t from-black/20 to-transparent">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart?.();
            }}
            className="mx-auto w-auto max-w-full px-3 py-1.5 md:w-full md:px-4 md:py-2 bg-yellow-400 text-black text-[10px] md:text-xs font-medium uppercase tracking-[0.12em] md:tracking-widest flex items-center justify-center gap-1.5 md:gap-2 hover:bg-yellow-500 transition-colors"
          >
            <ShoppingBag className="w-2.5 h-2.5 md:w-3 md:h-3" />
            {t("Adicionar ao carrinho")}
          </button>
        </div>
      </div>
      
      <div className="px-3 py-3 sm:px-3.5 sm:py-3.5 flex flex-col gap-1.5">
        <span className="inline-flex w-fit max-w-full truncate items-center text-[11px] text-stone-500">
          {getCategoryLabel(product.category, locale)}
        </span>
        <div className="flex flex-col gap-1.5">
          <h3 className="text-[18px] sm:text-[20px] font-semibold text-stone-900 leading-[1.25] [display:-webkit-box] [-webkit-line-clamp:3] [-webkit-box-orient:vertical] overflow-hidden">
            {product.name}
          </h3>
          <span className="text-[24px] sm:text-[28px] font-semibold text-stone-900 leading-none">
            {formatCompactPriceFromUnknown(product.price, locale, {
              priceNegotiable: product.priceNegotiable,
            })}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
