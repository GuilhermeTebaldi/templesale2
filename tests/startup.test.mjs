import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const script = readFileSync(new URL('../public/startup.js', import.meta.url), 'utf8');
function fixture(href = 'https://www.templesale.com/', prerendered = false) {
  const listeners = new Map(), navigations = [];
  let rendered = false, replaced;
  class Script {}
  const window = {
    location: { href, replace: url => navigations.push(url) },
    history: { state: { keep: true }, replaceState: (state, title, url) => { replaced = { state, url }; } },
    addEventListener: (name, callback) => listeners.set(name, callback),
  };
  vm.runInNewContext(script, {
    window, URL, Date, HTMLScriptElement: Script,
    document: { getElementById: () => ({ hasChildNodes: () => rendered || prerendered, querySelector: () => prerendered && !rendered ? {} : null }) },
  });
  return {
    navigations, get replaced() { return replaced; },
    ready: () => { rendered = true; listeners.get('templesale:ready')(); },
    scriptError: () => listeners.get('error')({ target: new Script() }),
    runtimeError: () => listeners.get('error')({ target: window }),
    imageError: () => listeners.get('error')({ target: {} }),
    chunkError: () => { let prevented = false; listeners.get('vite:preloadError')({ preventDefault: () => { prevented = true; } }); return prevented; },
  };
}
test('a missing initial asset retries once without discarding route, auth parameters or hash', () => {
  const f = fixture('https://www.templesale.com/attivita/mago?code=example&state=keep#photo');
  f.scriptError(); f.scriptError();
  assert.equal(f.navigations.length, 1);
  const url = new URL(f.navigations[0]);
  assert.equal(url.pathname, '/attivita/mago');
  assert.equal(url.searchParams.get('code'), 'example');
  assert.equal(url.searchParams.get('state'), 'keep');
  assert.equal(url.hash, '#photo');
  assert.ok(url.searchParams.has('_ts_startup_retry'));
});
test('a failed retry does not cause a reload loop', () => {
  const f = fixture('https://www.templesale.com/?_ts_startup_retry=1');
  f.scriptError(); f.runtimeError(); f.chunkError();
  assert.deepEqual(f.navigations, []);
});
test('successful startup removes only its retry marker and preserves history state', () => {
  const f = fixture('https://www.templesale.com/?code=example&_ts_startup_retry=1#keep');
  f.ready();
  assert.equal(f.replaced.url, 'https://www.templesale.com/?code=example#keep');
  assert.deepEqual(f.replaced.state, { keep: true });
  f.scriptError(); f.runtimeError();
  assert.deepEqual(f.navigations, []);
});
test('a stale lazy chunk triggers recovery even after the initial render', () => {
  const f = fixture(); f.ready();
  assert.equal(f.chunkError(), true);
  assert.equal(f.navigations.length, 1);
});
test('initial runtime failures recover while the existing logo is prerendered', () => {
  const f = fixture('https://www.templesale.com/', true);
  f.imageError();
  assert.equal(f.navigations.length, 0, 'An image failure must not reload the page');
  f.runtimeError();
  assert.equal(f.navigations.length, 1);
});
