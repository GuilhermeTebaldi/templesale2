// Real Header and production CSS; synthetic viewport events model browser chrome
// and keyboard timing. These are not physical-device Safari compositor tests.
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync, readdirSync } from 'node:fs';
import { build } from 'esbuild';

const bundle = await build({
  stdin: { resolveDir: process.cwd(), loader: 'tsx', contents: `
    import React from 'react';
    import { createRoot } from 'react-dom/client';
    import { Header } from './src/components/Header';
    import { I18nProvider } from './src/i18n/provider';
    function Fixture() {
      const [tab, setTab] = React.useState('profile');
      const registered = !new URLSearchParams(location.search).has('guest');
      return <div id="application-root"><Header activeTab={tab} setActiveTab={setTab}
        unreadNotificationsCount={0} onToggleNotifications={() => {}}
        onOpenCreatePost={() => { window.publishClicks = (window.publishClicks || 0) + 1; }}
        onOpenCompanyModal={() => {}} searchQuery="" onSearchChange={() => {}}
        user={{ isAuthenticated: registered, name: 'Fixture', picture: '' }}
        activeCompany={{ name: 'Fixture', logo: '' }} />
        <main style={{ minHeight: 4000, paddingBottom: 96 }}><input id="keyboard-input" aria-label="Testo" />
          <div id="profile-grid" style={{ height: 3900, background: 'repeating-linear-gradient(#d8eee7 0 160px, #e8dce9 160px 320px)' }}>Profilo</div>
        </main></div>;
    }
    createRoot(document.getElementById('root')).render(<I18nProvider><Fixture /></I18nProvider>);
  ` }, bundle: true, format: 'esm', write: false,
  define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env': '{}' },
});
const stylesheet = readFileSync('dist/assets/' + readdirSync('dist/assets').find(name => /^index-.*\.css$/.test(name)));
const server = createServer((request, response) => {
  const path = request.url.split('?')[0];
  if (path === '/fixture.js') { response.setHeader('Content-Type', 'text/javascript'); response.end(bundle.outputFiles[0].text); }
  else if (path === '/fixture.css') { response.setHeader('Content-Type', 'text/css'); response.end(stylesheet); }
  else if (path === '/') { response.setHeader('Content-Type', 'text/html'); response.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><link rel="stylesheet" href="/fixture.css"><div id="root"></div><script type="module" src="/fixture.js"></script>'); }
  else { response.statusCode = 404; response.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
after(() => new Promise(resolve => server.close(resolve)));
const engines = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const engine = engines[process.env.BROWSER_ENGINE || 'chromium'];
const browser = await engine.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH });
after(() => browser.close());

async function fixture(t, { standalone = false, guest = false } = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  t.after(() => context.close());
  await context.addInitScript(({ standalone }) => {
    Object.defineProperty(navigator, 'standalone', { value: standalone });
    const viewport = new EventTarget();
    Object.assign(viewport, { height: 844, offsetTop: 0, scale: 1 });
    Object.defineProperty(window, 'visualViewport', { value: viewport });
    window.viewportFixture = {
      set({ height, offsetTop = 0, innerHeight = 844, event = 'resize' }) {
        Object.assign(viewport, { height, offsetTop });
        Object.defineProperty(window, 'innerHeight', { configurable: true, value: innerHeight });
        if (event === 'pageshow') window.dispatchEvent(new Event(event));
        else viewport.dispatchEvent(new Event(event));
      },
    };
  }, { standalone });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  t.after(() => assert.deepEqual(errors, []));
  await page.goto('http://127.0.0.1:' + server.address().port + (guest ? '/?guest' : '/'));
  await page.locator('#mobile-bottom-nav').waitFor({ state: 'visible' });
  return page;
}
async function viewport(page, state) {
  await page.evaluate(state => window.viewportFixture.set(state), state);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
async function bottomIs(page, expected) {
  const result = await page.locator('#mobile-bottom-nav').evaluate(nav => ({
    bottom: nav.getBoundingClientRect().bottom,
    navPosition: getComputedStyle(nav).position,
    frameTop: nav.parentElement.getBoundingClientRect().top,
    background: getComputedStyle(nav).backgroundColor,
    frameBlocksContent: getComputedStyle(nav.parentElement).pointerEvents,
  }));
  assert.ok(Math.abs(result.bottom - expected) <= 1, JSON.stringify(result));
  assert.equal(result.frameTop, 0);
  assert.equal(result.navPosition, 'absolute');
  assert.equal(result.background, 'rgb(255, 255, 255)');
  assert.equal(result.frameBlocksContent, 'none');
}
for (const standalone of [false, true]) {
  test(`${standalone ? 'installed app' : 'browser'}: scrolling and changing browser chrome never leave the dock anchored to a stale window bottom`, async t => {
    const page = await fixture(t, { standalone });
    const sizes = [
      { height: 844 }, { height: 730, innerHeight: 844 },
      { height: 812, innerHeight: 730 }, // Resize events can arrive out of order.
      { height: 780, offsetTop: 24 },
      { height: 844, offsetTop: -60 }, // Elastic top overscroll is not an upward offset.
      { height: 844 }, { height: 730 }, { height: 844 },
    ];
    for (const [index, state] of sizes.entries()) {
      await page.evaluate(y => window.scrollTo(0, y), index % 2 ? 850 : 40);
      await viewport(page, state);
      await bottomIs(page, state.height + Math.max(0, state.offsetTop || 0));
    }
    const isCovered = await page.evaluate(() => document.querySelector('#mobile-bottom-nav').contains(document.elementFromPoint(10, 842)));
    assert.equal(isCovered, true, 'Profile tiles cannot appear below the dock');
    if (standalone && process.env.MOBILE_NAV_SCREENSHOT) await page.screenshot({ path: process.env.MOBILE_NAV_SCREENSHOT });
    await page.locator('#mobile-bottom-nav button[title="+ Pubblica foto"]').click();
    assert.equal(await page.evaluate(() => window.publishClicks), 1, 'The floating action stays clickable');
    assert.equal(await page.locator('#profile-grid').evaluate(grid => grid === document.elementFromPoint(15, 200)), true, 'The transparent frame does not block profile scrolling');
  });
  test(`${standalone ? 'installed app' : 'browser'}: keyboard opening, blur and closing do not expose a floating navigation bar`, async t => {
    const page = await fixture(t, { standalone });
    await page.locator('#keyboard-input').focus();
    // Android can resize innerHeight as well as the visual viewport.
    await viewport(page, { height: 420, offsetTop: 40, innerHeight: 420 });
    assert.equal(await page.locator('#mobile-bottom-nav').isVisible(), false);
    await page.locator('#keyboard-input').evaluate(input => input.blur());
    await viewport(page, { height: 500, innerHeight: 500 });
    assert.equal(await page.locator('#mobile-bottom-nav').isVisible(), false, 'Keep it hidden during keyboard dismissal');
    await viewport(page, { height: 844 });
    await page.locator('#mobile-bottom-nav').waitFor({ state: 'visible' });
    await bottomIs(page, 844);
    for (let index = 0; index < 3; index++) {
      await page.evaluate(() => window.scrollTo(0, 900));
      await viewport(page, { height: 812, innerHeight: 730, event: 'scroll' });
      await bottomIs(page, 812);
      await viewport(page, { height: 844, event: 'pageshow' });
      await bottomIs(page, 844);
    }
  });
}
test('body scroll locks, return from overlays, orientation and inert dialogs retain the same dock geometry', async t => {
  const page = await fixture(t, { standalone: true });
  await page.evaluate(() => {
    window.scrollTo(0, 600); document.body.classList.add('ts-scroll-lock'); document.body.style.top = '-600px';
  });
  await viewport(page, { height: 844 }); await bottomIs(page, 844);
  await page.evaluate(() => { document.body.classList.remove('ts-scroll-lock'); document.body.style.top = ''; window.scrollTo(0, 600); });
  await viewport(page, { height: 844, event: 'pageshow' }); await bottomIs(page, 844);
  await page.setViewportSize({ width: 844, height: 390 });
  await viewport(page, { height: 390, innerHeight: 390 });
  assert.equal(await page.locator('#mobile-bottom-nav').isVisible(), false);
  assert.equal(await page.locator('#desktop-left-nav').isVisible(), true);
  await page.setViewportSize({ width: 390, height: 844 });
  await viewport(page, { height: 844 }); await bottomIs(page, 844);
  await page.evaluate(() => document.querySelector('#application-root').inert = true);
  assert.equal(await page.locator('#mobile-bottom-nav').evaluate(nav => Boolean(nav.closest('[inert]'))), true, 'App dialogs still disable the navigation');
});
test('guest navigation has the same opaque bottom coverage and safe-area padding', async t => {
  const page = await fixture(t, { guest: true });
  await viewport(page, { height: 812, innerHeight: 730 }); await bottomIs(page, 812);
  assert.equal(await page.locator('#mobile-tab-btn-map').isVisible(), true);
  assert.equal(await page.locator('#mobile-bottom-nav').evaluate(nav => parseFloat(getComputedStyle(nav).paddingBottom) >= 4), true);
});
