import cors from "cors";
import crypto, { type JsonWebKey as NodeJsonWebKey } from "node:crypto";
import Database from "better-sqlite3";
import dotenv from "dotenv";
import express, { type Request, type Response } from "express";
import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";
import {
  NEGOTIABLE_PRICE_STORAGE_VALUE,
  isNegotiablePriceValue,
} from "./src/lib/negotiable-price";

type ProductRecord = {
  id: number;
  slug?: string;
  name: string;
  category: string;
  clickCount?: number;
  price: string;
  priceNegotiable?: boolean;
  quantity?: number;
  image: string;
  images: string[];
  description?: string;
  details?: Record<string, string>;
  ownerId?: number;
  latitude?: number;
  longitude?: number;
  city?: string;
  sellerName?: string;
  sellerWhatsappCountryIso?: string;
  sellerWhatsappNumber?: string;
};

type ProductRow = {
  id: number;
  slug: string | null;
  name: string;
  name_translations: string | null;
  category: string;
  click_count: number;
  price: string;
  price_negotiable: number | boolean;
  quantity: number;
  image: string;
  images: string;
  description: string | null;
  description_translations: string | null;
  details: string | null;
  user_id: number | null;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  seller_name: string | null;
  seller_email: string | null;
  seller_country: string | null;
  seller_state: string | null;
  seller_whatsapp_country_iso: string | null;
  seller_whatsapp_number: string | null;
};

type AdminProductRecord = ProductRecord & {
  owner?: {
    id?: number;
    name?: string;
    email?: string;
    country?: string;
    state?: string;
    city?: string;
    whatsappCountryIso?: string;
    whatsappNumber?: string;
  };
};

type ProductCommentRow = {
  id: number;
  product_id: number;
  user_id: number;
  parent_comment_id: number | null;
  rating: number | null;
  body: string;
  body_translations: string | null;
  created_at: number;
  author_name: string;
  author_avatar_url: string | null;
};

type ProductCommentRecord = {
  id: number;
  productId: number;
  userId: number;
  parentCommentId?: number;
  rating?: number;
  body: string;
  createdAt: number;
  authorName: string;
  authorAvatarUrl: string;
  replies: ProductCommentRecord[];
};

type NotificationEventType =
  | "product_like"
  | "product_cart_interest"
  | "product_comment"
  | "admin_broadcast";

type NotificationEventRow = {
  type: NotificationEventType;
  actor_user_id: number | null;
  actor_name: string;
  actor_avatar_url: string | null;
  actor_city: string | null;
  actor_country: string | null;
  product_id: number | null;
  product_name: string;
  product_image_url: string | null;
  comment_id: number | null;
  created_at: number;
  event_id: string;
  title_translations: string | null;
  message_translations: string | null;
  recipient_locale: string | null;
};

type NotificationRecord = {
  id: string;
  type: NotificationEventType;
  title: string;
  message: string;
  createdAt: number;
  actorUserId?: number;
  actorName?: string;
  actorAvatarUrl?: string;
  actorCity?: string;
  actorCountry?: string;
  productId?: number;
  productName?: string;
  productImageUrl?: string;
  commentId?: number;
};

type AdminBroadcastNotificationRecord = {
  id: number;
  title: string;
  message: string;
  titleTranslations: Partial<Record<AppLocale, string>>;
  messageTranslations: Partial<Record<AppLocale, string>>;
  translationStatus: Partial<Record<AppLocale, string>>;
  productId?: number;
  productName?: string;
  createdBy: string;
  createdAt: number;
};

type AppLocale = "it-IT" | "pt-BR" | "ar-SA";

type UserRow = {
  id: number;
  name: string;
  email: string;
  auth0_sub: string | null;
  password_hash: string;
  password_salt: string;
  avatar_url: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  neighborhood: string | null;
  street: string | null;
  whatsapp_country_iso: string | null;
  whatsapp_number: string | null;
  location_latitude: number | null;
  location_longitude: number | null;
  preferred_locale: string | null;
  is_banned: boolean;
  ban_reason: string | null;
};

type SessionUser = {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string;
  country?: string;
  state?: string;
  city?: string;
  neighborhood?: string;
  street?: string;
  whatsappCountryIso?: string;
  whatsappNumber?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  preferredLocale?: AppLocale;
};

type Auth0JwtClaims = {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  email_verified?: boolean;
  iss?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
};

type Auth0JsonWebKey = NodeJsonWebKey & {
  kid?: string;
  alg?: string;
  use?: string;
};

type PublicVendorRecord = {
  id: number;
  name: string;
  avatarUrl?: string;
  productCount: number;
};

type AdminSessionUser = {
  email: string;
};

type AdminUserRecord = {
  id: number;
  name: string;
  email: string;
  username?: string;
  phone?: string;
  country?: string;
  state?: string;
  city?: string;
  neighborhood?: string;
  street?: string;
  whatsappCountryIso?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  productCount: number;
  createdAt?: string;
  isBanned?: boolean;
  banReason?: string;
};

type DailyVisitorRow = {
  id: number;
  visit_date: string;
  visitor_key: string;
  ip: string | null;
  user_agent: string | null;
  entry_path: string | null;
  referrer: string | null;
  referrer_host: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  first_seen_at: number;
  last_seen_at: number;
  visits: number;
};

type DailyVisitorUpsertInput = {
  visitDate: string;
  visitorKey: string;
  ip: string;
  userAgent: string;
  entryPath: string;
  referrer: string;
  referrerHost: string;
  country: string;
  region: string;
  city: string;
  seenAt: number;
  countAsVisit: boolean;
};

type VisitorDeviceProfile = {
  deviceType: string;
  deviceModel: string;
  osName: string;
  osVersion: string;
};

type SecurityMonitorLevel = "info" | "warn" | "alert";

type SecurityMonitorEvent = {
  id: number;
  created_at: number;
  method: string;
  path: string;
  status: number;
  duration_ms: number;
  ip: string;
  user_agent: string;
  level: SecurityMonitorLevel;
  note: string;
  is_admin_route: boolean;
  has_auth_token: boolean;
  has_admin_token: boolean;
};

type NormalizedProductInput = {
  name: string;
  category: string;
  price: string;
  priceNegotiable: boolean;
  quantity: number;
  image: string;
  images: string;
  description: string;
  details: string;
  latitude: number;
  longitude: number;
};

type UserProfileUpdateInput = {
  id: number;
  name: string;
  country: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  whatsapp_country_iso: string;
  whatsapp_number: string;
};

type NewProductDraftDefaults = {
  name: string;
  category: string;
  latitude: string;
  longitude: string;
  description: string;
  details: Record<string, string>;
};

type VendorRow = {
  id: number;
  name: string;
  avatar_url: string | null;
  product_count: number;
};

type SessionUserRow = Pick<
  UserRow,
  | "id"
  | "name"
  | "email"
  | "auth0_sub"
  | "avatar_url"
  | "country"
  | "state"
  | "city"
  | "neighborhood"
  | "street"
  | "whatsapp_country_iso"
  | "whatsapp_number"
  | "location_latitude"
  | "location_longitude"
  | "preferred_locale"
>;

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DB_DIR, "local.db");
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const DATABASE_URL = String(process.env.DATABASE_URL ?? "").trim();
if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is required. Configure the Render PostgreSQL URL to start the backend.",
  );
}
const DEFAULT_DATABASE_SEARCH_PATH = "templesale,public";
const DATABASE_SEARCH_PATH =
  normalizePostgresSearchPath(process.env.DATABASE_SEARCH_PATH) || DEFAULT_DATABASE_SEARCH_PATH;
const PRIMARY_DATABASE_SCHEMA = DATABASE_SEARCH_PATH.split(",")[0] || "templesale";
const ALLOW_REMOTE_DATABASE_IN_DEV =
  String(process.env.ALLOW_REMOTE_DATABASE_IN_DEV ?? "false").toLowerCase() === "true";
const DEV_REMOTE_READ_ONLY =
  String(process.env.DEV_REMOTE_READ_ONLY ?? "true").toLowerCase() === "true";
const RUN_DATABASE_MIGRATIONS =
  String(process.env.RUN_DATABASE_MIGRATIONS ?? (!IS_PRODUCTION).toString()).toLowerCase() ===
  "true";
const SUPPORTED_APP_LOCALES: AppLocale[] = ["it-IT", "pt-BR", "ar-SA"];
const DEFAULT_APP_LOCALE: AppLocale = "it-IT";
const TRANSLATE_API_KEY = String(process.env.TRANSLATE_API_KEY ?? "").trim();
const TRANSLATE_PROVIDER_TIMEOUT_MS = Math.max(
  1500,
  Number(process.env.TRANSLATE_TIMEOUT_MS ?? 5500) || 5500,
);
const TRANSLATE_PROVIDER_BASE_URLS = Array.from(
  new Set(
    [
      String(process.env.TRANSLATE_API_BASE_URL ?? "").trim(),
      "https://libretranslate.de",
      "https://translate.astian.org",
      "https://libretranslate.com",
      "https://translate.argosopentech.com",
    ].filter(Boolean),
  ),
);
const TRANSLATE_LOCALE_TARGETS: Record<AppLocale, string> = {
  "it-IT": "it",
  "pt-BR": "pt",
  "ar-SA": "ar",
};
const translationCache = new Map<string, string>();

function normalizePostgresSearchPath(value: unknown): string {
  const raw = String(value ?? DEFAULT_DATABASE_SEARCH_PATH).trim();
  const schemaNames = raw
    .split(",")
    .map((schemaName) => schemaName.trim())
    .filter((schemaName) => /^[a-z_][a-z0-9_]*$/i.test(schemaName));

  return Array.from(new Set(schemaNames)).join(",");
}

function normalizeAppLocale(value: unknown): AppLocale | null {
  const raw = String(value ?? "").trim();
  if (raw === "it-IT" || raw === "pt-BR" || raw === "ar-SA") {
    return raw;
  }

  const lower = raw.toLowerCase();
  if (lower.startsWith("it")) {
    return "it-IT";
  }
  if (lower.startsWith("pt")) {
    return "pt-BR";
  }
  if (lower.startsWith("ar")) {
    return "ar-SA";
  }

  return null;
}

function parseTranslationMap(value: unknown): Partial<Record<AppLocale, string>> {
  if (!value) {
    return {};
  }

  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    const normalized: Partial<Record<AppLocale, string>> = {};
    for (const locale of SUPPORTED_APP_LOCALES) {
      const translated = String((parsed as Record<string, unknown>)[locale] ?? "").trim();
      if (translated) {
        normalized[locale] = translated;
      }
    }
    return normalized;
  } catch {
    return {};
  }
}

function stringifyTranslationMap(map: Partial<Record<AppLocale, string>>): string {
  const normalized: Partial<Record<AppLocale, string>> = {};
  for (const locale of SUPPORTED_APP_LOCALES) {
    const translated = String(map[locale] ?? "").trim();
    if (translated) {
      normalized[locale] = translated;
    }
  }
  return JSON.stringify(normalized);
}

function getLocalizedText(
  original: string,
  translations: unknown,
  locale: AppLocale | null | undefined,
): string {
  const normalizedOriginal = String(original ?? "");
  const normalizedLocale = normalizeAppLocale(locale) ?? DEFAULT_APP_LOCALE;
  return parseTranslationMap(translations)[normalizedLocale] || normalizedOriginal;
}

function getRequestLocale(req: Request): AppLocale {
  const explicitLocale = normalizeAppLocale(req.headers["x-templesale-locale"]);
  if (explicitLocale) {
    return explicitLocale;
  }

  const acceptLanguage = String(req.headers["accept-language"] ?? "");
  for (const part of acceptLanguage.split(",")) {
    const locale = normalizeAppLocale(part.split(";")[0]);
    if (locale) {
      return locale;
    }
  }

  return DEFAULT_APP_LOCALE;
}

async function translateWithLibreProvider(
  text: string,
  target: string,
  baseUrl: string,
): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TRANSLATE_PROVIDER_TIMEOUT_MS);
  try {
    const payload: Record<string, unknown> = {
      q: text,
      source: "auto",
      target,
      format: "text",
    };
    if (TRANSLATE_API_KEY) {
      payload.api_key = TRANSLATE_API_KEY;
    }

    const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/translate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!response.ok) {
      return null;
    }
    const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;
    const translated = String(data?.translatedText ?? "").trim();
    return translated || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function translateWithMyMemory(text: string, target: string): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TRANSLATE_PROVIDER_TIMEOUT_MS);
  try {
    const normalizedTarget = target.trim().toLowerCase();
    const sourceLanguage = normalizedTarget === "pt" ? "it" : "en";
    const url = new URL("https://api.mymemory.translated.net/get");
    url.searchParams.set("q", text.slice(0, 5000));
    url.searchParams.set("langpair", `${sourceLanguage}|${normalizedTarget}`);
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      return null;
    }
    const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;
    const responseData = data?.responseData as Record<string, unknown> | undefined;
    const translated = String(responseData?.translatedText ?? "").trim();
    const normalizedTranslated = translated.toUpperCase();
    const invalidTranslation =
      !translated ||
      normalizedTranslated.includes("INVALID SOURCE LANGUAGE") ||
      normalizedTranslated.includes("LANGPAIR=") ||
      normalizedTranslated.includes("NO CONTENT") ||
      normalizedTranslated.includes("MYMEMORY WARNING");
    return invalidTranslation ? null : translated;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function translateTextToLocale(text: string, locale: AppLocale): Promise<string | null> {
  const normalizedText = String(text ?? "").trim();
  if (!normalizedText) {
    return null;
  }

  const target = TRANSLATE_LOCALE_TARGETS[locale];
  const cacheKey = `${locale}|${normalizedText}`;
  const cached = translationCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  for (const baseUrl of TRANSLATE_PROVIDER_BASE_URLS) {
    const translated = await translateWithLibreProvider(normalizedText, target, baseUrl);
    if (translated) {
      translationCache.set(cacheKey, translated);
      return translated;
    }
  }

  const fallback = await translateWithMyMemory(normalizedText, target);
  if (fallback) {
    translationCache.set(cacheKey, fallback);
    return fallback;
  }

  return null;
}

async function buildTranslationsForText(
  text: string,
): Promise<{
  translations: Partial<Record<AppLocale, string>>;
  status: Partial<Record<AppLocale, string>>;
}> {
  const normalizedText = String(text ?? "").trim();
  const translations: Partial<Record<AppLocale, string>> = {};
  const status: Partial<Record<AppLocale, string>> = {};
  if (!normalizedText) {
    return { translations, status };
  }

  await Promise.all(
    SUPPORTED_APP_LOCALES.map(async (locale) => {
      const translated = await translateTextToLocale(normalizedText, locale);
      if (!translated) {
  throw new Error(`Falha ao traduzir conteúdo para ${locale}. A notificação não foi enviada.`);
}

translations[locale] = translated;
status[locale] = "translated";
    }),
  );

  return { translations, status };
}

async function buildContentTranslations(input: {
  title?: string;
  message?: string;
  name?: string;
  description?: string;
  body?: string;
}) {
  const [title, message, name, description, body] = await Promise.all([
    buildTranslationsForText(input.title ?? ""),
    buildTranslationsForText(input.message ?? ""),
    buildTranslationsForText(input.name ?? ""),
    buildTranslationsForText(input.description ?? ""),
    buildTranslationsForText(input.body ?? ""),
  ]);

  const status: Partial<Record<AppLocale, string>> = {};
  for (const locale of SUPPORTED_APP_LOCALES) {
    const values = [
      title.status[locale],
      message.status[locale],
      name.status[locale],
      description.status[locale],
      body.status[locale],
    ].filter(Boolean);
    if (values.length > 0) {
      status[locale] = values.every((value) => value === "translated")
        ? "translated"
        : "partial";
    }
  }

  return { title, message, name, description, body, status };
}

function isLocalDatabaseHost(hostname: string): boolean {
  const normalizedHost = String(hostname ?? "").trim().toLowerCase();
  if (!normalizedHost) {
    return false;
  }

  return (
    normalizedHost === "localhost" ||
    normalizedHost === "127.0.0.1" ||
    normalizedHost === "::1" ||
    normalizedHost.endsWith(".local")
  );
}

function extractDatabaseHostname(databaseUrl: string): string {
  try {
    return new URL(databaseUrl).hostname;
  } catch {
    return "";
  }
}

function normalizeCredentialValue(value: unknown, lowercase: boolean): string {
  const raw = String(value ?? "").trim();
  const withoutQuotes =
    (raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))
      ? raw.slice(1, -1).trim()
      : raw;
  return lowercase ? withoutQuotes.toLowerCase() : withoutQuotes;
}

function parseCredentialAliases(value: unknown, lowercase: boolean): string[] {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return [];
  }

  const aliases = raw
    .split(/[,\n;]+/)
    .map((item) => normalizeCredentialValue(item, lowercase))
    .filter((item) => item.length > 0);

  return Array.from(new Set(aliases));
}

function timingSafeEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

const DATABASE_HOSTNAME = extractDatabaseHostname(DATABASE_URL);
const IS_REMOTE_DATABASE = !isLocalDatabaseHost(DATABASE_HOSTNAME);
const IS_DEV_REMOTE_DATABASE = !IS_PRODUCTION && IS_REMOTE_DATABASE;
const IS_DEV_REMOTE_READ_ONLY =
  IS_DEV_REMOTE_DATABASE && ALLOW_REMOTE_DATABASE_IN_DEV && DEV_REMOTE_READ_ONLY;
if (IS_DEV_REMOTE_DATABASE && !ALLOW_REMOTE_DATABASE_IN_DEV) {
  throw new Error(
    "Safety guard: refusing to start dev server with remote DATABASE_URL. Use a local database or set ALLOW_REMOTE_DATABASE_IN_DEV=true only if you intentionally accept this risk.",
  );
}
const DEFAULT_IMAGE = "https://picsum.photos/seed/placeholder/800/1200";
const CLOUDINARY_CLOUD_NAME = String(process.env.CLOUDINARY_CLOUD_NAME ?? "").trim();
const CLOUDINARY_API_KEY = String(process.env.CLOUDINARY_API_KEY ?? "").trim();
const CLOUDINARY_API_SECRET = String(process.env.CLOUDINARY_API_SECRET ?? "").trim();
const CLOUDINARY_UPLOAD_FOLDER =
  String(process.env.CLOUDINARY_UPLOAD_FOLDER ?? "").trim() || "templesale/products";
const CLOUDINARY_PROFILE_UPLOAD_FOLDER =
  String(process.env.CLOUDINARY_PROFILE_UPLOAD_FOLDER ?? "").trim() ||
  `${CLOUDINARY_UPLOAD_FOLDER.replace(/\/+$/, "")}/profiles`;
const CLEAN_LOCAL_PRODUCTS_ON_BOOT =
  String(process.env.CLEAN_LOCAL_PRODUCTS_ON_BOOT ?? "false").toLowerCase() === "true";
const AUTH0_DOMAIN = String(process.env.AUTH0_DOMAIN ?? process.env.VITE_AUTH0_DOMAIN ?? "")
  .trim()
  .replace(/^https?:\/\//i, "")
  .replace(/\/+$/, "");
const AUTH0_ISSUER = AUTH0_DOMAIN ? `https://${AUTH0_DOMAIN}/` : "";
const AUTH0_CLIENT_ID = String(
  process.env.AUTH0_CLIENT_ID ?? process.env.VITE_AUTH0_CLIENT_ID ?? "",
).trim();
const AUTH0_AUDIENCE = String(
  process.env.AUTH0_AUDIENCE ?? process.env.VITE_AUTH0_AUDIENCE ?? "",
).trim();
const AUTH0_EXPECTED_AUDIENCE = AUTH0_AUDIENCE || AUTH0_CLIENT_ID;
const AUTH0_JWKS_URL = AUTH0_ISSUER ? `${AUTH0_ISSUER}.well-known/jwks.json` : "";
const AUTH0_JWKS_CACHE_TTL_MS = 60 * 60 * 1000;
let auth0JwksCache: { fetchedAt: number; keys: Auth0JsonWebKey[] } | null = null;
const AUTH0_DEBUG_LOGS = !IS_PRODUCTION;
const SESSION_COOKIE_NAME = "templesale_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 365;
const DEFAULT_ADMIN_EMAIL = "templesale@admin.com";
const DEFAULT_ADMIN_PASSWORD = "Gui@1604";
const ADMIN_EMAIL =
  normalizeCredentialValue(process.env.ADMIN_EMAIL ?? DEFAULT_ADMIN_EMAIL, true) ||
  DEFAULT_ADMIN_EMAIL;
const ADMIN_PASSWORD =
  normalizeCredentialValue(process.env.ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD, false) ||
  DEFAULT_ADMIN_PASSWORD;
const DEFAULT_ADMIN_TEST_AREA_PASSWORD = "@2t2b";
const ADMIN_TEST_AREA_PASSWORD =
  normalizeCredentialValue(
    process.env.ADMIN_TEST_AREA_PASSWORD ?? DEFAULT_ADMIN_TEST_AREA_PASSWORD,
    false,
  ) || DEFAULT_ADMIN_TEST_AREA_PASSWORD;
const ADMIN_EMAIL_ALIASES = parseCredentialAliases(process.env.ADMIN_EMAIL_ALIASES, true);
const ADMIN_PASSWORD_ALIASES = parseCredentialAliases(process.env.ADMIN_PASSWORD_ALIASES, false);
const ADMIN_API_KEY_ALIASES = parseCredentialAliases(process.env.ADMIN_API_KEY_ALIASES, false);
const ADMIN_EMAIL_CANDIDATES = Array.from(new Set([ADMIN_EMAIL, ...ADMIN_EMAIL_ALIASES]));
const ADMIN_PASSWORD_CANDIDATES = Array.from(
  new Set([ADMIN_PASSWORD, ...ADMIN_PASSWORD_ALIASES]),
);
const ADMIN_API_KEY_CANDIDATES = Array.from(
  new Set(
    [
      normalizeCredentialValue(process.env.ADMIN_API_KEY ?? "", false),
      ...ADMIN_API_KEY_ALIASES,
    ].filter((value) => value.length > 0),
  ),
);
const ADMIN_SESSION_COOKIE_NAME = "templesale_admin_session";
const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 12;
const ADMIN_SESSION_SECRET = String(
  process.env.ADMIN_SESSION_SECRET ?? "templesale_admin_secret",
).trim();
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAP_TILE_PROVIDER_TEMPLATES = [
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  "https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
  "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
] as const;
const MAP_TILE_MIN_ZOOM = 0;
const MAP_TILE_MAX_ZOOM = 20;
const MAP_TILE_FETCH_TIMEOUT_MS = 4500;
const MAP_TILE_CACHE_CONTROL = "public, max-age=21600, stale-while-revalidate=43200";
const SECURITY_PERMISSIONS_POLICY = [
  "accelerometer=()",
  "autoplay=()",
  "camera=()",
  "display-capture=()",
  "fullscreen=(self)",
  "geolocation=(self)",
  "gyroscope=()",
  "microphone=()",
  "payment=()",
  "usb=()",
].join(", ");
const SECURITY_HSTS_VALUE = "max-age=63072000; includeSubDomains; preload";
const SECURITY_CONTACT_EMAIL =
  String(process.env.SECURITY_CONTACT_EMAIL ?? "security@templesale.com")
    .trim()
    .toLowerCase() || "security@templesale.com";
const SECURITY_POLICY_URL =
  String(process.env.SECURITY_POLICY_URL ?? "https://www.templesale.com/.well-known/security.txt")
    .trim() || "https://www.templesale.com/.well-known/security.txt";
const SENSITIVE_PUBLIC_PATH_PATTERNS: RegExp[] = [
  /^\/\.svn(?:\/|$)/i,
  /^\/\.git(?:\/|$)/i,
  /^\/\.hg(?:\/|$)/i,
  /^\/\.DS_Store$/i,
  /^\/Dockerfile(?:\.[^/]*)?$/i,
  /^\/docker-compose(?:\.[^/]*)?\.ya?ml$/i,
  /^\/config\.php(?:\.[^/]*)?$/i,
  /^\/\.env(?:\.[^/]*)?$/i,
  /(?:^|\/)[^/]+\.(?:bak|backup|old|orig|swp|tmp)$/i,
];
const UPLOAD_MAX_BYTES = 12 * 1024 * 1024;
const CART_NOTIFICATION_DEDUP_WINDOW_SECONDS = 15 * 60;
const WHATSAPP_COUNTRIES = {
  IT: {
    iso: "IT",
    name: "Italia",
    dialDigits: "39",
  },
} as const;

type WhatsappCountryIso = keyof typeof WHATSAPP_COUNTRIES;
const NEW_PRODUCT_DRAFT_ALLOWED_DETAIL_KEYS = new Set([
  "type",
  "area",
  "rooms",
  "bathrooms",
  "parking",
  "brand",
  "model",
  "color",
  "year",
]);
const NEW_PRODUCT_DRAFT_MAX_DETAILS = 24;
const PRODUCT_COMMENT_MIN_RATING = 1;
const PRODUCT_COMMENT_MAX_RATING = 5;
const PRODUCT_COMMENT_MAX_BODY_LENGTH = 1200;
const PRODUCT_SLUG_FALLBACK_BASE = "prodotto";
const PRODUCT_SLUG_MAX_TOTAL_LENGTH = 96;
const RESERVED_PRODUCT_ROUTE_SEGMENTS = new Set(["api", "admin", "moldura"]);
const SECURITY_MONITOR_MAX_EVENTS = 800;
const SECURITY_MONITOR_DEFAULT_LIMIT = 120;
const SECURITY_MONITOR_MAX_LIMIT = 500;
const AGENT_SITE_ID_REGEX = /^[a-z0-9_-]{3,64}$/i;
const VISITOR_DATE_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const VISITOR_ASSET_PATH_REGEX =
  /\.(?:css|js|mjs|map|json|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|eot|txt|xml|pdf|webmanifest)$/i;
const VISITOR_TEXT_LIMITS = {
  ip: 100,
  userAgent: 260,
  path: 220,
  referrer: 420,
  host: 160,
  country: 40,
  region: 80,
  city: 120,
} as const;
const VISITOR_DAY_FETCH_LIMIT = 2000;
const VISITOR_VISIT_INCREMENT_MIN_INTERVAL_MS = 15_000;
const VISITOR_FINGERPRINT_SALT =
  String(process.env.VISITOR_FINGERPRINT_SALT ?? "").trim() || "templesale-visitor-v1";
const VISITOR_TRACKING_COOKIE_NAME = "templesale_vid";
const VISITOR_TRACKING_COOKIE_MAX_AGE_SECONDS = 180 * 24 * 60 * 60;
const VISITOR_TRACKING_COOKIE_TOKEN_REGEX = /^[a-z0-9_-]{16,120}$/i;
const ADMIN_SELF_DEVICE_SIGNATURES_FETCH_LIMIT = 200;
const securityMonitorEvents: SecurityMonitorEvent[] = [];
const agentProtectionBySiteId = new globalThis.Map<string, boolean>();
let securityMonitorEventSequence = 0;

function buildContentSecurityPolicy(isProduction: boolean): string {
  const scriptSources = ["'self'", "https://unpkg.com"];
  const styleSources = ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"];
  const connectSources = [
    "'self'",
    "https://unpkg.com",
    "https://api.cloudinary.com",
    "https://res.cloudinary.com",
    "https://fonts.googleapis.com",
    "https://fonts.gstatic.com",
    "https://saleday-backend.onrender.com",
    "https://www.templesale.com",
    "https://templesale.com",
    "https://dev-dc1ylz5a2z8st3lr.eu.auth0.com",
  ];
  const frameSources = ["https://dev-dc1ylz5a2z8st3lr.eu.auth0.com"];

  if (!isProduction) {
    scriptSources.push("'unsafe-eval'", "'unsafe-inline'", "http://localhost:*", "http://127.0.0.1:*");
    connectSources.push("ws://localhost:*", "ws://127.0.0.1:*", "http://localhost:*", "http://127.0.0.1:*");
  }

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'self'",
    "object-src 'none'",
    "form-action 'self'",
    `script-src ${scriptSources.join(" ")}`,
    `style-src ${styleSources.join(" ")}`,
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src ${connectSources.join(" ")}`,
    `frame-src ${frameSources.join(" ")}`,
    "worker-src 'self' blob:",
    "upgrade-insecure-requests",
  ].join("; ");
}

function normalizeAgentSiteId(value: unknown): string {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized || !AGENT_SITE_ID_REGEX.test(normalized)) {
    return "";
  }
  return normalized;
}

function resolveAgentProtectionStatus(siteId: string): boolean {
  const stored = agentProtectionBySiteId.get(siteId);
  return typeof stored === "boolean" ? stored : true;
}

function buildAgentRuntimeScript(siteId: string, apiBase: string): string {
  const serializedSiteId = JSON.stringify(siteId);
  const serializedApiBase = JSON.stringify(apiBase.replace(/\/+$/, ""));

  return `(function() {
  const SITE_ID = ${serializedSiteId};
  const API_BASE = ${serializedApiBase};
  const STATUS_URL = API_BASE + "/api/agent/status/" + SITE_ID;
  const REPORT_URL = API_BASE + "/api/agent/report?siteId=" + SITE_ID;
  const MAX_EVENTS = 30;
  let sentEvents = 0;
  const dedupe = {};

  function textSafe(value, maxLen) {
    const raw = String(value || "").replace(/\\s+/g, " ").trim();
    if (!raw) return "-";
    return raw.length > maxLen ? raw.slice(0, maxLen) + "..." : raw;
  }

  function markOnce(key) {
    if (dedupe[key]) return false;
    dedupe[key] = true;
    return true;
  }

  function sendEvent(type, target, status) {
    if (sentEvents >= MAX_EVENTS) return;
    sentEvents += 1;

    fetch(REPORT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteId: SITE_ID,
        type: textSafe(type, 120),
        source: textSafe(window.location.origin + window.location.pathname, 160),
        target: textSafe(target, 260),
        status: status || "Monitored"
      }),
      keepalive: true
    }).catch(function() {});
  }

  function runPageChecks() {
    if (window.location.protocol !== "https:") {
      if (markOnce("no_https")) {
        sendEvent("Agent: Site sem HTTPS", "Página em HTTP: " + window.location.href, "Monitored");
      }
    }

    const insecureScripts = document.querySelectorAll('script[src^="http://"]');
    if (insecureScripts.length > 0 && markOnce("insecure_scripts")) {
      sendEvent("Agent: Script externo inseguro", "Scripts HTTP detectados: " + insecureScripts.length, "Monitored");
    }

    const insecureForms = Array.from(document.forms).filter(function(form) {
      const action = form.getAttribute("action") || "";
      return /^http:\\/\\//i.test(action);
    });
    if (insecureForms.length > 0 && markOnce("insecure_forms")) {
      sendEvent("Agent: Formulário inseguro", "Formulários HTTP detectados: " + insecureForms.length, "Monitored");
    }

    const hasPassword = document.querySelector('input[type="password"]');
    if (hasPassword && window.location.protocol !== "https:" && markOnce("password_no_https")) {
      sendEvent("Agent: Senha sem HTTPS", "Campo de senha em página sem HTTPS", "Monitored");
    }
  }

  function installRuntimeChecks() {
    window.addEventListener("securitypolicyviolation", function(event) {
      const key = "csp_" + textSafe(event.violatedDirective || "-", 120);
      if (!markOnce(key)) return;
      sendEvent(
        "Agent: CSP violada",
        "Diretiva: " + textSafe(event.violatedDirective || "-", 100) + " | Recurso: " + textSafe(event.blockedURI || "-", 120),
        "Monitored"
      );
    });

    window.addEventListener("error", function(event) {
      const message = textSafe(event.message || "erro_js", 120);
      const key = "js_" + message;
      if (!markOnce(key)) return;
      sendEvent(
        "Agent: Erro JavaScript",
        message + " | Arquivo: " + textSafe((event.filename || "-") + ":" + (event.lineno || 0), 120),
        "Monitored"
      );
    });

    window.addEventListener("unhandledrejection", function(event) {
      const reason = textSafe(event.reason && (event.reason.message || event.reason) || "promise_rejeitada", 120);
      const key = "promise_" + reason;
      if (!markOnce(key)) return;
      sendEvent("Agent: Promise rejeitada", reason, "Monitored");
    });
  }

  async function checkSecurity() {
    try {
      const res = await fetch(STATUS_URL);
      if (!res.ok) return;
      const status = await res.json();
      if (status.protected) {
        console.log("🛡️ AntiImpostor Active: Site Protected");
        if (markOnce("protection_on")) {
          sendEvent("Agent: Proteção ativa", "Conectado ao painel AntiImpostor", "Monitored");
        }
      } else {
        console.warn("⚠️ AntiImpostor Warning: Protection Disabled by Admin");
        if (markOnce("protection_off")) {
          sendEvent("Agent: Proteção desligada", "A proteção está desativada no painel", "Monitored");
        }
      }
    } catch (e) {
      console.error("AntiImpostor Connection Error");
    }
  }

  if (markOnce("agent_connected")) {
    sendEvent("Agent: Agente conectado", "Script carregado em " + window.location.origin, "Monitored");
  }
  runPageChecks();
  installRuntimeChecks();
  checkSecurity();
  setInterval(checkSecurity, 60000);
})();`;
}

const PRODUCT_SELECT_FIELDS = `
  p.id,
  NULLIF(TRIM(COALESCE(p.slug, '')), '') AS slug,
  COALESCE(NULLIF(TRIM(COALESCE(p.name, '')), ''), NULLIF(TRIM(COALESCE(p.title, '')), ''), 'Produto sem título') AS name,
  COALESCE(p.name_translations, '{}') AS name_translations,
  p.category,
  COALESCE(p.click_count, 0) AS click_count,
  p.price,
  COALESCE(p.price_negotiable, FALSE) AS price_negotiable,
  COALESCE(p.quantity, 1) AS quantity,
  COALESCE(NULLIF(TRIM(COALESCE(p.image, '')), ''), NULLIF(TRIM(COALESCE(p.image_url, '')), ''), '') AS image,
  CASE
    WHEN p.images IS NOT NULL AND TRIM(p.images) <> '' AND TRIM(p.images) <> '[]' THEN p.images
    WHEN p.image_urls IS NOT NULL AND TRIM(p.image_urls) <> '' AND TRIM(p.image_urls) <> '[]' THEN p.image_urls
    ELSE '[]'
  END AS images,
  COALESCE(p.description, '') AS description,
  COALESCE(p.description_translations, '{}') AS description_translations,
  COALESCE(p.details, '{}') AS details,
  p.user_id,
  COALESCE(p.latitude, p.lat) AS latitude,
  COALESCE(p.longitude, p.lng) AS longitude,
  u.city AS city,
  u.name AS seller_name,
  u.email AS seller_email,
  u.country AS seller_country,
  u.state AS seller_state,
  u.whatsapp_country_iso AS seller_whatsapp_country_iso,
  u.whatsapp_number AS seller_whatsapp_number
`;

const USER_SELECT_FIELDS = `
  id,
  name,
  email,
  auth0_sub,
  password_hash,
  password_salt,
  avatar_url,
  country,
  state,
  city,
  neighborhood,
  street,
  whatsapp_country_iso,
  whatsapp_number,
  location_latitude,
  location_longitude,
  preferred_locale,
  COALESCE(is_banned, FALSE) AS is_banned,
  NULLIF(TRIM(COALESCE(ban_reason, '')), '') AS ban_reason
`;

const SESSION_USER_SELECT_FIELDS = `
  u.id,
  u.name,
  u.email,
  u.auth0_sub,
  u.avatar_url,
  u.country,
  u.state,
  u.city,
  u.neighborhood,
  u.street,
  u.whatsapp_country_iso,
  u.whatsapp_number,
  u.location_latitude,
  u.location_longitude,
  u.preferred_locale
`;

let sqliteDb: Database.Database | null = null;
let pgPool: Pool | null = null;

pgPool = new Pool({
  connectionString: DATABASE_URL,
  options: `-c search_path=${DATABASE_SEARCH_PATH}`,
  ssl: String(process.env.PGSSL ?? "").toLowerCase() === "false"
    ? false
    : { rejectUnauthorized: false },
});
if (IS_DEV_REMOTE_READ_ONLY && pgPool) {
  pgPool.on("connect", (client) => {
    void client.query("SET default_transaction_read_only = on").catch((error) => {
      console.error("Failed to enforce read-only session in dev remote mode:", error);
    });
  });
}

function requireSqliteDb(): Database.Database {
  if (!sqliteDb) {
    throw new Error("SQLite database is not initialized.");
  }
  return sqliteDb;
}

function toNullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  return String(value);
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toRequiredNumber(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error("Invalid numeric value returned from database.");
  }
  return parsed;
}

function toRequiredNonNegativeInteger(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  const integerValue = Math.floor(parsed);
  if (integerValue < 0) {
    return fallback;
  }
  return integerValue;
}

function toBooleanValue(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value !== 0;
  }
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) {
    return fallback;
  }
  if (["1", "true", "t", "yes", "y", "sim", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "f", "no", "n", "nao", "não", "off"].includes(normalized)) {
    return false;
  }
  return fallback;
}

function normalizeProductSlugSegment(value: unknown): string {
  const normalized = String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
    .replace(/-{2,}/g, "-");
  return normalized;
}

function sanitizeProductSlugForStorage(rawSlug: unknown): string {
  const normalized = normalizeProductSlugSegment(rawSlug);
  if (!normalized) {
    return "";
  }
  if (RESERVED_PRODUCT_ROUTE_SEGMENTS.has(normalized)) {
    return `${PRODUCT_SLUG_FALLBACK_BASE}-${normalized}`;
  }
  return normalized;
}

function buildProductSlug(name: string, productId: number): string {
  const normalizedId = toRequiredNonNegativeInteger(productId, 0);
  if (normalizedId <= 0) {
    throw new Error("ID inválido para gerar slug de produto.");
  }

  const normalizedBase = sanitizeProductSlugForStorage(name) || PRODUCT_SLUG_FALLBACK_BASE;
  const suffix = String(normalizedId);
  const maxBaseLength = Math.max(
    PRODUCT_SLUG_FALLBACK_BASE.length,
    PRODUCT_SLUG_MAX_TOTAL_LENGTH - suffix.length - 1,
  );
  let truncatedBase = normalizedBase.slice(0, maxBaseLength).replace(/-+$/, "");
  if (!truncatedBase) {
    truncatedBase = PRODUCT_SLUG_FALLBACK_BASE;
  }
  return `${truncatedBase}-${suffix}`;
}

function normalizeProductRow(row: Record<string, unknown>): ProductRow {
  return {
    id: toRequiredNumber(row.id),
    slug: toNullableString(row.slug),
    name: String(row.name ?? ""),
    name_translations: toNullableString(row.name_translations),
    category: String(row.category ?? ""),
    click_count: toRequiredNonNegativeInteger(row.click_count, 0),
    price: String(row.price ?? ""),
    price_negotiable: toBooleanValue(row.price_negotiable, false),
    quantity: toRequiredNonNegativeInteger(row.quantity, 1),
    image: String(row.image ?? DEFAULT_IMAGE),
    images: String(row.images ?? "[]"),
    description: toNullableString(row.description),
    description_translations: toNullableString(row.description_translations),
    details: toNullableString(row.details),
    user_id: toNullableNumber(row.user_id),
    latitude: toNullableNumber(row.latitude),
    longitude: toNullableNumber(row.longitude),
    city: toNullableString(row.city),
    seller_name: toNullableString(row.seller_name),
    seller_email: toNullableString(row.seller_email),
    seller_country: toNullableString(row.seller_country),
    seller_state: toNullableString(row.seller_state),
    seller_whatsapp_country_iso: toNullableString(row.seller_whatsapp_country_iso),
    seller_whatsapp_number: toNullableString(row.seller_whatsapp_number),
  };
}

function normalizeUserRow(row: Record<string, unknown>): UserRow {
  return {
    id: toRequiredNumber(row.id),
    name: String(row.name ?? ""),
    email: String(row.email ?? ""),
    auth0_sub: toNullableString(row.auth0_sub),
    password_hash: String(row.password_hash ?? ""),
    password_salt: String(row.password_salt ?? ""),
    avatar_url: toNullableString(row.avatar_url),
    country: toNullableString(row.country),
    state: toNullableString(row.state),
    city: toNullableString(row.city),
    neighborhood: toNullableString(row.neighborhood),
    street: toNullableString(row.street),
    whatsapp_country_iso: toNullableString(row.whatsapp_country_iso),
    whatsapp_number: toNullableString(row.whatsapp_number),
    location_latitude: toNullableNumber(row.location_latitude),
    location_longitude: toNullableNumber(row.location_longitude),
    preferred_locale: toNullableString(row.preferred_locale),
    is_banned: toBooleanValue(row.is_banned, false),
    ban_reason: toNullableString(row.ban_reason),
  };
}

function normalizeSessionUserRow(row: Record<string, unknown>): SessionUserRow {
  return {
    id: toRequiredNumber(row.id),
    name: String(row.name ?? ""),
    email: String(row.email ?? ""),
    auth0_sub: toNullableString(row.auth0_sub),
    avatar_url: toNullableString(row.avatar_url),
    country: toNullableString(row.country),
    state: toNullableString(row.state),
    city: toNullableString(row.city),
    neighborhood: toNullableString(row.neighborhood),
    street: toNullableString(row.street),
    whatsapp_country_iso: toNullableString(row.whatsapp_country_iso),
    whatsapp_number: toNullableString(row.whatsapp_number),
    location_latitude: toNullableNumber(row.location_latitude),
    location_longitude: toNullableNumber(row.location_longitude),
    preferred_locale: toNullableString(row.preferred_locale),
  };
}

function normalizeNotificationEventRow(row: Record<string, unknown>): NotificationEventRow {
  const rawType = String(row.type ?? "").trim();
  const type: NotificationEventType =
    rawType === "product_cart_interest"
      ? "product_cart_interest"
      : rawType === "product_comment"
        ? "product_comment"
        : rawType === "admin_broadcast"
          ? "admin_broadcast"
          : "product_like";
  const productId = toNullableNumber(row.product_id);
  const actorUserId = toNullableNumber(row.actor_user_id);
  const parsedCreatedAt = (() => {
    const numericValue = Number(row.created_at);
    if (Number.isFinite(numericValue)) {
      return Math.floor(numericValue);
    }

    if (row.created_at instanceof Date) {
      const fromDate = Math.floor(row.created_at.getTime() / 1000);
      if (Number.isFinite(fromDate)) {
        return fromDate;
      }
    }

    const asText = String(row.created_at ?? "").trim();
    if (asText) {
      const parsedMs = Date.parse(asText);
      if (Number.isFinite(parsedMs)) {
        return Math.floor(parsedMs / 1000);
      }
    }

    return Math.floor(Date.now() / 1000);
  })();

  return {
    type,
    actor_user_id: actorUserId,
    actor_name: String(row.actor_name ?? ""),
    actor_avatar_url: toNullableString(row.actor_avatar_url),
    actor_city: toNullableString(row.actor_city),
    actor_country: toNullableString(row.actor_country),
    product_id: productId,
    product_name: String(row.product_name ?? ""),
    product_image_url: toNullableString(row.product_image_url),
    comment_id: toNullableNumber(row.comment_id),
    created_at: parsedCreatedAt,
    event_id:
      String(row.event_id ?? "").trim() ||
      `${type}:${productId ?? "site"}:${actorUserId ?? "anon"}:${parsedCreatedAt}`,
    title_translations: toNullableString(row.title_translations),
    message_translations: toNullableString(row.message_translations),
    recipient_locale: toNullableString(row.recipient_locale),
  };
}

function normalizeProductCommentRow(row: Record<string, unknown>): ProductCommentRow {
  const parsedCreatedAt = (() => {
    const numericValue = Number(row.created_at);
    if (Number.isFinite(numericValue)) {
      return Math.floor(numericValue);
    }

    if (row.created_at instanceof Date) {
      const fromDate = Math.floor(row.created_at.getTime() / 1000);
      if (Number.isFinite(fromDate)) {
        return fromDate;
      }
    }

    const asText = String(row.created_at ?? "").trim();
    if (asText) {
      const parsedMs = Date.parse(asText);
      if (Number.isFinite(parsedMs)) {
        return Math.floor(parsedMs / 1000);
      }
    }

    return Math.floor(Date.now() / 1000);
  })();

  return {
    id: toRequiredNumber(row.id),
    product_id: toRequiredNumber(row.product_id),
    user_id: toRequiredNumber(row.user_id),
    parent_comment_id: toNullableNumber(row.parent_comment_id),
    rating: toNullableNumber(row.rating),
    body: String(row.body ?? ""),
    body_translations: toNullableString(row.body_translations),
    created_at: parsedCreatedAt,
    author_name: String(row.author_name ?? "").trim() || `Usuário ${toRequiredNumber(row.user_id)}`,
    author_avatar_url: toNullableString(row.author_avatar_url),
  };
}

function normalizeVendorRow(row: Record<string, unknown>): VendorRow {
  return {
    id: toRequiredNumber(row.id),
    name: String(row.name ?? "").trim(),
    avatar_url: toNullableString(row.avatar_url),
    product_count: toRequiredNonNegativeInteger(row.product_count, 0),
  };
}

function toOptionalTrimmedString(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : undefined;
}

function toOptionalIsoDateString(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  const stringValue = String(value).trim();
  if (!stringValue) {
    return undefined;
  }
  const parsed = new Date(stringValue);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }
  return stringValue;
}

function normalizeAdminUserRecord(row: Record<string, unknown>): AdminUserRecord {
  return {
    id: toRequiredNumber(row.id),
    name:
      toOptionalTrimmedString(row.name) ??
      toOptionalTrimmedString(row.username) ??
      toOptionalTrimmedString(row.email) ??
      `Usuário ${toRequiredNumber(row.id)}`,
    email: toOptionalTrimmedString(row.email) ?? "",
    username: toOptionalTrimmedString(row.username),
    phone: toOptionalTrimmedString(row.phone),
    country: toOptionalTrimmedString(row.country),
    state: toOptionalTrimmedString(row.state),
    city: toOptionalTrimmedString(row.city),
    neighborhood: toOptionalTrimmedString(row.neighborhood),
    street: toOptionalTrimmedString(row.street),
    whatsappCountryIso: toOptionalTrimmedString(row.whatsapp_country_iso ?? row.whatsappCountryIso),
    locationLatitude: toNullableNumber(row.location_latitude ?? row.locationLatitude) ?? undefined,
    locationLongitude: toNullableNumber(row.location_longitude ?? row.locationLongitude) ?? undefined,
    productCount: toRequiredNumber(row.product_count ?? row.productCount ?? 0),
    createdAt: toOptionalIsoDateString(row.created_at ?? row.createdAt),
    isBanned: toBooleanValue(row.is_banned ?? row.isBanned, false),
    banReason: toOptionalTrimmedString(row.ban_reason ?? row.banReason),
  };
}

function toEpochMilliseconds(value: unknown, fallback = Date.now()): number {
  const numericValue = Number(value);
  if (Number.isFinite(numericValue) && numericValue > 0) {
    if (numericValue >= 10_000_000_000) {
      return Math.floor(numericValue);
    }
    return Math.floor(numericValue * 1000);
  }

  if (value instanceof Date) {
    const fromDate = value.getTime();
    if (Number.isFinite(fromDate) && fromDate > 0) {
      return Math.floor(fromDate);
    }
  }

  const asText = String(value ?? "").trim();
  if (asText) {
    const parsed = Date.parse(asText);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.floor(parsed);
    }
  }

  return Math.max(1, Math.floor(fallback));
}

function normalizeDailyVisitorRow(row: Record<string, unknown>): DailyVisitorRow {
  return {
    id: toRequiredNonNegativeInteger(row.id, 0),
    visit_date: String(row.visit_date ?? "").trim(),
    visitor_key: String(row.visitor_key ?? "").trim(),
    ip: toNullableString(row.ip),
    user_agent: toNullableString(row.user_agent),
    entry_path: toNullableString(row.entry_path),
    referrer: toNullableString(row.referrer),
    referrer_host: toNullableString(row.referrer_host),
    country: toNullableString(row.country),
    region: toNullableString(row.region),
    city: toNullableString(row.city),
    first_seen_at: toEpochMilliseconds(row.first_seen_at, Date.now()),
    last_seen_at: toEpochMilliseconds(row.last_seen_at, Date.now()),
    visits: toRequiredNonNegativeInteger(row.visits, 0),
  };
}

function normalizeVisitorTrackingText(value: unknown, maxLength: number): string {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "";
  }
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return normalized.slice(0, Math.max(1, maxLength));
}

function resolveVisitorDateKeyFromTimestamp(timestampMs: number): string {
  const date = new Date(timestampMs);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
}

function normalizeVisitorDateKey(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!VISITOR_DATE_KEY_REGEX.test(raw)) {
    return resolveVisitorDateKeyFromTimestamp(Date.now());
  }

  const parsed = Date.parse(`${raw}T00:00:00.000Z`);
  if (!Number.isFinite(parsed)) {
    return resolveVisitorDateKeyFromTimestamp(Date.now());
  }
  return raw;
}

function normalizeIpForVisitorTracking(value: string): string {
  const normalized = normalizeVisitorTrackingText(value, VISITOR_TEXT_LIMITS.ip);
  if (!normalized) {
    return "unknown";
  }

  const withoutIpv6Prefix = normalized.startsWith("::ffff:")
    ? normalized.slice("::ffff:".length)
    : normalized;
  const ipv4PortMatch = withoutIpv6Prefix.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/);
  if (ipv4PortMatch?.[1]) {
    return ipv4PortMatch[1];
  }

  return withoutIpv6Prefix;
}

function normalizeVisitorVersionToken(value: string): string {
  const normalized = String(value ?? "")
    .replace(/_/g, ".")
    .replace(/[^0-9.]/g, "")
    .replace(/\.+/g, ".")
    .replace(/^\.+|\.+$/g, "");
  if (!normalized) {
    return "";
  }

  const parts = normalized.split(".").filter(Boolean);
  if (parts.length === 0) {
    return "";
  }

  if (parts.length === 1) {
    return parts[0] || "";
  }
  return `${parts[0]}.${parts[1]}`;
}

function resolveVisitorOperatingSystem(userAgent: string): { osName: string; osVersion: string } {
  const normalized = userAgent.toLowerCase();

  const iosMatch = userAgent.match(/(?:cpu (?:iphone )?os|ios)\s+([0-9_\.]+)/i);
  if (iosMatch?.[1]) {
    return {
      osName: "iOS",
      osVersion: normalizeVisitorVersionToken(iosMatch[1]),
    };
  }

  const androidMatch = userAgent.match(/Android\s+([0-9.]+)/i);
  if (androidMatch?.[1]) {
    return {
      osName: "Android",
      osVersion: normalizeVisitorVersionToken(androidMatch[1]),
    };
  }

  const macMatch = userAgent.match(/Mac OS X\s+([0-9_\.]+)/i);
  if (macMatch?.[1]) {
    return {
      osName: "macOS",
      osVersion: normalizeVisitorVersionToken(macMatch[1]),
    };
  }

  const windowsMatch = userAgent.match(/Windows NT\s+([0-9.]+)/i);
  if (windowsMatch?.[1]) {
    return {
      osName: "Windows",
      osVersion: normalizeVisitorVersionToken(windowsMatch[1]),
    };
  }

  if (normalized.includes("linux")) {
    return {
      osName: "Linux",
      osVersion: "",
    };
  }

  return {
    osName: "unknown",
    osVersion: "",
  };
}

function resolveVisitorDeviceType(userAgent: string): string {
  const normalized = userAgent.toLowerCase();
  if (
    normalized.includes("bot") ||
    normalized.includes("crawler") ||
    normalized.includes("spider") ||
    normalized.includes("vercel-screenshot")
  ) {
    return "bot";
  }
  if (
    normalized.includes("ipad") ||
    normalized.includes("tablet") ||
    (normalized.includes("android") && !normalized.includes("mobile"))
  ) {
    return "tablet";
  }
  if (
    normalized.includes("iphone") ||
    normalized.includes("ipod") ||
    normalized.includes("android") ||
    normalized.includes("mobile")
  ) {
    return "mobile";
  }
  if (
    normalized.includes("macintosh") ||
    normalized.includes("windows") ||
    normalized.includes("linux") ||
    normalized.includes("x11")
  ) {
    return "desktop";
  }
  return "unknown";
}

function resolveVisitorDeviceModel(userAgent: string): string {
  if (/iPhone/i.test(userAgent)) {
    return "iPhone";
  }
  if (/iPad/i.test(userAgent)) {
    return "iPad";
  }

  const androidMatch = userAgent.match(/Android[^;)]*;\s*([^) ;]{1,60})/i);
  if (androidMatch?.[1]) {
    const candidate = androidMatch[1]
      .replace(/build\/.*/i, "")
      .replace(/[^a-z0-9._-]/gi, "")
      .trim();
    if (candidate) {
      return candidate;
    }
  }

  if (/Macintosh/i.test(userAgent)) {
    return "Mac";
  }
  if (/Windows/i.test(userAgent)) {
    return "PC";
  }
  if (/Linux/i.test(userAgent)) {
    return "Linux";
  }
  if (/vercel-screenshot/i.test(userAgent)) {
    return "vercel-screenshot";
  }
  return "unknown";
}

function buildVisitorDeviceProfile(userAgent: string): VisitorDeviceProfile {
  const normalizedUserAgent = normalizeVisitorTrackingText(userAgent, VISITOR_TEXT_LIMITS.userAgent);
  const os = resolveVisitorOperatingSystem(normalizedUserAgent);
  return {
    deviceType: resolveVisitorDeviceType(normalizedUserAgent),
    deviceModel: resolveVisitorDeviceModel(normalizedUserAgent),
    osName: os.osName || "unknown",
    osVersion: os.osVersion,
  };
}

function isReliableVisitorDeviceProfile(profile: VisitorDeviceProfile): boolean {
  if (profile.deviceType === "unknown" || profile.deviceType === "bot") {
    return false;
  }
  if (profile.deviceModel === "unknown") {
    return false;
  }
  if (profile.osName === "unknown") {
    return false;
  }
  return true;
}

function buildVisitorDeviceProfileSignatureKey(profile: VisitorDeviceProfile): string {
  if (!isReliableVisitorDeviceProfile(profile)) {
    return "";
  }
  return [
    profile.deviceType,
    profile.deviceModel,
    profile.osName,
    profile.osVersion || "0",
  ]
    .map((part) => part.trim().toLowerCase())
    .join("|");
}

function normalizeVisitorTrackingCookieToken(value: unknown): string {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return "";
  }
  if (!VISITOR_TRACKING_COOKIE_TOKEN_REGEX.test(normalized)) {
    return "";
  }
  return normalized;
}

function createVisitorTrackingCookieToken(): string {
  return crypto.randomBytes(18).toString("base64url");
}

function buildVisitorFingerprintKey(input: {
  ip: string;
  userAgent: string;
  visitorToken?: string;
}): string {
  const visitorToken = normalizeVisitorTrackingCookieToken(input.visitorToken ?? "");
  if (visitorToken) {
    return crypto
      .createHash("sha256")
      .update(`${VISITOR_FINGERPRINT_SALT}|cookie|${visitorToken}`)
      .digest("hex");
  }

  const normalizedIp = normalizeIpForVisitorTracking(input.ip);
  const deviceProfile = buildVisitorDeviceProfile(input.userAgent);
  const profileToken = [
    deviceProfile.deviceType,
    deviceProfile.deviceModel,
    deviceProfile.osName,
    deviceProfile.osVersion || "0",
  ]
    .map((part) => part.trim().toLowerCase())
    .join("|");

  return crypto
    .createHash("sha256")
    .update(`${VISITOR_FINGERPRINT_SALT}|device|${normalizedIp}|${profileToken}`)
    .digest("hex");
}

function extractReferrerHost(referrer: string): string {
  if (!referrer) {
    return "";
  }

  try {
    return new URL(referrer).host.trim().toLowerCase();
  } catch {
    return "";
  }
}

function resolveVisitorGeoHeaders(req: Request): { country: string; region: string; city: string } {
  const pickHeader = (candidates: Array<string | string[] | undefined>, maxLength: number): string => {
    for (const candidate of candidates) {
      const normalized = normalizeVisitorTrackingText(
        getRequestHeaderTokenValue(candidate),
        maxLength,
      );
      if (!normalized) {
        continue;
      }
      return normalized;
    }
    return "";
  };

  return {
    country: pickHeader(
      [
        req.headers["x-vercel-ip-country"],
        req.headers["cf-ipcountry"],
        req.headers["cloudfront-viewer-country"],
        req.headers["x-country-code"],
      ],
      VISITOR_TEXT_LIMITS.country,
    ),
    region: pickHeader(
      [
        req.headers["x-vercel-ip-country-region"],
        req.headers["x-vercel-ip-region"],
        req.headers["cf-region"],
      ],
      VISITOR_TEXT_LIMITS.region,
    ),
    city: pickHeader(
      [req.headers["x-vercel-ip-city"], req.headers["cf-ipcity"]],
      VISITOR_TEXT_LIMITS.city,
    ),
  };
}

function shouldTrackDailyVisitorRequest(req: Request, normalizedPath: string): boolean {
  if (IS_DEV_REMOTE_READ_ONLY) {
    return false;
  }

  const method = String(req.method ?? "").trim().toUpperCase();
  if (method !== "GET") {
    return false;
  }

  if (!normalizedPath || normalizedPath.startsWith("/api")) {
    return false;
  }

  if (
    normalizedPath.startsWith("/assets/") ||
    normalizedPath.startsWith("/@vite") ||
    normalizedPath.startsWith("/@fs/") ||
    normalizedPath.startsWith("/node_modules/") ||
    normalizedPath.startsWith("/.well-known/")
  ) {
    return false;
  }

  if (VISITOR_ASSET_PATH_REGEX.test(normalizedPath)) {
    return false;
  }

  const accept = String(req.headers.accept ?? "").toLowerCase();
  const secFetchMode = String(req.headers["sec-fetch-mode"] ?? "").toLowerCase();
  const secFetchDest = String(req.headers["sec-fetch-dest"] ?? "").toLowerCase();
  const acceptsHtml = accept.includes("text/html");
  const isDocumentNavigation = secFetchMode === "navigate" || secFetchDest === "document";

  return acceptsHtml || isDocumentNavigation;
}

function buildDailyVisitorUpsertInput(
  req: Request,
  normalizedPath: string,
  options?: {
    res?: Response;
    isProduction?: boolean;
    countAsVisit?: boolean;
  },
): DailyVisitorUpsertInput {
  const seenAt = Date.now();
  const ip = normalizeIpForVisitorTracking(getRequestIp(req));
  const userAgent = normalizeVisitorTrackingText(
    req.headers["user-agent"] ?? "",
    VISITOR_TEXT_LIMITS.userAgent,
  );
  const referrer = normalizeVisitorTrackingText(
    req.headers.referer ?? req.headers.referrer ?? "",
    VISITOR_TEXT_LIMITS.referrer,
  );
  const referrerHost = normalizeVisitorTrackingText(
    extractReferrerHost(referrer),
    VISITOR_TEXT_LIMITS.host,
  );
  const entryPath =
    normalizeVisitorTrackingText(normalizedPath || "/", VISITOR_TEXT_LIMITS.path) || "/";
  const geo = resolveVisitorGeoHeaders(req);
  const visitorToken = resolveVisitorTrackingCookieToken(
    req,
    options?.res,
    Boolean(options?.isProduction),
  );

  return {
    visitDate: resolveVisitorDateKeyFromTimestamp(seenAt),
    visitorKey: buildVisitorFingerprintKey({
      ip,
      userAgent,
      visitorToken,
    }),
    ip,
    userAgent,
    entryPath,
    referrer,
    referrerHost,
    country: geo.country,
    region: geo.region,
    city: geo.city,
    seenAt,
    countAsVisit: options?.countAsVisit !== false,
  };
}

function initializeSqliteDatabase() {
  if (sqliteDb) {
    return;
  }

  fs.mkdirSync(DB_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT,
      name TEXT NOT NULL,
      name_translations TEXT NOT NULL DEFAULT '{}',
      category TEXT NOT NULL,
      click_count INTEGER NOT NULL DEFAULT 0,
      price TEXT NOT NULL,
      price_negotiable INTEGER NOT NULL DEFAULT 0,
      quantity INTEGER NOT NULL DEFAULT 1,
      image TEXT NOT NULL,
      images TEXT NOT NULL DEFAULT '[]',
      description TEXT DEFAULT '',
      description_translations TEXT NOT NULL DEFAULT '{}',
      details TEXT NOT NULL DEFAULT '{}',
      user_id INTEGER,
      latitude REAL,
      longitude REAL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      auth0_sub TEXT,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      avatar_url TEXT NOT NULL DEFAULT '',
      country TEXT NOT NULL DEFAULT '',
      state TEXT NOT NULL DEFAULT '',
      city TEXT NOT NULL DEFAULT '',
      neighborhood TEXT NOT NULL DEFAULT '',
      street TEXT NOT NULL DEFAULT '',
      whatsapp_country_iso TEXT NOT NULL DEFAULT 'IT',
      whatsapp_number TEXT NOT NULL DEFAULT '',
      location_latitude REAL,
      location_longitude REAL,
      preferred_locale TEXT NOT NULL DEFAULT 'it-IT',
      is_banned INTEGER NOT NULL DEFAULT 0,
      ban_reason TEXT NOT NULL DEFAULT '',
      new_product_defaults TEXT NOT NULL DEFAULT '{}',
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS product_likes (
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      PRIMARY KEY (user_id, product_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS product_cart_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_user_id INTEGER NOT NULL,
      actor_user_id INTEGER,
      actor_name TEXT NOT NULL DEFAULT '',
      product_id INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS product_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      parent_comment_id INTEGER,
      rating INTEGER,
      body TEXT NOT NULL DEFAULT '',
      body_translations TEXT NOT NULL DEFAULT '{}',
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_comment_id) REFERENCES product_comments(id) ON DELETE CASCADE,
      CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5))
    );

    CREATE TABLE IF NOT EXISTS notification_dismissals (
      owner_user_id INTEGER NOT NULL,
      event_id TEXT NOT NULL,
      dismissed_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      PRIMARY KEY (owner_user_id, event_id),
      FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS admin_broadcast_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL DEFAULT '',
      message TEXT NOT NULL DEFAULT '',
      title_translations TEXT NOT NULL DEFAULT '{}',
      message_translations TEXT NOT NULL DEFAULT '{}',
      translation_status TEXT NOT NULL DEFAULT '{}',
      product_id INTEGER,
      created_by TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS site_daily_visitors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      visit_date TEXT NOT NULL,
      visitor_key TEXT NOT NULL,
      ip TEXT NOT NULL DEFAULT '',
      user_agent TEXT NOT NULL DEFAULT '',
      entry_path TEXT NOT NULL DEFAULT '/',
      referrer TEXT NOT NULL DEFAULT '',
      referrer_host TEXT NOT NULL DEFAULT '',
      country TEXT NOT NULL DEFAULT '',
      region TEXT NOT NULL DEFAULT '',
      city TEXT NOT NULL DEFAULT '',
      first_seen_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      last_seen_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      visits INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS admin_visitor_self_signatures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_email TEXT NOT NULL,
      signature_key TEXT NOT NULL,
      device_type TEXT NOT NULL DEFAULT '',
      device_model TEXT NOT NULL DEFAULT '',
      os_name TEXT NOT NULL DEFAULT '',
      os_version TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      last_seen_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      UNIQUE(admin_email, signature_key)
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_product_likes_product_id ON product_likes(product_id);
    CREATE INDEX IF NOT EXISTS idx_product_cart_notifications_owner_created
      ON product_cart_notifications(owner_user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_product_cart_notifications_product_id
      ON product_cart_notifications(product_id);
    CREATE INDEX IF NOT EXISTS idx_product_comments_product_created
      ON product_comments(product_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_product_comments_parent
      ON product_comments(parent_comment_id);
    CREATE INDEX IF NOT EXISTS idx_notification_dismissals_owner
      ON notification_dismissals(owner_user_id);
    CREATE INDEX IF NOT EXISTS idx_admin_broadcast_notifications_created
      ON admin_broadcast_notifications(created_at DESC);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_site_daily_visitors_date_key
      ON site_daily_visitors(visit_date, visitor_key);
    CREATE INDEX IF NOT EXISTS idx_site_daily_visitors_date_last_seen
      ON site_daily_visitors(visit_date, last_seen_at DESC);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_self_signatures_unique
      ON admin_visitor_self_signatures(admin_email, signature_key);
    CREATE INDEX IF NOT EXISTS idx_admin_self_signatures_email_last_seen
      ON admin_visitor_self_signatures(admin_email, last_seen_at DESC);
  `);

  const productColumns = db.prepare("PRAGMA table_info(products)").all() as Array<{ name: string }>;
  if (!productColumns.some((column) => column.name === "title")) {
    db.exec("ALTER TABLE products ADD COLUMN title TEXT");
  }
  if (!productColumns.some((column) => column.name === "user_id")) {
    db.exec("ALTER TABLE products ADD COLUMN user_id INTEGER");
  }
  if (!productColumns.some((column) => column.name === "image_url")) {
    db.exec("ALTER TABLE products ADD COLUMN image_url TEXT");
  }
  if (!productColumns.some((column) => column.name === "image_urls")) {
    db.exec("ALTER TABLE products ADD COLUMN image_urls TEXT");
  }
  if (!productColumns.some((column) => column.name === "latitude")) {
    db.exec("ALTER TABLE products ADD COLUMN latitude REAL");
  }
  if (!productColumns.some((column) => column.name === "longitude")) {
    db.exec("ALTER TABLE products ADD COLUMN longitude REAL");
  }
  if (!productColumns.some((column) => column.name === "lat")) {
    db.exec("ALTER TABLE products ADD COLUMN lat REAL");
  }
  if (!productColumns.some((column) => column.name === "lng")) {
    db.exec("ALTER TABLE products ADD COLUMN lng REAL");
  }
  if (!productColumns.some((column) => column.name === "quantity")) {
    db.exec("ALTER TABLE products ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1");
  }
  if (!productColumns.some((column) => column.name === "price_negotiable")) {
    db.exec("ALTER TABLE products ADD COLUMN price_negotiable INTEGER NOT NULL DEFAULT 0");
  }
  if (!productColumns.some((column) => column.name === "click_count")) {
    db.exec("ALTER TABLE products ADD COLUMN click_count INTEGER NOT NULL DEFAULT 0");
  }
  if (!productColumns.some((column) => column.name === "slug")) {
    db.exec("ALTER TABLE products ADD COLUMN slug TEXT");
  }
  if (!productColumns.some((column) => column.name === "name_translations")) {
    db.exec("ALTER TABLE products ADD COLUMN name_translations TEXT NOT NULL DEFAULT '{}'");
  }
  if (!productColumns.some((column) => column.name === "description_translations")) {
    db.exec("ALTER TABLE products ADD COLUMN description_translations TEXT NOT NULL DEFAULT '{}'");
  }
  db.exec("UPDATE products SET click_count = 0 WHERE click_count IS NULL OR click_count < 0");
  db.exec("UPDATE products SET quantity = 1 WHERE quantity IS NULL OR quantity < 0");
  db.exec(
    `
      UPDATE products
      SET price_negotiable = 1, price = '0'
      WHERE
        COALESCE(price_negotiable, 0) = 0
        AND LOWER(TRIM(COALESCE(price, ''))) IN (
          'negotiable',
          'a negociar',
          'da negoziare',
          'preco negociavel',
          'preço negociável',
          'prezzo negoziabile',
          'price negotiable'
        )
    `,
  );

  const userColumns = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
  if (!userColumns.some((column) => column.name === "avatar_url")) {
    db.exec("ALTER TABLE users ADD COLUMN avatar_url TEXT NOT NULL DEFAULT ''");
  }
  if (!userColumns.some((column) => column.name === "country")) {
    db.exec("ALTER TABLE users ADD COLUMN country TEXT NOT NULL DEFAULT ''");
  }
  if (!userColumns.some((column) => column.name === "state")) {
    db.exec("ALTER TABLE users ADD COLUMN state TEXT NOT NULL DEFAULT ''");
  }
  if (!userColumns.some((column) => column.name === "city")) {
    db.exec("ALTER TABLE users ADD COLUMN city TEXT NOT NULL DEFAULT ''");
  }
  if (!userColumns.some((column) => column.name === "neighborhood")) {
    db.exec("ALTER TABLE users ADD COLUMN neighborhood TEXT NOT NULL DEFAULT ''");
  }
  if (!userColumns.some((column) => column.name === "street")) {
    db.exec("ALTER TABLE users ADD COLUMN street TEXT NOT NULL DEFAULT ''");
  }
  if (!userColumns.some((column) => column.name === "whatsapp_country_iso")) {
    db.exec("ALTER TABLE users ADD COLUMN whatsapp_country_iso TEXT NOT NULL DEFAULT 'IT'");
  }
  if (!userColumns.some((column) => column.name === "whatsapp_number")) {
    db.exec("ALTER TABLE users ADD COLUMN whatsapp_number TEXT NOT NULL DEFAULT ''");
  }
  if (!userColumns.some((column) => column.name === "new_product_defaults")) {
    db.exec("ALTER TABLE users ADD COLUMN new_product_defaults TEXT NOT NULL DEFAULT '{}'");
  }
  if (!userColumns.some((column) => column.name === "location_latitude")) {
    db.exec("ALTER TABLE users ADD COLUMN location_latitude REAL");
  }
  if (!userColumns.some((column) => column.name === "location_longitude")) {
    db.exec("ALTER TABLE users ADD COLUMN location_longitude REAL");
  }
  if (!userColumns.some((column) => column.name === "preferred_locale")) {
    db.exec("ALTER TABLE users ADD COLUMN preferred_locale TEXT NOT NULL DEFAULT 'it-IT'");
  }
  if (!userColumns.some((column) => column.name === "auth0_sub")) {
    db.exec("ALTER TABLE users ADD COLUMN auth0_sub TEXT");
  }
  if (!userColumns.some((column) => column.name === "is_banned")) {
    db.exec("ALTER TABLE users ADD COLUMN is_banned INTEGER NOT NULL DEFAULT 0");
  }
  if (!userColumns.some((column) => column.name === "ban_reason")) {
    db.exec("ALTER TABLE users ADD COLUMN ban_reason TEXT NOT NULL DEFAULT ''");
  }

  const commentColumns = db.prepare("PRAGMA table_info(product_comments)").all() as Array<{
    name: string;
  }>;
  if (!commentColumns.some((column) => column.name === "body_translations")) {
    db.exec("ALTER TABLE product_comments ADD COLUMN body_translations TEXT NOT NULL DEFAULT '{}'");
  }

  const visitorColumns = db.prepare("PRAGMA table_info(site_daily_visitors)").all() as Array<{
    name: string;
  }>;
  if (!visitorColumns.some((column) => column.name === "visit_date")) {
    db.exec("ALTER TABLE site_daily_visitors ADD COLUMN visit_date TEXT NOT NULL DEFAULT ''");
  }
  if (!visitorColumns.some((column) => column.name === "visitor_key")) {
    db.exec("ALTER TABLE site_daily_visitors ADD COLUMN visitor_key TEXT NOT NULL DEFAULT ''");
  }
  if (!visitorColumns.some((column) => column.name === "ip")) {
    db.exec("ALTER TABLE site_daily_visitors ADD COLUMN ip TEXT NOT NULL DEFAULT ''");
  }
  if (!visitorColumns.some((column) => column.name === "user_agent")) {
    db.exec("ALTER TABLE site_daily_visitors ADD COLUMN user_agent TEXT NOT NULL DEFAULT ''");
  }
  if (!visitorColumns.some((column) => column.name === "entry_path")) {
    db.exec("ALTER TABLE site_daily_visitors ADD COLUMN entry_path TEXT NOT NULL DEFAULT '/'");
  }
  if (!visitorColumns.some((column) => column.name === "referrer")) {
    db.exec("ALTER TABLE site_daily_visitors ADD COLUMN referrer TEXT NOT NULL DEFAULT ''");
  }
  if (!visitorColumns.some((column) => column.name === "referrer_host")) {
    db.exec("ALTER TABLE site_daily_visitors ADD COLUMN referrer_host TEXT NOT NULL DEFAULT ''");
  }
  if (!visitorColumns.some((column) => column.name === "country")) {
    db.exec("ALTER TABLE site_daily_visitors ADD COLUMN country TEXT NOT NULL DEFAULT ''");
  }
  if (!visitorColumns.some((column) => column.name === "region")) {
    db.exec("ALTER TABLE site_daily_visitors ADD COLUMN region TEXT NOT NULL DEFAULT ''");
  }
  if (!visitorColumns.some((column) => column.name === "city")) {
    db.exec("ALTER TABLE site_daily_visitors ADD COLUMN city TEXT NOT NULL DEFAULT ''");
  }
  if (!visitorColumns.some((column) => column.name === "first_seen_at")) {
    db.exec(
      "ALTER TABLE site_daily_visitors ADD COLUMN first_seen_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)",
    );
  }
  if (!visitorColumns.some((column) => column.name === "last_seen_at")) {
    db.exec(
      "ALTER TABLE site_daily_visitors ADD COLUMN last_seen_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)",
    );
  }
  if (!visitorColumns.some((column) => column.name === "visits")) {
    db.exec("ALTER TABLE site_daily_visitors ADD COLUMN visits INTEGER NOT NULL DEFAULT 1");
  }

  const selfSignatureColumns = db
    .prepare("PRAGMA table_info(admin_visitor_self_signatures)")
    .all() as Array<{ name: string }>;
  if (!selfSignatureColumns.some((column) => column.name === "admin_email")) {
    db.exec(
      "ALTER TABLE admin_visitor_self_signatures ADD COLUMN admin_email TEXT NOT NULL DEFAULT ''",
    );
  }
  if (!selfSignatureColumns.some((column) => column.name === "signature_key")) {
    db.exec(
      "ALTER TABLE admin_visitor_self_signatures ADD COLUMN signature_key TEXT NOT NULL DEFAULT ''",
    );
  }
  if (!selfSignatureColumns.some((column) => column.name === "device_type")) {
    db.exec(
      "ALTER TABLE admin_visitor_self_signatures ADD COLUMN device_type TEXT NOT NULL DEFAULT ''",
    );
  }
  if (!selfSignatureColumns.some((column) => column.name === "device_model")) {
    db.exec(
      "ALTER TABLE admin_visitor_self_signatures ADD COLUMN device_model TEXT NOT NULL DEFAULT ''",
    );
  }
  if (!selfSignatureColumns.some((column) => column.name === "os_name")) {
    db.exec("ALTER TABLE admin_visitor_self_signatures ADD COLUMN os_name TEXT NOT NULL DEFAULT ''");
  }
  if (!selfSignatureColumns.some((column) => column.name === "os_version")) {
    db.exec(
      "ALTER TABLE admin_visitor_self_signatures ADD COLUMN os_version TEXT NOT NULL DEFAULT ''",
    );
  }
  if (!selfSignatureColumns.some((column) => column.name === "created_at")) {
    db.exec(
      "ALTER TABLE admin_visitor_self_signatures ADD COLUMN created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)",
    );
  }
  if (!selfSignatureColumns.some((column) => column.name === "last_seen_at")) {
    db.exec(
      "ALTER TABLE admin_visitor_self_signatures ADD COLUMN last_seen_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)",
    );
  }

  db.exec("CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_products_click_id ON products(click_count DESC, id DESC)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_users_city ON users(city)");
  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth0_sub_unique
    ON users(auth0_sub)
    WHERE auth0_sub IS NOT NULL AND auth0_sub <> ''
  `);
  db.exec(
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_site_daily_visitors_date_key ON site_daily_visitors(visit_date, visitor_key)",
  );
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_site_daily_visitors_date_last_seen ON site_daily_visitors(visit_date, last_seen_at DESC)",
  );
  db.exec(
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_self_signatures_unique ON admin_visitor_self_signatures(admin_email, signature_key)",
  );
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_admin_self_signatures_email_last_seen ON admin_visitor_self_signatures(admin_email, last_seen_at DESC)",
  );
  sqliteDb = db;
}

async function initializePostgresDatabase() {
  if (!pgPool) {
    return;
  }

  if (IS_DEV_REMOTE_READ_ONLY) {
    console.log(
      "Remote dev read-only mode: skipping PostgreSQL migrations and startup cleanup.",
    );
    return;
  }

  if (!RUN_DATABASE_MIGRATIONS) {
    console.log("PostgreSQL migrations disabled by RUN_DATABASE_MIGRATIONS.");
    return;
  }

  const migrationStatements = [
    `
      CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        username TEXT NOT NULL DEFAULT '',
        email TEXT NOT NULL UNIQUE,
        auth0_sub TEXT,
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        avatar_url TEXT NOT NULL DEFAULT '',
        country TEXT NOT NULL DEFAULT '',
        state TEXT NOT NULL DEFAULT '',
        city TEXT NOT NULL DEFAULT '',
        neighborhood TEXT NOT NULL DEFAULT '',
        street TEXT NOT NULL DEFAULT '',
        whatsapp_country_iso TEXT NOT NULL DEFAULT 'IT',
        whatsapp_number TEXT NOT NULL DEFAULT '',
        location_latitude DOUBLE PRECISION,
        location_longitude DOUBLE PRECISION,
        preferred_locale TEXT NOT NULL DEFAULT 'it-IT',
        is_banned BOOLEAN NOT NULL DEFAULT FALSE,
        ban_reason TEXT NOT NULL DEFAULT '',
        new_product_defaults TEXT NOT NULL DEFAULT '{}',
        created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT)
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS products (
        id BIGSERIAL PRIMARY KEY,
        slug TEXT,
        name TEXT NOT NULL,
        name_translations TEXT NOT NULL DEFAULT '{}',
        category TEXT NOT NULL,
        click_count INTEGER NOT NULL DEFAULT 0,
        price TEXT NOT NULL,
        price_negotiable BOOLEAN NOT NULL DEFAULT FALSE,
        quantity INTEGER NOT NULL DEFAULT 1,
        image TEXT NOT NULL,
        images TEXT NOT NULL DEFAULT '[]',
        description TEXT DEFAULT '',
        description_translations TEXT NOT NULL DEFAULT '{}',
        details TEXT NOT NULL DEFAULT '{}',
        user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS sessions (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at BIGINT NOT NULL,
        created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT)
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS product_likes (
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT),
        PRIMARY KEY (user_id, product_id)
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS product_cart_notifications (
        id BIGSERIAL PRIMARY KEY,
        owner_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        actor_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
        actor_name TEXT NOT NULL DEFAULT '',
        product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT)
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS product_comments (
        id BIGSERIAL PRIMARY KEY,
        product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        parent_comment_id BIGINT REFERENCES product_comments(id) ON DELETE CASCADE,
        rating INTEGER,
        body TEXT NOT NULL DEFAULT '',
        body_translations TEXT NOT NULL DEFAULT '{}',
        created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT),
        CONSTRAINT product_comments_rating_range
          CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5))
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS notification_dismissals (
        owner_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        event_id TEXT NOT NULL,
        dismissed_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT),
        PRIMARY KEY (owner_user_id, event_id)
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS admin_broadcast_notifications (
        id BIGSERIAL PRIMARY KEY,
        title TEXT NOT NULL DEFAULT '',
        message TEXT NOT NULL DEFAULT '',
        title_translations TEXT NOT NULL DEFAULT '{}',
        message_translations TEXT NOT NULL DEFAULT '{}',
        translation_status TEXT NOT NULL DEFAULT '{}',
        product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
        created_by TEXT NOT NULL DEFAULT '',
        created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT)
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS site_daily_visitors (
        id BIGSERIAL PRIMARY KEY,
        visit_date TEXT NOT NULL,
        visitor_key TEXT NOT NULL,
        ip TEXT NOT NULL DEFAULT '',
        user_agent TEXT NOT NULL DEFAULT '',
        entry_path TEXT NOT NULL DEFAULT '/',
        referrer TEXT NOT NULL DEFAULT '',
        referrer_host TEXT NOT NULL DEFAULT '',
        country TEXT NOT NULL DEFAULT '',
        region TEXT NOT NULL DEFAULT '',
        city TEXT NOT NULL DEFAULT '',
        first_seen_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT * 1000),
        last_seen_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT * 1000),
        visits INTEGER NOT NULL DEFAULT 1
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS admin_visitor_self_signatures (
        id BIGSERIAL PRIMARY KEY,
        admin_email TEXT NOT NULL,
        signature_key TEXT NOT NULL,
        device_type TEXT NOT NULL DEFAULT '',
        device_model TEXT NOT NULL DEFAULT '',
        os_name TEXT NOT NULL DEFAULT '',
        os_version TEXT NOT NULL DEFAULT '',
        created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT * 1000),
        last_seen_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT * 1000)
      )
    `,
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS auth0_sub TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_salt TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT FALSE",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_locale TEXT NOT NULL DEFAULT 'it-IT'",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS user_id BIGINT",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS name TEXT",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS title TEXT",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS name_translations TEXT NOT NULL DEFAULT '{}'",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS click_count INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS price TEXT",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS price_negotiable BOOLEAN NOT NULL DEFAULT FALSE",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS quantity INTEGER",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS image TEXT",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT DEFAULT '[]'",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS image_urls TEXT",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT DEFAULT ''",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS description_translations TEXT NOT NULL DEFAULT '{}'",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS details TEXT DEFAULT '{}'",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS slug TEXT",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()",
    "ALTER TABLE sessions ADD COLUMN IF NOT EXISTS user_id BIGINT",
    "ALTER TABLE sessions ADD COLUMN IF NOT EXISTS token_hash TEXT",
    "ALTER TABLE sessions ADD COLUMN IF NOT EXISTS expires_at BIGINT",
    "ALTER TABLE sessions ADD COLUMN IF NOT EXISTS created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT)",
    "ALTER TABLE product_likes ADD COLUMN IF NOT EXISTS user_id BIGINT",
    "ALTER TABLE product_likes ADD COLUMN IF NOT EXISTS product_id BIGINT",
    "ALTER TABLE product_likes ADD COLUMN IF NOT EXISTS created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT)",
    "ALTER TABLE product_cart_notifications ADD COLUMN IF NOT EXISTS owner_user_id BIGINT",
    "ALTER TABLE product_cart_notifications ADD COLUMN IF NOT EXISTS actor_user_id BIGINT",
    "ALTER TABLE product_cart_notifications ADD COLUMN IF NOT EXISTS actor_name TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE product_cart_notifications ADD COLUMN IF NOT EXISTS product_id BIGINT",
    "ALTER TABLE product_cart_notifications ADD COLUMN IF NOT EXISTS created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT)",
    "ALTER TABLE product_comments ADD COLUMN IF NOT EXISTS product_id BIGINT",
    "ALTER TABLE product_comments ADD COLUMN IF NOT EXISTS user_id BIGINT",
    "ALTER TABLE product_comments ADD COLUMN IF NOT EXISTS parent_comment_id BIGINT",
    "ALTER TABLE product_comments ADD COLUMN IF NOT EXISTS rating INTEGER",
    "ALTER TABLE product_comments ADD COLUMN IF NOT EXISTS body TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE product_comments ADD COLUMN IF NOT EXISTS body_translations TEXT NOT NULL DEFAULT '{}'",
    "ALTER TABLE product_comments ADD COLUMN IF NOT EXISTS created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT)",
    "ALTER TABLE notification_dismissals ADD COLUMN IF NOT EXISTS owner_user_id BIGINT",
    "ALTER TABLE notification_dismissals ADD COLUMN IF NOT EXISTS event_id TEXT",
    "ALTER TABLE notification_dismissals ADD COLUMN IF NOT EXISTS dismissed_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT)",
    "ALTER TABLE admin_broadcast_notifications ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE admin_broadcast_notifications ADD COLUMN IF NOT EXISTS message TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE admin_broadcast_notifications ADD COLUMN IF NOT EXISTS title_translations TEXT NOT NULL DEFAULT '{}'",
    "ALTER TABLE admin_broadcast_notifications ADD COLUMN IF NOT EXISTS message_translations TEXT NOT NULL DEFAULT '{}'",
    "ALTER TABLE admin_broadcast_notifications ADD COLUMN IF NOT EXISTS translation_status TEXT NOT NULL DEFAULT '{}'",
    "ALTER TABLE admin_broadcast_notifications ADD COLUMN IF NOT EXISTS product_id BIGINT",
    "ALTER TABLE admin_broadcast_notifications ADD COLUMN IF NOT EXISTS created_by TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE admin_broadcast_notifications ADD COLUMN IF NOT EXISTS created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS state TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS neighborhood TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS street TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_country_iso TEXT NOT NULL DEFAULT 'IT'",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_number TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS location_latitude DOUBLE PRECISION",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS location_longitude DOUBLE PRECISION",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS new_product_defaults TEXT NOT NULL DEFAULT '{}'",
    "ALTER TABLE site_daily_visitors ADD COLUMN IF NOT EXISTS visit_date TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE site_daily_visitors ADD COLUMN IF NOT EXISTS visitor_key TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE site_daily_visitors ADD COLUMN IF NOT EXISTS ip TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE site_daily_visitors ADD COLUMN IF NOT EXISTS user_agent TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE site_daily_visitors ADD COLUMN IF NOT EXISTS entry_path TEXT NOT NULL DEFAULT '/'",
    "ALTER TABLE site_daily_visitors ADD COLUMN IF NOT EXISTS referrer TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE site_daily_visitors ADD COLUMN IF NOT EXISTS referrer_host TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE site_daily_visitors ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE site_daily_visitors ADD COLUMN IF NOT EXISTS region TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE site_daily_visitors ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE site_daily_visitors ADD COLUMN IF NOT EXISTS first_seen_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT * 1000)",
    "ALTER TABLE site_daily_visitors ADD COLUMN IF NOT EXISTS last_seen_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT * 1000)",
    "ALTER TABLE site_daily_visitors ADD COLUMN IF NOT EXISTS visits INTEGER NOT NULL DEFAULT 1",
    "ALTER TABLE admin_visitor_self_signatures ADD COLUMN IF NOT EXISTS admin_email TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE admin_visitor_self_signatures ADD COLUMN IF NOT EXISTS signature_key TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE admin_visitor_self_signatures ADD COLUMN IF NOT EXISTS device_type TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE admin_visitor_self_signatures ADD COLUMN IF NOT EXISTS device_model TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE admin_visitor_self_signatures ADD COLUMN IF NOT EXISTS os_name TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE admin_visitor_self_signatures ADD COLUMN IF NOT EXISTS os_version TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE admin_visitor_self_signatures ADD COLUMN IF NOT EXISTS created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT * 1000)",
    "ALTER TABLE admin_visitor_self_signatures ADD COLUMN IF NOT EXISTS last_seen_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT * 1000)",
    "UPDATE products SET title = COALESCE(NULLIF(BTRIM(title), ''), NULLIF(BTRIM(name), ''), 'Produto sem título') WHERE title IS NULL OR BTRIM(title) = ''",
    "UPDATE products SET image_url = COALESCE(NULLIF(BTRIM(image_url), ''), NULLIF(BTRIM(image), ''), '') WHERE image_url IS NULL OR BTRIM(image_url) = ''",
    "UPDATE products SET image_urls = COALESCE(NULLIF(BTRIM(image_urls), ''), images, '[]') WHERE image_urls IS NULL OR BTRIM(image_urls) = ''",
    `
      UPDATE products
      SET price_negotiable = TRUE, price = '0'
      WHERE
        COALESCE(price_negotiable, FALSE) = FALSE
        AND LOWER(BTRIM(COALESCE(price::text, ''))) IN (
          'negotiable',
          'a negociar',
          'da negoziare',
          'preco negociavel',
          'preço negociável',
          'prezzo negoziabile',
          'price negotiable'
        )
    `,
    "UPDATE products SET quantity = 1 WHERE quantity IS NULL OR quantity < 0",
    "UPDATE products SET click_count = 0 WHERE click_count IS NULL OR click_count < 0",
    "UPDATE products SET lat = COALESCE(lat, latitude) WHERE lat IS NULL",
    "UPDATE products SET lng = COALESCE(lng, longitude) WHERE lng IS NULL",
    "ALTER TABLE products ALTER COLUMN quantity SET DEFAULT 1",
    "ALTER TABLE products ALTER COLUMN quantity SET NOT NULL",
    "ALTER TABLE products ALTER COLUMN title SET DEFAULT ''",
    "ALTER TABLE products ALTER COLUMN title SET NOT NULL",
    "UPDATE users SET password = COALESCE(NULLIF(BTRIM(password), ''), password_hash, '') WHERE password IS NULL OR BTRIM(password) = ''",
    "ALTER TABLE users ALTER COLUMN password SET DEFAULT ''",
    "ALTER TABLE users ALTER COLUMN password SET NOT NULL",
    "UPDATE users SET username = COALESCE(NULLIF(BTRIM(username), ''), NULLIF(BTRIM(email), ''), CONCAT('user_', id::text)) WHERE username IS NULL OR BTRIM(username) = ''",
    "ALTER TABLE users ALTER COLUMN username SET DEFAULT ''",
    "ALTER TABLE users ALTER COLUMN username SET NOT NULL",
    "CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash)",
    "CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_product_likes_product_id ON product_likes(product_id)",
    "CREATE INDEX IF NOT EXISTS idx_product_cart_notifications_owner_created ON product_cart_notifications(owner_user_id, created_at DESC)",
    "CREATE INDEX IF NOT EXISTS idx_product_cart_notifications_product_id ON product_cart_notifications(product_id)",
    "CREATE INDEX IF NOT EXISTS idx_product_comments_product_created ON product_comments(product_id, created_at DESC)",
    "CREATE INDEX IF NOT EXISTS idx_product_comments_parent ON product_comments(parent_comment_id)",
    "CREATE INDEX IF NOT EXISTS idx_notification_dismissals_owner ON notification_dismissals(owner_user_id)",
    "CREATE INDEX IF NOT EXISTS idx_admin_broadcast_notifications_created ON admin_broadcast_notifications(created_at DESC)",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email)",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth0_sub_unique ON users(auth0_sub) WHERE auth0_sub IS NOT NULL AND auth0_sub <> ''",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_product_likes_user_product_unique ON product_likes(user_id, product_id)",
    "CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)",
    "CREATE INDEX IF NOT EXISTS idx_products_click_id ON products(click_count DESC, id DESC)",
    "CREATE INDEX IF NOT EXISTS idx_users_city ON users(city)",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_site_daily_visitors_date_key ON site_daily_visitors(visit_date, visitor_key)",
    "CREATE INDEX IF NOT EXISTS idx_site_daily_visitors_date_last_seen ON site_daily_visitors(visit_date, last_seen_at DESC)",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_self_signatures_unique ON admin_visitor_self_signatures(admin_email, signature_key)",
    "CREATE INDEX IF NOT EXISTS idx_admin_self_signatures_email_last_seen ON admin_visitor_self_signatures(admin_email, last_seen_at DESC)",
  ];

  for (const statement of migrationStatements) {
    await pgPool.query(statement);
  }

  if (CLEAN_LOCAL_PRODUCTS_ON_BOOT) {
    const cleanupResult = await pgPool.query(
      `
        DELETE FROM products
        WHERE
          COALESCE(NULLIF(BTRIM(name), ''), '') = ''
          OR image LIKE 'https://picsum.photos/%'
          OR images LIKE '%picsum.photos/%'
      `,
    );
    const deleted = cleanupResult.rowCount ?? 0;
    if (deleted > 0) {
      console.log(`Cleanup: removed ${deleted} local/placeholder products from PostgreSQL.`);
    }
  }
}

async function initializeDatabase() {
  await initializePostgresDatabase();
  if (!RUN_DATABASE_MIGRATIONS) {
    return;
  }
  if (IS_DEV_REMOTE_READ_ONLY) {
    return;
  }
  try {
    await backfillMissingProductSlugs();
  } catch (error) {
    console.error("Failed to backfill product slugs:", error);
  }
}

async function selectProductsForSlugBackfillRows(): Promise<Array<{
  id: number;
  name: string;
  slug: string | null;
}>> {
  if (pgPool) {
    const result = await pgPool.query<Record<string, unknown>>(
      `
        SELECT
          p.id,
          COALESCE(
            NULLIF(BTRIM(COALESCE(p.name, '')), ''),
            NULLIF(BTRIM(COALESCE(p.title, '')), ''),
            '${PRODUCT_SLUG_FALLBACK_BASE}'
          ) AS name,
          NULLIF(BTRIM(COALESCE(p.slug, '')), '') AS slug
        FROM products p
      `,
    );
    return result.rows.map((row) => ({
      id: toRequiredNumber(row.id),
      name: String(row.name ?? PRODUCT_SLUG_FALLBACK_BASE),
      slug: toNullableString(row.slug),
    }));
  }

  const rows = requireSqliteDb()
    .prepare(
      `
        SELECT
          p.id,
          COALESCE(
            NULLIF(TRIM(COALESCE(p.name, '')), ''),
            NULLIF(TRIM(COALESCE(p.title, '')), ''),
            '${PRODUCT_SLUG_FALLBACK_BASE}'
          ) AS name,
          NULLIF(TRIM(COALESCE(p.slug, '')), '') AS slug
        FROM products p
      `,
    )
    .all() as Array<Record<string, unknown>>;

  return rows.map((row) => ({
    id: toRequiredNumber(row.id),
    name: String(row.name ?? PRODUCT_SLUG_FALLBACK_BASE),
    slug: toNullableString(row.slug),
  }));
}

async function selectProductSlugByIdRecord(productId: number): Promise<string | null> {
  if (pgPool) {
    const result = await pgPool.query<Record<string, unknown>>(
      `
        SELECT NULLIF(BTRIM(COALESCE(slug, '')), '') AS slug
        FROM products
        WHERE id = $1
      `,
      [productId],
    );
    return toNullableString(result.rows[0]?.slug);
  }

  const row = requireSqliteDb()
    .prepare(
      `
        SELECT NULLIF(TRIM(COALESCE(slug, '')), '') AS slug
        FROM products
        WHERE id = ?
      `,
    )
    .get(productId) as Record<string, unknown> | undefined;

  return toNullableString(row?.slug);
}

async function updateProductSlugRecord(productId: number, slug: string): Promise<void> {
  if (pgPool) {
    await pgPool.query(
      `
        UPDATE products
        SET slug = $1
        WHERE id = $2
      `,
      [slug, productId],
    );
    return;
  }

  requireSqliteDb()
    .prepare(
      `
        UPDATE products
        SET slug = @slug
        WHERE id = @id
      `,
    )
    .run({
      id: productId,
      slug,
    });
}

async function ensureProductSlugRecord(
  productId: number,
  productName: string,
  knownSlug?: string | null,
): Promise<string> {
  const existingSlug =
    knownSlug !== undefined
      ? toNullableString(knownSlug)
      : await selectProductSlugByIdRecord(productId);
  if (existingSlug && existingSlug.trim()) {
    return existingSlug.trim();
  }

  const nextSlug = buildProductSlug(productName, productId);
  await updateProductSlugRecord(productId, nextSlug);
  return nextSlug;
}

async function backfillMissingProductSlugs(): Promise<void> {
  const rows = await selectProductsForSlugBackfillRows();
  for (const row of rows) {
    try {
      await ensureProductSlugRecord(row.id, row.name, row.slug);
    } catch (error) {
      console.error("Failed to ensure slug for product:", {
        productId: row.id,
        error,
      });
    }
  }
}

async function selectAllProductsRows(): Promise<ProductRow[]> {
  if (pgPool) {
    const result = await pgPool.query<Record<string, unknown>>(
      `
        SELECT ${PRODUCT_SELECT_FIELDS}
        FROM products p
        LEFT JOIN users u ON u.id = p.user_id
        ORDER BY p.id DESC
      `,
    );
    return result.rows.map(normalizeProductRow);
  }

  const rows = requireSqliteDb()
    .prepare(
      `
        SELECT ${PRODUCT_SELECT_FIELDS}
        FROM products p
        LEFT JOIN users u ON u.id = p.user_id
        ORDER BY p.id DESC
      `,
    )
    .all() as Array<Record<string, unknown>>;
  return rows.map(normalizeProductRow);
}

type ProductPageQuery = {
  search: string;
  category: string;
  maxPrice: number | null;
  limit: number;
  offset: number;
};

function normalizeProductPageLimit(value: unknown, fallback = 36): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(Math.max(Math.floor(parsed), 1), 100);
}

function normalizeProductPageOffset(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.max(Math.floor(parsed), 0);
}

function normalizeProductPageMaxPrice(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

async function selectProductsPageRows(query: ProductPageQuery): Promise<{
  rows: ProductRow[];
  hasMore: boolean;
}> {
  const limitPlusOne = query.limit + 1;

  if (pgPool) {
    const whereParts: string[] = [];
    const values: unknown[] = [];
    const addValue = (value: unknown) => {
      values.push(value);
      return `$${values.length}`;
    };

    if (query.search) {
      const searchParam = addValue(`%${query.search}%`);
      whereParts.push(`
        (
          COALESCE(p.name, '') ILIKE ${searchParam}
          OR COALESCE(p.title, '') ILIKE ${searchParam}
          OR COALESCE(p.category, '') ILIKE ${searchParam}
          OR COALESCE(p.description, '') ILIKE ${searchParam}
          OR COALESCE(u.name, '') ILIKE ${searchParam}
          OR COALESCE(u.email, '') ILIKE ${searchParam}
          OR COALESCE(u.whatsapp_number, '') ILIKE ${searchParam}
          OR COALESCE(u.city, '') ILIKE ${searchParam}
        )
      `);
    }

    if (query.category && query.category !== "All") {
      whereParts.push(`p.category = ${addValue(query.category)}`);
    }

    if (query.maxPrice !== null) {
      whereParts.push(`
        COALESCE(p.price_negotiable, FALSE) = FALSE
        AND CASE
          WHEN COALESCE(p.price, '') ~ '^[0-9]+(\\.[0-9]+)?$' THEN p.price::numeric
          ELSE NULL
        END <= ${addValue(query.maxPrice)}
      `);
    }

    const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";
    const result = await pgPool.query<Record<string, unknown>>(
      `
        SELECT ${PRODUCT_SELECT_FIELDS}
        FROM products p
        LEFT JOIN users u ON u.id = p.user_id
        ${whereClause}
        ORDER BY COALESCE(p.click_count, 0) DESC, p.id DESC
        LIMIT ${addValue(limitPlusOne)}
        OFFSET ${addValue(query.offset)}
      `,
      values,
    );
    const rows = result.rows.map(normalizeProductRow);
    return {
      rows: rows.slice(0, query.limit),
      hasMore: rows.length > query.limit,
    };
  }

  const whereParts: string[] = [];
  const values: unknown[] = [];

  if (query.search) {
    const searchParam = `%${query.search.toLowerCase()}%`;
    whereParts.push(`
      (
        LOWER(COALESCE(p.name, '')) LIKE ?
        OR LOWER(COALESCE(p.title, '')) LIKE ?
        OR LOWER(COALESCE(p.category, '')) LIKE ?
        OR LOWER(COALESCE(p.description, '')) LIKE ?
        OR LOWER(COALESCE(u.name, '')) LIKE ?
        OR LOWER(COALESCE(u.email, '')) LIKE ?
        OR LOWER(COALESCE(u.whatsapp_number, '')) LIKE ?
        OR LOWER(COALESCE(u.city, '')) LIKE ?
      )
    `);
    values.push(
      searchParam,
      searchParam,
      searchParam,
      searchParam,
      searchParam,
      searchParam,
      searchParam,
      searchParam,
    );
  }

  if (query.category && query.category !== "All") {
    whereParts.push("p.category = ?");
    values.push(query.category);
  }

  if (query.maxPrice !== null) {
    whereParts.push("COALESCE(p.price_negotiable, 0) = 0 AND CAST(COALESCE(p.price, '0') AS REAL) <= ?");
    values.push(query.maxPrice);
  }

  values.push(limitPlusOne, query.offset);
  const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";
  const rows = requireSqliteDb()
    .prepare(
      `
        SELECT ${PRODUCT_SELECT_FIELDS}
        FROM products p
        LEFT JOIN users u ON u.id = p.user_id
        ${whereClause}
        ORDER BY COALESCE(p.click_count, 0) DESC, p.id DESC
        LIMIT ?
        OFFSET ?
      `,
    )
    .all(...values) as Array<Record<string, unknown>>;
  const normalizedRows = rows.map(normalizeProductRow);
  return {
    rows: normalizedRows.slice(0, query.limit),
    hasMore: normalizedRows.length > query.limit,
  };
}

async function selectProductsByOwnerRows(ownerId: number): Promise<ProductRow[]> {
  if (pgPool) {
    const result = await pgPool.query<Record<string, unknown>>(
      `
        SELECT ${PRODUCT_SELECT_FIELDS}
        FROM products p
        LEFT JOIN users u ON u.id = p.user_id
        WHERE p.user_id = $1
        ORDER BY p.id DESC
      `,
      [ownerId],
    );
    return result.rows.map(normalizeProductRow);
  }

  const rows = requireSqliteDb()
    .prepare(
      `
        SELECT ${PRODUCT_SELECT_FIELDS}
        FROM products p
        LEFT JOIN users u ON u.id = p.user_id
        WHERE p.user_id = ?
        ORDER BY p.id DESC
      `,
    )
    .all(ownerId) as Array<Record<string, unknown>>;
  return rows.map(normalizeProductRow);
}

async function selectAdminUsersRows(): Promise<AdminUserRecord[]> {
  if (pgPool) {
    const result = await pgPool.query<Record<string, unknown>>(
      `
        SELECT
          u.id,
          COALESCE(NULLIF(BTRIM(u.name), ''), NULLIF(BTRIM(u.username), ''), u.email) AS name,
          NULLIF(BTRIM(u.username), '') AS username,
          u.email,
          NULLIF(BTRIM(u.whatsapp_number), '') AS phone,
          NULLIF(BTRIM(u.country), '') AS country,
          NULLIF(BTRIM(u.state), '') AS state,
          NULLIF(BTRIM(u.city), '') AS city,
          NULLIF(BTRIM(u.neighborhood), '') AS neighborhood,
          NULLIF(BTRIM(u.street), '') AS street,
          NULLIF(BTRIM(u.whatsapp_country_iso), '') AS whatsapp_country_iso,
          u.location_latitude,
          u.location_longitude,
          COALESCE(u.is_banned, FALSE) AS is_banned,
          NULLIF(BTRIM(COALESCE(u.ban_reason, '')), '') AS ban_reason,
          u.created_at,
          COUNT(p.id)::INT AS product_count
        FROM users u
        LEFT JOIN products p ON p.user_id = u.id
        GROUP BY
          u.id,
          u.name,
          u.username,
          u.email,
          u.whatsapp_number,
          u.country,
          u.state,
          u.city,
          u.neighborhood,
          u.street,
          u.whatsapp_country_iso,
          u.location_latitude,
          u.location_longitude,
          u.is_banned,
          u.ban_reason,
          u.created_at
        ORDER BY u.id DESC
      `,
    );
    return result.rows.map(normalizeAdminUserRecord);
  }

  const rows = requireSqliteDb()
    .prepare(
      `
        SELECT
          u.id,
          u.name,
          u.email,
          u.whatsapp_number AS phone,
          u.country,
          u.state,
          u.city,
          u.neighborhood,
          u.street,
          u.whatsapp_country_iso,
          u.location_latitude,
          u.location_longitude,
          COALESCE(u.is_banned, 0) AS is_banned,
          NULLIF(TRIM(COALESCE(u.ban_reason, '')), '') AS ban_reason,
          u.created_at,
          COUNT(p.id) AS product_count
        FROM users u
        LEFT JOIN products p ON p.user_id = u.id
        GROUP BY
          u.id,
          u.name,
          u.email,
          u.whatsapp_number,
          u.country,
          u.state,
          u.city,
          u.neighborhood,
          u.street,
          u.whatsapp_country_iso,
          u.location_latitude,
          u.location_longitude,
          u.is_banned,
          u.ban_reason,
          u.created_at
        ORDER BY u.id DESC
      `,
    )
    .all() as Array<Record<string, unknown>>;
  return rows.map(normalizeAdminUserRecord);
}

async function upsertDailyVisitorRecord(input: DailyVisitorUpsertInput): Promise<void> {
  if (IS_DEV_REMOTE_READ_ONLY) {
    return;
  }
  const initialVisits = input.countAsVisit ? 1 : 0;
  const countAsVisitFlag = input.countAsVisit ? 1 : 0;

  if (pgPool) {
    await pgPool.query(
      `
        INSERT INTO site_daily_visitors (
          visit_date,
          visitor_key,
          ip,
          user_agent,
          entry_path,
          referrer,
          referrer_host,
          country,
          region,
          city,
          first_seen_at,
          last_seen_at,
          visits
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11, $12
        )
        ON CONFLICT (visit_date, visitor_key)
        DO UPDATE SET
          last_seen_at = EXCLUDED.last_seen_at,
          visits = CASE
            WHEN $13 = 1
              AND site_daily_visitors.last_seen_at <=
                (EXCLUDED.last_seen_at - $14)
            THEN site_daily_visitors.visits + 1
            ELSE site_daily_visitors.visits
          END,
          ip = CASE WHEN EXCLUDED.ip <> '' THEN EXCLUDED.ip ELSE site_daily_visitors.ip END,
          user_agent = CASE
            WHEN EXCLUDED.user_agent <> '' THEN EXCLUDED.user_agent
            ELSE site_daily_visitors.user_agent
          END,
          entry_path = CASE
            WHEN EXCLUDED.entry_path <> '' THEN EXCLUDED.entry_path
            ELSE site_daily_visitors.entry_path
          END,
          referrer = CASE
            WHEN EXCLUDED.referrer <> '' THEN EXCLUDED.referrer
            ELSE site_daily_visitors.referrer
          END,
          referrer_host = CASE
            WHEN EXCLUDED.referrer_host <> '' THEN EXCLUDED.referrer_host
            ELSE site_daily_visitors.referrer_host
          END,
          country = CASE
            WHEN EXCLUDED.country <> '' THEN EXCLUDED.country
            ELSE site_daily_visitors.country
          END,
          region = CASE
            WHEN EXCLUDED.region <> '' THEN EXCLUDED.region
            ELSE site_daily_visitors.region
          END,
          city = CASE
            WHEN EXCLUDED.city <> '' THEN EXCLUDED.city
            ELSE site_daily_visitors.city
          END
      `,
      [
        input.visitDate,
        input.visitorKey,
        input.ip,
        input.userAgent,
        input.entryPath,
        input.referrer,
        input.referrerHost,
        input.country,
        input.region,
        input.city,
        input.seenAt,
        initialVisits,
        countAsVisitFlag,
        VISITOR_VISIT_INCREMENT_MIN_INTERVAL_MS,
      ],
    );
    return;
  }

  requireSqliteDb()
    .prepare(
      `
        INSERT INTO site_daily_visitors (
          visit_date,
          visitor_key,
          ip,
          user_agent,
          entry_path,
          referrer,
          referrer_host,
          country,
          region,
          city,
          first_seen_at,
          last_seen_at,
          visits
        )
        VALUES (
          @visit_date,
          @visitor_key,
          @ip,
          @user_agent,
          @entry_path,
          @referrer,
          @referrer_host,
          @country,
          @region,
          @city,
          @seen_at,
          @seen_at,
          @initial_visits
        )
        ON CONFLICT(visit_date, visitor_key)
        DO UPDATE SET
          last_seen_at = excluded.last_seen_at,
          visits = CASE
            WHEN @count_as_visit = 1
              AND site_daily_visitors.last_seen_at <=
                (excluded.last_seen_at - @increment_min_interval_ms)
            THEN site_daily_visitors.visits + 1
            ELSE site_daily_visitors.visits
          END,
          ip = CASE WHEN excluded.ip <> '' THEN excluded.ip ELSE site_daily_visitors.ip END,
          user_agent = CASE
            WHEN excluded.user_agent <> '' THEN excluded.user_agent
            ELSE site_daily_visitors.user_agent
          END,
          entry_path = CASE
            WHEN excluded.entry_path <> '' THEN excluded.entry_path
            ELSE site_daily_visitors.entry_path
          END,
          referrer = CASE
            WHEN excluded.referrer <> '' THEN excluded.referrer
            ELSE site_daily_visitors.referrer
          END,
          referrer_host = CASE
            WHEN excluded.referrer_host <> '' THEN excluded.referrer_host
            ELSE site_daily_visitors.referrer_host
          END,
          country = CASE
            WHEN excluded.country <> '' THEN excluded.country
            ELSE site_daily_visitors.country
          END,
          region = CASE
            WHEN excluded.region <> '' THEN excluded.region
            ELSE site_daily_visitors.region
          END,
          city = CASE
            WHEN excluded.city <> '' THEN excluded.city
            ELSE site_daily_visitors.city
          END
      `,
    )
    .run({
      visit_date: input.visitDate,
      visitor_key: input.visitorKey,
      ip: input.ip,
      user_agent: input.userAgent,
      entry_path: input.entryPath,
      referrer: input.referrer,
      referrer_host: input.referrerHost,
      country: input.country,
      region: input.region,
      city: input.city,
      seen_at: input.seenAt,
      initial_visits: initialVisits,
      count_as_visit: countAsVisitFlag,
      increment_min_interval_ms: VISITOR_VISIT_INCREMENT_MIN_INTERVAL_MS,
    });
}

async function selectDailyVisitorsByDateRows(
  visitDate: string,
  limit = VISITOR_DAY_FETCH_LIMIT,
): Promise<DailyVisitorRow[]> {
  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), VISITOR_DAY_FETCH_LIMIT);

  if (pgPool) {
    const result = await pgPool.query<Record<string, unknown>>(
      `
        SELECT
          id,
          visit_date,
          visitor_key,
          ip,
          user_agent,
          entry_path,
          referrer,
          referrer_host,
          country,
          region,
          city,
          first_seen_at,
          last_seen_at,
          visits
        FROM site_daily_visitors
        WHERE visit_date = $1
        ORDER BY last_seen_at DESC, id DESC
        LIMIT $2
      `,
      [visitDate, safeLimit],
    );
    return result.rows.map(normalizeDailyVisitorRow);
  }

  const rows = requireSqliteDb()
    .prepare(
      `
        SELECT
          id,
          visit_date,
          visitor_key,
          ip,
          user_agent,
          entry_path,
          referrer,
          referrer_host,
          country,
          region,
          city,
          first_seen_at,
          last_seen_at,
          visits
        FROM site_daily_visitors
        WHERE visit_date = ?
        ORDER BY last_seen_at DESC, id DESC
        LIMIT ?
      `,
    )
    .all(visitDate, safeLimit) as Array<Record<string, unknown>>;
  return rows.map(normalizeDailyVisitorRow);
}

async function upsertAdminSelfDeviceSignature(
  adminEmail: string,
  profile: VisitorDeviceProfile,
): Promise<void> {
  const normalizedEmail = String(adminEmail ?? "").trim().toLowerCase();
  if (!normalizedEmail) {
    return;
  }

  const signatureKey = buildVisitorDeviceProfileSignatureKey(profile);
  if (!signatureKey) {
    return;
  }

  const normalizedDeviceType = normalizeVisitorTrackingText(profile.deviceType, 30);
  const normalizedDeviceModel = normalizeVisitorTrackingText(profile.deviceModel, 80);
  const normalizedOsName = normalizeVisitorTrackingText(profile.osName, 40);
  const normalizedOsVersion = normalizeVisitorTrackingText(profile.osVersion, 24);
  const seenAt = Date.now();

  if (pgPool) {
    await pgPool.query(
      `
        INSERT INTO admin_visitor_self_signatures (
          admin_email,
          signature_key,
          device_type,
          device_model,
          os_name,
          os_version,
          created_at,
          last_seen_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
        ON CONFLICT (admin_email, signature_key)
        DO UPDATE SET
          device_type = EXCLUDED.device_type,
          device_model = EXCLUDED.device_model,
          os_name = EXCLUDED.os_name,
          os_version = EXCLUDED.os_version,
          last_seen_at = EXCLUDED.last_seen_at
      `,
      [
        normalizedEmail,
        signatureKey,
        normalizedDeviceType,
        normalizedDeviceModel,
        normalizedOsName,
        normalizedOsVersion,
        seenAt,
      ],
    );
    return;
  }

  requireSqliteDb()
    .prepare(
      `
        INSERT INTO admin_visitor_self_signatures (
          admin_email,
          signature_key,
          device_type,
          device_model,
          os_name,
          os_version,
          created_at,
          last_seen_at
        )
        VALUES (
          @admin_email,
          @signature_key,
          @device_type,
          @device_model,
          @os_name,
          @os_version,
          @seen_at,
          @seen_at
        )
        ON CONFLICT(admin_email, signature_key)
        DO UPDATE SET
          device_type = excluded.device_type,
          device_model = excluded.device_model,
          os_name = excluded.os_name,
          os_version = excluded.os_version,
          last_seen_at = excluded.last_seen_at
      `,
    )
    .run({
      admin_email: normalizedEmail,
      signature_key: signatureKey,
      device_type: normalizedDeviceType,
      device_model: normalizedDeviceModel,
      os_name: normalizedOsName,
      os_version: normalizedOsVersion,
      seen_at: seenAt,
    });
}

async function selectAdminSelfDeviceSignatureKeys(adminEmail: string): Promise<Set<string>> {
  const normalizedEmail = String(adminEmail ?? "").trim().toLowerCase();
  if (!normalizedEmail) {
    return new Set<string>();
  }

  let rows: Array<Record<string, unknown>> = [];
  if (pgPool) {
    const result = await pgPool.query<Record<string, unknown>>(
      `
        SELECT
          signature_key
        FROM admin_visitor_self_signatures
        WHERE admin_email = $1
        ORDER BY last_seen_at DESC, id DESC
        LIMIT $2
      `,
      [normalizedEmail, ADMIN_SELF_DEVICE_SIGNATURES_FETCH_LIMIT],
    );
    rows = result.rows;
  } else {
    rows = requireSqliteDb()
      .prepare(
        `
          SELECT
            signature_key
          FROM admin_visitor_self_signatures
          WHERE admin_email = ?
          ORDER BY last_seen_at DESC, id DESC
          LIMIT ?
        `,
      )
      .all(normalizedEmail, ADMIN_SELF_DEVICE_SIGNATURES_FETCH_LIMIT) as Array<
      Record<string, unknown>
    >;
  }

  const signatures = new Set<string>();
  for (const row of rows) {
    const signature = normalizeVisitorTrackingText(row.signature_key ?? "", 200).toLowerCase();
    if (!signature) {
      continue;
    }
    signatures.add(signature);
  }
  return signatures;
}

async function selectProductByIdRow(productId: number): Promise<ProductRow | undefined> {
  if (pgPool) {
    const result = await pgPool.query<Record<string, unknown>>(
      `
        SELECT ${PRODUCT_SELECT_FIELDS}
        FROM products p
        LEFT JOIN users u ON u.id = p.user_id
        WHERE p.id = $1
      `,
      [productId],
    );
    const row = result.rows[0];
    return row ? normalizeProductRow(row) : undefined;
  }

  const row = requireSqliteDb()
    .prepare(
      `
        SELECT ${PRODUCT_SELECT_FIELDS}
        FROM products p
        LEFT JOIN users u ON u.id = p.user_id
        WHERE p.id = ?
      `,
    )
    .get(productId) as Record<string, unknown> | undefined;
  return row ? normalizeProductRow(row) : undefined;
}

async function incrementProductClickCountRecord(productId: number): Promise<number | undefined> {
  if (pgPool) {
    const result = await pgPool.query<Record<string, unknown>>(
      `
        UPDATE products
        SET click_count = COALESCE(click_count, 0) + 1
        WHERE id = $1
        RETURNING COALESCE(click_count, 0) AS click_count
      `,
      [productId],
    );
    const row = result.rows[0];
    if (!row) {
      return undefined;
    }
    return toRequiredNonNegativeInteger(row.click_count, 0);
  }

  const db = requireSqliteDb();
  const updateResult = db
    .prepare(
      `
        UPDATE products
        SET click_count = COALESCE(click_count, 0) + 1
        WHERE id = ?
      `,
    )
    .run(productId);
  if (updateResult.changes === 0) {
    return undefined;
  }

  const row = db
    .prepare(
      `
        SELECT COALESCE(click_count, 0) AS click_count
        FROM products
        WHERE id = ?
      `,
    )
    .get(productId) as Record<string, unknown> | undefined;
  return toRequiredNonNegativeInteger(row?.click_count, 0);
}

async function selectProductCommentByIdRow(commentId: number): Promise<ProductCommentRow | undefined> {
  if (pgPool) {
    const result = await pgPool.query<Record<string, unknown>>(
      `
        SELECT
          c.id,
          c.product_id,
          c.user_id,
          c.parent_comment_id,
          c.rating,
          c.body,
          COALESCE(c.body_translations, '{}') AS body_translations,
          c.created_at,
          COALESCE(
            NULLIF(BTRIM(u.name), ''),
            NULLIF(BTRIM(u.username), ''),
            NULLIF(BTRIM(u.email), ''),
            CONCAT('Usuário ', c.user_id::text)
          ) AS author_name,
          NULLIF(BTRIM(u.avatar_url), '') AS author_avatar_url
        FROM product_comments c
        INNER JOIN users u ON u.id = c.user_id
        WHERE c.id = $1
      `,
      [commentId],
    );
    const row = result.rows[0];
    return row ? normalizeProductCommentRow(row) : undefined;
  }

  const row = requireSqliteDb()
    .prepare(
      `
        SELECT
          c.id,
          c.product_id,
          c.user_id,
          c.parent_comment_id,
          c.rating,
          c.body,
          COALESCE(c.body_translations, '{}') AS body_translations,
          c.created_at,
          COALESCE(NULLIF(TRIM(u.name), ''), NULLIF(TRIM(u.email), ''), 'Usuário') AS author_name,
          NULLIF(TRIM(u.avatar_url), '') AS author_avatar_url
        FROM product_comments c
        INNER JOIN users u ON u.id = c.user_id
        WHERE c.id = ?
      `,
    )
    .get(commentId) as Record<string, unknown> | undefined;
  return row ? normalizeProductCommentRow(row) : undefined;
}

async function selectProductCommentsRows(productId: number): Promise<ProductCommentRow[]> {
  if (pgPool) {
    const result = await pgPool.query<Record<string, unknown>>(
      `
        SELECT
          c.id,
          c.product_id,
          c.user_id,
          c.parent_comment_id,
          c.rating,
          c.body,
          COALESCE(c.body_translations, '{}') AS body_translations,
          c.created_at,
          COALESCE(
            NULLIF(BTRIM(u.name), ''),
            NULLIF(BTRIM(u.username), ''),
            NULLIF(BTRIM(u.email), ''),
            CONCAT('Usuário ', c.user_id::text)
          ) AS author_name,
          NULLIF(BTRIM(u.avatar_url), '') AS author_avatar_url
        FROM product_comments c
        INNER JOIN users u ON u.id = c.user_id
        WHERE c.product_id = $1
        ORDER BY c.created_at DESC, c.id DESC
      `,
      [productId],
    );
    return result.rows.map(normalizeProductCommentRow);
  }

  const rows = requireSqliteDb()
    .prepare(
      `
        SELECT
          c.id,
          c.product_id,
          c.user_id,
          c.parent_comment_id,
          c.rating,
          c.body,
          COALESCE(c.body_translations, '{}') AS body_translations,
          c.created_at,
          COALESCE(NULLIF(TRIM(u.name), ''), NULLIF(TRIM(u.email), ''), 'Usuário') AS author_name,
          NULLIF(TRIM(u.avatar_url), '') AS author_avatar_url
        FROM product_comments c
        INNER JOIN users u ON u.id = c.user_id
        WHERE c.product_id = ?
        ORDER BY c.created_at DESC, c.id DESC
      `,
    )
    .all(productId) as Array<Record<string, unknown>>;
  return rows.map(normalizeProductCommentRow);
}

async function createProductCommentRecord(input: {
  productId: number;
  userId: number;
  parentCommentId: number | null;
  rating: number | null;
  body: string;
}): Promise<number> {
  const createdAt = Math.floor(Date.now() / 1000);
  const translations = await buildContentTranslations({ body: input.body });
  const bodyTranslations = stringifyTranslationMap(translations.body.translations);

  if (pgPool) {
    const result = await pgPool.query<{ id: number | string }>(
      `
        INSERT INTO product_comments (
          product_id,
          user_id,
          parent_comment_id,
          rating,
          body,
          body_translations
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `,
      [
        input.productId,
        input.userId,
        input.parentCommentId,
        input.rating,
        input.body,
        bodyTranslations,
      ],
    );
    return toRequiredNumber(result.rows[0]?.id);
  }

  const result = requireSqliteDb()
    .prepare(
      `
        INSERT INTO product_comments (
          product_id,
          user_id,
          parent_comment_id,
          rating,
          body,
          body_translations,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
    )
    .run(
      input.productId,
      input.userId,
      input.parentCommentId,
      input.rating,
      input.body,
      bodyTranslations,
      createdAt,
    );

  return Number(result.lastInsertRowid);
}

async function updateProductCommentRecord(commentId: number, userId: number, body: string): Promise<boolean> {
  const normalizedBody = normalizeIncomingProductCommentBody(body);
  const translations = await buildContentTranslations({ body: normalizedBody });
  const bodyTranslations = stringifyTranslationMap(translations.body.translations);

  if (pgPool) {
    const result = await pgPool.query(
      `
        UPDATE product_comments
        SET body = $1,
            body_translations = $2
        WHERE id = $3 AND user_id = $4
      `,
      [normalizedBody, bodyTranslations, commentId, userId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  const result = requireSqliteDb()
    .prepare("UPDATE product_comments SET body = ?, body_translations = ? WHERE id = ? AND user_id = ?")
    .run(normalizedBody, bodyTranslations, commentId, userId);
  return result.changes > 0;
}

async function deleteProductCommentRecord(commentId: number, userId: number): Promise<boolean> {
  if (pgPool) {
    const result = await pgPool.query("DELETE FROM product_comments WHERE id = $1 AND user_id = $2", [
      commentId,
      userId,
    ]);
    return (result.rowCount ?? 0) > 0;
  }

  const result = requireSqliteDb()
    .prepare("DELETE FROM product_comments WHERE id = ? AND user_id = ?")
    .run(commentId, userId);
  return result.changes > 0;
}

async function selectLikedProductsByUserRows(userId: number): Promise<ProductRow[]> {
  if (pgPool) {
    const result = await pgPool.query<Record<string, unknown>>(
      `
        SELECT ${PRODUCT_SELECT_FIELDS}
        FROM product_likes l
        INNER JOIN products p ON p.id = l.product_id
        LEFT JOIN users u ON u.id = p.user_id
        WHERE l.user_id = $1
        ORDER BY l.created_at DESC, p.id DESC
      `,
      [userId],
    );
    return result.rows.map(normalizeProductRow);
  }

  const rows = requireSqliteDb()
    .prepare(
      `
        SELECT ${PRODUCT_SELECT_FIELDS}
        FROM product_likes l
        INNER JOIN products p ON p.id = l.product_id
        LEFT JOIN users u ON u.id = p.user_id
        WHERE l.user_id = ?
        ORDER BY l.created_at DESC, p.id DESC
      `,
    )
    .all(userId) as Array<Record<string, unknown>>;
  return rows.map(normalizeProductRow);
}

async function selectProductLikerRows(productId: number): Promise<Array<Record<string, unknown>>> {
  if (pgPool) {
    const result = await pgPool.query<Record<string, unknown>>(
      `
        SELECT
          u.id,
          u.name,
          NULLIF(BTRIM(u.avatar_url), '') AS avatar_url,
          NULLIF(BTRIM(u.country), '') AS country,
          NULLIF(BTRIM(u.city), '') AS city,
          l.created_at::TEXT AS liked_at
        FROM product_likes l
        INNER JOIN users u ON u.id = l.user_id
        WHERE l.product_id = $1
        ORDER BY l.created_at DESC, u.id DESC
        LIMIT 80
      `,
      [productId],
    );
    return result.rows;
  }

  return requireSqliteDb()
    .prepare(
      `
        SELECT
          u.id,
          u.name,
          NULLIF(TRIM(u.avatar_url), '') AS avatar_url,
          NULLIF(TRIM(u.country), '') AS country,
          NULLIF(TRIM(u.city), '') AS city,
          l.created_at AS liked_at
        FROM product_likes l
        INNER JOIN users u ON u.id = l.user_id
        WHERE l.product_id = ?
        ORDER BY l.created_at DESC, u.id DESC
        LIMIT 80
      `,
    )
    .all(productId) as Array<Record<string, unknown>>;
}

async function ensureNotificationDismissalsStorage(): Promise<void> {
  if (pgPool) {
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS notification_dismissals (
        owner_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        event_id TEXT NOT NULL,
        dismissed_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT),
        PRIMARY KEY (owner_user_id, event_id)
      )
    `);
    await pgPool.query(
      "CREATE INDEX IF NOT EXISTS idx_notification_dismissals_owner ON notification_dismissals(owner_user_id)",
    );
    return;
  }

  requireSqliteDb().exec(`
    CREATE TABLE IF NOT EXISTS notification_dismissals (
      owner_user_id INTEGER NOT NULL,
      event_id TEXT NOT NULL,
      dismissed_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      PRIMARY KEY (owner_user_id, event_id),
      FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_notification_dismissals_owner
      ON notification_dismissals(owner_user_id);
  `);
}

async function ensureAdminBroadcastNotificationsStorage(): Promise<void> {
  if (pgPool) {
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS admin_broadcast_notifications (
        id BIGSERIAL PRIMARY KEY,
        title TEXT NOT NULL DEFAULT '',
        message TEXT NOT NULL DEFAULT '',
        title_translations TEXT NOT NULL DEFAULT '{}',
        message_translations TEXT NOT NULL DEFAULT '{}',
        translation_status TEXT NOT NULL DEFAULT '{}',
        product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
        created_by TEXT NOT NULL DEFAULT '',
        created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT)
      )
    `);
    await pgPool.query("ALTER TABLE admin_broadcast_notifications ADD COLUMN IF NOT EXISTS title_translations TEXT NOT NULL DEFAULT '{}'");
    await pgPool.query("ALTER TABLE admin_broadcast_notifications ADD COLUMN IF NOT EXISTS message_translations TEXT NOT NULL DEFAULT '{}'");
    await pgPool.query("ALTER TABLE admin_broadcast_notifications ADD COLUMN IF NOT EXISTS translation_status TEXT NOT NULL DEFAULT '{}'");
    await pgPool.query(
      "CREATE INDEX IF NOT EXISTS idx_admin_broadcast_notifications_created ON admin_broadcast_notifications(created_at DESC)",
    );
    return;
  }

  requireSqliteDb().exec(`
    CREATE TABLE IF NOT EXISTS admin_broadcast_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL DEFAULT '',
      message TEXT NOT NULL DEFAULT '',
      title_translations TEXT NOT NULL DEFAULT '{}',
      message_translations TEXT NOT NULL DEFAULT '{}',
      translation_status TEXT NOT NULL DEFAULT '{}',
      product_id INTEGER,
      created_by TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_admin_broadcast_notifications_created
      ON admin_broadcast_notifications(created_at DESC);
  `);
  const columns = requireSqliteDb()
    .prepare("PRAGMA table_info(admin_broadcast_notifications)")
    .all() as Array<{ name: string }>;
  if (!columns.some((column) => column.name === "title_translations")) {
    requireSqliteDb().exec("ALTER TABLE admin_broadcast_notifications ADD COLUMN title_translations TEXT NOT NULL DEFAULT '{}'");
  }
  if (!columns.some((column) => column.name === "message_translations")) {
    requireSqliteDb().exec("ALTER TABLE admin_broadcast_notifications ADD COLUMN message_translations TEXT NOT NULL DEFAULT '{}'");
  }
  if (!columns.some((column) => column.name === "translation_status")) {
    requireSqliteDb().exec("ALTER TABLE admin_broadcast_notifications ADD COLUMN translation_status TEXT NOT NULL DEFAULT '{}'");
  }
}

async function dismissNotificationRecord(ownerId: number, eventId: string): Promise<void> {
  const normalizedEventId = eventId.trim();
  if (!normalizedEventId || normalizedEventId.length > 260) {
    throw new Error("Notificação inválida.");
  }

  await ensureNotificationDismissalsStorage();

  if (pgPool) {
    await pgPool.query(
      `
        INSERT INTO notification_dismissals (owner_user_id, event_id)
        VALUES ($1, $2)
        ON CONFLICT (owner_user_id, event_id) DO NOTHING
      `,
      [ownerId, normalizedEventId],
    );
    return;
  }

  requireSqliteDb()
    .prepare(
      `
        INSERT OR IGNORE INTO notification_dismissals (owner_user_id, event_id)
        VALUES (?, ?)
      `,
    )
    .run(ownerId, normalizedEventId);
}

async function restoreNotificationRecord(ownerId: number, eventId: string): Promise<void> {
  const normalizedEventId = eventId.trim();
  if (!normalizedEventId || normalizedEventId.length > 260) {
    throw new Error("Notificação inválida.");
  }

  await ensureNotificationDismissalsStorage();

  if (pgPool) {
    await pgPool.query(
      "DELETE FROM notification_dismissals WHERE owner_user_id = $1 AND event_id = $2",
      [ownerId, normalizedEventId],
    );
    return;
  }

  requireSqliteDb()
    .prepare("DELETE FROM notification_dismissals WHERE owner_user_id = ? AND event_id = ?")
    .run(ownerId, normalizedEventId);
}

async function selectAllUserIdsRows(): Promise<number[]> {
  if (pgPool) {
    const result = await pgPool.query<Record<string, unknown>>(
      "SELECT id FROM users WHERE COALESCE(is_banned, FALSE) = FALSE ORDER BY id ASC",
    );
    return result.rows.map((row) => toRequiredNumber(row.id)).filter((id) => id > 0);
  }

  const rows = requireSqliteDb()
    .prepare("SELECT id FROM users WHERE COALESCE(is_banned, 0) = 0 ORDER BY id ASC")
    .all() as Array<Record<string, unknown>>;
  return rows.map((row) => toRequiredNumber(row.id)).filter((id) => id > 0);
}

async function createAdminBroadcastNotificationRecord(input: {
  title: string;
  message: string;
  productId: number | null;
  createdBy: string;
}): Promise<number> {
  const title = input.title.trim();
  const message = input.message.trim();
  const createdBy = input.createdBy.trim().toLowerCase();
  const productId = input.productId;

  await ensureAdminBroadcastNotificationsStorage();

  if (title.length < 2 || title.length > 120) {
    throw new Error("Título deve ter entre 2 e 120 caracteres.");
  }
  if (message.length < 2 || message.length > 600) {
    throw new Error("Mensagem deve ter entre 2 e 600 caracteres.");
  }
  if (productId !== null) {
    const product = await selectProductByIdRow(productId);
    if (!product) {
      throw new Error("Anúncio patrocinado não encontrado.");
    }
  }

  const translations = await buildContentTranslations({ title, message });
  const titleTranslations = stringifyTranslationMap(translations.title.translations);
  const messageTranslations = stringifyTranslationMap(translations.message.translations);
  const translationStatus = stringifyTranslationMap(translations.status);

  if (pgPool) {
    const result = await pgPool.query<{ id: number | string }>(
      `
        INSERT INTO admin_broadcast_notifications (
          title,
          message,
          title_translations,
          message_translations,
          translation_status,
          product_id,
          created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `,
      [title, message, titleTranslations, messageTranslations, translationStatus, productId, createdBy],
    );
    return toRequiredNumber(result.rows[0]?.id);
  }

  const now = Math.floor(Date.now() / 1000);
  const result = requireSqliteDb()
    .prepare(
      `
        INSERT INTO admin_broadcast_notifications (
          title,
          message,
          title_translations,
          message_translations,
          translation_status,
          product_id,
          created_by,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
    )
    .run(
      title,
      message,
      titleTranslations,
      messageTranslations,
      translationStatus,
      productId,
      createdBy,
      now,
    );
  return Number(result.lastInsertRowid);
}

function rowToAdminBroadcastNotification(row: Record<string, unknown>): AdminBroadcastNotificationRecord {
  const createdAt = (() => {
    const numericValue = Number(row.created_at);
    if (Number.isFinite(numericValue)) {
      return Math.floor(numericValue);
    }
    if (row.created_at instanceof Date) {
      const seconds = Math.floor(row.created_at.getTime() / 1000);
      if (Number.isFinite(seconds)) {
        return seconds;
      }
    }
    const parsed = Date.parse(String(row.created_at ?? ""));
    return Number.isFinite(parsed) ? Math.floor(parsed / 1000) : Math.floor(Date.now() / 1000);
  })();

  const normalized: AdminBroadcastNotificationRecord = {
    id: toRequiredNumber(row.id),
    title: String(row.title ?? "").trim(),
    message: String(row.message ?? "").trim(),
    titleTranslations: parseTranslationMap(row.title_translations),
    messageTranslations: parseTranslationMap(row.message_translations),
    translationStatus: parseTranslationMap(row.translation_status),
    createdBy: String(row.created_by ?? "").trim(),
    createdAt,
  };

  const productId = toNullableNumber(row.product_id);
  if (productId !== null) {
    normalized.productId = productId;
  }
  const productName = String(row.product_name ?? "").trim();
  if (productName) {
    normalized.productName = productName;
  }

  return normalized;
}

async function selectAdminBroadcastNotificationRows(): Promise<AdminBroadcastNotificationRecord[]> {
  await ensureAdminBroadcastNotificationsStorage();

  if (pgPool) {
    const result = await pgPool.query<Record<string, unknown>>(
      `
        SELECT
          b.id,
          b.title,
          b.message,
          b.title_translations,
          b.message_translations,
          b.translation_status,
          b.product_id,
          p.name AS product_name,
          b.created_by,
          b.created_at
        FROM admin_broadcast_notifications b
        LEFT JOIN products p ON p.id = b.product_id
        ORDER BY
          CASE
            WHEN b.created_at::TEXT ~ '^[0-9]+$' THEN b.created_at::TEXT::BIGINT
            ELSE EXTRACT(EPOCH FROM b.created_at::TEXT::TIMESTAMPTZ)::BIGINT
          END DESC,
          b.id DESC
        LIMIT 120
      `,
    );
    return result.rows.map(rowToAdminBroadcastNotification);
  }

  const rows = requireSqliteDb()
    .prepare(
      `
        SELECT
          b.id,
          b.title,
          b.message,
          b.title_translations,
          b.message_translations,
          b.translation_status,
          b.product_id,
          p.name AS product_name,
          b.created_by,
          b.created_at
        FROM admin_broadcast_notifications b
        LEFT JOIN products p ON p.id = b.product_id
        ORDER BY CAST(b.created_at AS INTEGER) DESC, b.id DESC
        LIMIT 120
      `,
    )
    .all() as Array<Record<string, unknown>>;
  return rows.map(rowToAdminBroadcastNotification);
}

async function deleteAdminBroadcastNotificationRecord(id: number): Promise<boolean> {
  await ensureAdminBroadcastNotificationsStorage();

  if (pgPool) {
    const result = await pgPool.query("DELETE FROM admin_broadcast_notifications WHERE id = $1", [id]);
    return (result.rowCount ?? 0) > 0;
  }

  const result = requireSqliteDb()
    .prepare("DELETE FROM admin_broadcast_notifications WHERE id = ?")
    .run(id);
  return result.changes > 0;
}

async function selectNotificationsByOwnerRows(ownerId: number): Promise<NotificationEventRow[]> {
  await ensureNotificationDismissalsStorage();
  await ensureAdminBroadcastNotificationsStorage();

  if (pgPool) {
    const result = await pgPool.query<Record<string, unknown>>(
      `
        SELECT *
        FROM (
          SELECT
            'product_like'::TEXT AS type,
            l.user_id AS actor_user_id,
            COALESCE(NULLIF(BTRIM(lu.name), ''), 'Alguém') AS actor_name,
            NULLIF(BTRIM(lu.avatar_url), '') AS actor_avatar_url,
            NULLIF(BTRIM(lu.city), '') AS actor_city,
            NULLIF(BTRIM(lu.country), '') AS actor_country,
            p.id AS product_id,
            p.name AS product_name,
            COALESCE(NULLIF(BTRIM(p.image), ''), NULLIF(BTRIM(p.image_url), '')) AS product_image_url,
            NULL::BIGINT AS comment_id,
            l.created_at::TEXT AS created_at,
            CASE
              WHEN l.created_at::TEXT ~ '^[0-9]+$' THEN l.created_at::TEXT::BIGINT
              ELSE EXTRACT(EPOCH FROM l.created_at::TEXT::TIMESTAMPTZ)::BIGINT
            END AS sort_created_at,
            'product_like:' || l.user_id::TEXT || ':' || l.product_id::TEXT || ':' || l.created_at::TEXT AS event_id,
            NULL::TEXT AS title_translations,
            NULL::TEXT AS message_translations,
            NULL::TEXT AS recipient_locale
          FROM product_likes l
          INNER JOIN products p ON p.id = l.product_id
          LEFT JOIN users lu ON lu.id = l.user_id
          WHERE p.user_id = $1 AND l.user_id <> $2

          UNION ALL

          SELECT
            'product_cart_interest'::TEXT AS type,
            c.actor_user_id,
            COALESCE(NULLIF(BTRIM(c.actor_name), ''), '') AS actor_name,
            NULLIF(BTRIM(cu.avatar_url), '') AS actor_avatar_url,
            NULLIF(BTRIM(cu.city), '') AS actor_city,
            NULLIF(BTRIM(cu.country), '') AS actor_country,
            p.id AS product_id,
            p.name AS product_name,
            COALESCE(NULLIF(BTRIM(p.image), ''), NULLIF(BTRIM(p.image_url), '')) AS product_image_url,
            NULL::BIGINT AS comment_id,
            c.created_at::TEXT AS created_at,
            CASE
              WHEN c.created_at::TEXT ~ '^[0-9]+$' THEN c.created_at::TEXT::BIGINT
              ELSE EXTRACT(EPOCH FROM c.created_at::TEXT::TIMESTAMPTZ)::BIGINT
            END AS sort_created_at,
            'product_cart_interest:' || c.id::TEXT AS event_id,
            NULL::TEXT AS title_translations,
            NULL::TEXT AS message_translations,
            NULL::TEXT AS recipient_locale
          FROM product_cart_notifications c
          INNER JOIN products p ON p.id = c.product_id
          LEFT JOIN users cu ON cu.id = c.actor_user_id
          WHERE c.owner_user_id = $1
            AND (c.actor_user_id IS NULL OR c.actor_user_id <> $2)

          UNION ALL

          SELECT
            'product_comment'::TEXT AS type,
            c.user_id AS actor_user_id,
            COALESCE(NULLIF(BTRIM(cu.name), ''), 'Alguém') AS actor_name,
            NULLIF(BTRIM(cu.avatar_url), '') AS actor_avatar_url,
            NULLIF(BTRIM(cu.city), '') AS actor_city,
            NULLIF(BTRIM(cu.country), '') AS actor_country,
            p.id AS product_id,
            p.name AS product_name,
            COALESCE(NULLIF(BTRIM(p.image), ''), NULLIF(BTRIM(p.image_url), '')) AS product_image_url,
            c.id AS comment_id,
            c.created_at::TEXT AS created_at,
            CASE
              WHEN c.created_at::TEXT ~ '^[0-9]+$' THEN c.created_at::TEXT::BIGINT
              ELSE EXTRACT(EPOCH FROM c.created_at::TEXT::TIMESTAMPTZ)::BIGINT
            END AS sort_created_at,
            'product_comment:' || c.id::TEXT AS event_id,
            NULL::TEXT AS title_translations,
            NULL::TEXT AS message_translations,
            NULL::TEXT AS recipient_locale
          FROM product_comments c
          INNER JOIN products p ON p.id = c.product_id
          LEFT JOIN users cu ON cu.id = c.user_id
          WHERE p.user_id = $1
            AND c.user_id <> $2

          UNION ALL

          SELECT
            'product_comment'::TEXT AS type,
            c.user_id AS actor_user_id,
            COALESCE(NULLIF(BTRIM(cu.name), ''), 'Dono do anúncio') AS actor_name,
            NULLIF(BTRIM(cu.avatar_url), '') AS actor_avatar_url,
            NULLIF(BTRIM(cu.city), '') AS actor_city,
            NULLIF(BTRIM(cu.country), '') AS actor_country,
            p.id AS product_id,
            p.name AS product_name,
            COALESCE(NULLIF(BTRIM(p.image), ''), NULLIF(BTRIM(p.image_url), '')) AS product_image_url,
            c.id AS comment_id,
            c.created_at::TEXT AS created_at,
            CASE
              WHEN c.created_at::TEXT ~ '^[0-9]+$' THEN c.created_at::TEXT::BIGINT
              ELSE EXTRACT(EPOCH FROM c.created_at::TEXT::TIMESTAMPTZ)::BIGINT
            END AS sort_created_at,
            'product_comment_reply:' || c.id::TEXT AS event_id,
            NULL::TEXT AS title_translations,
            NULL::TEXT AS message_translations,
            NULL::TEXT AS recipient_locale
          FROM product_comments c
          INNER JOIN product_comments parent_comment ON parent_comment.id = c.parent_comment_id
          INNER JOIN products p ON p.id = c.product_id
          LEFT JOIN users cu ON cu.id = c.user_id
          WHERE parent_comment.user_id = $1
            AND c.user_id <> $2
            AND p.user_id = c.user_id

          UNION ALL

          SELECT
            'admin_broadcast'::TEXT AS type,
            NULL::BIGINT AS actor_user_id,
            COALESCE(NULLIF(BTRIM(b.title), ''), 'TempleSale') AS actor_name,
            NULL::TEXT AS actor_avatar_url,
            NULL::TEXT AS actor_city,
            NULL::TEXT AS actor_country,
            p.id AS product_id,
            COALESCE(NULLIF(BTRIM(b.message), ''), NULLIF(BTRIM(p.name), ''), 'Atualização TempleSale') AS product_name,
            COALESCE(NULLIF(BTRIM(p.image), ''), NULLIF(BTRIM(p.image_url), '')) AS product_image_url,
            NULL::BIGINT AS comment_id,
            b.created_at::TEXT AS created_at,
            CASE
              WHEN b.created_at::TEXT ~ '^[0-9]+$' THEN b.created_at::TEXT::BIGINT
              ELSE EXTRACT(EPOCH FROM b.created_at::TEXT::TIMESTAMPTZ)::BIGINT
            END AS sort_created_at,
            'admin_broadcast:' || b.id::TEXT AS event_id,
            b.title_translations,
            b.message_translations,
            recipient.preferred_locale AS recipient_locale
          FROM admin_broadcast_notifications b
          LEFT JOIN products p ON p.id = b.product_id
          INNER JOIN users recipient ON recipient.id = $4
          WHERE (
            CASE
              WHEN b.created_at::TEXT ~ '^[0-9]+$' THEN b.created_at::TEXT::BIGINT
              ELSE EXTRACT(EPOCH FROM b.created_at::TEXT::TIMESTAMPTZ)::BIGINT
            END
          ) >= (
            CASE
              WHEN recipient.created_at::TEXT ~ '^[0-9]+$' THEN recipient.created_at::TEXT::BIGINT
              ELSE EXTRACT(EPOCH FROM recipient.created_at::TEXT::TIMESTAMPTZ)::BIGINT
            END
          )
        ) notifications
        WHERE NOT EXISTS (
          SELECT 1
          FROM notification_dismissals d
          WHERE d.owner_user_id = $3 AND d.event_id = notifications.event_id
        )
        ORDER BY sort_created_at DESC, event_id DESC
        LIMIT 100
      `,
      [ownerId, ownerId, ownerId, ownerId],
    );
    return result.rows.map(normalizeNotificationEventRow);
  }

  const rows = requireSqliteDb()
    .prepare(
      `
        SELECT *
        FROM (
          SELECT
            'product_like' AS type,
            l.user_id AS actor_user_id,
            COALESCE(NULLIF(TRIM(lu.name), ''), 'Alguém') AS actor_name,
            NULLIF(TRIM(lu.avatar_url), '') AS actor_avatar_url,
            NULLIF(TRIM(lu.city), '') AS actor_city,
            NULLIF(TRIM(lu.country), '') AS actor_country,
            p.id AS product_id,
            p.name AS product_name,
            COALESCE(NULLIF(TRIM(p.image), ''), NULLIF(TRIM(p.image_url), '')) AS product_image_url,
            NULL AS comment_id,
            l.created_at,
            CAST(l.created_at AS INTEGER) AS sort_created_at,
            'product_like:' || l.user_id || ':' || l.product_id || ':' || l.created_at AS event_id,
            NULL AS title_translations,
            NULL AS message_translations,
            NULL AS recipient_locale
          FROM product_likes l
          INNER JOIN products p ON p.id = l.product_id
          LEFT JOIN users lu ON lu.id = l.user_id
          WHERE p.user_id = ? AND l.user_id <> ?

          UNION ALL

          SELECT
            'product_cart_interest' AS type,
            c.actor_user_id AS actor_user_id,
            COALESCE(NULLIF(TRIM(c.actor_name), ''), '') AS actor_name,
            NULLIF(TRIM(cu.avatar_url), '') AS actor_avatar_url,
            NULLIF(TRIM(cu.city), '') AS actor_city,
            NULLIF(TRIM(cu.country), '') AS actor_country,
            p.id AS product_id,
            p.name AS product_name,
            COALESCE(NULLIF(TRIM(p.image), ''), NULLIF(TRIM(p.image_url), '')) AS product_image_url,
            NULL AS comment_id,
            c.created_at,
            CAST(c.created_at AS INTEGER) AS sort_created_at,
            'product_cart_interest:' || c.id AS event_id,
            NULL AS title_translations,
            NULL AS message_translations,
            NULL AS recipient_locale
          FROM product_cart_notifications c
          INNER JOIN products p ON p.id = c.product_id
          LEFT JOIN users cu ON cu.id = c.actor_user_id
          WHERE c.owner_user_id = ?
            AND (c.actor_user_id IS NULL OR c.actor_user_id <> ?)

          UNION ALL

          SELECT
            'product_comment' AS type,
            c.user_id AS actor_user_id,
            COALESCE(NULLIF(TRIM(cu.name), ''), 'Alguém') AS actor_name,
            NULLIF(TRIM(cu.avatar_url), '') AS actor_avatar_url,
            NULLIF(TRIM(cu.city), '') AS actor_city,
            NULLIF(TRIM(cu.country), '') AS actor_country,
            p.id AS product_id,
            p.name AS product_name,
            COALESCE(NULLIF(TRIM(p.image), ''), NULLIF(TRIM(p.image_url), '')) AS product_image_url,
            c.id AS comment_id,
            c.created_at,
            CAST(c.created_at AS INTEGER) AS sort_created_at,
            'product_comment:' || c.id AS event_id,
            NULL AS title_translations,
            NULL AS message_translations,
            NULL AS recipient_locale
          FROM product_comments c
          INNER JOIN products p ON p.id = c.product_id
          LEFT JOIN users cu ON cu.id = c.user_id
          WHERE p.user_id = ?
            AND c.user_id <> ?

          UNION ALL

          SELECT
            'product_comment' AS type,
            c.user_id AS actor_user_id,
            COALESCE(NULLIF(TRIM(cu.name), ''), 'Dono do anúncio') AS actor_name,
            NULLIF(TRIM(cu.avatar_url), '') AS actor_avatar_url,
            NULLIF(TRIM(cu.city), '') AS actor_city,
            NULLIF(TRIM(cu.country), '') AS actor_country,
            p.id AS product_id,
            p.name AS product_name,
            COALESCE(NULLIF(TRIM(p.image), ''), NULLIF(TRIM(p.image_url), '')) AS product_image_url,
            c.id AS comment_id,
            c.created_at,
            CAST(c.created_at AS INTEGER) AS sort_created_at,
            'product_comment_reply:' || c.id AS event_id,
            NULL AS title_translations,
            NULL AS message_translations,
            NULL AS recipient_locale
          FROM product_comments c
          INNER JOIN product_comments parent_comment ON parent_comment.id = c.parent_comment_id
          INNER JOIN products p ON p.id = c.product_id
          LEFT JOIN users cu ON cu.id = c.user_id
          WHERE parent_comment.user_id = ?
            AND c.user_id <> ?
            AND p.user_id = c.user_id

          UNION ALL

          SELECT
            'admin_broadcast' AS type,
            NULL AS actor_user_id,
            COALESCE(NULLIF(TRIM(b.title), ''), 'TempleSale') AS actor_name,
            NULL AS actor_avatar_url,
            NULL AS actor_city,
            NULL AS actor_country,
            p.id AS product_id,
            COALESCE(NULLIF(TRIM(b.message), ''), NULLIF(TRIM(p.name), ''), 'Atualização TempleSale') AS product_name,
            COALESCE(NULLIF(TRIM(p.image), ''), NULLIF(TRIM(p.image_url), '')) AS product_image_url,
            NULL AS comment_id,
            b.created_at,
            CAST(b.created_at AS INTEGER) AS sort_created_at,
            'admin_broadcast:' || b.id AS event_id,
            b.title_translations,
            b.message_translations,
            recipient.preferred_locale AS recipient_locale
          FROM admin_broadcast_notifications b
          LEFT JOIN products p ON p.id = b.product_id
          INNER JOIN users recipient ON recipient.id = ?
          WHERE CAST(b.created_at AS INTEGER) >= CAST(recipient.created_at AS INTEGER)
        )
        WHERE NOT EXISTS (
          SELECT 1
          FROM notification_dismissals d
          WHERE d.owner_user_id = ? AND d.event_id = event_id
        )
        ORDER BY sort_created_at DESC, event_id DESC
        LIMIT 100
      `,
    )
    .all(
      ownerId,
      ownerId,
      ownerId,
      ownerId,
      ownerId,
      ownerId,
      ownerId,
      ownerId,
      ownerId,
      ownerId,
    ) as Array<Record<string, unknown>>;
  return rows.map(normalizeNotificationEventRow);
}

async function createProductRecord(
  normalized: NormalizedProductInput,
  userId: number,
): Promise<number> {
  const translations = await buildContentTranslations({
    name: normalized.name,
    description: normalized.description,
  });
  const nameTranslations = stringifyTranslationMap(translations.name.translations);
  const descriptionTranslations = stringifyTranslationMap(translations.description.translations);

  if (pgPool) {
    const result = await pgPool.query<{ id: number | string }>(
      `
        INSERT INTO products (
          title,
          name,
          name_translations,
          category,
          price,
          price_negotiable,
          quantity,
          image,
          images,
          image_url,
          image_urls,
          description,
          description_translations,
          details,
          user_id,
          latitude,
          longitude,
          lat,
          lng
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING id
      `,
      [
        normalized.name,
        normalized.name,
        nameTranslations,
        normalized.category,
        normalized.price,
        normalized.priceNegotiable,
        normalized.quantity,
        normalized.image,
        normalized.images,
        normalized.image,
        normalized.images,
        normalized.description,
        descriptionTranslations,
        normalized.details,
        userId,
        normalized.latitude,
        normalized.longitude,
        normalized.latitude,
        normalized.longitude,
      ],
    );
    const createdId = toRequiredNumber(result.rows[0]?.id);
    try {
      await ensureProductSlugRecord(createdId, normalized.name, null);
    } catch (error) {
      console.error("Failed to ensure slug for created product:", {
        productId: createdId,
        error,
      });
    }
    return createdId;
  }

  const result = requireSqliteDb()
    .prepare(
      `
        INSERT INTO products (
          name,
          name_translations,
          category,
          price,
          price_negotiable,
          quantity,
          image,
          images,
          description,
          description_translations,
          details,
          user_id,
          latitude,
          longitude
        )
        VALUES (
          @name,
          @name_translations,
          @category,
          @price,
          @price_negotiable,
          @quantity,
          @image,
          @images,
          @description,
          @description_translations,
          @details,
          @user_id,
          @latitude,
          @longitude
        )
      `,
    )
    .run({
      ...normalized,
      name_translations: nameTranslations,
      description_translations: descriptionTranslations,
      price_negotiable: normalized.priceNegotiable ? 1 : 0,
      user_id: userId,
    });
  const createdId = Number(result.lastInsertRowid);
  try {
    await ensureProductSlugRecord(createdId, normalized.name, null);
  } catch (error) {
    console.error("Failed to ensure slug for created product:", {
      productId: createdId,
      error,
    });
  }
  return createdId;
}

async function updateProductRecord(id: number, normalized: NormalizedProductInput): Promise<void> {
  const translations = await buildContentTranslations({
    name: normalized.name,
    description: normalized.description,
  });
  const nameTranslations = stringifyTranslationMap(translations.name.translations);
  const descriptionTranslations = stringifyTranslationMap(translations.description.translations);

  if (pgPool) {
    await pgPool.query(
      `
        UPDATE products
        SET
          title = $1,
          name = $2,
          name_translations = $3,
          category = $4,
          price = $5,
          price_negotiable = $6,
          quantity = $7,
          image = $8,
          images = $9,
          image_url = $10,
          image_urls = $11,
          description = $12,
          description_translations = $13,
          details = $14,
          latitude = $15,
          longitude = $16,
          lat = $17,
          lng = $18
        WHERE id = $19
      `,
      [
        normalized.name,
        normalized.name,
        nameTranslations,
        normalized.category,
        normalized.price,
        normalized.priceNegotiable,
        normalized.quantity,
        normalized.image,
        normalized.images,
        normalized.image,
        normalized.images,
        normalized.description,
        descriptionTranslations,
        normalized.details,
        normalized.latitude,
        normalized.longitude,
        normalized.latitude,
        normalized.longitude,
        id,
      ],
    );
    try {
      await ensureProductSlugRecord(id, normalized.name);
    } catch (error) {
      console.error("Failed to ensure slug for updated product:", {
        productId: id,
        error,
      });
    }
    return;
  }

  requireSqliteDb()
    .prepare(
      `
        UPDATE products
        SET
          name = @name,
          name_translations = @name_translations,
          category = @category,
          price = @price,
          price_negotiable = @price_negotiable,
          quantity = @quantity,
          image = @image,
          images = @images,
          description = @description,
          description_translations = @description_translations,
          details = @details,
          latitude = @latitude,
          longitude = @longitude
        WHERE id = @id
      `,
    )
    .run({
      id,
      ...normalized,
      name_translations: nameTranslations,
      description_translations: descriptionTranslations,
      price_negotiable: normalized.priceNegotiable ? 1 : 0,
    });
  try {
    await ensureProductSlugRecord(id, normalized.name);
  } catch (error) {
    console.error("Failed to ensure slug for updated product:", {
      productId: id,
      error,
    });
  }
}

async function deleteProductRecord(id: number): Promise<void> {
  if (pgPool) {
    await pgPool.query("DELETE FROM products WHERE id = $1", [id]);
    return;
  }

  requireSqliteDb().prepare("DELETE FROM products WHERE id = ?").run(id);
}

async function deleteProductRecordAsAdmin(productId: number): Promise<boolean> {
  if (pgPool) {
    const client = await pgPool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM product_likes WHERE product_id = $1", [productId]);
      const deleted = await client.query("DELETE FROM products WHERE id = $1", [productId]);
      await client.query("COMMIT");
      return (deleted.rowCount ?? 0) > 0;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  const db = requireSqliteDb();
  const deleteProduct = db.prepare("DELETE FROM products WHERE id = ?");
  const deleteLikes = db.prepare("DELETE FROM product_likes WHERE product_id = ?");
  const runDelete = db.transaction((id: number) => {
    deleteLikes.run(id);
    const result = deleteProduct.run(id);
    return Number(result.changes ?? 0) > 0;
  });
  return runDelete(productId);
}

async function deleteUserRecordAsAdmin(userId: number): Promise<boolean> {
  if (pgPool) {
    const client = await pgPool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `
          DELETE FROM product_likes
          WHERE product_id IN (SELECT id FROM products WHERE user_id = $1)
        `,
        [userId],
      );
      await client.query("DELETE FROM product_likes WHERE user_id = $1", [userId]);
      await client.query("DELETE FROM sessions WHERE user_id = $1", [userId]);
      await client.query("DELETE FROM products WHERE user_id = $1", [userId]);
      const deleted = await client.query("DELETE FROM users WHERE id = $1", [userId]);
      await client.query("COMMIT");
      return (deleted.rowCount ?? 0) > 0;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  const db = requireSqliteDb();
  const deleteLikesByProducts = db.prepare(
    `
      DELETE FROM product_likes
      WHERE product_id IN (SELECT id FROM products WHERE user_id = ?)
    `,
  );
  const deleteLikesByUser = db.prepare("DELETE FROM product_likes WHERE user_id = ?");
  const deleteSessions = db.prepare("DELETE FROM sessions WHERE user_id = ?");
  const deleteProducts = db.prepare("DELETE FROM products WHERE user_id = ?");
  const deleteUser = db.prepare("DELETE FROM users WHERE id = ?");

  const runDelete = db.transaction((id: number) => {
    deleteLikesByProducts.run(id);
    deleteLikesByUser.run(id);
    deleteSessions.run(id);
    deleteProducts.run(id);
    const result = deleteUser.run(id);
    return Number(result.changes ?? 0) > 0;
  });

  return runDelete(userId);
}

async function createProductLikeRecord(userId: number, productId: number): Promise<void> {
  if (pgPool) {
    await pgPool.query(
      `
        INSERT INTO product_likes (user_id, product_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, product_id) DO NOTHING
      `,
      [userId, productId],
    );
    return;
  }

  requireSqliteDb()
    .prepare(
      `
        INSERT OR IGNORE INTO product_likes (user_id, product_id)
        VALUES (?, ?)
      `,
    )
    .run(userId, productId);
}

async function hasRecentProductCartNotification(
  ownerUserId: number,
  productId: number,
  actorUserId: number | null,
  minCreatedAt: number,
): Promise<boolean> {
  if (pgPool) {
    const actorConditionSql =
      actorUserId === null
        ? "actor_user_id IS NULL"
        : "actor_user_id = $4";
    const params =
      actorUserId === null
        ? [ownerUserId, productId, minCreatedAt]
        : [ownerUserId, productId, minCreatedAt, actorUserId];

    const result = await pgPool.query<Record<string, unknown>>(
      `
        SELECT id
        FROM product_cart_notifications
        WHERE owner_user_id = $1
          AND product_id = $2
          AND (
            CASE
              WHEN created_at::TEXT ~ '^[0-9]+$' THEN created_at::TEXT::BIGINT
              ELSE EXTRACT(EPOCH FROM created_at::TEXT::TIMESTAMPTZ)::BIGINT
            END
          ) >= $3
          AND ${actorConditionSql}
        ORDER BY created_at DESC
        LIMIT 1
      `,
      params,
    );
    return result.rows.length > 0;
  }

  if (actorUserId === null) {
    const row = requireSqliteDb()
      .prepare(
        `
          SELECT id
          FROM product_cart_notifications
          WHERE owner_user_id = ?
            AND product_id = ?
            AND created_at >= ?
            AND actor_user_id IS NULL
          ORDER BY created_at DESC
          LIMIT 1
        `,
      )
      .get(ownerUserId, productId, minCreatedAt) as Record<string, unknown> | undefined;
    return Boolean(row);
  }

  const row = requireSqliteDb()
    .prepare(
      `
        SELECT id
        FROM product_cart_notifications
        WHERE owner_user_id = ?
          AND product_id = ?
          AND created_at >= ?
          AND actor_user_id = ?
        ORDER BY created_at DESC
        LIMIT 1
      `,
    )
    .get(ownerUserId, productId, minCreatedAt, actorUserId) as Record<string, unknown> | undefined;
  return Boolean(row);
}

async function createProductCartNotificationRecord(
  ownerUserId: number,
  productId: number,
  actorUserId: number | null,
  actorName: string,
): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);
  const minCreatedAt = now - CART_NOTIFICATION_DEDUP_WINDOW_SECONDS;
  const normalizedActorName = actorName.trim();

  const alreadyExists = await hasRecentProductCartNotification(
    ownerUserId,
    productId,
    actorUserId,
    minCreatedAt,
  );
  if (alreadyExists) {
    return false;
  }

  if (pgPool) {
    await pgPool.query(
      `
        INSERT INTO product_cart_notifications (
          owner_user_id,
          actor_user_id,
          actor_name,
          product_id
        )
        VALUES ($1, $2, $3, $4)
      `,
      [ownerUserId, actorUserId, normalizedActorName, productId],
    );
    return true;
  }

  requireSqliteDb()
    .prepare(
      `
        INSERT INTO product_cart_notifications (
          owner_user_id,
          actor_user_id,
          actor_name,
          product_id,
          created_at
        )
        VALUES (?, ?, ?, ?, ?)
      `,
    )
    .run(ownerUserId, actorUserId, normalizedActorName, productId, now);
  return true;
}

async function deleteProductLikeRecord(userId: number, productId: number): Promise<void> {
  if (pgPool) {
    await pgPool.query("DELETE FROM product_likes WHERE user_id = $1 AND product_id = $2", [
      userId,
      productId,
    ]);
    return;
  }

  requireSqliteDb()
    .prepare(
      `
        DELETE FROM product_likes
        WHERE user_id = ? AND product_id = ?
      `,
    )
    .run(userId, productId);
}

async function selectUserByEmailRow(email: string): Promise<UserRow | undefined> {
  const normalizedEmail = normalizeEmail(email);
  if (pgPool) {
    const result = await pgPool.query<Record<string, unknown>>(
      `
        SELECT ${USER_SELECT_FIELDS}
        FROM users
        WHERE LOWER(email) = $1
      `,
      [normalizedEmail],
    );
    const row = result.rows[0];
    return row ? normalizeUserRow(row) : undefined;
  }

  const row = requireSqliteDb()
    .prepare(
      `
        SELECT ${USER_SELECT_FIELDS}
        FROM users
        WHERE LOWER(email) = ?
      `,
    )
    .get(normalizedEmail) as Record<string, unknown> | undefined;
  return row ? normalizeUserRow(row) : undefined;
}

async function selectUserByAuth0SubRow(auth0Sub: string): Promise<UserRow | undefined> {
  const normalizedSub = auth0Sub.trim();
  if (!normalizedSub) {
    return undefined;
  }

  if (pgPool) {
    const result = await pgPool.query<Record<string, unknown>>(
      `
        SELECT ${USER_SELECT_FIELDS}
        FROM users
        WHERE auth0_sub = $1
      `,
      [normalizedSub],
    );
    const row = result.rows[0];
    return row ? normalizeUserRow(row) : undefined;
  }

  const row = requireSqliteDb()
    .prepare(
      `
        SELECT ${USER_SELECT_FIELDS}
        FROM users
        WHERE auth0_sub = ?
      `,
    )
    .get(normalizedSub) as Record<string, unknown> | undefined;
  return row ? normalizeUserRow(row) : undefined;
}

async function selectUserByIdRow(id: number): Promise<UserRow | undefined> {
  if (pgPool) {
    const result = await pgPool.query<Record<string, unknown>>(
      `
        SELECT ${USER_SELECT_FIELDS}
        FROM users
        WHERE id = $1
      `,
      [id],
    );
    const row = result.rows[0];
    return row ? normalizeUserRow(row) : undefined;
  }

  const row = requireSqliteDb()
    .prepare(
      `
        SELECT ${USER_SELECT_FIELDS}
        FROM users
        WHERE id = ?
      `,
    )
    .get(id) as Record<string, unknown> | undefined;
  return row ? normalizeUserRow(row) : undefined;
}

async function updateUserPasswordRecord(
  userId: number,
  passwordHash: string,
  passwordSalt: string,
): Promise<boolean> {
  if (pgPool) {
    const result = await pgPool.query(
      `
        UPDATE users
        SET password = $1, password_hash = $2, password_salt = $3
        WHERE id = $4
      `,
      [passwordHash, passwordHash, passwordSalt, userId],
    );
    return Number(result.rowCount ?? 0) > 0;
  }

  const result = requireSqliteDb()
    .prepare(
      `
        UPDATE users
        SET password_hash = ?, password_salt = ?
        WHERE id = ?
      `,
    )
    .run(passwordHash, passwordSalt, userId);
  return Number(result.changes ?? 0) > 0;
}

async function updateUserBanRecord(
  userId: number,
  isBanned: boolean,
  reason: string,
): Promise<boolean> {
  if (pgPool) {
    const result = await pgPool.query(
      `
        UPDATE users
        SET is_banned = $1, ban_reason = $2
        WHERE id = $3
      `,
      [isBanned, reason, userId],
    );
    return Number(result.rowCount ?? 0) > 0;
  }

  const result = requireSqliteDb()
    .prepare(
      `
        UPDATE users
        SET is_banned = ?, ban_reason = ?
        WHERE id = ?
      `,
    )
    .run(isBanned ? 1 : 0, reason, userId);
  return Number(result.changes ?? 0) > 0;
}

async function linkAuth0UserRecord(input: {
  userId: number;
  auth0Sub: string;
  name: string;
  picture: string;
}): Promise<boolean> {
  const normalizedName = input.name.trim();
  const normalizedPicture = input.picture.trim();

  if (pgPool) {
    const result = await pgPool.query(
      `
        UPDATE users
        SET
          auth0_sub = $1,
          name = CASE
            WHEN $2 <> '' AND (name IS NULL OR BTRIM(name) = '' OR LOWER(BTRIM(name)) = LOWER(BTRIM(email)))
              THEN $2
            ELSE name
          END,
          avatar_url = CASE
            WHEN $3 <> '' THEN $3
            ELSE avatar_url
          END
        WHERE id = $4
          AND (auth0_sub IS NULL OR auth0_sub = '' OR auth0_sub = $1)
      `,
      [input.auth0Sub, normalizedName, normalizedPicture, input.userId],
    );
    return Number(result.rowCount ?? 0) > 0;
  }

  const result = requireSqliteDb()
    .prepare(
      `
        UPDATE users
        SET
          auth0_sub = ?,
          name = CASE
            WHEN ? <> '' AND (name IS NULL OR TRIM(name) = '' OR LOWER(TRIM(name)) = LOWER(TRIM(email)))
              THEN ?
            ELSE name
          END,
          avatar_url = CASE
            WHEN ? <> '' THEN ?
            ELSE avatar_url
          END
        WHERE id = ?
          AND (auth0_sub IS NULL OR auth0_sub = '' OR auth0_sub = ?)
      `,
    )
    .run(
      input.auth0Sub,
      normalizedName,
      normalizedName,
      normalizedPicture,
      normalizedPicture,
      input.userId,
      input.auth0Sub,
    );
  return Number(result.changes ?? 0) > 0;
}

async function createAuth0UserRecord(input: {
  auth0Sub: string;
  email: string;
  name: string;
  picture: string;
}): Promise<number> {
  const credentials = createPasswordCredentials(crypto.randomBytes(24).toString("hex"));
  const normalizedEmail = normalizeEmail(input.email);
  const normalizedName =
    input.name.trim() || normalizedEmail.split("@")[0] || `user${Date.now()}`;
  const normalizedPicture = input.picture.trim();

  if (pgPool) {
    const result = await pgPool.query<{ id: number | string }>(
      `
        INSERT INTO users (
          name,
          username,
          email,
          auth0_sub,
          password,
          password_hash,
          password_salt,
          avatar_url
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `,
      [
        normalizedName,
        normalizedEmail,
        normalizedEmail,
        input.auth0Sub,
        credentials.hash,
        credentials.hash,
        credentials.salt,
        normalizedPicture,
      ],
    );
    return toRequiredNumber(result.rows[0]?.id);
  }

  const result = requireSqliteDb()
    .prepare(
      `
        INSERT INTO users (name, email, auth0_sub, password_hash, password_salt, avatar_url)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
    )
    .run(
      normalizedName,
      normalizedEmail,
      input.auth0Sub,
      credentials.hash,
      credentials.salt,
      normalizedPicture,
    );
  return Number(result.lastInsertRowid);
}

async function createUserRecord(
  name: string,
  email: string,
  passwordHash: string,
  passwordSalt: string,
): Promise<number> {
  if (pgPool) {
    const username = email;
    const legacyPassword = passwordHash;
    const result = await pgPool.query<{ id: number | string }>(
      `
        INSERT INTO users (name, username, email, password, password_hash, password_salt)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `,
      [name, username, email, legacyPassword, passwordHash, passwordSalt],
    );
    return toRequiredNumber(result.rows[0]?.id);
  }

  const result = requireSqliteDb()
    .prepare(
      `
        INSERT INTO users (name, email, password_hash, password_salt)
        VALUES (?, ?, ?, ?)
      `,
    )
    .run(name, email, passwordHash, passwordSalt);
  return Number(result.lastInsertRowid);
}

async function updateUserProfileRecord(input: UserProfileUpdateInput): Promise<void> {
  if (pgPool) {
    await pgPool.query(
      `
        UPDATE users
        SET
          name = $1,
          country = $2,
          state = $3,
          city = $4,
          neighborhood = $5,
          street = $6,
          whatsapp_country_iso = $7,
          whatsapp_number = $8
        WHERE id = $9
      `,
      [
        input.name,
        input.country,
        input.state,
        input.city,
        input.neighborhood,
        input.street,
        input.whatsapp_country_iso,
        input.whatsapp_number,
        input.id,
      ],
    );
    return;
  }

  requireSqliteDb()
    .prepare(
      `
        UPDATE users
        SET
          name = @name,
          country = @country,
          state = @state,
          city = @city,
          neighborhood = @neighborhood,
          street = @street,
          whatsapp_country_iso = @whatsapp_country_iso,
          whatsapp_number = @whatsapp_number
        WHERE id = @id
      `,
    )
    .run(input);
}

async function updateUserAvatarRecord(userId: number, avatarUrl: string): Promise<void> {
  if (pgPool) {
    await pgPool.query(
      `
        UPDATE users
        SET avatar_url = $1
        WHERE id = $2
      `,
      [avatarUrl, userId],
    );
    return;
  }

  requireSqliteDb()
    .prepare(
      `
        UPDATE users
        SET avatar_url = @avatar_url
        WHERE id = @id
      `,
    )
    .run({
      id: userId,
      avatar_url: avatarUrl,
    });
}

async function updateUserLocationRecord(
  userId: number,
  latitude: number,
  longitude: number,
): Promise<void> {
  if (pgPool) {
    await pgPool.query(
      `
        UPDATE users
        SET location_latitude = $1, location_longitude = $2
        WHERE id = $3
      `,
      [latitude, longitude, userId],
    );
    return;
  }

  requireSqliteDb()
    .prepare(
      `
        UPDATE users
        SET location_latitude = @location_latitude,
            location_longitude = @location_longitude
        WHERE id = @id
      `,
    )
    .run({
      id: userId,
      location_latitude: latitude,
      location_longitude: longitude,
    });
}

async function updateUserPreferredLocaleRecord(userId: number, locale: AppLocale): Promise<void> {
  if (pgPool) {
    await pgPool.query("UPDATE users SET preferred_locale = $1 WHERE id = $2", [locale, userId]);
    return;
  }

  requireSqliteDb()
    .prepare("UPDATE users SET preferred_locale = ? WHERE id = ?")
    .run(locale, userId);
}

async function selectUserNewProductDraftDefaultsRecord(
  userId: number,
): Promise<NewProductDraftDefaults> {
  if (pgPool) {
    const result = await pgPool.query<{ new_product_defaults: string | null }>(
      `
        SELECT new_product_defaults
        FROM users
        WHERE id = $1
      `,
      [userId],
    );
    const row = result.rows[0];
    return normalizeStoredNewProductDraftDefaults(row?.new_product_defaults ?? null);
  }

  const row = requireSqliteDb()
    .prepare(
      `
        SELECT new_product_defaults
        FROM users
        WHERE id = ?
      `,
    )
    .get(userId) as { new_product_defaults?: unknown } | undefined;

  return normalizeStoredNewProductDraftDefaults(row?.new_product_defaults ?? null);
}

async function updateUserNewProductDraftDefaultsRecord(
  userId: number,
  defaults: NewProductDraftDefaults,
): Promise<void> {
  const serializedDefaults = JSON.stringify(defaults);

  if (pgPool) {
    await pgPool.query(
      `
        UPDATE users
        SET new_product_defaults = $1
        WHERE id = $2
      `,
      [serializedDefaults, userId],
    );
    return;
  }

  requireSqliteDb()
    .prepare(
      `
        UPDATE users
        SET new_product_defaults = @new_product_defaults
        WHERE id = @id
      `,
    )
    .run({
      id: userId,
      new_product_defaults: serializedDefaults,
    });
}

async function selectVendorsRows(searchTerm: string, limit: number): Promise<VendorRow[]> {
  if (pgPool) {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const likeQuery = `%${normalizedSearch}%`;
    const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 100);
    const result = await pgPool.query<Record<string, unknown>>(
      `
        SELECT
          u.id,
          COALESCE(
            NULLIF(BTRIM(u.name), ''),
            NULLIF(BTRIM(u.username), ''),
            NULLIF(BTRIM(u.email), ''),
            CONCAT('Vendedor ', u.id::text)
          ) AS name,
          NULLIF(BTRIM(u.avatar_url), '') AS avatar_url,
          COUNT(p.id)::INT AS product_count
        FROM users u
        INNER JOIN products p ON p.user_id = u.id
        WHERE
          $1 = ''
          OR LOWER(COALESCE(NULLIF(BTRIM(u.name), ''), '')) LIKE $2
          OR LOWER(COALESCE(NULLIF(BTRIM(u.username), ''), '')) LIKE $2
          OR LOWER(COALESCE(NULLIF(BTRIM(u.email), ''), '')) LIKE $2
        GROUP BY u.id, u.name, u.username, u.email, u.avatar_url
        ORDER BY product_count DESC, u.id DESC
        LIMIT $3
      `,
      [normalizedSearch, likeQuery, safeLimit],
    );
    return result.rows.map(normalizeVendorRow);
  }

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const likeQuery = `%${normalizedSearch}%`;
  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 100);
  const rows = requireSqliteDb()
    .prepare(
      `
        SELECT
          u.id,
          COALESCE(NULLIF(TRIM(u.name), ''), NULLIF(TRIM(u.email), ''), 'Vendedor') AS name,
          NULLIF(TRIM(u.avatar_url), '') AS avatar_url,
          COUNT(p.id) AS product_count
        FROM users u
        INNER JOIN products p ON p.user_id = u.id
        WHERE
          ? = ''
          OR LOWER(COALESCE(NULLIF(TRIM(u.name), ''), '')) LIKE ?
          OR LOWER(COALESCE(NULLIF(TRIM(u.email), ''), '')) LIKE ?
        GROUP BY u.id, u.name, u.email, u.avatar_url
        ORDER BY product_count DESC, u.id DESC
        LIMIT ?
      `,
    )
    .all(normalizedSearch, likeQuery, likeQuery, safeLimit) as Array<Record<string, unknown>>;
  return rows.map(normalizeVendorRow);
}

async function createSessionRecord(userId: number, tokenHash: string, expiresAt: number): Promise<void> {
  if (pgPool) {
    await pgPool.query(
      `
        INSERT INTO sessions (user_id, token_hash, expires_at)
        VALUES ($1, $2, $3)
      `,
      [userId, tokenHash, expiresAt],
    );
    return;
  }

  requireSqliteDb()
    .prepare(
      `
        INSERT INTO sessions (user_id, token_hash, expires_at)
        VALUES (?, ?, ?)
      `,
    )
    .run(userId, tokenHash, expiresAt);
}

async function deleteSessionByTokenHashRecord(tokenHash: string): Promise<void> {
  if (pgPool) {
    await pgPool.query("DELETE FROM sessions WHERE token_hash = $1", [tokenHash]);
    return;
  }

  requireSqliteDb()
    .prepare(
      `
        DELETE FROM sessions
        WHERE token_hash = ?
      `,
    )
    .run(tokenHash);
}

async function deleteSessionsByUserIdRecord(userId: number): Promise<void> {
  if (pgPool) {
    await pgPool.query("DELETE FROM sessions WHERE user_id = $1", [userId]);
    return;
  }

  requireSqliteDb()
    .prepare(
      `
        DELETE FROM sessions
        WHERE user_id = ?
      `,
    )
    .run(userId);
}

async function deleteExpiredSessionsRecords(): Promise<void> {
  if (IS_DEV_REMOTE_READ_ONLY) {
    return;
  }

  if (pgPool) {
    await pgPool.query(
      "DELETE FROM sessions WHERE expires_at <= EXTRACT(EPOCH FROM NOW())::BIGINT",
    );
    return;
  }

  requireSqliteDb()
    .prepare(
      `
        DELETE FROM sessions
        WHERE expires_at <= strftime('%s', 'now')
      `,
    )
    .run();
}

async function selectSessionUserByTokenHashRow(
  tokenHash: string,
): Promise<SessionUserRow | undefined> {
  if (pgPool) {
    const result = await pgPool.query<Record<string, unknown>>(
      `
        SELECT ${SESSION_USER_SELECT_FIELDS}
        FROM sessions s
        INNER JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = $1 AND s.expires_at > EXTRACT(EPOCH FROM NOW())::BIGINT
      `,
      [tokenHash],
    );
    const row = result.rows[0];
    return row ? normalizeSessionUserRow(row) : undefined;
  }

  const row = requireSqliteDb()
    .prepare(
      `
        SELECT ${SESSION_USER_SELECT_FIELDS}
        FROM sessions s
        INNER JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ? AND s.expires_at > strftime('%s', 'now')
      `,
    )
    .get(tokenHash) as Record<string, unknown> | undefined;
  return row ? normalizeSessionUserRow(row) : undefined;
}

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizeImages(images: unknown, fallbackImage: string): string[] {
  if (Array.isArray(images)) {
    const cleaned = images
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);

    if (cleaned.length > 0) {
      return cleaned;
    }
  }

  const image = fallbackImage.trim();
  return image ? [image] : [DEFAULT_IMAGE];
}

function rowToProduct(row: ProductRow, locale?: AppLocale): ProductRecord {
  const images = safeJsonParse<string[]>(row.images, []);
  const details = safeJsonParse<Record<string, string>>(row.details, {});

  const product: ProductRecord = {
    id: row.id,
    name: locale ? getLocalizedText(row.name, row.name_translations, locale) : row.name,
    category: row.category,
    clickCount: toRequiredNonNegativeInteger(row.click_count, 0),
    price: toBooleanValue(row.price_negotiable, false)
      ? NEGOTIABLE_PRICE_STORAGE_VALUE
      : String(row.price ?? ""),
    priceNegotiable: toBooleanValue(row.price_negotiable, false),
    quantity: row.quantity,
    image: row.image,
    images: images.length > 0 ? images : [row.image || DEFAULT_IMAGE],
    description: locale
      ? getLocalizedText(row.description ?? "", row.description_translations, locale)
      : (row.description ?? ""),
    details,
  };

  if (row.slug) {
    product.slug = row.slug;
  }

  if (row.user_id !== null) {
    product.ownerId = row.user_id;
  }
  if (row.latitude !== null) {
    product.latitude = row.latitude;
  }
  if (row.longitude !== null) {
    product.longitude = row.longitude;
  }
  if (row.city) {
    product.city = row.city;
  }
  if (row.seller_name) {
    product.sellerName = row.seller_name;
  }
  if (row.seller_whatsapp_country_iso) {
    product.sellerWhatsappCountryIso = row.seller_whatsapp_country_iso;
  }
  if (row.seller_whatsapp_number) {
    product.sellerWhatsappNumber = row.seller_whatsapp_number;
  }

  return product;
}

function rowToAdminProduct(row: ProductRow): AdminProductRecord {
  const product = rowToProduct(row) as AdminProductRecord;
  const owner: NonNullable<AdminProductRecord["owner"]> = {};

  if (row.user_id !== null) {
    owner.id = row.user_id;
  }
  if (row.seller_name) {
    owner.name = row.seller_name;
  }
  if (row.seller_email) {
    owner.email = row.seller_email;
  }
  if (row.seller_country) {
    owner.country = row.seller_country;
  }
  if (row.seller_state) {
    owner.state = row.seller_state;
  }
  if (row.city) {
    owner.city = row.city;
  }
  if (row.seller_whatsapp_country_iso) {
    owner.whatsappCountryIso = row.seller_whatsapp_country_iso;
  }
  if (row.seller_whatsapp_number) {
    owner.whatsappNumber = row.seller_whatsapp_number;
  }

  if (Object.keys(owner).length > 0) {
    product.owner = owner;
  }

  return product;
}

function rowToProductComment(
  row: ProductCommentRow,
  locale?: AppLocale,
): ProductCommentRecord {
  const normalized: ProductCommentRecord = {
    id: row.id,
    productId: row.product_id,
    userId: row.user_id,
    body: locale ? getLocalizedText(row.body, row.body_translations, locale) : row.body,
    createdAt: row.created_at,
    authorName: row.author_name.trim() || `Usuário ${row.user_id}`,
    authorAvatarUrl: row.author_avatar_url ?? "",
    replies: [],
  };

  if (row.parent_comment_id !== null) {
    normalized.parentCommentId = row.parent_comment_id;
  }
  if (row.rating !== null) {
    normalized.rating = row.rating;
  }

  return normalized;
}

function buildProductCommentsThread(
  rows: ProductCommentRow[],
  locale?: AppLocale,
): ProductCommentRecord[] {
  const commentsById = new globalThis.Map<number, ProductCommentRecord>();
  const topLevelComments: ProductCommentRecord[] = [];

  for (const row of rows) {
    commentsById.set(row.id, rowToProductComment(row, locale));
  }

  for (const row of rows) {
    const currentComment = commentsById.get(row.id);
    if (!currentComment) {
      continue;
    }

    if (row.parent_comment_id === null) {
      topLevelComments.push(currentComment);
      continue;
    }

    const parentComment = commentsById.get(row.parent_comment_id);
    if (!parentComment) {
      topLevelComments.push(currentComment);
      continue;
    }
    parentComment.replies.push(currentComment);
  }

  const sortByNewest = (left: ProductCommentRecord, right: ProductCommentRecord) => {
    if (right.createdAt !== left.createdAt) {
      return right.createdAt - left.createdAt;
    }
    return right.id - left.id;
  };
  const sortByOldest = (left: ProductCommentRecord, right: ProductCommentRecord) => {
    if (left.createdAt !== right.createdAt) {
      return left.createdAt - right.createdAt;
    }
    return left.id - right.id;
  };

  const sortRecursively = (comments: ProductCommentRecord[]) => {
    comments.forEach((comment) => {
      if (comment.replies.length > 0) {
        comment.replies.sort(sortByOldest);
        sortRecursively(comment.replies);
      }
    });
  };

  topLevelComments.sort(sortByNewest);
  sortRecursively(topLevelComments);
  return topLevelComments;
}

function rowToPublicVendor(row: VendorRow): PublicVendorRecord {
  return {
    id: row.id,
    name: row.name || `Vendedor ${row.id}`,
    avatarUrl: row.avatar_url ?? "",
    productCount: row.product_count,
  };
}

function rowToNotification(row: NotificationEventRow): NotificationRecord {
  const actorName = row.actor_name.trim() || "Alguém";
  const productName = row.product_name.trim() || "seu anúncio";
  const createdAt = Number.isFinite(row.created_at)
    ? row.created_at
    : Math.floor(Date.now() / 1000);
  if (row.type === "admin_broadcast") {
    const recipientLocale = normalizeAppLocale(row.recipient_locale) ?? DEFAULT_APP_LOCALE;
    const title = getLocalizedText(actorName || "TempleSale", row.title_translations, recipientLocale);
    const message = getLocalizedText(
      productName || "Atualização TempleSale",
      row.message_translations,
      recipientLocale,
    );
    const normalized: NotificationRecord = {
      id: row.event_id,
      type: row.type,
      title,
      message,
      createdAt,
      actorName: "TempleSale",
    };
    if (row.product_id) {
      normalized.productId = row.product_id;
      normalized.productName = productName;
    }
    if (row.product_image_url) {
      normalized.productImageUrl = row.product_image_url;
    }
    return normalized;
  }

  const isProductCommentReply = row.event_id.startsWith("product_comment_reply:");
  const title =
    row.type === "product_cart_interest"
      ? "Novo interesse no carrinho"
      : row.type === "product_comment"
        ? isProductCommentReply
          ? "Resposta do dono do anúncio"
          : "Novo comentário na publicação"
        : "Nova curtida";
  const message =
    row.type === "product_cart_interest"
      ? `${actorName} adicionou seu anúncio "${productName}" ao carrinho.`
      : row.type === "product_comment"
        ? isProductCommentReply
          ? `${actorName} respondeu seu comentário em "${productName}".`
          : `${actorName} comentou na sua publicação "${productName}".`
        : `${actorName} curtiu seu anúncio "${productName}".`;

  const normalized: NotificationRecord = {
    id: row.event_id,
    type: row.type,
    title,
    message,
    createdAt,
    actorName,
    productName,
  };

  if (row.product_id) {
    normalized.productId = row.product_id;
  }
  if (row.product_image_url) {
    normalized.productImageUrl = row.product_image_url;
  }

  if (row.actor_user_id !== null) {
    normalized.actorUserId = row.actor_user_id;
  }
  if (row.actor_avatar_url) {
    normalized.actorAvatarUrl = row.actor_avatar_url;
  }
  if (row.actor_city) {
    normalized.actorCity = row.actor_city;
  }
  if (row.actor_country) {
    normalized.actorCountry = row.actor_country;
  }
  if (row.comment_id !== null) {
    normalized.commentId = row.comment_id;
  }

  return normalized;
}

function parseIncomingPriceToNumber(rawValue: unknown): number | null {
  const value = String(rawValue ?? "").trim();
  if (!value) {
    return null;
  }
  if (isNegotiablePriceValue(value)) {
    return null;
  }

  const cleaned = value.replace(/[^\d,.-]/g, "");
  if (!cleaned) {
    return null;
  }

  const commaCount = (cleaned.match(/,/g) ?? []).length;
  const dotCount = (cleaned.match(/\./g) ?? []).length;

  let normalized = cleaned;

  if (commaCount > 0 && dotCount > 0) {
    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");
    const decimalSeparator = lastComma > lastDot ? "," : ".";

    if (decimalSeparator === ",") {
      normalized = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = cleaned.replace(/,/g, "");
    }
  } else if (commaCount > 0) {
    const lastComma = cleaned.lastIndexOf(",");
    const fractionLength = cleaned.length - lastComma - 1;
    normalized =
      fractionLength > 0 && fractionLength <= 2
        ? cleaned.replace(/\./g, "").replace(",", ".")
        : cleaned.replace(/,/g, "");
  } else if (dotCount > 0) {
    const lastDot = cleaned.lastIndexOf(".");
    const fractionLength = cleaned.length - lastDot - 1;
    normalized =
      fractionLength > 0 && fractionLength <= 2
        ? cleaned.replace(/,/g, "")
        : cleaned.replace(/\./g, "");
  }

  const parsed = Number(normalized);
  if (Number.isFinite(parsed)) {
    return parsed;
  }

  const digits = value.replace(/\D/g, "");
  if (!digits) {
    return null;
  }

  const fallback = Number(digits) / 100;
  return Number.isFinite(fallback) ? fallback : null;
}

type NormalizedIncomingPrice = {
  price: string;
  priceNegotiable: boolean;
};

function normalizeIncomingPrice(rawPrice: unknown, rawPriceNegotiable: unknown): NormalizedIncomingPrice {
  const isNegotiable =
    toBooleanValue(rawPriceNegotiable, false) || isNegotiablePriceValue(rawPrice);
  if (isNegotiable) {
    return {
      price: "0.00",
      priceNegotiable: true,
    };
  }

  const parsed = parseIncomingPriceToNumber(rawPrice);
  if (parsed === null) {
    throw new Error("Preço é obrigatório.");
  }
  if (parsed <= 0) {
    throw new Error("Preço deve ser maior que zero.");
  }

  return {
    price: parsed.toFixed(2),
    priceNegotiable: false,
  };
}

function normalizeIncomingQuantity(rawValue: unknown): number {
  const normalizedRaw = String(rawValue ?? "").trim();
  if (!normalizedRaw) {
    return 1;
  }

  const parsed = Number(normalizedRaw);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    throw new Error("Quantidade inválida.");
  }
  if (parsed < 0) {
    throw new Error("Quantidade não pode ser negativa.");
  }
  if (parsed > 999999) {
    throw new Error("Quantidade muito alta.");
  }
  return parsed;
}

function normalizeIncomingProduct(payload: unknown): NormalizedProductInput {
  if (!payload || typeof payload !== "object") {
    throw new Error("Payload inválido.");
  }

  const body = payload as Record<string, unknown>;
  const name = String(body.name ?? "").trim();
  const category = String(body.category ?? "").trim();
  const normalizedPrice = normalizeIncomingPrice(
    body.price,
    body.priceNegotiable ?? body.price_negotiable,
  );
  const quantity = normalizeIncomingQuantity(body.quantity);
  const rawImage = String(body.image ?? "").trim();
  const images = normalizeImages(body.images, rawImage || DEFAULT_IMAGE);
  const image = rawImage || images[0] || DEFAULT_IMAGE;
  const description = String(body.description ?? "").trim();
  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);
  const details =
    body.details && typeof body.details === "object"
      ? (body.details as Record<string, string>)
      : {};

  if (!name) {
    throw new Error("Nome do produto é obrigatório.");
  }
  if (!category) {
    throw new Error("Categoria é obrigatória.");
  }
  if (!description) {
    throw new Error("Descrição é obrigatória.");
  }
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("Latitude e longitude são obrigatórias.");
  }
  if (latitude < -90 || latitude > 90) {
    throw new Error("Latitude deve estar entre -90 e 90.");
  }
  if (longitude < -180 || longitude > 180) {
    throw new Error("Longitude deve estar entre -180 e 180.");
  }

  return {
    name,
    category,
    price: normalizedPrice.price,
    priceNegotiable: normalizedPrice.priceNegotiable,
    quantity,
    image,
    images: JSON.stringify(images),
    description,
    details: JSON.stringify(details),
    latitude,
    longitude,
  };
}

function toOptionalPositiveInteger(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function normalizeIncomingProductCommentBody(value: unknown): string {
  const body = String(value ?? "").trim();
  if (!body) {
    throw new Error("Comentário é obrigatório.");
  }
  if (body.length > PRODUCT_COMMENT_MAX_BODY_LENGTH) {
    throw new Error(
      `Comentário deve ter no máximo ${PRODUCT_COMMENT_MAX_BODY_LENGTH} caracteres.`,
    );
  }
  return body;
}

function normalizeIncomingProductCommentRating(value: unknown, required: boolean): number | null {
  const optionalRating = toOptionalPositiveInteger(value);
  if (optionalRating === null) {
    if (required) {
      throw new Error("Avaliação em estrelas é obrigatória.");
    }
    return null;
  }

  if (
    optionalRating < PRODUCT_COMMENT_MIN_RATING ||
    optionalRating > PRODUCT_COMMENT_MAX_RATING
  ) {
    throw new Error(
      `Avaliação deve estar entre ${PRODUCT_COMMENT_MIN_RATING} e ${PRODUCT_COMMENT_MAX_RATING}.`,
    );
  }
  return optionalRating;
}

function createEmptyNewProductDraftDefaults(): NewProductDraftDefaults {
  return {
    name: "",
    category: "",
    latitude: "",
    longitude: "",
    description: "",
    details: {},
  };
}

function normalizeDraftCoordinate(
  value: unknown,
  fieldName: string,
  min: number,
  max: number,
  strict: boolean,
): string {
  const normalizedValue = String(value ?? "").trim().replace(",", ".");
  if (!normalizedValue) {
    return "";
  }

  const parsed = Number(normalizedValue);
  if (!Number.isFinite(parsed)) {
    if (!strict) {
      return "";
    }
    throw new Error(`${fieldName} inválida.`);
  }

  if (parsed < min || parsed > max) {
    if (!strict) {
      return "";
    }
    throw new Error(`${fieldName} deve estar entre ${min} e ${max}.`);
  }

  return parsed.toFixed(6);
}

function normalizeDraftTextField(
  value: unknown,
  fieldName: string,
  maxLength: number,
  strict: boolean,
): string {
  const normalized = String(value ?? "").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  if (!strict) {
    return normalized.slice(0, maxLength).trim();
  }
  throw new Error(`${fieldName} deve ter no maximo ${maxLength} caracteres.`);
}

function normalizeNewProductDraftDefaultsPayload(
  payload: unknown,
  strict: boolean,
): NewProductDraftDefaults {
  const fallback = createEmptyNewProductDraftDefaults();
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    if (!strict) {
      return fallback;
    }
    throw new Error("Payload de preferências do anúncio inválido.");
  }

  const body = payload as Record<string, unknown>;
  const name = normalizeDraftTextField(body.name ?? "", "Nome", 120, strict);
  const category = normalizeDraftTextField(body.category ?? "", "Categoria", 120, strict);
  const description = normalizeDraftTextField(body.description ?? "", "Descrição", 2500, strict);
  const latitude = normalizeDraftCoordinate(body.latitude, "Latitude", -90, 90, strict);
  const longitude = normalizeDraftCoordinate(body.longitude, "Longitude", -180, 180, strict);

  const details = (() => {
    const rawDetails = body.details;
    if (rawDetails === null || rawDetails === undefined) {
      return {};
    }
    if (!rawDetails || typeof rawDetails !== "object" || Array.isArray(rawDetails)) {
      if (!strict) {
        return {};
      }
      throw new Error("Detalhes do rascunho inválidos.");
    }

    const normalizedDetails: Record<string, string> = {};
    for (const [rawKey, rawValue] of Object.entries(rawDetails)) {
      if (Object.keys(normalizedDetails).length >= NEW_PRODUCT_DRAFT_MAX_DETAILS) {
        break;
      }

      const key = String(rawKey ?? "").trim().toLowerCase();
      if (!key || !NEW_PRODUCT_DRAFT_ALLOWED_DETAIL_KEYS.has(key)) {
        continue;
      }

      const value = normalizeDraftTextField(rawValue ?? "", `Detalhe "${key}"`, 250, strict);
      if (!value) {
        continue;
      }
      normalizedDetails[key] = value;
    }

    return normalizedDetails;
  })();

  return {
    name,
    category,
    latitude,
    longitude,
    description,
    details,
  };
}

function normalizeStoredNewProductDraftDefaults(value: unknown): NewProductDraftDefaults {
  const parsedValue =
    typeof value === "string" ? safeJsonParse<unknown>(value, null) : value;
  return normalizeNewProductDraftDefaultsPayload(parsedValue, false);
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeTextField(value: unknown, fieldName: string, maxLength: number): string {
  const normalized = String(value ?? "").trim();
  if (normalized.length > maxLength) {
    throw new Error(`${fieldName} deve ter no maximo ${maxLength} caracteres.`);
  }
  return normalized;
}

function normalizeAvatarUrl(value: unknown): string {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return "";
  }
  if (normalized.length > 1200) {
    throw new Error("URL da foto de perfil muito longa.");
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(normalized);
  } catch {
    throw new Error("URL da foto de perfil inválida.");
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error("URL da foto de perfil inválida.");
  }

  return parsedUrl.toString();
}

function normalizeWhatsappCountryIso(value: unknown): WhatsappCountryIso {
  const normalized = String(value ?? "IT").trim().toUpperCase();
  if (normalized in WHATSAPP_COUNTRIES) {
    return normalized as WhatsappCountryIso;
  }
  throw new Error("Pais do WhatsApp invalido.");
}

function normalizeWhatsappNumber(value: unknown, countryIso: WhatsappCountryIso): string {
  let digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) {
    return "";
  }

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  const dialDigits = WHATSAPP_COUNTRIES[countryIso].dialDigits;
  const withoutCountryPrefix =
    digits.startsWith(dialDigits) && digits.length > dialDigits.length + 5
      ? digits.slice(dialDigits.length)
      : digits;

  if (withoutCountryPrefix.length < 6 || withoutCountryPrefix.length > 15) {
    throw new Error("Numero de WhatsApp invalido.");
  }

  return withoutCountryPrefix;
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function createPasswordCredentials(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = hashPassword(password, salt);
  return { salt, hash };
}

function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  const calculatedHash = hashPassword(password, salt);
  const calculatedBuffer = Buffer.from(calculatedHash, "hex");
  const storedBuffer = Buffer.from(storedHash, "hex");

  if (calculatedBuffer.length !== storedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(calculatedBuffer, storedBuffer);
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function decodeBase64UrlJson(value: string): Record<string, unknown> {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  const decoded = Buffer.from(padded, "base64").toString("utf8");
  const parsed = JSON.parse(decoded) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Token Auth0 inválido.");
  }
  return parsed as Record<string, unknown>;
}

function extractBearerToken(req: Request): string {
  const authorizationHeader = getRequestHeaderTokenValue(req.headers.authorization);
  if (!authorizationHeader.toLowerCase().startsWith("bearer ")) {
    return "";
  }
  return authorizationHeader.slice(7).trim();
}

async function fetchAuth0Jwks(): Promise<Auth0JsonWebKey[]> {
  if (!AUTH0_JWKS_URL) {
    throw new Error("Auth0 não configurado no backend.");
  }

  const now = Date.now();
  if (auth0JwksCache && now - auth0JwksCache.fetchedAt < AUTH0_JWKS_CACHE_TTL_MS) {
    return auth0JwksCache.keys;
  }

  const response = await fetch(AUTH0_JWKS_URL, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error("Falha ao carregar chaves públicas do Auth0.");
  }

  const payload = (await response.json()) as { keys?: Auth0JsonWebKey[] };
  const keys = Array.isArray(payload.keys) ? payload.keys : [];
  auth0JwksCache = { fetchedAt: now, keys };
  return keys;
}

function validateAuth0Claims(claims: Auth0JwtClaims, expectedAudience: string) {
  const now = Math.floor(Date.now() / 1000);
  if (!claims.sub) {
    throw new Error("Token Auth0 sem identificador.");
  }
  if (claims.iss !== AUTH0_ISSUER) {
    throw new Error("Emissor Auth0 inválido.");
  }
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud].filter(Boolean);
  if (!expectedAudience || !audiences.includes(expectedAudience)) {
    throw new Error("Audiência Auth0 inválida.");
  }
  if (typeof claims.exp !== "number" || claims.exp <= now) {
    throw new Error("Token Auth0 expirado.");
  }
  if (typeof claims.nbf === "number" && claims.nbf > now + 60) {
    throw new Error("Token Auth0 ainda não é válido.");
  }
}

function decodeAuth0ClaimsUnsafe(token: string): Partial<Auth0JwtClaims> | null {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  try {
    return decodeBase64UrlJson(parts[1]) as Partial<Auth0JwtClaims>;
  } catch {
    return null;
  }
}

function getAuth0SyncErrorCode(message: string): string {
  if (message.includes("Emissor")) {
    return "invalid_issuer";
  }
  if (message.includes("Audiência")) {
    return "invalid_audience";
  }
  if (message.includes("Chave")) {
    return "jwks_key_not_found";
  }
  if (message.includes("Assinatura")) {
    return "invalid_signature";
  }
  if (message.includes("expirado")) {
    return "token_expired";
  }
  if (message.includes("não configurado")) {
    return "backend_auth0_not_configured";
  }
  if (message.includes("perfil")) {
    return "profile_token_mismatch";
  }
  return "auth0_sync_failed";
}

async function verifyAuth0Jwt(
  token: string,
  expectedAudience = AUTH0_EXPECTED_AUDIENCE,
): Promise<Auth0JwtClaims> {
  if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID) {
    throw new Error("Auth0 não configurado no backend.");
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Token Auth0 inválido.");
  }

  const header = decodeBase64UrlJson(parts[0]);
  const claims = decodeBase64UrlJson(parts[1]) as Auth0JwtClaims;
  const alg = String(header.alg ?? "");
  const kid = String(header.kid ?? "");
  if (alg !== "RS256" || !kid) {
    throw new Error("Assinatura Auth0 inválida.");
  }

  const keys = await fetchAuth0Jwks();
  const jwk = keys.find((key) => key.kid === kid && (key.use === "sig" || !key.use));
  if (!jwk) {
    auth0JwksCache = null;
    throw new Error("Chave Auth0 não encontrada.");
  }

  const verifier = crypto.createVerify("RSA-SHA256");
  verifier.update(`${parts[0]}.${parts[1]}`);
  verifier.end();
  const publicKey = crypto.createPublicKey({ key: jwk, format: "jwk" });
  const signature = Buffer.from(
    parts[2].replace(/-/g, "+").replace(/_/g, "/").padEnd(
      parts[2].length + ((4 - (parts[2].length % 4)) % 4),
      "=",
    ),
    "base64",
  );
  if (!verifier.verify(publicKey, signature)) {
    throw new Error("Assinatura Auth0 inválida.");
  }

  validateAuth0Claims(claims, expectedAudience);
  return claims;
}

function decodeHeaderFilename(value: string | undefined): string {
  if (!value) {
    return "";
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function buildCloudinarySignature(
  params: Record<string, string | number>,
  apiSecret: string,
): string {
  const toSign = Object.entries(params)
    .filter(([, value]) => value !== "")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return crypto
    .createHash("sha1")
    .update(`${toSign}${apiSecret}`)
    .digest("hex");
}

function assertCloudinaryConfig() {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error(
      "Cloudinary não configurado. Defina CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET.",
    );
  }
}

type CloudinaryUploadedImage = {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
};

function parseIncomingImageUpload(req: Request): {
  contentType: string;
  payload: Buffer;
  safeFilename: string;
} {
  const rawContentType = String(req.headers["content-type"] ?? "");
  const contentType = rawContentType.split(";")[0]?.trim().toLowerCase();
  if (!contentType.startsWith("image/")) {
    throw new Error("Arquivo inválido. Envie uma imagem.");
  }

  const payload = req.body;
  if (!Buffer.isBuffer(payload) || payload.length === 0) {
    throw new Error("Arquivo de imagem não encontrado.");
  }

  const rawFilename = decodeHeaderFilename(req.header("x-file-name"));
  const safeFilename =
    rawFilename && rawFilename.length < 200
      ? rawFilename
      : `upload-${Date.now()}.${contentType.slice("image/".length) || "jpg"}`;

  return {
    contentType,
    payload,
    safeFilename,
  };
}

async function uploadImageToCloudinary(
  options: {
    payload: Buffer;
    contentType: string;
    safeFilename: string;
    folder: string;
    publicIdPrefix: string;
  },
): Promise<CloudinaryUploadedImage> {
  assertCloudinaryConfig();

  const timestamp = Math.floor(Date.now() / 1000);
  const uniqueSuffix = crypto.randomBytes(6).toString("hex");
  const publicId = `${options.publicIdPrefix}_${Date.now()}_${uniqueSuffix}`;
  const folder = options.folder;

  const signature = buildCloudinarySignature(
    {
      folder,
      public_id: publicId,
      timestamp,
    },
    CLOUDINARY_API_SECRET,
  );

  const formData = new FormData();
  formData.append(
    "file",
    new Blob([new Uint8Array(options.payload)], { type: options.contentType }),
    options.safeFilename,
  );
  formData.append("api_key", CLOUDINARY_API_KEY);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("folder", folder);
  formData.append("public_id", publicId);

  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  const uploadText = await uploadResponse.text();
  let uploadJson: Record<string, unknown> = {};
  try {
    uploadJson = JSON.parse(uploadText) as Record<string, unknown>;
  } catch {
    uploadJson = {};
  }

  if (!uploadResponse.ok) {
    const cloudinaryError =
      typeof uploadJson.error === "object" && uploadJson.error
        ? String((uploadJson.error as Record<string, unknown>).message ?? "").trim()
        : "";
    throw new Error(cloudinaryError || "Falha ao enviar imagem para o Cloudinary.");
  }

  const secureUrl = String(uploadJson.secure_url ?? "").trim();
  if (!secureUrl) {
    throw new Error("Cloudinary não retornou a URL da imagem.");
  }

  return {
    url: secureUrl.replace(/\/image\/upload\//i, "/image/upload/f_auto,q_auto,c_limit,w_1600/"),
    publicId: String(uploadJson.public_id ?? publicId),
    width: Number(uploadJson.width ?? 0) || undefined,
    height: Number(uploadJson.height ?? 0) || undefined,
  };
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  const parsed: Record<string, string> = {};
  for (const entry of cookieHeader.split(";")) {
    const [key, ...valueParts] = entry.trim().split("=");
    if (!key) {
      continue;
    }
    parsed[key] = decodeURIComponent(valueParts.join("="));
  }

  return parsed;
}

function visitorTrackingCookieOptions(isProduction: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction,
    path: "/",
    maxAge: VISITOR_TRACKING_COOKIE_MAX_AGE_SECONDS * 1000,
  };
}

function setVisitorTrackingCookie(res: Response, token: string, isProduction: boolean) {
  res.cookie(VISITOR_TRACKING_COOKIE_NAME, token, visitorTrackingCookieOptions(isProduction));
}

function getVisitorTrackingCookieTokenFromRequest(req: Request): string {
  const cookies = parseCookies(req.headers.cookie);
  return normalizeVisitorTrackingCookieToken(cookies[VISITOR_TRACKING_COOKIE_NAME]);
}

function resolveVisitorTrackingCookieToken(
  req: Request,
  res: Response | undefined,
  isProduction: boolean,
): string {
  const existingToken = getVisitorTrackingCookieTokenFromRequest(req);
  if (existingToken) {
    return existingToken;
  }

  const newToken = createVisitorTrackingCookieToken();
  if (res) {
    setVisitorTrackingCookie(res, newToken, isProduction);
  }
  return newToken;
}

function getSessionTokenFromRequest(req: Request): string | null {
  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies[SESSION_COOKIE_NAME];
  if (cookieToken) {
    return cookieToken.trim();
  }

  const headerToken = getRequestHeaderTokenValue(req.headers["x-auth-token"]);
  if (headerToken) {
    return headerToken;
  }

  const authorizationHeader = getRequestHeaderTokenValue(req.headers.authorization);
  if (authorizationHeader.toLowerCase().startsWith("bearer ")) {
    const token = authorizationHeader.slice(7).trim();
    return token || null;
  }

  return null;
}

function getRequestHeaderTokenValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return String(value[0] ?? "").trim();
  }
  return String(value ?? "").trim();
}

function createAdminSessionToken(): string {
  const expiresAt = Math.floor(Date.now() / 1000) + ADMIN_SESSION_TTL_SECONDS;
  const nonce = crypto.randomBytes(16).toString("hex");
  const payload = `${expiresAt}.${nonce}`;
  const signature = crypto
    .createHmac("sha256", ADMIN_SESSION_SECRET)
    .update(payload)
    .digest("hex");
  return `${payload}.${signature}`;
}

function verifyAdminSessionToken(token: string): boolean {
  const [expiresAtRaw, nonce, signature] = token.split(".");
  if (!expiresAtRaw || !nonce || !signature) {
    return false;
  }
  if (!/^\d+$/.test(expiresAtRaw)) {
    return false;
  }
  if (!/^[a-f0-9]{32}$/i.test(nonce) || !/^[a-f0-9]{64}$/i.test(signature)) {
    return false;
  }

  const payload = `${expiresAtRaw}.${nonce}`;
  const expectedSignature = crypto
    .createHmac("sha256", ADMIN_SESSION_SECRET)
    .update(payload)
    .digest("hex");
  const providedBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");
  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }
  if (!crypto.timingSafeEqual(providedBuffer, expectedBuffer)) {
    return false;
  }

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt)) {
    return false;
  }

  return expiresAt > Math.floor(Date.now() / 1000);
}

function verifyAdminAccessToken(token: string): boolean {
  if (verifyAdminSessionToken(token)) {
    return true;
  }

  return ADMIN_API_KEY_CANDIDATES.some((candidate) => timingSafeEquals(token, candidate));
}

function getAdminSessionTokenFromRequest(req: Request): string | null {
  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies[ADMIN_SESSION_COOKIE_NAME];
  if (cookieToken) {
    return cookieToken.trim();
  }

  const headerToken = getRequestHeaderTokenValue(req.headers["x-admin-token"]);
  if (headerToken) {
    return headerToken;
  }

  const headerAuthToken = getRequestHeaderTokenValue(req.headers["x-admin-auth"]);
  if (headerAuthToken) {
    return headerAuthToken;
  }

  const authorizationHeader = getRequestHeaderTokenValue(req.headers.authorization);
  if (authorizationHeader.toLowerCase().startsWith("bearer ")) {
    const token = authorizationHeader.slice(7).trim();
    return token || null;
  }

  return null;
}

function isSensitivePublicPath(pathname: string): boolean {
  return SENSITIVE_PUBLIC_PATH_PATTERNS.some((pattern) => pattern.test(pathname));
}

function buildSecurityTxtContent(): string {
  const expiresDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
  const expires = expiresDate.toISOString().replace(/\.\d{3}Z$/, "Z");
  const contact = SECURITY_CONTACT_EMAIL.includes(":")
    ? SECURITY_CONTACT_EMAIL
    : `mailto:${SECURITY_CONTACT_EMAIL}`;

  return [
    `Contact: ${contact}`,
    "Preferred-Languages: pt-BR, en",
    "Canonical: https://www.templesale.com/.well-known/security.txt",
    `Policy: ${SECURITY_POLICY_URL}`,
    `Expires: ${expires}`,
  ].join("\n");
}

function normalizeSecurityMonitorPath(rawUrl: string): string {
  const normalizedRaw = String(rawUrl ?? "").trim();
  if (!normalizedRaw) {
    return "/";
  }

  try {
    const parsed = new URL(normalizedRaw, "http://localhost");
    return parsed.pathname || "/";
  } catch {
    const fallback = normalizedRaw.split("?")[0]?.trim();
    return fallback || "/";
  }
}

function getRequestIp(req: Request): string {
  const forwarded = String(req.headers["x-forwarded-for"] ?? "").trim();
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  const realIp = String(req.headers["x-real-ip"] ?? "").trim();
  if (realIp) {
    return realIp;
  }

  const ip = String(req.ip ?? req.socket?.remoteAddress ?? "").trim();
  return ip || "unknown";
}

function truncateSecurityMonitorText(value: unknown, maxLength: number): string {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(1, maxLength - 3))}...`;
}

function selectHigherSecurityLevel(
  current: SecurityMonitorLevel,
  next: SecurityMonitorLevel,
): SecurityMonitorLevel {
  const levelWeight: Record<SecurityMonitorLevel, number> = {
    info: 1,
    warn: 2,
    alert: 3,
  };
  return levelWeight[next] > levelWeight[current] ? next : current;
}

function classifySecurityMonitorEvent(
  method: string,
  rawUrl: string,
  status: number,
): { level: SecurityMonitorLevel; note: string } {
  let level: SecurityMonitorLevel = "info";
  const notes: string[] = [];

  if (status >= 500) {
    level = "alert";
    notes.push("Resposta 5xx");
  } else if (status >= 400) {
    level = "warn";
    notes.push("Resposta 4xx");
  }

  const normalizedMethod = String(method ?? "").trim().toUpperCase();
  const knownMethods = new Set(["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"]);
  if (!knownMethods.has(normalizedMethod)) {
    level = selectHigherSecurityLevel(level, "warn");
    notes.push("Método HTTP incomum");
  }

  const normalizedUrl = String(rawUrl ?? "");
  if (normalizedUrl.length > 1800) {
    level = selectHigherSecurityLevel(level, "warn");
    notes.push("URL muito longa");
  }

  const decoded = (() => {
    try {
      return decodeURIComponent(normalizedUrl);
    } catch {
      return normalizedUrl;
    }
  })();

  const suspiciousPatternRegex =
    /(\.\.\/|%2e%2e|<script|union\s+select|\bor\b\s+1=1|\/wp-admin|\/phpmyadmin)/i;
  if (suspiciousPatternRegex.test(decoded)) {
    level = selectHigherSecurityLevel(level, "alert");
    notes.push("Padrão suspeito na URL");
  }

  return {
    level,
    note: notes.join(" | "),
  };
}

function classifyAgentEventLevel(type: string, target: string, status: string): SecurityMonitorLevel {
  const haystack = `${type} ${target} ${status}`.toLowerCase();
  if (haystack.includes("proteção desligada") || haystack.includes("protecao desligada")) {
    return "alert";
  }
  if (
    haystack.includes("csp") ||
    haystack.includes("erro javascript") ||
    haystack.includes("promise rejeitada") ||
    haystack.includes("senha sem https") ||
    haystack.includes("inseguro")
  ) {
    return "warn";
  }
  return "info";
}

function appendSecurityMonitorEvent(
  event: Omit<SecurityMonitorEvent, "id" | "created_at">,
) {
  securityMonitorEventSequence += 1;
  securityMonitorEvents.unshift({
    id: securityMonitorEventSequence,
    created_at: Date.now(),
    ...event,
  });

  if (securityMonitorEvents.length > SECURITY_MONITOR_MAX_EVENTS) {
    securityMonitorEvents.length = SECURITY_MONITOR_MAX_EVENTS;
  }
}

function normalizeSecurityMonitorLimit(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    return SECURITY_MONITOR_DEFAULT_LIMIT;
  }
  return Math.min(Math.max(parsed, 1), SECURITY_MONITOR_MAX_LIMIT);
}

function sessionCookieBaseOptions(isProduction: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction,
    path: "/",
  };
}

function sessionCookieOptions(isProduction: boolean) {
  return {
    ...sessionCookieBaseOptions(isProduction),
    maxAge: SESSION_TTL_SECONDS * 1000,
  };
}

function adminSessionCookieBaseOptions(isProduction: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction,
    path: "/",
  };
}

function adminSessionCookieOptions(isProduction: boolean) {
  return {
    ...adminSessionCookieBaseOptions(isProduction),
    maxAge: ADMIN_SESSION_TTL_SECONDS * 1000,
  };
}

function setSessionCookie(res: Response, token: string, isProduction: boolean) {
  res.cookie(SESSION_COOKIE_NAME, token, sessionCookieOptions(isProduction));
}

function clearSessionCookie(res: Response, isProduction: boolean) {
  res.clearCookie(SESSION_COOKIE_NAME, sessionCookieBaseOptions(isProduction));
}

function setAdminSessionCookie(res: Response, token: string, isProduction: boolean) {
  res.cookie(ADMIN_SESSION_COOKIE_NAME, token, adminSessionCookieOptions(isProduction));
}

function clearAdminSessionCookie(res: Response, isProduction: boolean) {
  res.clearCookie(ADMIN_SESSION_COOKIE_NAME, adminSessionCookieBaseOptions(isProduction));
}

function sanitizeUser(
  user: Pick<
    UserRow,
    | "id"
    | "name"
    | "email"
    | "avatar_url"
    | "country"
    | "state"
    | "city"
    | "neighborhood"
    | "street"
    | "whatsapp_country_iso"
    | "whatsapp_number"
    | "location_latitude"
    | "location_longitude"
    | "preferred_locale"
  >,
): SessionUser {
  const locationLatitude = toNullableNumber(user.location_latitude);
  const locationLongitude = toNullableNumber(user.location_longitude);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatar_url ?? "",
    country: user.country ?? "",
    state: user.state ?? "",
    city: user.city ?? "",
    neighborhood: user.neighborhood ?? "",
    street: user.street ?? "",
    whatsappCountryIso: user.whatsapp_country_iso ?? "IT",
    whatsappNumber: user.whatsapp_number ?? "",
    preferredLocale: normalizeAppLocale(user.preferred_locale) ?? DEFAULT_APP_LOCALE,
    ...(locationLatitude !== null ? { locationLatitude } : {}),
    ...(locationLongitude !== null ? { locationLongitude } : {}),
  };
}

function sanitizePublicUser(
  user: Pick<
    UserRow,
    | "id"
    | "name"
    | "avatar_url"
    | "country"
    | "state"
    | "city"
    | "neighborhood"
    | "street"
    | "whatsapp_country_iso"
    | "whatsapp_number"
  >,
) {
  return {
    id: user.id,
    name: user.name,
    avatarUrl: user.avatar_url ?? "",
    country: user.country ?? "",
    state: user.state ?? "",
    city: user.city ?? "",
    neighborhood: user.neighborhood ?? "",
    street: user.street ?? "",
    whatsappCountryIso: user.whatsapp_country_iso ?? "IT",
    whatsappNumber: user.whatsapp_number ?? "",
  };
}

function rowToPublicLiker(row: Record<string, unknown>) {
  return {
    id: toRequiredNumber(row.id),
    name: String(row.name ?? "").trim() || "Usuário TempleSale",
    avatarUrl: toNullableString(row.avatar_url) ?? "",
    country: toNullableString(row.country) ?? "",
    city: toNullableString(row.city) ?? "",
    likedAt: toNullableNumber(row.liked_at) ?? Math.floor(Date.now() / 1000),
  };
}

function hasRequiredProfileForPublishing(user: SessionUser): boolean {
  const normalizedName = String(user.name ?? "").trim();
  const normalizedWhatsapp = String(user.whatsappNumber ?? "").replace(/\D/g, "").trim();

  return normalizedName.length >= 2 && normalizedWhatsapp.length >= 6;
}

async function createSession(userId: number): Promise<string> {
  await deleteExpiredSessionsRecords();

  const token = crypto.randomBytes(48).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;

  await createSessionRecord(userId, tokenHash, expiresAt);

  return token;
}

async function getSessionUser(req: Request): Promise<SessionUser | null> {
  await deleteExpiredSessionsRecords();

  const token = getSessionTokenFromRequest(req);
  return getSessionUserFromToken(token);
}

async function getSessionUserFromToken(token: string | null): Promise<SessionUser | null> {
  if (!token) {
    return null;
  }

  const tokenHash = hashToken(token);
  const user = await selectSessionUserByTokenHashRow(tokenHash);
  if (!user) {
    return null;
  }
  return sanitizeUser(user);
}

async function getNotificationStreamUser(req: Request): Promise<SessionUser | null> {
  const queryToken = String(req.query.token ?? "").trim();
  if (queryToken) {
    await deleteExpiredSessionsRecords();
    return getSessionUserFromToken(queryToken);
  }
  return getSessionUser(req);
}

async function requireAuth(req: Request, res: Response): Promise<SessionUser | null> {
  const user = await getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: "Faça login para continuar." });
    return null;
  }
  return user;
}

type NotificationStreamClient = {
  id: number;
  res: Response;
  heartbeat: ReturnType<typeof setInterval>;
};

let notificationStreamClientId = 0;
const notificationStreamClients = new Map<number, Map<number, NotificationStreamClient>>();

function writeNotificationStreamEvent(
  client: NotificationStreamClient,
  event: string,
  payload: Record<string, unknown>,
): void {
  client.res.write(`event: ${event}\n`);
  client.res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function addNotificationStreamClient(userId: number, res: Response): NotificationStreamClient {
  notificationStreamClientId += 1;
  const client: NotificationStreamClient = {
    id: notificationStreamClientId,
    res,
    heartbeat: setInterval(() => {
      writeNotificationStreamEvent(client, "ping", { now: Date.now() });
    }, 25000),
  };

  const userClients = notificationStreamClients.get(userId) ?? new Map<number, NotificationStreamClient>();
  userClients.set(client.id, client);
  notificationStreamClients.set(userId, userClients);
  writeNotificationStreamEvent(client, "ready", { now: Date.now() });
  return client;
}

function removeNotificationStreamClient(userId: number, client: NotificationStreamClient): void {
  clearInterval(client.heartbeat);
  const userClients = notificationStreamClients.get(userId);
  if (!userClients) {
    return;
  }
  userClients.delete(client.id);
  if (userClients.size === 0) {
    notificationStreamClients.delete(userId);
  }
}

function notifyUserNotificationsChanged(userId: number | null | undefined, reason: string): void {
  if (!userId || userId <= 0) {
    return;
  }

  const userClients = notificationStreamClients.get(userId);
  if (!userClients || userClients.size === 0) {
    return;
  }

  userClients.forEach((client) => {
    writeNotificationStreamEvent(client, "notifications-changed", {
      reason,
      now: Date.now(),
    });
  });
}

function parseTileCoordinate(value: string): number | null {
  if (!/^\d+$/.test(value)) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    return null;
  }
  return parsed;
}

function isValidTileCoordinate(z: number, x: number, y: number): boolean {
  if (z < MAP_TILE_MIN_ZOOM || z > MAP_TILE_MAX_ZOOM) {
    return false;
  }
  const maxIndex = 2 ** z - 1;
  if (!Number.isFinite(maxIndex) || maxIndex < 0) {
    return false;
  }
  return x >= 0 && y >= 0 && x <= maxIndex && y <= maxIndex;
}

function buildTileProviderUrl(template: string, z: number, x: number, y: number): string {
  return template
    .replace("{z}", String(z))
    .replace("{x}", String(x))
    .replace("{y}", String(y));
}

async function fetchTileFromProviders(
  z: number,
  x: number,
  y: number,
): Promise<{ buffer: Buffer; contentType: string } | null> {
  for (const template of MAP_TILE_PROVIDER_TEMPLATES) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, MAP_TILE_FETCH_TIMEOUT_MS);

    try {
      const url = buildTileProviderUrl(template, z, x, y);
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "TempleSaleMapProxy/1.0",
          Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        },
      });

      if (!response.ok) {
        continue;
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.startsWith("image/")) {
        continue;
      }

      const arrayBuffer = await response.arrayBuffer();
      return {
        buffer: Buffer.from(arrayBuffer),
        contentType,
      };
    } catch {
      // Try next tile provider.
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return null;
}

async function bootstrap() {
  await initializeDatabase();

  const app = express();
  const isProduction = process.env.NODE_ENV === "production";
  const port = Number(process.env.PORT || 5173);
  const cspHeaderValue = buildContentSecurityPolicy(isProduction);

  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use((_req, res, next) => {
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", SECURITY_PERMISSIONS_POLICY);
    res.setHeader("Content-Security-Policy", cspHeaderValue);
    if (isProduction) {
      res.setHeader("Strict-Transport-Security", SECURITY_HSTS_VALUE);
    }
    next();
  });
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "2mb" }));
  app.use((req, res, next) => {
    const normalizedPath = normalizeSecurityMonitorPath(String(req.originalUrl ?? req.url ?? ""));
    if (isSensitivePublicPath(normalizedPath)) {
      res.status(404).type("text/plain; charset=utf-8").send("Not found.");
      return;
    }
    next();
  });
  app.use((req, res, next) => {
    const normalizedPath = normalizeSecurityMonitorPath(String(req.originalUrl ?? req.url ?? ""));
    if (!shouldTrackDailyVisitorRequest(req, normalizedPath)) {
      next();
      return;
    }

    const visitorInput = buildDailyVisitorUpsertInput(req, normalizedPath, {
      res,
      isProduction,
    });
    res.on("finish", () => {
      const status = Number(res.statusCode || 0);
      if (status < 200 || status >= 400) {
        return;
      }

      void upsertDailyVisitorRecord(visitorInput).catch((error) => {
        const message = error instanceof Error ? error.message : "unknown";
        console.error("Visitor tracking write failed:", message);
      });
    });

    next();
  });
  app.use((req, res, next) => {
    const startedAt = Date.now();
    const rawUrl = String(req.originalUrl ?? req.url ?? "");
    const normalizedPath = normalizeSecurityMonitorPath(rawUrl);
    const method = String(req.method ?? "GET").trim().toUpperCase();
    const isSecurityMonitorRoute =
      normalizedPath === "/api/admin/security-test/events" ||
      normalizedPath === "/api/admin/security-tests/events" ||
      normalizedPath === "/api/visitor/ping" ||
      normalizedPath === "/api/agent/report" ||
      normalizedPath.startsWith("/api/agent/script/") ||
      normalizedPath.startsWith("/api/agent/status/");
    const hasAuthToken = Boolean(getSessionTokenFromRequest(req));
    const hasAdminToken = Boolean(getAdminSessionTokenFromRequest(req));
    const isAdminRoute = normalizedPath.startsWith("/api/admin");

    res.on("finish", () => {
      if (!normalizedPath.startsWith("/api")) {
        return;
      }
      if (isSecurityMonitorRoute) {
        return;
      }

      const durationMs = Math.max(0, Date.now() - startedAt);
      const status = Number(res.statusCode || 0);
      const classification = classifySecurityMonitorEvent(method, rawUrl, status);

      appendSecurityMonitorEvent({
        method,
        path: normalizedPath,
        status,
        duration_ms: durationMs,
        ip: truncateSecurityMonitorText(getRequestIp(req), 80),
        user_agent: truncateSecurityMonitorText(req.headers["user-agent"] ?? "", 180),
        level: classification.level,
        note: classification.note,
        is_admin_route: isAdminRoute,
        has_auth_token: hasAuthToken,
        has_admin_token: hasAdminToken,
      });
    });

    next();
  });

  if (IS_DEV_REMOTE_READ_ONLY) {
    app.use("/api", (req, res, next) => {
      const normalizedPath = normalizeSecurityMonitorPath(String(req.originalUrl ?? req.url ?? ""));
      if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
        next();
        return;
      }
      if (normalizedPath === "/api/agent/report") {
        next();
        return;
      }
      res.status(403).json({
        error:
          "Modo somente leitura ativo no dev com banco remoto. Escritas foram bloqueadas para proteger dados reais.",
      });
    });
  }

  const requireAdmin = (req: Request, res: Response): AdminSessionUser | null => {
    const adminToken = getAdminSessionTokenFromRequest(req);
    if (!adminToken || !verifyAdminAccessToken(adminToken)) {
      clearAdminSessionCookie(res, isProduction);
      res.status(401).json({ error: "Acesso de administrador não autorizado." });
      return null;
    }

    return { email: ADMIN_EMAIL };
  };

  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      mode: isProduction ? "production" : "development",
      database: "postgres",
      cloudinary:
        CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET
          ? "configured"
          : "missing_env",
    });
  });

  app.post("/api/visitor/ping", async (req, res) => {
    try {
      const body =
        req.body && typeof req.body === "object" && !Array.isArray(req.body)
          ? (req.body as Record<string, unknown>)
          : {};
      const rawPath = body.path ?? body.pathname ?? req.query.path ?? req.headers["x-page-path"] ?? "/";
      const normalizedPath = normalizeSecurityMonitorPath(String(rawPath ?? "/"));
      const safePath =
        !normalizedPath || normalizedPath.startsWith("/api") ? "/" : normalizedPath;
      const source = String(body.source ?? "").trim().toLowerCase();
      const shouldCountAsVisit = source === "entry";
      const input = buildDailyVisitorUpsertInput(req, safePath, {
        res,
        isProduction,
        countAsVisit: shouldCountAsVisit,
      });

      const bodyReferrer = normalizeVisitorTrackingText(
        body.referrer ?? body.referer ?? "",
        VISITOR_TEXT_LIMITS.referrer,
      );
      if (bodyReferrer) {
        input.referrer = bodyReferrer;
        input.referrerHost = normalizeVisitorTrackingText(
          extractReferrerHost(bodyReferrer),
          VISITOR_TEXT_LIMITS.host,
        );
      }

      await upsertDailyVisitorRecord(input);
      res.status(202).json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao registrar visitante.";
      res.status(500).json({ error: message });
    }
  });

  app.get("/.well-known/security.txt", (_req, res) => {
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.type("text/plain; charset=utf-8").send(buildSecurityTxtContent());
  });

  app.get("/api/agent/script/:siteId.js", (req, res) => {
    const siteId = normalizeAgentSiteId(req.params.siteId);
    if (!siteId) {
      res.status(400).type("text/plain; charset=utf-8").send("siteId inválido.");
      return;
    }

    const requestOrigin = `${req.protocol}://${req.get("host") || "localhost:3000"}`;
    const apiBase = String(process.env.AGENT_API_BASE_URL ?? "").trim() || requestOrigin;
    const script = buildAgentRuntimeScript(siteId, apiBase);

    res
      .status(200)
      .type("application/javascript; charset=utf-8")
      .setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=600")
      .send(script);
  });

  app.get("/api/agent/status/:siteId", (req, res) => {
    const siteId = normalizeAgentSiteId(req.params.siteId);
    if (!siteId) {
      res.status(400).json({ error: "siteId inválido." });
      return;
    }

    res.json({
      siteId,
      protected: resolveAgentProtectionStatus(siteId),
      checkedAt: Date.now(),
    });
  });

  app.post("/api/agent/report", (req, res) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const siteId = normalizeAgentSiteId(req.query.siteId ?? body.siteId);
    if (!siteId) {
      res.status(400).json({ error: "siteId inválido." });
      return;
    }

    const type = truncateSecurityMonitorText(body.type ?? "Agent: Evento", 120) || "Agent: Evento";
    const source =
      truncateSecurityMonitorText(body.source ?? req.headers.origin ?? req.headers.referer ?? "/", 260) ||
      "/";
    const target = truncateSecurityMonitorText(body.target ?? "-", 260) || "-";
    const statusLabel = truncateSecurityMonitorText(body.status ?? "Monitored", 80) || "Monitored";
    const level = classifyAgentEventLevel(type, target, statusLabel);
    const statusCode = level === "alert" ? 500 : level === "warn" ? 400 : 200;
    const eventPath = normalizeSecurityMonitorPath(source);
    const eventNote = truncateSecurityMonitorText(
      `siteId=${siteId} | type=${type} | target=${target} | status=${statusLabel}`,
      480,
    );

    appendSecurityMonitorEvent({
      method: "AGENT",
      path: eventPath,
      status: statusCode,
      duration_ms: 0,
      ip: truncateSecurityMonitorText(getRequestIp(req), 80),
      user_agent: truncateSecurityMonitorText(req.headers["user-agent"] ?? "", 180),
      level,
      note: eventNote,
      is_admin_route: false,
      has_auth_token: Boolean(getSessionTokenFromRequest(req)),
      has_admin_token: Boolean(getAdminSessionTokenFromRequest(req)),
    });

    res.status(201).json({ success: true });
  });

  if (!isProduction) {
    app.get("/api/debug/db-columns/:table", async (req, res) => {
      try {
        const tableName = String(req.params.table ?? "").trim().toLowerCase();
        if (!tableName || !/^[a-z_]+$/.test(tableName)) {
          res.status(400).json({ error: "Nome de tabela inválido." });
          return;
        }

        if (!pgPool) {
          res.status(500).json({ error: "Pool do Postgres indisponível." });
          return;
        }

        const result = await pgPool.query<{
          column_name: string;
          is_nullable: string;
          data_type: string;
          column_default: string | null;
        }>(
          `
            SELECT column_name, is_nullable, data_type, column_default
            FROM information_schema.columns
            WHERE table_schema = $1 AND table_name = $2
            ORDER BY ordinal_position
          `,
          [PRIMARY_DATABASE_SCHEMA, tableName],
        );

        res.json({
          schema: PRIMARY_DATABASE_SCHEMA,
          table: tableName,
          columns: result.rows.map((row) => ({
            name: row.column_name,
            nullable: row.is_nullable === "YES",
            dataType: row.data_type,
            default: row.column_default,
          })),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha ao consultar schema.";
        res.status(500).json({ error: message });
      }
    });

    app.post("/api/debug/cleanup-local-products", async (_req, res) => {
      try {
        if (!pgPool) {
          res.status(500).json({ error: "Pool do Postgres indisponível." });
          return;
        }

        const result = await pgPool.query<{
          id: number | string;
        }>(
          `
            DELETE FROM products
            WHERE
              COALESCE(NULLIF(BTRIM(name), ''), '') = ''
              OR image LIKE 'https://picsum.photos/%'
              OR images LIKE '%picsum.photos/%'
            RETURNING id
          `,
        );

        res.json({
          deletedCount: result.rowCount ?? result.rows.length,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha ao limpar produtos locais.";
        res.status(500).json({ error: message });
      }
    });
  }

  app.get("/api/map-tiles/:z/:x/:y.png", async (req, res) => {
    const z = parseTileCoordinate(req.params.z);
    const x = parseTileCoordinate(req.params.x);
    const y = parseTileCoordinate(req.params.y);

    if (z === null || x === null || y === null || !isValidTileCoordinate(z, x, y)) {
      res.status(400).end();
      return;
    }

    const tile = await fetchTileFromProviders(z, x, y);
    if (!tile) {
      res.status(502).end();
      return;
    }

    res.setHeader("Content-Type", tile.contentType);
    res.setHeader("Cache-Control", MAP_TILE_CACHE_CONTROL);
    res.status(200).send(tile.buffer);
  });

  app.post(
    "/api/uploads/product-image",
    express.raw({
      type: "image/*",
      limit: `${UPLOAD_MAX_BYTES}b`,
    }),
    async (req, res) => {
      const user = await requireAuth(req, res);
      if (!user) {
        return;
      }

      try {
        const { contentType, payload, safeFilename } = parseIncomingImageUpload(req);
        const uploaded = await uploadImageToCloudinary({
          payload,
          contentType,
          safeFilename,
          folder: CLOUDINARY_UPLOAD_FOLDER,
          publicIdPrefix: `product_user_${user.id}`,
        });

        res.status(201).json(uploaded);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha ao fazer upload da imagem.";
        const statusCode =
          message.includes("Arquivo inválido") || message.includes("não encontrado")
            ? 400
            : message.includes("Cloudinary")
              ? 502
              : 500;
        res.status(statusCode).json({ error: message });
      }
    },
  );

  app.post(
    "/api/uploads/profile-image",
    express.raw({
      type: "image/*",
      limit: `${UPLOAD_MAX_BYTES}b`,
    }),
    async (req, res) => {
      const user = await requireAuth(req, res);
      if (!user) {
        return;
      }

      try {
        const { contentType, payload, safeFilename } = parseIncomingImageUpload(req);
        const uploaded = await uploadImageToCloudinary({
          payload,
          contentType,
          safeFilename,
          folder: CLOUDINARY_PROFILE_UPLOAD_FOLDER,
          publicIdPrefix: `avatar_user_${user.id}`,
        });

        res.status(201).json(uploaded);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Falha ao enviar foto de perfil.";
        const statusCode =
          message.includes("Arquivo inválido") || message.includes("não encontrado")
            ? 400
            : message.includes("Cloudinary")
              ? 502
              : 500;
        res.status(statusCode).json({ error: message });
      }
    },
  );

  const isAllowedAdminEmail = (email: string) => {
    return ADMIN_EMAIL_CANDIDATES.includes(email);
  };

  const isAllowedAdminPassword = (password: string) => {
    return ADMIN_PASSWORD_CANDIDATES.some((candidate) => timingSafeEquals(password, candidate));
  };

  const handleAdminLogin = (req: Request, res: Response) => {
    try {
      const body = req.body as Record<string, unknown>;
      const email = normalizeCredentialValue(body.email ?? "", true);
      const password = normalizeCredentialValue(body.password ?? "", false);

      if (!email || !password) {
        res.status(400).json({ error: "Email e senha do administrador são obrigatórios." });
        return;
      }

      if (!isAllowedAdminEmail(email) || !isAllowedAdminPassword(password)) {
        clearAdminSessionCookie(res, isProduction);
        res.status(401).json({ error: "Credenciais de administrador inválidas." });
        return;
      }

      const token = createAdminSessionToken();
      setAdminSessionCookie(res, token, isProduction);
      res.json({
        email: ADMIN_EMAIL,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao autenticar administrador.";
      res.status(500).json({ error: message });
    }
  };

  const handleAdminCurrent = (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) {
      return;
    }

    res.json({ email: ADMIN_EMAIL });
  };

  const handleAdminLogout = (_req: Request, res: Response) => {
    clearAdminSessionCookie(res, isProduction);
    res.json({ success: true });
  };

  // Canonical admin auth routes
  app.post("/api/admin/auth/login", handleAdminLogin);
  app.get("/api/admin/auth/me", handleAdminCurrent);
  app.post("/api/admin/auth/logout", handleAdminLogout);

  // Legacy admin auth routes still used by older deployed frontends
  app.post("/api/admin/login", handleAdminLogin);
  app.get("/api/admin/me", handleAdminCurrent);
  app.post("/api/admin/logout", handleAdminLogout);
  app.delete("/api/admin/logout", handleAdminLogout);
  app.post("/api/admin", handleAdminLogin);
  app.get("/api/admin", handleAdminCurrent);
  app.delete("/api/admin", handleAdminLogout);

  // Backward-compatible aliases for older frontends
  app.post("/api/admin/auth", handleAdminLogin);
  app.get("/api/admin/auth", handleAdminCurrent);
  app.delete("/api/admin/auth", handleAdminLogout);

  app.get("/api/admin/agent/status/:siteId", (req, res) => {
    if (!requireAdmin(req, res)) {
      return;
    }

    const siteId = normalizeAgentSiteId(req.params.siteId);
    if (!siteId) {
      res.status(400).json({ error: "siteId inválido." });
      return;
    }

    res.json({
      siteId,
      protected: resolveAgentProtectionStatus(siteId),
    });
  });

  app.patch("/api/admin/agent/status/:siteId", (req, res) => {
    if (!requireAdmin(req, res)) {
      return;
    }

    const siteId = normalizeAgentSiteId(req.params.siteId);
    if (!siteId) {
      res.status(400).json({ error: "siteId inválido." });
      return;
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    if (typeof body.protected !== "boolean") {
      res.status(400).json({ error: "Campo protected deve ser booleano." });
      return;
    }

    agentProtectionBySiteId.set(siteId, body.protected);
    res.json({
      siteId,
      protected: body.protected,
    });
  });

  const handleAdminSecurityTestUnlock = (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) {
      return;
    }

    try {
      const body = req.body as Record<string, unknown>;
      const password = normalizeCredentialValue(body.password ?? "", false);
      if (!password) {
        res.status(400).json({ error: "Senha da área de testes é obrigatória." });
        return;
      }

      if (!timingSafeEquals(password, ADMIN_TEST_AREA_PASSWORD)) {
        res.status(401).json({ error: "Senha da área de testes inválida." });
        return;
      }

      res.json({ success: true, unlocked: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha ao validar acesso da área de testes.";
      res.status(500).json({ error: message });
    }
  };

  app.post("/api/admin/security-test/unlock", handleAdminSecurityTestUnlock);
  app.post("/api/admin/security-tests/unlock", handleAdminSecurityTestUnlock);

  const handleAdminSecurityEventsList = (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) {
      return;
    }

    try {
      const limit = normalizeSecurityMonitorLimit(req.query.limit);
      const events = securityMonitorEvents.slice(0, limit);
      const summary = {
        info: events.filter((event) => event.level === "info").length,
        warn: events.filter((event) => event.level === "warn").length,
        alert: events.filter((event) => event.level === "alert").length,
      };

      res.json({
        events,
        totalTracked: securityMonitorEvents.length,
        serverTime: Date.now(),
        summary,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha ao carregar eventos de segurança.";
      res.status(500).json({ error: message });
    }
  };

  const handleAdminSecurityEventsClear = (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) {
      return;
    }

    securityMonitorEvents.length = 0;
    res.json({ success: true, cleared: true });
  };

  app.get("/api/admin/security-test/events", handleAdminSecurityEventsList);
  app.get("/api/admin/security-tests/events", handleAdminSecurityEventsList);
  app.delete("/api/admin/security-test/events", handleAdminSecurityEventsClear);
  app.delete("/api/admin/security-tests/events", handleAdminSecurityEventsClear);

  app.get("/api/admin/visitors", async (req, res) => {
    const adminSession = requireAdmin(req, res);
    if (!adminSession) {
      return;
    }

    try {
      const day = normalizeVisitorDateKey(req.query.date);
      const selfIp = normalizeIpForVisitorTracking(getRequestIp(req));
      const selfUserAgent = normalizeVisitorTrackingText(
        req.headers["user-agent"] ?? "",
        VISITOR_TEXT_LIMITS.userAgent,
      );
      const selfDeviceProfile = buildVisitorDeviceProfile(selfUserAgent);
      const selfDeviceProfileSignature = buildVisitorDeviceProfileSignatureKey(
        selfDeviceProfile,
      ).toLowerCase();
      const selfVisitorToken = getVisitorTrackingCookieTokenFromRequest(req);
      const selfVisitorKey = buildVisitorFingerprintKey({
        ip: selfIp,
        userAgent: selfUserAgent,
        visitorToken: selfVisitorToken,
      });
      let selfSignatureKeys = new Set<string>();
      try {
        await upsertAdminSelfDeviceSignature(adminSession.email, selfDeviceProfile);
        selfSignatureKeys = await selectAdminSelfDeviceSignatureKeys(adminSession.email);
      } catch (signatureError) {
        const signatureMessage =
          signatureError instanceof Error ? signatureError.message : "unknown";
        console.error("Admin self-signature sync failed:", signatureMessage);
      }
      if (selfDeviceProfileSignature) {
        selfSignatureKeys.add(selfDeviceProfileSignature);
      }
      const rows = await selectDailyVisitorsByDateRows(day, VISITOR_DAY_FETCH_LIMIT);

      let totalVisits = 0;
      let uniqueVisitors = 0;
      let externalVisits = 0;
      let externalUniqueVisitors = 0;
      let selfVisits = 0;
      let selfUniqueVisitors = 0;
      let externalLabelSequence = 0;
      const pendingSelfProfiles = new Map<string, VisitorDeviceProfile>();

      const visitors = rows.map((row) => {
        const visits = toRequiredNonNegativeInteger(row.visits, 0);
        const normalizedIp = normalizeIpForVisitorTracking(row.ip ?? "");
        const normalizedUserAgent =
          normalizeVisitorTrackingText(row.user_agent ?? "", VISITOR_TEXT_LIMITS.userAgent) || "-";
        const deviceProfile = buildVisitorDeviceProfile(normalizedUserAgent);
        const rowDeviceProfileSignature = buildVisitorDeviceProfileSignatureKey(deviceProfile).toLowerCase();
        const isSelfByKey = row.visitor_key === selfVisitorKey;
        const isSelfBySavedDeviceProfile = rowDeviceProfileSignature
          ? selfSignatureKeys.has(rowDeviceProfileSignature)
          : false;
        const isSelfByCurrentDeviceIp =
          Boolean(rowDeviceProfileSignature) &&
          Boolean(selfDeviceProfileSignature) &&
          rowDeviceProfileSignature === selfDeviceProfileSignature &&
          normalizedIp === selfIp;
        const isSelf = isSelfByKey || isSelfBySavedDeviceProfile || isSelfByCurrentDeviceIp;

        if (isSelf && rowDeviceProfileSignature && !selfSignatureKeys.has(rowDeviceProfileSignature)) {
          selfSignatureKeys.add(rowDeviceProfileSignature);
          pendingSelfProfiles.set(rowDeviceProfileSignature, deviceProfile);
        }

        uniqueVisitors += 1;
        totalVisits += visits;

        if (isSelf) {
          selfVisits += visits;
          selfUniqueVisitors += 1;
        } else {
          externalVisits += visits;
          externalUniqueVisitors += 1;
          externalLabelSequence += 1;
        }

        const label = isSelf ? "Eu" : `Usuário ${externalLabelSequence}`;

        return {
          id: row.id,
          visitorKey: row.visitor_key,
          label,
          isSelf,
          visits,
          firstSeenAt: row.first_seen_at,
          lastSeenAt: row.last_seen_at,
          ip: normalizedIp,
          entryPath:
            normalizeVisitorTrackingText(row.entry_path ?? "/", VISITOR_TEXT_LIMITS.path) || "/",
          referrer: normalizeVisitorTrackingText(row.referrer ?? "", VISITOR_TEXT_LIMITS.referrer),
          referrerHost: normalizeVisitorTrackingText(
            row.referrer_host ?? "",
            VISITOR_TEXT_LIMITS.host,
          ),
          country: normalizeVisitorTrackingText(row.country ?? "", VISITOR_TEXT_LIMITS.country),
          region: normalizeVisitorTrackingText(row.region ?? "", VISITOR_TEXT_LIMITS.region),
          city: normalizeVisitorTrackingText(row.city ?? "", VISITOR_TEXT_LIMITS.city),
          userAgent: normalizedUserAgent,
          deviceType: deviceProfile.deviceType,
          deviceModel: deviceProfile.deviceModel,
          deviceOsName: deviceProfile.osName,
          deviceOsVersion: deviceProfile.osVersion,
        };
      });

      for (const profile of pendingSelfProfiles.values()) {
        try {
          await upsertAdminSelfDeviceSignature(adminSession.email, profile);
        } catch (signatureError) {
          const signatureMessage =
            signatureError instanceof Error ? signatureError.message : "unknown";
          console.error("Admin self-signature persist failed:", signatureMessage);
        }
      }

      res.json({
        day,
        timezone: "UTC",
        generatedAt: Date.now(),
        selfVisitorKey,
        summary: {
          totalVisits,
          uniqueVisitors,
          externalVisits,
          externalUniqueVisitors,
          selfVisits,
          selfUniqueVisitors,
        },
        visitors,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar visitantes.";
      res.status(500).json({ error: message });
    }
  });

  app.get("/api/admin/users", async (req, res) => {
    if (!requireAdmin(req, res)) {
      return;
    }

    try {
      const users = await selectAdminUsersRows();
      res.json(users);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao listar usuários.";
      res.status(500).json({ error: message });
    }
  });

  app.get("/api/admin/users/:id/products", async (req, res) => {
    if (!requireAdmin(req, res)) {
      return;
    }

    const userId = Number(req.params.id);
    if (!Number.isInteger(userId) || userId <= 0) {
      res.status(400).json({ error: "ID de usuário inválido." });
      return;
    }

    try {
      const user = await selectUserByIdRow(userId);
      if (!user) {
        res.status(404).json({ error: "Usuário não encontrado." });
        return;
      }

      const products = await selectProductsByOwnerRows(userId);
      res.json(products.map((row) => rowToProduct(row)));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao listar produtos do usuário.";
      res.status(500).json({ error: message });
    }
  });

  app.patch("/api/admin/users/:id/ban", async (req, res) => {
    if (!requireAdmin(req, res)) {
      return;
    }

    const userId = Number(req.params.id);
    if (!Number.isInteger(userId) || userId <= 0) {
      res.status(400).json({ error: "ID de usuário inválido." });
      return;
    }

    try {
      const existingUser = await selectUserByIdRow(userId);
      if (!existingUser) {
        res.status(404).json({ error: "Usuário não encontrado." });
        return;
      }

      const body = req.body as Record<string, unknown>;
      const isBanned = toBooleanValue(body.isBanned ?? body.is_banned, false);
      const reason = String(body.reason ?? body.banReason ?? "").trim().slice(0, 240);
      const updated = await updateUserBanRecord(userId, isBanned, reason);
      if (!updated) {
        res.status(404).json({ error: "Usuário não encontrado." });
        return;
      }

      if (isBanned) {
        await deleteSessionsByUserIdRecord(userId);
      }

      const users = await selectAdminUsersRows();
      const adminUser = users.find((user) => user.id === userId);
      res.json(adminUser ?? { success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao atualizar usuário.";
      res.status(500).json({ error: message });
    }
  });

  app.put("/api/admin/users/:id/password", async (req, res) => {
    if (!requireAdmin(req, res)) {
      return;
    }

    const userId = Number(req.params.id);
    if (!Number.isInteger(userId) || userId <= 0) {
      res.status(400).json({ error: "ID de usuário inválido." });
      return;
    }

    try {
      const existingUser = await selectUserByIdRow(userId);
      if (!existingUser) {
        res.status(404).json({ error: "Usuário não encontrado." });
        return;
      }

      const body = req.body as Record<string, unknown>;
      const nextPassword = String(body.password ?? "").trim();
      if (nextPassword.length < 6) {
        res.status(400).json({ error: "A nova senha precisa ter pelo menos 6 caracteres." });
        return;
      }

      const credentials = createPasswordCredentials(nextPassword);
      const updated = await updateUserPasswordRecord(
        userId,
        credentials.hash,
        credentials.salt,
      );
      if (!updated) {
        res.status(404).json({ error: "Usuário não encontrado." });
        return;
      }

      await deleteSessionsByUserIdRecord(userId);
      res.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao atualizar senha.";
      res.status(500).json({ error: message });
    }
  });

  app.get("/api/admin/products", async (req, res) => {
    if (!requireAdmin(req, res)) {
      return;
    }

    try {
      const search = String(req.query.q ?? req.query.search ?? "").trim();
      const limit = normalizeProductPageLimit(req.query.limit, 36);
      const offset = normalizeProductPageOffset(req.query.offset);
      const page = await selectProductsPageRows({
        search,
        category: "",
        maxPrice: null,
        limit,
        offset,
      });

      res.json({
        products: page.rows.map(rowToAdminProduct),
        hasMore: page.hasMore,
        nextOffset: offset + page.rows.length,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao listar produtos.";
      res.status(500).json({ error: message });
    }
  });

  app.post("/api/admin/notifications/broadcast", async (req, res) => {
    const adminSession = requireAdmin(req, res);
    if (!adminSession) {
      return;
    }

    try {
      const body = req.body as Record<string, unknown>;
      const title = normalizeTextField(body.title, "Título", 120);
      const message = normalizeTextField(body.message, "Mensagem", 600);
      const rawProductId = Number(body.productId ?? body.product_id);
      const productId = Number.isInteger(rawProductId) && rawProductId > 0 ? rawProductId : null;
      const notificationId = await createAdminBroadcastNotificationRecord({
        title,
        message,
        productId,
        createdBy: adminSession.email,
      });
      const userIds = await selectAllUserIdsRows();
      userIds.forEach((userId) => {
        notifyUserNotificationsChanged(userId, "admin-broadcast");
      });

      res.status(201).json({
        success: true,
        id: notificationId,
        deliveredTo: userIds.length,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao enviar notificação.";
      const statusCode = message.includes("não encontrado") || message.includes("deve ter") ? 400 : 500;
      res.status(statusCode).json({ error: message });
    }
  });

  app.get(["/api/admin/notifications/broadcast", "/api/admin/notifications/broadcasts"], async (req, res) => {
    if (!requireAdmin(req, res)) {
      return;
    }

    try {
      const notifications = await selectAdminBroadcastNotificationRows();
      res.json({ notifications });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao listar notificações.";
      res.status(500).json({ error: message });
    }
  });

  app.delete(
    ["/api/admin/notifications/broadcast/:id", "/api/admin/notifications/broadcasts/:id"],
    async (req, res) => {
      if (!requireAdmin(req, res)) {
        return;
      }

      const notificationId = Number(req.params.id);
      if (!Number.isInteger(notificationId) || notificationId <= 0) {
        res.status(400).json({ error: "ID de notificação inválido." });
        return;
      }

      try {
        const deleted = await deleteAdminBroadcastNotificationRecord(notificationId);
        if (!deleted) {
          res.status(404).json({ error: "Notificação não encontrada." });
          return;
        }

        const userIds = await selectAllUserIdsRows();
        userIds.forEach((userId) => {
          notifyUserNotificationsChanged(userId, "admin-broadcast-deleted");
        });

        res.json({ success: true });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha ao excluir notificação.";
        res.status(500).json({ error: message });
      }
    },
  );

  app.delete("/api/admin/products/:id", async (req, res) => {
    if (!requireAdmin(req, res)) {
      return;
    }

    const productId = Number(req.params.id);
    if (!Number.isInteger(productId) || productId <= 0) {
      res.status(400).json({ error: "ID de produto inválido." });
      return;
    }

    try {
      const existingProduct = await selectProductByIdRow(productId);
      if (!existingProduct) {
        res.status(404).json({ error: "Produto não encontrado." });
        return;
      }

      const deleted = await deleteProductRecordAsAdmin(productId);
      if (!deleted) {
        res.status(404).json({ error: "Produto não encontrado." });
        return;
      }

      res.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao excluir produto.";
      res.status(500).json({ error: message });
    }
  });

  app.delete("/api/admin/users/:id", async (req, res) => {
    if (!requireAdmin(req, res)) {
      return;
    }

    const userId = Number(req.params.id);
    if (!Number.isInteger(userId) || userId <= 0) {
      res.status(400).json({ error: "ID de usuário inválido." });
      return;
    }

    try {
      const existingUser = await selectUserByIdRow(userId);
      if (!existingUser) {
        res.status(404).json({ error: "Usuário não encontrado." });
        return;
      }

      const deleted = await deleteUserRecordAsAdmin(userId);
      if (!deleted) {
        res.status(404).json({ error: "Usuário não encontrado." });
        return;
      }

      res.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao excluir usuário.";
      res.status(500).json({ error: message });
    }
  });

  app.post("/api/auth/auth0/sync", async (req, res) => {
    let auth0Token = "";
    try {
      auth0Token = extractBearerToken(req);
      if (!auth0Token) {
        res.status(401).json({ error: "Token Auth0 obrigatório." });
        return;
      }

      const claims = await verifyAuth0Jwt(auth0Token);
      const idToken = getRequestHeaderTokenValue(req.headers["x-auth0-id-token"]);
      let profileClaims = claims;
      if (AUTH0_DEBUG_LOGS) {
        console.info("[auth0] sync token validated", {
          subject: claims.sub,
          audience: claims.aud,
          expectedAudience: AUTH0_EXPECTED_AUDIENCE,
          hasEmail: Boolean(claims.email),
          hasProfileToken: Boolean(idToken),
        });
      }
      if (!EMAIL_REGEX.test(normalizeEmail(String(claims.email ?? ""))) && idToken) {
        const idTokenClaims = await verifyAuth0Jwt(idToken, AUTH0_CLIENT_ID);
        if (idTokenClaims.sub !== claims.sub) {
          res.status(401).json({ error: "Token Auth0 de perfil não pertence ao mesmo usuário." });
          return;
        }
        profileClaims = idTokenClaims;
      }
      const auth0Sub = String(claims.sub ?? "").trim();
      const email = normalizeEmail(String(profileClaims.email ?? ""));
      if (!EMAIL_REGEX.test(email)) {
        res.status(400).json({ error: "Auth0 não retornou email válido." });
        return;
      }

      const name = String(profileClaims.name ?? claims.name ?? "").trim();
      const picture = String(profileClaims.picture ?? claims.picture ?? "").trim();
      let user = await selectUserByAuth0SubRow(auth0Sub);

      if (!user) {
        const existingByEmail = await selectUserByEmailRow(email);
        if (existingByEmail) {
          if (existingByEmail.auth0_sub && existingByEmail.auth0_sub !== auth0Sub) {
            res.status(409).json({ error: "Este email já está vinculado a outro login Auth0." });
            return;
          }

          const linked = await linkAuth0UserRecord({
            userId: existingByEmail.id,
            auth0Sub,
            name,
            picture,
          });
          if (!linked) {
            res.status(409).json({ error: "Não foi possível vincular esta conta Auth0." });
            return;
          }
          user = await selectUserByIdRow(existingByEmail.id);
        }
      }

      if (!user) {
        const createdUserId = await createAuth0UserRecord({
          auth0Sub,
          email,
          name,
          picture,
        });
        user = await selectUserByIdRow(createdUserId);
      }

      if (!user) {
        res.status(500).json({ error: "Falha ao sincronizar usuário Auth0." });
        return;
      }

      if (user.is_banned) {
        res.status(403).json({
          error: user.ban_reason
            ? `Usuário bloqueado pelo administrador: ${user.ban_reason}`
            : "Usuário bloqueado pelo administrador.",
        });
        return;
      }

      const token = await createSession(user.id);
      setSessionCookie(res, token, isProduction);
      res.json({
        ...sanitizeUser(user),
        token,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao autenticar com Auth0.";
      const claims = auth0Token ? decodeAuth0ClaimsUnsafe(auth0Token) : null;
      const code = getAuth0SyncErrorCode(message);
      const diagnostics = {
        code,
        configuredDomain: AUTH0_DOMAIN || "(empty)",
        expectedIssuer: AUTH0_ISSUER || "(empty)",
        expectedAudience: AUTH0_EXPECTED_AUDIENCE || "(empty)",
        configuredClientIdSuffix: AUTH0_CLIENT_ID ? AUTH0_CLIENT_ID.slice(-6) : "(empty)",
        tokenIssuer: claims?.iss ?? "(unreadable)",
        tokenAudience: claims?.aud ?? "(unreadable)",
        tokenSubjectPrefix: claims?.sub ? String(claims.sub).slice(0, 12) : "(unreadable)",
      };
      console.warn("[auth0] sync failed", { message, ...diagnostics });
      res.status(401).json({
        error: message,
        ...diagnostics,
      });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const body = req.body as Record<string, unknown>;
      const name = String(body.name ?? "").trim();
      const email = normalizeEmail(String(body.email ?? ""));
      const password = String(body.password ?? "").trim();

      if (name.length < 2) {
        res.status(400).json({ error: "Nome deve ter pelo menos 2 caracteres." });
        return;
      }
      if (!EMAIL_REGEX.test(email)) {
        res.status(400).json({ error: "Email inválido." });
        return;
      }
      if (password.length < 6) {
        res.status(400).json({ error: "Senha deve ter pelo menos 6 caracteres." });
        return;
      }

      const existingUser = await selectUserByEmailRow(email);
      if (existingUser) {
        res.status(409).json({ error: "Este email já está cadastrado." });
        return;
      }

      const passwordCredentials = createPasswordCredentials(password);
      const userId = await createUserRecord(
        name,
        email,
        passwordCredentials.hash,
        passwordCredentials.salt,
      );

      const createdUser = await selectUserByIdRow(userId);
      if (!createdUser) {
        res.status(500).json({ error: "Falha ao criar usuário." });
        return;
      }

      const token = await createSession(createdUser.id);
      setSessionCookie(res, token, isProduction);
      res.status(201).json({
        ...sanitizeUser(createdUser),
        token,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao criar conta.";
      res.status(500).json({ error: message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const body = req.body as Record<string, unknown>;
      const email = normalizeEmail(String(body.email ?? ""));
      const password = String(body.password ?? "").trim();

      if (!EMAIL_REGEX.test(email) || !password) {
        res.status(400).json({ error: "Email e senha são obrigatórios." });
        return;
      }

      const user = await selectUserByEmailRow(email);
      if (!user || !verifyPassword(password, user.password_salt, user.password_hash)) {
        res.status(401).json({ error: "Email ou senha inválidos." });
        return;
      }

      if (user.is_banned) {
        res.status(403).json({
          error: user.ban_reason
            ? `Usuário bloqueado pelo administrador: ${user.ban_reason}`
            : "Usuário bloqueado pelo administrador.",
        });
        return;
      }

      const token = await createSession(user.id);
      setSessionCookie(res, token, isProduction);
      res.json({
        ...sanitizeUser(user),
        token,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao realizar login.";
      res.status(500).json({ error: message });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      const user = await getSessionUser(req);
      if (!user) {
        res.status(401).json({ error: "Sessão não encontrada." });
        return;
      }

      const token = getSessionTokenFromRequest(req);
      if (token) {
        res.json({
          ...user,
          token,
        });
        return;
      }

      res.json(user);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar sessão.";
      res.status(500).json({ error: message });
    }
  });

  app.put("/api/profile", async (req, res) => {
    const sessionUser = await requireAuth(req, res);
    if (!sessionUser) {
      return;
    }

    try {
      const currentUser = await selectUserByIdRow(sessionUser.id);
      if (!currentUser) {
        res.status(404).json({ error: "Usuário não encontrado." });
        return;
      }

      const body = req.body as Record<string, unknown>;
      const name = normalizeTextField(body.name ?? currentUser.name, "Nome", 120);
      const country = normalizeTextField(body.country ?? currentUser.country ?? "", "Pais", 120);
      const state = normalizeTextField(body.state ?? currentUser.state ?? "", "Estado", 120);
      const city = normalizeTextField(body.city ?? currentUser.city ?? "", "Cidade", 120);
      const neighborhood = normalizeTextField(
        body.neighborhood ?? currentUser.neighborhood ?? "",
        "Bairro",
        120,
      );
      const street = normalizeTextField(body.street ?? currentUser.street ?? "", "Rua", 200);
      const whatsappCountryIso = normalizeWhatsappCountryIso(
        body.whatsappCountryIso ?? currentUser.whatsapp_country_iso ?? "IT",
      );
      const whatsappNumber = normalizeWhatsappNumber(
        body.whatsappNumber ?? currentUser.whatsapp_number ?? "",
        whatsappCountryIso,
      );

      if (name.length < 2) {
        res.status(400).json({ error: "Nome deve ter pelo menos 2 caracteres." });
        return;
      }
      if (!whatsappNumber) {
        res.status(400).json({ error: "Numero de WhatsApp e obrigatorio." });
        return;
      }

      await updateUserProfileRecord({
        id: currentUser.id,
        name,
        country,
        state,
        city,
        neighborhood,
        street,
        whatsapp_country_iso: whatsappCountryIso,
        whatsapp_number: whatsappNumber,
      });

      const updatedUser = await selectUserByIdRow(currentUser.id);
      if (!updatedUser) {
        res.status(500).json({ error: "Falha ao atualizar perfil." });
        return;
      }

      res.json(sanitizeUser(updatedUser));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao atualizar perfil.";
      res.status(400).json({ error: message });
    }
  });

  app.put("/api/profile/location", async (req, res) => {
    const sessionUser = await requireAuth(req, res);
    if (!sessionUser) {
      return;
    }

    try {
      const body = req.body as Record<string, unknown>;
      const latitude = toNullableNumber(body.latitude);
      const longitude = toNullableNumber(body.longitude);

      if (
        latitude === null ||
        longitude === null ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        res.status(400).json({ error: "Localização inválida." });
        return;
      }

      await updateUserLocationRecord(sessionUser.id, latitude, longitude);

      const updatedUser = await selectUserByIdRow(sessionUser.id);
      if (!updatedUser) {
        res.status(500).json({ error: "Falha ao atualizar localização." });
        return;
      }

      res.json(sanitizeUser(updatedUser));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao atualizar localização.";
      res.status(400).json({ error: message });
    }
  });

  app.put(["/api/profile/locale", "/api/auth/locale"], async (req, res) => {
    const sessionUser = await requireAuth(req, res);
    if (!sessionUser) {
      return;
    }

    try {
      const body = req.body as Record<string, unknown>;
      const locale = normalizeAppLocale(body.locale ?? body.language ?? body.lang);
      if (!locale) {
        res.status(400).json({ error: "Idioma inválido." });
        return;
      }

      await updateUserPreferredLocaleRecord(sessionUser.id, locale);
      const updatedUser = await selectUserByIdRow(sessionUser.id);
      if (!updatedUser) {
        res.status(500).json({ error: "Falha ao atualizar idioma." });
        return;
      }

      res.json(sanitizeUser(updatedUser));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao atualizar idioma.";
      res.status(400).json({ error: message });
    }
  });

  app.get("/api/profile/new-product-defaults", async (req, res) => {
    const sessionUser = await requireAuth(req, res);
    if (!sessionUser) {
      return;
    }

    try {
      const defaults = await selectUserNewProductDraftDefaultsRecord(sessionUser.id);
      res.json(defaults);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Falha ao carregar preferências do anúncio.";
      res.status(500).json({ error: message });
    }
  });

  app.put("/api/profile/new-product-defaults", async (req, res) => {
    const sessionUser = await requireAuth(req, res);
    if (!sessionUser) {
      return;
    }

    try {
      const defaults = normalizeNewProductDraftDefaultsPayload(req.body, true);
      await updateUserNewProductDraftDefaultsRecord(sessionUser.id, defaults);
      res.json(defaults);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha ao salvar preferências do anúncio.";
      res.status(400).json({ error: message });
    }
  });

  app.put("/api/profile/avatar", async (req, res) => {
    const sessionUser = await requireAuth(req, res);
    if (!sessionUser) {
      return;
    }

    try {
      const body = req.body as Record<string, unknown>;
      const avatarUrl = normalizeAvatarUrl(body.avatarUrl);
      await updateUserAvatarRecord(sessionUser.id, avatarUrl);

      const updatedUser = await selectUserByIdRow(sessionUser.id);
      if (!updatedUser) {
        res.status(404).json({ error: "Usuário não encontrado." });
        return;
      }

      res.json(sanitizeUser(updatedUser));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao atualizar foto de perfil.";
      res.status(400).json({ error: message });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      const token = getSessionTokenFromRequest(req);
      if (token) {
        await deleteSessionByTokenHashRecord(hashToken(token));
      }

      clearSessionCookie(res, isProduction);
      res.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao encerrar sessão.";
      res.status(500).json({ error: message });
    }
  });

  app.get("/api/products", async (req, res) => {
    try {
      const locale = getRequestLocale(req);
      const hasPaginationQuery =
        req.query.limit !== undefined ||
        req.query.offset !== undefined ||
        req.query.search !== undefined ||
        req.query.category !== undefined ||
        req.query.maxPrice !== undefined;

      if (hasPaginationQuery) {
        const search = normalizeTextField(String(req.query.search ?? ""), "Busca", 120).toLowerCase();
        const category = normalizeTextField(String(req.query.category ?? "All"), "Categoria", 120);
        const maxPrice = normalizeProductPageMaxPrice(req.query.maxPrice);
        const limit = normalizeProductPageLimit(req.query.limit, 36);
        const offset = normalizeProductPageOffset(req.query.offset);
        const page = await selectProductsPageRows({
          search,
          category,
          maxPrice,
          limit,
          offset,
        });

        res.json({
          products: page.rows.map((row) => rowToProduct(row, locale)),
          pagination: {
            limit,
            offset,
            returned: page.rows.length,
            hasMore: page.hasMore,
            nextOffset: offset + page.rows.length,
          },
        });
        return;
      }

      const rows = await selectAllProductsRows();
      res.json(rows.map((row) => rowToProduct(row, locale)));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao listar produtos.";
      res.status(500).json({ error: message });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    const productId = Number(req.params.id);
    if (!Number.isInteger(productId) || productId <= 0) {
      res.status(400).json({ error: "ID de produto inválido." });
      return;
    }

    try {
      const locale = getRequestLocale(req);
      const product = await selectProductByIdRow(productId);
      if (!product) {
        res.status(404).json({ error: "Produto não encontrado." });
        return;
      }
      res.json(rowToProduct(product, locale));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar produto.";
      res.status(500).json({ error: message });
    }
  });

  app.post("/api/products/:id/click", async (req, res) => {
    const productId = Number(req.params.id);
    if (!Number.isInteger(productId) || productId <= 0) {
      res.status(400).json({ error: "ID de produto inválido." });
      return;
    }

    try {
      const clickCount = await incrementProductClickCountRecord(productId);
      if (clickCount === undefined) {
        res.status(404).json({ error: "Produto não encontrado." });
        return;
      }
      res.json({
        success: true,
        clickCount,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao registrar clique no produto.";
      res.status(500).json({ error: message });
    }
  });

  app.get("/api/products/:id/comments", async (req, res) => {
    const productId = Number(req.params.id);
    if (!Number.isInteger(productId) || productId <= 0) {
      res.status(400).json({ error: "ID de produto inválido." });
      return;
    }

    try {
      const locale = getRequestLocale(req);
      const product = await selectProductByIdRow(productId);
      if (!product) {
        res.status(404).json({ error: "Produto não encontrado." });
        return;
      }

      const comments = await selectProductCommentsRows(productId);
      res.json({ comments: buildProductCommentsThread(comments, locale) });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha ao carregar comentários do produto.";
      res.status(500).json({ error: message });
    }
  });

  app.post("/api/products/:id/comments", async (req, res) => {
    const user = await requireAuth(req, res);
    if (!user) {
      return;
    }

    const productId = Number(req.params.id);
    if (!Number.isInteger(productId) || productId <= 0) {
      res.status(400).json({ error: "ID de produto inválido." });
      return;
    }

    try {
      const locale = getRequestLocale(req);
      const product = await selectProductByIdRow(productId);
      if (!product) {
        res.status(404).json({ error: "Produto não encontrado." });
        return;
      }

      const body = req.body as Record<string, unknown>;
      const parentCommentId = toOptionalPositiveInteger(
        body.parentCommentId ?? body.parent_comment_id,
      );
      const isReply = parentCommentId !== null;
      const commentBody = normalizeIncomingProductCommentBody(
        body.body ?? body.comment ?? body.message,
      );
      const rating = normalizeIncomingProductCommentRating(
        body.rating ?? body.stars,
        !isReply,
      );

      let parentComment: ProductCommentRow | undefined;
      if (isReply) {
        if (rating !== null) {
          res.status(400).json({ error: "Respostas não aceitam avaliação em estrelas." });
          return;
        }

        parentComment = await selectProductCommentByIdRow(parentCommentId);
        if (!parentComment || parentComment.product_id !== productId) {
          res.status(400).json({ error: "Comentário pai inválido para esta publicação." });
          return;
        }

        if (!product.user_id || product.user_id !== user.id) {
          res
            .status(403)
            .json({ error: "Somente o dono da publicação pode responder comentários." });
          return;
        }
      }

      await createProductCommentRecord({
        productId,
        userId: user.id,
        parentCommentId,
        rating,
        body: commentBody,
      });
      if (isReply && parentComment?.user_id && parentComment.user_id !== user.id) {
        notifyUserNotificationsChanged(parentComment.user_id, "product-comment-reply");
      } else if (product.user_id && product.user_id !== user.id) {
        notifyUserNotificationsChanged(product.user_id, "product-comment");
      }

      const comments = await selectProductCommentsRows(productId);
      res.status(201).json({ comments: buildProductCommentsThread(comments, locale) });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha ao salvar comentário do produto.";
      res.status(400).json({ error: message });
    }
  });

  app.patch("/api/products/:productId/comments/:commentId", async (req, res) => {
    const user = await requireAuth(req, res);
    if (!user) {
      return;
    }

    const productId = Number(req.params.productId);
    const commentId = Number(req.params.commentId);
    if (!Number.isInteger(productId) || productId <= 0 || !Number.isInteger(commentId) || commentId <= 0) {
      res.status(400).json({ error: "ID inválido." });
      return;
    }

    try {
      const locale = getRequestLocale(req);
      const comment = await selectProductCommentByIdRow(commentId);
      if (!comment || comment.product_id !== productId) {
        res.status(404).json({ error: "Comentário não encontrado." });
        return;
      }
      if (comment.user_id !== user.id) {
        res.status(403).json({ error: "Você só pode editar seus próprios comentários." });
        return;
      }

      const body = req.body as Record<string, unknown>;
      const updated = await updateProductCommentRecord(
        commentId,
        user.id,
        String(body.body ?? body.comment ?? body.message ?? ""),
      );
      if (!updated) {
        res.status(404).json({ error: "Comentário não encontrado." });
        return;
      }

      const comments = await selectProductCommentsRows(productId);
      res.json({ comments: buildProductCommentsThread(comments, locale) });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao editar comentário.";
      res.status(400).json({ error: message });
    }
  });

  app.delete("/api/products/:productId/comments/:commentId", async (req, res) => {
    const user = await requireAuth(req, res);
    if (!user) {
      return;
    }

    const productId = Number(req.params.productId);
    const commentId = Number(req.params.commentId);
    if (!Number.isInteger(productId) || productId <= 0 || !Number.isInteger(commentId) || commentId <= 0) {
      res.status(400).json({ error: "ID inválido." });
      return;
    }

    try {
      const locale = getRequestLocale(req);
      const comment = await selectProductCommentByIdRow(commentId);
      if (!comment || comment.product_id !== productId) {
        res.status(404).json({ error: "Comentário não encontrado." });
        return;
      }
      if (comment.user_id !== user.id) {
        res.status(403).json({ error: "Você só pode excluir seus próprios comentários." });
        return;
      }

      const deleted = await deleteProductCommentRecord(commentId, user.id);
      if (!deleted) {
        res.status(404).json({ error: "Comentário não encontrado." });
        return;
      }

      const comments = await selectProductCommentsRows(productId);
      res.json({ comments: buildProductCommentsThread(comments, locale) });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao excluir comentário.";
      res.status(400).json({ error: message });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId) || userId <= 0) {
      res.status(400).json({ error: "ID de usuário inválido." });
      return;
    }

    try {
      const user = await selectUserByIdRow(userId);
      if (!user) {
        res.status(404).json({ error: "Usuário não encontrado." });
        return;
      }
      res.json(sanitizePublicUser(user));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar vendedor.";
      res.status(500).json({ error: message });
    }
  });

  app.get("/api/vendors", async (req, res) => {
    try {
      const rawSearch = String(req.query.search ?? "");
      const rawLimit = Number(req.query.limit ?? 60);
      const search = normalizeTextField(rawSearch, "Busca", 120).toLowerCase();
      const limit = Number.isFinite(rawLimit) ? rawLimit : 60;
      const rows = await selectVendorsRows(search, limit);
      res.json(rows.map(rowToPublicVendor));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao listar vendedores.";
      const statusCode = message.includes("Busca") ? 400 : 500;
      res.status(statusCode).json({ error: message });
    }
  });

  app.get("/api/vendors/:id/products", async (req, res) => {
    const locale = getRequestLocale(req);
    const vendorId = Number(req.params.id);
    if (!Number.isInteger(vendorId) || vendorId <= 0) {
      res.status(400).json({ error: "ID de vendedor inválido." });
      return;
    }

    try {
      const vendor = await selectUserByIdRow(vendorId);
      if (!vendor) {
        res.status(404).json({ error: "Vendedor não encontrado." });
        return;
      }

      const vendorProducts = await selectProductsByOwnerRows(vendorId);
      const vendorRecord: PublicVendorRecord = {
        id: vendor.id,
        name: vendor.name || `Vendedor ${vendor.id}`,
        avatarUrl: vendor.avatar_url ?? "",
        productCount: vendorProducts.length,
      };

      res.json({
        vendor: vendorRecord,
        products: vendorProducts.map((row) => rowToProduct(row, locale)),
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha ao listar produtos do vendedor.";
      res.status(500).json({ error: message });
    }
  });

  app.get("/api/my-products", async (req, res) => {
    const user = await requireAuth(req, res);
    if (!user) {
      return;
    }
    const locale = getRequestLocale(req);

    try {
      const rows = await selectProductsByOwnerRows(user.id);
      res.json(rows.map((row) => rowToProduct(row, locale)));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao listar seus produtos.";
      res.status(500).json({ error: message });
    }
  });

  app.get("/api/likes", async (req, res) => {
    const user = await requireAuth(req, res);
    if (!user) {
      return;
    }
    const locale = getRequestLocale(req);

    try {
      const rows = await selectLikedProductsByUserRows(user.id);
      res.json(rows.map((row) => rowToProduct(row, locale)));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao listar curtidas.";
      res.status(500).json({ error: message });
    }
  });

  app.get("/api/products/:id/likes", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "ID inválido." });
      return;
    }

    try {
      const product = await selectProductByIdRow(id);
      if (!product) {
        res.status(404).json({ error: "Produto não encontrado." });
        return;
      }
      const rows = await selectProductLikerRows(id);
      res.json({ users: rows.map(rowToPublicLiker) });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao listar curtidas do produto.";
      res.status(500).json({ error: message });
    }
  });

  app.get("/api/notifications", async (req, res) => {
    const user = await requireAuth(req, res);
    if (!user) {
      return;
    }

    try {
      const rows = await selectNotificationsByOwnerRows(user.id);
      res.json(rows.map(rowToNotification));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao listar notificações.";
      res.status(500).json({ error: message });
    }
  });

  app.get("/api/notifications/events", async (req, res) => {
    const user = await getNotificationStreamUser(req);
    if (!user) {
      res.status(401).json({ error: "Faça login para continuar." });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const client = addNotificationStreamClient(user.id, res);
    req.on("close", () => {
      removeNotificationStreamClient(user.id, client);
    });
  });

  app.delete("/api/notifications/:id", async (req, res) => {
    const user = await requireAuth(req, res);
    if (!user) {
      return;
    }

    try {
      const eventId = decodeURIComponent(String(req.params.id ?? "")).trim();
      await dismissNotificationRecord(user.id, eventId);
      notifyUserNotificationsChanged(user.id, "notification-dismissed");
      res.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao excluir notificação.";
      res.status(400).json({ error: message });
    }
  });

  app.post("/api/notifications/:id/restore", async (req, res) => {
    const user = await requireAuth(req, res);
    if (!user) {
      return;
    }

    try {
      const eventId = decodeURIComponent(String(req.params.id ?? "")).trim();
      await restoreNotificationRecord(user.id, eventId);
      notifyUserNotificationsChanged(user.id, "notification-restored");
      res.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao restaurar notificação.";
      res.status(400).json({ error: message });
    }
  });

  app.post("/api/products/:id/cart-interest", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "ID inválido." });
      return;
    }

    try {
      const existing = await selectProductByIdRow(id);
      if (!existing) {
        res.status(404).json({ error: "Produto não encontrado." });
        return;
      }

      const ownerUserId = existing.user_id;
      if (!ownerUserId || ownerUserId <= 0) {
        res.json({ success: true });
        return;
      }

      const actorUser = await getSessionUser(req);
      if (actorUser && actorUser.id === ownerUserId) {
        res.json({ success: true });
        return;
      }

      const createdNotification = await createProductCartNotificationRecord(
        ownerUserId,
        id,
        actorUser?.id ?? null,
        actorUser?.name ?? "",
      );
      if (createdNotification) {
        notifyUserNotificationsChanged(ownerUserId, "product-cart-interest");
      }

      res.status(201).json({ success: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha ao registrar interesse no carrinho.";
      res.status(500).json({ error: message });
    }
  });

  app.post("/api/products", async (req, res) => {
    const user = await requireAuth(req, res);
    if (!user) {
      return;
    }
    if (!hasRequiredProfileForPublishing(user)) {
      res.status(400).json({
        error: "Para publicar, complete seu perfil com nome e numero de telefone.",
      });
      return;
    }

    try {
      const locale = getRequestLocale(req);
      const normalized = normalizeIncomingProduct(req.body);
      const productId = await createProductRecord(normalized, user.id);
      const created = await selectProductByIdRow(productId);

      if (!created) {
        res.status(500).json({ error: "Falha ao salvar o produto." });
        return;
      }

      res.status(201).json(rowToProduct(created, locale));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao criar produto.";
      res.status(400).json({ error: message });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    const user = await requireAuth(req, res);
    if (!user) {
      return;
    }

    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "ID inválido." });
      return;
    }

    try {
      const locale = getRequestLocale(req);
      const existing = await selectProductByIdRow(id);
      if (!existing) {
        res.status(404).json({ error: "Produto não encontrado." });
        return;
      }
      if (existing.user_id !== user.id) {
        res.status(403).json({ error: "Você não tem permissão para editar este produto." });
        return;
      }

      const normalized = normalizeIncomingProduct(req.body);
      await updateProductRecord(id, normalized);

      const updated = await selectProductByIdRow(id);
      if (!updated) {
        res.status(500).json({ error: "Falha ao atualizar o produto." });
        return;
      }

      res.json(rowToProduct(updated, locale));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao atualizar produto.";
      res.status(400).json({ error: message });
    }
  });

  app.post("/api/products/:id/like", async (req, res) => {
    const user = await requireAuth(req, res);
    if (!user) {
      return;
    }

    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "ID inválido." });
      return;
    }

    try {
      const existing = await selectProductByIdRow(id);
      if (!existing) {
        res.status(404).json({ error: "Produto não encontrado." });
        return;
      }

      await createProductLikeRecord(user.id, id);
      if (existing.user_id && existing.user_id !== user.id) {
        notifyUserNotificationsChanged(existing.user_id, "product-like");
      }
      res.status(201).json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao curtir produto.";
      res.status(500).json({ error: message });
    }
  });

  app.delete("/api/products/:id/like", async (req, res) => {
    const user = await requireAuth(req, res);
    if (!user) {
      return;
    }

    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "ID inválido." });
      return;
    }

    try {
      await deleteProductLikeRecord(user.id, id);
      res.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao remover curtida.";
      res.status(500).json({ error: message });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    const user = await requireAuth(req, res);
    if (!user) {
      return;
    }

    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "ID inválido." });
      return;
    }

    try {
      const existing = await selectProductByIdRow(id);
      if (!existing) {
        res.status(404).json({ error: "Produto não encontrado." });
        return;
      }

      if (existing.user_id !== user.id) {
        res.status(403).json({ error: "Você não tem permissão para excluir este produto." });
        return;
      }

      await deleteProductRecord(id);
      res.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao excluir produto.";
      res.status(500).json({ error: message });
    }
  });

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Rota da API não encontrada." });
  });

  if (isProduction) {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== "true" },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(port, () => {
    const mode = isProduction ? "production" : "development";
    console.log(`Server running at http://localhost:${port} (${mode})`);
    console.log("Database: PostgreSQL via DATABASE_URL");
    console.log(`Database search_path: ${DATABASE_SEARCH_PATH}`);
    if (IS_DEV_REMOTE_READ_ONLY) {
      console.log("Remote database dev mode: READ ONLY");
    }
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start local server:", error);
  process.exit(1);
});
