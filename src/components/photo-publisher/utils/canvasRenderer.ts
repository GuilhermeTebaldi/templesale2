import { PhotoAdjustments, OverlayItem, FilterPreset, StickerOverlay, PhotoCrop } from '../types';

export async function renderCompositeImage(
  imageSrc: string,
  filter: FilterPreset,
  adjustments: PhotoAdjustments,
  overlays: OverlayItem[],
  crop?: PhotoCrop,
  containerDimensions?: { width: number; height: number },
  legacyStickers?: StickerOverlay[]
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageSrc);
          return;
        }

        // Determine canvas dimensions matching viewport aspect ratio
        const containerW = containerDimensions?.width || 1080;
        const containerH = containerDimensions?.height || 1080;
        const aspect = containerW / containerH;

        const maxDim = 1200;
        let width = maxDim;
        let height = Math.round(maxDim / aspect);

        if (height > maxDim) {
          height = maxDim;
          width = Math.round(maxDim * aspect);
        }

        canvas.width = width;
        canvas.height = height;

        // Construct canvas filter string
        const filterParts: string[] = [];
        if (filter.id !== 'normal' && filter.filterString !== 'none') {
          filterParts.push(filter.filterString);
        }
        if (adjustments.brightness !== 100) {
          filterParts.push(`brightness(${adjustments.brightness / 100})`);
        }
        if (adjustments.contrast !== 100) {
          filterParts.push(`contrast(${adjustments.contrast / 100})`);
        }
        if (adjustments.saturation !== 100) {
          filterParts.push(`saturate(${adjustments.saturation / 100})`);
        }
        if (adjustments.sepia > 0) {
          filterParts.push(`sepia(${adjustments.sepia / 100})`);
        }

        if (filterParts.length > 0) {
          ctx.filter = filterParts.join(' ');
        }

        // Draw the image with object-fit: cover and crop (pan & zoom)
        const canvasScaleFactor = Math.max(width / img.width, height / img.height);
        const drawW = img.width * canvasScaleFactor;
        const drawH = img.height * canvasScaleFactor;

        const shiftX = crop ? (crop.x / containerW) * width : 0;
        const shiftY = crop ? (crop.y / containerH) * height : 0;
        const zoom = crop?.scale || 1;

        ctx.save();
        // Clip to canvas area
        ctx.beginPath();
        ctx.rect(0, 0, width, height);
        ctx.clip();

        ctx.translate(width / 2 + shiftX, height / 2 + shiftY);
        ctx.scale(zoom, zoom);
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        // Reset filter for overlays
        ctx.filter = 'none';

        // Draw legacy stickers if any
        if (legacyStickers && legacyStickers.length > 0) {
          legacyStickers.forEach((sticker) => {
            const posX = (sticker.x / 100) * width;
            const posY = (sticker.y / 100) * height;
            const scale = width / 400;
            const fontSize = Math.max(28, sticker.size * scale);

            ctx.save();
            ctx.translate(posX, posY);
            if (sticker.rotation) {
              ctx.rotate((sticker.rotation * Math.PI) / 180);
            }
            ctx.font = `${fontSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(sticker.emoji, 0, 0);
            ctx.restore();
          });
        }

        // Draw Unified Overlays (Text & Figurinha)
        overlays.forEach((overlay) => {
          const posX = (overlay.x / 100) * width;
          const posY = (overlay.y / 100) * height;
          const scale = width / 400;
          const scaledFontSize = Math.max(16, overlay.fontSize * scale);

          ctx.save();
          ctx.translate(posX, posY);
          if (overlay.rotation) {
            ctx.rotate((overlay.rotation * Math.PI) / 180);
          }

          let fontFamily = 'sans-serif';
          let fontWeight = 'bold';
          if (overlay.fontStyle === 'serif') fontFamily = 'Georgia, serif';
          if (overlay.fontStyle === 'mono') fontFamily = 'Courier New, monospace';
          if (overlay.fontStyle === 'handwriting') {
            fontFamily = 'cursive, sans-serif';
            fontWeight = 'normal';
          }
          if (overlay.fontStyle === 'display') {
            fontFamily = 'Impact, sans-serif';
            fontWeight = '900';
          }
          if (overlay.fontStyle === 'neon') {
            fontFamily = 'system-ui, sans-serif';
            fontWeight = 'bold';
          }

          ctx.font = `${fontWeight} ${scaledFontSize}px ${fontFamily}`;
          ctx.textAlign = overlay.textAlign || 'center';
          ctx.textBaseline = 'middle';

          const textMetrics = ctx.measureText(overlay.text);
          const padX = scaledFontSize * 0.45;
          const padY = scaledFontSize * 0.28;
          const textWidth = textMetrics.width;
          const textHeight = scaledFontSize;

          // Draw background badge
          if (overlay.backgroundColor === 'black-translucent') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
            ctx.beginPath();
            ctx.roundRect(
              -textWidth / 2 - padX,
              -textHeight / 2 - padY,
              textWidth + padX * 2,
              textHeight + padY * 2,
              scaledFontSize * 0.3
            );
            ctx.fill();
          } else if (overlay.backgroundColor === 'white-translucent') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.beginPath();
            ctx.roundRect(
              -textWidth / 2 - padX,
              -textHeight / 2 - padY,
              textWidth + padX * 2,
              textHeight + padY * 2,
              scaledFontSize * 0.3
            );
            ctx.fill();
          } else if (overlay.backgroundColor === 'primary') {
            ctx.fillStyle = '#2563eb';
            ctx.beginPath();
            ctx.roundRect(
              -textWidth / 2 - padX,
              -textHeight / 2 - padY,
              textWidth + padX * 2,
              textHeight + padY * 2,
              scaledFontSize * 0.3
            );
            ctx.fill();
          } else if (overlay.backgroundColor === 'neon') {
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.roundRect(
              -textWidth / 2 - padX,
              -textHeight / 2 - padY,
              textWidth + padX * 2,
              textHeight + padY * 2,
              scaledFontSize * 0.3
            );
            ctx.fill();
            ctx.lineWidth = 2 * scale;
            ctx.strokeStyle = overlay.color;
            ctx.stroke();
          }

          // Text shadow for legibility if transparent
          if (overlay.backgroundColor === 'transparent') {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 2;
          } else if (overlay.fontStyle === 'neon') {
            ctx.shadowColor = overlay.color;
            ctx.shadowBlur = 12;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
          }

          ctx.fillStyle = overlay.color;
          ctx.fillText(overlay.text, 0, 0);

          ctx.restore();
        });

        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        resolve(dataUrl);
      } catch {
        resolve(imageSrc);
      }
    };

    img.onerror = () => {
      resolve(imageSrc);
    };

    img.src = imageSrc;
  });
}
