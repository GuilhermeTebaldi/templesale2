import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingBag, Heart, ChevronLeft, ChevronRight } from "lucide-react";

export interface Product {
  id: number;
  name: string;
  category: string;
  price: string;
  image: string;
  images?: string[];
  description?: string;
  details?: Record<string, string>;
  ownerId?: number;
  latitude?: number;
  longitude?: number;
  sellerName?: string;
  sellerWhatsappCountryIso?: string;
  sellerWhatsappNumber?: string;
}

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
  isLiked?: boolean;
  onToggleLike?: () => void;
}

export default function ProductCard({
  product,
  onClick,
  isLiked = false,
  onToggleLike,
}: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const images = product.images || [product.image];

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

        <div className="absolute top-4 right-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
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
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full transition-transform duration-300 group-hover:translate-y-0 bg-linear-to-t from-black/20 to-transparent">
          <button 
            onClick={(e) => e.stopPropagation()}
            className="w-full py-2 bg-white text-black text-xs font-medium uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-stone-100 transition-colors"
          >
            <ShoppingBag className="w-3 h-3" />
            Add to Cart
          </button>
        </div>
      </div>
      
      <div className="mt-4 flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-medium">
          {product.category}
        </span>
        <div className="flex justify-between items-start">
          <h3 className="font-serif italic text-lg text-stone-800 leading-tight">
            {product.name}
          </h3>
          <span className="font-mono text-sm text-stone-600">
            {product.price}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
