export const NEGOTIABLE_PRICE_STORAGE_VALUE = "NEGOTIABLE";

const NEGOTIABLE_PRICE_TOKENS = new Set([
  "a negociar",
  "negociavel",
  "preco negociavel",
  "price negotiable",
  "negotiable",
  "da negoziare",
  "prezzo negoziabile",
]);

function normalizeNegotiablePriceToken(rawValue: unknown): string {
  return String(rawValue ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ");
}

export function isNegotiablePriceValue(rawValue: unknown): boolean {
  const normalized = normalizeNegotiablePriceToken(rawValue);
  return normalized.length > 0 && NEGOTIABLE_PRICE_TOKENS.has(normalized);
}
