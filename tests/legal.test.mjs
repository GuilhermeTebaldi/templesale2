import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import express from 'express';
import { createLegalService, registerLegalRoutes, legalAccountGate } from '../server/legal.ts';
import { buildLegalDocument, legalPublicationReady } from '../server/legal-document.ts';
import { sqliteBindings } from '../server/discovery.ts';

const config = {
  LEGAL_TERMS_ENABLED: 'true', LEGAL_OPERATOR_NAME: 'Operador de teste',
  LEGAL_OPERATOR_ADDRESS: 'Endereço de teste', LEGAL_OPERATOR_COUNTRY: 'IT',
  LEGAL_PRIVACY_RETENTION: 'Política de teste', LEGAL_PRIVACY_TRANSFER_DETAILS: 'Transferências de teste',
};
const identity = { sub: 'auth0|one', email: 'one@example.com', email_verified: true };
const user = { id: 1, email: identity.email };
async function fixture() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys=ON; CREATE TABLE users(id INTEGER PRIMARY KEY); INSERT INTO users VALUES(1),(2);');
  const query = async (sql, values = []) => {
    const bound = sqliteBindings(sql, values), stmt = db.prepare(bound.sql);
    return stmt.columns().length ? stmt.all(...bound.values) : (stmt.run(...bound.values), []);
  };
  const service = createLegalService(query, config);
  await service.initialize();
  const status = await service.status(1, 'pt-BR');
  const input = { locale: 'pt-BR', version: status.document.version, documentHash: status.documentHash,
    representative: 'Representante de teste', company: 'Empresa de teste', agreed: true, authorized: true };
  return { db, query, service, input };
}
test('activation requires operator and privacy details; disabled service does not write or block existing accounts', async () => {
  assert.throws(() => createLegalService(async () => [], { LEGAL_TERMS_ENABLED: 'true' }));
  const service = createLegalService(() => { throw Error('No query expected'); }, {});
  await service.initialize();
  assert.equal(await service.accepted(1), true);
  assert.deepEqual((await service.status(1, 'it-IT')).receipts, []);
});
test('unverified or mismatched Auth0 identity cannot produce a receipt', async () => {
  const { service, input, db } = await fixture();
  for (const claim of [{ ...identity, email_verified: false }, { ...identity, sub: 'auth0|other' },
    { ...identity, email: 'other@example.com' }, { ...identity, email_verified: 'true' }]) {
    await assert.rejects(service.accept(user, claim, identity.sub, input));
  }
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM legal_acceptances').get().n, 0);
  db.close();
});
test('stale documents and missing declarations fail; acceptance is private, idempotent and retains the exact text', async () => {
  const { service, input, db } = await fixture();
  for (const change of [{ agreed: false }, { authorized: false }, { documentHash: 'forged' },
    { version: 'old' }, { representative: '' }, { company: '' }]) {
    await assert.rejects(service.accept(user, identity, identity.sub, { ...input, ...change }));
  }
  const receipt = await service.accept(user, identity, identity.sub, input);
  const duplicate = await service.accept(user, identity, identity.sub, input);
  assert.equal(receipt.id, duplicate.id);
  assert.equal(receipt.email, user.email);
  assert.equal(receipt.auth0Subject, identity.sub);
  assert.ok(Date.parse(receipt.acceptedAt));
  assert.equal(receipt.documentHash, input.documentHash);
  assert.equal(await service.accepted(1), true);
  assert.equal(await service.accepted(2), false);
  assert.deepEqual((await service.status(2, 'pt-BR')).receipts, []);
  const changed = createLegalService(async (sql, values = []) => {
    const bound = sqliteBindings(sql, values), stmt = db.prepare(bound.sql);
    return stmt.all(...bound.values);
  }, { ...config, LEGAL_OPERATOR_ADDRESS: 'Novo endereço' });
  assert.equal(await changed.accepted(1), false);
  assert.equal((await changed.status(1, 'pt-BR')).receipts[0].document.operator.address, config.LEGAL_OPERATOR_ADDRESS);
  db.close();
});
test('HTTP endpoints enforce session and signed identity, and expose no receipts to visitors', async () => {
  const { service, input, db } = await fixture();
  await service.accept(user, identity, identity.sub, input);
  const app = express(); app.use(express.json());
  registerLegalRoutes(app, service, {
    session: async req => req.headers.authorization === 'Bearer local-test' ? user : null,
    verifyIdentity: async token => { if (token !== 'signed-test') throw Error('Invalid token'); return identity; },
    subjectForUser: async () => identity.sub,
  });
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  try {
    const response = await fetch(url + '/api/legal/status');
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual((await response.json()).receipts, []);
    assert.equal((await fetch(url + '/api/legal/accept', { method: 'POST' })).status, 401);
    assert.equal((await fetch(url + '/api/legal/accept', { method: 'POST', headers: { Authorization: 'Bearer local-test' } })).status, 403);
    const confirmed = await fetch(url + '/api/legal/accept', { method: 'POST',
      headers: { Authorization: 'Bearer local-test', 'X-Auth0-ID-Token': 'signed-test', 'Content-Type': 'application/json' },
      body: JSON.stringify(input) });
    assert.equal(confirmed.status, 200);
    assert.equal((await confirmed.json()).receipt.email, user.email);
  } finally { await new Promise(resolve => server.close(resolve)); db.close(); }
});
test('account writes are blocked server-side before acceptance; rejection can still log out; visitors remain unaffected', async () => {
  const { service, input, db } = await fixture();
  const app = express();
  app.use('/api', legalAccountGate(service, async req => req.headers.authorization === 'Bearer local-test' ? user : null));
  app.post('/api/products', (_req, res) => res.json({ ok: true }));
  app.post('/api/auth/logout', (_req, res) => res.json({ success: true }));
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const options = { method: 'POST', headers: { Authorization: 'Bearer local-test' } };
  try {
    const blocked = await fetch(url + '/api/products', options);
    assert.equal(blocked.status, 403);
    assert.equal((await blocked.json()).code, 'TERMS_REQUIRED');
    assert.equal((await fetch(url + '/api/auth/logout', options)).status, 200);
    assert.equal((await fetch(url + '/api/products', { method: 'POST' })).status, 200);
    await service.accept(user, identity, identity.sub, input);
    assert.equal((await fetch(url + '/api/products', options)).status, 200);
  } finally { await new Promise(resolve => server.close(resolve)); db.close(); }
});

test('confirmed operators and contact are present without publishing an address', () => {
  const withoutAddress = { ...config, LEGAL_OPERATOR_NAME: '', LEGAL_OPERATOR_ADDRESS: '' };
  assert.equal(legalPublicationReady(withoutAddress), true);
  for (const locale of ['pt-BR', 'it-IT']) {
    const doc = buildLegalDocument(locale, withoutAddress);
    assert.equal(doc.operator.name, 'Guilherme Tebaldi e Cristiane Elisabeth Eistalt Tebaldi');
    assert.equal(doc.operator.email, 'thetemplesale@gmail.com');
    assert.equal(doc.operator.address, '');
  }
  assert.equal(legalPublicationReady({ ...withoutAddress, LEGAL_PRIVACY_RETENTION: '' }), false);
});

test('the additive acceptance table does not prevent existing account deletion', async () => {
  const { service, input, db } = await fixture();
  await service.accept(user, identity, identity.sub, input);
  db.prepare('DELETE FROM users WHERE id = ?').run(user.id);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM legal_acceptances').get().n, 0);
  db.close();
});
