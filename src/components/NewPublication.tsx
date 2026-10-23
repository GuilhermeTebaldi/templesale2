import React from "react";
import { AnimatePresence } from "motion/react";
import { ChevronLeft, Loader2, MessageSquare, Send, Sparkles, X } from "lucide-react";
import { api, type EstablishmentDto, type PublicationDto } from "../lib/api";
import { getCompatibleImageUrl } from "../lib/product-images";
import { CameraCapture, usesNativePhotoCapture, usesSystemPhotoSourceMenu } from "./photo-publisher/components/CameraCapture";
import GlobalLoadingOverlay from "./GlobalLoadingOverlay";
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
import { loadPublicationDraft, savePublicationDraft, clearPublicationDraft, type PublicationDraft } from "../lib/publication-draft";
import { WriteBusyError } from '../lib/write-operation';

interface NewPublicationProps {
  photoInputRef?: React.RefObject<HTMLInputElement | null>;
  establishment: EstablishmentDto;
  onClose: () => void;
  onPublished: (publication: PublicationDto, alreadyConfirmed?: boolean) => void;
  onPublishStarted?: () => void;
  onPublishFinished?: () => void;
  onPublishFailed?: (error: Error) => void;
}

function dismissEditorKeyboard() {
  const focused = document.activeElement;
  if (focused instanceof HTMLElement && focused.closest('#editor-main-layout')) focused.blur();
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
  photoInputRef,
  establishment,
  onClose,
  onPublished,
  onPublishStarted,
  onPublishFinished,
  onPublishFailed,
}: NewPublicationProps) {
  const { t } = useI18n();
  const localPhotoInputRef = React.useRef<HTMLInputElement | null>(null);
  const nativePhotoInputRef = photoInputRef ?? localPhotoInputRef;
  const systemSourceMenu = usesSystemPhotoSourceMenu();
  const [pendingNativeImage, setPendingNativeImage] = React.useState<string | null>(null);
  const [nativePickerOpened, setNativePickerOpened] = React.useState(false);
  const [nativePickerCancelled, setNativePickerCancelled] = React.useState(false);
  const nativeReader = React.useRef<FileReader | null>(null);
  React.useEffect(() => () => nativeReader.current?.abort(), []);
  React.useEffect(() => {
    const input = nativePhotoInputRef.current;
    const cancel = () => setNativePickerCancelled(true);
    input?.addEventListener('cancel', cancel);
    return () => input?.removeEventListener('cancel', cancel);
  }, [nativePhotoInputRef]);
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
  const [backgroundPublishing, setBackgroundPublishing] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [isKeyboardOpen, setIsKeyboardOpen] = React.useState(false);
  const [draftLoading, setDraftLoading] = React.useState(true);
  const [draftNotice, setDraftNotice] = React.useState('');
  const [discarding, setDiscarding] = React.useState(false);
  const preparedRef = React.useRef<{ image: string; settings: string; draft: PublicationDraft } | null>(null);
  const sendingRef = React.useRef(false);
  const controllerRef = React.useRef<AbortController | null>(null);
  const settings = JSON.stringify([selectedFilter, adjustments, overlays, photoCrop]);
  React.useEffect(() => {
    let cancelled = false;
    let objectUrl: string | undefined;
    void loadPublicationDraft(establishment.id).then(draft => {
      if (cancelled || !draft) return;
      objectUrl = URL.createObjectURL(draft.source ?? draft.file);
      const editor = draft.editor;
      if (editor) {
        setSelectedFilter(editor.filter); setAdjustments(editor.adjustments);
        setPhotoCrop(editor.crop); setOverlays(editor.overlays);
        setContainerDims(editor.dimensions);
      }
      preparedRef.current = { image: objectUrl, settings: editor ? JSON.stringify([editor.filter,editor.adjustments,editor.overlays,editor.crop]) : settings, draft };
      setCurrentImage(objectUrl); setCaption(draft.caption);
      setDraftNotice("Bozza recuperata. Puoi riprendere la pubblicazione.");
    }).finally(() => { if (!cancelled) setDraftLoading(false); });
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [establishment.id]);

  const selectedOverlay = overlays.find((overlay) => overlay.id === selectedOverlayId);
  const handleDimensionsChange = React.useCallback((next: {width:number;height:number}) => {
    if (!next.width || !next.height) return;
    const crop = { ...photoCrop, x:Math.round(photoCrop.x*next.width/containerDims.width), y:Math.round(photoCrop.y*next.height/containerDims.height) };
    const cached=preparedRef.current;
    if (cached?.settings===settings) cached.settings=JSON.stringify([selectedFilter,adjustments,overlays,crop]);
    setPhotoCrop(crop);setContainerDims(next);
  },[photoCrop,containerDims,settings,selectedFilter,adjustments,overlays]);

  React.useEffect(() => {
    if (typeof window === "undefined" || backgroundPublishing) {
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
  }, [backgroundPublishing]);

  const discardDraft = async () => {
    if (sendingRef.current || draftLoading || discarding) return;
    setDiscarding(true);
    const old=preparedRef.current?.draft;
    await clearPublicationDraft(establishment.id);
    preparedRef.current=null;
    resetEditor();
    setDraftNotice('');
    if (old?.uploadKey) {
      try { await api.discardPublicationUpload(establishment.id,old.uploadKey); }
      catch { setDraftNotice("Bozza eliminata. La prenotazione dell’invio precedente può richiedere alcuni minuti per scadere."); }
    }
    setDiscarding(false);
  };

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

  React.useEffect(() => {
    if (draftLoading || !pendingNativeImage) return;
    let cancelled = false;
    void (async () => {
      // A new choice replaces the old draft only after reading the photo.
      // Cancelling the native picker leaves the recovered draft untouched.
      if (preparedRef.current) await discardDraft();
      if (!cancelled) {
        setDraftNotice(''); handlePhotoTaken(pendingNativeImage);
        setPendingNativeImage(null);
      }
    })();
    return () => { cancelled = true; };
  }, [draftLoading, pendingNativeImage]);
  React.useEffect(() => {
    if (!nativePickerCancelled || draftLoading) return;
    setNativePickerCancelled(false);
    if (!currentImage) onClose();
  }, [nativePickerCancelled, draftLoading, currentImage, onClose]);

  const requestAnotherPhoto = () => {
    if (systemSourceMenu) nativePhotoInputRef.current?.click();
    else void discardDraft();
  };
  const nativePhotoInput = systemSourceMenu && <input
    ref={nativePhotoInputRef} id="publication-native-photo-input" type="file" accept="image/*" className="hidden"
    onClick={() => setNativePickerOpened(true)}
    onChange={event => {
      const file = event.currentTarget.files?.[0]; event.currentTarget.value = '';
      if (!file) { setNativePickerCancelled(true); return; }
      nativeReader.current?.abort();
      const reader = new FileReader(); nativeReader.current = reader;
      reader.onload = () => { if (nativeReader.current === reader) setPendingNativeImage(String(reader.result)); };
      reader.onerror = () => { setErrorMessage('Impossibile leggere la foto. Riprova.'); };
      reader.readAsDataURL(file);
    }}
  />;

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
    if (!currentImage || sendingRef.current || draftLoading) return;
    sendingRef.current = true;
    const controller = new AbortController();
    controllerRef.current = controller;
    const deadline = setTimeout(() => controller.abort(new Error("L’invio ha superato il tempo previsto. La bozza è conservata; controlla la pubblicazione prima di riprendere.")), 120000);

    setIsPublishing(true);
    setErrorMessage("");
    const resumingOperation = Boolean(preparedRef.current?.draft.operationKey);
    let stage = "la preparazione della foto";
    try {
      onPublishStarted?.();
      const cached = preparedRef.current;
      let draft = cached?.image === currentImage && cached.settings === settings ? cached.draft : undefined;
      if (cached?.draft.operationKey) {
        stage = "la verifica dell’invio precedente";
        const confirmed = await api.getPublicationOperation(establishment.id, cached.draft.operationKey, controller.signal);
        if (confirmed) { await clearPublicationDraft(establishment.id); onPublished(confirmed, true); onClose(); return; }
        if (!draft || caption.trim() !== cached.draft.caption) throw new Error("L’invio precedente deve ancora essere confermato. Riprendi la foto e la didascalia conservate prima di iniziare un altro invio.");
      }
      if (!draft) {
      stage = "la preparazione della foto";
      const finalCompositeUrl = await renderCompositeImage(
        currentImage,
        selectedFilter,
        adjustments,
        overlays,
        photoCrop,
        containerDims,
      );
      const imageFile = dataUrlToFile(finalCompositeUrl, `templesale-publication-${Date.now()}.jpg`);
        // CameraCapture supplies a local data URL; recovered images already
        // have their Blob in the draft. Do not fetch data:/blob: URLs: our
        // connect-src policy intentionally permits only network API endpoints.
        const source = cached?.image === currentImage
          ? cached.draft.source ?? cached.draft.file
          : dataUrlToFile(currentImage, `templesale-original-${Date.now()}`);
        draft = { file: imageFile, source, editor: { filter:selectedFilter, adjustments, overlays, crop:photoCrop, dimensions:containerDims }, caption: caption.trim(), savedAt: Date.now() };
        preparedRef.current = { image: currentImage, settings, draft };
      }
      if (!draft.operationKey) draft.caption = caption.trim();
      const persist = async () => {
        if (!await savePublicationDraft(establishment.id, draft!)) setDraftNotice("Il browser non ha consentito di salvare la bozza. È conservata soltanto in questa sessione.");
      };
      await persist();
      if (!draft.uploadedUrl) {
      stage = "l’invio della foto";
      draft.uploadKey??=crypto.randomUUID();await persist();
      const uploadResponse = await api.uploadPublicationImage(establishment.id,draft.file,draft.uploadKey,{signal:controller.signal});
      const imageUrl = getCompatibleImageUrl(uploadResponse.url);
      if (!imageUrl) {
        throw new Error(t("Falha ao enviar imagem."));
      }
        draft.uploadedUrl = imageUrl; draft.uploadReceiptId=uploadResponse.receiptId;await persist();
      }
      stage = "la conferma della pubblicazione";
      const publication = await api.createPublication(establishment.id, {
        caption: draft.caption,
        media: [draft.uploadedUrl!],
        uploadReceiptId:draft.uploadReceiptId,
      }, { signal: controller.signal, clientRequestId: draft.operationKey, onOperation: async key => { draft!.operationKey = key; await persist(); } });
      await clearPublicationDraft(establishment.id);
      onPublished(publication);
      onClose();
    } catch (error) {
      if (error instanceof WriteBusyError && !resumingOperation && preparedRef.current) {
        // Explicit admission refusal means no publication write started.
        preparedRef.current.draft.operationKey = undefined;
        await savePublicationDraft(establishment.id,preparedRef.current.draft);
      }
      const failure = error instanceof Error ? error : new Error(t("Falha ao publicar."));
      const normalizedError = /load failed|failed to fetch|networkerror/i.test(failure.message)
        ? new Error(`Errore di connessione durante ${stage}. La bozza è conservata. Riprendi l’invio quando la connessione sarà ripristinata.`)
        : failure;
      setErrorMessage(normalizedError.message);
      onPublishFailed?.(normalizedError);
      onClose();
    } finally {
      clearTimeout(deadline); sendingRef.current = false;
      controllerRef.current = null;
      setIsPublishing(false);
      onPublishFinished?.();
    }
  };

  const beginPublish = () => { if (!currentImage || sendingRef.current || draftLoading) return; dismissEditorKeyboard(); setBackgroundPublishing(true); void handlePublish(); };
  const closeEditor = () => { dismissEditorKeyboard(); controllerRef.current?.abort(new Error("Invio interrotto. La bozza è conservata.")); onClose(); };
  if (backgroundPublishing) return null;
  if (systemSourceMenu && !currentImage) return <>{nativePhotoInput}{draftLoading || pendingNativeImage
    ? <GlobalLoadingOverlay forceVisible />
    : errorMessage ? <div role="alert" className="fixed inset-0 z-[120] flex flex-col items-center justify-center gap-3 bg-white p-6 text-slate-900">
        <p>{errorMessage}</p><button type="button" onClick={() => nativePhotoInputRef.current?.click()}>Riprova</button><button type="button" onClick={closeEditor}>Chiudi</button>
      </div> : (!nativePickerOpened && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40" onClick={closeEditor}>
        <button type="button" className="rounded-2xl bg-white px-6 py-4 font-semibold text-slate-900" onClick={event => { event.stopPropagation(); nativePhotoInputRef.current?.click(); }}>Scegli foto</button>
      </div>)}</>;
  if (usesNativePhotoCapture() && !currentImage) return draftLoading
    ? <GlobalLoadingOverlay forceVisible />
    : <CameraCapture onPhotoTaken={handlePhotoTaken} onCancel={closeEditor} />;
  return (
    <>
    {nativePhotoInput}
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] overflow-hidden overscroll-none bg-black text-neutral-100">
        <div
          className="absolute inset-x-0 flex items-start justify-center"
          style={{
            top: "var(--ts-publication-vv-top, 0px)",
            height: "var(--ts-publication-vh, 100dvh)",
          }}
        >
          <div className="relative h-full w-full max-w-lg overflow-hidden bg-black shadow-2xl">
          {!currentImage && <button
            type="button"
            onClick={closeEditor}
            disabled={draftLoading}
            className="absolute right-3 top-3 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/70 text-white shadow-xl backdrop-blur-md transition-colors hover:bg-neutral-900"
            aria-label={t("Fechar")}
          >
            <X className="h-4.5 w-4.5" />
          </button>}

          {(draftNotice || draftLoading || discarding) && <div role="status" className="absolute top-16 inset-x-4 z-40 rounded-lg bg-white p-3 text-xs text-slate-900 shadow"><p>{draftLoading ? "Recupero della bozza..." : discarding ? "Eliminazione della bozza..." : draftNotice}</p>{currentImage && !draftLoading && <button type="button" disabled={discarding} className="mt-2 font-semibold text-red-700 underline" onClick={requestAnotherPhoto}>Elimina la bozza e scegli un’altra foto</button>}</div>}
          {isPublishing && <div role="status" aria-label="Pubblicazione in corso" className="ts-comment-progress absolute inset-x-0 top-0 z-50" />}
          {!currentImage ? (
            <main className="h-full w-full">
              <CameraCapture onPhotoTaken={handlePhotoTaken} />
            </main>
          ) : (
            <main
              id="editor-main-layout"
              inert={isPublishing ? true : undefined}
              className={`relative flex h-full min-h-0 w-full flex-col ${
                isKeyboardOpen
                  ? "overflow-hidden ts-publication-keyboard-open"
                  : "overflow-hidden"
              } bg-black`}
            >
              <header className="z-20 flex shrink-0 items-center justify-between border-b border-neutral-800/80 bg-neutral-950/90 px-4 py-2.5 backdrop-blur-md">
                <button
                  type="button"
                  id="btn-back-camera"
                  onClick={requestAnotherPhoto}
                  disabled={isPublishing || draftLoading || discarding}
                  className="flex items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-1 text-xs font-semibold text-neutral-300 transition hover:text-white active:scale-95"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Scegli un’altra foto
                </button>

                <span className="text-xs font-bold tracking-wide text-neutral-200">
                  Modifica foto
                </span>

                <button
                  type="button"
                  id="btn-header-close"
                  onClick={closeEditor}
                  disabled={isPublishing || draftLoading || discarding}
                  aria-label="Chiudi editor"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900 text-neutral-300 transition hover:text-white disabled:opacity-50 active:scale-95"
                >
                  <X className="h-5 w-5" />
                </button>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <div className="relative">
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
                onDimensionsChange={handleDimensionsChange}
                enableTextOverlays={false}
              />
              </div>
              </div>

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

              <div className="z-20 max-h-[65%] shrink-0 overflow-y-auto overscroll-contain border-t border-neutral-800/80 bg-neutral-950">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-900 bg-neutral-950/80 px-3 py-1.5">
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
                      <span>Filtri ed effetti</span>
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
                      <span>Didascalia</span>
                      {caption.trim() && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                    </button>
                  </div>
                  <button type="button" id="btn-caption-publish" onClick={beginPublish}
                    disabled={isPublishing || draftLoading || discarding}
                    className="ml-2 flex shrink-0 items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50">
                    <Send className="h-3.5 w-3.5" />
                    <span>Pubblica</span>
                  </button>
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
            <div role="alert" className="absolute inset-x-4 bottom-4 z-[60] rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-2xl">
              {errorMessage}
            </div>
          )}
          </div>
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
    </>
  );
}
