import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import ts from 'typescript';

// Exercise the actual server query and normalizers without starting a real server.
const source = readFileSync('server.ts', 'utf8');
function between(start, end) {
  const a = source.indexOf(start), b = source.indexOf(end, a + start.length);
  assert.ok(a >= 0 && b > a); return source.slice(a, b);
}
const implementation = ts.transpileModule([
  between('function normalizeTaxonomyKey(', 'function sanitizeProductSlugForStorage('),
  between('function normalizeKeywordList(', 'function normalizePublicationRow('),
  between('type TaxonomySuggestionRecord =', 'async function selectProductCategorySuggestions('),
  'return selectBusinessCategorySuggestions;',
].join('\n'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
function select(db, pg = null) {
  return new Function('pgPool', 'requireSqliteDb', 'safeJsonParse', implementation)(pg, () => db,
    (value, fallback) => { try { return JSON.parse(value); } catch { return fallback; } });
}
async function exercise(query, insert) {
  await insert('Mago', ['Illusionismo', 'Eventi']);
  await insert('màgo', ['eventi', 'Feste']);
  await insert('Bar', ['Caffè', 'Aperitivo']);
  await insert('BAR', ['caffe', 'Colazione']);
  await insert('Servizi di Pulizia', ['Case', 'Uffici']);
  await insert('Altro', []);
  const rows = await query('');
  const mago = rows.find(row => row.key === 'mago');
  assert.equal(mago.usageCount, 2);
  assert.deepEqual(new Set(mago.keywords), new Set(['Illusionismo', 'Eventi', 'Feste']));
  assert.equal(mago.source, 'user');
  const bar = rows.find(row => row.key === 'bar');
  assert.equal(bar.label, 'Bar'); assert.equal(bar.source, 'system'); assert.equal(bar.usageCount, 2);
  assert.equal(bar.keywords.length, 3, 'Case/accent variants do not duplicate keywords');
  assert.ok(rows.some(row => row.key === 'ristorante'), 'Unused system categories remain available');
  assert.deepEqual((await query('MAGÓ')).map(row => row.key), ['mago']);
  await insert('Nuova attività', ['Su misura']);
  assert.deepEqual((await query('nuova'))[0].keywords, ['Su misura'], 'Saved categories/keywords are discovered without a separate dictionary write');
  for (let i = 0; i < 3; i++) await insert('Molte parole', Array.from({ length: 20 }, (_, n) => 'Parola '+(i*20+n)));
  assert.equal((await query('molte'))[0].keywords.length, 60, 'Admin aggregation preserves all associations across activities');
}
test('SQLite: saved categories and their keywords feed suggestions, counts and administration', async () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec('CREATE TABLE establishments(category TEXT, keywords TEXT)');
    await exercise(select(db), async (category, keywords) => db.prepare('INSERT INTO establishments VALUES(?,?)').run(category, JSON.stringify(keywords)));
  } finally { db.close(); }
});
test('PostgreSQL: category/keyword aggregation uses the same persisted associations', { skip: !process.env.DISCOVERY_TEST_DATABASE_URL && !process.env.DISCOVERY_PGLITE_MODULE }, async () => {
  let client, close;
  if (process.env.DISCOVERY_TEST_DATABASE_URL) {
    const { Client } = await import('pg'); client = new Client({ connectionString: process.env.DISCOVERY_TEST_DATABASE_URL });
    await client.connect(); close = () => client.end();
  } else {
    const { PGlite } = await import(process.env.DISCOVERY_PGLITE_MODULE); client = new PGlite(); close = () => client.close();
  }
  try {
    await client.query('CREATE TEMP TABLE establishments(category TEXT, keywords TEXT)');
    await exercise(select(null, client), (category, keywords) => client.query('INSERT INTO establishments VALUES($1,$2)', [category, JSON.stringify(keywords)]));
  } finally { await close(); }
});
