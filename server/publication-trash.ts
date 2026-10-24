import type { Express, Request, Response } from 'express';

type Row = Record<string, any>;
type Query = (sql: string, values?: unknown[]) => Promise<Row[]>;
type Transaction = (statements: { sql: string; values: unknown[] }[]) => Promise<void>;

export async function initializePublicationLegacyRemovals(query: Query) {
  await query(`CREATE TABLE IF NOT EXISTS publication_legacy_removals (
    legacy_product_id BIGINT PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE
  )`);
}

// Keep the publication and all of its interactions. The private ledger remains
// after restoration so owners can always find previously removed photos here.
export function createPublicationTrashService(query: Query, transaction: Transaction, homeReady: () => boolean) {
  let ready = false;
  let readOnly = false;
  return {
    get ready() { return ready; },
    async initialize(remoteReadOnly = false) {
      readOnly = remoteReadOnly;
      if (readOnly) {
        try { await query('SELECT publication_id FROM publication_trash LIMIT 0'); ready = true; } catch { ready = false; }
        return;
      }
      await query(`CREATE TABLE IF NOT EXISTS publication_trash (
        publication_id BIGINT PRIMARY KEY REFERENCES establishment_publications(id) ON DELETE CASCADE,
        hidden INTEGER NOT NULL DEFAULT 1 CHECK (hidden IN (0, 1)), removed_at TEXT NOT NULL
      )`);
      ready = true;
    },
    async list(ownerId: number, limit: number, offset: number) {
      if (!ready) throw new Error('Eliminati non disponibili. Riprova più tardi.');
      return query(`SELECT ep.*, pt.hidden AS trash_hidden, e.name AS establishment_name,
        e.slug AS establishment_slug, e.category AS establishment_category, e.city AS establishment_city,
        e.logo_url AS establishment_logo_url,
        (SELECT COUNT(*) FROM publication_likes pl WHERE pl.publication_id = ep.id) AS likes_count
        FROM publication_trash pt JOIN establishment_publications ep ON ep.id = pt.publication_id
        JOIN establishments e ON e.id = ep.establishment_id
        WHERE ep.owner_user_id = $1 ORDER BY pt.removed_at DESC, ep.id DESC LIMIT $2 OFFSET $3`,
      [ownerId, limit, offset]);
    },
    async remove(publicationId: number, ownerId: number) {
      if (!ready || readOnly) throw new Error('Eliminazione non disponibile in questo ambiente.');
      if (!(await query('SELECT id FROM establishment_publications WHERE id = $1 AND owner_user_id = $2', [publicationId, ownerId])).length) return false;
      await transaction([
        { sql: `INSERT INTO publication_trash(publication_id, hidden, removed_at)
          SELECT id, 1, $3 FROM establishment_publications WHERE id = $1 AND owner_user_id = $2
          ON CONFLICT(publication_id) DO UPDATE SET hidden = 1, removed_at = excluded.removed_at`,
          values: [publicationId, ownerId, new Date().toISOString()] },
        ...(homeReady() ? [{ sql: `DELETE FROM establishment_home_publications WHERE publication_id = $1
          AND EXISTS (SELECT 1 FROM establishment_publications ep WHERE ep.id = $1 AND ep.owner_user_id = $2)`, values: [publicationId, ownerId] }] : []),
      ]);
      return true;
    },
    async restore(publicationId: number, ownerId: number) {
      if (!ready || readOnly) throw new Error('Ripristino non disponibile in questo ambiente.');
      const rows = await query(`UPDATE publication_trash SET hidden = 0 WHERE publication_id = $1
        AND EXISTS (SELECT 1 FROM establishment_publications ep WHERE ep.id = $1 AND ep.owner_user_id = $2)
        RETURNING publication_id`, [publicationId, ownerId]);
      return rows.length > 0;
    },
    async purge(publicationId: number, ownerId: number) {
      if (!ready || readOnly) throw new Error('Eliminazione definitiva non disponibile in questo ambiente.');
      const owned = `SELECT ep.id FROM establishment_publications ep
        JOIN publication_trash pt ON pt.publication_id = ep.id WHERE ep.id = $1 AND ep.owner_user_id = $2`;
      if (!(await query(owned, [publicationId, ownerId])).length) return false;
      await transaction([
        // A legacy product must not recreate a permanently removed photo at startup.
        { sql: `INSERT INTO publication_legacy_removals(legacy_product_id)
          SELECT legacy_product_id FROM establishment_publications WHERE id IN (${owned}) AND legacy_product_id IS NOT NULL
          ON CONFLICT(legacy_product_id) DO NOTHING`, values: [publicationId, ownerId] },
        { sql: `DELETE FROM establishment_publications WHERE id IN (${owned})`, values: [publicationId, ownerId] },
      ]);
      return true;
    },
  };
}

export function registerPublicationTrashRoutes(app: Express, { publicationTrash, requireAuth, normalizePublicationRow, selectPublicationByIdRecord }: {
  publicationTrash: ReturnType<typeof createPublicationTrashService>;
  requireAuth: (req: Request, res: Response) => Promise<{ id: number } | null>;
  normalizePublicationRow: (row: Row) => object;
  selectPublicationByIdRecord: (id: number) => Promise<object | null>;
}) {
  app.get("/api/publication-trash", async (req, res) => {
    const user = await requireAuth(req, res);
    if (!user) return;
    const limit = 60;
    const offset = Math.max(0, Math.floor(Number(req.query.offset) || 0));
    try {
      const rows = await publicationTrash.list(user.id, limit + 1, offset);
      res.setHeader('Cache-Control', 'no-store');
      res.json({ publications: rows.slice(0, limit).map(row => ({ ...normalizePublicationRow(row), isTrashed: Number(row.trash_hidden) === 1 })),
        hasMore: rows.length > limit, nextOffset: offset + Math.min(rows.length, limit) });
    } catch { res.status(503).json({ error: 'Impossibile caricare gli eliminati. Riprova.' }); }
  });

  app.post("/api/publications/:id/restore", async (req, res) => {
    const user = await requireAuth(req, res);
    if (!user) return;
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) { res.status(400).json({ error: 'Pubblicazione non valida.' }); return; }
    try {
      if (!await publicationTrash.restore(id, user.id)) { res.status(404).json({ error: 'Pubblicazione non disponibile nei tuoi eliminati.' }); return; }
      res.json({ publication: await selectPublicationByIdRecord(id) });
    } catch { res.status(503).json({ error: 'Impossibile ripristinare la foto. Riprova.' }); }
  });

  app.delete("/api/publication-trash/:id", async (req, res) => {
    const user = await requireAuth(req, res);
    if (!user) return;
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0 || req.body?.confirm !== true) {
      res.status(400).json({ error: 'Conferma l’eliminazione definitiva della foto.' }); return;
    }
    try {
      if (!await publicationTrash.purge(id, user.id)) { res.status(404).json({ error: 'Pubblicazione non disponibile nei tuoi eliminati.' }); return; }
      res.json({ success: true });
    } catch { res.status(503).json({ error: 'Impossibile eliminare definitivamente la foto. Riprova.' }); }
  });

}
