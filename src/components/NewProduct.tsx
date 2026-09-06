import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Navigation,
  MapPin,
  Star,
} from "lucide-react";
import {
  api,
  type CreateProductInput,
  type EstablishmentDto,
  type NewProductDraftDefaults,
  type StorefrontSectionDto,
  type TaxonomySuggestionDto,
} from "../lib/api";
import { type Product } from "./ProductCard";
import LeafletMapPicker from "./LeafletMapPicker";
import { useI18n } from "../i18n/provider";
import {
  isNegotiablePrice,
  parsePriceToNumber,
} from "../lib/currency";
import { getCompatibleImageUrl } from "../lib/product-images";

interface NewProductProps {
  onClose: () => void;
  onPublish: (product: CreateProductInput) => Promise<void>;
  mode?: "create" | "edit";
  initialProduct?: Product | null;
  establishment?: EstablishmentDto | null;
  sections?: StorefrontSectionDto[];
  onCreateSection?: (name: string) => Promise<StorefrontSectionDto>;
  onDeleteSection?: (sectionId: number) => Promise<void>;
}

type FormState = {
  name: string;
  category: string;
  family: string;
  subcategory: string;
  brand: string;
  attributeValue: string;
  attributeUnit: string;
  sectionId: string;
  price: string;
  isPriceNegotiable: boolean;
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
type LocationSource = "current" | "map" | null;
type DraftSaveFeedback = {
  type: "success" | "error";
  message: string;
};

const MAX_COORDINATE_LATITUDE = 90;
const MAX_COORDINATE_LONGITUDE = 180;
const DEFAULT_MAP_CENTER: GeoPoint = {
  latitude: 41.6081,
  longitude: 12.5156,
};
const MAX_PRODUCT_IMAGES = 10;
const EURO_AMOUNT_FORMATTER = new Intl.NumberFormat("it-IT", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const GENERIC_PRODUCT_CATEGORY = "Prodotti e servizi";

function normalizeTaxonomyLabel(value: string): string {
  return String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isUsableTaxonomyLabel(value: string): boolean {
  const label = String(value ?? "").trim();
  const key = normalizeTaxonomyLabel(label);
  if (!label || !key || key.length < 2) {
    return false;
  }
  return !(
    /^www(?:\.|$)/i.test(label) ||
    /^https?:\/\//i.test(label) ||
    /[a-z0-9][a-z0-9-]*\.(?:com|it|net|org|io|app|shop|store)(?:\b|\/)/i.test(label.toLowerCase()) ||
    ["www", "http", "https"].includes(key)
  );
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
  const normalizedLatitude = String(latitude ?? "").trim().replace(",", ".");
  const normalizedLongitude = String(longitude ?? "").trim().replace(",", ".");
  if (!normalizedLatitude || !normalizedLongitude) {
    return null;
  }
  return toGeoPoint(Number(normalizedLatitude), Number(normalizedLongitude));
}

function getInitialLocationPoint(product: Product | null | undefined): GeoPoint | null {
  if (!product) {
    return null;
  }

  return toGeoPoint(Number(product.latitude), Number(product.longitude));
}

function getEstablishmentLocationPoint(establishment: EstablishmentDto | null | undefined): GeoPoint | null {
  if (!establishment) {
    return null;
  }
  return toGeoPoint(Number(establishment.latitude), Number(establishment.longitude));
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
      category: GENERIC_PRODUCT_CATEGORY,
      family: "",
      subcategory: "",
      brand: "",
      attributeValue: "",
      attributeUnit: "",
      sectionId: "",
      price: "",
      isPriceNegotiable: false,
      quantity: "1",
      latitude: "",
      longitude: "",
      description: "",
      details: {},
    };
  }

  const hasNegotiablePrice = Boolean(product.priceNegotiable) || isNegotiablePrice(product.price ?? "");

  return {
    name: product.name ?? "",
    category: product.category ?? GENERIC_PRODUCT_CATEGORY,
    family: String(product.details?.family ?? ""),
    subcategory: String(product.details?.subcategory ?? ""),
    brand: String(product.details?.brand ?? ""),
    attributeValue: String(product.details?.attributeValue ?? ""),
    attributeUnit: String(product.details?.attributeUnit ?? ""),
    sectionId: product.sectionId ? String(product.sectionId) : "",
    price: hasNegotiablePrice ? "" : normalizePriceValue(product.price ?? ""),
    isPriceNegotiable: hasNegotiablePrice,
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
    details: {},
  };
}

function buildDraftDefaultsFromForm(formData: FormState): NewProductDraftDefaults {
  return {
    name: String(formData.name ?? "").trim(),
    category: GENERIC_PRODUCT_CATEGORY,
    latitude: String(formData.latitude ?? "").trim(),
    longitude: String(formData.longitude ?? "").trim(),
    description: String(formData.description ?? "").trim(),
    details: {},
  };
}

function applyDraftDefaultsToForm(
  currentForm: FormState,
  defaults: NewProductDraftDefaults,
): FormState {
  return {
    ...currentForm,
    name: String(defaults.name ?? "").trim(),
    category: currentForm.category || GENERIC_PRODUCT_CATEGORY,
    family: currentForm.family,
    subcategory: currentForm.subcategory,
    brand: currentForm.brand,
    attributeValue: currentForm.attributeValue,
    attributeUnit: currentForm.attributeUnit,
    latitude: currentForm.latitude,
    longitude: currentForm.longitude,
    description: String(defaults.description ?? "").trim(),
    details: {},
  };
}

function hasMeaningfulDraftDefaults(defaults: NewProductDraftDefaults): boolean {
  if (
    String(defaults.name ?? "").trim() ||
    String(defaults.latitude ?? "").trim() ||
    String(defaults.longitude ?? "").trim() ||
    String(defaults.description ?? "").trim()
  ) {
    return true;
  }

  return false;
}

function areDraftDefaultsEqual(
  left: NewProductDraftDefaults,
  right: NewProductDraftDefaults,
): boolean {
  const normalizeDetails = (details: Record<string, string>) =>
    Object.fromEntries(
      Object.entries(details)
        .map(([rawKey, rawValue]) => [String(rawKey).trim().toLowerCase(), String(rawValue ?? "").trim()])
        .filter(([key, value]) => key.length > 0 && value.length > 0)
        .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey)),
    );

  const normalizedLeft = {
    name: String(left.name ?? "").trim(),
    category: GENERIC_PRODUCT_CATEGORY,
    latitude: String(left.latitude ?? "").trim(),
    longitude: String(left.longitude ?? "").trim(),
    description: String(left.description ?? "").trim(),
    details: normalizeDetails(left.details ?? {}),
  };
  const normalizedRight = {
    name: String(right.name ?? "").trim(),
    category: GENERIC_PRODUCT_CATEGORY,
    latitude: String(right.latitude ?? "").trim(),
    longitude: String(right.longitude ?? "").trim(),
    description: String(right.description ?? "").trim(),
    details: normalizeDetails(right.details ?? {}),
  };

  return JSON.stringify(normalizedLeft) === JSON.stringify(normalizedRight);
}

export default function NewProduct({
  onClose,
  onPublish,
  mode = "create",
  initialProduct = null,
  establishment = null,
  sections = [],
  onCreateSection,
  onDeleteSection,
}: NewProductProps) {
  const { t } = useI18n();
  const initialLocation = React.useMemo(
    () => getInitialLocationPoint(initialProduct) ?? getEstablishmentLocationPoint(establishment),
    [establishment, initialProduct],
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
  const [uploadPreviewUrls, setUploadPreviewUrls] = React.useState<string[]>([]);
  const [uploadBatchTotal, setUploadBatchTotal] = React.useState(0);
  const [uploadBatchCompleted, setUploadBatchCompleted] = React.useState(0);
  const [isCancellingUpload, setIsCancellingUpload] = React.useState(false);
  const uploadPreviewUrlsRef = React.useRef<string[]>([]);
  const uploadAbortControllerRef = React.useRef<AbortController | null>(null);
  const uploadCancelRequestedRef = React.useRef(false);
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
  const [locationSource, setLocationSource] = React.useState<LocationSource>(null);
  const [savedDraftDefaults, setSavedDraftDefaults] = React.useState<NewProductDraftDefaults | null>(null);
  const [isDraftSaveChecked, setIsDraftSaveChecked] = React.useState(false);
  const [isSavingDraftDefaults, setIsSavingDraftDefaults] = React.useState(false);
  const [isLoadingDraftDefaults, setIsLoadingDraftDefaults] = React.useState(false);
  const [draftSaveFeedback, setDraftSaveFeedback] = React.useState<DraftSaveFeedback | null>(null);
  const [newSectionName, setNewSectionName] = React.useState("");
  const [isCreatingSection, setIsCreatingSection] = React.useState(false);
  const [isDeletingSectionId, setIsDeletingSectionId] = React.useState<number | null>(null);
  const [productCategorySuggestions, setProductCategorySuggestions] = React.useState<TaxonomySuggestionDto[]>([]);
  const hasAutoUncheckedDraftSaveRef = React.useRef(false);

  React.useEffect(() => {
    uploadPreviewUrlsRef.current = uploadPreviewUrls;
  }, [uploadPreviewUrls]);

  React.useEffect(() => {
    return () => {
      for (const previewUrl of uploadPreviewUrlsRef.current) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, []);

  const clearUploadPreviewUrls = React.useCallback(() => {
    setUploadPreviewUrls((current) => {
      for (const previewUrl of current) {
        URL.revokeObjectURL(previewUrl);
      }
      return [];
    });
  }, []);

  React.useEffect(() => {
    setFormData(buildInitialFormState(initialProduct));
    setImages(normalizeInitialImages(initialProduct));
    uploadCancelRequestedRef.current = false;
    uploadAbortControllerRef.current?.abort();
    uploadAbortControllerRef.current = null;
    setIsUploadingImages(false);
    setIsCancellingUpload(false);
    setUploadBatchTotal(0);
    setUploadBatchCompleted(0);
    clearUploadPreviewUrls();
    setIsSuccess(false);
    setErrorMessage("");
    setIsMapPickerOpen(false);
    setLocationSource(null);
    setSavedDraftDefaults(null);
    setIsDraftSaveChecked(false);
    setIsSavingDraftDefaults(false);
    setIsLoadingDraftDefaults(false);
    setDraftSaveFeedback(null);

    const nextLocation = getInitialLocationPoint(initialProduct);
    setSelectedMapPoint(nextLocation);
    setMapCenter(nextLocation ?? DEFAULT_MAP_CENTER);
  }, [clearUploadPreviewUrls, initialProduct]);

  React.useEffect(() => {
    return () => {
      uploadCancelRequestedRef.current = true;
      uploadAbortControllerRef.current?.abort();
      uploadAbortControllerRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    let isMounted = true;
    if (isEditing) {
      return () => {
        isMounted = false;
      };
    }

    setIsLoadingDraftDefaults(true);
    void api
      .getNewProductDraftDefaults()
      .then((defaults) => {
        if (!isMounted || !defaults || !hasMeaningfulDraftDefaults(defaults)) {
          return;
        }

        setFormData((current) => applyDraftDefaultsToForm(current, defaults));
        setSavedDraftDefaults(defaults);
        setIsDraftSaveChecked(true);
        setDraftSaveFeedback(null);

        const savedPoint = getEstablishmentLocationPoint(establishment)
          ? null
          : parseCoordinateStrings(defaults.latitude, defaults.longitude);
        if (savedPoint) {
          setMapCenter(savedPoint);
          setSelectedMapPoint(savedPoint);
        }
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }
        setDraftSaveFeedback({
          type: "error",
          message: "Falha ao carregar as informações salvas.",
        });
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingDraftDefaults(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [establishment, isEditing]);

  const selectedSection = React.useMemo(
    () => sections.find((section) => String(section.id) === String(formData.sectionId)) ?? null,
    [formData.sectionId, sections],
  );
  const hasLocationSelected = Boolean(parseCoordinateStrings(formData.latitude, formData.longitude));
  const uploadBatchProgress = React.useMemo(() => {
    if (uploadBatchTotal <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((uploadBatchCompleted / uploadBatchTotal) * 100));
  }, [uploadBatchCompleted, uploadBatchTotal]);
  const draftDefaultsFromForm = React.useMemo(
    () => buildDraftDefaultsFromForm(formData),
    [formData],
  );
  const hasDraftDefaultsPendingSave = React.useMemo(() => {
    if (!savedDraftDefaults) {
      return false;
    }
    return !areDraftDefaultsEqual(savedDraftDefaults, draftDefaultsFromForm);
  }, [savedDraftDefaults, draftDefaultsFromForm]);

  React.useEffect(() => {
    if (isEditing || formData.sectionId || sections.length === 0) {
      return;
    }
    setFormData((current) => ({
      ...current,
      sectionId: String(sections[0].id),
      family: current.family || sections[0].name || "",
    }));
  }, [formData.sectionId, isEditing, sections]);

  React.useEffect(() => {
    let cancelled = false;
    const search = formData.category === GENERIC_PRODUCT_CATEGORY ? "" : formData.category;
    void api
      .getProductCategorySuggestions({
        businessCategory: establishment?.category,
        search,
      })
      .then((suggestions) => {
        if (!cancelled) {
          setProductCategorySuggestions(suggestions.slice(0, 8));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProductCategorySuggestions([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [establishment?.category, formData.category]);

  React.useEffect(() => {
    if (isEditing || hasLocationSelected) {
      return;
    }
    const establishmentPoint = getEstablishmentLocationPoint(establishment);
    if (!establishmentPoint) {
      return;
    }
    setFormData((current) => ({
      ...current,
      latitude: establishmentPoint.latitude.toFixed(6),
      longitude: establishmentPoint.longitude.toFixed(6),
    }));
    setMapCenter(establishmentPoint);
    setSelectedMapPoint(establishmentPoint);
  }, [establishment, hasLocationSelected, isEditing]);

  React.useEffect(() => {
    if (!hasDraftDefaultsPendingSave) {
      hasAutoUncheckedDraftSaveRef.current = false;
      return;
    }
    if (isDraftSaveChecked && !hasAutoUncheckedDraftSaveRef.current) {
      hasAutoUncheckedDraftSaveRef.current = true;
      setIsDraftSaveChecked(false);
    }
  }, [hasDraftDefaultsPendingSave, isDraftSaveChecked]);

  React.useEffect(() => {
    if (!hasDraftDefaultsPendingSave) {
      return;
    }
    setDraftSaveFeedback((current) => (current?.type === "success" ? null : current));
  }, [hasDraftDefaultsPendingSave]);

  const handleRemoveImage = (index: number) => {
    setImages((current) => current.filter((_, i) => i !== index));
  };

  const reorderImages = React.useCallback((sourceIndex: number, targetIndex: number) => {
    setImages((current) => {
      if (
        sourceIndex === targetIndex ||
        sourceIndex < 0 ||
        targetIndex < 0 ||
        sourceIndex >= current.length ||
        targetIndex >= current.length
      ) {
        return current;
      }

      const next = [...current];
      const [movedImage] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, movedImage);
      return next;
    });
  }, []);

  const handleMoveImageLeft = (index: number) => {
    reorderImages(index, index - 1);
  };

  const handleMoveImageRight = (index: number) => {
    reorderImages(index, index + 1);
  };

  const handleSetImageAsCover = (index: number) => {
    reorderImages(index, 0);
  };

  const handleTriggerImagePicker = () => {
    fileInputRef.current?.click();
  };

  const handleCancelImageUpload = React.useCallback(() => {
    if (!isUploadingImages) {
      return;
    }
    uploadCancelRequestedRef.current = true;
    setIsCancellingUpload(true);
    uploadAbortControllerRef.current?.abort();
  }, [isUploadingImages]);

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
    const nextUploadPreviewUrls = imageFiles.map((file) => URL.createObjectURL(file));
    uploadCancelRequestedRef.current = false;
    setIsCancellingUpload(false);
    setUploadPreviewUrls(nextUploadPreviewUrls);
    setUploadBatchTotal(imageFiles.length);
    setUploadBatchCompleted(0);
    setIsUploadingImages(true);

    const uploaded: string[] = [];
    try {
      for (const file of imageFiles) {
        if (uploadCancelRequestedRef.current) {
          break;
        }

        const uploadController = new AbortController();
        uploadAbortControllerRef.current = uploadController;
        const response = await api.uploadProductImage(file, {
          signal: uploadController.signal,
        });
        const imageUrl = getCompatibleImageUrl(String(response.url ?? "").trim());
        if (!imageUrl) {
          throw new Error(t("Upload concluído sem URL de imagem."));
        }
        uploaded.push(imageUrl);
        setUploadBatchCompleted(uploaded.length);
        uploadAbortControllerRef.current = null;
      }

      if (uploaded.length > 0) {
        setImages((current) => [...current, ...uploaded]);
      }
    } catch (error) {
      const isAbortError =
        error instanceof DOMException
          ? error.name === "AbortError"
          : error instanceof Error
            ? error.name === "AbortError"
            : false;
      if (uploaded.length > 0) {
        setImages((current) => [...current, ...uploaded]);
      }
      if (uploadCancelRequestedRef.current || isAbortError) {
        setErrorMessage(t("Envio de fotos cancelado."));
      } else {
        const message =
          error instanceof Error ? error.message : t("Falha ao enviar imagens para o Cloudinary.");
        setErrorMessage(message);
      }
    } finally {
      uploadAbortControllerRef.current = null;
      uploadCancelRequestedRef.current = false;
      setIsUploadingImages(false);
      setIsCancellingUpload(false);
      setUploadBatchTotal(0);
      setUploadBatchCompleted(0);
      clearUploadPreviewUrls();
    }
  };

  const handleSaveDraftDefaults = async () => {
    if (!isDraftSaveChecked) {
      return;
    }

    const defaultsToSave = (() => {
      const baseDefaults = buildDraftDefaultsFromForm(formData);
      const locationPoint =
        selectedMapPoint ?? parseCoordinateStrings(formData.latitude, formData.longitude);
      if (!locationPoint) {
        return baseDefaults;
      }
      return {
        ...baseDefaults,
        latitude: locationPoint.latitude.toFixed(6),
        longitude: locationPoint.longitude.toFixed(6),
      };
    })();

    setDraftSaveFeedback(null);
    setIsSavingDraftDefaults(true);

    try {
      const savedDefaults = await api.updateNewProductDraftDefaults(defaultsToSave);
      setSavedDraftDefaults(savedDefaults);
      setFormData((current) => ({
        ...current,
        latitude: savedDefaults.latitude,
        longitude: savedDefaults.longitude,
      }));
      setIsDraftSaveChecked(true);
      setDraftSaveFeedback({
        type: "success",
        message: t("Informações salvas na sua conta."),
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("Falha ao salvar as informações rápidas.");
      setDraftSaveFeedback({
        type: "error",
        message,
      });
    } finally {
      setIsSavingDraftDefaults(false);
    }
  };

  const handleCreateSection = async () => {
    const name = newSectionName.trim();
    if (!name || !onCreateSection) {
      return;
    }
    if (!isUsableTaxonomyLabel(name)) {
      setErrorMessage(t("Informe uma sezione válida, sem links ou texto inválido."));
      return;
    }
    setIsCreatingSection(true);
    setErrorMessage("");
    try {
      const section = await onCreateSection(name);
      setFormData((current) => ({ ...current, sectionId: String(section.id) }));
      setNewSectionName("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t("Falha ao salvar sezione."));
    } finally {
      setIsCreatingSection(false);
    }
  };

  const handleDeleteSection = async () => {
    const selectedSectionId = Number(formData.sectionId);
    if (!Number.isInteger(selectedSectionId) || selectedSectionId <= 0 || !onDeleteSection) {
      return;
    }
    setIsDeletingSectionId(selectedSectionId);
    setErrorMessage("");
    try {
      await onDeleteSection(selectedSectionId);
      setFormData((current) => ({
        ...current,
        sectionId: "",
      }));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t("Falha ao excluir sezione."));
    } finally {
      setIsDeletingSectionId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (isUploadingImages) {
      setErrorMessage(t("Aguarde o envio das fotos terminar ou cancele o envio para publicar."));
      return;
    }

    const normalizedName = formData.name.trim();
    const selectedSectionId = Number(formData.sectionId);
    const normalizedCategory =
      formData.category.trim() ||
      GENERIC_PRODUCT_CATEGORY;
    const normalizedDescription = formData.description.trim();
    let latitude = Number(formData.latitude);
    let longitude = Number(formData.longitude);
    const parsedPrice = parsePriceToNumber(formData.price);
    const parsedQuantity = Number(formData.quantity);

    if (!normalizedName) {
      setErrorMessage(t("Nome do produto é obrigatório."));
      return;
    }
    if (!formData.category.trim() || formData.category === GENERIC_PRODUCT_CATEGORY) {
      setErrorMessage(t("Categoria prodotto é obbligatoria."));
      return;
    }
    if (!isUsableTaxonomyLabel(normalizedCategory)) {
      setErrorMessage(t("Informe uma categoria produto válida, sem links ou texto inválido."));
      return;
    }
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      const lookupQuery = [
        establishment?.address,
        establishment?.city,
        "Italia",
      ]
        .map((part) => String(part ?? "").trim())
        .filter(Boolean)
        .join(", ");
      try {
        const geocoded = lookupQuery ? await api.geocodeLocation(lookupQuery) : null;
        latitude = geocoded?.latitude ?? DEFAULT_MAP_CENTER.latitude;
        longitude = geocoded?.longitude ?? DEFAULT_MAP_CENTER.longitude;
        setFormData((current) => ({
          ...current,
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6),
        }));
        setMapCenter({ latitude, longitude });
        setSelectedMapPoint({ latitude, longitude });
      } catch {
        latitude = DEFAULT_MAP_CENTER.latitude;
        longitude = DEFAULT_MAP_CENTER.longitude;
        setFormData((current) => ({
          ...current,
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6),
        }));
        setMapCenter({ latitude, longitude });
        setSelectedMapPoint({ latitude, longitude });
      }
    }
    if (latitude < -90 || latitude > 90) {
      setErrorMessage(t("Latitude deve estar entre -90 e 90."));
      return;
    }
    if (longitude < -180 || longitude > 180) {
      setErrorMessage(t("Longitude deve estar entre -180 e 180."));
      return;
    }
    if (!formData.isPriceNegotiable && (parsedPrice === null || parsedPrice <= 0)) {
      setErrorMessage(t("Informe um preço válido em euro."));
      return;
    }
    if (!Number.isFinite(parsedQuantity) || !Number.isInteger(parsedQuantity) || parsedQuantity < 0) {
      setErrorMessage(t("Informe uma disponibilidade válida."));
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
      const normalizedPrice = formData.isPriceNegotiable
        ? "0.00"
        : parsedPrice !== null
          ? parsedPrice.toFixed(2)
          : "";
      const taxonomyDetails = Object.fromEntries(
        Object.entries({
          family: formData.family.trim(),
          subcategory: formData.subcategory.trim(),
          brand: formData.brand.trim(),
          attributeValue: formData.attributeValue.trim(),
          attributeUnit: formData.attributeUnit.trim(),
        }).filter(([, value]) => value.length > 0),
      );
      const newProduct: CreateProductInput = {
        name: normalizedName,
        category: normalizedCategory,
        sectionId:
          Number.isInteger(selectedSectionId) && selectedSectionId > 0
            ? selectedSectionId
            : null,
        price: normalizedPrice,
        priceNegotiable: formData.isPriceNegotiable,
        quantity: parsedQuantity,
        latitude,
        longitude,
        image: images[0],
        images: [...images],
        description: normalizedDescription,
        details: taxonomyDetails,
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
        setLocationSource("current");
      },
      (message) => {
        setErrorMessage(message);
      },
    );
  };

  const handleOpenMapPicker = () => {
    setErrorMessage("");
    const savedLocation =
      parseCoordinateStrings(formData.latitude, formData.longitude) ??
      getEstablishmentLocationPoint(establishment);
    setMapCenter(savedLocation ?? DEFAULT_MAP_CENTER);
    setSelectedMapPoint(savedLocation);
    setIsMapPickerOpen(true);
  };

  const handleCloseMapPicker = () => {
    const savedLocation = parseCoordinateStrings(formData.latitude, formData.longitude);
    setSelectedMapPoint(savedLocation);
    if (savedLocation) {
      setMapCenter(savedLocation);
    }
    setIsMapPickerOpen(false);
  };

  const handleConfirmMapLocation = (point: GeoPoint) => {
    setSelectedMapPoint(point);

    setFormData((current) => ({
      ...current,
      latitude: point.latitude.toFixed(6),
      longitude: point.longitude.toFixed(6),
    }));
    setMapCenter(point);
    setLocationSource("map");
    setIsMapPickerOpen(false);
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

      <AnimatePresence>
        {isUploadingImages && uploadBatchTotal > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="sticky top-20 z-20 border-b border-stone-200 bg-white/95 backdrop-blur-sm"
          >
            <div className="max-w-3xl mx-auto px-6 py-2.5 flex items-center gap-3">
              <div className="min-w-0 grow">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-stone-700">
                    {t("Enviando fotos...")}
                  </p>
                  <p className="text-[10px] text-stone-500 shrink-0">
                    {t("Fotos concluídas: {done}/{total}", {
                      done: uploadBatchCompleted,
                      total: uploadBatchTotal,
                    })}
                  </p>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-stone-200 overflow-hidden">
                  <motion.div
                    className="h-full bg-stone-800"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadBatchProgress}%` }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleCancelImageUpload}
                disabled={isCancellingUpload}
                className="shrink-0 px-2.5 py-1.5 border border-stone-300 text-[10px] uppercase tracking-[0.14em] font-bold text-stone-700 hover:border-stone-700 hover:text-stone-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isCancellingUpload ? t("Cancelando...") : t("Cancelar envio")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">{t("Immagini prodotto / servizio")}</label>
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
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full bg-black/70 text-white text-[9px] uppercase tracking-[0.12em]">
                      {index === 0 ? t("Capa") : index + 1}
                    </div>
                    <button 
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500"
                      aria-label={t("Remover foto")}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <div className="absolute left-1.5 right-1.5 bottom-1.5 flex items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveImageLeft(index)}
                        disabled={index === 0}
                        className="h-7 w-7 flex items-center justify-center rounded-full bg-white/85 text-stone-700 backdrop-blur-sm transition-colors hover:bg-white disabled:opacity-35 disabled:cursor-not-allowed"
                        aria-label={t("Mover foto para a esquerda")}
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetImageAsCover(index)}
                        disabled={index === 0}
                        className="h-7 w-7 flex items-center justify-center rounded-full bg-white/85 text-amber-600 backdrop-blur-sm transition-colors hover:bg-white disabled:opacity-35 disabled:cursor-not-allowed"
                        aria-label={t("Definir como capa")}
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveImageRight(index)}
                        disabled={index === images.length - 1}
                        className="h-7 w-7 flex items-center justify-center rounded-full bg-white/85 text-stone-700 backdrop-blur-sm transition-colors hover:bg-white disabled:opacity-35 disabled:cursor-not-allowed"
                        aria-label={t("Mover foto para a direita")}
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
              {images.length > 1 && (
                <p className="text-xs text-stone-500">
                  {t("A primeira foto será usada como capa do item.")}
                </p>
              )}
            </div>

            {/* Details Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">{t("Nome prodotto / servizio")}</label>
                <input 
                  required
                  type="text"
                  placeholder={t("Ex: Margherita, taglio uomo, tavolo artigianale")}
                  className="w-full bg-transparent border-b border-stone-200 py-3 outline-none focus:border-stone-800 transition-colors font-serif italic text-lg"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">{t("Sezione")}</label>
                <select
                  className="w-full bg-transparent border-b border-stone-200 py-3 outline-none focus:border-stone-800 transition-colors text-stone-600 appearance-none cursor-pointer"
                  value={formData.sectionId}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      sectionId: e.target.value,
                    });
                  }}
                >
                  <option value="">{t("Senza sezione")}</option>
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>
                {selectedSection && onDeleteSection && (
                  <button
                    type="button"
                    onClick={() => void handleDeleteSection()}
                    disabled={isDeletingSectionId === selectedSection.id}
                    className="mt-2 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-red-500 transition-colors hover:text-red-700 disabled:opacity-40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {isDeletingSectionId === selectedSection.id ? t("Excluindo...") : t("Elimina sezione")}
                  </button>
                )}
                {onCreateSection && (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={newSectionName}
                      onChange={(event) => setNewSectionName(event.target.value)}
                      placeholder={t("Nuova sezione")}
                      className="min-w-0 flex-1 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-stone-500"
                    />
                    <button
                      type="button"
                      onClick={() => void handleCreateSection()}
                      disabled={isCreatingSection || !isUsableTaxonomyLabel(newSectionName)}
                      className="inline-flex h-10 items-center justify-center rounded-lg border border-stone-300 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-700 disabled:opacity-40"
                    >
                      {isCreatingSection ? t("Salvando...") : t("Crea")}
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">{t("Famiglia")}</label>
                <input
                  type="text"
                  placeholder={t("Ex: Bevande, Servizi, Arredamento")}
                  className="w-full bg-transparent border-b border-stone-200 py-3 outline-none focus:border-stone-800 transition-colors text-stone-700"
                  value={formData.family}
                  onChange={(e) => setFormData({ ...formData, family: e.target.value })}
                  list="product-family-suggestions"
                />
                <datalist id="product-family-suggestions">
                  {sections.map((section) => (
                    <option key={section.id} value={section.name} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">{t("Categoria prodotto")}</label>
                <input
                  required
                  type="text"
                  placeholder={t("Ex: Birra, Taglio, Sedie")}
                  className="w-full bg-transparent border-b border-stone-200 py-3 outline-none focus:border-stone-800 transition-colors text-stone-700"
                  value={formData.category === GENERIC_PRODUCT_CATEGORY ? "" : formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value || GENERIC_PRODUCT_CATEGORY,
                    })
                  }
                  list="product-category-suggestions"
                />
                <datalist id="product-category-suggestions">
                  {productCategorySuggestions.map((suggestion) => (
                    <option key={suggestion.key} value={suggestion.label} />
                  ))}
                </datalist>
                {formData.category.trim() && formData.category !== GENERIC_PRODUCT_CATEGORY && (
                  <p className="text-[11px] text-stone-400">
                    {productCategorySuggestions.some(
                      (suggestion) =>
                        suggestion.label.localeCompare(formData.category, undefined, {
                          sensitivity: "accent",
                        }) === 0,
                    )
                      ? t("Categoria già presente nella tassonomia.")
                      : t('+ Crea "{value}"', { value: formData.category.trim() })}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">{t("Sottocategoria")}</label>
                <input
                  type="text"
                  placeholder={t("Ex: Lager, taglio uomo, sedie da ufficio")}
                  className="w-full bg-transparent border-b border-stone-200 py-3 outline-none focus:border-stone-800 transition-colors text-stone-700"
                  value={formData.subcategory}
                  onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">{t("Marca")}</label>
                <input
                  type="text"
                  placeholder={t("Ex: Heineken")}
                  className="w-full bg-transparent border-b border-stone-200 py-3 outline-none focus:border-stone-800 transition-colors text-stone-700"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-[1fr_0.7fr] gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">{t("Attributo")}</label>
                  <input
                    type="text"
                    placeholder={t("Ex: 330, XL, rosso")}
                    className="w-full bg-transparent border-b border-stone-200 py-3 outline-none focus:border-stone-800 transition-colors text-stone-700"
                    value={formData.attributeValue}
                    onChange={(e) => setFormData({ ...formData, attributeValue: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">{t("Unità")}</label>
                  <input
                    type="text"
                    placeholder={t("ml")}
                    className="w-full bg-transparent border-b border-stone-200 py-3 outline-none focus:border-stone-800 transition-colors text-stone-700"
                    value={formData.attributeUnit}
                    onChange={(e) => setFormData({ ...formData, attributeUnit: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">{t("Preço")}</label>
                <input 
                  required={!formData.isPriceNegotiable}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  disabled={formData.isPriceNegotiable}
                  placeholder={formData.isPriceNegotiable ? t("Preço será definido na negociação") : "0,00"}
                  className={`w-full bg-transparent border-b border-stone-200 py-3 outline-none focus:border-stone-800 transition-colors ${
                    formData.isPriceNegotiable ? "text-stone-400 italic" : "font-mono"
                  }`}
                  value={formData.price}
                  onFocus={(e) => {
                    if (formData.isPriceNegotiable) {
                      return;
                    }
                    setFormData((current) => ({
                      ...current,
                      price: toEditablePriceValue(current.price),
                    }));
                    e.currentTarget.select();
                  }}
                  onBlur={(e) => {
                    if (formData.isPriceNegotiable) {
                      return;
                    }
                    const normalized = normalizePriceValue(e.target.value);
                    setFormData((current) => ({
                      ...current,
                      price: normalized,
                    }));
                  }}
                  onChange={(e) => {
                    if (formData.isPriceNegotiable) {
                      return;
                    }
                    const nextValue = sanitizePriceDraft(e.target.value);
                    setFormData((current) => ({
                      ...current,
                      price: nextValue,
                    }));
                  }}
                />
                <label className="flex items-center gap-2 text-xs text-stone-500">
                  <input
                    type="checkbox"
                    checked={formData.isPriceNegotiable}
                    onChange={(event) => {
                      const shouldSetNegotiable = event.target.checked;
                      setFormData((current) => ({
                        ...current,
                        isPriceNegotiable: shouldSetNegotiable,
                        price: shouldSetNegotiable ? "" : current.price,
                      }));
                    }}
                  />
                  <span>{t("Publicar como a negociar (não mostrar preço)")}</span>
                </label>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">
                  {t("Disponibilità")}
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((current) => ({
                      ...current,
                      quantity: current.quantity === "0" ? "1" : "0",
                    }))
                  }
                  className={`flex w-full items-center justify-between border-b py-3 text-left transition-colors ${
                    formData.quantity === "0"
                      ? "border-stone-200 text-stone-400"
                      : "border-stone-800 text-stone-800"
                  }`}
                >
                  <span className="text-sm">
                    {formData.quantity === "0" ? t("Non disponibile") : t("Disponibile")}
                  </span>
                  <span
                    className={`h-5 w-9 rounded-full p-0.5 transition-colors ${
                      formData.quantity === "0" ? "bg-stone-200" : "bg-stone-900"
                    }`}
                  >
                    <span
                      className={`block h-4 w-4 rounded-full bg-white transition-transform ${
                        formData.quantity === "0" ? "translate-x-0" : "translate-x-4"
                      }`}
                    />
                  </span>
                </button>
              </div>
            </div>

            <input type="hidden" value={formData.latitude} readOnly />
            <input type="hidden" value={formData.longitude} readOnly />

            <div className="space-y-3 border border-stone-200 rounded-sm bg-stone-50/60 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-500">
                {t("Posizione attività")}
              </p>
              <p className="text-sm text-stone-500">
                {hasLocationSelected
                  ? t("Este item usará a posição da sua attività.")
                  : t("Nenhuma posição definida para a attività.")}
              </p>

              <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-8">
                {establishment && getEstablishmentLocationPoint(establishment) && (
                  <button
                    type="button"
                    onClick={() => {
                      const point = getEstablishmentLocationPoint(establishment);
                      if (!point) {
                        return;
                      }
                      setFormData((current) => ({
                        ...current,
                        latitude: point.latitude.toFixed(6),
                        longitude: point.longitude.toFixed(6),
                      }));
                      setMapCenter(point);
                      setSelectedMapPoint(point);
                      setLocationSource(null);
                    }}
                    className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600 transition-colors hover:text-stone-900"
                  >
                    <MapPin className="w-4 h-4" />
                    {t("Usar posição da attività")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className={`inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold transition-colors ${
                    locationSource === "current"
                      ? "text-emerald-600"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  <Navigation className="w-4 h-4" />
                  {t("Usar localização atual")}
                </button>

                <button
                  type="button"
                  onClick={handleOpenMapPicker}
                  className={`inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold transition-colors ${
                    locationSource === "map"
                      ? "text-emerald-600"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  {t("Escolher local no mapa")}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">{t("Descrição")}</label>
              <textarea 
                required
                rows={4}
                placeholder={t("Descrivi il prodotto o servizio, ingredienti, materiali, durata o dettagli utili...")}
                className="w-full bg-transparent border border-stone-200 p-4 outline-none focus:border-stone-800 transition-colors text-stone-600 resize-none rounded-sm"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="space-y-2 border border-stone-200 rounded-sm bg-stone-50/70 px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <label className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] font-bold text-stone-600">
                  <input
                    type="checkbox"
                    checked={isDraftSaveChecked}
                    onChange={(e) => {
                      setIsDraftSaveChecked(e.target.checked);
                      if (!e.target.checked) {
                        setDraftSaveFeedback(null);
                      }
                    }}
                    className="w-3 h-3 accent-stone-900"
                  />
                  {t("Salvar informações rápidas")}
                </label>

                <button
                  type="button"
                  onClick={() => {
                    void handleSaveDraftDefaults();
                  }}
                  disabled={
                    !isDraftSaveChecked ||
                    isSavingDraftDefaults ||
                    isLoadingDraftDefaults ||
                    isPublishing
                  }
                  className="px-2.5 py-1 border border-stone-300 text-[10px] uppercase tracking-[0.18em] font-bold text-stone-700 hover:border-stone-700 hover:text-stone-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSavingDraftDefaults ? t("Salvando...") : t("Confirmar")}
                </button>
              </div>

              {isLoadingDraftDefaults && (
                <p className="text-[11px] text-stone-500">
                  {t("Carregando informações salvas...")}
                </p>
              )}

              {savedDraftDefaults && hasDraftDefaultsPendingSave && (
                <p className="text-[11px] text-amber-600">
                  {t("Você alterou os dados salvos. Clique em salvar novamente.")}
                </p>
              )}

              {draftSaveFeedback && (
                <p
                  className={`text-[11px] ${
                    draftSaveFeedback.type === "error" ? "text-red-500" : "text-emerald-600"
                  }`}
                >
                  {draftSaveFeedback.message}
                </p>
              )}
            </div>

            <button 
              disabled={isPublishing}
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
                  {isEditing ? t("Salvar alterações") : t("Pubblica")}
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
