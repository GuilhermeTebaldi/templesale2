export type WhatsappCountryIso = "IT";

type WhatsappCountryConfig = {
  iso: WhatsappCountryIso;
  name: string;
  dialCode: string;
  dialDigits: string;
};

const WHATSAPP_COUNTRY_CONFIG: Record<WhatsappCountryIso, WhatsappCountryConfig> = {
  IT: {
    iso: "IT",
    name: "Italia",
    dialCode: "+39",
    dialDigits: "39",
  },
};

function countryIsoToFlag(iso: string): string {
  const upperIso = iso.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upperIso)) {
    return "";
  }
  const codePoints = [...upperIso].map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export function getWhatsappCountry(countryIso?: string): WhatsappCountryConfig {
  if (!countryIso) {
    return WHATSAPP_COUNTRY_CONFIG.IT;
  }
  const normalized = countryIso.trim().toUpperCase() as WhatsappCountryIso;
  return WHATSAPP_COUNTRY_CONFIG[normalized] ?? WHATSAPP_COUNTRY_CONFIG.IT;
}

export function normalizeWhatsappLocalNumber(rawNumber: string, countryIso?: string): string {
  let digits = rawNumber.replace(/\D/g, "");
  if (!digits) {
    return "";
  }

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  const country = getWhatsappCountry(countryIso);
  if (digits.startsWith(country.dialDigits) && digits.length > country.dialDigits.length + 5) {
    digits = digits.slice(country.dialDigits.length);
  }

  return digits;
}

export function buildWhatsappUrl(
  countryIso: string | undefined,
  rawNumber: string | undefined,
  productName: string,
): string | null {
  const country = getWhatsappCountry(countryIso);
  const localNumber = normalizeWhatsappLocalNumber(rawNumber ?? "", country.iso);
  if (!localNumber) {
    return null;
  }

  const fullNumber = `${country.dialDigits}${localNumber}`;
  const text = `Ola! Tenho interesse no produto "${productName}".`;
  return `https://wa.me/${fullNumber}?text=${encodeURIComponent(text)}`;
}

export function formatWhatsappDisplay(
  countryIso: string | undefined,
  rawNumber: string | undefined,
): string {
  const country = getWhatsappCountry(countryIso);
  const flag = countryIsoToFlag(country.iso);
  const localNumber = normalizeWhatsappLocalNumber(rawNumber ?? "", country.iso);
  if (!localNumber) {
    return `${flag} ${country.name} (${country.dialCode})`.trim();
  }
  return `${flag} ${country.dialCode} ${localNumber}`.trim();
}

export function getWhatsappCountryLabel(countryIso: string | undefined): string {
  const country = getWhatsappCountry(countryIso);
  const flag = countryIsoToFlag(country.iso);
  return `${flag} ${country.name} (${country.dialCode})`.trim();
}
