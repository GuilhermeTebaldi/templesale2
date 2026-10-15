import { Resolver } from 'node:dns/promises';
import { isIP } from 'node:net';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import type { Express } from 'express';
import { sharedLink } from '../src/lib/shared-links';

type Preview = { title: string; description: string; image?: string; imageKind?: 'cover' | 'icon' };
const resolver = new Resolver({ timeout: 1500, tries: 1 });
const cache = new Map<string, { expires: number; data: Preview | null }>();
const pending = new Map<string, Promise<Preview | null>>();
const clients = new Map<string, { until: number; count: number }>();
let budget = { until: 0, count: 0 };

function publicIPv4(address: string) {
  if (isIP(address) !== 4) return false;
  const [a, b, c] = address.split('.').map(Number);
  return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 168 || b === 0 || (b === 88 && c === 99))) ||
    (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) || (a === 203 && b === 0 && c === 113));
}

async function destination(url: URL) {
  if (isIP(url.hostname)) throw Error('IP destinations are not supported');
  const addresses = await resolver.resolve4(url.hostname);
  if (!addresses.length || addresses.some(address => !publicIPv4(address))) throw Error('Private destination');
  return addresses[0];
}

async function htmlPage(url: URL, signal: AbortSignal): Promise<{ html: string; url: URL }> {
  for (let redirect = 0; redirect <= 3; redirect++) {
    signal.throwIfAborted();
    const address = await destination(url);
    signal.throwIfAborted();
    const page = await new Promise<{ html?: string; location?: string }>((resolve, reject) => {
      const request = (url.protocol === 'https:' ? httpsRequest : httpRequest)(url, {
        signal, agent: false, family: 4,
        // Pin the validated IPv4 address; keep the original hostname for Host and TLS.
        lookup: (_host, _options, callback) => callback(null, address, 4),
        headers: { 'User-Agent': 'TempleSale-LinkPreview/1.0', Accept: 'text/html', 'Accept-Encoding': 'identity' },
      }, response => {
        const status = response.statusCode ?? 0;
        if ([301, 302, 303, 307, 308].includes(status)) {
          const location = response.headers.location;
          response.destroy();
          if (location) resolve({ location }); else reject(Error('Missing redirect'));
          return;
        }
        if (status !== 200 || !/^text\/html\b/i.test(String(response.headers['content-type'])) ||
          (response.headers['content-encoding'] && response.headers['content-encoding'] !== 'identity')) {
          response.destroy(); reject(Error('Unavailable preview')); return;
        }
        let bytes = 0;
        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => {
          bytes += chunk.length;
          if (bytes > 256 * 1024) { response.destroy(); reject(Error('Page too large')); return; }
          chunks.push(chunk);
          const html = Buffer.concat(chunks).toString('utf8');
          if (/<\/head\s*>/i.test(html)) { resolve({ html }); response.destroy(); }
        });
        response.on('end', () => resolve({ html: Buffer.concat(chunks).toString('utf8') }));
        response.on('error', reject);
        response.on('aborted', () => reject(Error('Incomplete page')));
      });
      request.on('error', reject);
      request.end();
    });
    if (page.html !== undefined) return { html: page.html, url };
    const next = sharedLink(new URL(page.location!, url).href);
    if (!next) throw Error('Invalid redirect');
    url = next;
  }
  throw Error('Too many redirects');
}

function decode(value: string, max: number) {
  const entities: Record<string, string> = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ' };
  return value.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (whole, entity: string) => {
    if (!entity.startsWith('#')) return entities[entity.toLowerCase()] ?? whole;
    const n = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
    return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : '';
  }).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function attributes(tag: string) {
  const attrs = new Map<string, string>();
  for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    attrs.set(match[1].toLowerCase(), match[2] ?? match[3] ?? match[4]);
  }
  return attrs;
}

async function loadPreview(url: URL): Promise<Preview | null> {
  try {
    const signal = AbortSignal.timeout(6000);
    const page = await htmlPage(url, signal);
    const tags = new Map<string, string>();
    const head = page.html.split(/<\/head\s*>/i)[0];
    for (const tag of head.match(/<meta\s[^>]{0,8192}>/gi) ?? []) {
      const attrs = attributes(tag);
      const name = (attrs.get('property') ?? attrs.get('name') ?? '').toLowerCase();
      if (name && !tags.has(name)) tags.set(name, attrs.get('content') ?? '');
    }
    const title = decode(tags.get('og:title') || tags.get('twitter:title') || head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '', 180);
    const description = decode(tags.get('og:description') || tags.get('description') || tags.get('twitter:description') || '', 280);
    let image: string | undefined;
    let imageKind: Preview['imageKind'];
    const rawImage = tags.get('og:image:secure_url') || tags.get('og:image') || tags.get('twitter:image');
    const icons = (head.match(/<link\s[^>]{0,8192}>/gi) ?? []).map(attributes)
      .filter(attrs => /(?:^|\s)(?:icon|apple-touch-icon)(?:\s|$)/i.test(attrs.get('rel') ?? ''))
      .sort((a, b) => Number((b.get('rel') ?? '').includes('apple-touch-icon')) - Number((a.get('rel') ?? '').includes('apple-touch-icon')));
    const candidates: { raw: string; kind: 'cover' | 'icon' }[] = [
      ...(rawImage ? [{ raw: rawImage, kind: 'cover' as const }] : []),
      ...icons.slice(0, 3).map(attrs => ({ raw: attrs.get('href') ?? '', kind: 'icon' as const })),
    ];
    for (const entry of candidates) {
      if (!entry.raw) continue;
      try {
        const candidate = sharedLink(new URL(decode(entry.raw, 2048), page.url).href);
        if (candidate?.protocol === 'https:') {
          await destination(candidate); signal.throwIfAborted();
          image = candidate.href; imageKind = entry.kind; break;
        }
      } catch { /* Metadata remains useful without an image. */ }
    }
    return title || description || image ? { title, description, image, imageKind } : null;
  } catch { return null; }
}

export function registerLinkPreview(app: Express) {
  // Optional previews bypass visitor writes and never touch the database.
  app.get('/api/link-preview', async (req, res) => {
    const url = typeof req.query.url === 'string' ? sharedLink(req.query.url) : null;
    if (!url) { res.status(400).json({ error: 'Link non valido.' }); return; }
    url.hash = '';
    const now = Date.now();
    const key = url.href;
    const client = req.ip ?? 'unknown';
    let rate = clients.get(client);
    if (!rate || rate.until <= now) { rate = { until: now + 60000, count: 0 }; clients.delete(client); clients.set(client, rate); }
    if (clients.size > 512) clients.delete(clients.keys().next().value!);
    if (++rate.count > 30) { res.setHeader('Retry-After', '60'); res.status(429).json({ data: null }); return; }
    const cached = cache.get(key);
    if (cached && cached.expires > now) { res.json({ data: cached.data }); return; }
    if (budget.until <= now) budget = { until: now + 60000, count: 0 };
    let work = pending.get(key);
    if (!work) {
      if (pending.size >= 2 || budget.count >= 20) { res.setHeader('Retry-After', '60'); res.status(503).json({ data: null }); return; }
      budget.count++;
      work = loadPreview(url).then(data => {
        cache.delete(key);
        cache.set(key, { data, expires: Date.now() + (data ? 3600000 : 300000) });
        if (cache.size > 256) cache.delete(cache.keys().next().value!);
        return data;
      }).finally(() => pending.delete(key));
      pending.set(key, work);
    }
    res.json({ data: await work });
  });
}
