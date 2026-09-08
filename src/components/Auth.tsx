import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { useI18n } from "../i18n/provider";
import {
  AUTH0_AUDIENCE,
  AUTH0_CLIENT_ID,
  AUTH0_DOMAIN,
  IS_AUTH0_CONFIGURED,
  writeAuth0Diagnostic,
} from "../lib/auth0-config";

export type AuthMode = "login" | "register";

export interface AuthSubmitPayload {
  mode: AuthMode;
  name: string;
  email: string;
  password: string;
}

interface AuthProps {
  onSubmit: (payload: AuthSubmitPayload) => Promise<void>;
  onClose: () => void;
  defaultMode?: AuthMode;
}

export default function Auth({ onClose, defaultMode = "register" }: AuthProps) {
  const { t } = useI18n();
  const { loginWithRedirect, isLoading } = useAuth0();
  const [mode] = React.useState<AuthMode>(defaultMode);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleAuth0Redirect = async (event?: React.MouseEvent<HTMLButtonElement>) => {
    event?.preventDefault();
    event?.stopPropagation();
    setErrorMessage("");
    console.info("[auth0-login] clicked");
    writeAuth0Diagnostic("button-clicked", {
      hasDomain: Boolean(AUTH0_DOMAIN),
      hasClientId: Boolean(AUTH0_CLIENT_ID),
      clientId: AUTH0_CLIENT_ID,
      hasAudience: Boolean(AUTH0_AUDIENCE),
      isAuth0Loading: isLoading,
      mode,
      redirect_uri: window.location.origin,
    });
    if (!IS_AUTH0_CONFIGURED) {
      const message = "Auth0 não está configurado. Defina VITE_AUTH0_DOMAIN e VITE_AUTH0_CLIENT_ID.";
      console.error("[auth0-login] missing config", {
        hasDomain: Boolean(AUTH0_DOMAIN),
        hasClientId: Boolean(AUTH0_CLIENT_ID),
        hasAudience: Boolean(AUTH0_AUDIENCE),
        redirect_uri: window.location.origin,
      });
      setErrorMessage(message);
      return;
    }

    try {
      setIsSubmitting(true);
      writeAuth0Diagnostic("calling-loginWithRedirect", {
        domain: AUTH0_DOMAIN,
        clientId: AUTH0_CLIENT_ID,
        audience: AUTH0_AUDIENCE || "(none)",
        redirect_uri: window.location.origin,
      });
      console.info("[auth0-login] config", {
        hasDomain: true,
        hasClientId: true,
        hasAudience: Boolean(AUTH0_AUDIENCE),
        redirect_uri: window.location.origin,
      });
      console.info("[auth0-login] calling loginWithRedirect");
      await loginWithRedirect({
        authorizationParams: {
          redirect_uri: window.location.origin,
          ...(AUTH0_AUDIENCE ? { audience: AUTH0_AUDIENCE } : {}),
        },
      });
      writeAuth0Diagnostic("loginWithRedirect-returned-without-navigation", {
        message: "Auth0 SDK returned control to the app instead of leaving the current page.",
      });
      console.warn("[auth0-login] loginWithRedirect returned without navigation");
    } catch (error) {
      console.error("[auth0-login] loginWithRedirect failed", error);
      writeAuth0Diagnostic("loginWithRedirect-failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      const message =
        error instanceof Error ? error.message : t("Falha ao autenticar.");
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center bg-neutral-950 p-6 text-neutral-100">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex justify-end mb-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-full transition-colors"
            aria-label={t("Fechar cadastro")}
          >
            <X className="w-5 h-5 text-neutral-300" />
          </button>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-serif tracking-[0.2em] uppercase mb-4 text-neutral-50">
            <span className="text-amber-400">Temple</span>
            <span className="text-emerald-400">Sale</span>
          </h1>
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-400 font-medium">
            {t("Acessar Conta")}
          </p>
        </div>

        <div className="space-y-6">
          <p className="text-center text-sm leading-relaxed text-neutral-300">
            Entre com sua conta Google. Se for seu primeiro acesso, a conta TempleSale sera criada automaticamente.
          </p>

          {errorMessage && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">{errorMessage}</p>
          )}

          <button 
            disabled={isSubmitting || isLoading}
            type="button"
            onClick={(event) => void handleAuth0Redirect(event)}
            className="w-full border border-neutral-700 bg-neutral-100 px-5 py-5 text-sm font-semibold text-neutral-950 flex items-center justify-center gap-3 shadow-sm hover:bg-white hover:border-neutral-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-neutral-300 bg-white text-base font-bold text-[#4285f4]">
              G
            </span>
            {isSubmitting || isLoading
              ? t("Processando...")
              : t("Continuar com Google")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
