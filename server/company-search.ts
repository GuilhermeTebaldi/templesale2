import type { Pool } from 'pg';

// One vocabulary for every city: location is matched against stored fields, not a list of exceptions.
const relatedTerms = [
  ['pizza', 'pizzeria', 'pizzaria', 'pizzerie'],
  ['barbiere', 'barber', 'barbeiro', 'barbieri'],
  ['parrucchiere', 'parrucchiera', 'parrucchieri', 'cabeleireiro'],
  ['ristorante', 'ristoranti', 'restaurante'],
  ['officina', 'meccanico', 'officine'],
];
const connectors = new Set(['a', 'ad', 'in', 'di', 'da', 'del', 'della', 'delle', 'dei', 'gli', 'il', 'lo', 'la', 'le', 'un', 'una', 'e', 'per', 'em', 'de', 'na', 'no']);
const accents = 'àáâãäåèéêëìíîïòóôõöùúûüçñ';
const plain =   'aaaaaaeeeeiiiiooooouuuucn';

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
}

function field(expression: string, postgres: boolean) {
  let sql = `LOWER(COALESCE(${expression}, ''))`;
  if (postgres) return `TRANSLATE(${sql}, '${accents}', '${plain}')`;
  for (let i = 0; i < accents.length; i++) sql = `REPLACE(${sql}, '${accents[i]}', '${plain[i]}')`;
  return sql;
}

function identity(postgres: boolean, alias = 'e') {
  return field(`COALESCE(${alias}.name, '') || ' ' || COALESCE(${alias}.category, '') || ' ' || COALESCE(${alias}.city, '') || ' ' || COALESCE(${alias}.keywords, '')`, postgres);
}

// A single insertion/deletion/substitution/transposition, on a whole stored
// word. No external dictionary or category-specific spelling exceptions.
function typoPattern(word: string) {
  const variants = new Set<string>();
  for (let i = 0; i <= word.length; i++) {
    variants.add(word.slice(0, i) + '[[:alnum:]]' + word.slice(i));
    if (i < word.length) {
      variants.add(word.slice(0, i) + word.slice(i + 1));
      variants.add(word.slice(0, i) + '[[:alnum:]]' + word.slice(i + 1));
    }
    if (i + 1 < word.length) variants.add(word.slice(0, i) + word[i + 1] + word[i] + word.slice(i + 2));
  }
  return `(^|[^[:alnum:]])(?!(?:${[...connectors].join('|')})([^[:alnum:]]|$))(${[...variants].join('|')})([^[:alnum:]]|$)`;
}

export async function searchCompanies(pool: Pool, built: { sql: string; values: unknown[] }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN READ ONLY');
    await client.query("SET LOCAL statement_timeout = '4s'");
    const result = await client.query(built.sql, built.values);
    await client.query('COMMIT');
    return result.rows;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally { client.release(); }
}

// Optional optimization: failure never prevents startup or exact/combined search.
export async function initializeCompanySearch(pool: Pool) {
  const client = await pool.connect();
  try {
    await client.query("SET statement_timeout = '30s'");
    await client.query("SET lock_timeout = '2s'");
    await client.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');
    const expressions = [identity(true, 'establishments'), ...['name', 'city', 'category'].map(column => field(column, true))];
    for (const [i, expression] of expressions.entries()) {
      const name = `idx_company_search_v1_${i}`;
      const invalid = await client.query('SELECT 1 FROM pg_index WHERE indexrelid = to_regclass($1) AND NOT indisvalid', [name]);
      if (invalid.rows.length) await client.query(`DROP INDEX CONCURRENTLY IF EXISTS ${name}`);
      await client.query(`CREATE INDEX CONCURRENTLY IF NOT EXISTS ${name} ON establishments USING gin ((${expression}) gin_trgm_ops)`);
    }
  } finally {
    await client.query('RESET statement_timeout; RESET lock_timeout').catch(() => {});
    client.release();
  }
}

export function buildCompanySearch(input: {
  search: string; limit: number; ownerId?: number; requireLocation?: boolean;
  latitude?: number; longitude?: number; allowTypos?: boolean;
}, postgres: boolean, tables: { publications: string; products: string; users: string; archived: boolean }) {
  const values: unknown[] = [];
  const bind = (value: unknown) => { values.push(value); return `$${values.length}`; };
  const raw = input.search.trim().toLowerCase().slice(0, 120);
  const query = normalize(raw);
  const allTerms = [...new Set(query.split(' ').filter(Boolean))];
  const terms = allTerms.filter(term => !connectors.has(term));
  // Preserve single-word business names that happen to be a connector.
  const useful = (terms.length ? terms : allTerms).slice(0, 12);
  const name = field('e.name', postgres);
  const city = field('e.city', postgres);
  const category = field('e.category', postgres);
  const document = identity(postgres);
  const phrase = bind(query);
  const exact = `(LOWER(e.name) = ${bind(raw)} OR ${name} = ${phrase})`;
  const conditions = useful.map(term => {
    const variants = relatedTerms.find(group => group.includes(term)) ?? [term];
    return `(${variants.map(variant => {
      // Match word starts, not arbitrary substrings: "bar" must not mean
      // "barbiere" or "barbecue". Longer unfinished words remain searchable.
      const prefix = variant.length >= 4;
      const pattern = bind(postgres
        ? `(^|[^[:alnum:]])${variant}${prefix ? '[[:alnum:]]*' : ''}([^[:alnum:]]|$)`
        : `*[^a-z0-9]${variant}${prefix ? '*' : ''}[^a-z0-9]*`);
      const matches = (value: string) => postgres ? `${value} ~ ${pattern}` : `(' ' || ${value} || ' ') GLOB ${pattern}`;
      // Every bound value must actually occur in SQL. Unused placeholders made
      // short queries fail in PostgreSQL and left the previous list on screen.
      let fuzzy = '';
      if (input.allowTypos && postgres && variant.length >= 4 && variant.length <= 32) {
        const typo = bind(typoPattern(variant));
        fuzzy = ` OR ${document} ~ ${typo}`;
      }
      return `(${matches(document)}${fuzzy}
        OR ${matches(field('e.description', postgres))}
        OR EXISTS (SELECT 1 FROM ${tables.publications} ep WHERE ep.establishment_id = e.id AND ${matches(field('ep.caption', postgres))})
        OR EXISTS (SELECT 1 FROM ${tables.products} p WHERE p.establishment_id = e.id AND ${matches(field("COALESCE(p.name, '') || ' ' || COALESCE(p.title, '') || ' ' || COALESCE(p.category, '') || ' ' || COALESCE(p.description, '') || ' ' || COALESCE(p.details, '')", postgres))})
        OR EXISTS (SELECT 1 FROM storefront_sections s WHERE s.establishment_id = e.id AND ${matches(field('s.name', postgres))}))`;
    }).join(' OR ')})`;
  });
  const where = [`COALESCE(e.is_active, ${postgres ? 'TRUE' : '1'}) = ${postgres ? 'TRUE' : '1'}`];
  if (tables.archived) where.push('NOT EXISTS (SELECT 1 FROM account_archives aa WHERE aa.user_id = e.owner_user_id)');
  if (input.ownerId) where.push(`e.owner_user_id = ${bind(input.ownerId)}`);
  if (input.requireLocation) where.push('e.latitude BETWEEN -90 AND 90 AND e.longitude BETWEEN -180 AND 180');
  // An existing category is an explicit intent, not a mention in another
  // company's caption. Discover it from the same eligible stored businesses.
  const categoryIntent = `EXISTS (SELECT 1 FROM establishments catalog WHERE ${where.map(clause => clause.replace(/\be\./g, 'catalog.')).join(' AND ')} AND ${field('catalog.category', postgres)} = ${phrase})`;
  where.push(`(${exact} OR (CASE WHEN ${categoryIntent} THEN ${category} = ${phrase} ELSE (${conditions.length ? conditions.join(' AND ') : '1 = 0'}) END))`);
  const score = useful.map(term => {
    const pattern = bind(`%${term}%`);
    const word = bind(term);
    return `(CASE WHEN ${name} LIKE ${pattern} THEN 8 ELSE 0 END
      + CASE WHEN ${city} = ${word} THEN 12 WHEN ${city} LIKE ${pattern} THEN 6 ELSE 0 END
      + CASE WHEN ${category} LIKE ${pattern} THEN 8 ELSE 0 END
      + CASE WHEN ${document} LIKE ${pattern} THEN 4 ELSE 0 END)`;
  }).join(' + ') || '0 + 0';
  let distance = '';
  if (input.latitude !== undefined && input.longitude !== undefined) {
    const lat = bind(input.latitude), lng = bind(input.longitude);
    distance = `CASE WHEN e.latitude IS NULL OR e.longitude IS NULL THEN 1 ELSE 0 END,
      12742.0 * ASIN(SQRT(${postgres ? 'LEAST' : 'MIN'}(1.0, POWER(SIN(RADIANS(e.latitude - ${lat}) / 2), 2)
      + COS(RADIANS(${lat})) * COS(RADIANS(e.latitude)) * POWER(SIN(RADIANS(e.longitude - ${lng}) / 2), 2)))) ASC,`;
  }
  return { sql: `SELECT e.*, u.avatar_url AS owner_avatar_url,
      (SELECT COUNT(*) FROM ${tables.publications} epc WHERE epc.establishment_id = e.id) AS publication_count,
      (SELECT COUNT(*) FROM ${tables.products} pc WHERE pc.establishment_id = e.id) AS product_count
    FROM establishments e LEFT JOIN ${tables.users} u ON u.id = e.owner_user_id
    WHERE ${where.join(' AND ')}
    ORDER BY ${distance} CASE WHEN ${exact} THEN 0 ELSE 1 END, (${score}) DESC, e.id DESC
    LIMIT ${bind(input.limit)}`, values };
}
