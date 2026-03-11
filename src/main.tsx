import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import AdminPanelV2 from "./components/AdminPanelV2";
import FrameStudio from "./components/FrameStudio";
import GlobalLoadingOverlay from "./components/GlobalLoadingOverlay";
import "./index.css";
import { I18nProvider } from "./i18n/provider";

const VISITOR_PING_HEARTBEAT_INTERVAL_MS = 60 * 60 * 1000;
const VISITOR_PING_API_BASE = String(import.meta.env.VITE_API_BASE_URL ?? "")
  .trim()
  .replace(/\/+$/, "");

function buildVisitorPingUrl(): string {
  return VISITOR_PING_API_BASE ? `${VISITOR_PING_API_BASE}/api/visitor/ping` : "/api/visitor/ping";
}

function sendVisitorPing(source: "entry" | "heartbeat" | "pagehide") {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const payload = {
    source,
    path: window.location.pathname || "/",
    referrer: document.referrer || "",
    sentAt: Date.now(),
  };
  const body = JSON.stringify(payload);
  const url = buildVisitorPingUrl();

  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      const sent = navigator.sendBeacon(url, blob);
      if (sent) {
        return;
      }
    }
  } catch {
    // Fallback to fetch when sendBeacon is unavailable or fails.
  }

  void fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
    credentials: "omit",
    cache: "no-store",
  }).catch(() => {
    // Ignore network errors: tracking must not block app rendering.
  });
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  sendVisitorPing("entry");
  window.setInterval(() => {
    sendVisitorPing("heartbeat");
  }, VISITOR_PING_HEARTBEAT_INTERVAL_MS);
  window.addEventListener("pagehide", () => {
    sendVisitorPing("pagehide");
  });
}

const pathname =
  typeof window !== "undefined" ? window.location.pathname.toLowerCase() : "/";
const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
const isFrameStudioRoute = pathname === "/moldura" || pathname.startsWith("/moldura/");
const RootComponent = isAdminRoute ? AdminPanelV2 : isFrameStudioRoute ? FrameStudio : App;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nProvider>
      <RootComponent />
      <GlobalLoadingOverlay />
    </I18nProvider>
  </StrictMode>,
);
