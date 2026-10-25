import { getCompatibleImageUrl } from './product-images';

// Metadata only. Image bytes remain in the browser cache, not React or storage.
export const loadedImages = new Map<string, { url: string; rank: number }>();
export const imageRank = { thumbnail: 1, card: 2, full: 3 };

export function preloadAdjacentImages(sources: Array<string | undefined>): () => void {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (document.hidden || connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType ?? '')) return () => {};
  const images: HTMLImageElement[] = [];
  // Only neighbours, never the whole profile. Yield to the selected image first.
  const timer = window.setTimeout(() => {
    for (const source of [...new Set(sources.filter(Boolean))].slice(0, 2)) {
      const url = getCompatibleImageUrl(source!, 'full');
      if (loadedImages.get(url)?.rank === imageRank.full) continue;
      const image = new Image();
      image.fetchPriority = 'low';
      image.decoding = 'async';
      image.referrerPolicy = 'no-referrer';
      image.onload = () => {
        loadedImages.delete(url);
        loadedImages.set(url, { url, rank: imageRank.full });
        if (loadedImages.size > 160) loadedImages.delete(loadedImages.keys().next().value!);
      };
      image.src = url;
      images.push(image);
    }
  }, 300);
  return () => {
    clearTimeout(timer);
    for (const image of images) {
      image.onload = null;
      image.removeAttribute('src');
    }
  };
}
