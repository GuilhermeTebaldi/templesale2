import React from "react";
import { motion } from "motion/react";
import { X, ArrowRight, Mail, Lock, User } from "lucide-react";

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

export default function Auth({ onSubmit, onClose, defaultMode = "register" }: AuthProps) {
  const [mode, setMode] = React.useState<AuthMode>(defaultMode);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
    name: "",
  });

  const isLogin = mode === "login";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = formData.email.trim();
    const password = formData.password.trim();
    const name = formData.name.trim();

    if (!email || !password) {
      setErrorMessage("Preencha email e senha.");
      return;
    }

    if (!isLogin && !name) {
      setErrorMessage("Preencha seu nome para criar a conta.");
      return;
    }

    setErrorMessage("");
    try {
      setIsSubmitting(true);
      await onSubmit({
        mode,
        name,
        email,
        password,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha ao autenticar.";
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
            aria-label="Fechar cadastro"
          >
            <X className="w-5 h-5 text-stone-600" />
          </button>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif tracking-[0.2em] uppercase mb-4">Templesale</h1>
          <p className="text-xs uppercase tracking-[0.3em] text-stone-400 font-medium">
            {isLogin ? "Entrar na Conta" : "Criar Conta"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">Full Name</label>
              <div className="relative">
                <User className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                <input 
                  required
                  type="text"
                  placeholder="Seu nome"
                  className="w-full bg-transparent border-b border-stone-200 py-3 pl-8 outline-none focus:border-stone-800 transition-colors font-serif italic text-lg"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
              <input 
                required
                type="email"
                placeholder="voce@email.com"
                className="w-full bg-transparent border-b border-stone-200 py-3 pl-8 outline-none focus:border-stone-800 transition-colors font-serif italic text-lg"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">Password</label>
            <div className="relative">
              <Lock className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                <input 
                  required
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-transparent border-b border-stone-200 py-3 pl-8 outline-none focus:border-stone-800 transition-colors font-serif italic text-lg"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

          {errorMessage && (
            <p className="text-xs text-red-500">{errorMessage}</p>
          )}

          <button 
            disabled={isSubmitting}
            type="submit"
            className="w-full bg-stone-900 text-white py-6 text-xs uppercase tracking-[0.3em] font-bold flex items-center justify-center gap-3 hover:bg-black transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? "Processando..."
              : isLogin
                ? "Entrar"
                : "Criar Conta"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-12 text-center">
          <button 
            onClick={() => setMode(isLogin ? "register" : "login")}
            className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 hover:text-stone-800 transition-colors"
          >
            {isLogin ? "Ainda não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
