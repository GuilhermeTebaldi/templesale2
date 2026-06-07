import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { motion } from "motion/react";
import { X, ArrowRight, Mail } from "lucide-react";
import { useI18n } from "../i18n/provider";
import { AUTH0_AUDIENCE, AUTH0_DEBUG_LOGS, IS_AUTH0_CONFIGURED } from "../lib/auth0-config";

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
  const [mode, setMode] = React.useState<AuthMode>(defaultMode);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const isLogin = mode === "login";

  const handleAuth0Redirect = async () => {
    setErrorMessage("");
    if (!IS_AUTH0_CONFIGURED) {
      setErrorMessage("Auth0 não está configurado. Defina VITE_AUTH0_DOMAIN e VITE_AUTH0_CLIENT_ID.");
      return;
    }

    try {
      setIsSubmitting(true);
      if (AUTH0_DEBUG_LOGS) {
        console.info("[auth0] loginWithRedirect", {
          mode,
          audience: AUTH0_AUDIENCE || "(none)",
        });
      }
      await loginWithRedirect({
        authorizationParams: {
          redirect_uri: window.location.origin,
          ...(AUTH0_AUDIENCE ? { audience: AUTH0_AUDIENCE } : {}),
          screen_hint: isLogin ? "login" : "signup",
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("Falha ao autenticar.");
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-200 bg-[#fdfcfb] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex justify-end mb-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-50 rounded-full transition-colors"
            aria-label={t("Fechar cadastro")}
          >
            <X className="w-5 h-5 text-stone-600" />
          </button>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif tracking-[0.2em] uppercase mb-4">Templesale</h1>
          <p className="text-xs uppercase tracking-[0.3em] text-stone-400 font-medium">
            {isLogin ? t("Entrar na Conta") : t("Criar Conta")}
          </p>
        </div>

        <div className="space-y-6">
          <div className="border border-stone-200 bg-white/70 p-5 text-center">
            <Mail className="mx-auto mb-3 h-5 w-5 text-stone-500" />
            <p className="text-sm leading-relaxed text-stone-600">
              {isLogin
                ? "Entre com sua conta TempleSale pelo Auth0."
                : "Crie sua conta TempleSale com Auth0. Se o email já existir, sua conta antiga será vinculada automaticamente."}
            </p>
          </div>

          {errorMessage && (
            <p className="text-xs text-red-500">{errorMessage}</p>
          )}

          <button 
            disabled={isSubmitting || isLoading}
            type="button"
            onClick={() => void handleAuth0Redirect()}
            className="w-full bg-stone-900 text-white py-6 text-xs uppercase tracking-[0.3em] font-bold flex items-center justify-center gap-3 hover:bg-black transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting || isLoading
              ? t("Processando...")
              : isLogin
                ? t("Entrar")
                : t("Criar conta")}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-12 text-center">
          <button 
            onClick={() => setMode(isLogin ? "register" : "login")}
            className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 hover:text-stone-800 transition-colors"
          >
            {isLogin ? t("Ainda não tem conta? Cadastre-se") : t("Já tem conta? Entrar")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
