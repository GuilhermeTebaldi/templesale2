import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Heart,
  Share2,
  ShoppingBag,
  ChevronRight,
  Minus,
  Plus,
  ChevronLeft,
  Maximize2,
  MapPin,
  MessageCircle,
  AlertTriangle,
  Star,
} from "lucide-react";
import { type Product } from "./ProductCard";
import ProductMap from "./ProductMap";
import { buildWhatsappUrl, formatWhatsappDisplay } from "../lib/whatsapp";
import { api, type ProductCommentDto, type SessionUser } from "../lib/api";
import { useI18n } from "../i18n/provider";
import { formatEuroFromUnknown } from "../lib/currency";
import { getCategoryLabel } from "../i18n/categories";
import { resolveProductImages } from "../lib/product-images";

interface ProductDetailsProps {
  product: Product | null;
  products?: Product[];
  onClose: () => void;
  onOpenProduct?: (product: Product) => void;
  isLiked?: boolean;
  onToggleLike?: () => void;
  onAddToCart?: (quantity: number) => void;
  currentUser?: SessionUser | null;
  onRequireAuth?: () => void;
}

const detailLabelByKey: Record<string, string> = {
  type: "Tipo",
  area: "Área",
  room: "Quartos",
  rooms: "Quartos",
  bathroom: "Banheiros",
  bathrooms: "Banheiros",
  garage: "Vagas",
  parking: "Vagas",
  brand: "Marca",
  model: "Modelo",
  color: "Cor",
  year: "Ano",
};
const REAL_ESTATE_CATEGORIES = new Set(["Imóveis", "Terreno", "Aluguel"]);
const DETAIL_KEYS_REAL_ESTATE = new Set(["type", "area", "room", "rooms", "bathroom", "bathrooms", "garage", "parking"]);
const DETAIL_KEYS_VEHICLE = new Set(["brand", "model", "color", "year"]);
const DETAIL_KEYS_ELECTRONICS = new Set(["brand", "model", "color"]);
const PRODUCT_COMMENT_MAX_BODY_LENGTH = 1200;

function formatCommentDate(createdAt: number, locale: string): string {
  const safeDate = new Date(Math.max(0, Number(createdAt) || 0) * 1000);
  const safeLocale = locale === "it-IT" ? "it-IT" : "pt-BR";
  return safeDate.toLocaleDateString(safeLocale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getAllowedDetailKeys(category: string): Set<string> | null {
  const normalizedCategory = String(category ?? "").trim();
  if (REAL_ESTATE_CATEGORIES.has(normalizedCategory)) {
    return DETAIL_KEYS_REAL_ESTATE;
  }
  if (normalizedCategory === "Veículos") {
    return DETAIL_KEYS_VEHICLE;
  }
  if (
    [
      "Eletrônicos e Celulares",
      "Informática e Games",
      "Moda e Acessórios",
      "Eletrodomésticos",
      "Outros",
    ].includes(normalizedCategory)
  ) {
    return DETAIL_KEYS_ELECTRONICS;
  }
  return null;
}

export default function ProductDetails({
  product,
  products = [],
  onClose,
  onOpenProduct,
  isLiked = false,
  onToggleLike,
  onAddToCart,
  currentUser = null,
  onRequireAuth,
}: ProductDetailsProps) {
  const { t, locale } = useI18n();
  const [selectedQuantity, setSelectedQuantity] = React.useState(1);
  const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);
  const [isLocationMapOpen, setIsLocationMapOpen] = React.useState(false);
  const [isLocationAlertOpen, setIsLocationAlertOpen] = React.useState(false);
  const [shareFeedback, setShareFeedback] = React.useState("");
  const [cartFeedback, setCartFeedback] = React.useState("");
  const [resolvedSellerContact, setResolvedSellerContact] = React.useState<{
    sellerWhatsappCountryIso?: string;
    sellerWhatsappNumber?: string;
  } | null>(null);
  const [comments, setComments] = React.useState<ProductCommentDto[]>([]);
  const [isCommentsLoading, setIsCommentsLoading] = React.useState(false);
  const [commentsError, setCommentsError] = React.useState("");
  const [newCommentBody, setNewCommentBody] = React.useState("");
  const [newCommentRating, setNewCommentRating] = React.useState(5);
  const [isSubmittingComment, setIsSubmittingComment] = React.useState(false);
  const [activeReplyBoxCommentId, setActiveReplyBoxCommentId] = React.useState<number | null>(null);
  const [replyDraftByCommentId, setReplyDraftByCommentId] = React.useState<Record<number, string>>({});
  const [submittingReplyByCommentId, setSubmittingReplyByCommentId] = React.useState<Record<number, boolean>>({});

  if (!product) return null;

  const images = resolveProductImages(product);
  const description = product.description?.trim() || t("Descrição não informada pelo vendedor.");
  const allowedDetailKeys = getAllowedDetailKeys(product.category);
  const detailsEntries = Object.entries(product.details ?? {}).filter(
    (entry): entry is [string, string] =>
      (!allowedDetailKeys || allowedDetailKeys.has(String(entry[0]).trim().toLowerCase())) &&
      typeof entry[1] === "string" && entry[1].trim() !== "",
  );
  const hasCoordinates =
    typeof product.latitude === "number" &&
    Number.isFinite(product.latitude) &&
    typeof product.longitude === "number" &&
    Number.isFinite(product.longitude);
  const sellerWhatsappCountryIso =
    resolvedSellerContact?.sellerWhatsappCountryIso || product.sellerWhatsappCountryIso;
  const sellerWhatsappNumber =
    resolvedSellerContact?.sellerWhatsappNumber || product.sellerWhatsappNumber;
  const whatsappUrl = buildWhatsappUrl(
    sellerWhatsappCountryIso,
    sellerWhatsappNumber,
    product.name,
  );
  const whatsappDisplay = formatWhatsappDisplay(
    sellerWhatsappCountryIso,
    sellerWhatsappNumber,
  );
  const hasSellerWhatsapp = Boolean(whatsappUrl);
  const availableQuantity = React.useMemo(() => {
    const raw = Number(product.quantity);
    if (!Number.isFinite(raw)) {
      return 1;
    }
    const normalized = Math.floor(raw);
    return normalized >= 0 ? normalized : 0;
  }, [product.quantity]);
  const canAddToCart = availableQuantity > 0 && selectedQuantity > 0;
  const canComment = Boolean(currentUser?.id);
  const canReplyAsOwner = Boolean(
    currentUser?.id &&
      typeof product.ownerId === "number" &&
      Number.isInteger(product.ownerId) &&
      currentUser.id === product.ownerId,
  );
  const newCommentCharsRemaining = PRODUCT_COMMENT_MAX_BODY_LENGTH - newCommentBody.length;
  const productsForMap = React.useMemo(() => {
    if (products.length === 0) {
      return [product];
    }

    const hasCurrentProduct = products.some((item) => item.id === product.id);
    if (hasCurrentProduct) {
      return products;
    }

    return [product, ...products];
  }, [product, products]);
  const relatedProducts = React.useMemo(() => {
    const normalizeText = (value: unknown) => String(value ?? "").trim().toLowerCase();
    const currentProductId = Number(product.id);
    const others = products.filter((item) => Number(item.id) !== currentProductId);
    if (others.length === 0) {
      return [];
    }

    const currentCity = normalizeText(product.city);
    const currentCategory = normalizeText(product.category);
    const sameCity = currentCity
      ? others.filter((item) => normalizeText(item.city) === currentCity)
      : [];
    const sameCityIdSet = new Set(sameCity.map((item) => item.id));
    const sameCategory = currentCategory
      ? others.filter(
          (item) =>
            !sameCityIdSet.has(item.id) &&
            normalizeText(item.category) === currentCategory,
        )
      : [];
    const sameCategoryIdSet = new Set(sameCategory.map((item) => item.id));
    const fallback = others.filter(
      (item) => !sameCityIdSet.has(item.id) && !sameCategoryIdSet.has(item.id),
    );

    return [...sameCity, ...sameCategory, ...fallback].slice(0, 6);
  }, [product, products]);
  const relatedProductsHeadline = React.useMemo(() => {
    const normalizeText = (value: unknown) => String(value ?? "").trim().toLowerCase();
    const currentCity = normalizeText(product.city);
    if (
      currentCity &&
      relatedProducts.some((item) => normalizeText(item.city) === currentCity)
    ) {
      return t("Outros produtos da mesma região");
    }

    const currentCategory = normalizeText(product.category);
    if (
      currentCategory &&
      relatedProducts.some((item) => normalizeText(item.category) === currentCategory)
    ) {
      return t("Outros produtos da mesma categoria");
    }

    return t("Outros produtos disponíveis");
  }, [product, relatedProducts, t]);

  const formatDetailLabel = (key: string) => {
    const normalizedKey = key.trim().toLowerCase();
    const mappedLabel = detailLabelByKey[normalizedKey];
    if (mappedLabel) {
      return t(mappedLabel);
    }

    return key
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  React.useEffect(() => {
    setActiveImageIndex(0);
    setSelectedQuantity(availableQuantity > 0 ? 1 : 0);
    setIsLocationMapOpen(false);
    setIsLocationAlertOpen(false);
    setShareFeedback("");
    setCartFeedback("");
    setComments([]);
    setCommentsError("");
    setNewCommentBody("");
    setNewCommentRating(5);
    setIsSubmittingComment(false);
    setActiveReplyBoxCommentId(null);
    setReplyDraftByCommentId({});
    setSubmittingReplyByCommentId({});
  }, [product.id, availableQuantity]);

  React.useEffect(() => {
    const localDigits = String(product.sellerWhatsappNumber ?? "").replace(/\D/g, "");
    const hasLocalWhatsapp = localDigits.length >= 6;
    if (hasLocalWhatsapp) {
      setResolvedSellerContact(null);
      return;
    }

    let cancelled = false;
    const resolveSellerContact = async () => {
      try {
        const detailedProduct = await api.getProductById(product.id);
        if (cancelled) return;

        const detailedDigits = String(detailedProduct.sellerWhatsappNumber ?? "").replace(/\D/g, "");
        if (detailedDigits.length >= 6 || detailedProduct.sellerWhatsappCountryIso) {
          setResolvedSellerContact({
            sellerWhatsappCountryIso: detailedProduct.sellerWhatsappCountryIso,
            sellerWhatsappNumber: detailedProduct.sellerWhatsappNumber,
          });
          return;
        }
      } catch {
        // Try the public user endpoint fallback below.
      }

      try {
        if (!product.ownerId) {
          return;
        }
        const seller = await api.getPublicUserById(product.ownerId);
        if (cancelled) return;

        const sellerDigits = String(seller.whatsappNumber ?? "").replace(/\D/g, "");
        if (sellerDigits.length >= 6 || seller.whatsappCountryIso) {
          setResolvedSellerContact({
            sellerWhatsappCountryIso: seller.whatsappCountryIso,
            sellerWhatsappNumber: seller.whatsappNumber,
          });
        }
      } catch {
        // Keep fallback UI when public endpoints don't expose seller contact.
      }
    };

    void resolveSellerContact();

    return () => {
      cancelled = true;
    };
  }, [product.id, product.ownerId, product.sellerWhatsappNumber]);

  React.useEffect(() => {
    let cancelled = false;
    setIsCommentsLoading(true);
    setCommentsError("");

    void api
      .getProductComments(product.id)
      .then((loadedComments) => {
        if (cancelled) {
          return;
        }
        setComments(loadedComments);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        const message =
          error instanceof Error
            ? error.message
            : t("Falha ao carregar comentários desta publicação.");
        setCommentsError(message);
      })
      .finally(() => {
        if (!cancelled) {
          setIsCommentsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [product.id, t]);

  const nextImage = () => setActiveImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);

  const handleLocationClick = () => {
    if (hasCoordinates) {
      setIsLocationMapOpen(true);
      return;
    }
    setIsLocationAlertOpen(true);
  };

  const handleShare = async () => {
    const shareUrl = (() => {
      if (typeof window === "undefined") {
        return `https://www.templesale.com/?product=${product.id}`;
      }
      const url = new URL(window.location.href);
      url.searchParams.set("product", String(product.id));
      return url.toString();
    })();

    const sharePayload = {
      title: product.name,
      text: `${product.name} - ${formatEuroFromUnknown(product.price, locale)}`,
      url: shareUrl,
    };

    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share(sharePayload);
        setShareFeedback(t("Produto compartilhado."));
        return;
      }

      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        await navigator.clipboard.writeText(shareUrl);
        setShareFeedback(t("Link copiado para a área de transferência."));
        return;
      }

      if (typeof window !== "undefined") {
        window.prompt(t("Copie o link do produto"), shareUrl);
      }
      setShareFeedback(t("Link pronto para compartilhar."));
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      setShareFeedback(t("Não foi possível compartilhar agora."));
    }
  };

  const handleAddToCart = () => {
    if (!canAddToCart) {
      return;
    }
    onAddToCart?.(selectedQuantity);
    setCartFeedback(
      t("{count} item(s) adicionado(s) ao carrinho.", {
        count: String(selectedQuantity),
      }),
    );
  };

  const handleSubmitComment = async () => {
    if (!canComment) {
      onRequireAuth?.();
      return;
    }

    const normalizedBody = newCommentBody.trim();
    if (!normalizedBody) {
      setCommentsError(t("Escreva um comentário para enviar."));
      return;
    }

    setCommentsError("");
    setIsSubmittingComment(true);
    try {
      const updatedComments = await api.createProductComment(product.id, {
        body: normalizedBody,
        rating: newCommentRating,
      });
      setComments(updatedComments);
      setNewCommentBody("");
      setNewCommentRating(5);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t("Falha ao enviar comentário nesta publicação.");
      setCommentsError(message);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleSubmitReply = async (commentId: number) => {
    if (!canReplyAsOwner) {
      return;
    }

    const replyBody = String(replyDraftByCommentId[commentId] ?? "").trim();
    if (!replyBody) {
      setCommentsError(t("Escreva uma resposta antes de enviar."));
      return;
    }

    setCommentsError("");
    setSubmittingReplyByCommentId((current) => ({ ...current, [commentId]: true }));
    try {
      const updatedComments = await api.createProductComment(product.id, {
        body: replyBody,
        parentCommentId: commentId,
      });
      setComments(updatedComments);
      setReplyDraftByCommentId((current) => ({
        ...current,
        [commentId]: "",
      }));
      setActiveReplyBoxCommentId(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t("Falha ao enviar resposta nesta publicação.");
      setCommentsError(message);
    } finally {
      setSubmittingReplyByCommentId((current) => ({ ...current, [commentId]: false }));
    }
  };

  const renderStars = (
    rating: number,
    options?: {
      sizeClass?: string;
      clickable?: boolean;
      onSelect?: (value: number) => void;
    },
  ) => {
    const sizeClass = options?.sizeClass ?? "w-4 h-4";
    const clickable = options?.clickable === true;
    const onSelect = options?.onSelect;

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              if (clickable && onSelect) {
                onSelect(value);
              }
            }}
            disabled={!clickable}
            className={clickable ? "cursor-pointer" : "cursor-default"}
            aria-label={t("Avaliar com {count} estrela(s)", { count: String(value) })}
          >
            <Star
              className={`${sizeClass} ${
                value <= rating ? "fill-amber-400 text-amber-400" : "text-stone-300"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-180 bg-[#fdfcfb] overflow-y-auto overscroll-contain"
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
                aria-label={t("Fechar")}
              >
                <X className="w-6 h-6 text-white" />
              </button>

              <div className="relative w-full h-full flex items-center justify-center px-4">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeImageIndex}
                    src={images[activeImageIndex]}
                    alt={t("Imagem ampliada de {name}", { name: product.name })}
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
            <span>{t("Produtos")}</span>
            <ChevronRight className="w-3 h-3" />
            <span>{getCategoryLabel(product.category, locale)}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-stone-800">{product.name}</span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-stone-50 rounded-full transition-colors"
            aria-label={t("Fechar")}
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
                      alt={t("Imagem {index} de {name}", {
                        index: i + 1,
                        name: product.name,
                      })}
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
              className="order-3 lg:order-none flex flex-col"
            >
              <div className="mb-8">
                <span className="text-xs uppercase tracking-[0.3em] text-stone-400 font-medium mb-4 block">
                  {getCategoryLabel(product.category, locale)}
                </span>
                <h1 className="text-4xl lg:text-6xl font-serif italic text-stone-800 mb-4 leading-tight">
                  {product.name}
                </h1>
                <p className="text-2xl font-mono text-stone-600">
                  {formatEuroFromUnknown(product.price, locale)}
                </p>
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
                      {t("Localização")}
                    </span>
                  </div>
                  <span className="text-xs text-stone-400">
                    {hasCoordinates ? t("Abrir no mapa") : t("Não informado")}
                  </span>
                </button>
              </div>

              <div className="space-y-8">
                {/* Quantity Selector */}
                <div className="flex flex-col gap-3">
                  <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">{t("Quantidade")}</span>
                  <div className="flex items-center w-32 border border-stone-200 rounded-sm">
                    <button 
                      onClick={() =>
                        setSelectedQuantity((current) =>
                          availableQuantity === 0 ? 0 : Math.max(1, current - 1),
                        )
                      }
                      disabled={availableQuantity === 0}
                      className="p-3 hover:bg-stone-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="grow text-center font-mono text-sm">{selectedQuantity}</span>
                    <button 
                      onClick={() =>
                        setSelectedQuantity((current) =>
                          Math.min(availableQuantity, Math.max(1, current + 1)),
                        )
                      }
                      disabled={availableQuantity === 0 || selectedQuantity >= availableQuantity}
                      className="p-3 hover:bg-stone-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.15em] text-stone-400">
                    {availableQuantity > 0
                      ? t("Disponível: {count}", { count: String(availableQuantity) })
                      : t("Produto esgotado")}
                  </span>
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={!canAddToCart}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3 border border-stone-300 text-[9px] sm:text-[10px] uppercase tracking-[0.14em] sm:tracking-[0.15em] font-bold text-stone-700 hover:border-stone-800 hover:text-stone-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    {t("Adicionar ao carrinho")}
                  </button>
                  {cartFeedback && (
                    <p className="text-xs text-stone-500">{cartFeedback}</p>
                  )}
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
                        <span>{t("Falar com vendedor")}</span>
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
                        <span>{t("Falar com vendedor")}</span>
                        <span className="text-[10px] tracking-[0.12em] text-white/80 normal-case">
                          {t("WhatsApp não informado")}
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
                  <button
                    type="button"
                    onClick={handleShare}
                    className="p-5 border border-stone-200 hover:border-stone-400 transition-all rounded-sm"
                  >
                    <Share2 className="w-5 h-5 text-stone-600" />
                  </button>
                </div>
                {shareFeedback && (
                  <p className="text-xs text-stone-500">{shareFeedback}</p>
                )}
              </div>
            </motion.div>

            <section className="order-4 lg:order-none lg:col-start-1 lg:row-start-2 mt-2 border-t border-stone-200 pt-8">
              <div>
                <h2 className="text-xl font-serif italic text-stone-800">
                  {t("Comentários e avaliações")}
                </h2>
                <p className="mt-2 text-sm text-stone-500">
                  {t("Deixe sua avaliação com estrelas e seu comentário sobre esta publicação.")}
                </p>
              </div>

              <div className="mt-6 border border-stone-200 rounded-sm bg-stone-50/60 p-4 space-y-4">
                {canComment ? (
                  <>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-stone-500">
                        {t("Sua avaliação")}
                      </span>
                      <div className="flex items-center gap-2">
                        {renderStars(newCommentRating, {
                          clickable: true,
                          onSelect: setNewCommentRating,
                        })}
                        <span className="text-sm font-semibold text-stone-700">{newCommentRating}</span>
                      </div>
                    </div>
                    <textarea
                      rows={3}
                      value={newCommentBody}
                      onChange={(event) => {
                        const nextValue = event.target.value.slice(0, PRODUCT_COMMENT_MAX_BODY_LENGTH);
                        setNewCommentBody(nextValue);
                      }}
                      placeholder={t("Escreva aqui seu comentário sobre este produto...")}
                      className="w-full bg-white border border-stone-200 p-3 text-sm text-stone-700 outline-none focus:border-stone-700 transition-colors resize-none"
                    />
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[11px] text-stone-500">
                        {t("Caracteres restantes: {count}", {
                          count: String(Math.max(0, newCommentCharsRemaining)),
                        })}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          void handleSubmitComment();
                        }}
                        disabled={isSubmittingComment || newCommentBody.trim().length === 0}
                        className="px-4 py-2 bg-stone-900 text-white text-[10px] uppercase tracking-[0.18em] font-bold hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {isSubmittingComment ? t("Enviando comentário...") : t("Comentar")}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <p className="text-sm text-stone-500">
                      {t("Faça login para comentar e avaliar esta publicação.")}
                    </p>
                    <button
                      type="button"
                      onClick={onRequireAuth}
                      className="px-4 py-2 border border-stone-300 text-[10px] uppercase tracking-[0.18em] font-bold text-stone-700 hover:border-stone-800 hover:text-stone-900 transition-colors"
                    >
                      {t("Entrar na conta")}
                    </button>
                  </div>
                )}
              </div>

              {commentsError && (
                <p className="mt-4 text-sm text-red-500">{commentsError}</p>
              )}

              <div className="mt-8 space-y-6">
                {isCommentsLoading ? (
                  <p className="text-sm text-stone-500">{t("Carregando comentários...")}</p>
                ) : comments.length === 0 ? (
                  <p className="text-sm text-stone-500">
                    {t("Ainda não existem comentários para esta publicação.")}
                  </p>
                ) : (
                  comments.map((comment) => (
                    <article key={comment.id} className="border border-stone-200 rounded-sm bg-white p-4">
                      <div className="flex items-start gap-3">
                        <img
                          src={comment.authorAvatarUrl || "https://picsum.photos/seed/comment-avatar/80/80"}
                          alt={comment.authorName}
                          className="w-8 h-8 rounded-full object-cover border border-stone-200"
                        />
                        <div className="min-w-0 grow space-y-2">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="text-sm font-semibold text-stone-800">{comment.authorName}</span>
                            <span className="text-[11px] text-stone-400">
                              {formatCommentDate(comment.createdAt, locale)}
                            </span>
                          </div>

                          {typeof comment.rating === "number" && (
                            <div className="flex items-center gap-2">
                              {renderStars(comment.rating, { sizeClass: "w-3.5 h-3.5" })}
                              <span className="text-xs font-mono text-stone-600">{comment.rating}</span>
                            </div>
                          )}

                          <p className="text-sm leading-relaxed text-stone-700 whitespace-pre-wrap">
                            {comment.body}
                          </p>

                          {comment.replies.length > 0 && (
                            <div className="mt-3 pl-4 border-l border-stone-200 space-y-3">
                              {comment.replies.map((reply) => (
                                <div key={reply.id} className="space-y-1">
                                  <div className="flex items-start gap-2">
                                    <img
                                      src={reply.authorAvatarUrl || "https://picsum.photos/seed/reply-avatar/80/80"}
                                      alt={reply.authorName}
                                      className="w-6 h-6 rounded-full object-cover border border-stone-200 mt-0.5"
                                    />
                                    <div className="min-w-0 grow">
                                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                        <span className="text-xs font-semibold text-stone-800">
                                          {reply.authorName}
                                        </span>
                                        <span className="text-[10px] text-stone-400">
                                          {formatCommentDate(reply.createdAt, locale)}
                                        </span>
                                        {reply.userId === product.ownerId && (
                                          <span className="text-[10px] uppercase tracking-[0.12em] text-emerald-600 font-bold">
                                            {t("Resposta do dono")}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs leading-relaxed text-stone-600 whitespace-pre-wrap">
                                        {reply.body}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {canReplyAsOwner && (
                            <div className="pt-2 space-y-2">
                              {activeReplyBoxCommentId !== comment.id ? (
                                <button
                                  type="button"
                                  onClick={() => setActiveReplyBoxCommentId(comment.id)}
                                  className="text-[10px] uppercase tracking-[0.16em] font-bold text-stone-500 hover:text-stone-800 transition-colors"
                                >
                                  {t("Responder comentário")}
                                </button>
                              ) : (
                                <div className="space-y-2">
                                  <textarea
                                    rows={2}
                                    value={replyDraftByCommentId[comment.id] ?? ""}
                                    onChange={(event) => {
                                      const nextValue = event.target.value.slice(0, PRODUCT_COMMENT_MAX_BODY_LENGTH);
                                      setReplyDraftByCommentId((current) => ({
                                        ...current,
                                        [comment.id]: nextValue,
                                      }));
                                    }}
                                    placeholder={t("Escreva uma resposta para este comentário...")}
                                    className="w-full bg-stone-50 border border-stone-200 p-2.5 text-xs text-stone-700 outline-none focus:border-stone-700 transition-colors resize-none"
                                  />
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        void handleSubmitReply(comment.id);
                                      }}
                                      disabled={
                                        submittingReplyByCommentId[comment.id] === true ||
                                        String(replyDraftByCommentId[comment.id] ?? "").trim().length === 0
                                      }
                                      className="px-3 py-1.5 bg-stone-900 text-white text-[10px] uppercase tracking-[0.14em] font-bold hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                      {submittingReplyByCommentId[comment.id]
                                        ? t("Enviando...")
                                        : t("Responder")}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveReplyBoxCommentId(null);
                                        setReplyDraftByCommentId((current) => ({
                                          ...current,
                                          [comment.id]: "",
                                        }));
                                      }}
                                      className="px-3 py-1.5 border border-stone-200 text-[10px] uppercase tracking-[0.14em] font-bold text-stone-600 hover:border-stone-500 hover:text-stone-900 transition-colors"
                                    >
                                      {t("Cancelar")}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>

          <section className="mt-16 border-t border-stone-200 pt-10">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-serif italic text-stone-800">
                {relatedProductsHeadline}
              </h2>
              <p className="text-sm text-stone-500">
                {t("Mostrando outros anúncios para você explorar rapidamente.")}
              </p>
            </div>

            {relatedProducts.length === 0 ? (
              <p className="mt-6 text-sm text-stone-500">
                {t("Ainda não existem outros anúncios disponíveis.")}
              </p>
            ) : (
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <button
                    key={relatedProduct.id}
                    type="button"
                    onClick={() => onOpenProduct?.(relatedProduct)}
                    className="text-left border border-stone-200 bg-white hover:border-stone-400 transition-colors rounded-sm overflow-hidden group"
                  >
                    <div className="aspect-[3/4] bg-stone-100 overflow-hidden">
                      <img
                        src={resolveProductImages(relatedProduct)[0]}
                        alt={relatedProduct.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4 space-y-1">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-stone-400">
                        {getCategoryLabel(relatedProduct.category, locale)}
                      </p>
                      <p className="text-base font-serif italic text-stone-800 line-clamp-2">
                        {relatedProduct.name}
                      </p>
                      <p className="text-sm font-mono text-stone-600">
                        {formatEuroFromUnknown(relatedProduct.price, locale)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
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
                  {t("Localização indisponível")}
                </h3>
                <p className="text-sm text-stone-500 leading-relaxed mb-8">
                  {t("O usuário não informou a localização deste produto.")}
                </p>
                <button
                  type="button"
                  onClick={() => setIsLocationAlertOpen(false)}
                  className="px-8 py-3 bg-stone-900 text-white text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-black transition-colors"
                >
                  {t("Entendi")}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isLocationMapOpen && hasCoordinates && (
            <ProductMap
              products={productsForMap}
              initialFocusProductId={product.id}
              onOpenProduct={(nextProduct) => {
                setIsLocationMapOpen(false);
                onOpenProduct?.(nextProduct);
              }}
              onClose={() => setIsLocationMapOpen(false)}
            />
          )}
        </AnimatePresence>
      </motion.div>
  );
}
