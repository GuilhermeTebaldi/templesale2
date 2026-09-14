import crypto from 'node:crypto';

// Administrative sessions require a configured signing key; public browsing does not.
export function createAdminSessionToken(secret: string, ttlSeconds: number): string {
  if (!secret.trim()) throw new Error('Assinatura administrativa não configurada.');
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const nonce = crypto.randomBytes(16).toString('hex');
  const payload = expiresAt + '.' + nonce;
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return payload + '.' + signature;
}

export function verifyAdminSessionToken(token: string, secret: string): boolean {
  if (!secret.trim()) return false;
  const [expiresAtRaw, nonce, signature, ...extra] = token.split('.');
  if (extra.length || !/^\d+$/.test(expiresAtRaw ?? '') ||
      !/^[a-f0-9]{32}$/i.test(nonce ?? '') || !/^[a-f0-9]{64}$/i.test(signature ?? '')) return false;
  const expected = crypto.createHmac('sha256', secret).update(expiresAtRaw + '.' + nonce).digest();
  const provided = Buffer.from(signature, 'hex');
  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) return false;
  const expiresAt = Number(expiresAtRaw);
  return Number.isSafeInteger(expiresAt) && expiresAt > Math.floor(Date.now() / 1000);
}
