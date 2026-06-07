const DEFAULT_AUTH0_DOMAIN = "dev-qsrhlowiffrnw0dr.eu.auth0.com";
const DEFAULT_AUTH0_CLIENT_ID = "5xH2LHeLMD5wRryzbt3SNGVbarv8C22D";
const DEFAULT_AUTH0_AUDIENCE = "https://templesale-api";

export const AUTH0_DOMAIN = String(
  import.meta.env.VITE_AUTH0_DOMAIN ?? DEFAULT_AUTH0_DOMAIN,
).trim();
export const AUTH0_CLIENT_ID = String(
  import.meta.env.VITE_AUTH0_CLIENT_ID ?? DEFAULT_AUTH0_CLIENT_ID,
).trim();
export const AUTH0_AUDIENCE = String(
  import.meta.env.VITE_AUTH0_AUDIENCE ?? DEFAULT_AUTH0_AUDIENCE,
).trim();

export const IS_AUTH0_CONFIGURED = Boolean(AUTH0_DOMAIN && AUTH0_CLIENT_ID);

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
