import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Heart,
  Share2,
  ChevronRight,
  Minus,
  Plus,
  ChevronLeft,
  Maximize2,
  MapPin,
  MessageCircle,
  AlertTriangle,
} from "lucide-react";
import { type Product } from "./ProductCard";
import ProductMap from "./ProductMap";
import { buildWhatsappUrl, formatWhatsappDisplay } from "../lib/whatsapp";

interface ProductDetailsProps {
  product: Product | null;
  onClose: () => void;
  isLiked?: boolean;
  onToggleLike?: () => void;
}

export default function ProductDetails({
  product,
  onClose,
  isLiked = false,
  onToggleLike,
}: ProductDetailsProps) {
  const [quantity, setQuantity] = React.useState(1);
  const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);
  const [isLocationMapOpen, setIsLocationMapOpen] = React.useState(false);
  const [isLocationAlertOpen, setIsLocationAlertOpen] = React.useState(false);

  if (!product) return null;

  const images = product.images || [product.image];
  const description = product.description?.trim() || "Descrição não informada pelo vendedor.";
  const detailsEntries = Object.entries(product.details ?? {}).filter(
    (entry): entry is [string, string] =>
      typeof entry[1] === "string" && entry[1].trim() !== "",
  );
  const hasCoordinates =
    typeof product.latitude === "number" &&
    Number.isFinite(product.latitude) &&
    typeof product.longitude === "number" &&
    Number.isFinite(product.longitude);
  const whatsappUrl = buildWhatsappUrl(
    product.sellerWhatsappCountryIso,
    product.sellerWhatsappNumber,
    product.name,
  );
  const whatsappDisplay = formatWhatsappDisplay(
    product.sellerWhatsappCountryIso,
    product.sellerWhatsappNumber,
  );
  const hasSellerWhatsapp = Boolean(whatsappUrl);

  const formatDetailLabel = (key: string) =>
    key
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());

  React.useEffect(() => {
    setActiveImageIndex(0);
    setQuantity(1);
    setIsLocationMapOpen(false);
    setIsLocationAlertOpen(false);
  }, [product.id]);

  const nextImage = () => setActiveImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);

  const handleLocationClick = () => {
    if (hasCoordinates) {
      setIsLocationMapOpen(true);
      return;
    }
    setIsLocationAlertOpen(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-100 bg-[#fdfcfb] overflow-y-auto"
      >
        {/* Lightbox Overlay */}
        <AnimatePresence>
          {isLightboxOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-110 bg-black flex items-center justify-center"
            >
              <button 
                onClick={() => setIsLightboxOpen(false)}
                className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-20"
              >
                <X className="w-6 h-6 text-white" />
              </button>

              <div className="relative w-full h-full flex items-center justify-center px-4">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeImageIndex}
                    src={images[activeImageIndex]}
                    alt={`${product.name} zoom`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    className="max-w-full max-h-full object-contain"
                  />
                </AnimatePresence>

                <button 
                  onClick={prevImage}
                  className="absolute left-8 p-4 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                >
                  <ChevronLeft className="w-8 h-8 text-white" />
                </button>
                <button 
                  onClick={nextImage}
                  className="absolute right-8 p-4 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                >
                  <ChevronRight className="w-8 h-8 text-white" />
                </button>

                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
                  {images.map((_, idx) => (
                    <div 
                      key={idx}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === activeImageIndex ? "bg-white scale-125" : "bg-white/30"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#fdfcfb]/80 backdrop-blur-md border-b border-stone-100 px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-stone-400">
            <span>Shop</span>
            <ChevronRight className="w-3 h-3" />
            <span>{product.category}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-stone-800">{product.name}</span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-stone-50 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-stone-600" />
          </button>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
            {/* Image Gallery */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div 
                className="relative aspect-3/4 bg-stone-100 overflow-hidden rounded-sm cursor-zoom-in group"
                onClick={() => setIsLightboxOpen(true)}
              >
                <img 
                  src={images[activeImageIndex]} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-6 right-6 p-3 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="w-5 h-5 text-stone-600" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {images.map((img, i) => (
                  <div 
                    key={i} 
                    onClick={() => setActiveImageIndex(i)}
                    className={`aspect-square bg-stone-100 rounded-sm overflow-hidden cursor-pointer transition-all border-2 ${
                      i === activeImageIndex ? "border-stone-800" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img 
                      src={img} 
                      alt={`${product.name} view ${i}`} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Product Info */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col"
            >
              <div className="mb-8">
                <span className="text-xs uppercase tracking-[0.3em] text-stone-400 font-medium mb-4 block">
                  {product.category}
                </span>
                <h1 className="text-4xl lg:text-6xl font-serif italic text-stone-800 mb-4 leading-tight">
                  {product.name}
                </h1>
                <p className="text-2xl font-mono text-stone-600">{product.price}</p>
              </div>

              <div className="prose prose-stone mb-12">
                <p className="text-stone-500 leading-relaxed">
                  {description}
                </p>
                {detailsEntries.length > 0 && (
                  <ul className="mt-6 space-y-2 text-sm text-stone-500 list-none p-0">
                    {detailsEntries.map(([key, value]) => (
                      <li key={key} className="flex items-center gap-3">
                        <div className="w-1 h-1 bg-stone-300 rounded-full" />
                        {formatDetailLabel(key)}: {value}
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  onClick={handleLocationClick}
                  className="mt-6 w-full border border-stone-200 rounded-sm px-4 py-3 flex items-center justify-between gap-3 text-left hover:border-stone-400 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-stone-600" />
                    <span className="text-sm uppercase tracking-[0.15em] text-stone-600">
                      Localizacao
                    </span>
                  </div>
                  <span className="text-xs text-stone-400">
                    {hasCoordinates ? "Abrir no mapa" : "Nao informado"}
                  </span>
                </button>
              </div>

              <div className="space-y-8">
                {/* Quantity Selector */}
                <div className="flex flex-col gap-3">
                  <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Quantity</span>
                  <div className="flex items-center w-32 border border-stone-200 rounded-sm">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-3 hover:bg-stone-50 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="grow text-center font-mono text-sm">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-3 hover:bg-stone-50 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4">
                  {hasSellerWhatsapp ? (
                    <a
                      href={whatsappUrl ?? undefined}
                      target="_blank"
                      rel="noreferrer"
                      className="grow bg-stone-900 text-white py-4 px-8 text-xs uppercase tracking-[0.2em] font-bold flex items-center justify-center gap-3 hover:bg-black transition-all"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="flex flex-col">
                        <span>Falar com vendedor</span>
                        <span className="text-[10px] tracking-[0.12em] text-white/80 normal-case">
                          {whatsappDisplay}
                        </span>
                      </span>
                    </a>
                  ) : (
                    <button
                      disabled
                      className="grow bg-stone-300 text-white py-4 px-8 text-xs uppercase tracking-[0.2em] font-bold flex items-center justify-center gap-3 cursor-not-allowed"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="flex flex-col">
                        <span>Falar com vendedor</span>
                        <span className="text-[10px] tracking-[0.12em] text-white/80 normal-case">
                          WhatsApp nao informado
                        </span>
                      </span>
                    </button>
                  )}
                  <button
                    onClick={onToggleLike}
                    className="p-5 border border-stone-200 hover:border-stone-400 transition-all rounded-sm"
                  >
                    <Heart
                      className={`w-5 h-5 transition-colors ${
                        isLiked ? "fill-red-500 text-red-500" : "text-stone-600"
                      }`}
                    />
                  </button>
                  <button className="p-5 border border-stone-200 hover:border-stone-400 transition-all rounded-sm">
                    <Share2 className="w-5 h-5 text-stone-600" />
                  </button>
                </div>
              </div>

              {/* Additional Details Accordion-style */}
              <div className="mt-16 border-t border-stone-100">
                {['Shipping & Returns', 'Care Instructions', 'Sustainability'].map((item) => (
                  <div key={item} className="border-b border-stone-100 py-6 flex justify-between items-center cursor-pointer group">
                    <span className="text-xs uppercase tracking-widest font-medium text-stone-600 group-hover:text-stone-900 transition-colors">
                      {item}
                    </span>
                    <Plus className="w-4 h-4 text-stone-300 group-hover:text-stone-600 transition-colors" />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        <AnimatePresence>
          {isLocationAlertOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-120 bg-black/20 backdrop-blur-sm flex items-center justify-center px-6"
            >
              <motion.div
                initial={{ opacity: 0, y: 18, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 18, scale: 0.96 }}
                className="w-full max-w-xl bg-[#fdfcfb] border border-stone-200 rounded-sm p-8 text-center shadow-2xl"
              >
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-4" />
                <h3 className="text-2xl font-serif italic text-stone-800 mb-3">
                  Localizacao indisponivel
                </h3>
                <p className="text-sm text-stone-500 leading-relaxed mb-8">
                  O usuario nao informou a localizacao deste produto.
                </p>
                <button
                  type="button"
                  onClick={() => setIsLocationAlertOpen(false)}
                  className="px-8 py-3 bg-stone-900 text-white text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-black transition-colors"
                >
                  Entendi
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isLocationMapOpen && hasCoordinates && (
            <ProductMap
              products={[product]}
              onClose={() => setIsLocationMapOpen(false)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
