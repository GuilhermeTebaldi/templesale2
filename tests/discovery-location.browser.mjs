// Build first, then run with PLAYWRIGHT_MODULE / PLAYWRIGHT_EXECUTABLE_PATH if needed.
// Browser permissions and API data are mocked; no real location is shared.
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { preview } from 'vite';

const server = await preview({ preview: { host: '127.0.0.1', port: 0 } });
after(() => new Promise(resolve => server.httpServer.close(resolve)));
const baseURL = server.resolvedUrls.local[0];
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH });
after(() => browser.close());

async function fixture(t, { native = false, saved = null, scripts = true } = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  t.after(() => context.close());
  await context.addInitScript(({ native, saved }) => {
    if (saved) localStorage.setItem('templesale_discovery-location', saved);
    window.EventSource = class { addEventListener() {} close() {} };
    if (native) window.HTMLGeolocationElement = function () {};
    else delete window.HTMLGeolocationElement;
    const permission = new EventTarget();
    permission.state = 'prompt';
    const requests = [], watches = [];
    Object.defineProperty(navigator, 'permissions', { value: { query: async () => permission } });
    Object.defineProperty(navigator, 'geolocation', { value: {
      getCurrentPosition: (success, error) => requests.push({ success, error }),
      watchPosition: (success, error) => { watches.push({ success, error }); return watches.length; },
      clearWatch() {},
    } });
    window.locationFixture = { requests, watches, permission,
      deny() { requests.at(-1).error({ code: 1 }); },
      succeed() { requests.at(-1).success({ coords: { latitude: 41.6, longitude: 12.5, accuracy: 10 } }); },
      permissionChange(value) { permission.state = value; permission.dispatchEvent(new Event('change')); },
    };
  }, { native, saved });
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin !== new URL(baseURL).origin) return route.abort();
    if (!scripts && route.request().resourceType() === 'script') return route.abort();
    if (!url.pathname.startsWith('/api/')) return route.continue();
    const json = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (url.pathname === '/api/auth/me') return json({ error: 'Guest' }, 401);
    if (url.pathname === '/api/establishments') return json({ establishments: [] });
    if (url.pathname === '/api/publications') return json({ publications: [], pagination: { hasMore: false } });
    if (url.pathname.startsWith('/api/discovery/') || url.pathname === '/api/visitor/ping') return json({ success: true });
    return json([]);
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  t.after(() => assert.deepEqual(errors, []));
  await page.goto(baseURL);
  return page;
}
const requests = page => page.evaluate(() => window.locationFixture.requests.length);
const deny = page => page.evaluate(() => window.locationFixture.deny());

test('the existing logo is visible even when all application scripts fail', async t => {
  const page = await fixture(t, { scripts: false });
  const logo = page.locator('[data-startup-loading="true"] img');
  await logo.waitFor({ state: 'visible' });
  assert.equal(await logo.evaluate(image => image.complete && image.naturalWidth > 0), true);
  assert.equal(await logo.evaluate(image => getComputedStyle(image.parentElement).opacity), '1');
  assert.equal(await page.locator('[data-startup-loading="true"]').count(), 1);
});

test('a denied retry keeps the same button visible while pending and does not loop', async t => {
  const page = await fixture(t, { saved: 'accepted' });
  await page.waitForFunction(() => window.locationFixture.requests.length === 1);
  await deny(page);
  const retry = page.getByRole('button', { name: 'Usa la mia posizione', exact: true });
  await retry.waitFor({ state: 'visible' });
  await retry.evaluate(button => {
    window.retryButton = button;
    window.retryWasRemoved = false;
    new MutationObserver(() => { if (!button.isConnected) window.retryWasRemoved = true; }).observe(document.body, { childList: true, subtree: true });
  });
  await retry.click();
  assert.equal(await requests(page), 2);
  await page.getByRole('button', { name: 'Ricerca posizione…', exact: true }).waitFor({ state: 'visible' });
  assert.equal(await page.evaluate(() => window.retryButton.isConnected && !window.retryWasRemoved), true);
  await deny(page);
  await retry.waitFor({ state: 'visible' });
  assert.equal(await requests(page), 2, 'No automatic retry after a denied response');
  assert.equal(await page.evaluate(() => localStorage.getItem('templesale_discovery-location')), 'accepted');
  await page.reload();
  await page.waitForFunction(() => window.locationFixture.requests.length === 1);
});

test('the native control feeds the existing location/watch flow and cancels stale failures', async t => {
  const page = await fixture(t, { native: true });
  const native = page.locator('geolocation');
  await native.waitFor({ state: 'attached' });
  assert.equal(await page.getByRole('button', { name: 'Usa la mia posizione', exact: true }).count(), 0);
  await native.evaluate(element => {
    element.position = { coords: { latitude: 41.6, longitude: 12.5, accuracy: 10 } };
    element.dispatchEvent(new Event('location'));
  });
  await page.waitForFunction(() => window.locationFixture.watches.length === 1);
  await deny(page);
  assert.equal(await page.evaluate(() => localStorage.getItem('templesale_discovery-location')), 'accepted');
  assert.equal(await page.getByText('Posizione bloccata dal browser.', { exact: true }).count(), 0);
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('templesale_map_user_location')).lat), 41.6);
});

test('expired session permissions retry on return; blocked permissions do not repeatedly request', async t => {
  const page = await fixture(t);
  await page.waitForFunction(() => window.locationFixture.requests.length === 1);
  await deny(page);
  await page.getByRole('button', { name: 'Usa la mia posizione', exact: true }).waitFor({ state: 'visible' });
  await page.evaluate(() => { window.locationFixture.permission.state = 'denied'; window.dispatchEvent(new Event('pageshow')); });
  assert.equal(await requests(page), 1);
  await page.evaluate(() => { window.locationFixture.permission.state = 'prompt'; window.dispatchEvent(new Event('pageshow')); window.dispatchEvent(new Event('pageshow')); });
  assert.equal(await requests(page), 2, 'One request, even with duplicate lifecycle events');
  await page.evaluate(() => window.locationFixture.succeed());
  await page.waitForFunction(() => window.locationFixture.watches.length === 1);
  await page.evaluate(() => window.locationFixture.permissionChange('granted'));
  assert.equal(await requests(page), 2, 'An active grant resumes without another initial request');
});
