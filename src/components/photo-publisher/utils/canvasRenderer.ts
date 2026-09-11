import { PhotoAdjustments, OverlayItem, FilterPreset, StickerOverlay, PhotoCrop } from '../types';

type PixelFilterSettings = {
  brightness: number;
  contrast: number;
  saturation: number;
  sepia: number;
  grayscale: number;
  hueRotate: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getPresetFilterSettings(filter: FilterPreset): PixelFilterSettings {
  const settings: PixelFilterSettings = {
    brightness: 1,
    contrast: 1,
    saturation: 1,
    sepia: 0,
    grayscale: 0,
    hueRotate: 0,
  };

  if (filter.id === 'vivid') {
    settings.contrast = 1.15;
    settings.saturation = 1.4;
    settings.brightness = 1.05;
  } else if (filter.id === 'bw') {
    settings.grayscale = 1;
    settings.contrast = 1.2;
    settings.brightness = 0.95;
  } else if (filter.id === 'vintage') {
    settings.sepia = 0.4;
    settings.contrast = 0.9;
    settings.brightness = 1.05;
    settings.saturation = 1.2;
  } else if (filter.id === 'warm') {
    settings.sepia = 0.25;
    settings.saturation = 1.3;
    settings.hueRotate = -10;
    settings.brightness = 1.02;
  } else if (filter.id === 'cool') {
    settings.saturation = 1.1;
    settings.hueRotate = 180;
    settings.brightness = 1.05;
    settings.contrast = 1.1;
  } else if (filter.id === 'noir') {
    settings.grayscale = 1;
    settings.contrast = 1.6;
    settings.brightness = 0.85;
  } else if (filter.id === 'sunset') {
    settings.sepia = 0.35;
    settings.contrast = 1.1;
    settings.saturation = 1.5;
    settings.hueRotate = -20;
  } else if (filter.id === 'fade') {
    settings.contrast = 0.85;
    settings.brightness = 1.1;
    settings.saturation = 0.8;
  }

  return settings;
}

function rotateHue(r: number, g: number, b: number, degrees: number): [number, number, number] {
  if (degrees === 0) {
    return [r, g, b];
  }

  const angle = (degrees * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return [
    (0.213 + cos * 0.787 - sin * 0.213) * r +
      (0.715 - cos * 0.715 - sin * 0.715) * g +
      (0.072 - cos * 0.072 + sin * 0.928) * b,
    (0.213 - cos * 0.213 + sin * 0.143) * r +
      (0.715 + cos * 0.285 + sin * 0.140) * g +
      (0.072 - cos * 0.072 - sin * 0.283) * b,
    (0.213 - cos * 0.213 - sin * 0.787) * r +
      (0.715 - cos * 0.715 + sin * 0.715) * g +
      (0.072 + cos * 0.928 + sin * 0.072) * b,
  ];
}

function applyPixelFilters(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  filter: FilterPreset,
  adjustments: PhotoAdjustments,
) {
  const settings = getPresetFilterSettings(filter);
  settings.brightness *= adjustments.brightness / 100;
  settings.contrast *= adjustments.contrast / 100;
  settings.saturation *= adjustments.saturation / 100;
  settings.sepia = Math.max(settings.sepia, adjustments.sepia / 100);

  if (
    settings.brightness === 1 &&
    settings.contrast === 1 &&
    settings.saturation === 1 &&
    settings.sepia === 0 &&
    settings.grayscale === 0 &&
    settings.hueRotate === 0
  ) {
    return;
  }

  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;
  const contrastOffset = 128 * (1 - settings.contrast);

  for (let index = 0; index < data.length; index += 4) {
    let r = data[index];
    let g = data[index + 1];
    let b = data[index + 2];

    if (settings.hueRotate !== 0) {
      [r, g, b] = rotateHue(r, g, b, settings.hueRotate);
    }

    const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (settings.grayscale > 0) {
      r = r * (1 - settings.grayscale) + gray * settings.grayscale;
      g = g * (1 - settings.grayscale) + gray * settings.grayscale;
      b = b * (1 - settings.grayscale) + gray * settings.grayscale;
    }

    r = gray + (r - gray) * settings.saturation;
    g = gray + (g - gray) * settings.saturation;
    b = gray + (b - gray) * settings.saturation;

    if (settings.sepia > 0) {
      const sepiaR = r * 0.393 + g * 0.769 + b * 0.189;
      const sepiaG = r * 0.349 + g * 0.686 + b * 0.168;
      const sepiaB = r * 0.272 + g * 0.534 + b * 0.131;
      r = r * (1 - settings.sepia) + sepiaR * settings.sepia;
      g = g * (1 - settings.sepia) + sepiaG * settings.sepia;
      b = b * (1 - settings.sepia) + sepiaB * settings.sepia;
    }

    r = r * settings.brightness;
    g = g * settings.brightness;
    b = b * settings.brightness;

    r = r * settings.contrast + contrastOffset;
    g = g * settings.contrast + contrastOffset;
    b = b * settings.contrast + contrastOffset;

    data[index] = clamp(Math.round(r), 0, 255);
    data[index + 1] = clamp(Math.round(g), 0, 255);
    data[index + 2] = clamp(Math.round(b), 0, 255);
  }

  ctx.putImageData(imageData, 0, 0);
}

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

        // Draw the image with object-fit: cover and crop (pan & zoom)
        const canvasScaleFactor = Math.max(width / img.width, height / img.height);
        const drawW = img.width * canvasScaleFactor;
        const drawH = img.height * canvasScaleFactor;

        const zoom = crop?.scale || 1;
        const maxShiftX = Math.max(0, (drawW * zoom - width) / 2);
        const maxShiftY = Math.max(0, (drawH * zoom - height) / 2);
        const shiftX = crop ? clamp((crop.x / containerW) * width, -maxShiftX, maxShiftX) : 0;
        const shiftY = crop ? clamp((crop.y / containerH) * height, -maxShiftY, maxShiftY) : 0;

        ctx.save();
        // Clip to canvas area
        ctx.beginPath();
        ctx.rect(0, 0, width, height);
        ctx.clip();

        ctx.translate(width / 2 + shiftX, height / 2 + shiftY);
        ctx.scale(zoom, zoom);
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        applyPixelFilters(ctx, width, height, filter, adjustments);

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
