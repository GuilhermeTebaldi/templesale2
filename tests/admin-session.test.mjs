import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createAdminSessionToken, verifyAdminSessionToken } from '../server/admin-session.ts';

test('administrative sessions require environment configuration and reject missing or wrong signing keys', () => {
  const secret = crypto.randomBytes(32).toString('hex');
  const token = createAdminSessionToken(secret,3600);
  assert.equal(verifyAdminSessionToken(token,secret),true);
  assert.equal(verifyAdminSessionToken(token,crypto.randomBytes(32).toString('hex')),false);
  assert.equal(verifyAdminSessionToken(token,''),false);
  assert.throws(()=>createAdminSessionToken('',3600));
  assert.equal(verifyAdminSessionToken(token + '.extra',secret),false);
  assert.equal(verifyAdminSessionToken(createAdminSessionToken(secret,-1),secret),false);
  assert.equal(verifyAdminSessionToken('malformed',secret),false);
});
