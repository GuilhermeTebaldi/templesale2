import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Mail, MapPin, Navigation, Save, Store, User, X } from "lucide-react";
import {
  api,
  type EstablishmentDto,
  type SessionUser,
  type TaxonomySuggestionDto,
  type UpdateProfileInput,
} from "../lib/api";
import { trackedFetch } from "../lib/networkActivity";
import {
  getWhatsappCountryLabel,
  normalizeWhatsappLocalNumber,
} from "../lib/whatsapp";
import { useI18n } from "../i18n/provider";
import LeafletMapPicker from "./LeafletMapPicker";

interface EditePerfilProps {
  onClose: () => void;
  onSave: (
    data: UpdateProfileInput,
    establishmentData?: Partial<EstablishmentDto>,
  ) => Promise<void>;
  initialData?: SessionUser | null;
  initialEstablishment?: EstablishmentDto | null;
  initialErrorMessage?: string;
}

type GeoPoint = {
  latitude: number;
  longitude: number;
};

const DEFAULT_MAP_CENTER: GeoPoint = {
  latitude: 41.6081,
  longitude: 12.5156,
};

function parseGeoPoint(latitude: string, longitude: string): GeoPoint | null {
  const lat = Number(String(latitude ?? "").replace(",", "."));
  const lng = Number(String(longitude ?? "").replace(",", "."));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }
  return { latitude: lat, longitude: lng };
}

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

function normalizeKeywordList(values: string[]): string[] {
  const byKey = new Map<string, string>();
  for (const value of values) {
    const label = String(value ?? "").trim().replace(/\s+/g, " ");
    if (!isUsableTaxonomyLabel(label)) {
      continue;
    }
    const key = normalizeTaxonomyLabel(label);
    if (!byKey.has(key)) {
      byKey.set(key, label);
    }
  }
  return [...byKey.values()].slice(0, 24);
}

export default function EditePerfil({
  onClose,
  onSave,
  initialData,
  initialEstablishment,
  initialErrorMessage = "",
}: EditePerfilProps) {
  const { t } = useI18n();
  const registeredEmail = String(initialData?.email ?? "").trim();
  const [isSaving, setIsSaving] = React.useState(false);
  const [isResolvingLocation, setIsResolvingLocation] = React.useState(false);
  const [isMapPickerOpen, setIsMapPickerOpen] = React.useState(false);
  const [locationStatus, setLocationStatus] = React.useState<"success" | "error" | null>(null);
  const [businessCategorySuggestions, setBusinessCategorySuggestions] = React.useState<TaxonomySuggestionDto[]>([]);
  const [keywordInput, setKeywordInput] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState("");
  const [formData, setFormData] = React.useState({
    name: initialData?.name || "",
    establishmentName: initialEstablishment?.name || "",
    establishmentCategory: initialEstablishment?.category || "Altro",
    establishmentDescription: initialEstablishment?.description || "",
    establishmentOpeningHours: initialEstablishment?.openingHours || "",
    establishmentKeywords: normalizeKeywordList(initialEstablishment?.keywords ?? []),
    whatsappCountryIso: initialData?.whatsappCountryIso || "IT",
    whatsappNumber: initialData?.whatsappNumber || "",
    country: initialData?.country || "",
    state: initialData?.state || "",
    city: initialEstablishment?.city || initialData?.city || "",
    neighborhood: initialData?.neighborhood || "",
    street: initialEstablishment?.address || initialData?.street || "",
    latitude:
      typeof initialEstablishment?.latitude === "number"
        ? String(initialEstablishment.latitude)
        : typeof initialData?.locationLatitude === "number"
          ? String(initialData.locationLatitude)
          : "",
    longitude:
      typeof initialEstablishment?.longitude === "number"
        ? String(initialEstablishment.longitude)
        : typeof initialData?.locationLongitude === "number"
          ? String(initialData.locationLongitude)
          : "",
  });

  React.useEffect(() => {
    setFormData({
      name: initialData?.name || "",
      establishmentName: initialEstablishment?.name || "",
      establishmentCategory: initialEstablishment?.category || "Altro",
      establishmentDescription: initialEstablishment?.description || "",
      establishmentOpeningHours: initialEstablishment?.openingHours || "",
      establishmentKeywords: normalizeKeywordList(initialEstablishment?.keywords ?? []),
      whatsappCountryIso: initialData?.whatsappCountryIso || "IT",
      whatsappNumber: initialData?.whatsappNumber || "",
      country: initialData?.country || "",
      state: initialData?.state || "",
      city: initialEstablishment?.city || initialData?.city || "",
      neighborhood: initialData?.neighborhood || "",
      street: initialEstablishment?.address || initialData?.street || "",
      latitude:
        typeof initialEstablishment?.latitude === "number"
          ? String(initialEstablishment.latitude)
          : typeof initialData?.locationLatitude === "number"
            ? String(initialData.locationLatitude)
            : "",
      longitude:
        typeof initialEstablishment?.longitude === "number"
          ? String(initialEstablishment.longitude)
          : typeof initialData?.locationLongitude === "number"
            ? String(initialData.locationLongitude)
            : "",
    });
    setErrorMessage(initialErrorMessage);
    setKeywordInput("");
    setLocationStatus(
      parseGeoPoint(
        typeof initialEstablishment?.latitude === "number"
          ? String(initialEstablishment.latitude)
          : typeof initialData?.locationLatitude === "number"
            ? String(initialData.locationLatitude)
            : "",
        typeof initialEstablishment?.longitude === "number"
          ? String(initialEstablishment.longitude)
          : typeof initialData?.locationLongitude === "number"
            ? String(initialData.locationLongitude)
            : "",
      )
        ? "success"
        : null,
    );
  }, [initialData, initialEstablishment, initialErrorMessage]);

  const selectedLocation = React.useMemo(
    () => parseGeoPoint(formData.latitude, formData.longitude),
    [formData.latitude, formData.longitude],
  );

  const mapCenter = selectedLocation ?? DEFAULT_MAP_CENTER;

  const addKeyword = (rawKeyword: string) => {
    const keyword = rawKeyword.trim().replace(/\s+/g, " ");
    if (!keyword) {
      return;
    }
    if (!isUsableTaxonomyLabel(keyword)) {
      setErrorMessage(t("Use palavras-chave reais, sem links ou texto inválido."));
      return;
    }
    setFormData((current) => ({
      ...current,
      establishmentKeywords: normalizeKeywordList([...current.establishmentKeywords, keyword]),
    }));
    setKeywordInput("");
    setErrorMessage("");
  };

  const removeKeyword = (keyword: string) => {
    const key = normalizeTaxonomyLabel(keyword);
    setFormData((current) => ({
      ...current,
      establishmentKeywords: current.establishmentKeywords.filter(
        (item) => normalizeTaxonomyLabel(item) !== key,
      ),
    }));
  };

  React.useEffect(() => {
    let cancelled = false;
    void api
      .getBusinessCategorySuggestions(formData.establishmentCategory)
      .then((suggestions) => {
        if (!cancelled) {
          setBusinessCategorySuggestions(suggestions.slice(0, 10));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBusinessCategorySuggestions([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [formData.establishmentCategory]);

  const applyLocationPoint = React.useCallback(
    async (point: GeoPoint, fallback?: Partial<typeof formData>) => {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 8000);
      let nextFields = fallback ?? {};

      try {
        const params = new URLSearchParams({
          lat: String(point.latitude),
          lng: String(point.longitude),
        });
        const response = await trackedFetch(`/api/geo/reverse?${params.toString()}`, {
          credentials: "include",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        const payload = (await response.json().catch(() => null)) as
          | { success?: boolean; data?: Record<string, unknown> }
          | null;
        const locationData =
          response.ok && payload?.data && typeof payload.data === "object" ? payload.data : {};
        const rawCountry = String(locationData.country ?? "").trim();
        const normalizedCountry = (() => {
          const upper = rawCountry.toUpperCase();
          if (upper === "IT") return "Italia";
          if (upper === "BR") return "Brasil";
          return rawCountry;
        })();

        nextFields = {
          ...nextFields,
          country: normalizedCountry || fallback?.country,
          state: String(locationData.state ?? "").trim() || fallback?.state,
          city: String(locationData.city ?? "").trim() || fallback?.city,
          neighborhood:
            String(locationData.neighborhood ?? "").trim() || fallback?.neighborhood,
          street: String(locationData.street ?? "").trim() || fallback?.street,
        };
      } catch {
        nextFields = fallback ?? {};
      } finally {
        window.clearTimeout(timeoutId);
      }

      setFormData((prev) => ({
        ...prev,
        ...Object.fromEntries(
          Object.entries(nextFields).filter(([, value]) => String(value ?? "").trim()),
        ),
        latitude: String(point.latitude),
        longitude: String(point.longitude),
      }));
      setLocationStatus("success");
    },
    [],
  );

  const handleUseLocation = () => {
    setErrorMessage("");
    if (!("geolocation" in navigator)) {
      setErrorMessage(t("Geolocalizacao nao suportada neste navegador."));
      return;
    }

    setIsResolvingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void (async () => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          const controller = new AbortController();
          const timeoutId = window.setTimeout(() => controller.abort(), 8000);

          try {
            const params = new URLSearchParams({
              lat: String(latitude),
              lng: String(longitude),
            });
            const response = await trackedFetch(`/api/geo/reverse?${params.toString()}`, {
              credentials: "include",
              headers: { Accept: "application/json" },
              signal: controller.signal,
            });

            const payload = (await response.json().catch(() => null)) as
              | { success?: boolean; message?: string; data?: Record<string, unknown> }
              | null;
            if (!response.ok || payload?.success === false) {
              const message = payload?.message?.trim();
              throw new Error(
                message || t("Nao foi possivel capturar sua localizacao neste momento."),
              );
            }

            await applyLocationPoint(
              { latitude, longitude },
              {
                country: formData.country || "Italia",
                state: formData.state || "Lazio",
                city: formData.city || "Roma",
              },
            );
          } catch {
            await applyLocationPoint(
              { latitude, longitude },
              {
                country: formData.country || "Italia",
                state: formData.state || "Lazio",
                city: formData.city || "Roma",
              },
            );
            setErrorMessage("");
          } finally {
            window.clearTimeout(timeoutId);
            setIsResolvingLocation(false);
          }
        })();
      },
      () => {
        setIsResolvingLocation(false);
        setLocationStatus("error");
        setErrorMessage(
          t("Nao foi possivel capturar sua localizacao neste momento. Preencha cidade/endereco manualmente."),
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleConfirmMapLocation = (point: GeoPoint) => {
    void applyLocationPoint(point, {
      country: formData.country || "Italia",
      state: formData.state,
      city: formData.city,
      neighborhood: formData.neighborhood,
      street: formData.street,
    });
    setIsMapPickerOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const normalizedName = formData.name.trim();
    const normalizedEstablishmentName = formData.establishmentName.trim();
    if (normalizedName.length < 2) {
      setErrorMessage(t("Nome deve ter pelo menos 2 caracteres."));
      return;
    }
    if (normalizedEstablishmentName.length < 2) {
      setErrorMessage(t("Nome attività deve ter pelo menos 2 caracteres."));
      return;
    }
    if (!isUsableTaxonomyLabel(formData.establishmentCategory)) {
      setErrorMessage(t("Informe uma categoria attività válida, sem links ou texto inválido."));
      return;
    }

    const normalizedWhatsapp = normalizeWhatsappLocalNumber(
      formData.whatsappNumber,
      formData.whatsappCountryIso,
    );
    if (!normalizedWhatsapp) {
      setErrorMessage(t("Numero de WhatsApp e obrigatorio."));
      return;
    }
    if (normalizedWhatsapp.length < 6 || normalizedWhatsapp.length > 15) {
      setErrorMessage(t("Numero de WhatsApp invalido."));
      return;
    }

    setIsSaving(true);
    try {
      const profilePayload = {
        name: normalizedName,
        whatsappCountryIso: formData.whatsappCountryIso,
        whatsappNumber: normalizedWhatsapp,
        country: formData.country.trim(),
        state: formData.state.trim(),
        city: formData.city.trim(),
        neighborhood: formData.neighborhood.trim(),
        street: formData.street.trim(),
      };
      await onSave(profilePayload, {
        id: initialEstablishment?.id,
        name: normalizedEstablishmentName,
        category: formData.establishmentCategory,
        description: formData.establishmentDescription.trim(),
        openingHours: formData.establishmentOpeningHours.trim(),
        keywords: normalizeKeywordList(formData.establishmentKeywords),
        city: profilePayload.city,
        address: profilePayload.street,
        latitude: Number.isFinite(Number(formData.latitude)) ? Number(formData.latitude) : undefined,
        longitude: Number.isFinite(Number(formData.longitude)) ? Number(formData.longitude) : undefined,
        whatsappCountryIso: profilePayload.whatsappCountryIso,
        whatsappNumber: profilePayload.whatsappNumber,
        phone: profilePayload.whatsappNumber,
      });
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("Falha ao salvar o perfil.");
      setErrorMessage(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: "100%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="ts-profile-editor fixed inset-0 z-150 bg-neutral-950 text-neutral-100 flex flex-col"
    >
      <div className="p-5 sm:p-8 flex justify-between items-center border-b border-neutral-800 bg-neutral-900/95 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <User className="w-6 h-6 text-amber-400" />
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{t("Editar Perfil")}</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-neutral-800 rounded-full transition-colors">
          <X className="w-6 h-6 text-neutral-300" />
        </button>
      </div>

      <div className="grow overflow-y-auto overscroll-contain p-4 sm:p-8">
        <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-8">
          <div className="space-y-6">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-1.5">
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400">
                    {t("Email cadastrado")}
                  </p>
                  <p className="break-all text-base font-medium text-neutral-100 sm:text-lg">
                    {registeredEmail || t("Sem email cadastrado")}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-neutral-500">
                    {t("Este email nao pode ser alterado.")}
                  </p>
                </div>
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-700 bg-neutral-950 text-neutral-300">
                  <Mail className="h-4 w-4" />
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
              <div className="mb-5 flex items-center gap-3">
                <Store className="h-4 w-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-200">
                  {t("Dati attività")}
                </h3>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400">
                    {t("Nome attività")}
                  </label>
                  <input
                    required
                    minLength={2}
                    type="text"
                    placeholder={t("Ex: Casa Tebaldi")}
                    className="w-full bg-transparent border-b border-neutral-700 py-3 outline-none focus:border-amber-400 transition-colors text-lg font-semibold text-neutral-100"
                    value={formData.establishmentName}
                    onChange={(e) =>
                      setFormData({ ...formData, establishmentName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400">
                    {t("Categoria attività")}
                  </label>
                  <input
                    required
                    className="w-full bg-transparent border-b border-neutral-700 py-3 outline-none focus:border-amber-400 transition-colors text-neutral-100"
                    value={formData.establishmentCategory}
                    onChange={(e) =>
                      setFormData({ ...formData, establishmentCategory: e.target.value })
                    }
                    list="business-category-suggestions"
                    placeholder={t("Ex: Bar, Ristorante, Enoteca")}
                  />
                  <datalist id="business-category-suggestions">
                    {businessCategorySuggestions.map((category) => (
                      <option key={category.key} value={category.label} />
                    ))}
                  </datalist>
                  {formData.establishmentCategory.trim() && (
                    <p className="text-[11px] text-neutral-500">
                      {businessCategorySuggestions.some(
                        (suggestion) =>
                          suggestion.label.localeCompare(formData.establishmentCategory, undefined, {
                            sensitivity: "accent",
                          }) === 0,
                      )
                        ? t("Categoria già presente nella tassonomia.")
                        : t('+ Crea "{value}"', { value: formData.establishmentCategory.trim() })}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400">
                    {t("Descrizione")}
                  </label>
                  <textarea
                    rows={3}
                    className="w-full resize-none bg-transparent border-b border-neutral-700 py-3 outline-none focus:border-amber-400 transition-colors text-sm leading-6 text-neutral-100"
                    value={formData.establishmentDescription}
                    onChange={(e) =>
                      setFormData({ ...formData, establishmentDescription: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400">
                    {t("Parole chiave")}
                  </label>
                  {formData.establishmentKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.establishmentKeywords.map((keyword) => (
                        <span
                          key={normalizeTaxonomyLabel(keyword)}
                          className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-xs text-amber-100"
                        >
                          {keyword}
                          <button
                            type="button"
                            onClick={() => removeKeyword(keyword)}
                            className="text-amber-200/70 transition-colors hover:text-red-300"
                            aria-label={t("Remover palavra-chave")}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={keywordInput}
                      onChange={(event) => setKeywordInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addKeyword(keywordInput);
                        }
                      }}
                      placeholder={t("Ex: aperitivo, cucina romana, consegna")}
                      className="min-w-0 flex-1 bg-transparent border-b border-neutral-700 py-3 outline-none focus:border-amber-400 transition-colors text-neutral-100"
                    />
                    <button
                      type="button"
                      onClick={() => addKeyword(keywordInput)}
                      className="rounded-xl border border-neutral-700 bg-neutral-950 px-4 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-200 transition-colors hover:border-amber-400/60 hover:text-amber-200"
                    >
                      {t("Aggiungi")}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400">
                    {t("Orari")}
                  </label>
                  <input
                    type="text"
                    placeholder={t("Ex: Lun-Sab 18:00-23:00")}
                    className="w-full bg-transparent border-b border-neutral-700 py-3 outline-none focus:border-amber-400 transition-colors text-neutral-100"
                    value={formData.establishmentOpeningHours}
                    onChange={(e) =>
                      setFormData({ ...formData, establishmentOpeningHours: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
              <div className="mb-5 flex items-center gap-3">
                <User className="h-4 w-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-200">
                  {t("Account")}
                </h3>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400">{t("Nome proprietario")}</label>
                <input 
                  required
                  minLength={2}
                  type="text"
                  className="w-full bg-transparent border-b border-neutral-700 py-3 outline-none focus:border-amber-400 transition-colors text-lg font-semibold text-neutral-100"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400">{t("WhatsApp attività")}</label>
              <div className="grid grid-cols-[1fr_2fr] gap-4">
                <select
                  className="w-full bg-transparent border-b border-neutral-700 py-3 outline-none focus:border-amber-400 transition-colors text-neutral-100"
                  value={formData.whatsappCountryIso}
                  onChange={(e) =>
                    setFormData({ ...formData, whatsappCountryIso: e.target.value })
                  }
                >
                  <option value="IT">{getWhatsappCountryLabel("IT")}</option>
                </select>
                <input
                  required
                  type="tel"
                  placeholder="3331234567"
                  className="w-full bg-transparent border-b border-neutral-700 py-3 outline-none focus:border-amber-400 transition-colors text-lg font-semibold text-neutral-100"
                  value={formData.whatsappNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, whatsappNumber: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 shadow-2xl">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-amber-400" />
                  <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-200">
                    {t("Posizione attività")}
                  </h3>
                </div>
                {locationStatus === "success" && selectedLocation && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    {t("Localização registrada")}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button 
                  type="button"
                  disabled={isResolvingLocation}
                  onClick={handleUseLocation}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-3 text-[10px] uppercase tracking-[0.16em] font-bold text-amber-200 transition-colors hover:border-amber-300 hover:bg-amber-400/15 disabled:text-neutral-500 disabled:border-neutral-800 disabled:bg-neutral-950"
                >
                  <Navigation className="w-4 h-4" />
                  {isResolvingLocation ? t("Processando...") : t("Localização atual")}
                </button>
                <button
                  type="button"
                  onClick={() => setIsMapPickerOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-3 text-[10px] uppercase tracking-[0.16em] font-bold text-neutral-200 transition-colors hover:border-neutral-500 hover:bg-neutral-800"
                >
                  <MapPin className="w-4 h-4" />
                  {t("Mapa")}
                </button>
              </div>

              <p className={`mt-3 text-xs ${locationStatus === "error" ? "text-red-300" : "text-neutral-400"}`}>
                {selectedLocation
                  ? `${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}`
                  : t("Nenhuma localização registrada ainda.")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400">{t("País")}</label>
                <input 
                  type="text"
                  className="w-full bg-transparent border-b border-neutral-700 py-3 outline-none focus:border-amber-400 transition-colors text-lg font-semibold text-neutral-100"
                  value={formData.country}
                  onChange={(e) => {
                    setLocationStatus(null);
                    setFormData({...formData, country: e.target.value});
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400">{t("Estado")}</label>
                <input 
                  type="text"
                  className="w-full bg-transparent border-b border-neutral-700 py-3 outline-none focus:border-amber-400 transition-colors text-lg font-semibold text-neutral-100"
                  value={formData.state}
                  onChange={(e) => {
                    setLocationStatus(null);
                    setFormData({...formData, state: e.target.value});
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400">{t("Cidade")}</label>
                <input 
                  type="text"
                  className="w-full bg-transparent border-b border-neutral-700 py-3 outline-none focus:border-amber-400 transition-colors text-lg font-semibold text-neutral-100"
                  value={formData.city}
                  onChange={(e) => {
                    setLocationStatus(null);
                    setFormData({...formData, city: e.target.value});
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400">{t("Bairro")}</label>
                <input 
                  type="text"
                  className="w-full bg-transparent border-b border-neutral-700 py-3 outline-none focus:border-amber-400 transition-colors text-lg font-semibold text-neutral-100"
                  value={formData.neighborhood}
                  onChange={(e) => {
                    setLocationStatus(null);
                    setFormData({...formData, neighborhood: e.target.value});
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400">{t("Rua")}</label>
              <input 
                type="text"
                className="w-full bg-transparent border-b border-neutral-700 py-3 outline-none focus:border-amber-400 transition-colors text-lg font-semibold text-neutral-100"
                value={formData.street}
                onChange={(e) => {
                  setLocationStatus(null);
                  setFormData({...formData, street: e.target.value});
                }}
              />
            </div>
          </div>

          {errorMessage && (
            <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{errorMessage}</p>
          )}

          <button 
            disabled={isSaving}
            type="submit"
            className="w-full rounded-2xl bg-neutral-100 text-neutral-950 py-5 text-xs uppercase tracking-[0.22em] font-bold flex items-center justify-center gap-3 hover:bg-white transition-all mt-8 disabled:bg-neutral-700 disabled:text-neutral-500"
          >
            <Save className="w-4 h-4" />
            {isSaving ? t("Salvando...") : t("Salvar alterações")}
          </button>
        </form>
      </div>
      <AnimatePresence>
        {isMapPickerOpen && (
          <LeafletMapPicker
            center={mapCenter}
            selectedPoint={selectedLocation}
            onSelectPoint={(point) => {
              setFormData((current) => ({
                ...current,
                latitude: String(point.latitude),
                longitude: String(point.longitude),
              }));
              setLocationStatus("success");
            }}
            onClose={() => setIsMapPickerOpen(false)}
            onConfirm={handleConfirmMapLocation}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
