import type { Express, Request, Response, RequestHandler } from 'express';

type Query = (sql: string, values?: unknown[]) => Promise<Record<string, any>[]>;
export function createHomePublicationService(query: Query) {
  let ready = false;
  return {
    get ready() { return ready; },
    async initialize(readOnly: boolean) {
      if (!readOnly) {
        await query(`CREATE TABLE IF NOT EXISTS establishment_home_publications (
          establishment_id INTEGER PRIMARY KEY REFERENCES establishments(id) ON DELETE CASCADE,
          publication_id INTEGER NOT NULL REFERENCES establishment_publications(id) ON DELETE CASCADE
        )`);
        await query('CREATE INDEX IF NOT EXISTS idx_home_publication_delete ON establishment_home_publications(publication_id)');
      }
      await query('SELECT establishment_id FROM establishment_home_publications LIMIT 0');
      ready = true;
    },
    register(app: Express, auth: (req: Request, res: Response) => Promise<{ id: number } | null>,
      admit: (handler: (req: Request, res: Response) => Promise<void>) => RequestHandler, readOnly: boolean) {
      const route = '/api/establishments/:id/home-publication';
      const owner = async (req: Request, res: Response) => {
        const user = await auth(req, res);
        if (!user) return null;
        const id = Number(req.params.id);
        if (!Number.isSafeInteger(id) || id <= 0) { res.status(400).json({ error: 'Attività non valida.' }); return null; }
        if (!ready) { res.status(503).json({ error: 'Scelta della foto non disponibile. Riprova tra poco.' }); return null; }
        const rows = await query(`SELECT e.id, hp.publication_id FROM establishments e
          LEFT JOIN establishment_home_publications hp ON hp.establishment_id = e.id
          WHERE e.id = $1 AND e.owner_user_id = $2`, [id, user.id]);
        if (!rows.length) { res.status(403).json({ error: 'Non puoi modificare questa attività.' }); return null; }
        return { id, userId: user.id, publicationId: rows[0].publication_id == null ? null : Number(rows[0].publication_id) };
      };
      app.get(route, async (req, res) => {
        try {
          const current = await owner(req, res);
          if (current) { res.setHeader('Cache-Control', 'no-store'); res.json({ publicationId: current.publicationId }); }
        } catch { res.status(500).json({ error: 'Impossibile caricare la foto scelta. Riprova.' }); }
      });
      app.put(route, admit(async (req, res) => {
        try {
          const current = await owner(req, res);
          if (!current) return;
          if (readOnly) { res.status(503).json({ error: 'Modifiche non disponibili in questo ambiente.' }); return; }
          const id = req.body?.publicationId;
          if (id !== null && (!Number.isSafeInteger(id) || id <= 0)) { res.status(400).json({ error: 'Pubblicazione non valida.' }); return; }
          if (id === null) {
            await query(`DELETE FROM establishment_home_publications WHERE establishment_id = $1
              AND EXISTS (SELECT 1 FROM establishments e WHERE e.id = $1 AND e.owner_user_id = $2)`, [current.id, current.userId]);
          } else {
            const rows = await query(`INSERT INTO establishment_home_publications (establishment_id, publication_id)
              SELECT e.id, ep.id FROM establishments e INNER JOIN establishment_publications ep ON ep.establishment_id = e.id
              WHERE e.id = $1 AND e.owner_user_id = $2 AND ep.id = $3 AND ep.owner_user_id = $2
              ON CONFLICT (establishment_id) DO UPDATE SET publication_id = excluded.publication_id
              RETURNING publication_id`, [current.id, current.userId, id]);
            if (!rows.length) { res.status(404).json({ error: 'Questa foto non è disponibile nella tua attività.' }); return; }
          }
          res.json({ publicationId: id });
        } catch { res.status(500).json({ error: 'Impossibile aggiornare la foto nella Home. Riprova.' }); }
      }));
    },
  };
}
