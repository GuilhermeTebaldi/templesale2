const DETAIL_KEY_ALIAS_MAP: Record<string, string> = {
  type: "type",
  property_type: "type",
  propertytype: "type",
  tipo: "type",
  tipo_imovel: "type",
  area: "area",
  surface_area: "area",
  surfacearea: "area",
  area_m2: "area",
  sqm: "area",
  m2: "area",
  metros: "area",
  room: "rooms",
  rooms: "rooms",
  bedrooms: "rooms",
  quarto: "rooms",
  quartos: "rooms",
  bathroom: "bathrooms",
  bathrooms: "bathrooms",
  banheiro: "bathrooms",
  banheiros: "bathrooms",
  garage: "parking",
  parking: "parking",
  vaga: "parking",
  vagas: "parking",
  brand: "brand",
  marca: "brand",
  model: "model",
  modelo: "model",
  color: "color",
  cor: "color",
  year: "year",
  ano: "year",
};

function simplifyDetailKey(rawKey: string): string {
  return String(rawKey ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function normalizeProductDetailKey(rawKey: string): string {
  const simplifiedKey = simplifyDetailKey(rawKey);
  if (!simplifiedKey) {
    return "";
  }
  return DETAIL_KEY_ALIAS_MAP[simplifiedKey] ?? simplifiedKey;
}

export function normalizeProductDetailsRecord(
  details: Record<string, unknown> | null | undefined,
): Record<string, string> {
  if (!details || typeof details !== "object") {
    return {};
  }

  const normalized: Record<string, string> = {};
  Object.entries(details).forEach(([rawKey, rawValue]) => {
    const key = normalizeProductDetailKey(rawKey);
    const value = String(rawValue ?? "").trim();
    if (!key || !value) {
      return;
    }
    normalized[key] = value;
  });

  return normalized;
}
