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
  phone?: string;
  seller_phone?: string;
  whatsappNumber?: string;
  whatsappCountryIso?: string;
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
  username?: string;
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
const AUTH_TOKEN_STORAGE_KEY = "templesale_auth_token";

function buildApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readAuthToken(): string {
  if (!canUseStorage()) {
    return "";
  }
  return String(window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) ?? "").trim();
}

function persistAuthToken(token: unknown) {
  if (!canUseStorage()) {
    return;
  }
  const normalizedToken = toStringValue(token);
  if (!normalizedToken) {
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, normalizedToken);
}

function clearAuthToken() {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
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

function isMissingApiRouteMessage(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("404") ||
    normalized.includes("rota da api não encontrada") ||
    normalized.includes("cannot get /api") ||
    normalized.includes("cannot post /api") ||
    normalized.includes("cannot put /api") ||
    normalized.includes("cannot delete /api")
  );
}

function isMissingApiRouteError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  return isMissingApiRouteMessage(error.message);
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

function normalizeCountryIso(value: unknown): string | undefined {
  const raw = toStringValue(value).toUpperCase();
  if (!raw) {
    return undefined;
  }
  if (raw === "ITALIA" || raw === "ITALY" || raw === "ITA" || raw === "IT") {
    return "IT";
  }
  if (/^[A-Z]{2}$/.test(raw)) {
    return raw;
  }
  return undefined;
}

function normalizePhoneDigits(value: unknown): string {
  return toStringValue(value).replace(/\D/g, "");
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

  const sellerRecord = (() => {
    const candidate = firstDefined(parsed, ["seller", "owner", "user"]);
    return isRecord(candidate) ? candidate : null;
  })();
  const sellerContactRecord = sellerRecord && isRecord(sellerRecord.contact)
    ? sellerRecord.contact
    : null;

  const sellerName = (
    toStringValue(firstDefined(parsed, ["sellerName", "seller_name"])) ||
    (sellerRecord ? toStringValue(firstDefined(sellerRecord, ["name", "seller_name", "username"])) : "")
  );
  if (sellerName) {
    product.sellerName = sellerName;
  }

  const sellerWhatsappCountryIso = (
    normalizeCountryIso(
      firstDefined(parsed, [
        "sellerWhatsappCountryIso",
        "seller_whatsapp_country_iso",
        "whatsappCountryIso",
        "whatsapp_country_iso",
        "sellerCountryIso",
        "seller_country_iso",
      ]),
    ) ||
    (sellerRecord
      ? normalizeCountryIso(
          firstDefined(sellerRecord, [
            "whatsappCountryIso",
            "whatsapp_country_iso",
            "countryIso",
            "country_iso",
          ]),
        )
      : undefined) ||
    (sellerContactRecord
      ? normalizeCountryIso(
          firstDefined(sellerContactRecord, [
            "whatsappCountryIso",
            "whatsapp_country_iso",
            "countryIso",
            "country_iso",
          ]),
        )
      : undefined) ||
    normalizeCountryIso(firstDefined(parsed, ["seller_country", "country"])) ||
    (sellerRecord
      ? normalizeCountryIso(firstDefined(sellerRecord, ["country", "seller_country"]))
      : undefined)
  );
  if (sellerWhatsappCountryIso) {
    product.sellerWhatsappCountryIso = sellerWhatsappCountryIso;
  }

  const sellerWhatsappNumberRaw =
    firstDefined(parsed, [
      "sellerWhatsappNumber",
      "seller_whatsapp_number",
      "seller_phone",
      "sellerPhone",
      "whatsappNumber",
      "whatsapp_number",
      "phone",
    ]) ??
    (sellerRecord
      ? firstDefined(sellerRecord, [
          "sellerWhatsappNumber",
          "seller_whatsapp_number",
          "seller_phone",
          "sellerPhone",
          "whatsappNumber",
          "whatsapp_number",
          "phone",
        ])
      : undefined) ??
    (sellerContactRecord
      ? firstDefined(sellerContactRecord, [
          "sellerWhatsappNumber",
          "seller_whatsapp_number",
          "seller_phone",
          "sellerPhone",
          "whatsappNumber",
          "whatsapp_number",
          "phone",
          "mobile",
        ])
      : undefined);
  const sellerWhatsappNumber =
    normalizePhoneDigits(sellerWhatsappNumberRaw) || toStringValue(sellerWhatsappNumberRaw);
  if (sellerWhatsappNumberRaw) {
    product.sellerWhatsappNumber = sellerWhatsappNumber;
  }

  return product;
}

function normalizeSessionUserItem(value: unknown): SessionUser | null {
  const parsed = parseJsonIfNeeded(value);
  if (!isRecord(parsed)) {
    return null;
  }

  const nestedUserCandidate = firstDefined(parsed, ["user", "profile", "account"]);
  if (nestedUserCandidate && nestedUserCandidate !== parsed) {
    const nestedUser = normalizeSessionUserItem(nestedUserCandidate);
    if (nestedUser) {
      return nestedUser;
    }
  }

  const id = toOptionalNumber(firstDefined(parsed, ["id", "userId", "user_id"]));
  if (id === undefined) {
    return null;
  }

  const user: SessionUser = {
    id,
    name: toStringValue(firstDefined(parsed, ["name", "username", "nome"])),
    email: toStringValue(firstDefined(parsed, ["email", "mail"])),
  };

  const country = toStringValue(firstDefined(parsed, ["country", "seller_country"]));
  if (country) {
    user.country = country;
  }

  const state = toStringValue(firstDefined(parsed, ["state", "seller_state"]));
  if (state) {
    user.state = state;
  }

  const city = toStringValue(firstDefined(parsed, ["city", "seller_city"]));
  if (city) {
    user.city = city;
  }

  const neighborhood = toStringValue(firstDefined(parsed, ["neighborhood", "district"]));
  if (neighborhood) {
    user.neighborhood = neighborhood;
  }

  const street = toStringValue(firstDefined(parsed, ["street"]));
  if (street) {
    user.street = street;
  }

  const whatsappCountryIso = (
    normalizeCountryIso(
      firstDefined(parsed, [
        "whatsappCountryIso",
        "whatsapp_country_iso",
        "countryIso",
        "country_iso",
      ]),
    ) ?? normalizeCountryIso(firstDefined(parsed, ["country"]))
  );
  if (whatsappCountryIso) {
    user.whatsappCountryIso = whatsappCountryIso;
  }

  const whatsappNumberRaw = firstDefined(parsed, [
    "whatsappNumber",
    "whatsapp_number",
    "phone",
    "seller_phone",
  ]);
  const whatsappNumber = normalizePhoneDigits(whatsappNumberRaw);
  if (whatsappNumber) {
    user.whatsappNumber = whatsappNumber;
  }

  return user;
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

function extractTokenFromAuthPayload(value: unknown): string {
  const parsed = parseJsonIfNeeded(value);
  if (!isRecord(parsed)) {
    return "";
  }

  const directToken = toStringValue(
    firstDefined(parsed, ["token", "accessToken", "access_token", "jwt"]),
  );
  if (directToken) {
    return directToken;
  }

  const nestedAuth = firstDefined(parsed, ["auth", "session"]);
  if (isRecord(nestedAuth)) {
    return toStringValue(
      firstDefined(nestedAuth, ["token", "accessToken", "access_token", "jwt"]),
    );
  }

  return "";
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers ?? {});
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const authToken = readAuthToken();
  if (authToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  const response = await fetch(buildApiUrl(url), {
    credentials: "include",
    ...init,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthToken();
    }

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
  const headers = new Headers({
    "Content-Type": file.type || "image/jpeg",
    "X-File-Name": encodeURIComponent(file.name || "upload"),
  });
  const authToken = readAuthToken();
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  const response = await fetch(buildApiUrl("/api/uploads/product-image"), {
    method: "POST",
    credentials: "include",
    headers,
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
  async register(payload: AuthInput) {
    const email = payload.email.trim();
    const name = payload.name?.trim() || "";
    const derivedUsername = (
      payload.username?.trim() ||
      email.split("@")[0] ||
      `user${Date.now()}`
    ).replace(/[^a-zA-Z0-9_.-]/g, "_");

    const registerPayload = {
      name: name || derivedUsername,
      username: derivedUsername,
      email,
      password: payload.password,
      acceptedPrivacy: true,
      acceptedPrivacyPolicy: true,
      privacyAccepted: true,
      acceptedTerms: true,
      termsAccepted: true,
      acceptedCommunity: true,
      communityAccepted: true,
      acceptedGuidelines: true,
      privacyPolicyAccepted: true,
      guidelinesAccepted: true,
      acceptedPolicies: true,
      acceptedLegal: true,
      acceptPrivacy: true,
      acceptPrivacyPolicy: true,
      acceptTerms: true,
      acceptCommunity: true,
      acceptGuidelines: true,
    };

    const raw = await request<unknown>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(registerPayload),
    });
    const authToken = extractTokenFromAuthPayload(raw);
    if (authToken) {
      persistAuthToken(authToken);
    }
    const user = normalizeSessionUserItem(raw);
    if (!user) {
      throw new Error("Resposta inválida ao criar conta.");
    }
    return user;
  },
  async login(payload: AuthInput) {
    const raw = await request<unknown>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const authToken = extractTokenFromAuthPayload(raw);
    if (authToken) {
      persistAuthToken(authToken);
    }
    const user = normalizeSessionUserItem(raw);
    if (!user) {
      throw new Error("Resposta inválida ao autenticar.");
    }
    return user;
  },
  async getCurrentUser() {
    const raw = await request<unknown>("/api/auth/me");
    const user = normalizeSessionUserItem(raw);
    if (!user) {
      throw new Error("Resposta inválida ao recuperar sessão.");
    }
    return user;
  },
  async logout() {
    try {
      return await request<{ success: boolean }>("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      clearAuthToken();
    }
  },
  async updateProfile(payload: UpdateProfileInput) {
    const normalizedWhatsapp = normalizePhoneDigits(payload.whatsappNumber);
    const normalizedPayload: UpdateProfileInput = {
      ...payload,
      whatsappCountryIso: normalizeCountryIso(payload.whatsappCountryIso) ?? "IT",
      whatsappNumber: normalizedWhatsapp,
    };

    try {
      const raw = await request<unknown>("/api/profile", {
        method: "PUT",
        body: JSON.stringify(normalizedPayload),
      });
      const user = normalizeSessionUserItem(raw);
      if (user) {
        return user;
      }
    } catch (error) {
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        const shouldTryLegacyRoute =
          message.includes("404") ||
          message.includes("rota da api não encontrada") ||
          message.includes("cannot put /api/profile");

        if (!shouldTryLegacyRoute) {
          throw error;
        }
      } else {
        throw error;
      }
    }

    const legacyPayload = {
      name: normalizedPayload.name,
      country: normalizedPayload.country,
      state: normalizedPayload.state,
      city: normalizedPayload.city,
      neighborhood: normalizedPayload.neighborhood,
      street: normalizedPayload.street,
      whatsappCountryIso: normalizedPayload.whatsappCountryIso,
      whatsappNumber: normalizedPayload.whatsappNumber,
      whatsapp_country_iso: normalizedPayload.whatsappCountryIso,
      whatsapp_number: normalizedPayload.whatsappNumber,
      phone: normalizedPayload.whatsappNumber,
      seller_phone: normalizedPayload.whatsappNumber,
      contact_phone: normalizedPayload.whatsappNumber,
    };

    const legacyRaw = await request<unknown>("/api/users/me", {
      method: "PUT",
      body: JSON.stringify(legacyPayload),
    });
    const legacyUser = normalizeSessionUserItem(legacyRaw);
    if (legacyUser) {
      return legacyUser;
    }

    const sessionRaw = await request<unknown>("/api/auth/me");
    const sessionUser = normalizeSessionUserItem(sessionRaw);
    if (sessionUser) {
      return sessionUser;
    }

    throw new Error("Resposta inválida ao atualizar perfil.");
  },
  async getProducts() {
    const payload = await request<unknown>("/api/products");
    return normalizeProductList(payload);
  },
  async getProductById(id: number) {
    const payload = await request<unknown>(`/api/products/${id}`);
    const normalized = normalizeProductItem(payload);
    if (!normalized) {
      throw new Error("Resposta inválida ao carregar produto.");
    }
    return normalized;
  },
  async getPublicUserById(id: number) {
    const payload = await request<unknown>(`/api/users/${id}`);
    const normalized = normalizeSessionUserItem(payload);
    if (!normalized) {
      throw new Error("Resposta inválida ao carregar vendedor.");
    }
    return normalized;
  },
  async getMyProducts() {
    try {
      const payload = await request<unknown>("/api/my-products");
      return normalizeProductList(payload);
    } catch (error) {
      if (!isMissingApiRouteError(error)) {
        throw error;
      }

      const [productsPayload, sessionPayload] = await Promise.all([
        request<unknown>("/api/products"),
        request<unknown>("/api/auth/me"),
      ]);
      const currentUser = normalizeSessionUserItem(sessionPayload);
      if (!currentUser) {
        return [];
      }

      return normalizeProductList(productsPayload).filter(
        (product) => product.ownerId === currentUser.id,
      );
    }
  },
  async getLikedProducts() {
    try {
      const payload = await request<unknown>("/api/likes");
      return normalizeProductList(payload);
    } catch (error) {
      if (isMissingApiRouteError(error)) {
        return [];
      }
      throw error;
    }
  },
  async getNotifications() {
    try {
      const payload = await request<unknown>("/api/notifications");
      return normalizeNotificationList(payload);
    } catch (error) {
      if (isMissingApiRouteError(error)) {
        return [];
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
    }).catch((error) => {
      if (isMissingApiRouteError(error)) {
        return { success: true };
      }
      throw error;
    });
  },
  unlikeProduct(id: number) {
    return request<{ success: boolean }>(`/api/products/${id}/like`, {
      method: "DELETE",
    }).catch((error) => {
      if (isMissingApiRouteError(error)) {
        return { success: true };
      }
      throw error;
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
