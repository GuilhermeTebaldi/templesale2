import React from "react";
import { LoaderCircle, Shield, RefreshCw, LogOut, Search, Trash2, Ban, CheckCircle2 } from "lucide-react";

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

export default function AdminPanelV2() {
  const [isBootstrapping, setIsBootstrapping] = React.useState(true);
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
  }, [loadUsers]);

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
    }
  };

  const handleRefresh = async () => {
    if (!sessionEmail) {
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
      </main>
    </div>
  );
}

