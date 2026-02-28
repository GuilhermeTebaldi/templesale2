import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import AdminPanelV2 from "./components/AdminPanelV2";
import GlobalLoadingOverlay from "./components/GlobalLoadingOverlay";
import "./index.css";
import { I18nProvider } from "./i18n/provider";

const pathname =
  typeof window !== "undefined" ? window.location.pathname.toLowerCase() : "/";
const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
const RootComponent = isAdminRoute ? AdminPanelV2 : App;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nProvider>
      <RootComponent />
      <GlobalLoadingOverlay />
    </I18nProvider>
  </StrictMode>,
);
