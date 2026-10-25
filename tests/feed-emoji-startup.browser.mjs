// Load the complete production app with a publication whose emoji crosses the
// old WhatsApp preview cutoff. All API traffic is mocked; no account is changed.
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { preview } from 'vite';
const server = await preview({ preview: { host: '127.0.0.1', port: 0 } });
after(() => new Promise(resolve => server.httpServer.close(resolve)));
const baseURL = server.resolvedUrls.local[0];
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH });
after(() => browser.close());
const caption = '✨ PULIZIE TEBALDI – SERVIZI DI PULIZIA 🏡🇮🇹\nUna casa pulita.';
assert.throws(() => encodeURIComponent(caption.slice(0, 40)), URIError, 'Fixture reproduces the previous crash');
const company = { id: 7, ownerId: 1, name: 'Pulizie', slug: 'pulizie', category: 'Servizi di Pulizia', city: 'Ardea', whatsappNumber: '390000000', keywords: [] };
const photo = { id: 11, ownerId: 1, establishmentId: 7, establishmentName: company.name, establishmentCity: company.city,
  establishmentCategory: company.category, establishmentWhatsappNumber: company.whatsappNumber,
  caption, imageUrl: '/photo.svg', media: ['/photo.svg'], createdAt: Date.now() };
for (const [device, width, userAgent] of [
  ['Android', 360, 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36'],
  ['iPhone', 390, 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'],
  ['desktop', 1440, undefined],
]) test(device + ': emoji publication opens normally, WhatsApp stays valid, and reload/profile still work', async t => {
  const context = await browser.newContext({ viewport: { width, height: 844 }, userAgent });
  t.after(() => context.close());
  await context.addInitScript(() => {
    localStorage.setItem('templesale_regression_marker', 'preserve');
    window.EventSource = class { addEventListener() {} close() {} };
    Object.defineProperty(navigator, 'permissions', { value: { query: async () => ({ state: 'denied' }) } });
  });
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin !== new URL(baseURL).origin) return route.abort();
    if (url.pathname === '/photo.svg') return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"/>' });
    if (!url.pathname.startsWith('/api/')) return route.continue();
    const json = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (url.pathname === '/api/auth/me') return json({ error: 'Guest' }, 401);
    if (url.pathname === '/api/establishments') return json({ establishments: [company] });
    if (url.pathname === '/api/publications') return json({ publications: [photo], pagination: { hasMore: false } });
    if (url.pathname === '/api/establishments/7/publications') return json({ publications: [photo], pagination: { hasMore: false } });
    if (url.pathname === '/api/establishments/7') return json({ establishment: company, publications: [photo], products: [] });
    return json([]);
  });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && m.text().includes('[templesale:startup]')) errors.push(m.text()); });
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt) await page.reload(); else await page.goto(baseURL);
    await page.locator('#feed-post-publication_11').waitFor();
    const href = await page.getByTitle('Contatta su WhatsApp').getAttribute('href');
    assert.equal(new URL(href).searchParams.get('text'), `Ciao! Ho visto la tua foto su TempleSale e vorrei maggiori dettagli: "${Array.from(caption).slice(0, 40).join('')}..."`);
    assert.equal(await page.getByRole('button', { name: 'Riprova', exact: true }).count(), 0);
    assert.equal(await page.locator('.ts-feed-caption').innerText(), caption);
  }
  await page.locator('.ts-feed-header').getByRole('heading', { name: 'Pulizie', exact: true }).click();
  await page.locator('#company-profile-view').waitFor();
  assert.equal(await page.locator('#company-publication-count').textContent(), '0');
  assert.equal(await page.evaluate(() => localStorage.getItem('templesale_regression_marker')), 'preserve');
  assert.deepEqual(errors, []);
});
