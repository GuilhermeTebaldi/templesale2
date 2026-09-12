import React from "react";
import { AnimatePresence } from "motion/react";
import { ChevronLeft, Loader2, MessageSquare, Send, Sparkles, X } from "lucide-react";
import { api, type EstablishmentDto, type PublicationDto } from "../lib/api";
import { getCompatibleImageUrl } from "../lib/product-images";
import { CameraCapture } from "./photo-publisher/components/CameraCapture";
import { FilterControls } from "./photo-publisher/components/FilterControls";
import { OverlayToolbar } from "./photo-publisher/components/OverlayToolbar";
import { PhotoEditorCanvas } from "./photo-publisher/components/PhotoEditorCanvas";
import { PostCaptionArea } from "./photo-publisher/components/PostCaptionArea";
import { TextOverlayEditor } from "./photo-publisher/components/TextOverlayEditor";
import { FILTER_PRESETS } from "./photo-publisher/data/filters";
import { renderCompositeImage } from "./photo-publisher/utils/canvasRenderer";
import type {
  FilterPreset,
  OverlayItem,
  PhotoAdjustments,
  PhotoCrop,
} from "./photo-publisher/types";
import { useI18n } from "../i18n/provider";

interface NewPublicationProps {
  establishment: EstablishmentDto;
  onClose: () => void;
  onPublished: (publication: PublicationDto) => void;
  onPublishStarted?: () => void;
  onPublishFinished?: () => void;
  onPublishFailed?: (error: Error) => void;
}

function dataUrlToFile(dataUrl: string, fileName: string): File {
  const [header = "", data = ""] = dataUrl.split(",");
  const mime = header.match(/data:(.*?);base64/)?.[1] || "image/jpeg";
  const binary = window.atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new File([bytes], fileName, { type: mime });
}

export default function NewPublication({
  establishment,
  onClose,
  onPublished,
  onPublishStarted,
  onPublishFinished,
  onPublishFailed,
}: NewPublicationProps) {
  const { t } = useI18n();
  const [currentImage, setCurrentImage] = React.useState<string | null>(null);
  const [photoCrop, setPhotoCrop] = React.useState<PhotoCrop>({ x: 0, y: 0, scale: 1 });
  const [containerDims, setContainerDims] = React.useState({ width: 1080, height: 1080 });
  const [selectedFilter, setSelectedFilter] = React.useState<FilterPreset>(FILTER_PRESETS[0]);
  const [adjustments, setAdjustments] = React.useState<PhotoAdjustments>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    sepia: 0,
  });
  const [activeBottomTab, setActiveBottomTab] = React.useState<"filters" | "caption">("caption");
  const [overlays, setOverlays] = React.useState<OverlayItem[]>([]);
  const [selectedOverlayId, setSelectedOverlayId] = React.useState<string | null>(null);
  const [isTextEditorOpen, setIsTextEditorOpen] = React.useState(false);
  const [editingOverlay, setEditingOverlay] = React.useState<OverlayItem | null>(null);
  const [caption, setCaption] = React.useState("");
  const [isPublishing, setIsPublishing] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [isKeyboardOpen, setIsKeyboardOpen] = React.useState(false);

  const selectedOverlay = overlays.find((overlay) => overlay.id === selectedOverlayId);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateViewport = () => {
      const viewport = window.visualViewport;
      const height = viewport?.height ?? window.innerHeight;
      const offsetTop = viewport?.offsetTop ?? 0;
      const keyboardOpen = Boolean(viewport) && window.innerHeight - height > 120;

      setIsKeyboardOpen(keyboardOpen);
      document.documentElement.style.setProperty("--ts-publication-vh", `${height}px`);
      document.documentElement.style.setProperty("--ts-publication-vv-top", `${offsetTop}px`);
    };

    updateViewport();
    window.visualViewport?.addEventListener("resize", updateViewport);
    window.visualViewport?.addEventListener("scroll", updateViewport);
    window.addEventListener("resize", updateViewport);

    return () => {
      window.visualViewport?.removeEventListener("resize", updateViewport);
      window.visualViewport?.removeEventListener("scroll", updateViewport);
      window.removeEventListener("resize", updateViewport);
      document.documentElement.style.removeProperty("--ts-publication-vh");
      document.documentElement.style.removeProperty("--ts-publication-vv-top");
    };
  }, []);

  const resetEditor = React.useCallback(() => {
    setCurrentImage(null);
    setPhotoCrop({ x: 0, y: 0, scale: 1 });
    setSelectedFilter(FILTER_PRESETS[0]);
    setAdjustments({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      sepia: 0,
    });
    setOverlays([]);
    setSelectedOverlayId(null);
    setCaption("");
    setActiveBottomTab("caption");
    setErrorMessage("");
  }, []);

  const handlePhotoTaken = (imageSrc: string) => {
    resetEditor();
    setCurrentImage(imageSrc);
  };

  const handleSaveOverlay = (overlayData: Omit<OverlayItem, "id" | "x" | "y">) => {
    if (editingOverlay) {
      setOverlays((current) =>
        current.map((item) =>
          item.id === editingOverlay.id ? { ...item, ...overlayData } : item,
        ),
      );
      setSelectedOverlayId(editingOverlay.id);
      setEditingOverlay(null);
    } else {
      const newOverlay: OverlayItem = {
        ...overlayData,
        id: `overlay-${Date.now()}`,
        x: 50,
        y: 50,
      };
      setOverlays((current) => [...current, newOverlay]);
      setSelectedOverlayId(newOverlay.id);
    }
    setIsTextEditorOpen(false);
  };

  const handleUpdateOverlay = React.useCallback((id: string, updates: Partial<OverlayItem>) => {
    setOverlays((current) =>
      current.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    );
  }, []);

  const handleRemoveOverlay = React.useCallback((id: string) => {
    setOverlays((current) => current.filter((item) => item.id !== id));
    setSelectedOverlayId((current) => (current === id ? null : current));
  }, []);

  const handleDuplicateOverlay = (id: string) => {
    const original = overlays.find((item) => item.id === id);
    if (!original) return;

    const duplicated: OverlayItem = {
      ...original,
      id: `overlay-${Date.now()}`,
      x: Math.min(90, original.x + 4),
      y: Math.min(90, original.y + 4),
    };

    setOverlays((current) => [...current, duplicated]);
    setSelectedOverlayId(duplicated.id);
  };

  const handlePublish = async () => {
    if (!currentImage || isPublishing) return;

    setIsPublishing(true);
    setErrorMessage("");
    try {
      const finalCompositeUrl = await renderCompositeImage(
        currentImage,
        selectedFilter,
        adjustments,
        overlays,
        photoCrop,
        containerDims,
      );
      const imageFile = dataUrlToFile(finalCompositeUrl, `templesale-publication-${Date.now()}.jpg`);

      onPublishStarted?.();
      onClose();

      const uploadResponse = await api.uploadProductImage(imageFile);
      const imageUrl = getCompatibleImageUrl(uploadResponse.url);
      if (!imageUrl) {
        throw new Error(t("Falha ao enviar imagem."));
      }

      const publication = await api.createPublication(establishment.id, {
        caption: caption.trim(),
        media: [imageUrl],
      });
      onPublished(publication);
    } catch (error) {
      const normalizedError = error instanceof Error ? error : new Error(t("Falha ao publicar."));
      setErrorMessage(normalizedError.message);
      onPublishFailed?.(normalizedError);
    } finally {
      setIsPublishing(false);
      onPublishFinished?.();
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-x-0 z-[120] flex items-start justify-center overflow-hidden overscroll-none bg-black text-neutral-100"
        style={{
          top: "var(--ts-publication-vv-top, 0px)",
          height: "var(--ts-publication-vh, 100dvh)",
        }}
      >
        <div className="relative h-full w-full max-w-lg overflow-hidden bg-black shadow-2xl">
          <button
            type="button"
            onClick={onClose}
            className={`absolute right-3 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/70 text-white shadow-xl backdrop-blur-md transition-colors hover:bg-neutral-900 ${
              currentImage ? "top-14" : "top-3"
            }`}
            aria-label={t("Fechar")}
          >
            <X className="h-4.5 w-4.5" />
          </button>

          {!currentImage ? (
            <main className="h-full w-full">
              <CameraCapture onPhotoTaken={handlePhotoTaken} />
            </main>
          ) : (
            <main
              id="editor-main-layout"
              className={`relative flex h-full min-h-0 w-full flex-col ${
                isKeyboardOpen
                  ? "overflow-y-auto overscroll-contain ts-publication-keyboard-open"
                  : "overflow-hidden"
              } bg-black`}
            >
              <header className="z-20 flex shrink-0 items-center justify-between border-b border-neutral-800/80 bg-neutral-950/90 px-4 py-2.5 backdrop-blur-md">
                <button
                  type="button"
                  id="btn-back-camera"
                  onClick={resetEditor}
                  className="flex items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-1 text-xs font-semibold text-neutral-300 transition hover:text-white active:scale-95"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Tirar outra
                </button>

                <span className="text-xs font-bold tracking-wide text-neutral-200">
                  Editar Foto
                </span>

                <button
                  type="button"
                  id="btn-header-publish"
                  onClick={() => void handlePublish()}
                  disabled={isPublishing}
                  className="flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-md transition hover:bg-blue-500 disabled:opacity-50 active:scale-95"
                >
                  {isPublishing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  <span>{isPublishing ? "Publicando..." : "Publicar"}</span>
                </button>
              </header>

              <PhotoEditorCanvas
                imageSrc={currentImage}
                filter={selectedFilter}
                adjustments={adjustments}
                crop={photoCrop}
                onChangeCrop={setPhotoCrop}
                overlays={overlays}
                selectedOverlayId={selectedOverlayId}
                onSelectOverlay={setSelectedOverlayId}
                onUpdateOverlay={handleUpdateOverlay}
                onOpenTextEditor={(overlay) => {
                  setEditingOverlay(overlay || null);
                  setIsTextEditorOpen(true);
                }}
                onRemoveOverlay={handleRemoveOverlay}
                onDimensionsChange={setContainerDims}
                enableTextOverlays={false}
              />

              {false && selectedOverlay && (
                <div className="z-30 shrink-0">
                  <OverlayToolbar
                    selectedItem={selectedOverlay}
                    onUpdate={(updates) => handleUpdateOverlay(selectedOverlay.id, updates)}
                    onDelete={() => handleRemoveOverlay(selectedOverlay.id)}
                    onDuplicate={() => handleDuplicateOverlay(selectedOverlay.id)}
                    onEdit={() => {
                      setEditingOverlay(selectedOverlay);
                      setIsTextEditorOpen(true);
                    }}
                  />
                </div>
              )}

              <div className="z-20 shrink-0 border-t border-neutral-800/80 bg-neutral-950">
                <div className="flex items-center justify-between border-b border-neutral-900 bg-neutral-950/80 px-3 py-1.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      id="tab-dock-filters"
                      onClick={() => setActiveBottomTab("filters")}
                      className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition ${
                        activeBottomTab === "filters"
                          ? "border border-neutral-700 bg-neutral-800 text-white"
                          : "text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      <Sparkles className="h-3 w-3 text-amber-400" />
                      <span>Filtros & Efeitos</span>
                    </button>

                    <button
                      type="button"
                      id="tab-dock-caption"
                      onClick={() => setActiveBottomTab("caption")}
                      className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition ${
                        activeBottomTab === "caption"
                          ? "border border-neutral-700 bg-neutral-800 text-white"
                          : "text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      <MessageSquare className="h-3 w-3 text-sky-400" />
                      <span>Legenda</span>
                      {caption.trim() && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                    </button>
                  </div>
                </div>

                {activeBottomTab === "filters" ? (
                  <FilterControls
                    imageSrc={currentImage}
                    selectedFilter={selectedFilter}
                    onSelectFilter={setSelectedFilter}
                    adjustments={adjustments}
                    onChangeAdjustments={setAdjustments}
                  />
                ) : (
                  <PostCaptionArea caption={caption} onChangeCaption={setCaption} />
                )}
              </div>
            </main>
          )}

          {errorMessage && (
            <div className="absolute inset-x-4 bottom-4 z-[60] rounded-2xl border border-red-500/30 bg-red-950/95 px-4 py-3 text-sm text-red-100 shadow-2xl">
              {errorMessage}
            </div>
          )}
        </div>

        {false && isTextEditorOpen && (
          <TextOverlayEditor
            initialOverlay={editingOverlay}
            onSave={handleSaveOverlay}
            onCancel={() => {
              setIsTextEditorOpen(false);
              setEditingOverlay(null);
            }}
          />
        )}
      </div>
    </AnimatePresence>
  );
}
