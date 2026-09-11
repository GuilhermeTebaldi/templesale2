import React, { useRef, useState, useEffect } from 'react';
import {
  Type,
  RotateCw,
  Maximize2,
  Edit3,
  Plus,
  Minus,
  Move,
  RotateCcw,
} from 'lucide-react';
import { FilterPreset, PhotoAdjustments, OverlayItem, PhotoCrop } from '../types';

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

interface PhotoEditorCanvasProps {
  imageSrc: string;
  filter: FilterPreset;
  adjustments: PhotoAdjustments;
  crop: PhotoCrop;
  onChangeCrop: (crop: PhotoCrop) => void;
  overlays: OverlayItem[];
  selectedOverlayId: string | null;
  onSelectOverlay: (id: string | null) => void;
  onUpdateOverlay: (id: string, updates: Partial<OverlayItem>) => void;
  onOpenTextEditor: (overlay?: OverlayItem) => void;
  onRemoveOverlay?: (id: string) => void;
  onDimensionsChange?: (dims: { width: number; height: number }) => void;
}

export const PhotoEditorCanvas: React.FC<PhotoEditorCanvasProps> = ({
  imageSrc,
  filter,
  adjustments,
  crop,
  onChangeCrop,
  overlays,
  selectedOverlayId,
  onSelectOverlay,
  onUpdateOverlay,
  onOpenTextEditor,
  onDimensionsChange,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);

  // Keep references to handlers to prevent stale closures or re-attachment bugs
  const onUpdateOverlayRef = useRef(onUpdateOverlay);
  onUpdateOverlayRef.current = onUpdateOverlay;

  const onSelectOverlayRef = useRef(onSelectOverlay);
  onSelectOverlayRef.current = onSelectOverlay;

  const onOpenTextEditorRef = useRef(onOpenTextEditor);
  onOpenTextEditorRef.current = onOpenTextEditor;

  const onChangeCropRef = useRef(onChangeCrop);
  onChangeCropRef.current = onChangeCrop;

  const cropRef = useRef(crop);
  cropRef.current = crop;

  const onDimensionsChangeRef = useRef(onDimensionsChange);
  onDimensionsChangeRef.current = onDimensionsChange;

  // Active interaction tracking
  const interactionMode = useRef<'move' | 'resize' | 'rotate' | 'pan-photo' | null>(null);
  const activeItemId = useRef<string | null>(null);
  const startPointerPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMovedSignificantly = useRef<boolean>(false);
  const [isPanningPhoto, setIsPanningPhoto] = useState<boolean>(false);

  const initialCropState = useRef<PhotoCrop>({ x: 0, y: 0, scale: 1 });

  const initialItemState = useRef<{
    x: number;
    y: number;
    fontSize: number;
    rotation: number;
    centerScreenX: number;
    centerScreenY: number;
  }>({
    x: 50,
    y: 50,
    fontSize: 24,
    rotation: 0,
    centerScreenX: 0,
    centerScreenY: 0,
  });

  // Mobile pinch-to-zoom tracking
  const initialPinchDistance = useRef<number | null>(null);
  const initialPinchFontSize = useRef<number>(24);
  const initialPinchCropScale = useRef<number>(1);

  // Live feedback indicator
  const [activeFeedback, setActiveFeedback] = useState<string | null>(null);

  const clampCropToImageBounds = (nextCrop: PhotoCrop): PhotoCrop => {
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect || !imageSize) {
      return nextCrop;
    }

    const coverScale = Math.max(
      containerRect.width / imageSize.width,
      containerRect.height / imageSize.height,
    );
    const renderedWidth = imageSize.width * coverScale * nextCrop.scale;
    const renderedHeight = imageSize.height * coverScale * nextCrop.scale;
    const maxX = Math.max(0, (renderedWidth - containerRect.width) / 2);
    const maxY = Math.max(0, (renderedHeight - containerRect.height) / 2);

    return {
      ...nextCrop,
      x: Math.round(clamp(nextCrop.x, -maxX, maxX)),
      y: Math.round(clamp(nextCrop.y, -maxY, maxY)),
    };
  };

  // Compute CSS filter string
  const cssFilterParts: string[] = [];
  if (filter.id !== 'normal' && filter.filterString !== 'none') {
    cssFilterParts.push(filter.filterString);
  }
  if (adjustments.brightness !== 100) {
    cssFilterParts.push(`brightness(${adjustments.brightness / 100})`);
  }
  if (adjustments.contrast !== 100) {
    cssFilterParts.push(`contrast(${adjustments.contrast / 100})`);
  }
  if (adjustments.saturation !== 100) {
    cssFilterParts.push(`saturate(${adjustments.saturation / 100})`);
  }
  if (adjustments.sepia > 0) {
    cssFilterParts.push(`sepia(${adjustments.sepia / 100})`);
  }
  const combinedFilter = cssFilterParts.length > 0 ? cssFilterParts.join(' ') : 'none';

  // Monitor container dimensions
  useEffect(() => {
    if (!containerRef.current) return;
    const reportDims = () => {
      if (containerRef.current && onDimensionsChangeRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        onDimensionsChangeRef.current({ width: rect.width, height: rect.height });
      }
    };
    reportDims();
    const observer = new ResizeObserver(reportDims);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageSize({
        width: img.naturalWidth || img.width || 1,
        height: img.naturalHeight || img.height || 1,
      });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Universal pointer move listener attached to window during drag/resize/rotate/pan
  useEffect(() => {
    const onWindowPointerMove = (e: PointerEvent) => {
      if (!interactionMode.current || !containerRef.current) return;

      const deltaPixelX = e.clientX - startPointerPos.current.x;
      const deltaPixelY = e.clientY - startPointerPos.current.y;
      if (Math.hypot(deltaPixelX, deltaPixelY) > 4) {
        hasMovedSignificantly.current = true;
      }

      // 1. Photo Pan (Crop movement)
      if (interactionMode.current === 'pan-photo') {
        const newX = Math.round(initialCropState.current.x + deltaPixelX);
        const newY = Math.round(initialCropState.current.y + deltaPixelY);
        onChangeCropRef.current(clampCropToImageBounds({
          ...initialCropState.current,
          x: newX,
          y: newY,
        }));
        return;
      }

      // 2. Overlay interactions (Move, Resize, Rotate)
      if (!activeItemId.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();

      if (interactionMode.current === 'move') {
        const deltaPercentX = (deltaPixelX / containerRect.width) * 100;
        const deltaPercentY = (deltaPixelY / containerRect.height) * 100;

        // Free lateral and vertical movement across full canvas (5% to 95%)
        const newX = Math.round(
          Math.max(5, Math.min(95, initialItemState.current.x + deltaPercentX))
        );
        const newY = Math.round(
          Math.max(5, Math.min(95, initialItemState.current.y + deltaPercentY))
        );

        onUpdateOverlayRef.current(activeItemId.current, { x: newX, y: newY });
      } else if (interactionMode.current === 'resize') {
        // Distance from item center to pointer
        const dx = e.clientX - initialItemState.current.centerScreenX;
        const dy = e.clientY - initialItemState.current.centerScreenY;
        const currentDistance = Math.hypot(dx, dy);

        const startDx = startPointerPos.current.x - initialItemState.current.centerScreenX;
        const startDy = startPointerPos.current.y - initialItemState.current.centerScreenY;
        const startDistance = Math.max(25, Math.hypot(startDx, startDy));

        const ratio = currentDistance / startDistance;
        const newSize = Math.round(
          Math.max(14, Math.min(150, initialItemState.current.fontSize * ratio))
        );

        setActiveFeedback(`${newSize}px`);
        onUpdateOverlayRef.current(activeItemId.current, { fontSize: newSize });
      } else if (interactionMode.current === 'rotate') {
        const dx = e.clientX - initialItemState.current.centerScreenX;
        const dy = e.clientY - initialItemState.current.centerScreenY;
        const currentAngle = (Math.atan2(dy, dx) * 180) / Math.PI;

        const startDx = startPointerPos.current.x - initialItemState.current.centerScreenX;
        const startDy = startPointerPos.current.y - initialItemState.current.centerScreenY;
        const startAngle = (Math.atan2(startDy, startDx) * 180) / Math.PI;

        const deltaAngle = currentAngle - startAngle;
        let newRot = Math.round(initialItemState.current.rotation + deltaAngle);
        if (Math.abs(newRot % 360) < 4) newRot = 0;

        setActiveFeedback(`${newRot}°`);
        onUpdateOverlayRef.current(activeItemId.current, { rotation: newRot });
      }
    };

    const onWindowPointerUp = () => {
      interactionMode.current = null;
      activeItemId.current = null;
      setActiveFeedback(null);
      setIsPanningPhoto(false);
    };

    window.addEventListener('pointermove', onWindowPointerMove);
    window.addEventListener('pointerup', onWindowPointerUp);

    return () => {
      window.removeEventListener('pointermove', onWindowPointerMove);
      window.removeEventListener('pointerup', onWindowPointerUp);
    };
  }, []);

  // Handler: Pointer Down on the container background (Pan photo or deselect)
  const handleContainerPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // If clicking directly on photo/container background
    onSelectOverlayRef.current(null);

    interactionMode.current = 'pan-photo';
    startPointerPos.current = { x: e.clientX, y: e.clientY };
    initialCropState.current = { ...cropRef.current };
    setIsPanningPhoto(true);
    hasMovedSignificantly.current = false;
  };

  // Handler: Pointer Down on the item itself (Move or Tap)
  const handleItemPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    item: OverlayItem
  ) => {
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const itemScreenX = containerRect.left + (item.x / 100) * containerRect.width;
    const itemScreenY = containerRect.top + (item.y / 100) * containerRect.height;

    interactionMode.current = 'move';
    activeItemId.current = item.id;
    hasMovedSignificantly.current = false;
    startPointerPos.current = { x: e.clientX, y: e.clientY };

    initialItemState.current = {
      x: item.x,
      y: item.y,
      fontSize: item.fontSize,
      rotation: item.rotation || 0,
      centerScreenX: itemScreenX,
      centerScreenY: itemScreenY,
    };
  };

  // Handler: Pointer Up on the item (distinguish tap from drag)
  const handleItemPointerUp = (
    e: React.PointerEvent<HTMLDivElement>,
    item: OverlayItem
  ) => {
    e.stopPropagation();

    // If it was just a tap without dragging
    if (!hasMovedSignificantly.current) {
      if (selectedOverlayId === item.id) {
        // Direct tap on selected item opens the text editor immediately
        onOpenTextEditorRef.current(item);
      } else {
        onSelectOverlayRef.current(item.id);
      }
    }
  };

  // Handler: Pointer Down on Resize Handle (Bottom-Right)
  const handleResizePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    item: OverlayItem
  ) => {
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const itemScreenX = containerRect.left + (item.x / 100) * containerRect.width;
    const itemScreenY = containerRect.top + (item.y / 100) * containerRect.height;

    interactionMode.current = 'resize';
    activeItemId.current = item.id;
    startPointerPos.current = { x: e.clientX, y: e.clientY };

    initialItemState.current = {
      x: item.x,
      y: item.y,
      fontSize: item.fontSize,
      rotation: item.rotation || 0,
      centerScreenX: itemScreenX,
      centerScreenY: itemScreenY,
    };

    setActiveFeedback(`${item.fontSize}px`);
  };

  // Handler: Pointer Down on Rotate Handle (Top-Right)
  const handleRotatePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    item: OverlayItem
  ) => {
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const itemScreenX = containerRect.left + (item.x / 100) * containerRect.width;
    const itemScreenY = containerRect.top + (item.y / 100) * containerRect.height;

    interactionMode.current = 'rotate';
    activeItemId.current = item.id;
    startPointerPos.current = { x: e.clientX, y: e.clientY };

    initialItemState.current = {
      x: item.x,
      y: item.y,
      fontSize: item.fontSize,
      rotation: item.rotation || 0,
      centerScreenX: itemScreenX,
      centerScreenY: itemScreenY,
    };

    setActiveFeedback(`${item.rotation || 0}°`);
  };

  // Mobile pinch-to-zoom tracking (scales overlay text if selected, or scales photo if background)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      );
      initialPinchDistance.current = distance;

      if (selectedOverlayId) {
        const currentItem = overlays.find((o) => o.id === selectedOverlayId);
        if (currentItem) {
          initialPinchFontSize.current = currentItem.fontSize;
        }
      } else {
        initialPinchCropScale.current = cropRef.current.scale;
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistance.current !== null) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      );
      const ratio = distance / initialPinchDistance.current;

      if (selectedOverlayId) {
        const newFontSize = Math.round(
          Math.max(14, Math.min(150, initialPinchFontSize.current * ratio))
        );
        onUpdateOverlayRef.current(selectedOverlayId, { fontSize: newFontSize });
      } else {
        const newScale = Math.max(1, Math.min(3.5, initialPinchCropScale.current * ratio));
        onChangeCropRef.current(clampCropToImageBounds({
          ...cropRef.current,
          scale: Number(newScale.toFixed(2)),
        }));
      }
    }
  };

  const handleTouchEnd = () => {
    initialPinchDistance.current = null;
  };

  return (
    <div className="relative w-full flex-1 min-h-0 flex flex-col items-center bg-black select-none overflow-hidden">
      {/* Top Floating Action Button: Add Text */}
      <div className="absolute top-3 left-3 z-30 pointer-events-auto">
        <button
          type="button"
          id="btn-add-text-unified"
          onClick={() => onOpenTextEditor()}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-neutral-900/90 backdrop-blur-md border border-neutral-700 text-white text-xs font-semibold hover:bg-neutral-800 transition active:scale-95 shadow-lg cursor-pointer"
        >
          <Type className="w-3.5 h-3.5 text-blue-400" />
          + Texto / Emoji
        </button>
      </div>

      {/* Main Full-Size Photo Viewport */}
      <div
        ref={containerRef}
        id="photo-viewport-container"
        onPointerDown={handleContainerPointerDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative w-full h-full flex-1 overflow-hidden bg-neutral-950 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none"
      >
        {/* Panning and Zooming Photo Layer */}
        <div className="w-full h-full relative overflow-hidden flex items-center justify-center pointer-events-none">
          <img
            src={imageSrc}
            alt="Foto para edição"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-75 select-none pointer-events-none"
            style={{
              transform: `translate(${crop.x}px, ${crop.y}px) scale(${crop.scale})`,
              filter: combinedFilter,
            }}
          />
        </div>

        {/* Framing Guide Grid (Rule of Thirds) while panning or zooming */}
        {(isPanningPhoto || crop.scale > 1 || crop.x !== 0 || crop.y !== 0) && (
          <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-25 border border-white/30 z-10 transition-opacity duration-200">
            <div className="border-r border-b border-white/30" />
            <div className="border-r border-b border-white/30" />
            <div className="border-b border-white/30" />
            <div className="border-r border-b border-white/30" />
            <div className="border-r border-b border-white/30" />
            <div className="border-b border-white/30" />
            <div className="border-r border-b border-white/30" />
            <div className="border-r border-b border-white/30" />
            <div />
          </div>
        )}

        {/* Live feedback pill (Size or Rotation degrees) */}
        {activeFeedback && (
          <div className="absolute top-3 right-3 z-40 bg-blue-600/90 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold shadow-lg animate-fade-in pointer-events-none">
            {activeFeedback}
          </div>
        )}

        {/* Overlay Elements */}
        {overlays.map((item) => {
          const isSelected = selectedOverlayId === item.id;

          let fontClass = 'font-sans';
          if (item.fontStyle === 'serif') fontClass = 'font-serif';
          if (item.fontStyle === 'mono') fontClass = 'font-mono';
          if (item.fontStyle === 'display') fontClass = 'font-black tracking-wider uppercase';
          if (item.fontStyle === 'handwriting') fontClass = 'italic font-serif';
          if (item.fontStyle === 'neon') fontClass = 'font-bold tracking-wide';

          return (
            <div
              key={item.id}
              id={`overlay-item-${item.id}`}
              onPointerDown={(e) => handleItemPointerDown(e, item)}
              onPointerUp={(e) => handleItemPointerUp(e, item)}
              className={`absolute cursor-grab active:cursor-grabbing touch-none select-none z-20 ${
                isSelected ? 'z-30' : ''
              }`}
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                transform: `translate(-50%, -50%) rotate(${item.rotation || 0}deg)`,
                touchAction: 'none',
              }}
            >
              {/* Bounding box when selected */}
              <div
                className={`relative p-1.5 rounded-2xl transition-all ${
                  isSelected
                    ? 'ring-2 ring-blue-500 border border-dashed border-white/90 bg-blue-500/10 shadow-2xl'
                    : 'hover:ring-1 hover:ring-white/40'
                }`}
              >
                {/* Floating Quick Action Pill above selected text */}
                {isSelected && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="absolute -top-11 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-neutral-900/95 backdrop-blur-md border border-neutral-700 px-2 py-1 rounded-full shadow-2xl z-50 whitespace-nowrap"
                  >
                    {/* Direct Edit Text Button */}
                    <button
                      type="button"
                      onClick={() => onOpenTextEditor(item)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold active:scale-95 transition cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Editar</span>
                    </button>

                    {/* Direct Size Minus Button */}
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateOverlay(item.id, {
                          fontSize: Math.max(14, item.fontSize - 4),
                        })
                      }
                      className="w-5 h-5 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700 text-white text-[11px] active:scale-95 transition"
                      title="Diminuir"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>

                    {/* Direct Size Plus Button */}
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateOverlay(item.id, {
                          fontSize: Math.min(140, item.fontSize + 4),
                        })
                      }
                      className="w-5 h-5 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700 text-white text-[11px] active:scale-95 transition"
                      title="Aumentar"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}

                {/* Text Badge */}
                <div
                  className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 select-none transition ${fontClass} ${
                    item.backgroundColor === 'black-translucent'
                      ? 'bg-black/80 shadow-lg'
                      : item.backgroundColor === 'white-translucent'
                      ? 'bg-white/95 shadow-lg'
                      : item.backgroundColor === 'primary'
                      ? 'bg-blue-600 shadow-lg'
                      : item.backgroundColor === 'neon'
                      ? 'bg-slate-950 border-2 shadow-lg'
                      : 'drop-shadow-[0_2px_5px_rgba(0,0,0,0.85)]'
                  }`}
                  style={{
                    color: item.color,
                    borderColor: item.backgroundColor === 'neon' ? item.color : undefined,
                    fontSize: `${item.fontSize}px`,
                    lineHeight: 1.25,
                    textAlign: item.textAlign || 'center',
                    textShadow:
                      item.backgroundColor === 'transparent'
                        ? '0 2px 8px rgba(0,0,0,0.9)'
                        : item.fontStyle === 'neon'
                        ? `0 0 10px ${item.color}`
                        : undefined,
                  }}
                >
                  <span className="whitespace-pre-wrap pointer-events-none">
                    {item.text}
                  </span>
                </div>

                {/* Handles when selected */}
                {isSelected && (
                  <>
                    {/* Top Rotation Handle */}
                    <div
                      id={`btn-rotate-${item.id}`}
                      onPointerDown={(e) => handleRotatePointerDown(e, item)}
                      className="absolute -top-6 -right-6 w-8 h-8 rounded-full bg-neutral-900 border-2 border-blue-400 text-blue-300 flex items-center justify-center shadow-2xl cursor-grab active:cursor-grabbing active:scale-110 transition z-50"
                      title="Girar"
                    >
                      <RotateCw className="w-3.5 h-3.5 pointer-events-none" />
                    </div>

                    {/* Bottom-Right Scale/Resize Handle */}
                    <div
                      id={`btn-resize-${item.id}`}
                      onPointerDown={(e) => handleResizePointerDown(e, item)}
                      className="absolute -bottom-6 -right-6 w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-500 border-2 border-white text-white flex items-center justify-center shadow-2xl cursor-se-resize touch-none active:scale-125 transition z-50 ring-4 ring-black/40"
                      title="Arraste para aumentar ou diminuir o tamanho"
                    >
                      <Maximize2 className="w-4 h-4 pointer-events-none" />
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {/* Floating Photo Framing & Zoom Controls (when no text is selected) */}
        {!selectedOverlayId && (
          <div
            id="photo-framing-controls"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute bottom-3 right-3 z-30 flex items-center gap-1.5 bg-neutral-950/85 backdrop-blur-md border border-neutral-700/80 px-2.5 py-1.5 rounded-full shadow-xl pointer-events-auto select-none"
          >
            <div className="flex items-center gap-1 text-[11px] font-medium text-neutral-300 mr-1">
              <Move className="w-3 h-3 text-sky-400" />
              <span className="hidden sm:inline">Mover foto</span>
            </div>

            {/* Zoom Out Button */}
            <button
              type="button"
              id="btn-zoom-out"
              onClick={() =>
                onChangeCrop(clampCropToImageBounds({
                  ...crop,
                  scale: Number(Math.max(1, crop.scale - 0.15).toFixed(2)),
                }))
              }
              disabled={crop.scale <= 1}
              className="w-6 h-6 rounded-full bg-neutral-800 hover:bg-neutral-700 disabled:opacity-35 text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
              title="Diminuir zoom"
            >
              <Minus className="w-3 h-3" />
            </button>

            <span className="text-[11px] font-semibold text-neutral-200 min-w-[32px] text-center">
              {Math.round(crop.scale * 100)}%
            </span>

            {/* Zoom In Button */}
            <button
              type="button"
              id="btn-zoom-in"
              onClick={() =>
                onChangeCrop(clampCropToImageBounds({
                  ...crop,
                  scale: Number(Math.min(3, crop.scale + 0.15).toFixed(2)),
                }))
              }
              disabled={crop.scale >= 3}
              className="w-6 h-6 rounded-full bg-neutral-800 hover:bg-neutral-700 disabled:opacity-35 text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
              title="Aumentar zoom"
            >
              <Plus className="w-3 h-3" />
            </button>

            {/* Reset / Recenter Button */}
            {(crop.x !== 0 || crop.y !== 0 || crop.scale !== 1) && (
              <button
                type="button"
                id="btn-reset-crop"
                onClick={() => onChangeCrop({ x: 0, y: 0, scale: 1 })}
                className="flex items-center gap-1 ml-1 px-2 py-0.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-[10px] font-medium transition active:scale-95 border border-neutral-600/60 cursor-pointer"
                title="Centralizar foto original"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Centralizar</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
