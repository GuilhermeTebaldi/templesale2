import { trackedFetch } from "./networkActivity";

export interface ProductDto {
  id: number;
  name: string;
  category: string;
  price: string;
  quantity?: number;
  image: string;
  images?: string[];
  description?: string;
  details?: Record<string, string>;
  ownerId?: number;
  latitude?: number;
  longitude?: number;
  city?: string;
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
      actorUserId?: number;
      actorName?: string;
      productName?: string;
      productId: number;
    }
  | {
      id: string;
      type: "product_cart_interest";
      title: string;
      message: string;
      createdAt: number;
      actorUserId?: number;
      actorName?: string;
      productName?: string;
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
  quantity: number;
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

export interface ProductCommentDto {
  id: number;
  productId: number;
  userId: number;
  parentCommentId?: number;
  rating?: number;
  body: string;
  createdAt: number;
  authorName: string;
  authorAvatarUrl?: string;
  replies: ProductCommentDto[];
}

export interface CreateProductCommentInput {
  body: string;
  rating?: number;
  parentCommentId?: number;
}

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string;
  preferredLocale?: "it-IT" | "pt-BR";
  country?: string;
  state?: string;
  city?: string;
  neighborhood?: string;
  street?: string;
  whatsappCountryIso?: string;
  whatsappNumber?: string;
}

export interface VendorDto {
  id: number;
  name: string;
  avatarUrl?: string;
  productCount: number;
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

export interface NewProductDraftDefaults {
  name: string;
  category: string;
  latitude: string;
  longitude: string;
  description: string;
  details: Record<string, string>;
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

export interface AdminSessionDto {
  email: string;
}

export interface AdminUserDto {
  id: number;
  name: string;
  email: string;
  username?: string;
  phone?: string;
  country?: string;
  city?: string;
  productCount: number;
  createdAt?: string;
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
const ADMIN_AUTH_TOKEN_STORAGE_KEY = "templesale_admin_token";
const ADMIN_SESSION_EMAIL_STORAGE_KEY = "templesale_admin_email";
const SHOULD_SKIP_OPTIONAL_VENDORS_API =
  typeof window !== "undefined" &&
  /(^|\.)templesale\.com$/i.test(window.location.hostname);
let supportsVendorsApi: boolean | null = SHOULD_SKIP_OPTIONAL_VENDORS_API ? false : null;
let supportsPublicUserApi: boolean | null = null;
const vendorProfileCache = new globalThis.Map<
  number,
  {
    name: string;
    avatarUrl: string;
  }
>();

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

function readAdminToken(): string {
  if (!canUseStorage()) {
    return "";
  }
  return String(window.localStorage.getItem(ADMIN_AUTH_TOKEN_STORAGE_KEY) ?? "").trim();
}

function persistAdminToken(token: unknown) {
  if (!canUseStorage()) {
    return;
  }
  const normalizedToken = toStringValue(token);
  if (!normalizedToken) {
    window.localStorage.removeItem(ADMIN_AUTH_TOKEN_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(ADMIN_AUTH_TOKEN_STORAGE_KEY, normalizedToken);
}

function clearAdminToken() {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.removeItem(ADMIN_AUTH_TOKEN_STORAGE_KEY);
}

function readAdminSessionEmail(): string {
  if (!canUseStorage()) {
    return "";
  }
  return String(window.localStorage.getItem(ADMIN_SESSION_EMAIL_STORAGE_KEY) ?? "")
    .trim()
    .toLowerCase();
}

function persistAdminSessionEmail(email: string) {
  if (!canUseStorage()) {
    return;
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    window.localStorage.removeItem(ADMIN_SESSION_EMAIL_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(ADMIN_SESSION_EMAIL_STORAGE_KEY, normalizedEmail);
}

function clearAdminSessionEmail() {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.removeItem(ADMIN_SESSION_EMAIL_STORAGE_KEY);
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

function isUnauthorizedApiError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const normalized = error.message.toLowerCase();
  return normalized.includes("401") || normalized.includes("não autorizado") || normalized.includes("unauthorized");
}

function isAdminLoginPayloadFormatError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const normalized = error.message.toLowerCase();
  return (
    normalized.includes("obrigat") ||
    normalized.includes("required") ||
    normalized.includes("email e senha") ||
    normalized.includes("email and password")
  );
}

function isRegisterPolicyPayloadError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const normalized = error.message.toLowerCase();
  const hasPolicyTermsHint =
    normalized.includes("política") ||
    normalized.includes("politica") ||
    normalized.includes("privacy") ||
    normalized.includes("termos") ||
    normalized.includes("terms") ||
    normalized.includes("guidelines") ||
    normalized.includes("comunidade") ||
    normalized.includes("community") ||
    normalized.includes("instru") ||
    normalized.includes("garrafa") ||
    normalized.includes("bottle");
  const hasConflictHint =
    normalized.includes("já está cadastrado") ||
    normalized.includes("ja esta cadastrado") ||
    normalized.includes("already") ||
    normalized.includes("invalid");
  if (hasConflictHint) {
    return false;
  }
  return hasPolicyTermsHint;
}

function shouldRetryRegisterPayloadOnSameRoute(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const normalized = error.message.toLowerCase();
  const hasConflictHint =
    normalized.includes("já está cadastrado") ||
    normalized.includes("ja esta cadastrado") ||
    normalized.includes("already exists") ||
    normalized.includes("already registered") ||
    normalized.includes("conflict");
  if (hasConflictHint) {
    return false;
  }

  return (
    isRegisterPolicyPayloadError(error) ||
    normalized.includes("obrigat") ||
    normalized.includes("required")
  );
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
        if (typeof value === "string" && value.trim() === "") {
          continue;
        }
        return value;
      }
    }
  }
  return undefined;
}

function findStringInNestedRecords(
  value: unknown,
  searchKeys: string[],
  nestedKeys: string[],
  depth = 3,
): string {
  if (depth < 0) {
    return "";
  }

  const parsed = parseJsonIfNeeded(value);
  if (!isRecord(parsed)) {
    return "";
  }

  const directValue = toStringValue(firstDefined(parsed, searchKeys));
  if (directValue) {
    return directValue;
  }

  for (const nestedKey of nestedKeys) {
    if (!Object.prototype.hasOwnProperty.call(parsed, nestedKey)) {
      continue;
    }
    const nestedValue = findStringInNestedRecords(
      parsed[nestedKey],
      searchKeys,
      nestedKeys,
      depth - 1,
    );
    if (nestedValue) {
      return nestedValue;
    }
  }

  return "";
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

function toNonNegativeInteger(value: unknown): number | undefined {
  const parsed = toOptionalNumber(value);
  if (parsed === undefined) {
    return undefined;
  }
  const integerValue = Math.floor(parsed);
  return integerValue >= 0 ? integerValue : undefined;
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

function normalizeLocaleValue(value: unknown): "it-IT" | "pt-BR" | undefined {
  if (value === "it-IT" || value === "pt-BR") {
    return value;
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

  const legacyImagesValue = firstDefined(parsed, ["images"]);
  const canonicalImagesValue = firstDefined(parsed, ["image_urls", "imageUrls"]);
  const preferredImagesValue =
    toStringArray(legacyImagesValue).length > 0
      ? legacyImagesValue
      : (canonicalImagesValue ?? legacyImagesValue);
  const images = normalizeProductImages(
    preferredImagesValue,
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

  const quantity =
    toNonNegativeInteger(firstDefined(parsed, ["quantity", "stock", "stockQuantity"])) ?? 1;
  product.quantity = quantity;

  const description = toStringValue(firstDefined(parsed, ["description"]));
  if (description) {
    product.description = description;
  }

  const parsedDetails: Record<string, string> = {};
  const detailsValue = parseJsonIfNeeded(firstDefined(parsed, ["details"]));
  if (isRecord(detailsValue)) {
    Object.entries(detailsValue).forEach(([key, detailValue]) => {
      const normalizedValue = toStringValue(detailValue);
      if (normalizedValue.length > 0) {
        parsedDetails[key] = normalizedValue;
      }
    });
  }

  const detailFallbackMap: Record<string, string[]> = {
    type: ["property_type", "propertyType", "type"],
    area: ["surface_area", "surfaceArea", "area"],
    rooms: ["bedrooms", "rooms", "room"],
    bathrooms: ["bathrooms", "bathroom"],
    parking: ["parking", "garage"],
    brand: ["brand"],
    model: ["model"],
    color: ["color"],
    year: ["year"],
  };
  Object.entries(detailFallbackMap).forEach(([detailKey, sourceKeys]) => {
    if (parsedDetails[detailKey]) {
      return;
    }
    const normalizedValue = toStringValue(firstDefined(parsed, sourceKeys));
    if (normalizedValue) {
      parsedDetails[detailKey] = normalizedValue;
    }
  });
  if (Object.keys(parsedDetails).length > 0) {
    product.details = parsedDetails;
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

  const city = toStringValue(firstDefined(parsed, ["city", "seller_city", "sellerCity"]));
  if (city) {
    product.city = city;
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

  const avatarUrl = toStringValue(
    firstDefined(parsed, ["avatarUrl", "avatar_url", "profileImageUrl", "profile_image_url"]),
  );
  if (avatarUrl) {
    user.avatarUrl = avatarUrl;
  }

  const preferredLocale = normalizeLocaleValue(
    firstDefined(parsed, [
      "preferredLocale",
      "preferred_locale",
      "locale",
      "language",
      "lang",
    ]),
  );
  if (preferredLocale) {
    user.preferredLocale = preferredLocale;
  }

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

function normalizeNewProductDraftDefaultsItem(value: unknown): NewProductDraftDefaults {
  const parsed = parseJsonIfNeeded(value);
  const emptyDefaults: NewProductDraftDefaults = {
    name: "",
    category: "",
    latitude: "",
    longitude: "",
    description: "",
    details: {},
  };

  if (!isRecord(parsed)) {
    return emptyDefaults;
  }

  const detailsValue = parseJsonIfNeeded(firstDefined(parsed, ["details"]));
  const details: Record<string, string> = {};
  if (isRecord(detailsValue)) {
    Object.entries(detailsValue).forEach(([rawKey, rawValue]) => {
      const key = String(rawKey ?? "").trim().toLowerCase();
      const value = toStringValue(rawValue);
      if (!key || !value) {
        return;
      }
      details[key] = value;
    });
  }

  return {
    name: toStringValue(firstDefined(parsed, ["name"])),
    category: toStringValue(firstDefined(parsed, ["category"])),
    latitude: toStringValue(firstDefined(parsed, ["latitude"])),
    longitude: toStringValue(firstDefined(parsed, ["longitude"])),
    description: toStringValue(firstDefined(parsed, ["description"])),
    details,
  };
}

function normalizeVendorItem(value: unknown): VendorDto | null {
  const parsed = parseJsonIfNeeded(value);
  if (!isRecord(parsed)) {
    return null;
  }

  const id = toOptionalNumber(firstDefined(parsed, ["id", "vendorId", "vendor_id"]));
  if (id === undefined) {
    return null;
  }

  const name =
    toStringValue(firstDefined(parsed, ["name", "vendorName", "vendor_name"])) || `Vendedor ${id}`;
  const avatarUrl = toStringValue(
    firstDefined(parsed, ["avatarUrl", "avatar_url", "profileImageUrl", "profile_image_url"]),
  );
  const productCount =
    toNonNegativeInteger(firstDefined(parsed, ["productCount", "product_count", "count"])) ?? 0;

  return {
    id,
    name,
    avatarUrl,
    productCount,
  };
}

function normalizeVendorList(value: unknown): VendorDto[] {
  const items = extractArrayPayload(value, ["data", "vendors", "items", "rows", "results"]);
  return items
    .map((item) => normalizeVendorItem(item))
    .filter((item): item is VendorDto => item !== null);
}

function buildVendorsFromProducts(products: ProductDto[]): VendorDto[] {
  const grouped = new globalThis.Map<number, VendorDto>();

  products.forEach((product) => {
    const ownerId = toOptionalNumber(product.ownerId);
    if (!ownerId || !Number.isInteger(ownerId) || ownerId <= 0) {
      return;
    }

    const sellerName = toStringValue(product.sellerName) || `Vendedor ${ownerId}`;
    const current = grouped.get(ownerId);
    if (!current) {
      grouped.set(ownerId, {
        id: ownerId,
        name: sellerName,
        avatarUrl: "",
        productCount: 1,
      });
      return;
    }

    current.productCount += 1;
    if (
      current.name.trim().length === 0 ||
      current.name.toLowerCase().startsWith("vendedor ")
    ) {
      current.name = sellerName;
    }
  });

  return Array.from(grouped.values()).sort((a, b) => {
    if (b.productCount !== a.productCount) {
      return b.productCount - a.productCount;
    }
    return b.id - a.id;
  });
}

async function enrichVendorsWithPublicProfiles(vendors: VendorDto[]): Promise<VendorDto[]> {
  if (vendors.length === 0) {
    return vendors;
  }

  const normalizedVendors = vendors.map((vendor) => {
    const cached = vendorProfileCache.get(vendor.id);
    if (!cached) {
      return { ...vendor };
    }
    return {
      ...vendor,
      name: cached.name || vendor.name,
      avatarUrl: cached.avatarUrl || vendor.avatarUrl,
    };
  });

  if (supportsPublicUserApi === false) {
    return normalizedVendors;
  }

  const enrichmentCandidates = normalizedVendors
    .filter((vendor) => !vendorProfileCache.has(vendor.id))
    .slice(0, 24);

  for (const vendor of enrichmentCandidates) {
    try {
      const payload = await request<unknown>(`/api/users/${vendor.id}`);
      supportsPublicUserApi = true;
      const user = normalizeSessionUserItem(payload);
      if (!user) {
        continue;
      }

      const cachedProfile = {
        name: toStringValue(user.name) || vendor.name,
        avatarUrl: toStringValue(user.avatarUrl),
      };
      vendorProfileCache.set(vendor.id, cachedProfile);
      vendor.name = cachedProfile.name || vendor.name;
      vendor.avatarUrl = cachedProfile.avatarUrl || vendor.avatarUrl;
    } catch (error) {
      if (isMissingApiRouteError(error) || isUnauthorizedApiError(error)) {
        supportsPublicUserApi = false;
        break;
      }
      if (error instanceof Error && error.message.toLowerCase().includes("404")) {
        continue;
      }
      throw error;
    }
  }

  return normalizedVendors;
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

function normalizeProductCommentItem(value: unknown): ProductCommentDto | null {
  const parsed = parseJsonIfNeeded(value);
  if (!isRecord(parsed)) {
    return null;
  }

  const id = toOptionalNumber(firstDefined(parsed, ["id", "commentId", "comment_id"]));
  if (id === undefined) {
    return null;
  }

  const productId =
    toOptionalNumber(firstDefined(parsed, ["productId", "product_id"])) ?? 0;
  const userId = toOptionalNumber(firstDefined(parsed, ["userId", "user_id"])) ?? 0;
  const parentCommentId = toOptionalNumber(
    firstDefined(parsed, ["parentCommentId", "parent_comment_id"]),
  );
  const ratingCandidate = toOptionalNumber(firstDefined(parsed, ["rating", "stars"]));
  const rating =
    ratingCandidate !== undefined &&
    Number.isInteger(ratingCandidate) &&
    ratingCandidate >= 1 &&
    ratingCandidate <= 5
      ? ratingCandidate
      : undefined;

  const createdAt =
    toOptionalNumber(firstDefined(parsed, ["createdAt", "created_at"])) ??
    Math.floor(Date.now() / 1000);
  const authorName =
    toStringValue(firstDefined(parsed, ["authorName", "author_name", "name"])) || "Usuário";
  const authorAvatarUrl = toStringValue(
    firstDefined(parsed, ["authorAvatarUrl", "author_avatar_url", "avatarUrl", "avatar_url"]),
  );
  const body = toStringValue(firstDefined(parsed, ["body", "comment", "message"]));

  const rawReplies = parseJsonIfNeeded(firstDefined(parsed, ["replies", "children", "answers"]));
  const replies = Array.isArray(rawReplies)
    ? rawReplies
        .map((item) => normalizeProductCommentItem(item))
        .filter((item): item is ProductCommentDto => item !== null)
    : [];

  const comment: ProductCommentDto = {
    id,
    productId,
    userId,
    body,
    createdAt,
    authorName,
    replies,
  };

  if (parentCommentId !== undefined) {
    comment.parentCommentId = parentCommentId;
  }
  if (rating !== undefined) {
    comment.rating = rating;
  }
  if (authorAvatarUrl) {
    comment.authorAvatarUrl = authorAvatarUrl;
  }

  return comment;
}

function normalizeProductCommentList(value: unknown): ProductCommentDto[] {
  const items = extractArrayPayload(value, ["data", "comments", "items", "rows", "results"]);
  return items
    .map((item) => normalizeProductCommentItem(item))
    .filter((item): item is ProductCommentDto => item !== null);
}

function normalizeAdminSessionItem(value: unknown, fallbackEmail = ""): AdminSessionDto | null {
  const email = findStringInNestedRecords(
    value,
    ["email", "mail", "username", "login", "name"],
    ["data", "admin", "user", "profile", "auth", "session", "me", "current"],
  )
    .trim()
    .toLowerCase();

  if (email) {
    return { email };
  }

  const persistedEmail = readAdminSessionEmail();
  if (persistedEmail) {
    return { email: persistedEmail };
  }

  const normalizedFallbackEmail = fallbackEmail.trim().toLowerCase();
  if (normalizedFallbackEmail) {
    return { email: normalizedFallbackEmail };
  }

  return null;
}

function normalizeAdminUserItem(value: unknown): AdminUserDto | null {
  const parsed = parseJsonIfNeeded(value);
  if (!isRecord(parsed)) {
    return null;
  }

  const id = toOptionalNumber(firstDefined(parsed, ["id", "userId", "user_id"]));
  if (id === undefined) {
    return null;
  }

  const email = toStringValue(firstDefined(parsed, ["email"])).toLowerCase();
  const name =
    toStringValue(firstDefined(parsed, ["name", "username"])) || email || `Usuário ${id}`;
  const productCount =
    toOptionalNumber(firstDefined(parsed, ["productCount", "product_count"])) ?? 0;

  const user: AdminUserDto = {
    id,
    name,
    email,
    productCount,
  };

  const username = toStringValue(firstDefined(parsed, ["username"]));
  if (username) {
    user.username = username;
  }

  const phone = normalizePhoneDigits(firstDefined(parsed, ["phone", "whatsapp_number"]));
  if (phone) {
    user.phone = phone;
  }

  const country = toStringValue(firstDefined(parsed, ["country"]));
  if (country) {
    user.country = country;
  }

  const city = toStringValue(firstDefined(parsed, ["city"]));
  if (city) {
    user.city = city;
  }

  const createdAt = toStringValue(firstDefined(parsed, ["createdAt", "created_at"]));
  if (createdAt) {
    user.createdAt = createdAt;
  }

  return user;
}

function normalizeAdminUserList(value: unknown): AdminUserDto[] {
  const items = extractArrayPayload(value, ["data", "users", "items", "rows", "results"]);
  return items
    .map((item) => normalizeAdminUserItem(item))
    .filter((item): item is AdminUserDto => item !== null);
}

function extractTokenFromAuthPayload(value: unknown): string {
  return findStringInNestedRecords(
    value,
    [
      "token",
      "accessToken",
      "access_token",
      "jwt",
      "adminToken",
      "admin_token",
      "adminJwt",
      "admin_jwt",
    ],
    ["data", "auth", "session", "admin", "user", "profile", "result"],
  );
}

type ApiRequestInit = RequestInit & {
  useAdminToken?: boolean;
};

async function request<T>(url: string, init?: ApiRequestInit): Promise<T> {
  const { useAdminToken = false, ...fetchInit } = init ?? {};
  const headers = new Headers(fetchInit.headers ?? {});
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = useAdminToken ? readAdminToken() : readAuthToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (useAdminToken && token) {
    headers.set("X-Admin-Token", token);
    headers.set("X-Admin-Auth", token);
  }

  const response = await trackedFetch(buildApiUrl(url), {
    credentials: "include",
    ...fetchInit,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!response.ok) {
    if (response.status === 401) {
      if (useAdminToken) {
        clearAdminToken();
        clearAdminSessionEmail();
      } else {
        clearAuthToken();
      }
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

async function uploadImageFileToEndpoint(
  file: File,
  endpoint: string,
): Promise<UploadImageResponse> {
  const headers = new Headers({
    "Content-Type": file.type || "image/jpeg",
    "X-File-Name": encodeURIComponent(file.name || "upload"),
  });
  const authToken = readAuthToken();
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  const response = await trackedFetch(buildApiUrl(endpoint), {
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

async function uploadImageFile(
  file: File,
  endpointOrEndpoints: string | string[],
): Promise<UploadImageResponse> {
  const endpointList = Array.isArray(endpointOrEndpoints)
    ? endpointOrEndpoints
    : [endpointOrEndpoints];
  let lastError: unknown = null;

  for (const endpoint of endpointList) {
    try {
      return await uploadImageFileToEndpoint(file, endpoint);
    } catch (error) {
      lastError = error;
      if (!isMissingApiRouteError(error)) {
        throw error;
      }
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error("Falha ao enviar imagem.");
}

async function uploadProductImageFile(file: File): Promise<UploadImageResponse> {
  return uploadImageFile(file, ["/api/uploads/product-image", "/api/uploads/image"]);
}

async function uploadProfileImageFile(file: File): Promise<UploadImageResponse> {
  return uploadImageFile(file, [
    "/api/uploads/profile-image",
    "/api/uploads/product-image",
    "/api/uploads/image",
  ]);
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

    const registerPayloadBase = {
      name: name || derivedUsername,
      username: derivedUsername,
      email,
      password: payload.password,
    };

    const registerPayload = {
      ...registerPayloadBase,
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
      acceptedInstructions: true,
      instructionsAccepted: true,
      acceptedBottleInfo: true,
      bottleInfoAccepted: true,
      thermalBottleInfoAccepted: true,
      acceptedThermalBottleInfo: true,
      acceptedInstructionManual: true,
      instructionManualAccepted: true,
      acknowledgedThermalBottleInfo: true,
      acknowledgedInstructions: true,
      consents: {
        privacyPolicy: true,
        termsOfService: true,
        communityGuidelines: true,
        instructions: true,
        thermalBottleInfo: true,
      },
      consent: {
        privacyPolicy: true,
        terms: true,
        guidelines: true,
        instructions: true,
        bottleInfo: true,
      },
    };

    const registerPayloadTargeted = {
      ...registerPayloadBase,
      acceptedPrivacyPolicy: true,
      privacyPolicyAccepted: true,
      acceptPrivacyPolicy: true,
      acceptedTerms: true,
      termsAccepted: true,
      acceptedGuidelines: true,
      guidelinesAccepted: true,
      acceptedInstructions: true,
      instructionsAccepted: true,
      acceptedThermalBottleInfo: true,
      thermalBottleInfoAccepted: true,
      accepted_privacy_policy: true,
      privacy_policy_accepted: true,
      accepted_terms: true,
      terms_accepted: true,
      accepted_guidelines: true,
      guidelines_accepted: true,
      accepted_instructions: true,
      instructions_accepted: true,
      accepted_thermal_bottle_info: true,
      thermal_bottle_info_accepted: true,
    };

    const registerPayloadExtended = {
      ...registerPayload,
      accepted_privacy: true,
      accepted_privacy_policy: true,
      accepted_terms: true,
      accepted_community: true,
      accepted_guidelines: true,
      privacy_policy_accepted: true,
      terms_accepted: true,
      community_accepted: true,
      community_guidelines_accepted: true,
      guidelines_accepted: true,
      policy_accepted: true,
      legal_accepted: true,
      accepted_instructions: true,
      instructions_accepted: true,
      accepted_bottle_info: true,
      bottle_info_accepted: true,
      thermal_bottle_info_accepted: true,
      accepted_thermal_bottle_info: true,
      acknowledged_thermal_bottle_info: true,
      acknowledged_instructions: true,
      consent_flags: {
        privacy_policy: true,
        terms: true,
        guidelines: true,
        instructions: true,
        thermal_bottle_info: true,
      },
    };

    const payloadCandidates = [
      registerPayloadTargeted,
      registerPayloadExtended,
      registerPayloadBase,
    ];
    const routeCandidates = [
      "/api/auth/register",
      "/api/auth/signup",
      "/api/auth",
      "/api/register",
    ];

    let lastError: unknown;

    for (const route of routeCandidates) {
      let routeMissing = false;
      for (let index = 0; index < payloadCandidates.length; index += 1) {
        const payloadCandidate = payloadCandidates[index];
        const hasNextPayloadCandidate = index < payloadCandidates.length - 1;
        try {
          const raw = await request<unknown>(route, {
            method: "POST",
            body: JSON.stringify(payloadCandidate),
          });

          const authToken = extractTokenFromAuthPayload(raw);
          if (authToken) {
            persistAuthToken(authToken);
          }

          const user =
            normalizeSessionUserItem(raw) ??
            normalizeSessionUserItem(
              await request<unknown>("/api/auth/me").catch(() => null),
            );
          if (!user) {
            throw new Error("Resposta inválida ao criar conta.");
          }

          return user;
        } catch (error) {
          lastError = error;
          if (isMissingApiRouteError(error)) {
            routeMissing = true;
            break;
          }
          if (hasNextPayloadCandidate && shouldRetryRegisterPayloadOnSameRoute(error)) {
            continue;
          }
          throw error;
        }
      }
      if (routeMissing) {
        continue;
      }
    }

    if (lastError instanceof Error) {
      throw lastError;
    }
    throw new Error("Falha ao criar conta.");
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
  async updateProfileAvatar(avatarUrl: string) {
    const normalizedAvatarUrl = toStringValue(avatarUrl);
    if (!normalizedAvatarUrl) {
      throw new Error("URL da foto de perfil inválida.");
    }

    try {
      const raw = await request<unknown>("/api/profile/avatar", {
        method: "PUT",
        body: JSON.stringify({ avatarUrl: normalizedAvatarUrl }),
      });
      const user =
        normalizeSessionUserItem(raw) ??
        normalizeSessionUserItem(await request<unknown>("/api/auth/me").catch(() => null));
      if (user) {
        return user;
      }
    } catch (error) {
      if (!isMissingApiRouteError(error)) {
        throw error;
      }
    }

    const fallbackRaw = await request<unknown>("/api/profile", {
      method: "PUT",
      body: JSON.stringify({
        avatarUrl: normalizedAvatarUrl,
        avatar_url: normalizedAvatarUrl,
        profileImageUrl: normalizedAvatarUrl,
        profile_image_url: normalizedAvatarUrl,
      }),
    });
    const fallbackUser =
      normalizeSessionUserItem(fallbackRaw) ??
      normalizeSessionUserItem(await request<unknown>("/api/auth/me").catch(() => null));
    if (fallbackUser) {
      return fallbackUser;
    }

    throw new Error("Resposta inválida ao atualizar foto de perfil.");
  },
  async updatePreferredLocale(locale: "it-IT" | "pt-BR") {
    const payload = { locale };
    try {
      const raw = await request<unknown>("/api/profile/locale", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      return normalizeSessionUserItem(raw);
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error;
      }
      const message = error.message.toLowerCase();
      const shouldFallback =
        message.includes("404") ||
        message.includes("rota da api não encontrada") ||
        message.includes("cannot put /api/profile/locale");
      if (!shouldFallback) {
        throw error;
      }
    }

    const raw = await request<unknown>("/api/auth/locale", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return normalizeSessionUserItem(raw);
  },
  async getNewProductDraftDefaults() {
    try {
      const raw = await request<unknown>("/api/profile/new-product-defaults");
      return normalizeNewProductDraftDefaultsItem(raw);
    } catch (error) {
      if (isMissingApiRouteError(error)) {
        return null;
      }
      throw error;
    }
  },
  async updateNewProductDraftDefaults(payload: NewProductDraftDefaults) {
    const normalizedPayload = normalizeNewProductDraftDefaultsItem(payload);
    const raw = await request<unknown>("/api/profile/new-product-defaults", {
      method: "PUT",
      body: JSON.stringify(normalizedPayload),
    });
    return normalizeNewProductDraftDefaultsItem(raw);
  },
  async getProducts() {
    const payload = await request<unknown>("/api/products");
    return normalizeProductList(payload);
  },
  async getVendors(search = "", limit = 60) {
    const normalizedSearch = search.trim();
    const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 100);

    if (supportsVendorsApi !== false) {
      const query = new URLSearchParams();
      if (normalizedSearch) {
        query.set("search", normalizedSearch);
      }
      query.set("limit", String(safeLimit));

      try {
        const payload = await request<unknown>(`/api/vendors?${query.toString()}`);
        supportsVendorsApi = true;
        return normalizeVendorList(payload);
      } catch (error) {
        if (!isMissingApiRouteError(error)) {
          throw error;
        }
        supportsVendorsApi = false;
      }
    }

    const productsPayload = await request<unknown>("/api/products");
    const fallbackVendors = buildVendorsFromProducts(normalizeProductList(productsPayload));
    const filteredFallback = normalizedSearch
      ? fallbackVendors.filter((vendor) =>
          vendor.name.toLowerCase().includes(normalizedSearch.toLowerCase()),
        )
      : fallbackVendors;

    const limitedFallback = filteredFallback.slice(0, safeLimit);
    return enrichVendorsWithPublicProfiles(limitedFallback);
  },
  async getVendorProducts(vendorId: number): Promise<{ vendor: VendorDto; products: ProductDto[] }> {
    if (!Number.isInteger(vendorId) || vendorId <= 0) {
      throw new Error("ID de vendedor inválido.");
    }

    if (supportsVendorsApi !== false) {
      try {
        const payload = await request<unknown>(`/api/vendors/${vendorId}/products`);
        const parsed = parseJsonIfNeeded(payload);
        if (!isRecord(parsed)) {
          throw new Error("Resposta inválida ao carregar vendedor.");
        }

        const vendor =
          normalizeVendorItem(firstDefined(parsed, ["vendor", "seller", "user"])) ||
          normalizeVendorItem(parsed);
        if (!vendor) {
          throw new Error("Resposta inválida ao carregar vendedor.");
        }

        const productsPayload = firstDefined(parsed, ["products", "items", "rows", "results"]);
        const products = normalizeProductList(productsPayload ?? []);
        supportsVendorsApi = true;

        return {
          vendor,
          products,
        };
      } catch (error) {
        if (!isMissingApiRouteError(error)) {
          throw error;
        }
        supportsVendorsApi = false;
      }
    }

    const [productsPayload, vendorPayload] = await Promise.all([
      request<unknown>("/api/products"),
      supportsPublicUserApi === false
        ? Promise.resolve(null)
        : request<unknown>(`/api/users/${vendorId}`)
            .then((payload) => {
              supportsPublicUserApi = true;
              return payload;
            })
            .catch((error) => {
              if (isMissingApiRouteError(error) || isUnauthorizedApiError(error)) {
                supportsPublicUserApi = false;
                return null;
              }
              throw error;
            }),
    ]);

    const products = normalizeProductList(productsPayload).filter(
      (product) => product.ownerId === vendorId,
    );
    const vendorUser = vendorPayload === null ? null : normalizeSessionUserItem(vendorPayload);
    const fallbackVendorName =
      toStringValue(vendorUser?.name) ||
      toStringValue(products[0]?.sellerName) ||
      `Vendedor ${vendorId}`;
    const fallbackVendor: VendorDto = {
      id: vendorId,
      name: fallbackVendorName,
      avatarUrl: toStringValue(vendorUser?.avatarUrl),
      productCount: products.length,
    };

    return {
      vendor: fallbackVendor,
      products,
    };
  },
  async getProductById(id: number) {
    const payload = await request<unknown>(`/api/products/${id}`);
    const normalized = normalizeProductItem(payload);
    if (!normalized) {
      throw new Error("Resposta inválida ao carregar produto.");
    }
    return normalized;
  },
  async getProductComments(productId: number) {
    if (!Number.isInteger(productId) || productId <= 0) {
      throw new Error("ID de produto inválido.");
    }

    try {
      const payload = await request<unknown>(`/api/products/${productId}/comments`);
      return normalizeProductCommentList(payload);
    } catch (error) {
      if (isMissingApiRouteError(error)) {
        return [];
      }
      throw error;
    }
  },
  async createProductComment(productId: number, input: CreateProductCommentInput) {
    if (!Number.isInteger(productId) || productId <= 0) {
      throw new Error("ID de produto inválido.");
    }

    const normalizedBody = toStringValue(input.body).trim();
    if (!normalizedBody) {
      throw new Error("Comentário é obrigatório.");
    }

    const payload = {
      body: normalizedBody,
      rating:
        Number.isInteger(input.rating) && Number(input.rating) > 0 ? Number(input.rating) : undefined,
      parentCommentId:
        Number.isInteger(input.parentCommentId) && Number(input.parentCommentId) > 0
          ? Number(input.parentCommentId)
          : undefined,
    };

    const response = await request<unknown>(`/api/products/${productId}/comments`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return normalizeProductCommentList(response);
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
  notifyProductCartInterest(id: number) {
    return request<{ success: boolean }>(`/api/products/${id}/cart-interest`, {
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
  uploadProfileImage(file: File) {
    return uploadProfileImageFile(file);
  },
  admin: {
    async login(email: string, password: string) {
      const rawEmail = email.trim();
      const normalizedEmail = rawEmail.toLowerCase();
      const normalizedPassword = password.trim();
      const emailCandidates = Array.from(
        new Set([rawEmail, normalizedEmail].filter((value) => value.length > 0)),
      );

      const loginPayloadCandidates: Array<Record<string, string>> = [];
      for (const emailCandidate of emailCandidates) {
        loginPayloadCandidates.push(
          { email: emailCandidate, password: normalizedPassword },
          { login: emailCandidate, password: normalizedPassword },
          { username: emailCandidate, password: normalizedPassword },
          { email: emailCandidate, senha: normalizedPassword },
          { login: emailCandidate, senha: normalizedPassword },
          { username: emailCandidate, senha: normalizedPassword },
        );
      }
      const loginRouteCandidates = [
        "/api/admin/login",
        "/api/admin/auth/login",
        "/api/admin/auth",
      ];

      clearAdminToken();
      let lastError: unknown;

      for (const route of loginRouteCandidates) {
        let routeHandledByServer = false;
        let routeAuthError: unknown = null;

        for (const payloadCandidate of loginPayloadCandidates) {
          try {
            const payload = await request<unknown>(route, {
              method: "POST",
              body: JSON.stringify(payloadCandidate),
              useAdminToken: true,
            });
            const adminToken = extractTokenFromAuthPayload(payload);
            if (adminToken) {
              persistAdminToken(adminToken);
            }
            const session = normalizeAdminSessionItem(payload, normalizedEmail);
            if (!session) {
              throw new Error("Resposta inválida ao autenticar administrador.");
            }
            persistAdminSessionEmail(session.email);
            return session;
          } catch (error) {
            lastError = error;
            if (isMissingApiRouteError(error)) {
              break;
            }
            routeHandledByServer = true;
            if (isAdminLoginPayloadFormatError(error) || isUnauthorizedApiError(error)) {
              routeAuthError = error;
              continue;
            }
            throw error;
          }
        }

        // If this route exists and auth failed, avoid falling through to legacy missing routes
        // that would replace the real error with a noisy 404.
        if (routeHandledByServer) {
          lastError = routeAuthError ?? lastError;
          break;
        }
      }

      clearAdminToken();
      clearAdminSessionEmail();
      if (lastError instanceof Error) {
        throw lastError;
      }
      throw new Error("Falha ao autenticar administrador.");
    },
    async getCurrent() {
      const adminToken = readAdminToken();
      const persistedEmail = readAdminSessionEmail();
      try {
        await request<unknown>("/api/admin/users", { useAdminToken: true });
        if (persistedEmail) {
          return { email: persistedEmail };
        }
      } catch (error) {
        if (isUnauthorizedApiError(error)) {
          clearAdminToken();
          clearAdminSessionEmail();
          throw error;
        }
        if (!isMissingApiRouteError(error)) {
          throw error;
        }
      }

      const sessionRouteCandidates = ["/api/admin/auth/me", "/api/admin/auth"];
      let lastError: unknown;

      for (const route of sessionRouteCandidates) {
        try {
          const payload = await request<unknown>(route, { useAdminToken: true });
          const adminToken = extractTokenFromAuthPayload(payload);
          if (adminToken) {
            persistAdminToken(adminToken);
          }
          const session = normalizeAdminSessionItem(payload);
          if (!session) {
            throw new Error("Sessão de administrador inválida.");
          }
          persistAdminSessionEmail(session.email);
          return session;
        } catch (error) {
          lastError = error;
          if (isMissingApiRouteError(error)) {
            continue;
          }
          throw error;
        }
      }

      if (adminToken && persistedEmail) {
        return { email: persistedEmail };
      }

      if (lastError instanceof Error) {
        throw lastError;
      }
      throw new Error("Sessão de administrador inválida.");
    },
    async logout() {
      try {
        const logoutRouteCandidates: Array<{ route: string; method: "POST" | "DELETE" }> = [
          { route: "/api/admin/auth/logout", method: "POST" },
          { route: "/api/admin/auth", method: "DELETE" },
          { route: "/api/admin/logout", method: "POST" },
          { route: "/api/admin/logout", method: "DELETE" },
        ];

        for (const candidate of logoutRouteCandidates) {
          try {
            return await request<{ success: boolean }>(candidate.route, {
              method: candidate.method,
              useAdminToken: true,
            });
          } catch (error) {
            if (isMissingApiRouteError(error)) {
              continue;
            }
            throw error;
          }
        }
        return { success: true };
      } finally {
        clearAdminToken();
        clearAdminSessionEmail();
      }
    },
    async getUsers() {
      const payload = await request<unknown>("/api/admin/users", { useAdminToken: true });
      return normalizeAdminUserList(payload);
    },
    async getUserProducts(userId: number) {
      const payload = await request<unknown>(`/api/admin/users/${userId}/products`, {
        useAdminToken: true,
      });
      return normalizeProductList(payload);
    },
    deleteProduct(productId: number) {
      return request<{ success: boolean }>(`/api/admin/products/${productId}`, {
        method: "DELETE",
        useAdminToken: true,
      });
    },
    deleteUser(userId: number) {
      return request<{ success: boolean }>(`/api/admin/users/${userId}`, {
        method: "DELETE",
        useAdminToken: true,
      });
    },
  },
};
