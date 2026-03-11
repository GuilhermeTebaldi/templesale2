import { type AppLocale } from "./index";

export function formatRelativeTime(createdAt: number, locale: AppLocale): string {
  const formatElapsed = (
    value: number,
    unit: "minutes" | "hours" | "days" | "months" | "years",
  ): string => {
    if (locale === "it-IT") {
      const unitLabel =
        unit === "minutes"
          ? "min"
          : unit === "hours"
            ? "h"
            : unit === "days"
              ? "g"
              : unit === "months"
                ? "m"
                : "a";
      return `${value} ${unitLabel} fa`;
    }

    if (locale === "ar-SA") {
      const unitLabel =
        unit === "minutes"
          ? "دقيقة"
          : unit === "hours"
            ? "ساعة"
            : unit === "days"
              ? "يوم"
              : unit === "months"
                ? "شهر"
                : "سنة";
      return `قبل ${value} ${unitLabel}`;
    }

    const unitLabel =
      unit === "minutes"
        ? "min"
        : unit === "hours"
          ? "h"
          : unit === "days"
            ? "d"
            : unit === "months"
              ? "m"
              : "a";
    return `há ${value} ${unitLabel}`;
  };

  if (!Number.isFinite(createdAt) || createdAt <= 0) {
    return locale === "it-IT" ? "ora" : locale === "ar-SA" ? "الآن" : "agora";
  }

  const elapsedSeconds = Math.max(0, Math.floor(Date.now() / 1000) - Math.floor(createdAt));
  if (elapsedSeconds < 60) {
    return locale === "it-IT" ? "ora" : locale === "ar-SA" ? "الآن" : "agora";
  }

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) {
    return formatElapsed(elapsedMinutes, "minutes");
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return formatElapsed(elapsedHours, "hours");
  }

  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays < 30) {
    return formatElapsed(elapsedDays, "days");
  }

  const elapsedMonths = Math.floor(elapsedDays / 30);
  if (elapsedMonths < 12) {
    return formatElapsed(elapsedMonths, "months");
  }

  const elapsedYears = Math.floor(elapsedMonths / 12);
  return formatElapsed(elapsedYears, "years");
}

export function formatCollectionDate(date: Date, locale: AppLocale): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const prefix = locale === "it-IT" ? "Collezione" : locale === "ar-SA" ? "مجموعة" : "Coleção";
  return `${prefix} ${day} / ${month} / ${year}`;
}
