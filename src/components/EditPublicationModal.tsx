import React from "react";
import { motion } from "motion/react";
import { ArrowLeft, ImagePlus, Loader2, Save, X } from "lucide-react";
import { api, type EstablishmentDto, type PublicationDto } from "../lib/api";
import { getCompatibleImageUrl } from "../lib/product-images";
import { useI18n } from "../i18n/provider";

interface EditPublicationModalProps {
  publication: PublicationDto;
  establishment: EstablishmentDto;
  onClose: () => void;
  onUpdated: (publication: PublicationDto) => void;
}

export default function EditPublicationModal({
  publication,
  establishment,
  onClose,
  onUpdated,
}: EditPublicationModalProps) {
  const { t } = useI18n();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [caption, setCaption] = React.useState(publication.caption);
  const [replacementFile, setReplacementFile] = React.useState<File | null>(null);
  const [replacementPreviewUrl, setReplacementPreviewUrl] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    setCaption(publication.caption);
    setReplacementFile(null);
    setReplacementPreviewUrl("");
    setError("");
  }, [publication.id, publication.caption]);

  React.useEffect(() => {
    return () => {
      if (replacementPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(replacementPreviewUrl);
      }
    };
  }, [replacementPreviewUrl]);

  const currentImageUrl = replacementPreviewUrl || publication.media[0] || publication.imageUrl;

  const choosePhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError(t("Arquivo inválido. Envie uma imagem."));
      return;
    }
    if (file.size <= 0 || file.size > 12 * 1024 * 1024) {
      setError(t("Imagem muito grande. Limite de 12 MB."));
      return;
    }

    setError("");
    setReplacementFile(file);
    setReplacementPreviewUrl((previous) => {
      if (previous.startsWith("blob:")) {
        URL.revokeObjectURL(previous);
      }
      return URL.createObjectURL(file);
    });
  };

  const savePublication = async () => {
    if (isSaving) {
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      let nextMedia = publication.media.length > 0 ? publication.media : [publication.imageUrl];

      if (replacementFile) {
        const uploaded = await api.uploadProductImage(replacementFile);
        const uploadedUrl = getCompatibleImageUrl(uploaded.url, "full") || uploaded.url;
        nextMedia = [
          uploadedUrl,
          ...nextMedia.filter((url) => url && url !== publication.imageUrl && url !== uploadedUrl).slice(0, 9),
        ];
      }

      const updated = await api.updatePublication(publication.id, {
        caption: caption.trim(),
        media: nextMedia,
      });
      onUpdated({
        ...publication,
        ...updated,
        establishmentName: updated.establishmentName || publication.establishmentName,
        establishmentSlug: updated.establishmentSlug || publication.establishmentSlug,
        establishmentCategory: updated.establishmentCategory || publication.establishmentCategory,
        establishmentCity: updated.establishmentCity || publication.establishmentCity,
        establishmentLogoUrl: updated.establishmentLogoUrl || publication.establishmentLogoUrl,
        establishmentCoverUrl: updated.establishmentCoverUrl || publication.establishmentCoverUrl,
        ownerAvatarUrl: updated.ownerAvatarUrl || publication.ownerAvatarUrl,
      });
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t("Não foi possível atualizar a publicação."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[140] flex flex-col bg-neutral-950 text-neutral-100"
    >
      <header className="sticky top-0 z-10 border-b border-neutral-800 bg-neutral-950/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-xl items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white"
            aria-label={t("Voltar")}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 text-center">
            <h2 className="truncate text-sm font-bold text-neutral-100">{t("Editar publicação")}</h2>
            <p className="truncate text-[11px] uppercase tracking-[0.14em] text-neutral-500">
              {establishment.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 flex h-10 w-10 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white"
            aria-label={t("Fechar")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
        <div className="mx-auto w-full max-w-xl space-y-5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={choosePhoto}
          />

          <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
            <img
              src={currentImageUrl}
              alt={publication.caption || establishment.name}
              className="aspect-square w-full object-cover"
            />
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSaving}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-amber-200 transition-colors hover:border-amber-300 hover:bg-amber-400/15 disabled:border-neutral-800 disabled:bg-neutral-900 disabled:text-neutral-500"
          >
            <ImagePlus className="h-4 w-4" />
            {t("Trocar foto")}
          </button>

          <label className="block space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-500">
              {t("Legenda")}
            </span>
            <textarea
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              rows={5}
              className="w-full resize-none rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-base leading-6 text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-amber-400 sm:text-sm"
              placeholder={t("Escreva uma legenda...")}
            />
          </label>

          {error && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          )}
        </div>
      </main>

      <footer className="border-t border-neutral-800 bg-neutral-950/95 px-4 py-4 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-xl gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 rounded-xl border border-neutral-800 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-neutral-300 transition-colors hover:bg-neutral-900 hover:text-white disabled:opacity-60"
          >
            {t("Cancelar")}
          </button>
          <button
            type="button"
            onClick={() => void savePublication()}
            disabled={isSaving}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-neutral-100 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-neutral-950 transition-colors hover:bg-white disabled:bg-neutral-800 disabled:text-neutral-500"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? t("Salvando...") : t("Salvar")}
          </button>
        </div>
      </footer>
    </motion.div>
  );
}
