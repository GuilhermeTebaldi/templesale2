// Mobile user agents exercise the real capture -> editor flow with synthetic files.
// No physical camera, permission grant, publication, or external API is used.
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync, readdirSync } from 'node:fs';
import { build } from 'esbuild';

const bundle = await build({
  stdin: { resolveDir: process.cwd(), loader: 'tsx', contents: `
    import React from 'react';
    import { flushSync } from 'react-dom';
    import { createRoot } from 'react-dom/client';
    import NewPublication from './src/components/NewPublication';
    import { usesSystemPhotoSourceMenu } from './src/components/photo-publisher/components/CameraCapture';
    import { savePublicationDraft } from './src/lib/publication-draft';
    import { I18nProvider } from './src/i18n/provider';
    window.seedDraft = async () => {
      const canvas = document.createElement('canvas'); canvas.width = 64; canvas.height = 64;
      const file = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      await savePublicationDraft(1, { file, source: file, caption: 'Bozza conservata', savedAt: Date.now() });
    };
    function Fixture() {
      const [open, setOpen] = React.useState(false);
      const input = React.useRef(null);
      return <><button id="fixture-plus" onClick={() => {
        if (usesSystemPhotoSourceMenu()) { flushSync(() => setOpen(true)); input.current.click(); }
        else setOpen(true);
      }}>+</button>{open && <NewPublication photoInputRef={input}
        establishment={{ id: 1, name: 'Camera fixture' }}
        onClose={() => { window.photoPickerClosed = true; setOpen(false); }}
        onPublished={() => { throw new Error('The test must not publish'); }}
      />}</>;
    }
    createRoot(document.getElementById('root')).render(<I18nProvider><Fixture /></I18nProvider>);
  ` },
  bundle: true, format: 'esm', write: false,
  define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env': '{}' },
});
const stylesheet = readFileSync('dist/assets/' + readdirSync('dist/assets').find(name => /^index-.*\.css$/.test(name)));
const server = createServer((request, response) => {
  if (request.url === '/fixture.js') {
    response.setHeader('Content-Type', 'text/javascript'); response.end(bundle.outputFiles[0].text);
  } else if (request.url === '/fixture.css') {
    response.setHeader('Content-Type', 'text/css'); response.end(stylesheet);
  } else if (request.url === '/photo-picker-background.webp') {
    response.setHeader('Content-Type', 'image/webp'); response.end(readFileSync('public/photo-picker-background.webp'));
  } else if (request.url === '/') {
    response.setHeader('Content-Type', 'text/html');
    response.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"><div id="root"></div><script type="module" src="/fixture.js"></script>');
  } else { response.statusCode = 404; response.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
after(() => new Promise(resolve => server.close(resolve)));
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH });
after(() => browser.close());
const devices = {
  iPhone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',
  Android: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/134.0.0.0 Mobile Safari/537.36',
  iPad: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15',
};
async function fixture(t, device) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, ...(device ? { userAgent: devices[device], isMobile: true, hasTouch: true } : {}) });
  t.after(() => context.close());
  await context.addInitScript(({ device }) => {
    localStorage.setItem('templesale_camera-used', 'true');
    Object.defineProperty(navigator, 'standalone', { value: true });
    if (device === 'iPad') {
      Object.defineProperty(navigator, 'platform', { value: 'MacIntel' });
      Object.defineProperty(navigator, 'maxTouchPoints', { value: 5 });
    }
    window.cameraRequests = 0;
    window.photoPickerGestures = [];
    document.addEventListener('click', event => {
      if (event.target.id === 'publication-native-photo-input') window.photoPickerGestures.push(navigator.userActivation.isActive);
    }, true);
    Object.defineProperty(navigator, 'permissions', { value: { query: async () => ({ state: 'prompt' }) } });
    Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia: async () => {
      window.cameraRequests++; throw Object.assign(new Error('Fixture permission denied'), { name: 'NotAllowedError' });
    } } });
  }, { device });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  t.after(() => assert.deepEqual(errors, []));
  await page.goto('http://127.0.0.1:' + server.address().port);
  await page.locator('#fixture-plus').waitFor();
  if (device !== 'iPhone' && device !== 'iPad') {
    await page.locator('#fixture-plus').click();
    await page.locator(device ? '#native-photo-options' : '#camera-capture-container').waitFor();
  }
  return page;
}
async function choosePhoto(page, selector) {
  const photo = await page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width = 64; canvas.height = 64;
    const context = canvas.getContext('2d'); context.fillStyle = '#159e70'; context.fillRect(0, 0, 64, 64);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  const pending = page.waitForEvent('filechooser');
  await page.locator(selector).click();
  const chooser = await pending;
  await chooser.setFiles({ name: 'scatto.png', mimeType: 'image/png', buffer: Buffer.from(photo, 'base64') });
  await page.locator('#post-caption-textarea').waitFor({ state: 'visible' });
}
for (const device of ['Android']) {
  test(`${device}: native capture returns to the existing photo editor and caption without a video permission request`, async t => {
    const page = await fixture(t, device);
    assert.equal(await page.locator('#camera-capture-container').count(), 0, 'The intermediate camera screen is not mounted');
    assert.equal(await page.getByRole('button', { name: 'Galleria', exact: true }).isVisible(), true);
    assert.equal(await page.locator('#native-camera-input').getAttribute('capture'), 'environment');
    assert.equal(await page.evaluate(() => window.cameraRequests), 0);
    await choosePhoto(page, '#btn-capture-shutter');
    await page.locator('#post-caption-textarea').fill('Didascalia dopo la foto');
    assert.equal(await page.locator('#post-caption-textarea').inputValue(), 'Didascalia dopo la foto');
    await page.locator('#btn-back-camera').click();
    await page.locator('#native-photo-options').waitFor();
    const pending = page.waitForEvent('filechooser');
    await page.locator('#btn-capture-shutter').click();
    await (await pending).setFiles([]);
    assert.equal(await page.locator('#native-photo-options').count(), 1, 'Cancellation keeps camera and gallery options available');
    await choosePhoto(page, '#btn-capture-shutter');
    assert.equal(await page.evaluate(() => window.cameraRequests), 0, 'Repeated photos do not reacquire a video stream');
  });
}
for (const device of ['iPhone', 'iPad']) {
  test(`${device}: + opens the system source menu directly, then the existing editor`, async t => {
    const page = await fixture(t, device);
    await choosePhoto(page, '#fixture-plus');
    assert.equal(await page.locator('#native-photo-options').count(), 0);
    assert.equal(await page.locator('#camera-capture-container').count(), 0);
    assert.equal(await page.locator('#publication-native-photo-input').getAttribute('capture'), null);
    assert.equal(await page.locator('#publication-native-photo-input').getAttribute('accept'), 'image/*');
    await page.locator('#post-caption-textarea').fill('Foto dal selettore del telefono');
    assert.equal(await page.locator('#post-caption-textarea').inputValue(), 'Foto dal selettore del telefono');
    const cancelled = page.waitForEvent('filechooser');
    await page.locator('#btn-back-camera').click(); await cancelled;
    await page.locator('#publication-native-photo-input').dispatchEvent('cancel');
    assert.equal(await page.locator('#post-caption-textarea').inputValue(), 'Foto dal selettore del telefono');
    // The replacement action opens the same native menu from its own tap.
    await choosePhoto(page, '#btn-back-camera');
    await page.waitForFunction(() => document.querySelector('#post-caption-textarea')?.value === '');
    assert.deepEqual(await page.evaluate(() => window.photoPickerGestures), [true, true, true], 'Both pickers open inside an active user gesture');
    assert.equal(await page.evaluate(() => window.cameraRequests), 0);
  });
  test(`${device}: cancelling the source picker returns to the feed without a custom menu`, async t => {
    const page = await fixture(t, device);
    const pending = page.waitForEvent('filechooser');
    await page.locator('#fixture-plus').click(); await pending;
    await page.locator('#publication-native-photo-input').dispatchEvent('cancel');
    await page.waitForFunction(() => window.photoPickerClosed);
    assert.equal(await page.locator('#native-photo-options').count(), 0);
    assert.equal(await page.locator('#post-caption-textarea').count(), 0);
  });
}
test('cancelling the system picker preserves and restores an existing draft', async t => {
  const page = await fixture(t, 'iPhone');
  await page.evaluate(() => window.seedDraft());
  const pending = page.waitForEvent('filechooser');
  await page.locator('#fixture-plus').click(); await pending;
  await page.locator('#publication-native-photo-input').dispatchEvent('cancel');
  await page.locator('#post-caption-textarea').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#post-caption-textarea').inputValue(), 'Bozza conservata');
  assert.equal(await page.evaluate(() => Boolean(window.photoPickerClosed)), false);
});
test('choosing a new system photo replaces a recovered draft without stale caption or upload state', async t => {
  const page = await fixture(t, 'iPhone');
  await page.evaluate(() => window.seedDraft());
  await choosePhoto(page, '#fixture-plus');
  await page.waitForFunction(() => document.querySelector('#post-caption-textarea')?.value === '');
  assert.equal(await page.getByText('Bozza recuperata. Puoi riprendere la pubblicazione.').count(), 0);
});
test('mobile gallery still opens the same editor without requesting a video stream', async t => {
  const page = await fixture(t, 'Android');
  assert.equal(await page.locator('#gallery-file-input').getAttribute('capture'), null);
  await choosePhoto(page, '#btn-open-gallery');
  assert.equal(await page.evaluate(() => window.cameraRequests), 0);
});
test('mobile photo choices show the decorative background and can be closed', async t => {
  const page = await fixture(t, 'Android');
  const image = page.locator('#native-photo-options img');
  await image.evaluate(element => element.decode());
  assert.equal(await image.getAttribute('alt'), '');
  assert.equal(await image.evaluate(element => element.naturalWidth > 0), true);
  if (process.env.PHOTO_PICKER_SCREENSHOT) await page.screenshot({ path: process.env.PHOTO_PICKER_SCREENSHOT });
  await page.getByRole('button', { name: 'Chiudi', exact: true }).click();
  assert.equal(await page.evaluate(() => window.photoPickerClosed), true);
  assert.equal(await page.evaluate(() => window.cameraRequests), 0);
});
test('desktop retains its existing video-camera request and retry behavior', async t => {
  const page = await fixture(t);
  await page.locator('#btn-retry-camera').waitFor();
  assert.equal(await page.locator('#native-camera-input').count(), 0);
  assert.equal(await page.evaluate(() => window.cameraRequests), 1);
  await page.locator('#btn-retry-camera').click();
  assert.equal(await page.evaluate(() => window.cameraRequests), 2);
});
