import React from "react";
import { translate as translateInterface } from "../i18n";
import AdminPublicationHealth from './AdminPublicationHealth';
import AdminTaxonomy from './AdminTaxonomy';
import {
  LoaderCircle,
  Shield,
  RefreshCw,
  LogOut,
  Search,
  Trash2,
  Ban,
  CheckCircle2,
  Lock,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Users,
  LayoutDashboard,
  Smartphone,
  Monitor,
  Bot,
  ChevronDown,
  Copy,
  KeyRound,
  MessageCircle,
  Package,
  Eye,
  EyeOff,
  X,
  Bell,
} from "lucide-react";
import {
  getSecurityCategoryLabel,
  runComprehensiveSecurityScan,
  type SecurityCheckCategory,
  type SecurityCheckResult,
  type SecurityCheckStatus,
} from "../lib/security-scanner";

type AdminUserV2 = {
  id: number;
  username: string;
  email: string;
  phone?: string;
  country?: string;
  state?: string;
  city?: string;
  neighborhood?: string;
  street?: string;
  whatsappCountryIso?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  createdAt?: string;
  isBanned: boolean;
  banReason?: string;
};

type AdminProductV2 = {
  id: number;
  name: string;
  category?: string;
  price?: string;
  city?: string;
  createdAt?: string;
  clickCount?: number;
  quantity?: number;
  ownerId?: number;
  sellerName?: string;
  sellerWhatsappNumber?: string;
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

type AdminProductsResponseV2 = {
  products: AdminProductV2[];
  hasMore: boolean;
  nextOffset: number;
};

type AdminPublicationV2 = {
  id: number;
  caption: string;
  establishmentName: string;
  ownerName?: string;
};

type AdminBroadcastNotificationV2 = {
  id: number;
  title: string;
  message: string;
  translationStatus?: Record<string, string>;
  productId?: number;
  productName?: string;
  publicationId?: number;
  publicationName?: string;
  recipientUserId?: number;
  recipientName?: string;
  recipientEmail?: string;
  createdBy?: string;
  createdAt: number;
};

type AdminSessionV2 = {
  email: string;
  token: string;
};

type AdminViewV2 = "overview" | "products" | "users" | "notifications" | "visitors" | "security" | "taxonomy";

type SecurityEventFilter = "all" | SecurityCheckStatus;

type AdminSecurityEventV2 = {
  id: number;
  createdAt: number;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  ip: string;
  userAgent: string;
  level: SecurityCheckStatus;
  note: string;
  isAdminRoute: boolean;
  hasAuthToken: boolean;
  hasAdminToken: boolean;
};

type AdminSecurityEventsResponseV2 = {
  events: AdminSecurityEventV2[];
  totalTracked: number;
};

type AdminVisitorsSummaryV2 = {
  totalVisits: number;
  uniqueVisitors: number;
  externalVisits: number;
  externalUniqueVisitors: number;
  selfVisits: number;
  selfUniqueVisitors: number;
};

type AdminVisitorV2 = {
  id: number;
  visitorKey: string;
  label: string;
  isSelf: boolean;
  visits: number;
  firstSeenAt: number;
  lastSeenAt: number;
  ip: string;
  entryPath: string;
  referrer: string;
  referrerHost: string;
  country: string;
  region: string;
  city: string;
  userAgent: string;
  deviceType: string;
  deviceModel: string;
  deviceOsName: string;
  deviceOsVersion: string;
};

type AdminVisitorsResponseV2 = {
  day: string;
  generatedAt: number;
  selfVisitorKey: string;
  summary: AdminVisitorsSummaryV2;
  visitors: AdminVisitorV2[];
};

class HttpError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.body = body;
  }
}

const ADMIN_TOKEN_STORAGE_KEY = "templesale_admin_token_v2";
const ADMIN_EMAIL_STORAGE_KEY = "templesale_admin_email_v2";
const ADMIN_REMEMBER_PASSWORD_STORAGE_KEY = "templesale_admin_remember_password_v2";
const ADMIN_PASSWORD_STORAGE_KEY = "templesale_admin_password_v2";
const SECURITY_EVENTS_LIMIT = 120;
const SECURITY_EVENTS_POLL_INTERVAL_MS = 3500;
const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL ?? "")
  .trim()
  .replace(/\/+$/, "");

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function buildApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
}

function readStoredToken(): string {
  if (!canUseStorage()) {
    return "";
  }
  return String(window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) ?? "").trim();
}

function readStoredEmail(): string {
  if (!canUseStorage()) {
    return "";
  }
  return String(window.localStorage.getItem(ADMIN_EMAIL_STORAGE_KEY) ?? "")
    .trim()
    .toLowerCase();
}

function persistSession(session: AdminSessionV2) {
  if (!canUseStorage()) {
    return;
  }
  if (session.token) {
    window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, session.token);
  } else {
    window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
  }
  if (session.email) {
    window.localStorage.setItem(ADMIN_EMAIL_STORAGE_KEY, session.email.toLowerCase());
  }
}

function clearSessionStorage() {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(ADMIN_EMAIL_STORAGE_KEY);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function extractApiMessage(payload: unknown): string {
  const record = asRecord(payload);
  if (!record) {
    return "";
  }
  if (typeof record.error === "string" && record.error.trim()) {
    return record.error.trim();
  }
  if (typeof record.message === "string" && record.message.trim()) {
    return record.message.trim();
  }
  return "";
}

function extractTokenFromPayload(payload: unknown): string {
  const record = asRecord(payload);
  if (!record) {
    return "";
  }

  const directCandidates = [
    record.token,
    record.accessToken,
    record.access_token,
    record.adminToken,
    record.admin_token,
    record.jwt,
  ];
  for (const candidate of directCandidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  const nestedCandidates = [record.data, record.auth, record.session, record.result];
  for (const nested of nestedCandidates) {
    const nestedRecord = asRecord(nested);
    if (!nestedRecord) {
      continue;
    }
    const nestedToken = extractTokenFromPayload(nestedRecord);
    if (nestedToken) {
      return nestedToken;
    }
  }

  return "";
}

function extractEmailFromPayload(payload: unknown): string {
  const record = asRecord(payload);
  if (!record) {
    return "";
  }

  const directCandidates = [record.email, record.mail, record.login, record.username, record.name];
  for (const candidate of directCandidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim().toLowerCase();
    }
  }

  const nestedCandidates = [
    record.data,
    record.user,
    record.admin,
    record.auth,
    record.session,
    record.current,
    record.me,
  ];
  for (const nested of nestedCandidates) {
    const nestedRecord = asRecord(nested);
    if (!nestedRecord) {
      continue;
    }
    const nestedEmail = extractEmailFromPayload(nestedRecord);
    if (nestedEmail) {
      return nestedEmail;
    }
  }

  return "";
}

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return ["1", "true", "yes", "sim", "on"].includes(normalized);
  }
  return false;
}

function normalizeAdminUser(item: unknown): AdminUserV2 | null {
  const record = asRecord(item);
  if (!record) {
    return null;
  }

  const idRaw = record.id ?? record.user_id ?? record.userId;
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  const email = String(record.email ?? "").trim().toLowerCase();
  const username = String(record.username ?? record.name ?? "").trim() || email || `Usuário ${id}`;

  const user: AdminUserV2 = {
    id,
    username,
    email,
    isBanned: toBoolean(record.is_banned ?? record.isBanned),
  };

  const phone = String(record.phone ?? "").trim();
  if (phone) {
    user.phone = phone;
  }

  const country = String(record.country ?? "").trim();
  if (country) {
    user.country = country;
  }

  const state = String(record.state ?? "").trim();
  if (state) {
    user.state = state;
  }

  const city = String(record.city ?? "").trim();
  if (city) {
    user.city = city;
  }

  const neighborhood = String(record.neighborhood ?? "").trim();
  if (neighborhood) {
    user.neighborhood = neighborhood;
  }

  const street = String(record.street ?? "").trim();
  if (street) {
    user.street = street;
  }

  const whatsappCountryIso = String(
    record.whatsapp_country_iso ?? record.whatsappCountryIso ?? "",
  )
    .trim()
    .toUpperCase();
  if (whatsappCountryIso) {
    user.whatsappCountryIso = whatsappCountryIso;
  }

  const locationLatitude = Number(record.location_latitude ?? record.locationLatitude);
  if (Number.isFinite(locationLatitude)) {
    user.locationLatitude = locationLatitude;
  }

  const locationLongitude = Number(record.location_longitude ?? record.locationLongitude);
  if (Number.isFinite(locationLongitude)) {
    user.locationLongitude = locationLongitude;
  }

  const createdAt = String(record.created_at ?? record.createdAt ?? "").trim();
  if (createdAt) {
    user.createdAt = createdAt;
  }

  const banReason = String(record.ban_reason ?? record.banReason ?? "").trim();
  if (banReason) {
    user.banReason = banReason;
  }

  return user;
}

function normalizeAdminUserList(payload: unknown): AdminUserV2[] {
  if (Array.isArray(payload)) {
    return payload
      .map((item) => normalizeAdminUser(item))
      .filter((item): item is AdminUserV2 => item !== null);
  }

  const record = asRecord(payload);
  if (!record) {
    return [];
  }

  const nestedCandidates = [record.data, record.users, record.items, record.rows, record.results];
  for (const nested of nestedCandidates) {
    if (!Array.isArray(nested)) {
      continue;
    }
    return nested
      .map((item) => normalizeAdminUser(item))
      .filter((item): item is AdminUserV2 => item !== null);
  }

  return [];
}

function normalizeAdminProduct(item: unknown): AdminProductV2 | null {
  const record = asRecord(item);
  if (!record) {
    return null;
  }

  const id = Number(record.id ?? record.product_id ?? record.productId);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  const product: AdminProductV2 = {
    id,
    name: String(record.name ?? record.title ?? "").trim() || `Produto ${id}`,
  };
  const category = String(record.category ?? "").trim();
  if (category) {
    product.category = category;
  }
  const price = String(record.price ?? "").trim();
  if (price) {
    product.price = price;
  }
  const city = String(record.city ?? "").trim();
  if (city) {
    product.city = city;
  }
  const createdAt = String(record.created_at ?? record.createdAt ?? "").trim();
  if (createdAt) {
    product.createdAt = createdAt;
  }
  const clickCount = Number(record.click_count ?? record.clickCount);
  if (Number.isFinite(clickCount)) {
    product.clickCount = clickCount;
  }
  const quantity = Number(record.quantity);
  if (Number.isFinite(quantity)) {
    product.quantity = quantity;
  }
  const ownerId = Number(record.ownerId ?? record.owner_id ?? record.user_id);
  if (Number.isInteger(ownerId) && ownerId > 0) {
    product.ownerId = ownerId;
  }
  const sellerName = String(record.sellerName ?? record.seller_name ?? "").trim();
  if (sellerName) {
    product.sellerName = sellerName;
  }
  const sellerWhatsappNumber = String(
    record.sellerWhatsappNumber ?? record.seller_whatsapp_number ?? "",
  ).trim();
  if (sellerWhatsappNumber) {
    product.sellerWhatsappNumber = sellerWhatsappNumber;
  }

  const ownerRecord = asRecord(record.owner);
  if (ownerRecord) {
    const owner: NonNullable<AdminProductV2["owner"]> = {};
    const nestedOwnerId = Number(ownerRecord.id ?? ownerRecord.user_id ?? ownerRecord.userId);
    if (Number.isInteger(nestedOwnerId) && nestedOwnerId > 0) {
      owner.id = nestedOwnerId;
    }
    const ownerName = String(ownerRecord.name ?? ownerRecord.username ?? "").trim();
    if (ownerName) {
      owner.name = ownerName;
    }
    const ownerEmail = String(ownerRecord.email ?? "").trim().toLowerCase();
    if (ownerEmail) {
      owner.email = ownerEmail;
    }
    const ownerCountry = String(ownerRecord.country ?? "").trim();
    if (ownerCountry) {
      owner.country = ownerCountry;
    }
    const ownerState = String(ownerRecord.state ?? "").trim();
    if (ownerState) {
      owner.state = ownerState;
    }
    const ownerCity = String(ownerRecord.city ?? "").trim();
    if (ownerCity) {
      owner.city = ownerCity;
    }
    const ownerWhatsappCountryIso = String(
      ownerRecord.whatsappCountryIso ?? ownerRecord.whatsapp_country_iso ?? "",
    )
      .trim()
      .toUpperCase();
    if (ownerWhatsappCountryIso) {
      owner.whatsappCountryIso = ownerWhatsappCountryIso;
    }
    const ownerWhatsappNumber = String(
      ownerRecord.whatsappNumber ?? ownerRecord.whatsapp_number ?? "",
    ).trim();
    if (ownerWhatsappNumber) {
      owner.whatsappNumber = ownerWhatsappNumber;
    }
    if (Object.keys(owner).length > 0) {
      product.owner = owner;
    }
  }
  return product;
}

function normalizeAdminProductList(payload: unknown): AdminProductV2[] {
  if (Array.isArray(payload)) {
    return payload
      .map((item) => normalizeAdminProduct(item))
      .filter((item): item is AdminProductV2 => item !== null);
  }

  const record = asRecord(payload);
  if (!record) {
    return [];
  }

  const nestedCandidates = [record.data, record.products, record.items, record.rows, record.results];
  for (const nested of nestedCandidates) {
    if (!Array.isArray(nested)) {
      continue;
    }
    return nested
      .map((item) => normalizeAdminProduct(item))
      .filter((item): item is AdminProductV2 => item !== null);
  }

  return [];
}

function normalizeAdminProductsResponse(payload: unknown): AdminProductsResponseV2 {
  const record = asRecord(payload);
  if (!record) {
    const products = normalizeAdminProductList(payload);
    return { products, hasMore: false, nextOffset: products.length };
  }

  const products = normalizeAdminProductList(record.products ?? record.items ?? record.data ?? payload);
  const hasMore = toBoolean(record.hasMore ?? record.has_more);
  const nextOffsetRaw = Number(record.nextOffset ?? record.next_offset);
  return {
    products,
    hasMore,
    nextOffset: Number.isFinite(nextOffsetRaw) ? nextOffsetRaw : products.length,
  };
}

function normalizeAdminPublication(item: unknown): AdminPublicationV2 | null {
  const record = asRecord(item);
  if (!record) {
    return null;
  }

  const id = toNumber(record.id ?? record.publicationId ?? record.publication_id);
  if (id <= 0) {
    return null;
  }

  const caption = String(record.caption ?? record.description ?? "").trim();
  const establishmentRecord = asRecord(record.establishment);
  const ownerRecord = asRecord(record.owner);
  const establishmentName = String(
    record.establishmentName ??
      record.establishment_name ??
      establishmentRecord?.name ??
      "",
  ).trim();
  const ownerName = String(
    record.ownerName ??
      record.owner_name ??
      record.ownerUserName ??
      record.owner_user_name ??
      ownerRecord?.name ??
      "",
  ).trim();

  return {
    id,
    caption: caption || "Publicação sem legenda",
    establishmentName: establishmentName || "Estabelecimento",
    ...(ownerName ? { ownerName } : {}),
  };
}

function normalizeAdminPublicationList(payload: unknown): AdminPublicationV2[] {
  const record = asRecord(payload);
  const candidates = record
    ? [record.publications, record.items, record.data, record.rows]
    : [payload];
  const rawItems = candidates.find((candidate) => Array.isArray(candidate));
  if (!Array.isArray(rawItems)) {
    return [];
  }

  return rawItems
    .map((item) => normalizeAdminPublication(item))
    .filter((item): item is AdminPublicationV2 => item !== null);
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function createEmptyVisitorsSummary(): AdminVisitorsSummaryV2 {
  return {
    totalVisits: 0,
    uniqueVisitors: 0,
    externalVisits: 0,
    externalUniqueVisitors: 0,
    selfVisits: 0,
    selfUniqueVisitors: 0,
  };
}

function getTodayDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function normalizeDateKey(value: unknown): string {
  const normalized = String(value ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized;
  }
  return getTodayDateKey();
}

function normalizeVisitorsSummary(payload: unknown): AdminVisitorsSummaryV2 {
  const record = asRecord(payload);
  if (!record) {
    return createEmptyVisitorsSummary();
  }

  return {
    totalVisits: Math.max(0, toNumber(record.totalVisits ?? record.total_visits)),
    uniqueVisitors: Math.max(0, toNumber(record.uniqueVisitors ?? record.unique_visitors)),
    externalVisits: Math.max(0, toNumber(record.externalVisits ?? record.external_visits)),
    externalUniqueVisitors: Math.max(
      0,
      toNumber(record.externalUniqueVisitors ?? record.external_unique_visitors),
    ),
    selfVisits: Math.max(0, toNumber(record.selfVisits ?? record.self_visits)),
    selfUniqueVisitors: Math.max(
      0,
      toNumber(record.selfUniqueVisitors ?? record.self_unique_visitors),
    ),
  };
}

function normalizeAdminVisitor(item: unknown): AdminVisitorV2 | null {
  const record = asRecord(item);
  if (!record) {
    return null;
  }

  const id = toNumber(record.id);
  if (id <= 0) {
    return null;
  }

  const label = String(record.label ?? "").trim();
  const fallbackLabel = toBoolean(record.isSelf ?? record.is_self) ? "Eu" : "Usuário";

  return {
    id,
    visitorKey: String(record.visitorKey ?? record.visitor_key ?? "").trim(),
    label: label || fallbackLabel,
    isSelf: toBoolean(record.isSelf ?? record.is_self),
    visits: Math.max(0, toNumber(record.visits)),
    firstSeenAt: Math.max(0, toNumber(record.firstSeenAt ?? record.first_seen_at)),
    lastSeenAt: Math.max(0, toNumber(record.lastSeenAt ?? record.last_seen_at)),
    ip: String(record.ip ?? "").trim() || "unknown",
    entryPath: String(record.entryPath ?? record.entry_path ?? "").trim() || "/",
    referrer: String(record.referrer ?? "").trim(),
    referrerHost: String(record.referrerHost ?? record.referrer_host ?? "").trim(),
    country: String(record.country ?? "").trim(),
    region: String(record.region ?? "").trim(),
    city: String(record.city ?? "").trim(),
    userAgent: String(record.userAgent ?? record.user_agent ?? "").trim() || "-",
    deviceType: String(record.deviceType ?? record.device_type ?? "").trim() || "unknown",
    deviceModel: String(record.deviceModel ?? record.device_model ?? "").trim() || "unknown",
    deviceOsName: String(record.deviceOsName ?? record.device_os_name ?? "").trim(),
    deviceOsVersion: String(record.deviceOsVersion ?? record.device_os_version ?? "").trim(),
  };
}

function normalizeVisitorsPayload(payload: unknown): AdminVisitorsResponseV2 {
  const record = asRecord(payload);
  if (!record) {
    return {
      day: getTodayDateKey(),
      generatedAt: Date.now(),
      selfVisitorKey: "",
      summary: createEmptyVisitorsSummary(),
      visitors: [],
    };
  }

  const rawVisitors = Array.isArray(record.visitors) ? record.visitors : [];
  const visitors = rawVisitors
    .map((item) => normalizeAdminVisitor(item))
    .filter((item): item is AdminVisitorV2 => item !== null);

  const generatedAt = toNumber(record.generatedAt ?? record.generated_at);

  return {
    day: normalizeDateKey(record.day),
    generatedAt: generatedAt > 0 ? generatedAt : Date.now(),
    selfVisitorKey: String(record.selfVisitorKey ?? record.self_visitor_key ?? "").trim(),
    summary: normalizeVisitorsSummary(record.summary),
    visitors,
  };
}

function normalizeSecurityLevel(value: unknown): SecurityCheckStatus {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "alert" || normalized === "fail") {
    return "fail";
  }
  if (normalized === "warn" || normalized === "warning") {
    return "warn";
  }
  return "pass";
}

function normalizeSecurityEvent(item: unknown): AdminSecurityEventV2 | null {
  const record = asRecord(item);
  if (!record) {
    return null;
  }

  const id = toNumber(record.id);
  const createdAt = toNumber(record.createdAt ?? record.created_at);
  const method = String(record.method ?? "").trim().toUpperCase();
  const path = String(record.path ?? "").trim();
  if (id <= 0 || createdAt <= 0 || !method || !path) {
    return null;
  }

  return {
    id,
    createdAt,
    method,
    path,
    status: toNumber(record.status),
    durationMs: toNumber(record.durationMs ?? record.duration_ms),
    ip: String(record.ip ?? "").trim() || "-",
    userAgent: String(record.userAgent ?? record.user_agent ?? "").trim() || "-",
    level: normalizeSecurityLevel(record.level),
    note: String(record.note ?? "").trim(),
    isAdminRoute: toBoolean(record.isAdminRoute ?? record.is_admin_route),
    hasAuthToken: toBoolean(record.hasAuthToken ?? record.has_auth_token),
    hasAdminToken: toBoolean(record.hasAdminToken ?? record.has_admin_token),
  };
}

function normalizeSecurityEventsPayload(payload: unknown): {
  events: AdminSecurityEventV2[];
  totalTracked: number;
} {
  const record = asRecord(payload);
  if (!record) {
    return { events: [], totalTracked: 0 };
  }

  const eventCandidates = [record.events, record.data, record.items, record.rows];
  let rawEvents: unknown[] = [];
  for (const candidate of eventCandidates) {
    if (Array.isArray(candidate)) {
      rawEvents = candidate;
      break;
    }
  }

  const events = rawEvents
    .map((item) => normalizeSecurityEvent(item))
    .filter((item): item is AdminSecurityEventV2 => item !== null);

  const totalTrackedRaw = toNumber(record.totalTracked ?? record.total_tracked);
  const totalTracked = totalTrackedRaw > 0 ? totalTrackedRaw : events.length;

  return { events, totalTracked };
}

function normalizeAdminBroadcastCreatedAt(value: unknown): number {
  const numericValue = toNumber(value);
  if (numericValue > 0) {
    return numericValue > 10_000_000_000 ? numericValue : numericValue * 1000;
  }

  const parsed = Date.parse(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function normalizeAdminBroadcastNotification(item: unknown): AdminBroadcastNotificationV2 | null {
  const record = asRecord(item);
  if (!record) {
    return null;
  }

  const id = toNumber(record.id);
  const title = String(record.title ?? "").trim();
  const message = String(record.message ?? "").trim();
  if (!id || !title || !message) {
    return null;
  }

  const notification: AdminBroadcastNotificationV2 = {
    id,
    title,
    message,
    createdAt: normalizeAdminBroadcastCreatedAt(record.createdAt ?? record.created_at),
  };

  const productId = toNumber(record.productId ?? record.product_id);
  if (productId > 0) {
    notification.productId = productId;
  }

  const productName = String(record.productName ?? record.product_name ?? "").trim();
  if (productName) {
    notification.productName = productName;
  }

  const publicationId = toNumber(record.publicationId ?? record.publication_id);
  if (publicationId > 0) {
    notification.publicationId = publicationId;
  }

  const publicationName = String(
    record.publicationName ?? record.publication_name ?? "",
  ).trim();
  if (publicationName) {
    notification.publicationName = publicationName;
  } else if (publicationId > 0 && productName) {
    notification.publicationName = productName;
  }

  const recipientUserId = toNumber(record.recipientUserId ?? record.recipient_user_id);
  if (recipientUserId > 0) {
    notification.recipientUserId = recipientUserId;
  }
  const recipientName = String(record.recipientName ?? record.recipient_name ?? "").trim();
  if (recipientName) {
    notification.recipientName = recipientName;
  }
  const recipientEmail = String(record.recipientEmail ?? record.recipient_email ?? "").trim();
  if (recipientEmail) {
    notification.recipientEmail = recipientEmail;
  }

  const createdBy = String(record.createdBy ?? record.created_by ?? "").trim();
  if (createdBy) {
    notification.createdBy = createdBy;
  }

  const rawTranslationStatus = asRecord(record.translationStatus ?? record.translation_status);
  if (rawTranslationStatus) {
    notification.translationStatus = Object.fromEntries(
      Object.entries(rawTranslationStatus)
        .map(([locale, status]) => [locale, String(status ?? "").trim()])
        .filter(([, status]) => status.length > 0),
    );
  }

  return notification;
}

function normalizeAdminBroadcastNotifications(payload: unknown): AdminBroadcastNotificationV2[] {
  const record = asRecord(payload);
  const candidates = record
    ? [record.notifications, record.broadcasts, record.items, record.data, record.rows]
    : [payload];
  const rawItems = candidates.find((candidate) => Array.isArray(candidate));
  if (!Array.isArray(rawItems)) {
    return [];
  }

  return rawItems
    .map((item) => normalizeAdminBroadcastNotification(item))
    .filter((item): item is AdminBroadcastNotificationV2 => item !== null);
}

function formatDate(value?: string): string {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function formatDateTime(value: number): string {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

function formatDayDate(value: string): string {
  if (!value) {
    return "-";
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

function generateResetCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getAdminUserDetailRows(user: AdminUserV2): Array<{ label: string; value: string }> {
  const coordinates =
    typeof user.locationLatitude === "number" && typeof user.locationLongitude === "number"
      ? `${user.locationLatitude.toFixed(5)}, ${user.locationLongitude.toFixed(5)}`
      : "";

  return [
    { label: "ID", value: String(user.id) },
    { label: "Nome", value: user.username || "-" },
    { label: "Email", value: user.email || "-" },
    { label: "Telefono", value: user.phone || "-" },
    { label: "Paese", value: user.country || "-" },
    { label: "Regione", value: user.state || "-" },
    { label: "Città", value: user.city || "-" },
    { label: "Quartiere", value: user.neighborhood || "-" },
    { label: "Via", value: user.street || "-" },
    { label: "WhatsApp ISO", value: user.whatsappCountryIso || "-" },
    { label: "Coordinate", value: coordinates || "-" },
    { label: "Creato il", value: formatDate(user.createdAt) },
    { label: "Status", value: user.isBanned ? "Bloccato" : "Attivo" },
    { label: "Motivo del blocco", value: user.banReason || "-" },
  ];
}

function buildWhatsappResetUrl(user: AdminUserV2, code: string): string {
  const digits = (user.phone || "").replace(/\D/g, "");
  if (!digits || !code) {
    return "";
  }

  const dialPrefixByIso: Record<string, string> = {
    BR: "55",
    IT: "39",
    PT: "351",
    US: "1",
  };
  const prefix = user.whatsappCountryIso ? dialPrefixByIso[user.whatsappCountryIso] : "";
  const phone = prefix && !digits.startsWith(prefix) ? `${prefix}${digits}` : digits;
  const message = `Ciao, il tuo codice temporaneo TempleSale è ${code}. Usalo come password, poi modificala nel profilo.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

const COUNTRY_NAME_BY_CODE: Record<string, string> = {
  BR: "Brasil",
  DE: "Alemanha",
  IT: "Itália",
  FR: "França",
  ES: "Espanha",
  PT: "Portugal",
  US: "Estados Unidos",
  GB: "Reino Unido",
  UK: "Reino Unido",
  AR: "Argentina",
  CL: "Chile",
  UY: "Uruguai",
  PY: "Paraguai",
  CO: "Colômbia",
  MX: "México",
  CA: "Canadá",
  CH: "Suíça",
  AT: "Áustria",
  NL: "Países Baixos",
  BE: "Bélgica",
  IE: "Irlanda",
  SE: "Suécia",
  NO: "Noruega",
  DK: "Dinamarca",
  FI: "Finlândia",
  PL: "Polônia",
};

function formatCountryName(value: string): string {
  const normalized=value.trim();
  if(!normalized)return '';
  try{return new Intl.DisplayNames(['it-IT'],{type:'region'}).of(normalized.toUpperCase())??normalized;}
  catch{return normalized;}
}

function formatVisitorLocation(visitor: AdminVisitorV2): string {
  const country = formatCountryName(visitor.country);
  const parts = [visitor.city, visitor.region, country]
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) {
    return "Posizione non identificata";
  }
  return parts.join(", ");
}

function formatVisitorCountryDetail(visitor: AdminVisitorV2): string {
  const countryName = formatCountryName(visitor.country);
  const countryCode = visitor.country.trim().toUpperCase();
  if (!countryName) {
    return "-";
  }
  if (countryCode && countryName !== countryCode) {
    return `${countryName} (${countryCode})`;
  }
  return countryName;
}

function getVisitorDeviceIcon(visitor: AdminVisitorV2) {
  if (visitor.deviceType === "bot") {
    return Bot;
  }
  if (visitor.deviceType === "mobile" || visitor.deviceType === "tablet") {
    return Smartphone;
  }
  return Monitor;
}

function formatVisitorDeviceSummary(visitor: AdminVisitorV2): string {
  const osName = visitor.deviceOsName.trim();
  const osVersion = visitor.deviceOsVersion.trim();
  const osLabel = [osName, osVersion].filter(Boolean).join(" ");

  if (visitor.deviceType === "bot") {
    return "Bot o controllo automatico";
  }
  if (visitor.deviceType === "mobile") {
    return osLabel ? `Smartphone ${osLabel}` : "Smartphone";
  }
  if (visitor.deviceType === "tablet") {
    return osLabel ? `Tablet ${osLabel}` : "Tablet";
  }
  if (visitor.deviceType === "desktop") {
    return osLabel ? `Computer ${osLabel}` : "Computer";
  }
  return osLabel || "Dispositivo non identificato";
}

function formatVisitorSource(visitor: AdminVisitorV2): string {
  if (visitor.referrerHost) {
    return visitor.referrerHost;
  }
  if (visitor.referrer) {
    return visitor.referrer;
  }
  return "Accesso diretto";
}

function getSecurityStatusStyles(status: SecurityCheckStatus): string {
  if (status === "pass") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "warn") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-red-200 bg-red-50 text-red-700";
}

function getSecurityStatusLabel(status: SecurityCheckStatus): string {
  if (status === "pass") {
    return "Normale";
  }
  if (status === "warn") {
    return "Attenzione";
  }
  return "Avviso";
}

function getSecurityCategoryStyles(category: SecurityCheckCategory): string {
  switch (category) {
    case "auth":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "authorization":
      return "border-indigo-200 bg-indigo-50 text-indigo-700";
    case "headers":
      return "border-cyan-200 bg-cyan-50 text-cyan-700";
    case "api-public":
      return "border-stone-200 bg-stone-50 text-stone-700";
    case "api-private":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "api-admin":
      return "border-purple-200 bg-purple-50 text-purple-700";
    case "input-validation":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "error-handling":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "monitoring":
      return "border-teal-200 bg-teal-50 text-teal-700";
    case "exposure":
      return "border-orange-200 bg-orange-50 text-orange-700";
    default:
      return "border-stone-200 bg-stone-50 text-stone-700";
  }
}

function getSecurityFilterLabel(filter: SecurityEventFilter): string {
  if (filter === "all") {
    return "Total";
  }
  return getSecurityStatusLabel(filter);
}

function explainHttpStatus(status: number): string {
  if (status >= 500) {
    return "errore interno del server";
  }
  if (status >= 400) {
    return "accesso negato o richiesta non valida";
  }
  if (status >= 300) {
    return "reindirizzamento";
  }
  if (status >= 200) {
    return "richiesta completata correttamente";
  }
  if (status > 0) {
    return "risposta non standard";
  }
  return "nessuna risposta HTTP";
}

function buildSecurityEventFriendlySummary(event: AdminSecurityEventV2): string {
  const routeType = event.isAdminRoute ? "nell’area amministrativa" : "nell’API pubblica";
  const authContext = event.hasAdminToken
    ? "con credenziali amministratore"
    : event.hasAuthToken
      ? "con credenziali utente"
      : "senza credenziali di accesso";

  if (event.level === "pass") {
    return `Attività normale: richiesta ${routeType}, ${authContext}, con risposta API senza segnali di rischio.`;
  }
  if (event.level === "warn") {
    return `Attenzione: comportamento non standard ${routeType}, ${authContext}. Si consiglia di monitorare questo accesso.`;
  }
  return `Avviso: attività sospetta ${routeType}, ${authContext}. Si consiglia di verificare subito questo accesso.`;
}

function formatSecurityEventNote(note: string): string {
  const cleaned = note.trim();
  if (!cleaned) {
    return "";
  }
  return `Dettaglio rilevato automaticamente: ${cleaned}`;
}

function isMissingApiRouteError(error: unknown): boolean {
  if (!(error instanceof HttpError)) {
    return false;
  }
  if (error.status === 404) {
    return true;
  }
  const normalized = error.message.toLowerCase();
  return normalized.includes("cannot get /api") || normalized.includes("cannot post /api");
}

function isUnauthorizedApiError(error: unknown): boolean {
  if (error instanceof HttpError) {
    return error.status === 401 || error.status === 403;
  }
  return false;
}

async function adminRequest<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
    token?: string;
    body?: unknown;
    signal?: AbortSignal;
  } = {},
): Promise<T> {
  const { method = "GET", token = "", body, signal } = options;
  const headers = new Headers();
  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
    headers.set("X-Admin-Token", token);
    headers.set("X-Admin-Auth", token);
  }

  const response = await fetch(buildApiUrl(path), {
    method,
    credentials: "include",
    signal,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const contentType = response.headers.get("content-type") ?? "";
  let payload: unknown = null;
  if (contentType.includes("application/json")) {
    payload = await response.json();
  } else {
    const rawText = await response.text();
    try {
      payload = JSON.parse(rawText);
    } catch {
      payload = rawText;
    }
  }

  if (!response.ok) {
    const fallback = `Errore API (${response.status})`;
    const message = extractApiMessage(payload) || fallback;
    throw new HttpError(response.status, translateInterface('it-IT',message), payload);
  }

  return payload as T;
}

async function adminLogin(email: string, password: string): Promise<AdminSessionV2> {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = password.trim();
  const loginRouteCandidates = [
    "/api/admin/login",
    "/api/admin/auth/login",
    "/api/admin/auth",
    "/api/admin",
  ];
  const payloadCandidates = [
    { email: normalizedEmail, password: normalizedPassword },
    { login: normalizedEmail, password: normalizedPassword },
    { username: normalizedEmail, password: normalizedPassword },
    { email: normalizedEmail, senha: normalizedPassword },
    { login: normalizedEmail, senha: normalizedPassword },
    { username: normalizedEmail, senha: normalizedPassword },
  ];

  let lastError: unknown = null;

  for (const route of loginRouteCandidates) {
    let routeHandledByServer = false;

    for (const payload of payloadCandidates) {
      try {
        const response = await adminRequest<unknown>(route, {
          method: "POST",
          body: payload,
        });
        const responseEmail = extractEmailFromPayload(response) || normalizedEmail;
        const token = extractTokenFromPayload(response);
        return { email: responseEmail, token };
      } catch (error) {
        lastError = error;
        if (isMissingApiRouteError(error)) {
          break;
        }
        routeHandledByServer = true;
        if (isUnauthorizedApiError(error)) {
          throw error;
        }
        throw error;
      }
    }

    if (routeHandledByServer) {
      break;
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error("Autenticazione dell’amministratore non riuscita.");
}

async function adminGetCurrent(token: string): Promise<string> {
  const routes = ["/api/admin/auth/me", "/api/admin/me", "/api/admin/auth", "/api/admin"];
  let lastError: unknown = null;

  for (const route of routes) {
    try {
      const response = await adminRequest<unknown>(route, { token });
      const email = extractEmailFromPayload(response);
      if (email) {
        return email;
      }
    } catch (error) {
      lastError = error;
      if (isMissingApiRouteError(error)) {
        continue;
      }
      throw error;
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error("Sessione amministratore non valida.");
}

async function adminGetUsers(token: string, query = ""): Promise<AdminUserV2[]> {
  const params = new URLSearchParams();
  const normalizedQuery = query.trim();
  if (normalizedQuery) {
    params.set("q", normalizedQuery);
  }
  const route = params.toString() ? `/api/admin/users?${params.toString()}` : "/api/admin/users";
  const response = await adminRequest<unknown>(route, { token });
  return normalizeAdminUserList(response);
}

async function adminGetUserProducts(token: string, userId: number): Promise<AdminProductV2[]> {
  const response = await adminRequest<unknown>(`/api/admin/users/${userId}/products`, { token });
  return normalizeAdminProductList(response);
}

async function adminGetProducts(
  token: string,
  query = "",
  offset = 0,
  limit = 36,
): Promise<AdminProductsResponseV2> {
  const params = new URLSearchParams();
  const normalizedQuery = query.trim();
  if (normalizedQuery) {
    params.set("q", normalizedQuery);
  }
  params.set("offset", String(Math.max(0, Math.floor(offset))));
  params.set("limit", String(Math.max(1, Math.floor(limit))));
  const response = await adminRequest<unknown>(`/api/admin/products?${params.toString()}`, {
    token,
  });
  return normalizeAdminProductsResponse(response);
}

async function adminGetPublications(
  token: string,
  query = "",
): Promise<AdminPublicationV2[]> {
  const params = new URLSearchParams();
  const normalizedQuery = query.trim();
  if (normalizedQuery) {
    params.set("q", normalizedQuery);
  }
  params.set("limit", "60");
  const response = await adminRequest<unknown>(`/api/admin/publications?${params.toString()}`, {
    token,
  });
  return normalizeAdminPublicationList(response);
}

async function adminGetVisitors(
  token: string,
  day: string,
): Promise<AdminVisitorsResponseV2> {
  const params = new URLSearchParams();
  params.set("date", normalizeDateKey(day));
  const response = await adminRequest<unknown>(`/api/admin/visitors?${params.toString()}`, {
    token,
  });
  return normalizeVisitorsPayload(response);
}

async function adminToggleUserBan(
  token: string,
  userId: number,
  isBanned: boolean,
): Promise<void> {
  await adminRequest<unknown>(`/api/admin/users/${userId}/ban`, {
    method: "PATCH",
    token,
    body: { isBanned },
  });
}

async function adminResetUserPassword(
  token: string,
  userId: number,
  password: string,
): Promise<void> {
  await adminRequest<unknown>(`/api/admin/users/${userId}/password`, {
    method: "PUT",
    token,
    body: { password },
  });
}

async function adminDeleteUser(token: string, userId: number, confirmation?: string): Promise<void> {
  await adminRequest<unknown>(`/api/admin/users/${userId}`, {
    method: "DELETE",
    token,
    body: confirmation ? { mode: "delete", confirmation } : undefined,
  });
}

async function adminDeleteProduct(token: string, productId: number): Promise<void> {
  await adminRequest<unknown>(`/api/admin/products/${productId}`, {
    method: "DELETE",
    token,
  });
}

async function adminSendBroadcastNotification(
  token: string,
  input: {
    title: string;
    message: string;
    productId?: number | null;
    publicationId?: number | null;
    recipientUserId?: number | null;
  },
): Promise<{ deliveredTo: number }> {
  const response = await adminRequest<unknown>("/api/admin/notifications/broadcast", {
    method: "POST",
    token,
    body: {
      title: input.title,
      message: input.message,
      productId: input.productId ?? null,
      publicationId: input.publicationId ?? null,
      recipientUserId: input.recipientUserId ?? null,
    },
  });
  const record = asRecord(response);
  return { deliveredTo: toNumber(record?.deliveredTo ?? record?.delivered_to) };
}

async function adminGetBroadcastNotifications(token: string): Promise<AdminBroadcastNotificationV2[]> {
  const response = await adminRequest<unknown>("/api/admin/notifications/broadcasts", {
    token,
  });
  return normalizeAdminBroadcastNotifications(response);
}

async function adminDeleteBroadcastNotification(token: string, notificationId: number): Promise<void> {
  await adminRequest<unknown>(`/api/admin/notifications/broadcasts/${notificationId}`, {
    method: "DELETE",
    token,
  });
}

async function adminLogout(token: string): Promise<void> {
  const routes: Array<{ route: string; method: "POST" | "DELETE" }> = [
    { route: "/api/admin/auth/logout", method: "POST" },
    { route: "/api/admin/auth", method: "DELETE" },
    { route: "/api/admin/logout", method: "POST" },
    { route: "/api/admin/logout", method: "DELETE" },
    { route: "/api/admin", method: "DELETE" },
  ];

  for (const candidate of routes) {
    try {
      await adminRequest<unknown>(candidate.route, {
        method: candidate.method,
        token,
      });
      return;
    } catch (error) {
      if (isMissingApiRouteError(error)) {
        continue;
      }
      if (isUnauthorizedApiError(error)) {
        return;
      }
    }
  }
}

async function adminUnlockSecurityTestArea(token: string, password: string): Promise<void> {
  const normalizedPassword = password.trim();
  if (!normalizedPassword) {
    throw new Error("La password dell’area di test è obbligatoria.");
  }

  const routes = ["/api/admin/security-test/unlock", "/api/admin/security-tests/unlock"];
  let lastError: unknown = null;

  for (const route of routes) {
    try {
      await adminRequest<unknown>(route, {
        method: "POST",
        token,
        body: { password: normalizedPassword },
      });
      return;
    } catch (error) {
      lastError = error;
      if (isMissingApiRouteError(error)) {
        continue;
      }
      throw error;
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error("Impossibile accedere all’area di test.");
}

async function adminGetSecurityEvents(
  token: string,
  limit = SECURITY_EVENTS_LIMIT,
): Promise<AdminSecurityEventsResponseV2> {
  const normalizedLimit = Math.min(Math.max(Number(limit) || SECURITY_EVENTS_LIMIT, 1), 500);
  const params = new URLSearchParams();
  params.set("limit", String(normalizedLimit));

  const routes = [
    `/api/admin/security-test/events?${params.toString()}`,
    `/api/admin/security-tests/events?${params.toString()}`,
  ];
  let lastError: unknown = null;

  for (const route of routes) {
    try {
      const response = await adminRequest<unknown>(route, { token });
      return normalizeSecurityEventsPayload(response);
    } catch (error) {
      lastError = error;
      if (isMissingApiRouteError(error)) {
        continue;
      }
      throw error;
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error("Impossibile caricare il monitor di sicurezza.");
}

async function adminClearSecurityEvents(token: string): Promise<void> {
  const routes = ["/api/admin/security-test/events", "/api/admin/security-tests/events"];
  let lastError: unknown = null;

  for (const route of routes) {
    try {
      await adminRequest<unknown>(route, {
        method: "DELETE",
        token,
      });
      return;
    } catch (error) {
      lastError = error;
      if (isMissingApiRouteError(error)) {
        continue;
      }
      throw error;
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error("Impossibile cancellare lo storico del monitor.");
}

export default function AdminPanelV2() {
  const [isBootstrapping, setIsBootstrapping] = React.useState(true);
  const [activeView, setActiveView] = React.useState<AdminViewV2>("overview");
  const [taxonomyVersion, setTaxonomyVersion] = React.useState(0);
  const [sessionEmail, setSessionEmail] = React.useState<string | null>(null);
  const [authToken, setAuthToken] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [authError, setAuthError] = React.useState("");
  const [isAuthSubmitting, setIsAuthSubmitting] = React.useState(false);
  const [users, setUsers] = React.useState<AdminUserV2[]>([]);
  const [visitorDay, setVisitorDay] = React.useState(getTodayDateKey());
  const [visitors, setVisitors] = React.useState<AdminVisitorV2[]>([]);
  const [visitorsSummary, setVisitorsSummary] = React.useState<AdminVisitorsSummaryV2>(
    createEmptyVisitorsSummary(),
  );
  const [visitorsUpdatedAt, setVisitorsUpdatedAt] = React.useState<number | null>(null);
  const [isLoadingVisitors, setIsLoadingVisitors] = React.useState(false);
  const [visitorsError, setVisitorsError] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [isLoadingUsers, setIsLoadingUsers] = React.useState(false);
  const [usersError, setUsersError] = React.useState("");
  const [products, setProducts] = React.useState<AdminProductV2[]>([]);
  const [productQuery, setProductQuery] = React.useState("");
  const [productsNextOffset, setProductsNextOffset] = React.useState(0);
  const [productsHasMore, setProductsHasMore] = React.useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = React.useState(false);
  const [isLoadingMoreProducts, setIsLoadingMoreProducts] = React.useState(false);
  const [productsError, setProductsError] = React.useState("");
  const [deletingProductId, setDeletingProductId] = React.useState<number | null>(null);
  const [broadcastTitle, setBroadcastTitle] = React.useState("");
  const [broadcastMessage, setBroadcastMessage] = React.useState("");
  const [broadcastProductId, setBroadcastProductId] = React.useState("");
  const [broadcastPublicationId, setBroadcastPublicationId] = React.useState("");
  const [publications, setPublications] = React.useState<AdminPublicationV2[]>([]);
  const [isLoadingPublications, setIsLoadingPublications] = React.useState(false);
  const [publicationsError, setPublicationsError] = React.useState("");
  const [broadcastRecipientUserId, setBroadcastRecipientUserId] = React.useState("");
  const [broadcastStatus, setBroadcastStatus] = React.useState("");
  const [broadcastError, setBroadcastError] = React.useState("");
  const [isSendingBroadcast, setIsSendingBroadcast] = React.useState(false);
  const [broadcastNotifications, setBroadcastNotifications] = React.useState<
    AdminBroadcastNotificationV2[]
  >([]);
  const [isLoadingBroadcastNotifications, setIsLoadingBroadcastNotifications] =
    React.useState(false);
  const [deletingBroadcastNotificationId, setDeletingBroadcastNotificationId] =
    React.useState<number | null>(null);
  const [pendingBanUserId, setPendingBanUserId] = React.useState<number | null>(null);
  const [deletingUserId, setDeletingUserId] = React.useState<number | null>(null);
  const [selectedUser, setSelectedUser] = React.useState<AdminUserV2 | null>(null);
  const [selectedUserProducts, setSelectedUserProducts] = React.useState<AdminProductV2[]>([]);
  const [isLoadingSelectedUserProducts, setIsLoadingSelectedUserProducts] = React.useState(false);
  const [selectedUserError, setSelectedUserError] = React.useState("");
  const [resetPasswordValue, setResetPasswordValue] = React.useState("");
  const [isResettingUserPassword, setIsResettingUserPassword] = React.useState(false);
  const [pendingResetCodesByUserId, setPendingResetCodesByUserId] = React.useState<
    Record<number, string>
  >({});
  const [testAreaPassword, setTestAreaPassword] = React.useState("");
  const [isTestAreaUnlocked, setIsTestAreaUnlocked] = React.useState(false);
  const [isUnlockingTestArea, setIsUnlockingTestArea] = React.useState(false);
  const [testAreaError, setTestAreaError] = React.useState("");
  const [isRunningSecurityChecks, setIsRunningSecurityChecks] = React.useState(false);
  const [securityChecks, setSecurityChecks] = React.useState<SecurityCheckResult[]>([]);
  const [securityChecksRanAt, setSecurityChecksRanAt] = React.useState<number | null>(null);
  const [securityChecksProgress, setSecurityChecksProgress] = React.useState<{
    done: number;
    total: number;
  }>({ done: 0, total: 0 });
  const [securityEvents, setSecurityEvents] = React.useState<AdminSecurityEventV2[]>([]);
  const [securityEventsTotalTracked, setSecurityEventsTotalTracked] = React.useState(0);
  const [securityEventsUpdatedAt, setSecurityEventsUpdatedAt] = React.useState<number | null>(null);
  const [securityEventsError, setSecurityEventsError] = React.useState("");
  const [isLoadingSecurityEvents, setIsLoadingSecurityEvents] = React.useState(false);
  const [isClearingSecurityEvents, setIsClearingSecurityEvents] = React.useState(false);
  const [isLiveMonitorEnabled, setIsLiveMonitorEnabled] = React.useState(true);
  const [securityEventsFilter, setSecurityEventsFilter] = React.useState<SecurityEventFilter>("all");

  const loadUsers = React.useCallback(
    async (token: string, searchQuery = "") => {
      setIsLoadingUsers(true);
      setUsersError("");
      try {
        const payload = await adminGetUsers(token, searchQuery);
        setUsers(payload);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Impossibile caricare gli utenti.";
        setUsers([]);
        setUsersError(message);
      } finally {
        setIsLoadingUsers(false);
      }
    },
    [],
  );

  const loadProducts = React.useCallback(
    async (
      token: string,
      searchQuery = "",
      options?: { append?: boolean; offset?: number },
    ) => {
      const append = Boolean(options?.append);
      const offset = Math.max(0, Math.floor(options?.offset ?? 0));
      if (append) {
        setIsLoadingMoreProducts(true);
      } else {
        setIsLoadingProducts(true);
      }
      setProductsError("");

      try {
        const payload = await adminGetProducts(token, searchQuery, offset, 36);
        setProducts((current) => (append ? [...current, ...payload.products] : payload.products));
        setProductsHasMore(payload.hasMore);
        setProductsNextOffset(payload.nextOffset);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Impossibile caricare i prodotti.";
        if (!append) {
          setProducts([]);
          setProductsNextOffset(0);
          setProductsHasMore(false);
        }
        setProductsError(message);
      } finally {
        if (append) {
          setIsLoadingMoreProducts(false);
        } else {
          setIsLoadingProducts(false);
        }
      }
    },
    [],
  );

  const loadPublications = React.useCallback(async (token: string, searchQuery = "") => {
    setIsLoadingPublications(true);
    setPublicationsError("");
    try {
      setPublications(await adminGetPublications(token, searchQuery));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Impossibile caricare le pubblicazioni.";
      setPublications([]);
      setPublicationsError(message);
    } finally {
      setIsLoadingPublications(false);
    }
  }, []);

  const loadBroadcastNotifications = React.useCallback(
    async (token: string, options?: { silent?: boolean }) => {
      const silent = Boolean(options?.silent);
      if (!silent) {
        setIsLoadingBroadcastNotifications(true);
      }
      setBroadcastError("");

      try {
        const payload = await adminGetBroadcastNotifications(token);
        setBroadcastNotifications(payload);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Impossibile caricare le notifiche inviate.";
        setBroadcastError(message);
      } finally {
        if (!silent) {
          setIsLoadingBroadcastNotifications(false);
        }
      }
    },
    [],
  );

  const loadVisitors = React.useCallback(
    async (token: string, day: string, options?: { silent?: boolean }) => {
      const silent = Boolean(options?.silent);
      if (!silent) {
        setIsLoadingVisitors(true);
      }
      setVisitorsError("");

      try {
        const payload = await adminGetVisitors(token, day);
        setVisitors(payload.visitors);
        setVisitorsSummary(payload.summary);
        setVisitorsUpdatedAt(payload.generatedAt);
        setVisitorDay(payload.day);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Impossibile caricare i visitatori.";
        setVisitors([]);
        setVisitorsSummary(createEmptyVisitorsSummary());
        setVisitorsError(message);
      } finally {
        if (!silent) {
          setIsLoadingVisitors(false);
        }
      }
    },
    [],
  );

  const loadSecurityEvents = React.useCallback(
    async (token: string, options?: { silent?: boolean }) => {
      const silent = Boolean(options?.silent);
      if (!silent) {
        setIsLoadingSecurityEvents(true);
      }
      setSecurityEventsError("");

      try {
        const payload = await adminGetSecurityEvents(token, SECURITY_EVENTS_LIMIT);
        setSecurityEvents(payload.events);
        setSecurityEventsTotalTracked(payload.totalTracked);
        setSecurityEventsUpdatedAt(Date.now());
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Impossibile caricare il monitor di sicurezza.";
        setSecurityEventsError(message);
      } finally {
        if (!silent) {
          setIsLoadingSecurityEvents(false);
        }
      }
    },
    [],
  );

  React.useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      try {
        window.localStorage.removeItem(ADMIN_REMEMBER_PASSWORD_STORAGE_KEY);
        window.localStorage.removeItem(ADMIN_PASSWORD_STORAGE_KEY);
        const storedToken = readStoredToken();
        const storedEmail = readStoredEmail();
        if (!storedToken) {
          return;
        }

        const currentEmail = (await adminGetCurrent(storedToken)) || storedEmail;
        if (cancelled) {
          return;
        }

        setAuthToken(storedToken);
        setSessionEmail(currentEmail);
        setEmail(currentEmail);
        await loadUsers(storedToken);
        await loadProducts(storedToken);
        await loadPublications(storedToken);
        await loadVisitors(storedToken, getTodayDateKey(), { silent: true });
        await loadSecurityEvents(storedToken, { silent: true });
      } catch (error) {
        if (!cancelled) {
          clearSessionStorage();
          setAuthToken("");
          setSessionEmail(null);
          setUsers([]);
          setVisitors([]);
          setVisitorsSummary(createEmptyVisitorsSummary());
          setVisitorsUpdatedAt(null);
          setVisitorsError("");
          if (!isUnauthorizedApiError(error)) {
            const message =
              error instanceof Error ? error.message : "Impossibile ripristinare la sessione amministratore.";
            setAuthError(message);
          }
        }
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
      }
    };

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, [loadProducts, loadPublications, loadSecurityEvents, loadUsers, loadVisitors]);

  React.useEffect(() => {
    if (!selectedUser) {
      return;
    }

    const updatedUser = users.find((user) => user.id === selectedUser.id);
    if (updatedUser) {
      setSelectedUser(updatedUser);
    }
  }, [selectedUser, users]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) {
      setAuthError("Inserisci email e password dell’amministratore.");
      return;
    }

    setAuthError("");
    setIsAuthSubmitting(true);
    try {
      const session = await adminLogin(normalizedEmail, normalizedPassword);
      setAuthToken(session.token);
      setSessionEmail(session.email);
      setEmail(session.email);
      persistSession(session);
      await loadUsers(session.token);
      await loadProducts(session.token);
      await loadPublications(session.token);
      await loadVisitors(session.token, getTodayDateKey(), { silent: true });
      await loadSecurityEvents(session.token, { silent: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Autenticazione amministratore non riuscita.";
      setAuthError(message);
      setSessionEmail(null);
      setUsers([]);
      setVisitors([]);
      setVisitorsSummary(createEmptyVisitorsSummary());
      setVisitorsUpdatedAt(null);
      setVisitorsError("");
      clearSessionStorage();
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await adminLogout(authToken);
    } catch {
      // Ignore logout failures and clear local session anyway.
    } finally {
      clearSessionStorage();
      setAuthToken("");
      setSessionEmail(null);
      setUsers([]);
      setVisitorDay(getTodayDateKey());
      setVisitors([]);
      setVisitorsSummary(createEmptyVisitorsSummary());
      setVisitorsUpdatedAt(null);
      setIsLoadingVisitors(false);
      setVisitorsError("");
      setProducts([]);
      setPublications([]);
      setPublicationsError("");
      setIsLoadingPublications(false);
      setProductQuery("");
      setProductsNextOffset(0);
      setProductsHasMore(false);
      setIsLoadingProducts(false);
      setIsLoadingMoreProducts(false);
      setProductsError("");
      setDeletingProductId(null);
      setBroadcastTitle("");
      setBroadcastMessage("");
      setBroadcastProductId("");
      setBroadcastPublicationId("");
      setBroadcastRecipientUserId("");
      setBroadcastStatus("");
      setBroadcastError("");
      setIsSendingBroadcast(false);
      setBroadcastNotifications([]);
      setIsLoadingBroadcastNotifications(false);
      setDeletingBroadcastNotificationId(null);
      setUsersError("");
      setAuthError("");
      setQuery("");
      setPassword("");
      setEmail("");
      setSelectedUser(null);
      setSelectedUserProducts([]);
      setSelectedUserError("");
      setResetPasswordValue("");
      setPendingResetCodesByUserId({});
      setActiveView("overview");
      setTestAreaPassword("");
      setIsTestAreaUnlocked(false);
      setIsUnlockingTestArea(false);
      setTestAreaError("");
      setIsRunningSecurityChecks(false);
      setSecurityChecks([]);
      setSecurityChecksRanAt(null);
      setSecurityChecksProgress({ done: 0, total: 0 });
      setSecurityEvents([]);
      setSecurityEventsTotalTracked(0);
      setSecurityEventsUpdatedAt(null);
      setSecurityEventsError("");
      setIsLoadingSecurityEvents(false);
      setIsClearingSecurityEvents(false);
      setIsLiveMonitorEnabled(true);
    }
  };

  const handleUnlockTestArea = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedPassword = testAreaPassword.trim();
    if (!normalizedPassword) {
      setTestAreaError("Inserisci la password dell’area di test.");
      return;
    }

    setTestAreaError("");
    setIsUnlockingTestArea(true);
    try {
      await adminUnlockSecurityTestArea(authToken, normalizedPassword);
      setIsTestAreaUnlocked(true);
      setTestAreaPassword("");
      await loadSecurityEvents(authToken);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Impossibile sbloccare l’area di test.";
      setTestAreaError(message);
    } finally {
      setIsUnlockingTestArea(false);
    }
  };

  const handleClearSecurityEvents = async () => {
    if (!isTestAreaUnlocked) {
      setTestAreaError("Sblocca l’area di test prima di cancellare gli eventi.");
      return;
    }

    const confirmation = window.confirm(
      "Deseja limpar o histórico do monitor de segurança agora?",
    );
    if (!confirmation) {
      return;
    }

    setTestAreaError("");
    setSecurityEventsError("");
    setIsClearingSecurityEvents(true);
    try {
      await adminClearSecurityEvents(authToken);
      setSecurityEvents([]);
      setSecurityEventsTotalTracked(0);
      setSecurityEventsUpdatedAt(Date.now());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossibile cancellare gli eventi.";
      setSecurityEventsError(message);
    } finally {
      setIsClearingSecurityEvents(false);
    }
  };

  const handleRunSecurityChecks = async () => {
    if (!isTestAreaUnlocked) {
      setTestAreaError("Sblocca l’area di test prima di eseguire la diagnostica.");
      return;
    }

    setTestAreaError("");
    setIsRunningSecurityChecks(true);
    setSecurityChecks([]);
    setSecurityChecksProgress({ done: 0, total: 0 });

    try {
      const scan = await runComprehensiveSecurityScan({
        buildApiUrl,
        adminToken: authToken,
        onProgress: (done, total) => {
          setSecurityChecksProgress({ done, total });
        },
      });
      setSecurityChecks(scan.checks);
      setSecurityChecksProgress({ done: scan.totalProbes, total: scan.totalProbes });
      setSecurityChecksRanAt(Date.now());
      await loadSecurityEvents(authToken, { silent: true });
    } finally {
      setIsRunningSecurityChecks(false);
    }
  };

	  const handleRefresh = async () => {
	    if (!sessionEmail) {
	      return;
	    }
        if (activeView === "taxonomy") { setTaxonomyVersion(value => value + 1); return; }
	    if (activeView === "overview") {
	      await Promise.all([
	        loadUsers(authToken, query),
	        loadProducts(authToken, productQuery),
	        loadVisitors(authToken, visitorDay, { silent: true }),
	        loadSecurityEvents(authToken, { silent: true }),
	      ]);
	      return;
	    }
	    if (activeView === "security") {
      if (!isTestAreaUnlocked) {
        setTestAreaError("Sblocca l’area di test per aggiornare il monitor.");
        return;
      }
      await loadSecurityEvents(authToken);
      return;
    }
    if (activeView === "visitors") {
      await loadVisitors(authToken, visitorDay);
      return;
    }
    if (activeView === "products") {
      await loadProducts(authToken, productQuery);
      return;
    }
    await loadUsers(authToken, query);
  };

  const handleProductSearchSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await loadProducts(authToken, productQuery);
  };

  const handleLoadMoreProducts = async () => {
    await loadProducts(authToken, productQuery, { append: true, offset: productsNextOffset });
  };

  const handleDeleteProduct = async (product: AdminProductV2) => {
    const confirmation = window.confirm(
      `Excluir o produto ${product.name || `#${product.id}`}?`,
    );
    if (!confirmation) {
      return;
    }

    setDeletingProductId(product.id);
    setProductsError("");
    try {
      await adminDeleteProduct(authToken, product.id);
      setProducts((current) => current.filter((item) => item.id !== product.id));
      setSelectedUserProducts((current) => current.filter((item) => item.id !== product.id));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossibile eliminare il prodotto.";
      setProductsError(message);
    } finally {
      setDeletingProductId(null);
    }
  };

  const handleOpenUserDetail = async (user: AdminUserV2) => {
    setSelectedUser(user);
    setSelectedUserProducts([]);
    setSelectedUserError("");
    setResetPasswordValue(pendingResetCodesByUserId[user.id] ?? "");
    setIsLoadingSelectedUserProducts(true);

    try {
      const products = await adminGetUserProducts(authToken, user.id);
      setSelectedUserProducts(products);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Impossibile caricare la scheda utente.";
      setSelectedUserError(message);
    } finally {
      setIsLoadingSelectedUserProducts(false);
    }
  };

  const handleCloseUserDetail = () => {
    setSelectedUser(null);
    setSelectedUserProducts([]);
    setSelectedUserError("");
    setResetPasswordValue("");
    setIsLoadingSelectedUserProducts(false);
  };

  const handleGenerateResetCode = (user: AdminUserV2) => {
    const code = generateResetCode();
    setPendingResetCodesByUserId((current) => ({ ...current, [user.id]: code }));
    setResetPasswordValue(code);
    setSelectedUserError("Codice temporaneo generato. Impostalo come password e invialo all’utente.");
  };

  const handleCopyResetCode = async (code: string) => {
    if (!code) {
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      setSelectedUserError("Codice copiato.");
    } catch {
      setSelectedUserError("Impossibile copiare automaticamente. Seleziona il codice manualmente.");
    }
  };

  const handleResetUserPassword = async (user: AdminUserV2) => {
    const nextPassword = resetPasswordValue.trim();
    if (nextPassword.length < 6) {
      setSelectedUserError("La password temporanea deve contenere almeno 6 caratteri.");
      return;
    }

    setSelectedUserError("");
    setIsResettingUserPassword(true);
    try {
      await adminResetUserPassword(authToken, user.id, nextPassword);
      setPendingResetCodesByUserId((current) => {
        const next = { ...current };
        delete next[user.id];
        return next;
      });
      setResetPasswordValue("");
      setSelectedUserError("Password aggiornata. Le sessioni precedenti dell’utente sono state chiuse.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossibile aggiornare la password.";
      setSelectedUserError(message);
    } finally {
      setIsResettingUserPassword(false);
    }
  };

  const handleToggleBan = async (user: AdminUserV2) => {
    const nextBan = !user.isBanned;
    const actionLabel = nextBan ? "banir" : "desbanir";
    const confirmation = window.confirm(
      `Deseja ${actionLabel} o usuário ${user.email || `#${user.id}`}?`,
    );
    if (!confirmation) {
      return;
    }

    setPendingBanUserId(user.id);
    setUsersError("");
    try {
      await adminToggleUserBan(authToken, user.id, nextBan);
      await loadUsers(authToken, query);
      if (selectedUser?.id === user.id) {
        setSelectedUser((current) =>
          current ? { ...current, isBanned: nextBan, banReason: nextBan ? current.banReason : "" } : current,
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Impossibile aggiornare lo stato utente.";
      setUsersError(message);
    } finally {
      setPendingBanUserId(null);
    }
  };

  const handleDeleteUser = async (user: AdminUserV2, permanent = false) => {
    if (permanent && window.prompt("Exclusão definitiva: cadastro, fotos, publicações e comprovantes sairão do banco do TempleSale. A limpeza dos fornecedores e backups é separada. Digite o e-mail da conta para confirmar:") !== user.email) return;
    const confirmation = window.confirm(
      permanent ? `Excluir definitivamente ${user.email}? Um novo cadastro começará vazio.` : `Desativar a empresa de ${user.email || `#${user.id}`}? Ela ficará oculta; cadastro, fotos, publicações e comprovantes serão preservados para recuperação com a mesma conta Auth0.`,
    );
    if (!confirmation) {
      return;
    }

    setDeletingUserId(user.id);
    setUsersError("");
    try {
      await adminDeleteUser(authToken, user.id, permanent ? user.email : undefined);
      setUsers((current) => current.filter((item) => item.id !== user.id));
      if (selectedUser?.id === user.id) {
        handleCloseUserDetail();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossibile eliminare l’utente.";
      setUsersError(message);
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleSendBroadcast = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = broadcastTitle.trim();
    const message = broadcastMessage.trim();
    const productId = Number(broadcastProductId);
    const normalizedProductId =
      Number.isInteger(productId) && productId > 0 ? productId : null;
    const publicationId = Number(broadcastPublicationId);
    const normalizedPublicationId =
      Number.isInteger(publicationId) && publicationId > 0 ? publicationId : null;
    const recipientUserId = Number(broadcastRecipientUserId);
    const normalizedRecipientUserId =
      Number.isInteger(recipientUserId) && recipientUserId > 0 ? recipientUserId : null;

    if (!title || !message) {
      setBroadcastError("Inserisci titolo e messaggio della notifica.");
      return;
    }

    setBroadcastError("");
    setBroadcastStatus("");
    setIsSendingBroadcast(true);
    try {
      const result = await adminSendBroadcastNotification(authToken, {
        title,
        message,
        productId: normalizedProductId,
        publicationId: normalizedPublicationId,
        recipientUserId: normalizedRecipientUserId,
      });
      setBroadcastTitle("");
      setBroadcastMessage("");
      setBroadcastProductId("");
      setBroadcastPublicationId("");
      setBroadcastRecipientUserId("");
      setBroadcastStatus(
        normalizedRecipientUserId
          ? "Notifica inviata all’utente selezionato."
          : `Notifica inviata a ${result.deliveredTo} utenti attivi.`,
      );
      await loadBroadcastNotifications(authToken, { silent: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossibile inviare la notifica.";
      setBroadcastError(message);
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  const handleDeleteBroadcastNotification = async (notification: AdminBroadcastNotificationV2) => {
    if (!window.confirm("Excluir esta notificação enviada? Ela sairá do sino dos usuários.")) {
      return;
    }

    setDeletingBroadcastNotificationId(notification.id);
    setBroadcastError("");
    setBroadcastStatus("");
    try {
      await adminDeleteBroadcastNotification(authToken, notification.id);
      setBroadcastNotifications((current) =>
        current.filter((item) => item.id !== notification.id),
      );
      setBroadcastStatus("Notifica rimossa dalle notifiche degli utenti.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossibile eliminare la notifica.";
      setBroadcastError(message);
    } finally {
      setDeletingBroadcastNotificationId(null);
    }
  };

  const filteredUsers = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return users;
    }
    return users.filter((user) => {
      return (
        user.username.toLowerCase().includes(normalizedQuery) ||
        user.email.toLowerCase().includes(normalizedQuery) ||
        String(user.id).includes(normalizedQuery) ||
        String(user.city ?? "")
          .toLowerCase()
          .includes(normalizedQuery) ||
        String(user.country ?? "")
          .toLowerCase()
          .includes(normalizedQuery)
      );
    });
  }, [query, users]);

  const securityEventsSummary = React.useMemo(() => {
    return securityEvents.reduce(
      (acc, item) => {
        acc.total += 1;
        if (item.level === "pass") {
          acc.pass += 1;
        } else if (item.level === "warn") {
          acc.warn += 1;
        } else {
          acc.fail += 1;
        }
        return acc;
      },
      { pass: 0, warn: 0, fail: 0, total: 0 },
    );
  }, [securityEvents]);

  const filteredSecurityEvents = React.useMemo(() => {
    if (securityEventsFilter === "all") {
      return securityEvents;
    }
    return securityEvents.filter((event) => event.level === securityEventsFilter);
  }, [securityEvents, securityEventsFilter]);

  const securityChecksSummary = React.useMemo(() => {
    const byCategory = new globalThis.Map<SecurityCheckCategory, number>();
    let pass = 0;
    let warn = 0;
    let fail = 0;

    securityChecks.forEach((check) => {
      byCategory.set(check.category, (byCategory.get(check.category) ?? 0) + 1);
      if (check.status === "pass") {
        pass += 1;
      } else if (check.status === "warn") {
        warn += 1;
      } else {
        fail += 1;
      }
    });

    const orderedCategories = Array.from(byCategory.entries())
      .sort((left, right) => right[1] - left[1])
      .map(([category, count]) => ({ category, count }));

    return {
      total: securityChecks.length,
      pass,
      warn,
      fail,
      categories: orderedCategories,
    };
  }, [securityChecks]);

  React.useEffect(() => {
    if (!sessionEmail || !authToken || !isTestAreaUnlocked || activeView !== "security") {
      return;
    }
    if (!isLiveMonitorEnabled) {
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const poll = async (silent: boolean) => {
      if (cancelled) {
        return;
      }
      await loadSecurityEvents(authToken, { silent });
      if (cancelled) {
        return;
      }
      timer = setTimeout(() => {
        void poll(true);
      }, SECURITY_EVENTS_POLL_INTERVAL_MS);
    };

    void poll(securityEvents.length > 0);

    return () => {
      cancelled = true;
      if (timer !== null) {
        clearTimeout(timer);
      }
    };
  }, [
    activeView,
    authToken,
    isLiveMonitorEnabled,
    isTestAreaUnlocked,
    loadSecurityEvents,
    securityEvents.length,
    sessionEmail,
  ]);

  React.useEffect(() => {
    if (!sessionEmail || !authToken || activeView !== "visitors") {
      return;
    }
    void loadVisitors(authToken, visitorDay);
  }, [activeView, authToken, loadVisitors, sessionEmail, visitorDay]);

  React.useEffect(() => {
    if (!sessionEmail || !authToken || activeView !== "products") {
      return;
    }
    void loadProducts(authToken, productQuery);
  }, [activeView, authToken, loadProducts, sessionEmail]);

  React.useEffect(() => {
    if (!sessionEmail || !authToken || activeView !== "notifications") {
      return;
    }
    void loadBroadcastNotifications(authToken);
  }, [activeView, authToken, loadBroadcastNotifications, loadPublications, sessionEmail]);

  const selectedResetCode = selectedUser ? pendingResetCodesByUserId[selectedUser.id] ?? "" : "";
  const selectedWhatsappResetUrl =
    selectedUser && selectedResetCode ? buildWhatsappResetUrl(selectedUser, selectedResetCode) : "";

  if (isBootstrapping) {
    return (
      <div className="min-h-screen bg-[#fdfcfb] flex items-center justify-center">
        <div className="flex items-center gap-3 text-stone-600 text-sm uppercase tracking-[0.2em]">
          <LoaderCircle className="w-4 h-4 animate-spin" />
          Verifica della sessione amministratore
        </div>
      </div>
    );
  }

  if (!sessionEmail) {
    return (
      <div className="min-h-screen bg-[#fdfcfb] flex items-center justify-center px-4">
        <div className="w-full max-w-md border border-stone-200 bg-white p-8 sm:p-10 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-5 h-5 text-stone-700" />
            <h1 className="text-lg font-semibold text-stone-900">Admin <span translate="no" className="notranslate">TempleSale</span> V2</h1>
          </div>
          <p className="text-xs text-stone-500 mb-6">
            Nuovo accesso amministrativo su <code>/admin</code>.
          </p>
          <form
            onSubmit={handleLogin}
            className="space-y-4"
            method="post"
            action="/api/admin/auth/login"
            autoComplete="on"
          >
            <div className="space-y-1">
              <label
                htmlFor="admin-login-username"
                className="text-xs uppercase tracking-[0.15em] text-stone-500"
              >
                Email
              </label>
              <input
                id="admin-login-username"
                name="username"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-stone-900"
                placeholder="Email amministratore"
                autoComplete="username"
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="admin-login-password"
                className="text-xs uppercase tracking-[0.15em] text-stone-500"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full border border-stone-300 px-3 py-2.5 pr-11 text-sm outline-none focus:border-stone-900"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-stone-500 hover:text-stone-900"
                  aria-label={showPassword ? "Nascondi password" : "Mostra password"}
                  title={showPassword ? "Nascondi password" : "Mostra password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {authError && <p className="text-sm text-red-600">{authError}</p>}
            <button
              type="submit"
              disabled={isAuthSubmitting}
              className="w-full bg-stone-900 text-white py-3 text-xs uppercase tracking-[0.2em] font-semibold hover:bg-black transition-colors disabled:opacity-60"
            >
              {isAuthSubmitting ? "Accesso in corso..." : "Accedi all’amministrazione"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f3ee]">
      <header className="sticky top-0 z-30 bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-stone-700" />
            <div>
              <h1 className="text-sm sm:text-base font-semibold text-stone-900">
                Pannello amministrativo <span translate="no" className="notranslate">TempleSale</span> V2
              </h1>
              <p className="text-[11px] text-stone-500">{sessionEmail}</p>
            </div>
          </div>
          <div className="flex w-full sm:w-auto items-center gap-2">
            <button
              type="button"
              onClick={() => void handleRefresh()}
              className="inline-flex flex-1 sm:flex-none items-center justify-center gap-2 border border-stone-300 px-3 py-2 text-xs uppercase tracking-[0.15em] text-stone-700 hover:border-stone-800"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Aggiorna
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex flex-1 sm:flex-none items-center justify-center gap-2 bg-stone-900 text-white px-3 py-2 text-xs uppercase tracking-[0.15em] hover:bg-black"
            >
              <LogOut className="w-3.5 h-3.5" />
              Esci
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
	        <div className="mb-6 border border-stone-200 bg-white p-3 sm:p-5 overflow-x-auto">
	          <div className="flex min-w-max sm:min-w-0 sm:flex-wrap items-center gap-2">
	            <button
	              type="button"
	              onClick={() => setActiveView("overview")}
	              className={`inline-flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-[0.14em] border transition-colors ${
	                activeView === "overview"
	                  ? "border-stone-900 bg-stone-900 text-white"
	                  : "border-stone-300 text-stone-700 hover:border-stone-800"
	              }`}
	            >
	              <LayoutDashboard className="w-3.5 h-3.5" />
	              Panoramica
	            </button>
	            <button
	              type="button"
	              onClick={() => setActiveView("products")}
	              className={`inline-flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-[0.14em] border transition-colors ${
	                activeView === "products"
	                  ? "border-stone-900 bg-stone-900 text-white"
	                  : "border-stone-300 text-stone-700 hover:border-stone-800"
	              }`}
	            >
	              <Package className="w-3.5 h-3.5" />
	              Prodotti
	            </button>
	            <button
	              type="button"
	              onClick={() => setActiveView("users")}
              className={`inline-flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-[0.14em] border transition-colors ${
                activeView === "users"
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-300 text-stone-700 hover:border-stone-800"
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              Utenti
            </button>
            <button
              type="button"
              onClick={() => setActiveView("visitors")}
              className={`inline-flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-[0.14em] border transition-colors ${
                activeView === "visitors"
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-300 text-stone-700 hover:border-stone-800"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Visitatori
            </button>
            <button
              type="button"
              onClick={() => setActiveView("notifications")}
              className={`inline-flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-[0.14em] border transition-colors ${
                activeView === "notifications"
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-300 text-stone-700 hover:border-stone-800"
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              Notifiche
            </button>
            <button
              type="button"
              onClick={() => setActiveView("security")}
              className={`inline-flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-[0.14em] border transition-colors ${
                activeView === "security"
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-300 text-stone-700 hover:border-stone-800"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Area di test
            </button>
            <button type="button" onClick={() => setActiveView("taxonomy")}
              className={`inline-flex items-center gap-2 border px-3 py-2 text-xs uppercase tracking-[0.14em] transition-colors ${activeView === "taxonomy" ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 text-stone-700 hover:border-stone-800"}`}>Categorie</button>
          </div>
        </div>

	        {activeView === "taxonomy" ? <AdminTaxonomy key={taxonomyVersion} /> : activeView === "overview" ? (
	          <section className="space-y-4">
                <AdminPublicationHealth token={authToken} request={adminRequest} />
	            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
	              <article className="border border-stone-200 bg-white p-4 sm:p-5">
	                <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500">
	                  Utenti
	                </p>
	                <p className="mt-2 text-2xl font-semibold text-stone-900">{users.length}</p>
	                <p className="mt-1 text-xs text-stone-500">
	                  Persone registrate per pubblicare e interagire.
	                </p>
	              </article>
	              <article className="border border-stone-200 bg-white p-4 sm:p-5">
	                <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500">
	                  Prodotti
	                </p>
	                <p className="mt-2 text-2xl font-semibold text-stone-900">{products.length}</p>
	                <p className="mt-1 text-xs text-stone-500">
	                  Elementi caricati per la moderazione nel pannello.
	                </p>
	              </article>
	              <article className="border border-stone-200 bg-white p-4 sm:p-5">
	                <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500">
	                  Visitatori di oggi
	                </p>
	                <p className="mt-2 text-2xl font-semibold text-stone-900">
	                  {visitorsSummary.externalVisits}
	                </p>
	                <p className="mt-1 text-xs text-stone-500">
	                  Accessi esterni, escluso il tuo.
	                </p>
	              </article>
	              <article className="border border-stone-200 bg-white p-4 sm:p-5">
	                <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500">
	                  Sicurezza
	                </p>
	                <p className="mt-2 text-2xl font-semibold text-stone-900">
	                  {securityEventsTotalTracked}
	                </p>
	                <p className="mt-1 text-xs text-stone-500">
	                  Eventi monitorati dall’amministrazione.
	                </p>
	              </article>
	            </div>

	            <article className="border border-stone-200 bg-white p-4 sm:p-5">
	              <div className="flex items-start gap-3">
	                <LayoutDashboard className="mt-0.5 h-4 w-4 text-stone-700" />
	                <div>
	                  <h2 className="text-sm font-semibold text-stone-900">
	                    Sezioni utili per gestire una piccola attività
	                  </h2>
	                  <p className="mt-1 text-xs text-stone-500">
	                    Il pannello comprende utenti, visitatori e sicurezza. Altre sezioni utili per la gestione:
	                  </p>
	                </div>
	              </div>
	              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
	                {[
	                  ["Prodotti", "Modera gli annunci, consulta i prodotti per venditore e rimuovi gli elementi problematici."],
	                  ["Richieste e interessi", "Segui carrelli, contatti e interesse all’acquisto."],
	                  ["Report", "Consulta i prodotti più visti, le città più attive e gli orari di maggiore accesso."],
	                  ["Impostazioni", "Modifica banner, categorie, contatti e testi senza intervenire sul codice."],
	                ].map(([title, description]) => (
	                  <div key={title} className="border border-stone-200 bg-stone-50 px-3 py-3">
	                    <p className="text-xs font-semibold text-stone-900">{title}</p>
	                    <p className="mt-1 text-xs leading-relaxed text-stone-500">{description}</p>
	                  </div>
	                ))}
	              </div>
	            </article>
	          </section>
	        ) : activeView === "products" ? (
	          <section className="space-y-4">
	            <article className="border border-stone-200 bg-white p-4 sm:p-5">
	              <div className="mb-4 flex items-center gap-3">
	                <Package className="w-4 h-4 text-stone-600" />
	                <div>
	                  <h2 className="text-sm font-semibold text-stone-900">
	                    Prodotti registrati ({products.length})
	                  </h2>
	                  <p className="mt-1 text-xs text-stone-500">
	                    Cerca per prodotto, categoria, città, nome, email o WhatsApp del proprietario.
	                  </p>
	                </div>
	              </div>
	              <form
	                onSubmit={(event) => void handleProductSearchSubmit(event)}
	                className="flex flex-col gap-2 sm:flex-row"
	              >
	                <input
	                  type="text"
	                  value={productQuery}
	                  onChange={(event) => setProductQuery(event.target.value)}
	                  placeholder="Cerca prodotto o proprietario"
	                  className="w-full border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-stone-900"
	                />
	                <button
	                  type="submit"
	                  disabled={isLoadingProducts}
	                  className="inline-flex items-center justify-center gap-2 border border-stone-900 bg-stone-900 px-4 py-2.5 text-xs uppercase tracking-[0.14em] text-white hover:bg-black disabled:opacity-60"
	                >
	                  <Search className="w-3.5 h-3.5" />
	                  Cerca
	                </button>
	              </form>
	            </article>

	            {productsError && (
	              <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
	                {productsError}
	              </div>
	            )}

	            {isLoadingProducts ? (
	              <div className="py-16 text-center text-sm text-stone-500">
	                Caricamento prodotti...
	              </div>
	            ) : products.length === 0 ? (
	              <div className="border border-stone-200 bg-white py-16 text-center text-sm text-stone-500">
	                Nessun prodotto trovato.
	              </div>
	            ) : (
	              <div className="space-y-3">
	                {products.map((product) => {
	                  const ownerName =
	                    product.owner?.name || product.sellerName || `Usuário ${product.ownerId ?? "-"}`;
	                  const ownerEmail = product.owner?.email || "-";
	                  const ownerCity = product.owner?.city || product.city || "-";
	                  const ownerWhatsapp =
	                    product.owner?.whatsappNumber || product.sellerWhatsappNumber || "-";
	                  return (
	                    <article
	                      key={product.id}
	                      className="border border-stone-200 bg-white p-4 sm:p-5"
	                    >
	                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr_auto] lg:items-start">
	                        <div className="min-w-0">
	                          <div className="flex flex-wrap items-center gap-2">
	                            <span className="border border-stone-300 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-stone-500">
	                              ID {product.id}
	                            </span>
	                            <span className="text-[11px] uppercase tracking-[0.12em] text-stone-500">
	                              {product.category || "Senza categoria"}
	                            </span>
	                          </div>
	                          <h3 className="mt-2 text-sm font-semibold text-stone-900">
	                            {product.name}
	                          </h3>
	                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-600">
	                            <span>Prezzo: {product.price || "Tratt."}</span>
	                            <span>Clic: {product.clickCount ?? 0}</span>
	                            <span>Qtà.: {product.quantity ?? "-"}</span>
	                          </div>
	                        </div>

	                        <div className="border border-stone-100 bg-stone-50 px-3 py-3">
	                          <p className="text-[10px] uppercase tracking-[0.12em] text-stone-500">
	                            Proprietario del prodotto
	                          </p>
	                          <p className="mt-1 text-sm font-semibold text-stone-900">
	                            {ownerName}
	                          </p>
	                          <div className="mt-2 grid grid-cols-1 gap-1 text-xs text-stone-600 sm:grid-cols-2 lg:grid-cols-1">
	                            <span>Email: {ownerEmail}</span>
	                            <span>Città: {ownerCity}</span>
	                            <span>WhatsApp: {ownerWhatsapp}</span>
	                            <span>ID utente: {product.owner?.id ?? product.ownerId ?? "-"}</span>
	                          </div>
	                        </div>

	                        <button
	                          type="button"
	                          onClick={() => void handleDeleteProduct(product)}
	                          disabled={deletingProductId === product.id}
	                          className="inline-flex items-center justify-center gap-2 border border-red-300 px-3 py-2 text-xs uppercase tracking-[0.12em] text-red-700 hover:bg-red-50 disabled:opacity-60 lg:w-40"
	                        >
	                          <Trash2 className="w-3.5 h-3.5" />
	                          {deletingProductId === product.id ? "Eliminazione..." : "Elimina"}
	                        </button>
	                      </div>
	                    </article>
	                  );
	                })}
	              </div>
	            )}

	            {productsHasMore && (
	              <div className="flex justify-center pt-2">
	                <button
	                  type="button"
	                  onClick={() => void handleLoadMoreProducts()}
	                  disabled={isLoadingMoreProducts}
	                  className="inline-flex items-center justify-center gap-2 border border-stone-300 bg-white px-4 py-2.5 text-xs uppercase tracking-[0.14em] text-stone-700 hover:border-stone-900 disabled:opacity-60"
	                >
	                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMoreProducts ? "animate-spin" : ""}`} />
	                  {isLoadingMoreProducts ? "Caricamento..." : "Carica altro"}
	                </button>
	              </div>
	            )}
	          </section>
	        ) : activeView === "users" ? (
	          <>
            <div className="mb-6 border border-stone-200 bg-white p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-3">
                <Search className="w-4 h-4 text-stone-600" />
                <h2 className="text-sm font-semibold text-stone-900">
                  Utenti registrati ({users.length})
                </h2>
              </div>
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Filtra per nome, email, città, paese o ID"
                className="w-full border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-stone-900"
              />
            </div>

            {usersError && (
              <div className="mb-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {usersError}
              </div>
            )}

            {isLoadingUsers ? (
              <div className="py-16 text-center text-sm text-stone-500">Caricamento utenti...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-16 text-center text-sm text-stone-500">
                Nessun utente trovato.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredUsers.map((user) => (
                  <article
                    key={user.id}
                    className="border border-stone-200 bg-white p-4 sm:p-5 flex flex-col gap-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => void handleOpenUserDetail(user)}
                        className="min-w-0 flex-1 text-left group"
                      >
                        <h3 className="text-sm font-semibold text-stone-900 group-hover:underline">
                          <span className="inline-flex items-center gap-2">
                            {pendingResetCodesByUserId[user.id] && (
                              <span className="h-2.5 w-2.5 rounded-full bg-red-600 animate-pulse" />
                            )}
                            <span className="truncate">
                              {user.username || user.email || `Utente ${user.id}`}
                            </span>
                          </span>
                        </h3>
                        <p className="text-xs text-stone-600">{user.email || "-"}</p>
                      </button>
                      <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.12em] px-2 py-1 border border-stone-300 text-stone-600">
                        ID {user.id}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-stone-600">
                      <span>Città: {user.city || "-"}</span>
                      <span>Paese: {user.country || "-"}</span>
                      <span>Creato il: {formatDate(user.createdAt)}</span>
                      <span>
                        Status:{" "}
                        <strong className={user.isBanned ? "text-red-700" : "text-emerald-700"}>
                          {user.isBanned ? "Bloccato" : "Attivo"}
                        </strong>
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void handleOpenUserDetail(user)}
                        className="inline-flex items-center gap-2 border border-stone-300 px-3 py-2 text-xs uppercase tracking-[0.12em] text-stone-700 hover:border-stone-800"
                      >
                        <Users className="w-3.5 h-3.5" />
                        Apri scheda
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
          ) : activeView === "notifiche" ? (
            <section className="space-y-4">
              <article className="border border-stone-200 bg-white p-4 sm:p-5">
                <div className="mb-4 flex items-start gap-3">
                  <Bell className="mt-0.5 h-4 w-4 text-stone-700" />
                  <div>
                    <h2 className="text-sm font-semibold text-stone-900">
                      Invia una notifica a tutti
                    </h2>
                    <p className="mt-1 text-xs text-stone-500">
                      Usalo per avvisi del sito, problemi operativi o annunci sponsorizzati. Se scegli un prodotto o una pubblicazione, la notifica aprirà il contenuto collegato.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSendBroadcast} className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_18rem]">
                    <div className="space-y-3">
                      <label className="block text-xs uppercase tracking-[0.12em] text-stone-500">
                        Titolo
                      </label>
                      <input
                        type="text"
                        value={broadcastTitle}
                        onChange={(event) => setBroadcastTitle(event.target.value.slice(0, 120))}
                        placeholder="Es.: Terreno in vendita in evidenza"
                        className="w-full border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-stone-900"
                      />
                      <label className="block text-xs uppercase tracking-[0.12em] text-stone-500">
                        Messaggio
                      </label>
                      <textarea
                        rows={5}
                        value={broadcastMessage}
                        onChange={(event) => setBroadcastMessage(event.target.value.slice(0, 600))}
                        placeholder="Scrivi il messaggio da mostrare nelle notifiche degli utenti."
                        className="w-full resize-none border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-stone-900"
                      />
                    </div>
                    <div className="space-y-3 border border-stone-100 bg-stone-50 p-3">
                      <label className="block text-xs uppercase tracking-[0.12em] text-stone-500">
                        Destinatario
                      </label>
                      <select
                        value={broadcastRecipientUserId}
                        onChange={(event) => setBroadcastRecipientUserId(event.target.value)}
                        className="w-full border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-stone-900"
                      >
                        <option value="">Tutti gli utenti reali</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            #{user.id} {user.name} - {user.email}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs leading-relaxed text-stone-500">
                        Per inviare a una sola persona, seleziona l’utente. Per un invio generale, lascia tutti.
                      </p>

                      <label className="block text-xs uppercase tracking-[0.12em] text-stone-500">
                        Annuncio sponsorizzato facoltativo
                      </label>
                      <select
                        value={broadcastProductId}
                        onChange={(event) => {
                          setBroadcastProductId(event.target.value);
                          if (event.target.value) {
                            setBroadcastPublicationId("");
                          }
                        }}
                        className="w-full border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-stone-900"
                      >
                        <option value="">Senza annuncio</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            #{product.id} {product.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs leading-relaxed text-stone-500">
                        Per scegliere un prodotto non presente, apri la sezione Prodotti e cercalo. I risultati saranno disponibili in questo elenco.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveView("products");
                          void loadProducts(authToken, productQuery);
                        }}
                        className="inline-flex w-full items-center justify-center gap-2 border border-stone-300 bg-white px-3 py-2 text-xs uppercase tracking-[0.12em] text-stone-700 hover:border-stone-900"
                      >
                        <Package className="h-3.5 w-3.5" />
                        Cerca prodotto
                      </button>
                      
                      <label className="block text-xs uppercase tracking-[0.12em] text-stone-500">
                        Pubblicazione collegata facoltativa
                      </label>
                      <select
                        value={broadcastPublicationId}
                        onChange={(event) => {
                          setBroadcastPublicationId(event.target.value);
                          if (event.target.value) {
                            setBroadcastProductId("");
                          }
                        }}
                        className="w-full border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-stone-900"
                      >
                        <option value="">Senza pubblicazione</option>
                        {publications.map((publication) => (
                          <option key={publication.id} value={publication.id}>
                            #{publication.id} {publication.establishmentName} — {publication.caption.slice(0, 70)}
                          </option>
                        ))}
                      </select>
                      {isLoadingPublications ? (
                        <p className="text-xs text-stone-500">Caricamento pubblicazioni...</p>
                      ) : null}
                      {publicationsError ? (
                        <p className="text-xs text-red-600">{publicationsError}</p>
                      ) : null}
                      <p className="text-xs leading-relaxed text-stone-500">
                        Scegli un prodotto o una pubblicazione. Il contenuto collegato si aprirà nel profilo dell’autore.
                      </p>
                    </div>
                  </div>

                  {broadcastError && (
                    <div className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {broadcastError}
                    </div>
                  )}
                  {broadcastStatus && (
                    <div className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                      {broadcastStatus}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSendingBroadcast}
                    className="inline-flex items-center justify-center gap-2 bg-stone-900 px-4 py-2.5 text-xs uppercase tracking-[0.14em] text-white hover:bg-black disabled:opacity-60"
                  >
                    <Bell className="h-3.5 w-3.5" />
                    {isSendingBroadcast
                      ? "Invio..."
                      : broadcastRecipientUserId
                        ? "Invia all’utente"
                        : "Invia a tutti"}
                  </button>
                </form>
              </article>

              <article className="border border-stone-200 bg-white p-4 sm:p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <Bell className="mt-0.5 h-4 w-4 text-stone-700" />
                    <div>
                      <h2 className="text-sm font-semibold text-stone-900">
                        Notifiche inviate
                      </h2>
                      <p className="mt-1 text-xs text-stone-500">
                        Consulta lo storico e rimuovi una notifica dagli avvisi degli utenti.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      void loadBroadcastNotifications(authToken);
                      void loadPublications(authToken);
                    }}
                    disabled={isLoadingBroadcastNotifications}
                    className="inline-flex items-center justify-center gap-2 border border-stone-300 bg-white px-3 py-2 text-xs uppercase tracking-[0.12em] text-stone-700 hover:border-stone-900 disabled:opacity-60"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${isLoadingBroadcastNotifications ? "animate-spin" : ""}`}
                    />
                    Aggiorna
                  </button>
                </div>

                {isLoadingBroadcastNotifications && broadcastNotifications.length === 0 ? (
                  <div className="flex items-center gap-2 border border-stone-100 bg-stone-50 px-3 py-4 text-sm text-stone-500">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Caricamento delle notifiche inviate...
                  </div>
                ) : broadcastNotifications.length === 0 ? (
                  <div className="border border-dashed border-stone-300 px-3 py-6 text-center text-sm text-stone-500">
                    L’amministratore non ha ancora inviato notifiche.
                  </div>
                ) : (
                  <div className="divide-y divide-stone-100 border border-stone-100">
                    {broadcastNotifications.map((notification) => {
                      const isDeleting = deletingBroadcastNotificationId === notification.id;
                      return (
                        <div
                          key={notification.id}
                          className="flex flex-col gap-3 bg-white p-3 sm:flex-row sm:items-start sm:justify-between"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold text-stone-900">
                                {notification.title}
                              </span>
                              <span className="text-[11px] uppercase tracking-[0.12em] text-stone-400">
                                #{notification.id}
                              </span>
                            </div>
                            <p className="mt-1 text-sm leading-relaxed text-stone-600">
                              {notification.message}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-stone-500">
                              <span>{formatDateTime(notification.createdAt)}</span>
                              {notification.publicationId ? (
                                <span>
                                  Pubblicazione: #{notification.publicationId}{" "}
                                  {notification.publicationName || "pubblicazione collegata"}
                                </span>
                              ) : notification.productId ? (
                                <span>
                                  Prodotto: #{notification.productId}{" "}
                                  {notification.productName || "annuncio collegato"}
                                </span>
                              ) : (
                                <span>Senza annuncio o pubblicazione collegata</span>
                              )}
                              {notification.recipientUserId ? (
                                <span>
                                  A: {notification.recipientName || notification.recipientEmail || `Utente ${notification.recipientUserId}`}
                                </span>
                              ) : (
                                <span>A: tutti</span>
                              )}
                              {notification.createdBy ? (
                                <span>Admin: {notification.createdBy}</span>
                              ) : null}
                            </div>

                          </div>
                          <button
                            type="button"
                            onClick={() => void handleDeleteBroadcastNotification(notification)}
                            disabled={isDeleting}
                            className="inline-flex items-center justify-center gap-2 border border-red-200 bg-red-50 px-3 py-2 text-xs uppercase tracking-[0.12em] text-red-700 hover:border-red-400 disabled:opacity-60"
                          >
                            {isDeleting ? (
                              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                            Elimina
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </article>
            </section>
          ) : activeView === "visitors" ? (
            <section className="space-y-4">
              <article className="border border-stone-200 bg-white p-4 sm:p-5 space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex items-start gap-3">
                    <Users className="w-4 h-4 text-stone-700 mt-0.5" />
                    <div>
                      <h2 className="text-sm font-semibold text-stone-900">Visitatori di <span translate="no" className="notranslate">TempleSale</span></h2>
	                      <p className="text-xs text-stone-500 mt-1">
	                        Registro giornaliero degli accessi (per IP e browser), con indicazione
	                        <strong> Io</strong> per il tuo accesso attuale. Cambiando giorno, i dati si aggiornano automaticamente.
	                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] uppercase tracking-[0.12em] text-stone-500">
                      Giorno (UTC)
                    </label>
                    <input
                      type="date"
                      value={visitorDay}
                      onChange={(event) => setVisitorDay(normalizeDateKey(event.target.value))}
                      className="border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-stone-900"
                    />
                  </div>
                </div>
	                <div className="flex flex-wrap gap-3 text-xs text-stone-500">
	                  <span>
	                    Giorno selezionato: <strong>{formatDayDate(visitorDay)}</strong>
	                  </span>
	                  {isLoadingVisitors && <span>Caricamento del giorno...</span>}
	                  {visitorsUpdatedAt !== null && (
	                    <span>Aggiornato il: {formatDateTime(visitorsUpdatedAt)}</span>
	                  )}
                </div>
              </article>

              {visitorsError && (
                <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {visitorsError}
                </div>
              )}

              <article className="border border-stone-200 bg-white p-4 sm:p-5">
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                  <div className="border border-stone-200 bg-stone-50 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500">Visite del giorno</p>
                    <p className="text-sm font-semibold text-stone-900">{visitorsSummary.externalVisits}</p>
                    <p className="text-[10px] text-stone-500">escluso il tuo accesso</p>
                  </div>
                  <div className="border border-stone-200 bg-stone-50 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500">Visitatori unici</p>
                    <p className="text-sm font-semibold text-stone-900">
                      {visitorsSummary.externalUniqueVisitors}
                    </p>
                    <p className="text-[10px] text-stone-500">escluso il tuo accesso</p>
                  </div>
                  <div className="border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-emerald-700">Il tuo accesso</p>
                    <p className="text-sm font-semibold text-emerald-800">{visitorsSummary.selfVisits}</p>
                    <p className="text-[10px] text-emerald-700">indicato come Io</p>
                  </div>
                  <div className="border border-blue-200 bg-blue-50 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-blue-700">Totale complessivo</p>
                    <p className="text-sm font-semibold text-blue-800">{visitorsSummary.totalVisits}</p>
                    <p className="text-[10px] text-blue-700">include Io</p>
                  </div>
                  <div className="border border-blue-200 bg-blue-50 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-blue-700">Totale visitatori unici</p>
                    <p className="text-sm font-semibold text-blue-800">{visitorsSummary.uniqueVisitors}</p>
                    <p className="text-[10px] text-blue-700">include Io</p>
                  </div>
                </div>
              </article>

              {isLoadingVisitors ? (
                <div className="py-16 text-center text-sm text-stone-500">Caricamento visitatori...</div>
              ) : visitors.length === 0 ? (
                <div className="py-16 text-center text-sm text-stone-500">
                  Nessun visitatore registrato in questo giorno.
                </div>
              ) : (
                <article className="border border-stone-200 bg-white p-4 sm:p-5">
                  <div className="max-h-130 overflow-y-auto pr-1 space-y-2">
	                    {visitors.map((visitor) => {
	                      const DeviceIcon = getVisitorDeviceIcon(visitor);
	                      return (
	                        <article
	                          key={`${visitor.visitorKey || visitor.id}-${visitor.lastSeenAt}`}
	                          className={`border px-3 py-3 ${
	                            visitor.isSelf
	                              ? "border-emerald-200 bg-emerald-50/60"
	                              : "border-stone-200 bg-white"
	                          }`}
	                        >
	                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
	                            <div className="min-w-0 space-y-2">
	                              <div className="flex flex-wrap items-center gap-2">
	                                <span
	                                  className={`inline-flex items-center border px-2 py-0.5 text-[11px] uppercase tracking-[0.12em] ${
	                                    visitor.isSelf
	                                      ? "border-emerald-300 text-emerald-700"
	                                      : "border-stone-300 text-stone-700"
	                                  }`}
	                                >
	                                  {visitor.label}
	                                </span>
	                                <span className="inline-flex items-center gap-1 text-xs font-medium text-stone-700">
	                                  <DeviceIcon className="h-3.5 w-3.5" />
	                                  {formatVisitorDeviceSummary(visitor)}
	                                </span>
	                              </div>
	                              <p className="text-xs text-stone-600">
	                                Posizione probabile:{" "}
	                                <strong>{formatVisitorLocation(visitor)}</strong>
	                              </p>
	                              <p className="text-xs text-stone-500">
	                                Visite: <strong>{visitor.visits}</strong> volte. Ultimo accesso:{" "}
	                                {formatDateTime(visitor.lastSeenAt)}
	                              </p>
	                            </div>
	                            <div className="shrink-0 text-xs text-stone-500 sm:text-right">
	                              <p>Origine</p>
	                              <p className="max-w-56 truncate font-medium text-stone-700">
	                                {formatVisitorSource(visitor)}
	                              </p>
	                            </div>
	                          </div>

	                          <details className="mt-3 border-t border-stone-200 pt-3">
	                            <summary className="inline-flex cursor-pointer list-none items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-stone-600 hover:text-stone-900">
	                              <ChevronDown className="h-3.5 w-3.5" />
	                              Mostra dettagli tecnici
	                            </summary>
	                            <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-stone-600 md:grid-cols-2">
	                              <p>
	                                IP: <strong>{visitor.ip || "-"}</strong>
	                              </p>
	                              <p>
	                                Pagina di ingresso:{" "}
	                                <span className="font-mono">{visitor.entryPath || "/"}</span>
	                              </p>
	                              <p>Primo accesso: {formatDateTime(visitor.firstSeenAt)}</p>
	                              <p>Ultimo accesso: {formatDateTime(visitor.lastSeenAt)}</p>
	                              <p>Città: {visitor.city || "-"}</p>
	                              <p>Regione: {visitor.region || "-"}</p>
	                              <p>Paese: {formatVisitorCountryDetail(visitor)}</p>
	                              <p>Dispositivo: {visitor.deviceModel || "-"}</p>
	                              <p>
	                                Sistema:{" "}
	                                {[visitor.deviceOsName, visitor.deviceOsVersion]
	                                  .filter(Boolean)
	                                  .join(" ") || "-"}
	                              </p>
	                              <p className="break-all md:col-span-2">
	                                Browser/app di origine: {visitor.userAgent}
	                              </p>
	                              <p className="break-all md:col-span-2">
	                                Riferimento completo: {visitor.referrer || "Accesso diretto"}
	                              </p>
	                            </div>
	                          </details>
	                        </article>
	                      );
	                    })}
                  </div>
                </article>
              )}
            </section>
          ) : (
            <section className="space-y-4">
            <article className="border border-stone-200 bg-white p-4 sm:p-5 space-y-4">
              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-stone-700 mt-0.5" />
                <div>
                  <h2 className="text-sm font-semibold text-stone-900">Area di test della sicurezza</h2>
                  <p className="text-xs text-stone-500 mt-1">
                    Questa sezione esegue controlli non distruttivi per verificare lo strumento di sicurezza. Non applica automaticamente nuove protezioni.
                  </p>
                </div>
              </div>

              {!isTestAreaUnlocked ? (
                <form onSubmit={handleUnlockTestArea} className="space-y-3">
                  <label className="text-xs uppercase tracking-[0.12em] text-stone-500">
                    Password dell’area di test
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="password"
                      value={testAreaPassword}
                      onChange={(event) => setTestAreaPassword(event.target.value)}
                      className="w-full sm:max-w-sm border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-stone-900"
                      placeholder="Inserisci la password dell’area di test"
                      autoComplete="off"
                    />
                    <button
                      type="submit"
                      disabled={isUnlockingTestArea}
                      className="inline-flex items-center justify-center gap-2 border border-stone-900 bg-stone-900 text-white px-4 py-2.5 text-xs uppercase tracking-[0.14em] hover:bg-black disabled:opacity-60"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      {isUnlockingTestArea ? "Verifica in corso..." : "Accedi alla sezione"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Area di test sbloccata.
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => void handleRunSecurityChecks()}
                      disabled={isRunningSecurityChecks}
                      className="inline-flex items-center justify-center gap-2 border border-stone-900 bg-stone-900 text-white px-4 py-2.5 text-xs uppercase tracking-[0.14em] hover:bg-black disabled:opacity-60"
                    >
                      {isRunningSecurityChecks ? (
                        <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ShieldAlert className="w-3.5 h-3.5" />
                      )}
                      {isRunningSecurityChecks ? "Esecuzione in corso..." : "Esegui diagnostica"}
                    </button>
                  </div>
                  <p className="text-xs text-stone-500">
                    Lo scanner esegue oltre 300 verifiche reali di API, autorizzazioni, validazione degli input e risposte di errore.
                  </p>
                  {(isRunningSecurityChecks || securityChecksProgress.total > 0) && (
                    <p className="text-xs text-stone-500">
                      Avanzamento della scansione:{" "}
                      <strong>
                        {securityChecksProgress.done}/{securityChecksProgress.total}
                      </strong>
                    </p>
                  )}
                  {securityChecksRanAt !== null && (
                    <p className="text-xs text-stone-500">
                      Ultima esecuzione: {formatDateTime(securityChecksRanAt)}
                    </p>
                  )}
                </div>
              )}

              {testAreaError && (
                <div className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {testAreaError}
                </div>
              )}
            </article>

            {isTestAreaUnlocked && (
              <article className="border border-stone-200 bg-white p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-stone-900">
                      Monitor API in tempo reale
                    </h3>
                    <p className="text-xs text-stone-500 mt-1">
                      Mostra le attività recenti su <code>/api</code>, compresi i tentativi sospetti, senza applicare blocchi automatici.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setIsLiveMonitorEnabled((current) => !current)}
                      className="inline-flex items-center gap-2 border border-stone-300 px-3 py-2 text-xs uppercase tracking-[0.12em] text-stone-700 hover:border-stone-800"
                    >
                      {isLiveMonitorEnabled ? "Pausa aggiornamenti" : "Riprendi aggiornamenti"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void loadSecurityEvents(authToken)}
                      disabled={isLoadingSecurityEvents}
                      className="inline-flex items-center gap-2 border border-stone-300 px-3 py-2 text-xs uppercase tracking-[0.12em] text-stone-700 hover:border-stone-800 disabled:opacity-60"
                    >
                      {isLoadingSecurityEvents ? (
                        <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      Aggiorna eventi
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleClearSecurityEvents()}
                      disabled={isClearingSecurityEvents}
                      className="inline-flex items-center gap-2 border border-red-300 px-3 py-2 text-xs uppercase tracking-[0.12em] text-red-700 hover:bg-red-50 disabled:opacity-60"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {isClearingSecurityEvents ? "Pulizia in corso..." : "Cancella storico"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setSecurityEventsFilter("all")}
                    className={`text-left border px-3 py-2 transition-colors ${
                      securityEventsFilter === "all"
                        ? "border-stone-900 bg-stone-900 text-white"
                        : "border-stone-200 bg-stone-50 hover:border-stone-400"
                    }`}
                  >
                    <p
                      className={`text-[11px] uppercase tracking-[0.12em] ${
                        securityEventsFilter === "all" ? "text-white/80" : "text-stone-500"
                      }`}
                    >
                      Total
                    </p>
                    <p className="text-sm font-semibold">{securityEventsSummary.total}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSecurityEventsFilter("pass")}
                    className={`text-left border px-3 py-2 transition-colors ${
                      securityEventsFilter === "pass"
                        ? "border-emerald-800 bg-emerald-800 text-white"
                        : "border-emerald-200 bg-emerald-50 hover:border-emerald-400"
                    }`}
                  >
                    <p
                      className={`text-[11px] uppercase tracking-[0.12em] ${
                        securityEventsFilter === "pass" ? "text-white/80" : "text-emerald-700"
                      }`}
                    >
                      Normal
                    </p>
                    <p className="text-sm font-semibold">{securityEventsSummary.pass}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSecurityEventsFilter("warn")}
                    className={`text-left border px-3 py-2 transition-colors ${
                      securityEventsFilter === "warn"
                        ? "border-amber-800 bg-amber-800 text-white"
                        : "border-amber-200 bg-amber-50 hover:border-amber-400"
                    }`}
                  >
                    <p
                      className={`text-[11px] uppercase tracking-[0.12em] ${
                        securityEventsFilter === "warn" ? "text-white/80" : "text-amber-700"
                      }`}
                    >
                      Attenzione
                    </p>
                    <p className="text-sm font-semibold">{securityEventsSummary.warn}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSecurityEventsFilter("fail")}
                    className={`text-left border px-3 py-2 transition-colors ${
                      securityEventsFilter === "fail"
                        ? "border-red-800 bg-red-800 text-white"
                        : "border-red-200 bg-red-50 hover:border-red-400"
                    }`}
                  >
                    <p
                      className={`text-[11px] uppercase tracking-[0.12em] ${
                        securityEventsFilter === "fail" ? "text-white/80" : "text-red-700"
                      }`}
                    >
                      Avviso
                    </p>
                    <p className="text-sm font-semibold">{securityEventsSummary.fail}</p>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500">
                  <span>
                    Totale eventi in memoria: <strong>{securityEventsTotalTracked}</strong>
                  </span>
                  {securityEventsUpdatedAt !== null && (
                    <span>Aggiornato il: {formatDateTime(securityEventsUpdatedAt)}</span>
                  )}
                  <span>
                    Aggiornamento automatico:{" "}
                    <strong>{isLiveMonitorEnabled ? "attivo" : "in pausa"}</strong>
                  </span>
                  <span>
                    Filtro attivo: <strong>{getSecurityFilterLabel(securityEventsFilter)}</strong>
                  </span>
                </div>

                {securityEventsError && (
                  <div className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {securityEventsError}
                  </div>
                )}

                {isLoadingSecurityEvents && securityEvents.length === 0 ? (
                  <div className="py-10 text-center text-sm text-stone-500">
                    Caricamento eventi del monitor...
                  </div>
                ) : securityEvents.length === 0 ? (
                  <div className="py-10 text-center text-sm text-stone-500">
                    Nessuna attività recente registrata.
                  </div>
                ) : filteredSecurityEvents.length === 0 ? (
                  <div className="py-10 text-center text-sm text-stone-500">
                    Nessun evento nel filtro <strong>{getSecurityFilterLabel(securityEventsFilter)}</strong>.
                  </div>
                ) : (
                  <div className="max-h-[460px] overflow-y-auto pr-1 space-y-2">
                    {filteredSecurityEvents.map((event) => (
                      <article
                        key={`${event.id}-${event.createdAt}`}
                        className="border border-stone-200 bg-white px-3 py-3"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center border border-stone-300 px-2 py-0.5 text-[11px] uppercase tracking-[0.12em] text-stone-700">
                            {event.method}
                          </span>
                          <span
                            className={`inline-flex items-center border px-2 py-0.5 text-[11px] uppercase tracking-[0.12em] ${getSecurityStatusStyles(
                              event.level,
                            )}`}
                          >
                            {getSecurityStatusLabel(event.level)}
                          </span>
                          <span className="text-xs text-stone-600">
                            Risposta HTTP: {event.status} ({explainHttpStatus(event.status)})
                          </span>
                          <span className="text-xs text-stone-500">{formatDateTime(event.createdAt)}</span>
                          <span className="text-xs text-stone-500">
                            Tempo di risposta: {event.durationMs} ms
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-stone-800">
                          {buildSecurityEventFriendlySummary(event)}
                        </p>
                        <p className="mt-2 text-xs text-stone-600 break-all">
                          Percorso richiesto: <span className="font-mono text-stone-700">{event.path}</span>
                        </p>
                        {formatSecurityEventNote(event.note) ? (
                          <p className="mt-2 text-xs text-stone-600">
                            {formatSecurityEventNote(event.note)}
                          </p>
                        ) : (
                          <p className="mt-2 text-xs text-stone-400">
                            Nessun ulteriore dettaglio tecnico per questo evento.
                          </p>
                        )}
                        <p className="mt-2 text-[11px] text-stone-500 break-all">
                          Origine (IP): {event.ip} | Area amministratore: {event.isAdminRoute ? "sì" : "no"} | Accesso utente: {event.hasAuthToken ? "sì" : "no"} | Accesso amministratore:{" "}
                          {event.hasAdminToken ? "sì" : "no"}
                        </p>
                        <p className="mt-1 text-[11px] text-stone-500 break-all">
                          Browser/app di origine: {event.userAgent}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </article>
            )}

            {securityChecks.length > 0 && (
              <article className="border border-stone-200 bg-white p-4 sm:p-5">
                <div className="flex flex-col gap-3 mb-4">
                  <h3 className="text-sm font-semibold text-stone-900">
                    Risultati della diagnostica ({securityChecksSummary.total})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="border border-stone-200 bg-stone-50 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-stone-500">Total</p>
                      <p className="text-sm font-semibold text-stone-900">{securityChecksSummary.total}</p>
                    </div>
                    <div className="border border-emerald-200 bg-emerald-50 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-emerald-700">Normal</p>
                      <p className="text-sm font-semibold text-emerald-800">{securityChecksSummary.pass}</p>
                    </div>
                    <div className="border border-amber-200 bg-amber-50 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-amber-700">Attenzione</p>
                      <p className="text-sm font-semibold text-amber-800">{securityChecksSummary.warn}</p>
                    </div>
                    <div className="border border-red-200 bg-red-50 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-red-700">Avviso</p>
                      <p className="text-sm font-semibold text-red-800">{securityChecksSummary.fail}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {securityChecksSummary.categories.map((item) => (
                      <span
                        key={item.category}
                        className={`inline-flex items-center border px-2.5 py-1 text-[11px] uppercase tracking-[0.1em] ${getSecurityCategoryStyles(
                          item.category,
                        )}`}
                      >
                        {getSecurityCategoryLabel(item.category)}: {item.count}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  {securityChecks.map((check) => (
                    <div
                      key={check.id}
                      className={`border px-3 py-3 ${getSecurityStatusStyles(check.status)}`}
                    >
                      <div className="flex items-start gap-2">
                        {check.status === "pass" ? (
                          <CheckCircle2 className="w-4 h-4 mt-0.5" />
                        ) : check.status === "warn" ? (
                          <AlertTriangle className="w-4 h-4 mt-0.5" />
                        ) : (
                          <Ban className="w-4 h-4 mt-0.5" />
                        )}
                        <div className="w-full">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold">{check.title}</p>
                            <span
                              className={`inline-flex items-center border px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] ${getSecurityCategoryStyles(
                                check.category,
                              )}`}
                            >
                              {getSecurityCategoryLabel(check.category)}
                            </span>
                          </div>
                          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div className="border border-current/20 bg-white/60 px-2.5 py-2">
                              <p className="text-[10px] uppercase tracking-[0.12em] font-bold mb-1">
                                Errore/diagnostica
                              </p>
                              <p>{check.details}</p>
                            </div>
                            <div className="border border-current/20 bg-white/60 px-2.5 py-2">
                              <p className="text-[10px] uppercase tracking-[0.12em] font-bold mb-1">
                                Come correggere
                              </p>
                              <p>{check.howToFix}</p>
                            </div>
                          </div>
                          <p className="text-[11px] mt-2 break-all">
                            Evidenza tecnica: <span className="font-mono">{check.technicalEvidence}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            )}
          </section>
        )}

        {selectedUser && (
          <div className="fixed inset-0 z-50 bg-black/35 sm:p-6" role="dialog" aria-modal="true">
            <div className="ml-auto flex h-full w-full max-w-4xl flex-col bg-white shadow-xl">
              <div className="flex items-start justify-between gap-3 border-b border-stone-200 px-4 py-4 sm:px-6">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-stone-500">
                    Scheda utente
                  </p>
                  <h2 className="mt-1 flex items-center gap-2 text-base font-semibold text-stone-900 sm:text-lg">
                    {selectedResetCode && (
                      <span className="h-2.5 w-2.5 rounded-full bg-red-600 animate-pulse" />
                    )}
                    <span className="truncate">
                      {selectedUser.username || selectedUser.email || `Utente ${selectedUser.id}`}
                    </span>
                  </h2>
                  <p className="text-xs text-stone-500">{selectedUser.email || "-"}</p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseUserDetail}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center border border-stone-300 text-stone-700 hover:border-stone-900"
                  aria-label="Chiudi scheda utente"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
                {selectedUserError && (
                  <div className="mb-4 border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    {selectedUserError}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <section className="space-y-4">
                    <article className="border border-stone-200 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4 text-stone-700" />
                        <h3 className="text-sm font-semibold text-stone-900">Dati disponibili</h3>
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {getAdminUserDetailRows(selectedUser).map((row) => (
                          <div key={row.label} className="border border-stone-100 bg-stone-50 px-3 py-2">
                            <p className="text-[10px] uppercase tracking-[0.12em] text-stone-500">
                              {row.label}
                            </p>
                            <p className="mt-1 break-words text-sm text-stone-800">{row.value}</p>
                          </div>
                        ))}
                      </div>
                    </article>

                    <article className="border border-stone-200 p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-stone-700" />
                          <h3 className="text-sm font-semibold text-stone-900">Prodotti pubblicati</h3>
                        </div>
                        <span className="text-xs text-stone-500">
                          {selectedUserProducts.length} elementi
                        </span>
                      </div>
                      {isLoadingSelectedUserProducts ? (
                        <div className="py-8 text-center text-sm text-stone-500">
                          Caricamento prodotti...
                        </div>
                      ) : selectedUserProducts.length === 0 ? (
                        <div className="py-8 text-center text-sm text-stone-500">
                          Nessun prodotto pubblicato.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {selectedUserProducts.map((product) => (
                            <div
                              key={product.id}
                              className="border border-stone-100 bg-stone-50 px-3 py-3"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-stone-900">
                                    {product.name}
                                  </p>
                                  <p className="text-xs text-stone-500">
                                    {product.category || "Senza categoria"} · ID {product.id}
                                  </p>
                                </div>
                                <span className="shrink-0 text-xs font-semibold text-stone-900">
                                  {product.price || "Tratt."}
                                </span>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-stone-500">
                                <span>Città: {product.city || "-"}</span>
                                <span>Clic: {product.clickCount ?? 0}</span>
                                <span>Qtà.: {product.quantity ?? "-"}</span>
                                <span>Creato: {formatDate(product.createdAt)}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => void handleDeleteProduct(product)}
                                disabled={deletingProductId === product.id}
                                className="mt-3 inline-flex items-center justify-center gap-2 border border-red-300 px-3 py-2 text-xs uppercase tracking-[0.12em] text-red-700 hover:bg-red-50 disabled:opacity-60"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                {deletingProductId === product.id ? "Eliminazione..." : "Elimina prodotto"}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </article>
                  </section>

                  <aside className="space-y-4">
                    <article className="border border-stone-200 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <KeyRound className="h-4 w-4 text-stone-700" />
                        <h3 className="text-sm font-semibold text-stone-900">Assistenza password</h3>
                      </div>
                      {selectedResetCode && (
                        <div className="mb-3 border border-red-200 bg-red-50 px-3 py-2">
                          <p className="flex items-center gap-2 text-xs font-semibold text-red-700">
                            <span className="h-2.5 w-2.5 rounded-full bg-red-600 animate-pulse" />
                            Codice in attesa di invio
                          </p>
                          <p className="mt-1 font-mono text-lg font-semibold text-red-800">
                            {selectedResetCode}
                          </p>
                        </div>
                      )}
                      <div className="space-y-2">
                        <label
                          htmlFor="admin-user-reset-password"
                          className="text-xs uppercase tracking-[0.14em] text-stone-500"
                        >
                          Password temporanea o nuova password
                        </label>
                        <input
                          id="admin-user-reset-password"
                          type="text"
                          value={resetPasswordValue}
                          onChange={(event) => setResetPasswordValue(event.target.value)}
                          className="w-full border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-stone-900"
                          placeholder="Minimo 6 caratteri"
                        />
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
                        <button
                          type="button"
                          onClick={() => handleGenerateResetCode(selectedUser)}
                          className="inline-flex items-center justify-center gap-2 border border-stone-300 px-3 py-2 text-xs uppercase tracking-[0.12em] text-stone-700 hover:border-stone-900"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                          Genera codice
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleResetUserPassword(selectedUser)}
                          disabled={isResettingUserPassword}
                          className="inline-flex items-center justify-center gap-2 bg-stone-900 px-3 py-2 text-xs uppercase tracking-[0.12em] text-white hover:bg-black disabled:opacity-60"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {isResettingUserPassword ? "Applicazione in corso..." : "Imposta password"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleCopyResetCode(resetPasswordValue || selectedResetCode)}
                          disabled={!resetPasswordValue && !selectedResetCode}
                          className="inline-flex items-center justify-center gap-2 border border-stone-300 px-3 py-2 text-xs uppercase tracking-[0.12em] text-stone-700 hover:border-stone-900 disabled:opacity-50"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Copia
                        </button>
                        {selectedWhatsappResetUrl && (
                          <a
                            href={selectedWhatsappResetUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center gap-2 border border-emerald-300 px-3 py-2 text-xs uppercase tracking-[0.12em] text-emerald-700 hover:bg-emerald-50"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            WhatsApp
                          </a>
                        )}
                      </div>
                    </article>

                    <article className="border border-stone-200 p-4">
                      <h3 className="mb-3 text-sm font-semibold text-stone-900">Azioni sull’account</h3>
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => void handleToggleBan(selectedUser)}
                          disabled={pendingBanUserId === selectedUser.id}
                          className="inline-flex w-full items-center justify-center gap-2 border border-amber-300 px-3 py-2 text-xs uppercase tracking-[0.12em] text-amber-700 hover:bg-amber-50 disabled:opacity-60"
                        >
                          {selectedUser.isBanned ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <Ban className="h-3.5 w-3.5" />
                          )}
                          {pendingBanUserId === selectedUser.id
                            ? "Aggiornamento..."
                            : selectedUser.isBanned
                              ? "Sblocca utente"
                              : "Blocca utente"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteUser(selectedUser)}
                          disabled={deletingUserId === selectedUser.id}
                          className="inline-flex w-full items-center justify-center gap-2 border border-red-300 px-3 py-2 text-xs uppercase tracking-[0.12em] text-red-700 hover:bg-red-50 disabled:opacity-60"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {deletingUserId === selectedUser.id ? "Disattivazione..." : "Disattiva attività"}
                        </button>
                        <button type="button" disabled={deletingUserId === selectedUser.id}
                          onClick={() => void handleDeleteUser(selectedUser, true)}
                          className="rounded-xl border border-red-600/40 px-4 py-2 text-xs font-semibold text-red-300 disabled:opacity-50">Elimina definitivamente</button>
                      </div>
                    </article>
                  </aside>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
