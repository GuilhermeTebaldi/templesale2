import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowRight,
  Navigation,
  MapPin,
} from "lucide-react";
import { api, type CreateProductInput } from "../lib/api";
import { type Product } from "./ProductCard";
import LeafletMapPicker from "./LeafletMapPicker";
import { useI18n } from "../i18n/provider";
import { CATEGORY_VALUES, getCategoryLabel } from "../i18n/categories";
import { parsePriceToNumber } from "../lib/currency";

interface NewProductProps {
  onClose: () => void;
  onPublish: (product: CreateProductInput) => Promise<void>;
  mode?: "create" | "edit";
  initialProduct?: Product | null;
}

const DEFAULT_DETAILS: Record<string, string> = {
  type: "",
  area: "",
  rooms: "",
  bathrooms: "",
  parking: "",
  brand: "",
  model: "",
  color: "",
  year: "",
};

type FormState = {
  name: string;
  category: string;
  price: string;
  quantity: string;
  latitude: string;
  longitude: string;
  description: string;
  details: Record<string, string>;
};

type GeoPoint = {
  latitude: number;
  longitude: number;
};

const MAX_COORDINATE_LATITUDE = 90;
const MAX_COORDINATE_LONGITUDE = 180;
const DEFAULT_MAP_CENTER: GeoPoint = {
  latitude: -23.55052,
  longitude: -46.633308,
};
const MAX_PRODUCT_IMAGES = 10;
const EURO_AMOUNT_FORMATTER = new Intl.NumberFormat("it-IT", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const REAL_ESTATE_CATEGORIES = new Set(["Imóveis", "Terreno", "Aluguel"]);
const DETAILS_KEYS_REAL_ESTATE = new Set(["type", "area", "rooms", "bathrooms", "parking"]);
const DETAILS_KEYS_VEHICLE = new Set(["brand", "model", "color", "year"]);
const DETAILS_KEYS_ELECTRONICS = new Set(["brand", "model", "color"]);

function getAllowedDetailKeys(category: string): Set<string> {
  const normalizedCategory = String(category ?? "").trim();
  if (REAL_ESTATE_CATEGORIES.has(normalizedCategory)) {
    return DETAILS_KEYS_REAL_ESTATE;
  }
  if (normalizedCategory === "Veículos") {
    return DETAILS_KEYS_VEHICLE;
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
    return DETAILS_KEYS_ELECTRONICS;
  }
  return new Set();
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function toGeoPoint(latitude: number, longitude: number): GeoPoint | null {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    latitude: clampNumber(latitude, -MAX_COORDINATE_LATITUDE, MAX_COORDINATE_LATITUDE),
    longitude: clampNumber(longitude, -MAX_COORDINATE_LONGITUDE, MAX_COORDINATE_LONGITUDE),
  };
}

function parseCoordinateStrings(latitude: string, longitude: string): GeoPoint | null {
  return toGeoPoint(Number(latitude), Number(longitude));
}

function getInitialLocationPoint(product: Product | null | undefined): GeoPoint | null {
  if (!product) {
    return null;
  }

  return toGeoPoint(Number(product.latitude), Number(product.longitude));
}

function normalizeInitialImages(product: Product | null | undefined): string[] {
  if (!product) {
    return [];
  }

  if (Array.isArray(product.images) && product.images.length > 0) {
    return [...product.images];
  }
  if (product.image) {
    return [product.image];
  }
  return [];
}

function normalizePriceValue(price: string): string {
  const parsed = parsePriceToNumber(price);
  if (parsed === null || parsed <= 0) {
    return "";
  }
  return EURO_AMOUNT_FORMATTER.format(parsed);
}

function sanitizePriceDraft(rawValue: string): string {
  return String(rawValue ?? "").replace(/[^\d.,]/g, "");
}

function toEditablePriceValue(rawValue: string): string {
  const parsed = parsePriceToNumber(rawValue);
  if (parsed === null || parsed <= 0) {
    return "";
  }
  return parsed.toFixed(2).replace(".", ",");
}

function buildInitialFormState(product: Product | null | undefined): FormState {
  if (!product) {
    return {
      name: "",
      category: "Imóveis",
      price: "",
      quantity: "1",
      latitude: "",
      longitude: "",
      description: "",
      details: { ...DEFAULT_DETAILS },
    };
  }

  return {
    name: product.name ?? "",
    category: product.category ?? "Imóveis",
    price: normalizePriceValue(product.price ?? ""),
    quantity: (() => {
      const parsed = Number(product.quantity);
      if (!Number.isFinite(parsed)) {
        return "1";
      }
      const normalized = Math.max(0, Math.floor(parsed));
      return String(normalized);
    })(),
    latitude:
      typeof product.latitude === "number" && Number.isFinite(product.latitude)
        ? product.latitude.toFixed(6)
        : "",
    longitude:
      typeof product.longitude === "number" && Number.isFinite(product.longitude)
        ? product.longitude.toFixed(6)
        : "",
    description: product.description ?? "",
    details: {
      ...DEFAULT_DETAILS,
      ...(product.details ?? {}),
    },
  };
}

export default function NewProduct({
  onClose,
  onPublish,
  mode = "create",
  initialProduct = null,
}: NewProductProps) {
  const { t, locale } = useI18n();
  const initialLocation = React.useMemo(
    () => getInitialLocationPoint(initialProduct),
    [initialProduct],
  );
  const isEditing = mode === "edit";
  const [formData, setFormData] = React.useState<FormState>(() =>
    buildInitialFormState(initialProduct),
  );
  const [images, setImages] = React.useState<string[]>(() =>
    normalizeInitialImages(initialProduct),
  );
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isUploadingImages, setIsUploadingImages] = React.useState(false);
  const [isPublishing, setIsPublishing] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [isMapPickerOpen, setIsMapPickerOpen] = React.useState(false);
  const [mapCenter, setMapCenter] = React.useState<GeoPoint>(
    () => initialLocation ?? DEFAULT_MAP_CENTER,
  );
  const [selectedMapPoint, setSelectedMapPoint] = React.useState<GeoPoint | null>(
    () => initialLocation,
  );

  React.useEffect(() => {
    setFormData(buildInitialFormState(initialProduct));
    setImages(normalizeInitialImages(initialProduct));
    setIsSuccess(false);
    setErrorMessage("");
    setIsMapPickerOpen(false);

    const nextLocation = getInitialLocationPoint(initialProduct);
    setSelectedMapPoint(nextLocation);
    setMapCenter(nextLocation ?? DEFAULT_MAP_CENTER);
  }, [initialProduct]);

  const isRealEstate = ["Imóveis", "Terreno", "Aluguel"].includes(formData.category);
  const isVehicle = formData.category === "Veículos";
  const isElectronicsOrFashion = [
    "Eletrônicos e Celulares", 
    "Informática e Games", 
    "Moda e Acessórios", 
    "Eletrodomésticos",
    "Outros"
  ].includes(formData.category);
  const hasLocationSelected = Boolean(parseCoordinateStrings(formData.latitude, formData.longitude));

  const handleRemoveImage = (index: number) => {
    setImages((current) => current.filter((_, i) => i !== index));
  };

  const handleTriggerImagePicker = () => {
    fileInputRef.current?.click();
  };

  const handleSelectImages = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles: File[] = event.target.files ? Array.from(event.target.files) : [];
    event.currentTarget.value = "";

    if (selectedFiles.length === 0) {
      return;
    }

    const imageFiles = selectedFiles.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length !== selectedFiles.length) {
      setErrorMessage(t("Selecione apenas arquivos de imagem."));
      return;
    }

    if (images.length + imageFiles.length > MAX_PRODUCT_IMAGES) {
      setErrorMessage(
        t("Você pode enviar no máximo {count} imagens.", {
          count: String(MAX_PRODUCT_IMAGES),
        }),
      );
      return;
    }

    setErrorMessage("");
    setIsUploadingImages(true);

    try {
      const uploaded: string[] = [];
      for (const file of imageFiles) {
        const response = await api.uploadProductImage(file);
        const imageUrl = String(response.url ?? "").trim();
        if (!imageUrl) {
          throw new Error(t("Upload concluído sem URL de imagem."));
        }
        uploaded.push(imageUrl);
      }

      if (uploaded.length > 0) {
        setImages((current) => [...current, ...uploaded]);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("Falha ao enviar imagens para o Cloudinary.");
      setErrorMessage(message);
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleDetailChange = (field: string, value: string) => {
    setFormData((current) => ({
      ...current,
      details: {
        ...current.details,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    const normalizedName = formData.name.trim();
    const normalizedCategory = formData.category.trim();
    const normalizedDescription = formData.description.trim();
    const latitude = Number(formData.latitude);
    const longitude = Number(formData.longitude);
    const parsedPrice = parsePriceToNumber(formData.price);
    const parsedQuantity = Number(formData.quantity);

    if (!normalizedName) {
      setErrorMessage(t("Nome do produto é obrigatório."));
      return;
    }
    if (!normalizedCategory) {
      setErrorMessage(t("Categoria é obrigatória."));
      return;
    }
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setErrorMessage(t("Informe latitude e longitude válidas."));
      return;
    }
    if (latitude < -90 || latitude > 90) {
      setErrorMessage(t("Latitude deve estar entre -90 e 90."));
      return;
    }
    if (longitude < -180 || longitude > 180) {
      setErrorMessage(t("Longitude deve estar entre -180 e 180."));
      return;
    }
    if (parsedPrice === null || parsedPrice <= 0) {
      setErrorMessage(t("Informe um preço válido em euro."));
      return;
    }
    if (!Number.isFinite(parsedQuantity) || !Number.isInteger(parsedQuantity) || parsedQuantity < 0) {
      setErrorMessage(t("Informe uma quantidade válida."));
      return;
    }
    if (!normalizedDescription) {
      setErrorMessage(t("Descrição é obrigatória."));
      return;
    }
    if (images.length === 0) {
      setErrorMessage(t("Adicione pelo menos uma imagem do produto."));
      return;
    }

    setIsPublishing(true);

    try {
      const allowedDetailKeys = getAllowedDetailKeys(normalizedCategory);
      const details = Object.fromEntries(
        Object.entries(formData.details).filter(
          (entry): entry is [string, string] =>
            allowedDetailKeys.has(String(entry[0]).trim().toLowerCase()) &&
            typeof entry[1] === "string" &&
            entry[1].trim() !== "",
        ),
      );
      const newProduct: CreateProductInput = {
        name: normalizedName,
        category: normalizedCategory,
        price: parsedPrice.toFixed(2),
        quantity: parsedQuantity,
        latitude,
        longitude,
        image: images[0],
        images: [...images],
        description: normalizedDescription,
        details,
      };
      await onPublish(newProduct);
      setIsSuccess(true);

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : isEditing
            ? t("Falha ao atualizar o anúncio.")
            : t("Falha ao publicar o anúncio.");
      setErrorMessage(message);
    } finally {
      setIsPublishing(false);
    }
  };

  const requestCurrentLocation = (
    onSuccess: (point: GeoPoint) => void,
    onFailure?: (message: string) => void,
  ) => {
    if (!("geolocation" in navigator)) {
      onFailure?.(t("Geolocalização não suportada neste navegador."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextPoint = {
          latitude: clampNumber(
            position.coords.latitude,
            -MAX_COORDINATE_LATITUDE,
            MAX_COORDINATE_LATITUDE,
          ),
          longitude: clampNumber(
            position.coords.longitude,
            -MAX_COORDINATE_LONGITUDE,
            MAX_COORDINATE_LONGITUDE,
          ),
        };
        onSuccess(nextPoint);
      },
      () => {
        onFailure?.(t("Não foi possível capturar a localização atual."));
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleUseCurrentLocation = () => {
    setErrorMessage("");
    requestCurrentLocation(
      (nextPoint) => {
        setFormData((prev) => ({
          ...prev,
          latitude: nextPoint.latitude.toFixed(6),
          longitude: nextPoint.longitude.toFixed(6),
        }));
        setMapCenter(nextPoint);
        setSelectedMapPoint(nextPoint);
      },
      (message) => {
        setErrorMessage(message);
      },
    );
  };

  const handleOpenMapPicker = () => {
    const savedLocation = parseCoordinateStrings(formData.latitude, formData.longitude);
    if (savedLocation) {
      setMapCenter(savedLocation);
      setSelectedMapPoint(savedLocation);
    } else {
      setMapCenter(DEFAULT_MAP_CENTER);
      setSelectedMapPoint(null);
    }
    setErrorMessage("");
    setIsMapPickerOpen(true);

    requestCurrentLocation(
      (nextPoint) => {
        setMapCenter(nextPoint);
      },
      (message) => {
        setErrorMessage(
          t("{message} Você ainda pode escolher manualmente no mapa.", {
            message,
          }),
        );
      },
    );
  };

  const handleCloseMapPicker = () => {
    setIsMapPickerOpen(false);
  };

  const handleConfirmMapLocation = (point: GeoPoint) => {
    setSelectedMapPoint(point);

    setFormData((current) => ({
      ...current,
      latitude: point.latitude.toFixed(6),
      longitude: point.longitude.toFixed(6),
    }));
    handleCloseMapPicker();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-120 bg-[#fdfcfb] overflow-y-auto overscroll-contain"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#fdfcfb]/80 backdrop-blur-md border-b border-stone-100 px-6 h-20 flex items-center justify-between">
        <h2 className="text-xl font-serif tracking-widest uppercase">
          {isEditing ? t("Editar produto") : t("Novo produto")}
        </h2>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-stone-50 rounded-full transition-colors"
          aria-label={t("Fechar")}
        >
          <X className="w-6 h-6 text-stone-600" />
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12 lg:py-20">
        {isSuccess ? (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-3xl font-serif italic text-stone-800 mb-2">
              {isEditing ? t("Produto atualizado") : t("Produto publicado")}
            </h3>
            <p className="text-stone-500">
              {isEditing
                ? t("As alterações foram salvas no seu anúncio.")
                : t("Seu item já está publicado na coleção.")}
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-12">
            {/* Image Upload Section */}
            <div className="space-y-4">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">{t("Imagens do produto")}</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleSelectImages}
              />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {images.map((img, index) => (
                  <div key={index} className="relative aspect-3/4 bg-stone-100 rounded-sm overflow-hidden group">
                    <img src={img} alt={t("Pré-visualização")} className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500"
                      aria-label={t("Remover foto")}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button 
                  type="button"
                  onClick={handleTriggerImagePicker}
                  disabled={isUploadingImages || images.length >= MAX_PRODUCT_IMAGES}
                  className="aspect-3/4 border-2 border-dashed border-stone-200 rounded-sm flex flex-col items-center justify-center gap-2 text-stone-400 hover:border-stone-400 hover:text-stone-600 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploadingImages ? (
                    <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-700 rounded-full animate-spin" />
                  ) : (
                    <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  )}
                  <span className="text-[10px] uppercase tracking-widest font-medium text-center px-2">
                    {isUploadingImages
                      ? t("Enviando...")
                      : images.length >= MAX_PRODUCT_IMAGES
                        ? t("Limite atingido")
                        : t("Adicionar foto")}
                  </span>
                </button>
              </div>
              <p className="text-xs text-stone-500">
                {t("Fotos enviadas: {count}/{max}", {
                  count: String(images.length),
                  max: String(MAX_PRODUCT_IMAGES),
                })}
              </p>
            </div>

            {/* Details Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">{t("Nome do produto")}</label>
                <input 
                  required
                  type="text"
                  placeholder={t("Ex: Vaso minimalista")}
                  className="w-full bg-transparent border-b border-stone-200 py-3 outline-none focus:border-stone-800 transition-colors font-serif italic text-lg"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">{t("Categoria")}</label>
                <select 
                  required
                  className="w-full bg-transparent border-b border-stone-200 py-3 outline-none focus:border-stone-800 transition-colors text-stone-600 appearance-none cursor-pointer"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  {CATEGORY_VALUES.map((cat) => (
                    <option key={cat} value={cat}>
                      {getCategoryLabel(cat, locale)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">{t("Preço")}</label>
                <input 
                  required
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0,00"
                  className="w-full bg-transparent border-b border-stone-200 py-3 outline-none focus:border-stone-800 transition-colors font-mono"
                  value={formData.price}
                  onFocus={(e) => {
                    setFormData((current) => ({
                      ...current,
                      price: toEditablePriceValue(current.price),
                    }));
                    e.currentTarget.select();
                  }}
                  onBlur={(e) => {
                    const normalized = normalizePriceValue(e.target.value);
                    setFormData((current) => ({
                      ...current,
                      price: normalized,
                    }));
                  }}
                  onChange={(e) => {
                    const nextValue = sanitizePriceDraft(e.target.value);
                    setFormData((current) => ({
                      ...current,
                      price: nextValue,
                    }));
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">
                  {t("Quantidade disponível")}
                </label>
                <input
                  required
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  className="w-full bg-transparent border-b border-stone-200 py-3 outline-none focus:border-stone-800 transition-colors font-mono"
                  value={formData.quantity}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/[^\d]/g, "");
                    setFormData((current) => ({
                      ...current,
                      quantity: digitsOnly,
                    }));
                  }}
                />
              </div>
            </div>

            <input type="hidden" value={formData.latitude} readOnly />
            <input type="hidden" value={formData.longitude} readOnly />

            <div className="space-y-3 border border-stone-200 rounded-sm bg-stone-50/60 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-500">
                {t("Localização do anúncio")}
              </p>
              <p className="text-sm text-stone-500">
                {hasLocationSelected
                  ? t("Localização pronta para publicar.")
                  : t("Nenhuma localização escolhida ainda.")}
              </p>

              <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-8">
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600 hover:text-stone-900 transition-colors"
                >
                  <Navigation className="w-4 h-4" />
                  {t("Usar localização atual")}
                </button>

                <button
                  type="button"
                  onClick={handleOpenMapPicker}
                  className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600 hover:text-stone-900 transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                  {t("Escolher local no mapa")}
                </button>
              </div>
            </div>

            {/* Dynamic Fields */}
            <AnimatePresence mode="wait">
              {isRealEstate && (
                <motion.div 
                  key="real-estate"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-6 bg-stone-50 rounded-sm"
                >
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">{t("Tipo de imóvel")}</label>
                    <input 
                      type="text" placeholder={t("Ex: Casa, cobertura, sobrado")}
                      className="w-full bg-transparent border-b border-stone-200 py-2 outline-none focus:border-stone-800 transition-colors text-sm"
                      value={formData.details.type}
                      onChange={(e) => handleDetailChange('type', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">{t("Área (m²)")}</label>
                    <input 
                      type="text" placeholder={t("Ex: 120")}
                      className="w-full bg-transparent border-b border-stone-200 py-2 outline-none focus:border-stone-800 transition-colors text-sm"
                      value={formData.details.area}
                      onChange={(e) => handleDetailChange('area', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">{t("Quartos")}</label>
                    <input 
                      type="text" placeholder={t("Ex: 3")}
                      className="w-full bg-transparent border-b border-stone-200 py-2 outline-none focus:border-stone-800 transition-colors text-sm"
                      value={formData.details.rooms}
                      onChange={(e) => handleDetailChange('rooms', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">{t("Banheiros")}</label>
                    <input 
                      type="text" placeholder={t("Ex: 2")}
                      className="w-full bg-transparent border-b border-stone-200 py-2 outline-none focus:border-stone-800 transition-colors text-sm"
                      value={formData.details.bathrooms}
                      onChange={(e) => handleDetailChange('bathrooms', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">{t("Vagas")}</label>
                    <input 
                      type="text" placeholder={t("Ex: 1")}
                      className="w-full bg-transparent border-b border-stone-200 py-2 outline-none focus:border-stone-800 transition-colors text-sm"
                      value={formData.details.parking}
                      onChange={(e) => handleDetailChange('parking', e.target.value)}
                    />
                  </div>
                </motion.div>
              )}

              {isVehicle && (
                <motion.div 
                  key="vehicle"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-stone-50 rounded-sm"
                >
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">{t("Marca")}</label>
                    <input 
                      type="text" placeholder={t("Ex: Toyota")}
                      className="w-full bg-transparent border-b border-stone-200 py-2 outline-none focus:border-stone-800 transition-colors text-sm"
                      value={formData.details.brand}
                      onChange={(e) => handleDetailChange('brand', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">{t("Modelo")}</label>
                    <input 
                      type="text" placeholder={t("Ex: Corolla XEi")}
                      className="w-full bg-transparent border-b border-stone-200 py-2 outline-none focus:border-stone-800 transition-colors text-sm"
                      value={formData.details.model}
                      onChange={(e) => handleDetailChange('model', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">{t("Cor")}</label>
                    <input 
                      type="text" placeholder={t("Ex: Prata")}
                      className="w-full bg-transparent border-b border-stone-200 py-2 outline-none focus:border-stone-800 transition-colors text-sm"
                      value={formData.details.color}
                      onChange={(e) => handleDetailChange('color', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">{t("Ano")}</label>
                    <input 
                      type="text" placeholder={t("Ex: 2022")}
                      className="w-full bg-transparent border-b border-stone-200 py-2 outline-none focus:border-stone-800 transition-colors text-sm"
                      value={formData.details.year}
                      onChange={(e) => handleDetailChange('year', e.target.value)}
                    />
                  </div>
                </motion.div>
              )}

              {isElectronicsOrFashion && (
                <motion.div 
                  key="electronics"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-6 bg-stone-50 rounded-sm"
                >
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">{t("Marca")}</label>
                    <input 
                      type="text" placeholder={t("Ex: Nike, Apple")}
                      className="w-full bg-transparent border-b border-stone-200 py-2 outline-none focus:border-stone-800 transition-colors text-sm"
                      value={formData.details.brand}
                      onChange={(e) => handleDetailChange('brand', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">{t("Modelo / Variação")}</label>
                    <input 
                      type="text" placeholder={t("Ex: Air Zoom, iPhone 13")}
                      className="w-full bg-transparent border-b border-stone-200 py-2 outline-none focus:border-stone-800 transition-colors text-sm"
                      value={formData.details.model}
                      onChange={(e) => handleDetailChange('model', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">{t("Cor")}</label>
                    <input 
                      type="text" placeholder={t("Ex: Azul, Preto")}
                      className="w-full bg-transparent border-b border-stone-200 py-2 outline-none focus:border-stone-800 transition-colors text-sm"
                      value={formData.details.color}
                      onChange={(e) => handleDetailChange('color', e.target.value)}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">{t("Descrição")}</label>
              <textarea 
                required
                rows={4}
                placeholder={t("Descreva o acabamento, materiais e diferenciais do produto...")}
                className="w-full bg-transparent border border-stone-200 p-4 outline-none focus:border-stone-800 transition-colors text-stone-600 resize-none rounded-sm"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <button 
              disabled={isPublishing || isUploadingImages}
              type="submit"
              className="w-full bg-stone-900 text-white py-6 text-xs uppercase tracking-[0.3em] font-bold flex items-center justify-center gap-3 hover:bg-black transition-all disabled:bg-stone-400"
            >
              {isPublishing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isEditing ? t("Salvando...") : t("Publicando...")}
                </>
              ) : (
                <>
                  {isEditing ? t("Salvar alterações") : t("Publicar produto")}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {errorMessage && (
              <p className="text-sm text-red-500">{errorMessage}</p>
            )}
          </form>
        )}
      </div>

      <AnimatePresence>
        {isMapPickerOpen && (
          <LeafletMapPicker
            center={mapCenter}
            selectedPoint={selectedMapPoint}
            onSelectPoint={setSelectedMapPoint}
            onClose={handleCloseMapPicker}
            onConfirm={handleConfirmMapLocation}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
