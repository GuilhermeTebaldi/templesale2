import { randomUUID } from "node:crypto";
import type { Express, Request, RequestHandler } from "express";
import { buildLegalDocument, hashLegalDocument, legalPublicationReady } from "./legal-document";
import type { LegalLocale, LegalReceipt } from "../src/lib/legal-types";

type Query = (sql: string, values?: unknown[]) => Promise<Record<string, any>[]>;
type User = { id: number; email: string };
type Identity = { sub?: string; email?: string; email_verified?: boolean };
export type LegalService = ReturnType<typeof createLegalService>;

export function legalAccountGate(service: LegalService, session: (req: Request) => Promise<User | null>): RequestHandler {
  return async (req, res, next) => {
    if (!service.enabled || ["GET", "HEAD", "OPTIONS"].includes(req.method) ||
      req.path.startsWith("/auth/") || req.path.startsWith("/legal/") || req.path.startsWith("/admin/")) {
      next(); return;
    }
    try {
      const user = await session(req);
      if (user && !(await service.accepted(user.id))) {
        res.status(403).json({ error: "Aceite os termos para utilizar sua conta.", code: "TERMS_REQUIRED" }); return;
      }
      next();
    } catch {
      res.status(503).json({ error: "Não foi possível verificar o aceite." });
    }
  };
}

export function createLegalService(query: Query, env: Record<string, string | undefined> = process.env) {
  const enabled = env.LEGAL_TERMS_ENABLED === "true";
  const ready = legalPublicationReady(env);
  if (enabled && !ready) throw new Error("Dados legais obrigatórios ausentes. Complete a configuração antes de ativar os termos.");
  const documents = { "pt-BR": buildLegalDocument("pt-BR", env), "it-IT": buildLegalDocument("it-IT", env) };
  const documentFor = (locale: LegalLocale) => documents[locale];
  const receiptFrom = (row: Record<string, any>): LegalReceipt => ({
    ...JSON.parse(row.receipt_json), userId: Number(row.user_id),
  });
  const receiptsFor = async (userId: number): Promise<LegalReceipt[]> =>
    (await query("SELECT user_id, receipt_json FROM legal_acceptances WHERE user_id = $1 ORDER BY accepted_at DESC", [userId])).map(receiptFrom);
  const accepted = async (userId: number) => !enabled || (await query(
    "SELECT id FROM legal_acceptances WHERE user_id = $1 AND document_hash IN ($2, $3) LIMIT 1",
    [userId, hashLegalDocument(documents["pt-BR"]), hashLegalDocument(documents["it-IT"])],
  )).length > 0;
  return {
    enabled, ready, documentFor, accepted,
    async initialize() {
      if (!enabled) return;
      await query(`CREATE TABLE IF NOT EXISTS legal_acceptances (
        id TEXT PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id),
        document_version TEXT NOT NULL, document_hash TEXT NOT NULL,
        accepted_at TEXT NOT NULL, receipt_json TEXT NOT NULL,
        UNIQUE(user_id, document_hash)
      )`);
      await query("CREATE INDEX IF NOT EXISTS idx_legal_acceptances_user ON legal_acceptances(user_id)");
    },
    async status(userId: number, locale: LegalLocale) {
      const document = documentFor(locale);
      return { enabled, ready, accepted: await accepted(userId), document, documentHash: hashLegalDocument(document),
        receipts: enabled ? await receiptsFor(userId) : [] };
    },
    async accept(user: User, identity: Identity, expectedSub: string | null, input: Record<string, unknown>) {
      if (!enabled || !ready) throw new Error("O documento ainda não está disponível para aceite.");
      if (!expectedSub || identity.sub !== expectedSub || identity.email_verified !== true ||
        String(identity.email ?? "").trim().toLowerCase() !== user.email.trim().toLowerCase()) {
        throw new Error("Confirme seu e-mail no Auth0 e entre novamente antes de aceitar.");
      }
      const locale: LegalLocale = input.locale === "it-IT" ? "it-IT" : "pt-BR";
      const document = documentFor(locale);
      const documentHash = hashLegalDocument(document);
      if (input.version !== document.version || input.documentHash !== documentHash) {
        throw new Error("Os termos foram atualizados. Reabra o documento e revise a nova versão.");
      }
      const representative = typeof input.representative === "string" ? input.representative.trim() : "";
      const company = typeof input.company === "string" ? input.company.trim() : "";
      if (input.agreed !== true || input.authorized !== true || representative.length < 3 || representative.length > 160 ||
        company.length < 2 || company.length > 200 || /[\x00-\x1f]/.test(representative + company)) {
        throw new Error("Informe seu nome completo, a empresa e confirme a declaração de representação.");
      }
      const receipt: LegalReceipt = {
        id: randomUUID(), userId: user.id, auth0Subject: expectedSub, email: user.email, representative, company,
        acceptedAt: new Date().toISOString(), version: document.version, locale, documentHash, document,
      };
      await query(`INSERT INTO legal_acceptances (id, user_id, document_version, document_hash, accepted_at, receipt_json)
        VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (user_id, document_hash) DO NOTHING`,
        [receipt.id, user.id, document.version, documentHash, receipt.acceptedAt, JSON.stringify(receipt)]);
      return (await receiptsFor(user.id)).find(item => item.documentHash === documentHash)!;
    },
  };
}

export function registerLegalRoutes(app: Express, service: LegalService, dependencies: {
  session: (req: Request) => Promise<User | null>;
  verifyIdentity: (token: string) => Promise<Identity>;
  subjectForUser: (id: number) => Promise<string | null>;
}) {
  app.get("/api/legal/status", async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    try {
      const user = await dependencies.session(req);
      const locale = req.query.locale === "it-IT" ? "it-IT" : "pt-BR";
      if (!user) {
        const document = service.documentFor(locale);
        res.json({ enabled: service.enabled, ready: service.ready, accepted: false, document,
          documentHash: hashLegalDocument(document), receipts: [] });
        return;
      }
      res.json(await service.status(user.id, locale));
    } catch {
      res.status(503).json({ error: "Não foi possível consultar o aceite. Tente novamente." });
    }
  });
  app.post("/api/legal/accept", async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    try {
      const user = await dependencies.session(req);
      if (!user) { res.status(401).json({ error: "Entre na sua conta para aceitar." }); return; }
      const token = req.headers["x-auth0-id-token"];
      if (typeof token !== "string" || !token.trim()) {
        res.status(403).json({ error: "Entre novamente para confirmar seu e-mail." }); return;
      }
      const identity = await dependencies.verifyIdentity(token);
      const receipt = await service.accept(user, identity, await dependencies.subjectForUser(user.id), req.body ?? {});
      res.json({ receipt });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Não foi possível confirmar o aceite." });
    }
  });
}
