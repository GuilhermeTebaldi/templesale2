import { itITTranslations } from "./locales/it-IT";
import { ptBRTranslations } from "./locales/pt-BR";

export type AppLocale = "it-IT" | "pt-BR";

export const DEFAULT_LOCALE: AppLocale = "it-IT";
export const LOCALE_STORAGE_KEY = "templesale_locale";

export const dictionaries: Record<AppLocale, Record<string, string>> = {
  "it-IT": itITTranslations,
  "pt-BR": ptBRTranslations,
};

export const localeOptions: Array<{ value: AppLocale; label: string }> = [
  { value: "it-IT", label: "Italiano (Italia)" },
  { value: "pt-BR", label: "Português (Brasil)" },
];

export function getInitialLocale(): AppLocale {
  return DEFAULT_LOCALE;
}

export function interpolate(template: string, values?: Record<string, string | number>): string {
  if (!values) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const value = values[key];
    return value === undefined || value === null ? "" : String(value);
  });
}

export type TranslateFn = (text: string, values?: Record<string, string | number>) => string;

export function translate(
  locale: AppLocale,
  text: string,
  values?: Record<string, string | number>,
): string {
  const translated = dictionaries[locale][text] ?? text;
  return interpolate(translated, values);
}
