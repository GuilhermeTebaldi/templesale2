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

async function fixture(t, { native = false, saved = null, scripts = true, positionAge = null, width = 390 } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 844 } });
  t.after(() => context.close());
  await context.addInitScript(({ native, saved, positionAge }) => {
    if (positionAge !== null) localStorage.setItem('templesale_map_user_location', JSON.stringify({lat:41.6,lng:12.5,at:Date.now()-positionAge}));
    if (saved) localStorage.setItem('templesale_discovery-location', saved);
    window.EventSource = class { addEventListener() {} close() {} };
    if (native) window.HTMLGeolocationElement = function () {};
    else delete window.HTMLGeolocationElement;
    const permission = new EventTarget();
    permission.state = 'prompt';
    const requests = [], watches = [], cleared = [];
    Object.defineProperty(navigator, 'permissions', { value: { query: async () => permission } });
    Object.defineProperty(navigator, 'geolocation', { value: {
      getCurrentPosition: (success, error) => requests.push({ success, error }),
      watchPosition: (success, error) => { watches.push({ success, error }); return watches.length; },
      clearWatch(id) { cleared.push(id); },
    } });
    window.locationFixture = { requests, watches, cleared, permission,
      deny(index = watches.length - 1) { watches[index].error({ code: 1 }); },
      succeed(latitude = 41.6, longitude = 12.5) { watches.at(-1).success({ coords: { latitude, longitude, accuracy: 10 } }); },
      setVisible(visible) {
        Object.defineProperty(document, 'visibilityState', { configurable: true, value: visible ? 'visible' : 'hidden' });
        document.dispatchEvent(new Event('visibilitychange'));
      },
      permissionChange(value) { permission.state = value; permission.dispatchEvent(new Event('change')); },
    };
  }, { native, saved, positionAge });
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
const requests = page => page.evaluate(() => window.locationFixture.watches.length);
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
  await page.waitForFunction(() => window.locationFixture.watches.length === 1);
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
  await page.waitForFunction(() => window.locationFixture.watches.length === 1);
});

test('the native control feeds the existing location/watch flow and cancels stale failures', async t => {
  const page = await fixture(t, { native: true });
  const native = page.locator('geolocation');
  await page.waitForFunction(() => window.locationFixture.watches.length === 1);
  await page.evaluate(() => window.locationFixture.deny());
  await native.waitFor({ state: 'attached' });
  assert.equal(await page.getByRole('button', { name: 'Usa la mia posizione', exact: true }).count(), 0);
  await native.evaluate(element => {
    element.position = { coords: { latitude: 41.6, longitude: 12.5, accuracy: 10 } };
    element.dispatchEvent(new Event('location'));
  });
  await page.waitForFunction(() => window.locationFixture.watches.length === 2);
  await page.evaluate(() => window.locationFixture.deny(0));
  assert.equal(await page.evaluate(() => localStorage.getItem('templesale_discovery-location')), 'accepted');
  assert.equal(await page.getByText('Posizione bloccata dal browser.', { exact: true }).count(), 0);
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('templesale_map_user_location')).lat), 41.6);
});

test('one continuous watch survives repeated app switches and keeps the current position updated', async t => {
  const page = await fixture(t, { saved: 'accepted' });
  await page.waitForFunction(() => window.locationFixture.watches.length === 1);
  await page.evaluate(() => {
    window.locationFixture.succeed();
    // Some Safari versions report prompt even after a successful position.
    window.dispatchEvent(new Event('pageshow'));
    window.locationFixture.setVisible(false);
    window.locationFixture.setVisible(true);
    window.dispatchEvent(new Event('pageshow'));
  });
  assert.equal(await requests(page), 1);
  assert.deepEqual(await page.evaluate(() => window.locationFixture.cleared), []);
  assert.equal(await page.evaluate(() => window.locationFixture.requests.length), 0, 'No separate getCurrentPosition followed by another watch');
  await page.evaluate(() => {
    const now = Date.now(); Date.now = () => now + 31000;
    window.locationFixture.succeed(41.61, 12.51);
  });
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('templesale_map_user_location')).lat === 41.61);
  assert.equal(await requests(page), 1, 'Movement reuses the same subscription');
  await page.evaluate(() => window.locationFixture.permissionChange('granted'));
  assert.equal(await requests(page), 1, 'A valid permission does not trigger another request');
});

test('revoked and expired grants do not prompt on every return; an explicit retry still works', async t => {
  const page = await fixture(t);
  await page.waitForFunction(() => window.locationFixture.watches.length === 1);
  await page.evaluate(() => { window.locationFixture.succeed(); window.locationFixture.permissionChange('denied'); });
  await page.getByRole('button', { name: 'Usa la mia posizione', exact: true }).waitFor({ state: 'visible' });
  await page.evaluate(() => {
    window.dispatchEvent(new Event('pageshow'));
    window.locationFixture.permissionChange('prompt');
    window.dispatchEvent(new Event('pageshow'));
    document.dispatchEvent(new Event('visibilitychange'));
  });
  assert.equal(await requests(page), 1, 'No repeated automatic consent requests');
  await page.getByRole('button', { name: 'Usa la mia posizione', exact: true }).click();
  assert.equal(await requests(page), 2);
  await page.evaluate(() => { window.locationFixture.succeed(); window.locationFixture.permissionChange('prompt'); });
  assert.equal(await requests(page), 2);
  assert.equal(await page.evaluate(() => localStorage.getItem('templesale_discovery-location')), 'accepted');
  await page.evaluate(() => window.locationFixture.permissionChange('granted'));
  await page.waitForFunction(() => window.locationFixture.watches.length === 3);
});

test('a temporary GPS timeout keeps the watch alive and recovers without another permission request', async t => {
  const page = await fixture(t);
  await page.waitForFunction(() => window.locationFixture.watches.length === 1);
  await page.evaluate(() => window.locationFixture.watches[0].error({ code: 3 }));
  await page.getByRole('button', { name: 'Usa la mia posizione', exact: true }).waitFor({ state: 'visible' });
  await page.evaluate(() => window.locationFixture.succeed());
  await page.waitForFunction(() => localStorage.getItem('templesale_discovery-location') === 'accepted');
  assert.equal(await requests(page), 1);
  assert.deepEqual(await page.evaluate(() => window.locationFixture.cleared), []);
});

test('a recent saved position survives a temporary sensor failure without showing another permission request', async t => {
  const page = await fixture(t, { positionAge: 60000, saved: 'accepted' });
  await page.waitForFunction(() => window.locationFixture.watches.length === 1);
  await page.evaluate(() => window.locationFixture.watches[0].error({ code: 2 }));
  assert.equal(await page.locator('.ts-location-notice').count(), 0);
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('templesale_map_user_location')).lat), 41.6);
  assert.equal(await requests(page), 1);
  await page.evaluate(() => window.locationFixture.succeed(41.61,12.51));
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('templesale_map_user_location')).lat === 41.61);
});

test('a valid live fix survives transient errors and poor accuracy, but an expired fix or revoked permission shows recovery', async t => {
  const page = await fixture(t);
  await page.waitForFunction(() => window.locationFixture.watches.length === 1);
  assert.equal(await page.locator('.ts-location-notice').count(), 0, 'No redundant permission button during initial GPS acquisition');
  await page.evaluate(() => {
    window.locationFixture.succeed();
    window.locationFixture.watches[0].error({code:3});
    window.locationFixture.watches[0].success({coords:{latitude:41.7,longitude:12.6,accuracy:3000}});
  });
  assert.equal(await page.locator('.ts-location-notice').count(), 0);
  assert.equal(await requests(page), 1);
  await page.evaluate(() => {const now=Date.now();Date.now=()=>now+31*60*1000;window.locationFixture.watches[0].error({code:3});});
  await page.getByRole('button',{name:'Usa la mia posizione',exact:true}).waitFor({state:'visible'});
  await page.evaluate(() => window.locationFixture.succeed());
  await page.locator('.ts-location-notice').waitFor({state:'detached'});
  await deny(page);
  await page.getByText('Posizione bloccata dal browser.',{exact:true}).waitFor({state:'visible'});
});

test('an expired saved position does not hide the recovery button after a GPS error', async t => {
  const page=await fixture(t,{positionAge:31*60*1000});
  await page.waitForFunction(()=>window.locationFixture.watches.length===1);
  await page.evaluate(()=>window.locationFixture.watches[0].error({code:2}));
  await page.getByRole('button',{name:'Usa la mia posizione',exact:true}).waitFor({state:'visible'});
});

for(const width of [320,390,768,1440]) test(`${width}px: location recovery is compact, readable and contained`, async t => {
  const page=await fixture(t,{width});
  await page.waitForFunction(()=>window.locationFixture.watches.length===1);await deny(page);
  const button=page.getByRole('button',{name:'Usa la mia posizione',exact:true});await button.waitFor({state:'visible'});
  const bounds=await button.boundingBox();assert.ok(bounds.height>=44&&bounds.height<=46, JSON.stringify(bounds));
  const notice=await page.locator('.ts-location-notice').boundingBox();assert.ok(notice.height<150);
  assert.ok(bounds.x>=notice.x&&bounds.x+bounds.width<=notice.x+notice.width);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  if (width === 390) await page.screenshot({path:'/tmp/templesale-location-390.png'});
});
