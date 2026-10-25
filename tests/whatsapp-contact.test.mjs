import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const source = readFileSync('server.ts', 'utf8');
const start = source.indexOf('  app.get("/api/establishments/:idOrSlug",');
const end = source.indexOf('\n  });', start) + 7;
const implementation = ts.transpileModule(source.slice(start, end), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
async function contact(company, owner) {
  let handler, calls = 0;
  new Function('app', 'getRequestLocale', 'selectEstablishmentByIdOrSlugRow', 'selectUserByIdRow', implementation)(
    { get: (_, fn) => { handler = fn; } }, () => 'it', async () => company, async id => { calls++; assert.equal(id, 12); return owner; });
  const result = { status: 200, headers: {} };
  const res = { status(value) { result.status = value; return res; }, setHeader(k,v) { result.headers[k] = v; }, json(value) { result.body = value; } };
  await handler({ query: { contact: '1' }, params: { idOrSlug: '7' } }, res);
  return { ...result, calls };
}
const company = { ownerId: 12, name: 'Bazar', logoUrl: '/company.png' };
test('public contact exposes only the registered name and public photo, bypassing publication/product queries', async () => {
  const result = await contact(company, { name: '  Carla Rossi  ', avatar_url: '/owner.png', email: 'private@example.com', password: 'secret', auth0_sub: 'private' });
  assert.equal(result.status, 200);
  assert.equal(result.headers['Cache-Control'], 'no-store');
  assert.deepEqual(result.body, { ownerName: 'Carla Rossi', companyName: 'Bazar', photoUrl: '/owner.png' });
  assert.equal(result.calls, 1);
});
test('legacy email names are not displayed; business photo remains a fallback', async () => {
  assert.deepEqual((await contact(company, { name: 'private@example.com' })).body,
    { ownerName: '', companyName: 'Bazar', photoUrl: '/company.png' });
});
test('missing/archived businesses and missing/banned owners have no public contact', async () => {
  for (const [business, owner] of [[null, {}], [company, null], [company, { name: 'Blocked', is_banned: 1 }]]) {
    assert.equal((await contact(business, owner)).status, 404);
  }
});
