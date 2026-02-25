import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import AdminPanel from "./components/AdminPanel";
import "./index.css";
import { I18nProvider } from "./i18n/provider";

const pathname =
  typeof window !== "undefined" ? window.location.pathname.toLowerCase() : "/";
const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
const RootComponent = isAdminRoute ? AdminPanel : App;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nProvider>
      <RootComponent />
    </I18nProvider>
  </StrictMode>,
);
