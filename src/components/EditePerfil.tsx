import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Mail, MapPin, Navigation, Save, Store, User, X } from "lucide-react";
import { api, type EstablishmentDto, type SessionUser, type UpdateProfileInput } from "../lib/api";
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

const ESTABLISHMENT_CATEGORIES = [
  "Ristorante",
  "Bar",
  "Negozi",
  "Barbieri",
  "Palestre",
  "Officine",
  "Mercati",
  "Arredamento",
  "Elettronica",
  "Hotel",
  "Altro",
];

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
  const [errorMessage, setErrorMessage] = React.useState("");
  const [formData, setFormData] = React.useState({
    name: initialData?.name || "",
    establishmentName: initialEstablishment?.name || "",
    establishmentCategory: initialEstablishment?.category || "Altro",
    establishmentDescription: initialEstablishment?.description || "",
    establishmentOpeningHours: initialEstablishment?.openingHours || "",
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

  const handleGeocodeTypedLocation = async () => {
    const query = [formData.street, formData.neighborhood, formData.city, formData.state, formData.country || "Italia"]
      .map((part) => String(part ?? "").trim())
      .filter(Boolean)
      .join(", ");
    if (!query) {
      setLocationStatus("error");
      setErrorMessage(t("Preencha cidade ou endereço para registrar a localização."));
      return;
    }

    setIsResolvingLocation(true);
    setErrorMessage("");
    try {
      const location = await api.geocodeLocation(query);
      if (!location) {
        throw new Error(t("Localização não encontrada."));
      }
      await applyLocationPoint(
        { latitude: location.latitude, longitude: location.longitude },
        {
          country: location.country || formData.country || "Italia",
          state: location.state || formData.state,
          city: location.city || formData.city,
          neighborhood: location.neighborhood || formData.neighborhood,
          street: location.street || formData.street,
        },
      );
    } catch (error) {
      setLocationStatus("error");
      setErrorMessage(error instanceof Error ? error.message : t("Localização não encontrada."));
    } finally {
      setIsResolvingLocation(false);
    }
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
      className="fixed inset-0 z-150 bg-[#fdfcfb] flex flex-col"
    >
      <div className="p-8 flex justify-between items-center border-b border-stone-100">
        <div className="flex items-center gap-4">
          <User className="w-6 h-6 text-stone-800" />
          <h2 className="text-2xl font-serif tracking-widest uppercase">{t("Editar Perfil")}</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-stone-50 rounded-full transition-colors">
          <X className="w-6 h-6 text-stone-600" />
        </button>
      </div>

      <div className="grow overflow-y-auto overscroll-contain p-8">
        <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-8">
          <div className="space-y-6">
            <div className="rounded-xl border border-stone-200 bg-gradient-to-br from-white via-stone-50 to-stone-100/60 p-4 shadow-[0_10px_28px_rgba(28,25,23,0.07)]">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-1.5">
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">
                    {t("Email cadastrado")}
                  </p>
                  <p className="break-all text-base font-medium text-stone-900 sm:text-lg">
                    {registeredEmail || t("Sem email cadastrado")}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-stone-500">
                    {t("Este email nao pode ser alterado.")}
                  </p>
                </div>
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700">
                  <Mail className="h-4 w-4" />
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-stone-200 bg-white p-5">
              <div className="mb-5 flex items-center gap-3">
                <Store className="h-4 w-4 text-stone-700" />
                <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-stone-800">
                  {t("Dati attività")}
                </h3>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">
                    {t("Nome attività")}
                  </label>
                  <input
                    required
                    minLength={2}
                    type="text"
                    placeholder={t("Ex: Casa Tebaldi")}
                    className="w-full bg-transparent border-b border-stone-200 py-3 outline-none focus:border-stone-800 transition-colors font-serif italic text-lg"
                    value={formData.establishmentName}
                    onChange={(e) =>
                      setFormData({ ...formData, establishmentName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">
                    {t("Categoria attività")}
                  </label>
                  <select
                    required
                    className="w-full bg-transparent border-b border-stone-200 py-3 outline-none focus:border-stone-800 transition-colors text-stone-700"
                    value={formData.establishmentCategory}
                    onChange={(e) =>
                      setFormData({ ...formData, establishmentCategory: e.target.value })
                    }
                  >
                    {ESTABLISHMENT_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">
                    {t("Descrizione")}
                  </label>
                  <textarea
                    rows={3}
                    className="w-full resize-none bg-transparent border-b border-stone-200 py-3 outline-none focus:border-stone-800 transition-colors text-sm leading-6 text-stone-700"
                    value={formData.establishmentDescription}
                    onChange={(e) =>
                      setFormData({ ...formData, establishmentDescription: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">
                    {t("Orari")}
                  </label>
                  <input
                    type="text"
                    placeholder={t("Ex: Lun-Sab 18:00-23:00")}
                    className="w-full bg-transparent border-b border-stone-200 py-3 outline-none focus:border-stone-800 transition-colors text-stone-700"
                    value={formData.establishmentOpeningHours}
                    onChange={(e) =>
                      setFormData({ ...formData, establishmentOpeningHours: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-stone-100 pt-6">
              <div className="mb-5 flex items-center gap-3">
                <User className="h-4 w-4 text-stone-700" />
                <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-stone-800">
                  {t("Account")}
                </h3>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">{t("Nome proprietario")}</label>
                <input 
                  required
                  minLength={2}
                  type="text"
                  className="w-full bg-transparent border-b border-stone-200 py-3 outline-none focus:border-stone-800 transition-colors font-serif italic text-lg"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">{t("WhatsApp attività")}</label>
              <div className="grid grid-cols-[1fr_2fr] gap-4">
                <select
                  className="w-full bg-transparent border-b border-stone-200 py-3 outline-none focus:border-stone-800 transition-colors text-stone-700"
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
                  className="w-full bg-transparent border-b border-stone-200 py-3 outline-none focus:border-stone-800 transition-colors font-serif italic text-lg"
                  value={formData.whatsappNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, whatsappNumber: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="rounded-lg border border-stone-200 bg-white p-5">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-stone-700" />
                  <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-stone-800">
                    {t("Posizione attività")}
                  </h3>
                </div>
                {locationStatus === "success" && selectedLocation && (
                  <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                    {t("Localização registrada")}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <button 
                  type="button"
                  disabled={isResolvingLocation}
                  onClick={handleUseLocation}
                  className="inline-flex items-center justify-center gap-2 border border-stone-200 px-3 py-3 text-[10px] uppercase tracking-[0.16em] font-bold text-stone-800 hover:border-stone-500 transition-colors disabled:text-stone-300"
                >
                  <Navigation className="w-4 h-4" />
                  {isResolvingLocation ? t("Processando...") : t("GPS")}
                </button>
                <button
                  type="button"
                  disabled={isResolvingLocation}
                  onClick={() => void handleGeocodeTypedLocation()}
                  className="inline-flex items-center justify-center gap-2 border border-stone-200 px-3 py-3 text-[10px] uppercase tracking-[0.16em] font-bold text-stone-800 hover:border-stone-500 transition-colors disabled:text-stone-300"
                >
                  <MapPin className="w-4 h-4" />
                  {t("Registrar endereço")}
                </button>
                <button
                  type="button"
                  onClick={() => setIsMapPickerOpen(true)}
                  className="inline-flex items-center justify-center gap-2 border border-stone-200 px-3 py-3 text-[10px] uppercase tracking-[0.16em] font-bold text-stone-800 hover:border-stone-500 transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                  {t("Mapa")}
                </button>
              </div>

              <p className={`mt-3 text-xs ${locationStatus === "error" ? "text-red-500" : "text-stone-500"}`}>
                {selectedLocation
                  ? `${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}`
                  : t("Nenhuma localização registrada ainda.")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">{t("País")}</label>
                <input 
                  type="text"
                  className="w-full bg-transparent border-b border-stone-200 py-3 outline-none focus:border-stone-800 transition-colors font-serif italic text-lg"
                  value={formData.country}
                  onChange={(e) => {
                    setLocationStatus(null);
                    setFormData({...formData, country: e.target.value});
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">{t("Estado")}</label>
                <input 
                  type="text"
                  className="w-full bg-transparent border-b border-stone-200 py-3 outline-none focus:border-stone-800 transition-colors font-serif italic text-lg"
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
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">{t("Cidade")}</label>
                <input 
                  type="text"
                  className="w-full bg-transparent border-b border-stone-200 py-3 outline-none focus:border-stone-800 transition-colors font-serif italic text-lg"
                  value={formData.city}
                  onChange={(e) => {
                    setLocationStatus(null);
                    setFormData({...formData, city: e.target.value});
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">{t("Bairro")}</label>
                <input 
                  type="text"
                  className="w-full bg-transparent border-b border-stone-200 py-3 outline-none focus:border-stone-800 transition-colors font-serif italic text-lg"
                  value={formData.neighborhood}
                  onChange={(e) => {
                    setLocationStatus(null);
                    setFormData({...formData, neighborhood: e.target.value});
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">{t("Rua")}</label>
              <input 
                type="text"
                className="w-full bg-transparent border-b border-stone-200 py-3 outline-none focus:border-stone-800 transition-colors font-serif italic text-lg"
                value={formData.street}
                onChange={(e) => {
                  setLocationStatus(null);
                  setFormData({...formData, street: e.target.value});
                }}
              />
            </div>
          </div>

          {errorMessage && (
            <p className="text-sm text-red-500">{errorMessage}</p>
          )}

          <button 
            disabled={isSaving}
            type="submit"
            className="w-full bg-stone-900 text-white py-6 text-xs uppercase tracking-[0.3em] font-bold flex items-center justify-center gap-3 hover:bg-black transition-all mt-12 disabled:bg-stone-400"
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
