// Run: node --test tests/profile-publications.browser.mjs (starts Vite; PROFILE_TEST_URL can reuse a local server).
// Requires Playwright; PLAYWRIGHT_MODULE may point to an existing installation. All API data is mocked.
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = process.env.PROFILE_TEST_URL ? null : await createServer({ server: { host: '127.0.0.1', port: 0 } });
if (server) await server.listen();
after(() => server?.close());
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH });
after(() => browser.close());
const baseURL = process.env.PROFILE_TEST_URL || server.resolvedUrls.local[0].replace(/\/$/, '');
assert.ok(['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname), 'Use a local test server');
const companies = [4, 37, 0].map((publicationCount, index) => ({
  id: index + 1, ownerId: 101 + index, name: `Empresa Teste ${index + 1}`,
  slug: `empresa-${index + 1}`, category: 'Negozi', city: 'Roma',
  latitude: 41.6, longitude: 12.5, whatsappNumber: '390000000000',
  publicationCount, logoUrl: '/fixture-photo.svg', keywords: [], isActive: true,
}));
const photos = company => Array.from({ length: company.publicationCount }, (_, i) => ({
  id: company.id * 1000 + i, establishmentId: company.id, ownerId: company.ownerId,
  imageUrl: '/fixture-photo.svg', caption: `Foto ${company.id}-${i}`,
  createdAt: 1789880000 - i, establishmentName: company.name, establishmentSlug: company.slug,
}));
const grid = '#company-posts-grid > [id^="grid-post-"]';
const countIs = (page, count) => page.waitForFunction(
  ({ grid, count }) => document.querySelectorAll(grid).length === count,
  { grid, count }, { timeout: 8000 },
);
const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};

async function fixture(t, { guest = false, path = '/', mobile = false, holdOwner = null } = {}) {
  const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 } });
  t.after(() => context.close());
  const state = { requests: [], failInitial: false, failPage: false, hold: null };
  await context.addInitScript(({ guest }) => {
    localStorage.setItem('templesale_locale', 'pt-BR');
    if (!guest) localStorage.setItem('templesale_auth_token', 'local-test-only');
    window.EventSource = class { addEventListener() {} close() {} };
  }, { guest });
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== new URL(baseURL).origin) return route.abort();
    if (url.pathname === '/fixture-photo.svg') {
      return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="teal"/></svg>' });
    }
    if (!url.pathname.startsWith('/api/')) return route.continue();
    state.requests.push(url.pathname + url.search);
    const json = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (url.pathname === '/api/auth/me') return json({ id: 101, name: 'Dono Teste', email: 'owner@example.test', whatsappNumber: '390000000000', preferredLocale: 'pt-BR' });
    if (url.pathname === '/api/establishments/me') {
      if (holdOwner) await holdOwner.promise;
      return json({ establishment: companies[0] });
    }
    if (url.pathname === '/api/establishments') return json({ establishments: companies.map(c => ({ ...c, recentPublications: photos(c).slice(0, 3) })) });
    if (url.pathname === '/api/publications') return json({ publications: companies.flatMap(c => photos(c).slice(0, 1)), pagination: { hasMore: false, nextCursor: null, nextOffset: 2 } });
    const match = url.pathname.match(/^\/api\/establishments\/([^/]+)(\/publications)?$/);
    if (match) {
      const company = companies.find(c => String(c.id) === match[1] || c.slug === match[1]);
      if (!company) return json({ error: 'Unknown fixture company' }, 404);
      const kind = match[2] ? 'page' : 'initial';
      const hold = state.hold;
      if (hold?.kind === kind && hold.id === company.id) {
        state.hold = null;
        hold.started.resolve();
        await hold.release.promise;
        if (hold.fail) return json({ error: 'Simulated old failure' }, 400);
      }
      if ((kind === 'initial' && state.failInitial) || (kind === 'page' && state.failPage)) {
        return json({ error: 'Simulated network failure' }, 400);
      }
      const all = photos(company);
      if (kind === 'initial') return json({ establishment: company, products: [], publications: all.slice(0, Number(url.searchParams.get('publicationsLimit'))) });
      const offset = Number(url.searchParams.get('offset'));
      const limit = Number(url.searchParams.get('limit'));
      return json({ publications: all.slice(offset, offset + limit), pagination: { hasMore: offset + limit < all.length, nextOffset: Math.min(offset + limit, all.length), offset, limit } });
    }
    if (url.pathname.startsWith('/api/discovery/') || url.pathname === '/api/visitor/ping') return json({ success: true });
    return json([]);
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  t.after(() => assert.deepEqual(errors, [], 'No browser runtime errors'));
  await page.goto(baseURL + path);
  if (!path.startsWith('/attivita/')) {
    await page.waitForSelector('#feed-post-publication_1000');
    if (!guest) await page.waitForSelector(mobile ? '[title="Menu da Empresa"]' : '#desktop-rail-profile');
  }
  return { page, state };
}

const ownProfile = page => page.getByRole('button', { name: 'Empresa', exact: true }).click();
async function otherProfile(page, id = 2) {
  await page.locator('#desktop-rail-search').click();
  await page.locator(`#search-card-company_${id}`).getByText(`Empresa Teste ${id}`, { exact: true }).click();
}
async function loadRest(page, total) {
  while (await page.locator(grid).count() < total) {
    const before = await page.locator(grid).count();
    await page.locator('#company-posts-grid > div:last-child').scrollIntoViewIfNeeded();
    await page.waitForFunction(({ grid, before }) => document.querySelectorAll(grid).length > before, { grid, before }, { timeout: 8000 });
  }
  assert.equal(await page.locator(grid).count(), total);
  const ids = await page.locator(grid).evaluateAll(nodes => nodes.map(node => node.id));
  assert.equal(new Set(ids).size, total, 'No repeated photos');
}

test('own profile loads all four photos from the Empresa tab on mobile', async t => {
  const { page, state } = await fixture(t, { mobile: true });
  await ownProfile(page);
  await countIs(page, 4);
  assert.ok(state.requests.some(url => url.includes('/api/establishments/empresa-1?')));
  assert.equal(await page.locator('#feed-view [id^="feed-post-publication_"]').count(), 2, 'Profile photos do not enter the feed');
});

test('drawer public-profile action also loads all photos', async t => {
  const { page } = await fixture(t, { mobile: true });
  await page.locator('#btn-mobile-avatar').click();
  await page.getByText('Ver perfil público no feed', { exact: true }).click();
  await countIs(page, 4);
});

test('opening Empresa before the owner company arrives still loads all photos', async t => {
  const holdOwner = deferred();
  const { page } = await fixture(t, { holdOwner });
  await page.locator('#desktop-rail-profile').evaluate(button => button.click());
  holdOwner.resolve();
  await countIs(page, 4);
});

test('other profiles load every pagination page without duplicates', async t => {
  const { page } = await fixture(t);
  await otherProfile(page);
  await countIs(page, 21);
  await loadRest(page, 37);
  await page.locator('#desktop-rail-search').evaluate(button => button.click());
  await page.waitForSelector('#search-card-company_1');
  assert.equal(await page.locator('#company-profile-view').count(), 0, 'Search results must not reopen the URL profile');
});

test('guest profile links load without waiting for unrelated products', async t => {
  const { page } = await fixture(t, { guest: true, path: '/attivita/empresa-2', mobile: true });
  await countIs(page, 21);
  await loadRest(page, 37);
  await page.locator('#desktop-rail-search').evaluate(button => button.click());
  await page.waitForSelector('#search-card-company_1');
  assert.equal(await page.locator('#company-profile-view').count(), 0);
});

for (const kind of ['initial', 'page']) {
  test(`late ${kind} response cannot replace a newly selected profile`, async t => {
    const { page, state } = await fixture(t);
    const hold = { id: 2, kind, started: deferred(), release: deferred() };
    if (kind === 'initial') state.hold = hold;
    await otherProfile(page);
    if (kind === 'page') {
      await countIs(page, 21);
      state.hold = hold;
      await page.locator('#company-posts-grid > div:last-child').scrollIntoViewIfNeeded();
    }
    await hold.started.promise;
    // Dispatch immediately while the previous request is pending, before its loading overlay.
    await page.locator('#desktop-rail-profile').evaluate(button => button.click());
    await countIs(page, 4);
    const delivered = page.waitForResponse(response => response.url().includes(kind === 'page' ? '/2/publications?' : '/empresa-2?'));
    hold.release.resolve();
    await delivered;
    await page.waitForTimeout(100);
    assert.equal(await page.locator(grid).count(), 4);
    assert.ok((await page.locator(grid).evaluateAll(nodes => nodes.map(node => node.id))).every(id => id.startsWith('grid-post-publication_1')));
    assert.equal(new URL(page.url()).pathname, '/attivita/empresa-1');
  });
}

test('failed initial load shows retry instead of claiming an empty profile', async t => {
  const { page, state } = await fixture(t);
  state.failInitial = true;
  await ownProfile(page);
  await page.getByRole('alert').waitFor();
  assert.equal(await page.getByText('Nenhuma publicação ainda', { exact: true }).count(), 0);
  state.failInitial = false;
  await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
  await countIs(page, 4);
});

test('failed pagination preserves photos and retries the same page', async t => {
  const { page, state } = await fixture(t);
  await otherProfile(page);
  await countIs(page, 21);
  state.failPage = true;
  await page.locator('#company-posts-grid > div:last-child').scrollIntoViewIfNeeded();
  await page.getByRole('alert').waitFor();
  assert.equal(await page.locator(grid).count(), 21);
  const attempts = state.requests.filter(url => url.includes('/2/publications?')).length;
  await page.waitForTimeout(100);
  assert.equal(state.requests.filter(url => url.includes('/2/publications?')).length, attempts, 'No automatic retry loop');
  state.failPage = false;
  await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
  await page.waitForFunction(grid => document.querySelectorAll(grid).length > 21, grid);
  await loadRest(page, 37);
});

test('a truly empty profile still displays the existing empty state', async t => {
  const { page } = await fixture(t);
  await otherProfile(page, 3);
  await page.getByText('Nenhuma publicação ainda', { exact: true }).waitFor();
  assert.equal(await page.locator(grid).count(), 0);
  assert.equal(await page.getByRole('alert').count(), 0);
});
