import type { Express, Request, Response } from 'express';

type ProfilePatch = { category: string; description: string; city: string; address: string;
  keywords: string[]; latitude: number; longitude: number };

// Administrative metadata repair never changes identity, credentials, or publications.
export function registerAdminEstablishmentRoutes(app: Express, deps: {
  requireAdmin: (req: Request, res: Response) => unknown;
  getUser: (id: number) => Promise<{ id: number; email: string; is_banned?: unknown } | undefined>;
  getCompany: (ownerId: number) => Promise<{ id: number; ownerId: number } | null>;
  updateCompany: (id: number, ownerId: number, patch: ProfilePatch) => Promise<boolean>;
  normalizeText: (value: unknown, field: string, limit: number) => string;
  normalizeKeywords: (value: unknown) => string[];
}) {
  app.patch('/api/admin/users/:id/establishment', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (!deps.requireAdmin(req, res)) return;
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) { res.status(400).json({ error: 'Utente non valido.' }); return; }
    try {
      const user = await deps.getUser(id), company = await deps.getCompany(id);
      if (!user || !company) { res.status(404).json({ error: 'Attività non trovata.' }); return; }
      const body = req.body ?? {};
      if (user.is_banned || company.ownerId !== id || Number(body.expectedEstablishmentId) !== company.id ||
          typeof body.expectedEmail !== 'string' || body.expectedEmail.trim().toLowerCase() !== user.email.trim().toLowerCase()) {
        res.status(409).json({ error: 'Identità dell’attività non corrispondente.' }); return;
      }
      let patch: ProfilePatch;
      try {
        if (!Array.isArray(body.keywords) || typeof body.latitude !== 'number' || typeof body.longitude !== 'number' ||
            !Number.isFinite(body.latitude) || !Number.isFinite(body.longitude) || Math.abs(body.latitude) > 90 || Math.abs(body.longitude) > 180) throw new Error('Localizzazione o parole chiave non valide.');
        patch = {
          category: deps.normalizeText(body.category, 'Categoria', 120), description: deps.normalizeText(body.description, 'Descrizione', 5000),
          city: deps.normalizeText(body.city, 'Città', 120), address: deps.normalizeText(body.address, 'Indirizzo', 240),
          keywords: deps.normalizeKeywords(body.keywords), latitude: body.latitude, longitude: body.longitude,
        };
        if (patch.category.length < 2 || !patch.city || !patch.address) throw new Error('Categoria, città e indirizzo obbligatori.');
      } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'Dati non validi.' }); return; }
      if (!await deps.updateCompany(company.id, id, patch)) { res.status(404).json({ error: 'Attività non trovata.' }); return; }
      res.json({ establishment: await deps.getCompany(id) });
    } catch { res.status(500).json({ error: 'Impossibile aggiornare l’attività. Nessuna identità è stata modificata.' }); }
  });
}
