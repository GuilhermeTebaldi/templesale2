interface ProductImageSource {
  image?: unknown;
  images?: unknown;
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

  if (images.length > 0) {
    return images;
  }

  return [""];
}
