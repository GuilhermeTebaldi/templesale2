import React from "react";
import { motion } from "motion/react";
import { X, User, Save, Navigation } from "lucide-react";
import { type SessionUser, type UpdateProfileInput } from "../lib/api";
import {
  getWhatsappCountryLabel,
  normalizeWhatsappLocalNumber,
} from "../lib/whatsapp";
import { useI18n } from "../i18n/provider";

interface EditePerfilProps {
  onClose: () => void;
  onSave: (data: UpdateProfileInput) => Promise<void>;
  initialData?: SessionUser | null;
  initialErrorMessage?: string;
}

export default function EditePerfil({
  onClose,
  onSave,
  initialData,
  initialErrorMessage = "",
}: EditePerfilProps) {
  const { t } = useI18n();
  const [isSaving, setIsSaving] = React.useState(false);
  const [isResolvingLocation, setIsResolvingLocation] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [formData, setFormData] = React.useState({
    name: initialData?.name || "",
    whatsappCountryIso: initialData?.whatsappCountryIso || "IT",
    whatsappNumber: initialData?.whatsappNumber || "",
    country: initialData?.country || "",
    state: initialData?.state || "",
    city: initialData?.city || "",
    neighborhood: initialData?.neighborhood || "",
    street: initialData?.street || "",
  });

  React.useEffect(() => {
    setFormData({
      name: initialData?.name || "",
      whatsappCountryIso: initialData?.whatsappCountryIso || "IT",
      whatsappNumber: initialData?.whatsappNumber || "",
      country: initialData?.country || "",
      state: initialData?.state || "",
      city: initialData?.city || "",
      neighborhood: initialData?.neighborhood || "",
      street: initialData?.street || "",
    });
    setErrorMessage(initialErrorMessage);
  }, [initialData, initialErrorMessage]);

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
            const response = await fetch(`/api/geo/reverse?${params.toString()}`, {
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

            const locationData =
              payload && payload.data && typeof payload.data === "object" ? payload.data : {};

            const rawCountry = String(locationData.country ?? "").trim();
            const normalizedCountry = (() => {
              const upper = rawCountry.toUpperCase();
              if (upper === "IT") return "Italia";
              if (upper === "BR") return "Brasil";
              return rawCountry;
            })();

            const normalizedState = String(locationData.state ?? "").trim();
            const normalizedCity = String(locationData.city ?? "").trim();
            const normalizedNeighborhood = String(locationData.neighborhood ?? "").trim();
            const normalizedStreet = String(locationData.street ?? "").trim();

            setFormData((prev) => ({
              ...prev,
              country: normalizedCountry || prev.country || "Italia",
              state: normalizedState || prev.state || "Lazio",
              city: normalizedCity || prev.city || "Roma",
              neighborhood: normalizedNeighborhood || prev.neighborhood,
              street: normalizedStreet || prev.street,
            }));
          } catch {
            setFormData((prev) => ({
              ...prev,
              country: prev.country || "Italia",
              state: prev.state || "Lazio",
              city: prev.city || "Roma",
            }));
            setErrorMessage(t("Nao foi possivel capturar sua localizacao neste momento."));
          } finally {
            window.clearTimeout(timeoutId);
            setIsResolvingLocation(false);
          }
        })();
      },
      () => {
        setIsResolvingLocation(false);
        setErrorMessage(t("Nao foi possivel capturar sua localizacao neste momento."));
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const normalizedName = formData.name.trim();
    if (normalizedName.length < 2) {
      setErrorMessage(t("Nome deve ter pelo menos 2 caracteres."));
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
      await onSave({
        name: normalizedName,
        whatsappCountryIso: formData.whatsappCountryIso,
        whatsappNumber: normalizedWhatsapp,
        country: formData.country.trim(),
        state: formData.state.trim(),
        city: formData.city.trim(),
        neighborhood: formData.neighborhood.trim(),
        street: formData.street.trim(),
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
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">{t("Nome completo")}</label>
              <input 
                required
                minLength={2}
                type="text"
                className="w-full bg-transparent border-b border-stone-200 py-3 outline-none focus:border-stone-800 transition-colors font-serif italic text-lg"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">{t("WhatsApp")}</label>
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

            <div className="pt-4">
              <button 
                type="button"
                disabled={isResolvingLocation}
                onClick={handleUseLocation}
                className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] font-bold text-stone-800 hover:text-stone-500 transition-colors disabled:text-stone-300 disabled:hover:text-stone-300"
              >
                <Navigation className="w-4 h-4" />
                {isResolvingLocation ? t("Processando...") : t("Usar minha localização atual")}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">{t("País")}</label>
                <input 
                  type="text"
                  className="w-full bg-transparent border-b border-stone-200 py-3 outline-none focus:border-stone-800 transition-colors font-serif italic text-lg"
                  value={formData.country}
                  onChange={(e) => setFormData({...formData, country: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">{t("Estado")}</label>
                <input 
                  type="text"
                  className="w-full bg-transparent border-b border-stone-200 py-3 outline-none focus:border-stone-800 transition-colors font-serif italic text-lg"
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">{t("Bairro")}</label>
                <input 
                  type="text"
                  className="w-full bg-transparent border-b border-stone-200 py-3 outline-none focus:border-stone-800 transition-colors font-serif italic text-lg"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({...formData, neighborhood: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">{t("Rua")}</label>
              <input 
                type="text"
                className="w-full bg-transparent border-b border-stone-200 py-3 outline-none focus:border-stone-800 transition-colors font-serif italic text-lg"
                value={formData.street}
                onChange={(e) => setFormData({...formData, street: e.target.value})}
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
    </motion.div>
  );
}
