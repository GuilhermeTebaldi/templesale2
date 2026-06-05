interface ProductImageSource {
  image?: unknown;
  images?: unknown;
}

function isCloudinaryUrl(url: string): boolean {
  return /(^https?:\/\/)?res\.cloudinary\.com\//i.test(url);
}

function isCloudinaryDomainUrl(url: string): boolean {
  return /(^https?:\/\/)?(?:www\.)?cloudinary\.com\//i.test(url);
}

function isAvifImageUrl(url: string): boolean {
  return /\.avif(?:[?#].*)?$/i.test(String(url ?? "").trim());
}

function isCloudinaryUploadUrl(url: string): boolean {
  return /\/image\/upload(?:\/|$)/i.test(url);
}

function replaceAvifExtension(url: string, nextExtension: "jpg" | "webp"): string {
  return String(url ?? "").replace(/\.avif(?=($|[?#]))/i, `.${nextExtension}`);
}

function normalizeHttpsProtocol(url: string): string {
  const trimmed = String(url ?? "").trim();
  if (!trimmed) {
    return "";
  }
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }
  if (/^http:\/\//i.test(trimmed)) {
    return trimmed.replace(/^http:\/\//i, "https://");
  }
  if (/^res\.cloudinary\.com\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

function extractCloudinaryAssetUrlFromShareLink(url: string): string {
  const normalized = normalizeHttpsProtocol(url);
  if (!normalized || !isCloudinaryDomainUrl(normalized)) {
    return normalized;
  }

  try {
    const parsed = new URL(normalized);
    const queryKeys = ["url", "secure_url", "image_url", "download_url", "download"];
    for (const key of queryKeys) {
      const candidate = normalizeHttpsProtocol(parsed.searchParams.get(key) ?? "");
      if (candidate && isCloudinaryUrl(candidate)) {
        return candidate;
      }
    }

    const stitched = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    const match = stitched.match(/(?:https?:\/\/)?res\.cloudinary\.com\/[^\s"'<>]+/i);
    if (match?.[0]) {
      return normalizeHttpsProtocol(match[0]);
    }
  } catch {
    return normalized;
  }

  return normalized;
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

function addCloudinaryDeliveryDefaults(url: string): string {
  if (!isCloudinaryUrl(url) || !isCloudinaryUploadUrl(url)) {
    return url;
  }

  if (/\/image\/upload\/[^/?#]*(?:f_|q_|c_|w_|h_|dpr_|e_|g_)/i.test(url)) {
    return url;
  }

  return url.replace(/\/image\/upload\//i, "/image/upload/f_auto,q_auto/");
}

export function getCompatibleImageUrl(value: string): string {
  const normalized = extractCloudinaryAssetUrlFromShareLink(value);
  if (!normalized) {
    return "";
  }

  const optimized = addCloudinaryDeliveryDefaults(normalized);
  if (isCloudinaryUrl(optimized) && isAvifImageUrl(optimized)) {
    return replaceAvifExtension(optimized, "jpg");
  }

  return optimized;
}

export function getImageRetryUrls(value: string): string[] {
  const compatible = getCompatibleImageUrl(value);
  if (!compatible) {
    return [];
  }

  const retryUrls = [compatible];
  if (isCloudinaryUrl(compatible) && isCloudinaryUploadUrl(compatible)) {
    retryUrls.push(compatible.replace(/\/image\/upload\/(?:[^/?#]+\/)?/i, "/image/upload/f_jpg,q_auto/"));
    retryUrls.push(compatible.replace(/\/image\/upload\/(?:[^/?#]+\/)?/i, "/image/upload/f_webp,q_auto/"));
  }
  if (isAvifImageUrl(compatible)) {
    retryUrls.push(replaceAvifExtension(compatible, "jpg"));
    retryUrls.push(replaceAvifExtension(compatible, "webp"));
  }

  return normalizeAndDedupeImageUrls(retryUrls);
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
