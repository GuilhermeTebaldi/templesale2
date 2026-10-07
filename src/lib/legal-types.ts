export type LegalLocale = "pt-BR" | "it-IT";
export type LegalDocument = {
  version: string;
  locale: LegalLocale;
  title: string;
  operator: { name: string; address: string; country: string; taxId: string; email: string };
  terms: { title: string; body: string }[];
  privacy: { title: string; body: string }[];
};
export type LegalReceipt = {
  id: string;
  userId: number;
  auth0Subject: string;
  email: string;
  representative: string;
  company: string;
  acceptedAt: string;
  version: string;
  locale: LegalLocale;
  documentHash: string;
  document: LegalDocument;
};
export type LegalStatus = {
  enabled: boolean;
  ready: boolean;
  accepted: boolean;
  document: LegalDocument;
  documentHash: string;
  receipts: LegalReceipt[];
};
