export function parsePriceToNumber(rawValue: string): number | null {
  const value = String(rawValue ?? "").trim();
  if (!value) {
    return null;
  }

  const cleaned = value.replace(/[^\d,.-]/g, "");
  if (!cleaned) {
    return null;
  }

  const commaCount = (cleaned.match(/,/g) ?? []).length;
  const dotCount = (cleaned.match(/\./g) ?? []).length;

  let normalized = cleaned;

  if (commaCount > 0 && dotCount > 0) {
    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");
    const decimalSeparator = lastComma > lastDot ? "," : ".";

    if (decimalSeparator === ",") {
      normalized = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = cleaned.replace(/,/g, "");
    }
  } else if (commaCount > 0) {
    const lastComma = cleaned.lastIndexOf(",");
    const fractionLength = cleaned.length - lastComma - 1;
    normalized =
      fractionLength > 0 && fractionLength <= 2
        ? cleaned.replace(/\./g, "").replace(",", ".")
        : cleaned.replace(/,/g, "");
  } else if (dotCount > 0) {
    const lastDot = cleaned.lastIndexOf(".");
    const fractionLength = cleaned.length - lastDot - 1;
    normalized =
      fractionLength > 0 && fractionLength <= 2
        ? cleaned.replace(/,/g, "")
        : cleaned.replace(/\./g, "");
  }

  const parsed = Number(normalized);
  if (Number.isFinite(parsed)) {
    return parsed;
  }

  const digits = value.replace(/\D/g, "");
  if (!digits) {
    return null;
  }

  const fallback = Number(digits) / 100;
  return Number.isFinite(fallback) ? fallback : null;
}

export function formatEuro(value: number, locale: "pt-BR" | "it-IT" = "it-IT"): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeValue);
}

export function formatEuroFromUnknown(
  rawValue: string | number | undefined,
  locale: "pt-BR" | "it-IT" = "it-IT",
): string {
  if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
    return formatEuro(rawValue, locale);
  }

  const parsed = parsePriceToNumber(String(rawValue ?? ""));
  if (parsed === null) {
    return formatEuro(0, locale);
  }

  return formatEuro(parsed, locale);
}

export function normalizeEuroInput(
  rawValue: string,
  locale: "pt-BR" | "it-IT" = "it-IT",
): string {
  const parsed = parsePriceToNumber(rawValue);
  if (parsed === null) {
    return "";
  }
  return formatEuro(parsed, locale);
}
