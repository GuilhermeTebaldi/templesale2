import type { Express, Request, Response } from 'express';

type Row = Record<string, any>;
type Query = (sql: string, values?: unknown[]) => Promise<Row[]>;
export type DiscoveryInput = { lat?: number; lng?: number; city: string; radius: number; search: string; category: string; limit: number; offset: number };
export class DiscoveryInputError extends Error {}

export function parseDiscoveryInput(raw: Record<string, unknown>): DiscoveryInput {
  const number = (key: string, fallback: number | undefined, min: number, max: number) => {
    if (raw[key] === undefined) return fallback;
    if (typeof raw[key] !== 'string' || !raw[key].trim()) throw new DiscoveryInputError(`Parâmetro inválido: ${key}`);
    const value = Number(raw[key]);
    if (!Number.isFinite(value) || value < min || value > max) throw new DiscoveryInputError(`Parâmetro inválido: ${key}`);
    return value;
  };
  const text = (key: string) => {
    if (raw[key] === undefined) return '';
    if (typeof raw[key] !== 'string' || raw[key].length > 120) throw new DiscoveryInputError(`Parâmetro inválido: ${key}`);
    return raw[key].trim();
  };
  const lat = number('lat', undefined, -90, 90);
  const lng = number('lng', undefined, -180, 180);
  const city = text('city');
  if ((lat === undefined) !== (lng === undefined) || (lat === undefined && !city)) {
    throw new DiscoveryInputError('Informe latitude e longitude ou uma cidade.');
  }
  const limit = number('limit', 12, 1, 24)!;
  const offset = number('offset', 0, 0, 10000)!;
  if (!Number.isInteger(limit) || !Number.isInteger(offset)) throw new DiscoveryInputError('Paginação inválida.');
  return { lat, lng, city, radius: number('radius', 5, 0.1, 50)!, search: text('search'), category: text('category'), limit, offset };
}

// Keep the bounding box indexable; apply the exact spherical distance before LIMIT.
export function buildDiscoveryQuery(input: DiscoveryInput, postgres: boolean) {
  const values: unknown[] = [];
  const bind = (value: unknown) => { values.push(value); return `$${values.length}`; };
  const where = [
    `COALESCE(e.is_active, ${postgres ? 'TRUE' : '1'}) = ${postgres ? 'TRUE' : '1'}`,
    'e.latitude IS NOT NULL',
    'e.longitude IS NOT NULL',
    'e.latitude BETWEEN -90 AND 90',
    'e.longitude BETWEEN -180 AND 180',
  ];
  let distance = 'NULL';
  if (input.lat !== undefined && input.lng !== undefined) {
    const angle = input.radius / 6371;
    const deltaLat = angle * 180 / Math.PI;
    const minLat = Math.max(-90, input.lat - deltaLat);
    const maxLat = Math.min(90, input.lat + deltaLat);
    where.push(`e.latitude BETWEEN ${bind(minLat)} AND ${bind(maxLat)}`, 'e.longitude BETWEEN -180 AND 180');
    if (minLat > -90 && maxLat < 90) {
      const deltaLng = Math.asin(Math.min(1, Math.sin(angle) / Math.cos(input.lat * Math.PI / 180))) * 180 / Math.PI;
      const west = input.lng - deltaLng;
      const east = input.lng + deltaLng;
      where.push(west < -180
        ? `(e.longitude >= ${bind(west + 360)} OR e.longitude <= ${bind(east)})`
        : east > 180
          ? `(e.longitude >= ${bind(west)} OR e.longitude <= ${bind(east - 360)})`
          : `e.longitude BETWEEN ${bind(west)} AND ${bind(east)}`);
    }
    const lat = bind(input.lat);
    const lng = bind(input.lng);
    distance = `12742.0 * ASIN(SQRT(${postgres ? 'LEAST' : 'MIN'}(1.0,
      POWER(SIN(RADIANS(e.latitude - ${lat}) / 2), 2) + COS(RADIANS(${lat})) * COS(RADIANS(e.latitude)) * POWER(SIN(RADIANS(e.longitude - ${lng}) / 2), 2))))`;
  } else {
    where.push(`LOWER(TRIM(e.city)) = LOWER(${bind(input.city)})`);
  }
  if (input.category && input.category !== 'All') where.push(`LOWER(e.category) = LOWER(${bind(input.category)})`);
  let relevance = '0';
  if (input.search) {
    const exact = bind(input.search.toLowerCase());
    // Treat LIKE metacharacters as literal search text.
    const like = bind(`%${input.search.toLowerCase().replace(/[\\%_]/g, '\\$&')}%`);
    const matches = (column: string) => `LOWER(COALESCE(${column}, '')) LIKE ${like} ESCAPE '\\'`;
    where.push(`(${['e.name', 'e.category', 'e.description', 'e.keywords'].map(matches).join(' OR ')}
      OR EXISTS (SELECT 1 FROM products p WHERE p.establishment_id = e.id AND (${['p.name', 'p.title', 'p.category', 'p.description'].map(matches).join(' OR ')}))
      OR EXISTS (SELECT 1 FROM establishment_publications ep WHERE ep.establishment_id = e.id AND ${matches('ep.caption')}))`);
    relevance = `CASE WHEN LOWER(e.name) = ${exact} THEN 0 WHEN LOWER(e.category) = ${exact} THEN 1 ELSE 2 END`;
  }
  const radius = input.lat === undefined ? '' : `WHERE distance_km <= ${bind(input.radius)}`;
  const sql = `WITH nearby AS (
    SELECT e.*, ${distance} AS distance_km, ${relevance} AS relevance,
      (SELECT MAX(ep.created_at) FROM establishment_publications ep WHERE ep.establishment_id = e.id) AS last_activity,
      CASE WHEN e.logo_url <> '' AND e.whatsapp_number <> '' THEN 1 ELSE 0 END AS profile_quality
    FROM establishments e WHERE ${where.join(' AND ')}
  ) SELECT * FROM nearby ${radius}
    ORDER BY distance_km ASC, relevance ASC, COALESCE(last_activity, 0) DESC, profile_quality DESC, id DESC
    LIMIT ${bind(input.limit + 1)} OFFSET ${bind(input.offset)}`;
  return { sql, values };
}

export function sqliteBindings(sql: string, values: unknown[]) {
  const args: unknown[] = [];
  return { sql: sql.replace(/\$(\d+)/g, (_, index) => { args.push(values[Number(index) - 1]); return '?'; }), values: args };
}

export async function initializeDiscovery(query: Query) {
  await query('CREATE INDEX IF NOT EXISTS idx_establishments_location ON establishments(latitude, longitude)');
  await query('CREATE INDEX IF NOT EXISTS idx_establishments_city_lower ON establishments(LOWER(TRIM(city)))');
  await query('CREATE INDEX IF NOT EXISTS idx_publications_discovery ON establishment_publications(establishment_id, created_at DESC, id DESC)');
  await query(`CREATE TABLE IF NOT EXISTS discovery_metrics (
    day TEXT NOT NULL, event TEXT NOT NULL, establishment_id BIGINT NOT NULL DEFAULT 0,
    count BIGINT NOT NULL DEFAULT 0, PRIMARY KEY(day, event, establishment_id)
  )`);
}

export function registerDiscovery(app: Express, deps: {
  query: Query; postgres: boolean; readOnly?: boolean;
  normalizeEstablishment: (row: Row) => unknown;
  normalizePublication: (row: Row) => unknown;
  requireAdmin: (req: Request, res: Response) => unknown;
}) {
  const { query } = deps;
  const track = async (event: string, establishmentId = 0) => {
    if (deps.readOnly) return;
    await query(`INSERT INTO discovery_metrics(day, event, establishment_id, count) VALUES ($1, $2, $3, 1)
      ON CONFLICT(day, event, establishment_id) DO UPDATE SET count = discovery_metrics.count + 1`,
    [new Date().toISOString().slice(0, 10), event, establishmentId]);
  };
  app.get('/api/discovery', async (req, res) => {
    try {
      const input = parseDiscoveryInput(req.query);
      const built = buildDiscoveryQuery(input, deps.postgres);
      const rows = await query(built.sql, built.values);
      const page = rows.slice(0, input.limit);
      const ids = page.map(row => row.id);
      const slots = ids.map((_, index) => `$${index + 1}`).join(',');
      const [publications, products] = ids.length ? await Promise.all([
        query(`SELECT * FROM (SELECT ep.*, ROW_NUMBER() OVER (PARTITION BY establishment_id ORDER BY created_at DESC, id DESC) AS position
          FROM establishment_publications ep WHERE establishment_id IN (${slots})) ranked WHERE position <= 3 ORDER BY establishment_id, position`, ids),
        query(`SELECT * FROM (SELECT p.id, p.establishment_id, COALESCE(NULLIF(p.name, ''), p.title) AS name,
          p.price, COALESCE(NULLIF(p.image_url, ''), p.image) AS image,
          ROW_NUMBER() OVER (PARTITION BY establishment_id ORDER BY id DESC) AS position
          FROM products p WHERE establishment_id IN (${slots})) ranked WHERE position <= 3 ORDER BY establishment_id, position`, ids),
      ]) : [[], []];
      // Metrics contain aggregate counts only, never coordinates, search text or visitor IDs.
      if (!input.offset) void track(input.search ? 'search' : 'discovery').catch(console.error);
      res.setHeader('Cache-Control', 'no-store');
      res.json({ items: page.map(row => ({
        establishment: deps.normalizeEstablishment(row),
        distanceKm: row.distance_km === null ? null : Number(row.distance_km),
        publications: publications.filter(item => String(item.establishment_id) === String(row.id)).map(deps.normalizePublication),
        products: products.filter(item => String(item.establishment_id) === String(row.id)).map(item => ({ id: Number(item.id), name: item.name, price: item.price, image: item.image })),
      })), hasMore: rows.length > input.limit, nextOffset: input.offset + page.length });
    } catch (error) {
      if (error instanceof DiscoveryInputError) { res.status(400).json({ error: error.message }); return; }
      console.error('Discovery query failed:', error);
      res.status(500).json({ error: 'Não foi possível carregar empresas próximas.' });
    }
  });

  const events = new Set(['company_open', 'whatsapp', 'map']);
  const recent = new Map<string, number>();
  app.post('/api/discovery/events', async (req, res) => {
    const { event, establishmentId } = req.body ?? {};
    if (!events.has(event) || !Number.isSafeInteger(establishmentId) || establishmentId <= 0) {
      res.status(400).json({ error: 'Evento inválido.' }); return;
    }
    // Bounded in-memory debounce; no visitor identifier is persisted.
    const now = Date.now();
    for (const [key, time] of recent) if (now - time > 60000) recent.delete(key);
    const key = `${req.ip}:${event}:${establishmentId}`;
    if (recent.has(key) || recent.size >= 10000) { res.sendStatus(204); return; }
    recent.set(key, now);
    try {
      const active = await query(`SELECT id FROM establishments WHERE id = $1 AND is_active = ${deps.postgres ? 'TRUE' : '1'}`, [establishmentId]);
      if (active.length) await track(event, establishmentId);
      res.sendStatus(204);
    } catch (error) { console.error('Discovery metric failed:', error); res.sendStatus(503); }
  });
  app.get('/api/admin/discovery-metrics', async (req, res) => {
    if (!deps.requireAdmin(req, res)) return;
    try {
      const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
      res.json({ metrics: await query('SELECT * FROM discovery_metrics WHERE day >= $1 ORDER BY day DESC, event, establishment_id', [since]) });
    } catch (error) { console.error('Discovery metrics failed:', error); res.sendStatus(503); }
  });
}
