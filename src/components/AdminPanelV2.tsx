import React from "react";
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
} from "lucide-react";

type AdminUserV2 = {
  id: number;
  username: string;
  email: string;
  phone?: string;
  country?: string;
  state?: string;
  city?: string;
  createdAt?: string;
  isBanned: boolean;
  banReason?: string;
};

type AdminSessionV2 = {
  email: string;
  token: string;
};

type AdminViewV2 = "users" | "security";

type SecurityCheckStatus = "pass" | "warn" | "fail";
type SecurityEventFilter = "all" | SecurityCheckStatus;

type SecurityCheckResult = {
  id: string;
  title: string;
  status: SecurityCheckStatus;
  details: string;
};

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

const ADMIN_DEFAULT_EMAIL = "templesale@admin.com";
const ADMIN_TOKEN_STORAGE_KEY = "templesale_admin_token_v2";
const ADMIN_EMAIL_STORAGE_KEY = "templesale_admin_email_v2";
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

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
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

function formatDate(value?: string): string {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function formatDateTime(value: number): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
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
    return "Normal";
  }
  if (status === "warn") {
    return "Atenção";
  }
  return "Alerta";
}

function getSecurityFilterLabel(filter: SecurityEventFilter): string {
  if (filter === "all") {
    return "Total";
  }
  return getSecurityStatusLabel(filter);
}

function explainHttpStatus(status: number): string {
  if (status >= 500) {
    return "erro interno no servidor";
  }
  if (status >= 400) {
    return "acesso negado ou requisição inválida";
  }
  if (status >= 300) {
    return "redirecionamento";
  }
  if (status >= 200) {
    return "requisição concluída com sucesso";
  }
  if (status > 0) {
    return "resposta fora do padrão";
  }
  return "sem retorno HTTP";
}

function buildSecurityEventFriendlySummary(event: AdminSecurityEventV2): string {
  const routeType = event.isAdminRoute ? "na área administrativa" : "na API pública";
  const authContext = event.hasAdminToken
    ? "com credencial de administrador"
    : event.hasAuthToken
      ? "com credencial de usuário"
      : "sem credencial de login";

  if (event.level === "pass") {
    return `Movimento normal: a requisição foi feita ${routeType}, ${authContext}, e a API respondeu sem sinal de risco.`;
  }
  if (event.level === "warn") {
    return `Atenção: houve um comportamento fora do padrão ${routeType}, ${authContext}. Recomendado acompanhar este padrão de acesso.`;
  }
  return `Alerta: foi detectado um comportamento suspeito ${routeType}, ${authContext}. Recomendado revisar imediatamente este acesso.`;
}

function formatSecurityEventNote(note: string): string {
  const cleaned = note.trim();
  if (!cleaned) {
    return "";
  }
  return `Detalhe detectado automaticamente: ${cleaned}`;
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
  } = {},
): Promise<T> {
  const { method = "GET", token = "", body } = options;
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
    const fallback = `Falha na API (${response.status})`;
    const message = extractApiMessage(payload) || fallback;
    throw new HttpError(response.status, message, payload);
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
          continue;
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
  throw new Error("Falha ao autenticar administrador.");
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
  throw new Error("Sessão de administrador inválida.");
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

async function adminDeleteUser(token: string, userId: number): Promise<void> {
  await adminRequest<unknown>(`/api/admin/users/${userId}`, {
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
    throw new Error("Senha da área de testes é obrigatória.");
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
  throw new Error("Falha ao acessar área de testes.");
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
  throw new Error("Falha ao carregar monitor de segurança.");
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
  throw new Error("Falha ao limpar monitor de segurança.");
}

export default function AdminPanelV2() {
  const [isBootstrapping, setIsBootstrapping] = React.useState(true);
  const [activeView, setActiveView] = React.useState<AdminViewV2>("users");
  const [sessionEmail, setSessionEmail] = React.useState<string | null>(null);
  const [authToken, setAuthToken] = React.useState("");
  const [email, setEmail] = React.useState(ADMIN_DEFAULT_EMAIL);
  const [password, setPassword] = React.useState("");
  const [authError, setAuthError] = React.useState("");
  const [isAuthSubmitting, setIsAuthSubmitting] = React.useState(false);
  const [users, setUsers] = React.useState<AdminUserV2[]>([]);
  const [query, setQuery] = React.useState("");
  const [isLoadingUsers, setIsLoadingUsers] = React.useState(false);
  const [usersError, setUsersError] = React.useState("");
  const [pendingBanUserId, setPendingBanUserId] = React.useState<number | null>(null);
  const [deletingUserId, setDeletingUserId] = React.useState<number | null>(null);
  const [testAreaPassword, setTestAreaPassword] = React.useState("");
  const [isTestAreaUnlocked, setIsTestAreaUnlocked] = React.useState(false);
  const [isUnlockingTestArea, setIsUnlockingTestArea] = React.useState(false);
  const [testAreaError, setTestAreaError] = React.useState("");
  const [isRunningSecurityChecks, setIsRunningSecurityChecks] = React.useState(false);
  const [securityChecks, setSecurityChecks] = React.useState<SecurityCheckResult[]>([]);
  const [securityChecksRanAt, setSecurityChecksRanAt] = React.useState<number | null>(null);
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
        const message = error instanceof Error ? error.message : "Falha ao carregar usuários.";
        setUsers([]);
        setUsersError(message);
      } finally {
        setIsLoadingUsers(false);
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
          error instanceof Error ? error.message : "Falha ao carregar monitor de segurança.";
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
        const storedToken = readStoredToken();
        const storedEmail = readStoredEmail();
        if (!storedToken) {
          return;
        }

        const currentEmail = (await adminGetCurrent(storedToken)) || storedEmail || ADMIN_DEFAULT_EMAIL;
        if (cancelled) {
          return;
        }

        setAuthToken(storedToken);
        setSessionEmail(currentEmail);
        setEmail(currentEmail);
        await loadUsers(storedToken);
        await loadSecurityEvents(storedToken, { silent: true });
      } catch (error) {
        if (!cancelled) {
          clearSessionStorage();
          setAuthToken("");
          setSessionEmail(null);
          setUsers([]);
          if (!isUnauthorizedApiError(error)) {
            const message =
              error instanceof Error ? error.message : "Falha ao restaurar sessão de admin.";
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
  }, [loadSecurityEvents, loadUsers]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) {
      setAuthError("Preencha email e senha do administrador.");
      return;
    }

    setAuthError("");
    setIsAuthSubmitting(true);
    try {
      const session = await adminLogin(normalizedEmail, normalizedPassword);
      setAuthToken(session.token);
      setSessionEmail(session.email);
      setEmail(session.email);
      setPassword("");
      persistSession(session);
      await loadUsers(session.token);
      await loadSecurityEvents(session.token, { silent: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha ao autenticar administrador.";
      setAuthError(message);
      setSessionEmail(null);
      setUsers([]);
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
      setUsersError("");
      setAuthError("");
      setQuery("");
      setPassword("");
      setActiveView("users");
      setTestAreaPassword("");
      setIsTestAreaUnlocked(false);
      setIsUnlockingTestArea(false);
      setTestAreaError("");
      setIsRunningSecurityChecks(false);
      setSecurityChecks([]);
      setSecurityChecksRanAt(null);
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
      setTestAreaError("Informe a senha da área de testes.");
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
        error instanceof Error ? error.message : "Falha ao desbloquear área de testes.";
      setTestAreaError(message);
    } finally {
      setIsUnlockingTestArea(false);
    }
  };

  const handleClearSecurityEvents = async () => {
    if (!isTestAreaUnlocked) {
      setTestAreaError("Desbloqueie a área de testes antes de limpar os eventos.");
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
      const message = error instanceof Error ? error.message : "Falha ao limpar eventos.";
      setSecurityEventsError(message);
    } finally {
      setIsClearingSecurityEvents(false);
    }
  };

  const handleRunSecurityChecks = async () => {
    if (!isTestAreaUnlocked) {
      setTestAreaError("Desbloqueie a área de testes antes de executar os diagnósticos.");
      return;
    }

    setTestAreaError("");
    setIsRunningSecurityChecks(true);

    try {
      const checks: SecurityCheckResult[] = [];

      let healthStatus = 0;
      let healthHeaders: Headers | null = null;
      try {
        const healthResponse = await fetch(buildApiUrl("/api/health"), {
          method: "GET",
          credentials: "include",
        });
        healthStatus = healthResponse.status;
        healthHeaders = healthResponse.headers;
        checks.push({
          id: "health-endpoint",
          title: "Endpoint de saúde da API",
          status: healthResponse.ok ? "pass" : "warn",
          details: healthResponse.ok
            ? "API respondeu normalmente em /api/health."
            : `API respondeu ${healthResponse.status} em /api/health.`,
        });
      } catch (error) {
        checks.push({
          id: "health-endpoint",
          title: "Endpoint de saúde da API",
          status: "fail",
          details:
            error instanceof Error
              ? `Falha ao consultar /api/health: ${error.message}`
              : "Falha ao consultar /api/health.",
        });
      }

      if (healthHeaders) {
        const missingHeaders: string[] = [];
        const requiredHeaders = [
          "x-content-type-options",
          "x-frame-options",
          "referrer-policy",
          "content-security-policy",
        ] as const;
        for (const headerName of requiredHeaders) {
          if (!healthHeaders.get(headerName)) {
            missingHeaders.push(headerName);
          }
        }

        checks.push({
          id: "security-headers",
          title: "Cabeçalhos básicos de segurança",
          status: missingHeaders.length === 0 ? "pass" : "warn",
          details:
            missingHeaders.length === 0
              ? "Todos os cabeçalhos básicos foram encontrados."
              : `Cabeçalhos ausentes: ${missingHeaders.join(", ")}.`,
        });
      } else if (healthStatus === 0) {
        checks.push({
          id: "security-headers",
          title: "Cabeçalhos básicos de segurança",
          status: "fail",
          details: "Não foi possível validar cabeçalhos porque /api/health não respondeu.",
        });
      }

      try {
        const response = await fetch(buildApiUrl("/api/auth/me"), {
          method: "GET",
          credentials: "omit",
        });
        const protectedStatus = response.status === 401 || response.status === 403;
        checks.push({
          id: "auth-route-anonymous",
          title: "Proteção de rota autenticada (/api/auth/me)",
          status: protectedStatus ? "pass" : "fail",
          details: protectedStatus
            ? `Sem credenciais, rota bloqueou com status ${response.status}.`
            : `Sem credenciais, rota respondeu ${response.status}.`,
        });
      } catch (error) {
        checks.push({
          id: "auth-route-anonymous",
          title: "Proteção de rota autenticada (/api/auth/me)",
          status: "fail",
          details:
            error instanceof Error
              ? `Falha ao executar teste anônimo: ${error.message}`
              : "Falha ao executar teste anônimo.",
        });
      }

      try {
        const response = await fetch(buildApiUrl("/api/admin/users"), {
          method: "GET",
          credentials: "omit",
        });
        const protectedStatus = response.status === 401 || response.status === 403;
        checks.push({
          id: "admin-route-anonymous",
          title: "Proteção de rota administrativa (/api/admin/users)",
          status: protectedStatus ? "pass" : "fail",
          details: protectedStatus
            ? `Sem credenciais, rota admin bloqueou com status ${response.status}.`
            : `Sem credenciais, rota admin respondeu ${response.status}.`,
        });
      } catch (error) {
        checks.push({
          id: "admin-route-anonymous",
          title: "Proteção de rota administrativa (/api/admin/users)",
          status: "fail",
          details:
            error instanceof Error
              ? `Falha ao testar rota admin sem credenciais: ${error.message}`
              : "Falha ao testar rota admin sem credenciais.",
        });
      }

      try {
        const response = await fetch(buildApiUrl("/api/auth/login"), {
          method: "POST",
          credentials: "omit",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "email-invalido-sem-arroba",
            password: "123",
          }),
        });

        const isExpectedStatus = response.status === 400 || response.status === 401;
        checks.push({
          id: "input-validation-probe",
          title: "Teste simples de validação de entrada",
          status: isExpectedStatus ? "pass" : response.status >= 500 ? "fail" : "warn",
          details: isExpectedStatus
            ? `Payload inválido foi tratado corretamente com status ${response.status}.`
            : `Payload inválido respondeu com status ${response.status}.`,
        });
      } catch (error) {
        checks.push({
          id: "input-validation-probe",
          title: "Teste simples de validação de entrada",
          status: "fail",
          details:
            error instanceof Error
              ? `Falha ao executar teste de payload inválido: ${error.message}`
              : "Falha ao executar teste de payload inválido.",
        });
      }

      try {
        const response = await fetch(buildApiUrl("/api/this-route-should-not-exist"), {
          method: "GET",
          credentials: "omit",
        });
        checks.push({
          id: "unknown-route",
          title: "Resposta para rota inexistente",
          status: response.status === 404 ? "pass" : "warn",
          details:
            response.status === 404
              ? "Rotas inexistentes retornam 404 normalmente."
              : `Rota inexistente retornou ${response.status}.`,
        });
      } catch (error) {
        checks.push({
          id: "unknown-route",
          title: "Resposta para rota inexistente",
          status: "fail",
          details:
            error instanceof Error
              ? `Falha ao consultar rota inexistente: ${error.message}`
              : "Falha ao consultar rota inexistente.",
        });
      }

      setSecurityChecks(checks);
      setSecurityChecksRanAt(Date.now());
    } finally {
      setIsRunningSecurityChecks(false);
    }
  };

  const handleRefresh = async () => {
    if (!sessionEmail) {
      return;
    }
    if (activeView === "security") {
      if (!isTestAreaUnlocked) {
        setTestAreaError("Desbloqueie a área de testes para atualizar o monitor.");
        return;
      }
      await loadSecurityEvents(authToken);
      return;
    }
    await loadUsers(authToken, query);
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
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha ao atualizar status do usuário.";
      setUsersError(message);
    } finally {
      setPendingBanUserId(null);
    }
  };

  const handleDeleteUser = async (user: AdminUserV2) => {
    const confirmation = window.confirm(
      `Excluir o usuário ${user.email || `#${user.id}`} e dados relacionados?`,
    );
    if (!confirmation) {
      return;
    }

    setDeletingUserId(user.id);
    setUsersError("");
    try {
      await adminDeleteUser(authToken, user.id);
      setUsers((current) => current.filter((item) => item.id !== user.id));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao excluir usuário.";
      setUsersError(message);
    } finally {
      setDeletingUserId(null);
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

  if (isBootstrapping) {
    return (
      <div className="min-h-screen bg-[#fdfcfb] flex items-center justify-center">
        <div className="flex items-center gap-3 text-stone-600 text-sm uppercase tracking-[0.2em]">
          <LoaderCircle className="w-4 h-4 animate-spin" />
          Verificando sessão admin
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
            <h1 className="text-lg font-semibold text-stone-900">Admin TempleSale V2</h1>
          </div>
          <p className="text-xs text-stone-500 mb-6">
            Novo acesso administrativo em <code>/admin</code>.
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-[0.15em] text-stone-500">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-stone-900"
                placeholder={ADMIN_DEFAULT_EMAIL}
                autoComplete="username"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-[0.15em] text-stone-500">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-stone-900"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            {authError && <p className="text-sm text-red-600">{authError}</p>}
            <button
              type="submit"
              disabled={isAuthSubmitting}
              className="w-full bg-stone-900 text-white py-3 text-xs uppercase tracking-[0.2em] font-semibold hover:bg-black transition-colors disabled:opacity-60"
            >
              {isAuthSubmitting ? "Entrando..." : "Entrar no admin"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f3ee]">
      <header className="sticky top-0 z-30 bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-stone-700" />
            <div>
              <h1 className="text-sm sm:text-base font-semibold text-stone-900">
                Painel Administrativo TempleSale V2
              </h1>
              <p className="text-[11px] text-stone-500">{sessionEmail}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleRefresh()}
              className="inline-flex items-center gap-2 border border-stone-300 px-3 py-2 text-xs uppercase tracking-[0.15em] text-stone-700 hover:border-stone-800"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Atualizar
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 bg-stone-900 text-white px-3 py-2 text-xs uppercase tracking-[0.15em] hover:bg-black"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 border border-stone-200 bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
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
              Usuários
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
              Área de testes
            </button>
          </div>
        </div>

        {activeView === "users" ? (
          <>
            <div className="mb-6 border border-stone-200 bg-white p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-3">
                <Search className="w-4 h-4 text-stone-600" />
                <h2 className="text-sm font-semibold text-stone-900">
                  Usuários cadastrados ({users.length})
                </h2>
              </div>
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Filtrar por nome, email, cidade, país ou ID"
                className="w-full border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-stone-900"
              />
            </div>

            {usersError && (
              <div className="mb-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {usersError}
              </div>
            )}

            {isLoadingUsers ? (
              <div className="py-16 text-center text-sm text-stone-500">Carregando usuários...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-16 text-center text-sm text-stone-500">
                Nenhum usuário encontrado.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredUsers.map((user) => (
                  <article
                    key={user.id}
                    className="border border-stone-200 bg-white p-4 sm:p-5 flex flex-col gap-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-stone-900">
                          {user.username || user.email || `Usuário ${user.id}`}
                        </h3>
                        <p className="text-xs text-stone-600">{user.email || "-"}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.12em] px-2 py-1 border border-stone-300 text-stone-600">
                        ID {user.id}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-stone-600">
                      <span>Cidade: {user.city || "-"}</span>
                      <span>País: {user.country || "-"}</span>
                      <span>Criado em: {formatDate(user.createdAt)}</span>
                      <span>
                        Status:{" "}
                        <strong className={user.isBanned ? "text-red-700" : "text-emerald-700"}>
                          {user.isBanned ? "Banido" : "Ativo"}
                        </strong>
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void handleToggleBan(user)}
                        disabled={pendingBanUserId === user.id}
                        className="inline-flex items-center gap-2 border border-amber-300 px-3 py-2 text-xs uppercase tracking-[0.12em] text-amber-700 hover:bg-amber-50 disabled:opacity-60"
                      >
                        {user.isBanned ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <Ban className="w-3.5 h-3.5" />
                        )}
                        {pendingBanUserId === user.id
                          ? "Atualizando..."
                          : user.isBanned
                            ? "Desbanir"
                            : "Banir"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteUser(user)}
                        disabled={deletingUserId === user.id}
                        className="inline-flex items-center gap-2 border border-red-300 px-3 py-2 text-xs uppercase tracking-[0.12em] text-red-700 hover:bg-red-50 disabled:opacity-60"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {deletingUserId === user.id ? "Excluindo..." : "Excluir usuário"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        ) : (
          <section className="space-y-4">
            <article className="border border-stone-200 bg-white p-4 sm:p-5 space-y-4">
              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-stone-700 mt-0.5" />
                <div>
                  <h2 className="text-sm font-semibold text-stone-900">Área de Testes de Segurança</h2>
                  <p className="text-xs text-stone-500 mt-1">
                    Esta área executa diagnósticos não destrutivos para você validar sua ferramenta
                    de segurança. Nenhuma proteção nova é aplicada automaticamente.
                  </p>
                </div>
              </div>

              {!isTestAreaUnlocked ? (
                <form onSubmit={handleUnlockTestArea} className="space-y-3">
                  <label className="text-xs uppercase tracking-[0.12em] text-stone-500">
                    Senha da área de testes
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="password"
                      value={testAreaPassword}
                      onChange={(event) => setTestAreaPassword(event.target.value)}
                      className="w-full sm:max-w-sm border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-stone-900"
                      placeholder="Digite a senha da área de testes"
                      autoComplete="off"
                    />
                    <button
                      type="submit"
                      disabled={isUnlockingTestArea}
                      className="inline-flex items-center justify-center gap-2 border border-stone-900 bg-stone-900 text-white px-4 py-2.5 text-xs uppercase tracking-[0.14em] hover:bg-black disabled:opacity-60"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      {isUnlockingTestArea ? "Validando..." : "Entrar na área"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Área de testes desbloqueada.
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
                      {isRunningSecurityChecks ? "Executando..." : "Executar diagnósticos"}
                    </button>
                  </div>
                  {securityChecksRanAt !== null && (
                    <p className="text-xs text-stone-500">
                      Última execução: {formatDateTime(securityChecksRanAt)}
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
                      Monitor ao vivo da API
                    </h3>
                    <p className="text-xs text-stone-500 mt-1">
                      Exibe os movimentos recentes em <code>/api</code>, inclusive tentativas
                      suspeitas, sem aplicar bloqueios automáticos.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setIsLiveMonitorEnabled((current) => !current)}
                      className="inline-flex items-center gap-2 border border-stone-300 px-3 py-2 text-xs uppercase tracking-[0.12em] text-stone-700 hover:border-stone-800"
                    >
                      {isLiveMonitorEnabled ? "Pausar ao vivo" : "Retomar ao vivo"}
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
                      Atualizar eventos
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleClearSecurityEvents()}
                      disabled={isClearingSecurityEvents}
                      className="inline-flex items-center gap-2 border border-red-300 px-3 py-2 text-xs uppercase tracking-[0.12em] text-red-700 hover:bg-red-50 disabled:opacity-60"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {isClearingSecurityEvents ? "Limpando..." : "Limpar histórico"}
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
                      Atenção
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
                      Alerta
                    </p>
                    <p className="text-sm font-semibold">{securityEventsSummary.fail}</p>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500">
                  <span>
                    Histórico total em memória: <strong>{securityEventsTotalTracked}</strong>
                  </span>
                  {securityEventsUpdatedAt !== null && (
                    <span>Atualizado em: {formatDateTime(securityEventsUpdatedAt)}</span>
                  )}
                  <span>
                    Atualização automática:{" "}
                    <strong>{isLiveMonitorEnabled ? "ligada" : "pausada"}</strong>
                  </span>
                  <span>
                    Filtro ativo: <strong>{getSecurityFilterLabel(securityEventsFilter)}</strong>
                  </span>
                </div>

                {securityEventsError && (
                  <div className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {securityEventsError}
                  </div>
                )}

                {isLoadingSecurityEvents && securityEvents.length === 0 ? (
                  <div className="py-10 text-center text-sm text-stone-500">
                    Carregando eventos do monitor...
                  </div>
                ) : securityEvents.length === 0 ? (
                  <div className="py-10 text-center text-sm text-stone-500">
                    Nenhum movimento recente registrado no monitor.
                  </div>
                ) : filteredSecurityEvents.length === 0 ? (
                  <div className="py-10 text-center text-sm text-stone-500">
                    Não há eventos no filtro <strong>{getSecurityFilterLabel(securityEventsFilter)}</strong>.
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
                            Retorno HTTP: {event.status} ({explainHttpStatus(event.status)})
                          </span>
                          <span className="text-xs text-stone-500">{formatDateTime(event.createdAt)}</span>
                          <span className="text-xs text-stone-500">
                            Tempo de resposta: {event.durationMs} ms
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-stone-800">
                          {buildSecurityEventFriendlySummary(event)}
                        </p>
                        <p className="mt-2 text-xs text-stone-600 break-all">
                          Rota acessada: <span className="font-mono text-stone-700">{event.path}</span>
                        </p>
                        {formatSecurityEventNote(event.note) ? (
                          <p className="mt-2 text-xs text-stone-600">
                            {formatSecurityEventNote(event.note)}
                          </p>
                        ) : (
                          <p className="mt-2 text-xs text-stone-400">
                            Sem detalhe técnico adicional neste evento.
                          </p>
                        )}
                        <p className="mt-2 text-[11px] text-stone-500 break-all">
                          Origem (IP): {event.ip} | Área admin: {event.isAdminRoute ? "sim" : "não"} |
                          Login de usuário: {event.hasAuthToken ? "sim" : "não"} | Login de admin:{" "}
                          {event.hasAdminToken ? "sim" : "não"}
                        </p>
                        <p className="mt-1 text-[11px] text-stone-500 break-all">
                          Navegador/aplicativo da origem: {event.userAgent}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </article>
            )}

            {securityChecks.length > 0 && (
              <article className="border border-stone-200 bg-white p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-stone-900 mb-3">
                  Resultado dos diagnósticos ({securityChecks.length})
                </h3>
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
                        <div>
                          <p className="text-sm font-semibold">{check.title}</p>
                          <p className="text-xs mt-1">{check.details}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
