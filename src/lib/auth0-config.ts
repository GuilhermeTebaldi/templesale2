export const AUTH0_DOMAIN = String(import.meta.env.VITE_AUTH0_DOMAIN ?? "").trim();
export const AUTH0_CLIENT_ID = String(import.meta.env.VITE_AUTH0_CLIENT_ID ?? "").trim();
export const AUTH0_AUDIENCE = String(import.meta.env.VITE_AUTH0_AUDIENCE ?? "").trim();

export const IS_AUTH0_CONFIGURED = Boolean(AUTH0_DOMAIN && AUTH0_CLIENT_ID);
export const AUTH0_DEBUG_LOGS = Boolean(import.meta.env.DEV);
