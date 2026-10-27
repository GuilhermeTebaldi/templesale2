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
    import NewPublication from './src/components/NewPublication';
    import ProductMap from './src/components/ProductMap';
    import EditePerfil from './src/components/EditePerfil';
    import { AnimatePresence, motion } from 'motion/react';
    import { notifyOverlayViewportRestored } from './src/lib/overlay-viewport';
    api.getBusinessCategorySuggestions = async () => ['Altro','Bar','Mago'].map(label => ({label,key:label.toLowerCase(),keywords:[]}));
    api.getEstablishments = async () => [];
    api.getDiscovery = async () => ({ items: [] });
    import { api } from './src/lib/api';
    import { savePublicationDraft } from './src/lib/publication-draft';
    api.createPublication = () => new Promise(resolve => {
      window.completePublication = () => resolve({ id: 77, establishmentId: 1, imageUrl: '/fixture-photo.png', caption: 'Test', createdAt: Date.now() });
    });
    async function seedPublication() {
      const canvas = document.createElement('canvas'); canvas.width = 64; canvas.height = 64;
      const file = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      await savePublicationDraft(1, { file, source: file, uploadedUrl: '/fixture-photo.png', caption: 'Bozza', savedAt: Date.now() });
    }
    import { I18nProvider } from './src/i18n/provider';
    function Fixture() {
      const [tab, setTab] = React.useState('profile');
      const [editorOpen, setEditorOpen] = React.useState(false);
      const [mapOpen, setMapOpen] = React.useState(false);
      const [profileOpen, setProfileOpen] = React.useState(false);
      const [futureOpen, setFutureOpen] = React.useState(false);
      const [publishing, setPublishing] = React.useState(false);
      React.useEffect(() => {
        if (profileOpen || futureOpen || mapOpen || (editorOpen && !publishing)) { document.body.classList.add('ts-scroll-lock'); document.body.style.top = '-600px'; }
        else { document.body.classList.remove('ts-scroll-lock'); document.body.style.top = ''; }
        return () => { document.body.classList.remove('ts-scroll-lock'); document.body.style.top = ''; };
      }, [editorOpen, publishing, mapOpen, profileOpen, futureOpen]);
      const registered = !new URLSearchParams(location.search).has('guest');
      return <div id="application-root"><Header activeTab={tab} setActiveTab={setTab}
        unreadNotificationsCount={0} onToggleNotifications={() => {}}
        onOpenCreatePost={() => { window.publishClicks = (window.publishClicks || 0) + 1; }}
        onOpenCompanyModal={() => {}} searchQuery="" onSearchChange={() => {}}
        user={{ isAuthenticated: registered, name: 'Fixture', picture: '' }}
        activeCompany={{ name: 'Fixture', logo: '' }} />
        <main style={{ minHeight: 4000, paddingBottom: 96 }}><button id="open-profile" onClick={()=>setProfileOpen(true)}>Profilo</button><button id="open-future" onClick={()=>setFutureOpen(true)}>Nuova pagina</button><button id="open-map" onClick={() => setMapOpen(true)}>Mappa</button><button id="open-publication" onClick={async () => { await seedPublication(); setEditorOpen(true); }}>Editor</button><input id="keyboard-input" aria-label="Testo" />
          <div id="profile-grid" style={{ height: 3900, background: 'repeating-linear-gradient(#d8eee7 0 160px, #e8dce9 160px 320px)' }}>Profilo</div>
        </main>{editorOpen && <NewPublication establishment={{ id: 1, name: 'Fixture' }}
          onPublishStarted={() => {
            window.focusAtPublishStart = document.activeElement?.id;
            setPublishing(true); setTab('feed'); window.publicationStarted = true;
          }}
          onPublished={() => { window.publicationConfirmed = true; }}
          onPublishFailed={error => { window.publicationFailure = error.message; }}
          onPublishFinished={() => setPublishing(false)}
          onClose={() => { window.focusAtClose = document.activeElement?.id; setEditorOpen(false); setTab('feed'); window.editorClosed = true; }}
        />}<AnimatePresence onExitComplete={() => {
          window.dockBeforeMapExitComplete = document.querySelector('#mobile-navigation-viewport');
          notifyOverlayViewportRestored(); window.mapExitComplete = true;
        }}>{mapOpen && <ProductMap products={[]} initialCategory="Fixture" autoFocusPanelSearch
          onClose={() => setMapOpen(false)} />}</AnimatePresence>
        <AnimatePresence onExitComplete={()=>{window.dockAtProfileExit=document.querySelector('#mobile-navigation-viewport');window.profileExitComplete=true;}}>
          {profileOpen&&<EditePerfil initialData={{id:1,name:'Proprietario',email:'owner@example.test',whatsappNumber:'3331234567',city:'Ardea'}}
            initialEstablishment={{id:7,ownerId:1,name:'Attività',category:'Altro',city:'Ardea',latitude:41.6,longitude:12.5,keywords:[]}}
            onClose={()=>setProfileOpen(false)} onSave={async(_,data)=>{window.profileSaved=data;}}/>}
        </AnimatePresence>
        <AnimatePresence onExitComplete={()=>{window.dockAtFutureExit=document.querySelector('#mobile-navigation-viewport');window.futureExitComplete=true;}}>
          {futureOpen&&<motion.section className="fixed inset-0 z-150 bg-white" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.2}}>
            <input aria-label="Campo nuova pagina"/><button onClick={()=>setFutureOpen(false)}>Chiudi nuova pagina</button>
          </motion.section>}
        </AnimatePresence></div>;
    }
    createRoot(document.getElementById('root')).render(<I18nProvider><Fixture /></I18nProvider>);
  ` }, bundle: true, format: 'esm', write: false,
  define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env': '{}' },
});
const stylesheet = readFileSync('dist/assets/' + readdirSync('dist/assets').find(name => /^index-.*\.css$/.test(name)), 'utf8')
  .replaceAll('height:100vh', 'height:var(--test-large-height,100vh)');
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
  // No map service or real API is needed to exercise the overlay lifecycle.
  await page.route('https://**/*', route => route.abort());
  page.on('pageerror', error => errors.push(error.message));
  t.after(() => assert.deepEqual(errors, []));
  await page.goto('http://127.0.0.1:' + server.address().port + (guest ? '/?guest' : '/'));
  await page.locator('#mobile-bottom-nav').waitFor({ state: 'visible' });
  return page;
}
async function viewport(page, state) {
  if (state.cssHeight) await page.setViewportSize({ width: page.viewportSize().width, height: state.cssHeight });
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
      { height: 844, cssHeight: 844 }, { height: 730, innerHeight: 844, cssHeight: 730 },
      { height: 812, innerHeight: 730, cssHeight: 812 }, // Resize events can arrive out of order.
      { height: 780, offsetTop: 24, cssHeight: 844 },
      { height: 844, offsetTop: -60, cssHeight: 844 }, // Elastic top overscroll is not an upward offset.
      { height: 844, cssHeight: 844 }, { height: 730, cssHeight: 730 }, { height: 844, cssHeight: 844 },
    ];
    for (const [index, state] of sizes.entries()) {
      await page.evaluate(y => window.scrollTo(0, y), index % 2 ? 850 : 40);
      await viewport(page, state);
      await bottomIs(page, state.cssHeight);
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
    assert.equal(await page.locator('#mobile-bottom-nav').isVisible(), true);
    await bottomIs(page, 844); // Blur cannot leave it sized to the keyboard.
    await viewport(page, { height: 844 });
    await page.locator('#mobile-bottom-nav').waitFor({ state: 'visible' });
    await bottomIs(page, 844);
    for (let index = 0; index < 3; index++) {
      await page.evaluate(() => window.scrollTo(0, 900));
      await viewport(page, { height: 812, innerHeight: 730, cssHeight: 812, event: 'scroll' });
      await bottomIs(page, 812);
      await viewport(page, { height: 844, cssHeight: 844, event: 'pageshow' });
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
  await viewport(page, { height: 844, cssHeight: 844, event: 'pageshow' }); await bottomIs(page, 844);
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
  await viewport(page, { height: 812, innerHeight: 730, cssHeight: 812 }); await bottomIs(page, 812);
  assert.equal(await page.locator('#mobile-tab-btn-map').isVisible(), true);
  assert.equal(await page.locator('#mobile-bottom-nav').evaluate(nav => parseFloat(getComputedStyle(nav).paddingBottom) >= 4), true);
});

for (const publish of [true, false]) {
  test(`${publish ? 'publishing' : 'closing'} the real editor with a focused caption cannot leave navigation at a frozen keyboard height`, async t => {
    const page = await fixture(t, { standalone: true });
    await page.locator('#open-publication').click();
    const caption = page.locator('#post-caption-textarea');
    await caption.waitFor({ state: 'visible' });
    await caption.fill('Foto con didascalia'); await caption.focus();
    await viewport(page, { height: 420, offsetTop: 80 });
    assert.equal(await page.locator('#mobile-bottom-nav').isVisible(), false);
    assert.equal(await page.evaluate(() => document.body.classList.contains('ts-scroll-lock')), true);
    // Safari buttons do not necessarily take focus; a DOM click deliberately
    // leaves the caption focused until the real publication handler blurs it.
    await page.locator(publish ? '#btn-caption-publish' : '#btn-header-close').evaluate(button => button.click());
    await page.waitForFunction(publish => publish ? window.publicationStarted : window.editorClosed, publish);
    assert.notEqual(await page.evaluate(publish => publish ? window.focusAtPublishStart : window.focusAtClose, publish), 'post-caption-textarea');
    // The keyboard is gone, but Safari can retain these short measurements.
    // Deliberately never restore them, including during subsequent scrolling.
    await viewport(page, { height: 724, innerHeight: 724 });
    await page.locator('#mobile-bottom-nav').waitFor({ state: 'visible' });
    await bottomIs(page, 844);
    assert.equal(await page.evaluate(() => document.body.classList.contains('ts-scroll-lock')), false);
    assert.equal(await page.evaluate(() => document.documentElement.style.getPropertyValue('--ts-publication-vh')), '', 'The hidden publisher releases viewport effects before the upload finishes');
    assert.equal(await page.locator('#mobile-navigation-viewport').evaluate(frame => frame.style.height), '', 'No frozen pixel height remains on the frame');
    if (publish) {
      await page.waitForFunction(() => typeof window.completePublication === 'function');
      await page.evaluate(() => window.completePublication());
      await page.waitForFunction(() => window.publicationConfirmed && window.editorClosed);
      assert.equal(await page.evaluate(() => window.publicationFailure), undefined);
    }
    for (const y of [900, 40, 1200, 0]) {
      await page.evaluate(y => window.scrollTo(0, y), y);
      await viewport(page, { height: 724, innerHeight: 724, event: 'scroll' });
      await bottomIs(page, 844);
    }
    await page.locator('#mobile-bottom-nav').getByRole('button', { name: 'Attività', exact: true }).click();
    await bottomIs(page, 844);
  });
}

for (const standalone of [false, true]) {
  test(`${standalone ? 'installed app' : 'browser'}: leaving the real map releases search focus and refreshes the dock after its exit animation`, async t => {
    const page = await fixture(t, { standalone });
    for (const focused of [true, false]) {
      await page.evaluate(() => {
        window.scrollTo(0, 600);
        window.mapExitComplete = false;
        window.dockBeforeMap = document.querySelector('#mobile-navigation-viewport');
        document.querySelector('#open-map').click();
      });
      const close = page.locator('button[title="Chiudi mappa"]');
      await close.waitFor({ state: 'visible' });
      await page.waitForFunction(() => document.activeElement instanceof HTMLInputElement);
      if (!focused) await page.evaluate(() => document.activeElement.blur());
      await viewport(page, focused ? { height: 420, offsetTop: 80 } : { height: 844 });
      // A DOM click leaves the map search focused, as Safari touch buttons can.
      await close.evaluate(button => button.click());
      await page.waitForFunction(() => !document.body.classList.contains('ts-scroll-lock'));
      assert.equal(await page.evaluate(() => document.activeElement instanceof HTMLInputElement), false, 'Search is blurred when exit starts, before the animated map unmounts');
      await page.waitForFunction(() => window.mapExitComplete);
      await close.waitFor({ state: 'detached' });
      await viewport(page, { height: 724, innerHeight: 724 });
      await bottomIs(page, 844);
      assert.equal(await page.evaluate(() => window.dockBeforeMapExitComplete !== document.querySelector('#mobile-navigation-viewport')), true, 'The dock is refreshed after the exit animation, not only when the body unlocks');
      assert.equal(await page.evaluate(() => window.dockBeforeMap !== document.querySelector('#mobile-navigation-viewport')), true, 'The fixed layer is renewed rather than retaining its old viewport origin');
      assert.equal(await page.locator('#mobile-navigation-viewport').evaluate(frame => frame.style.height), '');
      for (const y of [600, 1100, 40]) {
        await page.evaluate(y => window.scrollTo(0, y), y);
        await viewport(page, { height: 724, innerHeight: 724, event: 'scroll' });
        await bottomIs(page, 844);
      }
      await page.locator('#mobile-bottom-nav').getByRole('button', { name: 'Attività', exact: true }).click();
    }
  });
}

test('closing the map immediately cancels its delayed search autofocus', async t => {
  const page = await fixture(t, { standalone: true });
  await page.evaluate(() => document.querySelector('#open-map').click());
  await page.locator('button[title="Chiudi mappa"]').evaluate(button => button.click());
  await page.waitForFunction(() => window.mapExitComplete);
  assert.equal(await page.evaluate(() => document.activeElement instanceof HTMLInputElement), false);
  await bottomIs(page, 844);
});

for (const standalone of [false, true]) {
  for (const action of ['cancel', 'save', 'discard']) test(`${standalone ? 'installed app' : 'browser'}: category ${action} restores navigation after the real profile exit without a per-page recovery callback`, async t => {
    const page = await fixture(t, { standalone });
    await page.locator('#open-profile').click();
    const category = page.getByRole('combobox', { name: 'Categoria dell’attività', exact: true });
    await category.click();
    await page.getByRole('option', { name: 'Bar', exact: true }).waitFor();
    await viewport(page, { height: 420, offsetTop: 80, innerHeight: 420 });
    if (action === 'cancel') await page.getByRole('option', { name: 'Altro', exact: true }).click();
    if (action === 'save') {
      await page.getByRole('option', { name: 'Bar', exact: true }).click();
      await page.getByRole('button', { name: /Salva/ }).evaluate(button => button.click());
    } else {
      if (action === 'discard') await category.fill('Nuova categoria');
      await page.getByRole('button', { name: 'Chiudi modifica profilo' }).evaluate(button => button.click());
      if (action === 'discard') await page.getByRole('button', { name: 'Esci senza salvare' }).evaluate(button => button.click());
    }
    await page.waitForFunction(() => window.profileExitComplete);
    await page.locator('.ts-profile-editor').waitFor({ state: 'detached' });
    await viewport(page, { height: 724, innerHeight: 724 });
    assert.equal(await page.evaluate(() => window.dockAtProfileExit !== document.querySelector('#mobile-navigation-viewport')), true, 'Refresh follows the actual profile removal, including its animation');
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('role') === 'combobox'), false);
    assert.equal(await page.evaluate(() => document.body.classList.contains('ts-scroll-lock')), false);
    if (action === 'save') assert.equal(await page.evaluate(() => window.profileSaved.category), 'Bar');
    else assert.equal(await page.evaluate(() => window.profileSaved), undefined);
    for (const y of [900, 40, 1200, 0]) { await page.evaluate(y => window.scrollTo(0,y),y); await bottomIs(page,844); }
  });
  test(`${standalone ? 'installed app' : 'browser'}: a new animated page inherits navigation recovery without importing a helper`, async t => {
    const page = await fixture(t, { standalone });
    await page.locator('#open-future').click();
    await page.getByRole('textbox', { name: 'Campo nuova pagina' }).focus();
    await viewport(page, { height: 420, offsetTop: 80, innerHeight: 420 });
    await page.getByRole('button', { name: 'Chiudi nuova pagina' }).evaluate(button => button.click());
    await page.waitForFunction(() => window.futureExitComplete);
    await viewport(page, { height: 724, innerHeight: 724 });
    assert.equal(await page.evaluate(() => window.dockAtFutureExit !== document.querySelector('#mobile-navigation-viewport')), true, 'No manual viewport-restored event is required');
    await bottomIs(page,844);
  });
}

test('central recovery covers nested portal dialogs and ignores ordinary feed updates', async t => {
  const page = await fixture(t);
  await page.evaluate(() => {
    window.originalDock = document.querySelector('#mobile-navigation-viewport');
    const caption = document.createElement('p'); caption.textContent = 'Aggiornamento';
    document.querySelector('#profile-grid').append(caption); caption.style.opacity = '0.9'; caption.remove();
  });
  await viewport(page, { height: 844 });
  assert.equal(await page.evaluate(() => window.originalDock === document.querySelector('#mobile-navigation-viewport')), true);
  await page.evaluate(() => {
    const portal = document.createElement('div'); portal.id = 'future-portal';
    portal.innerHTML = '<section role="dialog" style="position:fixed;inset:0">Dialogo futuro</section>';
    document.body.append(portal);
  });
  await page.locator('#future-portal').waitFor({ state: 'attached' });
  await page.evaluate(() => document.querySelector('#future-portal').remove());
  await viewport(page, { height: 844 });
  assert.equal(await page.evaluate(() => window.originalDock !== document.querySelector('#mobile-navigation-viewport')), true);
  await bottomIs(page, 844);
});

test('desktop member navigation exposes existing map, profile, notification and publish controls with labels', async t => {
  const page = await fixture(t);
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const id of ['map','profile','notifications','publish']) {
    await page.locator('#desktop-rail-'+id).waitFor({ state: 'visible' });
    assert.equal(await page.locator('#desktop-rail-'+id+' .ts-desktop-nav-label').isVisible(), true);
  }
  await page.locator('#desktop-rail-publish').click();
  assert.equal(await page.evaluate(() => window.publishClicks), 1);
  assert.equal(await page.locator('#mobile-bottom-nav').isVisible(), false);
});

for (const guest of [false,true]) test(`${guest?'guest':'member'} installed app: repeated map returns keep all buttons visible with oversized legacy vh and late viewport events`, async t => {
  const page=await fixture(t,{standalone:true,guest});
  for(let attempt=0;attempt<2;attempt++) {
    await page.evaluate(()=>{window.mapExitComplete=false;document.querySelector('#open-map').click();});
    const close=page.locator('button[title="Chiudi mappa"]');await close.waitFor();
    await page.waitForFunction(()=>document.activeElement instanceof HTMLInputElement);
    await viewport(page,{height:420,offsetTop:80});
    await page.evaluate(()=>document.documentElement.style.setProperty('--test-large-height','928px'));
    await close.evaluate(button=>button.click());
    await page.waitForFunction(()=>window.mapExitComplete);await close.waitFor({state:'detached'});
    await page.waitForTimeout(450);
    await page.evaluate(()=>{window.dockAfterExit=document.querySelector('#mobile-navigation-viewport');});
    await viewport(page,{height:724,innerHeight:724,offsetTop:80});
    await bottomIs(page,844);
    await page.waitForFunction(()=>window.dockAfterExit!==document.querySelector('#mobile-navigation-viewport'), null, {timeout:5000});
    await bottomIs(page,844);
    assert.equal(await page.locator('#mobile-navigation-viewport').evaluate(el=>el.style.height),'');
    for(const y of [40,900,600]) {await page.evaluate(y=>window.scrollTo(0,y),y);await bottomIs(page,844);}
    assert.equal(await page.evaluate(()=>document.querySelector('#mobile-bottom-nav').contains(document.elementFromPoint(10,842))),true);
    await page.waitForTimeout(1550);
    await page.evaluate(()=>{window.settledDock=document.querySelector('#mobile-navigation-viewport');});
    await viewport(page,{height:724,event:'scroll'});await page.waitForTimeout(400);
    assert.equal(await page.evaluate(()=>window.settledDock===document.querySelector('#mobile-navigation-viewport')),true,'Ordinary later scrolling must not keep remounting the dock');
  }
});

for (const standalone of [false, true]) test(`${standalone ? 'installed app' : 'browser'}: resuming from background renews the dock and waits for late viewport updates`, async t => {
  const page = await fixture(t, { standalone });
  for (let attempt = 0; attempt < 2; attempt++) {
    await page.evaluate(() => {
      window.scrollTo(0, 900);
      window.dockBeforeResume = document.querySelector('#mobile-navigation-viewport');
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await viewport(page, { height: 420, innerHeight: 420, offsetTop: 80 });
    assert.equal(await page.evaluate(() => window.dockBeforeResume === document.querySelector('#mobile-navigation-viewport')), true, 'Do not recover while backgrounded');
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForFunction(() => window.dockBeforeResume !== document.querySelector('#mobile-navigation-viewport'), null, {timeout:3000});
    await page.waitForTimeout(450);
    await page.evaluate(() => { window.dockBeforeLateResume = document.querySelector('#mobile-navigation-viewport'); });
    await viewport(page, { height: 724, innerHeight: 724, offsetTop: 80 });
    await page.waitForFunction(() => window.dockBeforeLateResume !== document.querySelector('#mobile-navigation-viewport'), null, {timeout:3000});
    await bottomIs(page, 844);
    assert.equal(await page.locator('#mobile-navigation-viewport').evaluate(frame => frame.style.height), '');
    assert.equal(await page.evaluate(() => window.scrollY), 900);
    await page.waitForTimeout(1600);
  }
});

test('BFCache and window-focus resumes recover centrally without discarding a focused draft', async t => {
  const page = await fixture(t, { standalone: true });
  const input = page.locator('#keyboard-input'); await input.fill('Bozza conservata'); await input.focus();
  await viewport(page, { height: 420, innerHeight: 420 });
  await page.evaluate(() => {
    window.focusedDock = document.querySelector('#mobile-navigation-viewport');
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    window.dispatchEvent(new Event('focus'));
  });
  await page.waitForTimeout(450);
  assert.equal(await input.inputValue(), 'Bozza conservata');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'keyboard-input');
  assert.equal(await page.evaluate(() => window.focusedDock === document.querySelector('#mobile-navigation-viewport')), true);
  await input.blur();
  await viewport(page, { height: 844, innerHeight: 844 });
  await page.waitForFunction(() => window.focusedDock !== document.querySelector('#mobile-navigation-viewport'));
  await bottomIs(page, 844);
  await page.waitForTimeout(1700);
  for (const event of ['pageshow','focus']) {
    await page.evaluate(event => {
      window.resumeDock = document.querySelector('#mobile-navigation-viewport');
      window.dispatchEvent(event === 'pageshow' ? new PageTransitionEvent('pageshow', {persisted:true}) : new Event('focus'));
    }, event);
    await page.waitForFunction(() => window.resumeDock !== document.querySelector('#mobile-navigation-viewport'), null, {timeout:3000});
    await bottomIs(page, 844);
  }
});
