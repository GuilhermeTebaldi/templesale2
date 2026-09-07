import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera, ImagePlus, Loader2, Trash2, Upload, X } from "lucide-react";
import { api, type EstablishmentDto, type PublicationDto } from "../lib/api";
import { getCompatibleImageUrl } from "../lib/product-images";
import { useI18n } from "../i18n/provider";

interface NewPublicationProps {
  establishment: EstablishmentDto;
  onClose: () => void;
  onPublished: (publication: PublicationDto) => void;
}

export default function NewPublication({
  establishment,
  onClose,
  onPublished,
}: NewPublicationProps) {
  const { t } = useI18n();
  const cameraInputRef = React.useRef<HTMLInputElement | null>(null);
  const galleryInputRef = React.useRef<HTMLInputElement | null>(null);
  const [media, setMedia] = React.useState<string[]>([]);
  const [previewUrls, setPreviewUrls] = React.useState<string[]>([]);
  const [caption, setCaption] = React.useState("");
  const [isUploading, setIsUploading] = React.useState(false);
  const [isPublishing, setIsPublishing] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  React.useEffect(() => {
    return () => {
      for (const previewUrl of previewUrls) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrls]);

  const handleFiles = async (files: FileList | null) => {
    const selectedFiles = Array.from(files ?? []).filter((file) => file.type.startsWith("image/"));
    if (selectedFiles.length === 0) {
      return;
    }
    setErrorMessage("");
    setIsUploading(true);
    const nextPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls((current) => [...current, ...nextPreviews].slice(0, 10));
    try {
      const uploaded: string[] = [];
      for (const file of selectedFiles.slice(0, 10 - media.length)) {
        const response = await api.uploadProductImage(file);
        const imageUrl = getCompatibleImageUrl(response.url);
        if (imageUrl) {
          uploaded.push(imageUrl);
        }
      }
      setMedia((current) => [...current, ...uploaded].slice(0, 10));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t("Falha ao enviar imagem."));
    } finally {
      setIsUploading(false);
      if (cameraInputRef.current) {
        cameraInputRef.current.value = "";
      }
      if (galleryInputRef.current) {
        galleryInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setMedia((current) => current.filter((_, currentIndex) => currentIndex !== index));
    setPreviewUrls((current) => {
      const previewUrl = current[index];
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      return current.filter((_, currentIndex) => currentIndex !== index);
    });
  };

  const handlePublish = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isUploading || isPublishing) {
      return;
    }
    if (media.length === 0) {
      setErrorMessage(t("Aggiungi almeno una foto."));
      return;
    }
    setIsPublishing(true);
    setErrorMessage("");
    try {
      const publication = await api.createPublication(establishment.id, {
        caption: caption.trim(),
        media,
      });
      onPublished(publication);
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t("Falha ao publicar."));
    } finally {
      setIsPublishing(false);
    }
  };

  const displayImages = media.length > 0 ? media : previewUrls;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-120 flex items-end justify-center bg-black/30 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      >
        <motion.form
          onSubmit={handlePublish}
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.98 }}
          className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-stone-200 bg-[#fdfcfb] shadow-2xl sm:rounded-2xl"
        >
          <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-400">
                {establishment.name}
              </p>
              <h2 className="font-serif text-2xl text-stone-950">{t("Nuova pubblicazione")}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
              aria-label={t("Fechar")}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(event) => void handleFiles(event.target.files)}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => void handleFiles(event.target.files)}
            />

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex aspect-square flex-col items-center justify-center gap-3 rounded-lg border border-stone-200 bg-white text-xs font-bold uppercase tracking-[0.16em] text-stone-700 transition-colors hover:border-stone-500"
              >
                <Camera className="h-6 w-6" />
                {t("Fotocamera")}
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="flex aspect-square flex-col items-center justify-center gap-3 rounded-lg border border-stone-200 bg-white text-xs font-bold uppercase tracking-[0.16em] text-stone-700 transition-colors hover:border-stone-500 sm:hidden"
              >
                <ImagePlus className="h-6 w-6" />
                {t("Galleria")}
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="hidden aspect-square flex-col items-center justify-center gap-3 rounded-lg border border-stone-200 bg-white text-xs font-bold uppercase tracking-[0.16em] text-stone-700 transition-colors hover:border-stone-500 sm:flex"
              >
                <Upload className="h-6 w-6" />
                {t("Carica foto")}
              </button>
              {displayImages.map((imageUrl, index) => (
                <div key={`${imageUrl}-${index}`} className="group relative aspect-square overflow-hidden rounded-lg bg-stone-100">
                  <img
                    src={imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    loading={index === 0 ? "eager" : "lazy"}
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute right-2 top-2 rounded-full bg-white/90 p-2 text-stone-700 shadow-lg transition-colors hover:text-red-600"
                    aria-label={t("Remover imagem")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <label className="mt-6 block text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
              {t("Didascalia")}
            </label>
            <textarea
              rows={5}
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              placeholder={t("Scrivi una didascalia...")}
              className="mt-2 w-full resize-none rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm leading-6 text-stone-700 outline-none transition-colors placeholder:text-stone-400 focus:border-stone-700"
              maxLength={2200}
            />

            {errorMessage && (
              <p className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {errorMessage}
              </p>
            )}
          </div>

          <div className="border-t border-stone-100 px-5 py-4">
            <button
              type="submit"
              disabled={isUploading || isPublishing || media.length === 0}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-stone-950 text-xs font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-black disabled:bg-stone-300"
            >
              {(isUploading || isPublishing) && <Loader2 className="h-4 w-4 animate-spin" />}
              {isUploading ? t("Caricamento...") : isPublishing ? t("Pubblicazione...") : t("Pubblica")}
            </button>
          </div>
        </motion.form>
      </motion.div>
    </AnimatePresence>
  );
}
