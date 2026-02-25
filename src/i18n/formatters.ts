import { type AppLocale } from "./index";

export function formatRelativeTime(createdAt: number, locale: AppLocale): string {
  if (!Number.isFinite(createdAt) || createdAt <= 0) {
    return locale === "it-IT" ? "ora" : "agora";
  }

  const elapsedSeconds = Math.max(0, Math.floor(Date.now() / 1000) - Math.floor(createdAt));
  if (elapsedSeconds < 60) {
    return locale === "it-IT" ? "ora" : "agora";
  }

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) {
    return locale === "it-IT" ? `${elapsedMinutes} min fa` : `há ${elapsedMinutes} min`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return locale === "it-IT" ? `${elapsedHours} h fa` : `há ${elapsedHours} h`;
  }

  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays < 30) {
    return locale === "it-IT" ? `${elapsedDays} g fa` : `há ${elapsedDays} d`;
  }

  const elapsedMonths = Math.floor(elapsedDays / 30);
  if (elapsedMonths < 12) {
    return locale === "it-IT" ? `${elapsedMonths} m fa` : `há ${elapsedMonths} m`;
  }

  const elapsedYears = Math.floor(elapsedMonths / 12);
  return locale === "it-IT" ? `${elapsedYears} a fa` : `há ${elapsedYears} a`;
}

export function formatCollectionDate(date: Date, locale: AppLocale): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const prefix = locale === "it-IT" ? "Collezione" : "Coleção";
  return `${prefix} ${day} / ${month} / ${year}`;
}
