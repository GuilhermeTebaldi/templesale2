export interface ProductDto {
  id: number;
  name: string;
  category: string;
  price: string;
  image: string;
  images?: string[];
  description?: string;
  details?: Record<string, string>;
  ownerId?: number;
  latitude?: number;
  longitude?: number;
  sellerName?: string;
  sellerWhatsappCountryIso?: string;
  sellerWhatsappNumber?: string;
}

export type NotificationDto =
  | {
      id: string;
      type: "product_like";
      title: string;
      message: string;
      createdAt: number;
      actorUserId: number;
      productId: number;
    }
  | {
      id: string;
      type: "system_welcome";
      title: string;
      message: string;
      createdAt: number;
      actorUserId?: number;
      productId?: number;
    };

export interface CreateProductInput {
  name: string;
  category: string;
  price: string;
  image?: string;
  images?: string[];
  description: string;
  details?: Record<string, string>;
  latitude: number;
  longitude: number;
}

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  country?: string;
  state?: string;
  city?: string;
  neighborhood?: string;
  street?: string;
  whatsappCountryIso?: string;
  whatsappNumber?: string;
}

export interface UpdateProfileInput {
  name: string;
  country: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  whatsappCountryIso: string;
  whatsappNumber: string;
}

export interface AuthInput {
  email: string;
  password: string;
  name?: string;
}

export interface UploadImageResponse {
  url: string;
  publicId?: string;
  width?: number;
  height?: number;
}

type ApiEnvelope = {
  success?: boolean;
  data?: unknown;
  error?: string;
  message?: string;
};

const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL ?? "")
  .trim()
  .replace(/\/+$/, "");

function buildApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
}

function asEnvelope(value: unknown): ApiEnvelope | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as ApiEnvelope;
}

function extractApiError(payload: unknown): string | null {
  const envelope = asEnvelope(payload);
  if (!envelope) {
    return null;
  }
  if (typeof envelope.error === "string" && envelope.error.trim()) {
    return envelope.error.trim();
  }
  if (typeof envelope.message === "string" && envelope.message.trim()) {
    return envelope.message.trim();
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseJsonIfNeeded(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }
  const trimmed = value.trim();
  if (!trimmed || !(trimmed.startsWith("{") || trimmed.startsWith("["))) {
    return value;
  }
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return value;
  }
}

function firstDefined(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(record, key)) {
      const value = record[key];
      if (value !== undefined && value !== null) {
        return value;
      }
    }
  }
  return undefined;
}

function toStringValue(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return "";
}

function toOptionalNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function toStringArray(value: unknown): string[] {
  const parsed = parseJsonIfNeeded(value);
  if (Array.isArray(parsed)) {
    return parsed.map((item) => toStringValue(item)).filter((item) => item.length > 0);
  }

  const single = toStringValue(parsed);
  return single ? [single] : [];
}

function normalizeProductImages(rawImages: unknown, rawImage: unknown): string[] {
  const images = toStringArray(rawImages);
  const fallbackImage = toStringValue(rawImage);
  if (fallbackImage && !images.includes(fallbackImage)) {
    images.unshift(fallbackImage);
  }
  if (images.length > 0) {
    return images;
  }
  return fallbackImage ? [fallbackImage] : [];
}

function normalizeProductItem(value: unknown): ProductDto | null {
  const parsed = parseJsonIfNeeded(value);
  if (!isRecord(parsed)) {
    return null;
  }

  const id = toOptionalNumber(firstDefined(parsed, ["id"]));
  if (id === undefined) {
    return null;
  }

  const images = normalizeProductImages(
    firstDefined(parsed, ["images", "image_urls"]),
    firstDefined(parsed, ["image", "image_url"]),
  );
  const image = images[0] ?? "";

  const product: ProductDto = {
    id,
    name: toStringValue(firstDefined(parsed, ["name", "title"])),
    category: toStringValue(firstDefined(parsed, ["category"])),
    price: toStringValue(firstDefined(parsed, ["price"])),
    image,
    images,
  };

  const description = toStringValue(firstDefined(parsed, ["description"]));
  if (description) {
    product.description = description;
  }

  const detailsValue = parseJsonIfNeeded(firstDefined(parsed, ["details"]));
  if (isRecord(detailsValue)) {
    const detailsEntries = Object.entries(detailsValue)
      .map(([key, detailValue]) => [key, toStringValue(detailValue)] as const)
      .filter(([, detailValue]) => detailValue.length > 0);
    if (detailsEntries.length > 0) {
      product.details = Object.fromEntries(detailsEntries);
    }
  }

  const ownerId = toOptionalNumber(firstDefined(parsed, ["ownerId", "owner_id", "userId", "user_id"]));
  if (ownerId !== undefined) {
    product.ownerId = ownerId;
  }

  const latitude = toOptionalNumber(firstDefined(parsed, ["latitude", "lat"]));
  if (latitude !== undefined) {
    product.latitude = latitude;
  }

  const longitude = toOptionalNumber(firstDefined(parsed, ["longitude", "lng", "lon"]));
  if (longitude !== undefined) {
    product.longitude = longitude;
  }

  const sellerName = toStringValue(firstDefined(parsed, ["sellerName", "seller_name"]));
  if (sellerName) {
    product.sellerName = sellerName;
  }

  const sellerWhatsappCountryIso = toStringValue(
    firstDefined(parsed, ["sellerWhatsappCountryIso", "seller_whatsapp_country_iso"]),
  );
  if (sellerWhatsappCountryIso) {
    product.sellerWhatsappCountryIso = sellerWhatsappCountryIso;
  }

  const sellerWhatsappNumber = toStringValue(
    firstDefined(parsed, ["sellerWhatsappNumber", "seller_whatsapp_number"]),
  );
  if (sellerWhatsappNumber) {
    product.sellerWhatsappNumber = sellerWhatsappNumber;
  }

  return product;
}

function extractArrayPayload(value: unknown, keys: string[]): unknown[] {
  const parsed = parseJsonIfNeeded(value);
  if (Array.isArray(parsed)) {
    return parsed;
  }
  if (!isRecord(parsed)) {
    return [];
  }

  for (const key of keys) {
    const nested = parseJsonIfNeeded(parsed[key]);
    if (Array.isArray(nested)) {
      return nested;
    }
  }

  return [];
}

function normalizeProductList(value: unknown): ProductDto[] {
  const items = extractArrayPayload(value, ["data", "products", "items", "rows", "results"]);
  return items
    .map((item) => normalizeProductItem(item))
    .filter((item): item is ProductDto => item !== null);
}

function normalizeNotificationList(value: unknown): NotificationDto[] {
  const items = extractArrayPayload(value, ["data", "notifications", "items", "rows", "results"]);
  return items.filter((item): item is NotificationDto => isRecord(item));
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildApiUrl(url), {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    if (isJson) {
      try {
        const payload = (await response.json()) as unknown;
        const apiError = extractApiError(payload);
        if (apiError) {
          message = apiError;
        }
      } catch {
        // Keep default HTTP message when JSON parsing fails.
      }
    } else {
      const text = await response.text();
      if (text.trim().startsWith("<!doctype")) {
        message =
          "A API não respondeu corretamente. Reinicie com: pkill -f \"tsx server.ts\" && npm run dev";
      }
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (!isJson) {
    const text = await response.text();
    if (text.trim().startsWith("<!doctype")) {
      throw new Error(
        "API desatualizada no dev server. Reinicie com: pkill -f \"tsx server.ts\" && npm run dev",
      );
    }
    throw new Error("Resposta inválida da API.");
  }

  const payload = (await response.json()) as unknown;
  const envelope = asEnvelope(payload);
  if (envelope) {
    if (envelope.success === false) {
      const message = extractApiError(payload) ?? "Falha na API.";
      throw new Error(message);
    }
    if ("data" in envelope && envelope.data !== undefined) {
      return envelope.data as T;
    }
  }

  return payload as T;
}

async function uploadProductImageFile(file: File): Promise<UploadImageResponse> {
  const response = await fetch(buildApiUrl("/api/uploads/product-image"), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": file.type || "image/jpeg",
      "X-File-Name": encodeURIComponent(file.name || "upload"),
    },
    body: file,
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    if (isJson) {
      try {
        const payload = (await response.json()) as unknown;
        const apiError = extractApiError(payload);
        if (apiError) {
          message = apiError;
        }
      } catch {
        // Keep default HTTP message when JSON parsing fails.
      }
    }
    throw new Error(message);
  }

  if (!isJson) {
    throw new Error("Resposta inválida do upload de imagem.");
  }

  const payload = (await response.json()) as unknown;
  const envelope = asEnvelope(payload);
  if (envelope) {
    if (envelope.success === false) {
      const message = extractApiError(payload) ?? "Falha no upload.";
      throw new Error(message);
    }
    if (envelope.data && typeof envelope.data === "object") {
      return envelope.data as UploadImageResponse;
    }
  }

  return payload as UploadImageResponse;
}

export const api = {
  register(payload: AuthInput) {
    return request<SessionUser>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  login(payload: AuthInput) {
    return request<SessionUser>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  getCurrentUser() {
    return request<SessionUser>("/api/auth/me");
  },
  logout() {
    return request<{ success: boolean }>("/api/auth/logout", {
      method: "POST",
    });
  },
  updateProfile(payload: UpdateProfileInput) {
    return request<SessionUser>("/api/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  async getProducts() {
    const payload = await request<unknown>("/api/products");
    return normalizeProductList(payload);
  },
  async getMyProducts() {
    const payload = await request<unknown>("/api/my-products");
    return normalizeProductList(payload);
  },
  async getLikedProducts() {
    const payload = await request<unknown>("/api/likes");
    return normalizeProductList(payload);
  },
  async getNotifications() {
    try {
      const payload = await request<unknown>("/api/notifications");
      return normalizeNotificationList(payload);
    } catch (error) {
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        if (message.includes("404") || message.includes("rota da api não encontrada")) {
          return [];
        }
      }
      throw error;
    }
  },
  async createProduct(product: CreateProductInput) {
    const payload = await request<unknown>("/api/products", {
      method: "POST",
      body: JSON.stringify(product),
    });
    const normalized = normalizeProductItem(payload);
    if (!normalized) {
      throw new Error("Resposta inválida ao criar produto.");
    }
    return normalized;
  },
  async updateProduct(id: number, product: CreateProductInput) {
    const payload = await request<unknown>(`/api/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(product),
    });
    const normalized = normalizeProductItem(payload);
    if (!normalized) {
      throw new Error("Resposta inválida ao atualizar produto.");
    }
    return normalized;
  },
  likeProduct(id: number) {
    return request<{ success: boolean }>(`/api/products/${id}/like`, {
      method: "POST",
    });
  },
  unlikeProduct(id: number) {
    return request<{ success: boolean }>(`/api/products/${id}/like`, {
      method: "DELETE",
    });
  },
  deleteProduct(id: number) {
    return request<{ success: boolean }>(`/api/products/${id}`, {
      method: "DELETE",
    });
  },
  uploadProductImage(file: File) {
    return uploadProductImageFile(file);
  },
};
