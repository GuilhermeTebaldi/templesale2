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
    import { createRoot } from 'react-dom/client';
    import NewPublication from './src/components/NewPublication';
    import { I18nProvider } from './src/i18n/provider';
    createRoot(document.getElementById('root')).render(<I18nProvider><NewPublication
      establishment={{ id: 1, name: 'Camera fixture' }} onClose={() => {}}
      onPublished={() => { throw new Error('The test must not publish'); }}
    /></I18nProvider>);
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
    Object.defineProperty(navigator, 'permissions', { value: { query: async () => ({ state: 'prompt' }) } });
    Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia: async () => {
      window.cameraRequests++; throw Object.assign(new Error('Fixture permission denied'), { name: 'NotAllowedError' });
    } } });
  }, { device });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  t.after(() => assert.deepEqual(errors, []));
  await page.goto('http://127.0.0.1:' + server.address().port);
  await page.locator('#camera-capture-container').waitFor();
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
for (const device of Object.keys(devices)) {
  test(`${device}: native capture returns to the existing photo editor and caption without a video permission request`, async t => {
    const page = await fixture(t, device);
    assert.equal(await page.locator('#native-camera-input').getAttribute('capture'), 'environment');
    assert.equal(await page.evaluate(() => window.cameraRequests), 0);
    await choosePhoto(page, '#btn-capture-shutter');
    await page.locator('#post-caption-textarea').fill('Didascalia dopo la foto');
    assert.equal(await page.locator('#post-caption-textarea').inputValue(), 'Didascalia dopo la foto');
    await page.locator('#btn-back-camera').click();
    await page.locator('#camera-capture-container').waitFor();
    const pending = page.waitForEvent('filechooser');
    await page.locator('#btn-capture-shutter').click();
    await (await pending).setFiles([]);
    assert.equal(await page.locator('#camera-capture-container').count(), 1, 'Cancellation keeps the camera chooser available');
    await choosePhoto(page, '#btn-capture-shutter');
    assert.equal(await page.evaluate(() => window.cameraRequests), 0, 'Repeated photos do not reacquire a video stream');
  });
}
test('mobile gallery still opens the same editor without requesting a video stream', async t => {
  const page = await fixture(t, 'iPhone');
  assert.equal(await page.locator('#gallery-file-input').getAttribute('capture'), null);
  await choosePhoto(page, '#btn-open-gallery');
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
