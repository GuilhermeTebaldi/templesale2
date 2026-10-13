const PREFIX = 'templesale:write-operation:';
export class WriteBusyError extends Error {
  constructor(message: string, readonly retryAfter: number) { super(message); }
}
export function waitForWriteDelay(delay:number,signal?:AbortSignal):Promise<void> {
  return new Promise<void>((resolve,reject) => {
    const abort=()=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);reject(signal?.reason??new Error('Envio cancelado.'));};
    const timer=setTimeout(()=>{signal?.removeEventListener('abort',abort);resolve();},delay);
    signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
  });
}
// Only retry explicit admission refusals: the server has not started the write/upload.
export async function retryWriteWhenBusy<T>(send: () => Promise<T>, signal?: AbortSignal): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    signal?.throwIfAborted();
    try { return await send(); }
    catch (error) {
      if (!(error instanceof WriteBusyError) || attempt >= 2) throw error;
      const delay = Math.min(10000, Math.max(1000 * 2 ** attempt, Number.isFinite(error.retryAfter) ? error.retryAfter * 1000 : 2000)) + Math.random() * 1000;
      await waitForWriteDelay(delay,signal);
    }
  }
}
const WINDOW = 7 * 86400000;
const MAX_PENDING = 32;
type Operation = { fingerprint: string; key: string; at: number };
const volatile = new Map<string, Operation>();
function validOperation(value: any): value is Operation {
  return value && /^[a-f0-9]{64}$/.test(value.fingerprint) &&
    typeof value.key === 'string' && /^[\w-]{16,80}$/.test(value.key) &&
    Number.isFinite(value.at) && value.at > Date.now()-WINDOW;
}
function readOperation(storageKey: string): Operation | undefined {
  let saved = volatile.get(storageKey);
  try {
    const persisted = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (validOperation(persisted)) saved = persisted;
  } catch { /* Session fallback. */ }
  return validOperation(saved) ? saved : undefined;
}
function retainedKeys(): string[] {
  for (const [key,value] of volatile) if (!validOperation(value)) volatile.delete(key);
  const retained = new Set(volatile.keys());
  try {
    for (const key of Object.keys(localStorage).filter(key=>key.startsWith(PREFIX))) {
      let value: unknown;
      try { value=JSON.parse(localStorage.getItem(key) || 'null'); } catch { /* Remove invalid metadata. */ }
      if (validOperation(value)) retained.add(key);
      else localStorage.removeItem(key);
    }
  } catch { /* Session fallback. */ }
  return [...retained];
}
export async function beginWriteOperation(scope: string, payload: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const fingerprint = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), byte => byte.toString(16).padStart(2, '0')).join('');
  const legacyKey = PREFIX + scope;
  const storageKey = legacyKey + ':' + fingerprint;
  const retained = retainedKeys();
  // Preserve the old single-entry format during rollout. Sending another
  // payload must not replace this older uncertain request.
  const saved = readOperation(storageKey) ?? readOperation(legacyKey);
  if (saved?.fingerprint === fingerprint) return saved.key;
  // Never evict an uncertain identity merely to make room for another send.
  if (retained.length >= MAX_PENDING) throw new Error('Há 32 envios sem confirmação neste navegador. Retome os envios anteriores antes de iniciar outros.');
  const operation = { fingerprint, key: crypto.randomUUID(), at: Date.now() };
  volatile.set(storageKey, operation);
  try { localStorage.setItem(storageKey, JSON.stringify(operation)); } catch { /* Session fallback. */ }
  return operation.key;
}
export function completeWriteOperation(scope: string, key: string) {
  const legacyKey = PREFIX + scope;
  for (const storageKey of retainedKeys()) {
    if (storageKey !== legacyKey && !storageKey.startsWith(legacyKey + ':')) continue;
    if (readOperation(storageKey)?.key !== key) continue;
    volatile.delete(storageKey);
    try { localStorage.removeItem(storageKey); } catch { /* Optional storage. */ }
  }
}
