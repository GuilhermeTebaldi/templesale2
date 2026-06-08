export const AUTH0_DOMAIN = String(import.meta.env.VITE_AUTH0_DOMAIN ?? "").trim();
export const AUTH0_CLIENT_ID = String(import.meta.env.VITE_AUTH0_CLIENT_ID ?? "").trim();
export const AUTH0_AUDIENCE = String(import.meta.env.VITE_AUTH0_AUDIENCE ?? "").trim();

export const IS_AUTH0_CONFIGURED = Boolean(AUTH0_DOMAIN && AUTH0_CLIENT_ID);
export const AUTH0_DIAGNOSTIC_STORAGE_KEY = "templesale_auth0_diagnostic";

type Auth0DiagnosticPayload = Record<string, unknown>;

export function writeAuth0Diagnostic(step: string, payload: Auth0DiagnosticPayload = {}) {
  if (typeof window === "undefined") {
    return;
  }

  const entry = {
    step,
    at: new Date().toISOString(),
    href: window.location.href,
    ...payload,
  };

  try {
    window.sessionStorage.setItem(AUTH0_DIAGNOSTIC_STORAGE_KEY, JSON.stringify(entry));
  } catch {
    // Diagnostics must never block authentication.
  }

  console.info("[auth0-detect]", entry);
}

function resolveAuth0DebugLogs(): boolean {
  if (import.meta.env.DEV) {
    return true;
  }
  if (typeof window === "undefined") {
    return false;
  }

  const params = new URLSearchParams(window.location.search);
  const debugParam = params.get("auth0_debug");
  if (debugParam === "1") {
    window.localStorage.setItem("templesale_auth0_debug", "1");
  } else if (debugParam === "0") {
    window.localStorage.removeItem("templesale_auth0_debug");
  }

  return window.localStorage.getItem("templesale_auth0_debug") === "1";
}

export const AUTH0_DEBUG_LOGS = resolveAuth0DebugLogs();
