const PREFIX = 'templesale:write-operation:';
const WINDOW = 7 * 86400000;
const volatile = new Map<string, { fingerprint: string; key: string; at: number }>();
export async function beginWriteOperation(scope: string, payload: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const fingerprint = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), byte => byte.toString(16).padStart(2, '0')).join('');
  const storageKey = PREFIX + scope;
  let saved = volatile.get(storageKey);
  try { saved = JSON.parse(localStorage.getItem(storageKey) || 'null') || saved; } catch { /* Storage can be unavailable. */ }
  if (saved?.fingerprint === fingerprint && typeof saved.key === 'string' && /^[\w-]{16,80}$/.test(saved.key) && saved.at > Date.now() - WINDOW) return saved.key;
  const operation = { fingerprint, key: crypto.randomUUID(), at: Date.now() };
  volatile.set(storageKey, operation);
  while (volatile.size > 32) volatile.delete(volatile.keys().next().value!);
  try {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(PREFIX));
    for (const key of keys) {
      try { if (JSON.parse(localStorage.getItem(key) || 'null')?.at < Date.now() - WINDOW) localStorage.removeItem(key); } catch { localStorage.removeItem(key); }
    }
    if (keys.length >= 32) {
      const oldest = keys.sort((a,b) => JSON.parse(localStorage.getItem(a) || '{"at":0}').at - JSON.parse(localStorage.getItem(b) || '{"at":0}').at);
      oldest.slice(0, keys.length - 31).forEach(key => localStorage.removeItem(key));
    }
    localStorage.setItem(storageKey, JSON.stringify(operation));
  } catch { /* Session fallback retains retry identity without requiring storage. */ }
  return operation.key;
}
export function completeWriteOperation(scope: string, key: string) {
  const storageKey = PREFIX + scope;
  if (volatile.get(storageKey)?.key === key) volatile.delete(storageKey);
  try { if (JSON.parse(localStorage.getItem(storageKey) || 'null')?.key === key) localStorage.removeItem(storageKey); } catch { /* Optional storage. */ }
}
