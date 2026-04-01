interface ProductImageSource {
  image?: unknown;
  images?: unknown;
}

const SAFARI_UA_EXCLUSION_REGEX = /Chrome|Chromium|CriOS|Edg|OPR|FxiOS|Firefox|Android/i;

function isSafariBrowser(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }
  const userAgent = String(navigator.userAgent ?? "");
  if (!userAgent) {
    return false;
  }
  const hasSafari = /Safari/i.test(userAgent) && /AppleWebKit/i.test(userAgent);
  return hasSafari && !SAFARI_UA_EXCLUSION_REGEX.test(userAgent);
}

function isCloudinaryUrl(url: string): boolean {
  return /(^https?:\/\/)?res\.cloudinary\.com\//i.test(url);
}

function isAvifImageUrl(url: string): boolean {
  return /\.avif(?:[?#].*)?$/i.test(String(url ?? "").trim());
}

function replaceAvifExtension(url: string, nextExtension: "jpg" | "webp"): string {
  return String(url ?? "").replace(/\.avif(?=($|[?#]))/i, `.${nextExtension}`);
}

function normalizeAndDedupeImageUrls(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  values.forEach((value) => {
    const normalized = String(value ?? "").trim();
    if (!normalized || seen.has(normalized)) {
      return;
    }
    seen.add(normalized);
    result.push(normalized);
  });
  return result;
}

export function getCompatibleImageUrl(value: string): string {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return "";
  }
  if (isSafariBrowser() && isCloudinaryUrl(normalized) && isAvifImageUrl(normalized)) {
    return replaceAvifExtension(normalized, "jpg");
  }
  return normalized;
}

function parseImageString(value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => (typeof item === "string" ? item.trim() : ""))
          .filter((item) => item.length > 0);
      }
    } catch {
      // Keep fallback below.
    }
  }

  return [trimmed];
}

export function resolveProductImages(product: ProductImageSource): string[] {
  const images = (() => {
    if (Array.isArray(product.images)) {
      return product.images
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter((item) => item.length > 0);
    }
    if (typeof product.images === "string") {
      return parseImageString(product.images);
    }
    return [];
  })();

  const image = typeof product.image === "string" ? product.image.trim() : "";
  if (image && !images.includes(image)) {
    images.unshift(image);
  }

  const compatibleImages = normalizeAndDedupeImageUrls(
    images.map((url) => getCompatibleImageUrl(url)),
  );
  if (compatibleImages.length > 0) {
    return compatibleImages;
  }

  return [""];
}
