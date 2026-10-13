import React from "react";
import { type AppLocale, getInitialLocale, LOCALE_STORAGE_KEY, translate, type TranslateFn } from "./index";

interface I18nContextValue {
  locale: AppLocale;
  t: TranslateFn;
}

const I18nContext = React.createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale: AppLocale = getInitialLocale();

  const t = React.useCallback<TranslateFn>(
    (text, values) => translate(locale, text, values),
    [locale],
  );

  const value = React.useMemo<I18nContextValue>(
    () => ({ locale, t }),
    [locale, t],
  );

  React.useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    document.documentElement.lang = 'it';
    document.documentElement.translate = true;
    document.documentElement.dir = "ltr";
    try {window.localStorage.setItem(LOCALE_STORAGE_KEY,locale);} catch { /* Italian does not require storage. */ }
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = React.useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n deve essere usato in I18nProvider");
  }
  return context;
}
