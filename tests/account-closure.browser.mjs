// Run with PLAYWRIGHT_MODULE / PLAYWRIGHT_EXECUTABLE_PATH when needed.
// Only the real drawer is mounted; closure callbacks are fake and no account API is called.
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { build } from 'esbuild';

const bundle = await build({
  stdin: { resolveDir: process.cwd(), loader: 'tsx', contents: `
    import React from 'react';
    import { createRoot } from 'react-dom/client';
    import { CompanyProfileDrawer } from './src/components/CompanyProfileDrawer';
    window.closureFixture = { calls: [] };
    createRoot(document.getElementById('root')).render(<CompanyProfileDrawer
      isOpen={true} onClose={() => {}} savedPosts={[]} onOpenPost={() => {}}
      onToggleSavePost={() => {}} onOpenEditCompany={() => {}} onViewPublicProfile={() => {}}
      company={{ id: 'company_1', name: 'Fixture', logo: '', category: '', city: '', description: '', whatsapp: '', address: '', mapQuery: '', hours: '', keywords: [], isOwner: true, createdAt: '' }}
      user={{ isAuthenticated: true, name: 'Fixture', email: 'Owner@Example.test', picture: '', companyId: 'company_1' }}
      onCloseAccount={(mode, confirmation) => new Promise((resolve, reject) => {
        window.closureFixture.calls.push({ mode, confirmation });
        window.closureFixture.resolve = resolve;
        window.closureFixture.fail = () => reject(new Error('Fixture request failed'));
      })}
    />);
  ` },
  bundle: true, format: 'esm', write: false,
  define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env': '{}' },
  loader: { '.png': 'dataurl', '.svg': 'dataurl' },
});
const server = createServer((request, response) => {
  if (request.url === '/fixture.js') {
    response.setHeader('Content-Type', 'text/javascript');
    response.end(bundle.outputFiles[0].text);
  } else if (request.url === '/') {
    response.setHeader('Content-Type', 'text/html');
    response.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div><script type="module" src="/fixture.js"></script>');
  } else { response.statusCode = 404; response.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
after(() => new Promise(resolve => server.close(resolve)));
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH });
after(() => browser.close());

async function fixture(t) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  t.after(() => context.close());
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'standalone', { value: true });
    window.confirm = () => { throw new Error('Native confirmation must not be required'); };
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  t.after(() => assert.deepEqual(errors, []));
  await page.goto('http://127.0.0.1:' + server.address().port);
  await page.getByRole('button', { name: /Impostazioni/ }).click();
  await page.getByRole('button', { name: 'Disattiva o elimina account', exact: true }).click();
  return page;
}

test('mobile closure accepts email case/outer spaces, preserves canonical email and submits once after confirmation', async t => {
  const page = await fixture(t);
  const email = page.getByRole('textbox');
  const action = page.getByRole('button', { name: 'Disattiva attività', exact: true });
  assert.equal(await action.isDisabled(), true);
  await email.fill('other@example.test');
  assert.equal(await action.isDisabled(), true);
  await email.fill(' owner@example.test ');
  assert.equal(await action.isEnabled(), true);
  await action.click();
  assert.deepEqual(await page.evaluate(() => window.closureFixture.calls), []);
  const confirm = page.getByRole('button', { name: 'Conferma disattivazione', exact: true });
  await confirm.click();
  assert.deepEqual(await page.evaluate(() => window.closureFixture.calls), [{ mode: 'deactivate', confirmation: 'Owner@Example.test' }]);
  assert.equal(await page.getByRole('button', { name: 'Elaborazione…', exact: true }).isDisabled(), true);
  assert.equal(await email.isDisabled(), true);
  await page.evaluate(() => window.closureFixture.fail());
  await page.getByRole('alert').filter({ hasText: 'Fixture request failed' }).waitFor();
  assert.equal(await action.isEnabled(), true);
});

test('deletion requires its own explicit confirmation; cancel and edits do not submit', async t => {
  const page = await fixture(t);
  const email = page.getByRole('textbox');
  await email.fill('owner@example.test');
  await page.getByRole('button', { name: 'Disattiva attività', exact: true }).click();
  await page.getByRole('button', { name: 'Annulla', exact: true }).click();
  await page.getByRole('button', { name: /^Elimina definitivamente da TempleSale/ }).click();
  const action = page.getByRole('button', { name: 'Elimina definitivamente', exact: true });
  await action.click();
  await page.getByText(/L’operazione non è reversibile/).waitFor();
  await email.fill('different@example.test');
  assert.equal(await action.isDisabled(), true);
  assert.equal(await page.getByRole('button', { name: 'Conferma eliminazione', exact: true }).count(), 0);
  await email.fill('OWNER@EXAMPLE.TEST');
  await action.click();
  assert.deepEqual(await page.evaluate(() => window.closureFixture.calls), []);
  await page.getByRole('button', { name: 'Conferma eliminazione', exact: true }).click();
  assert.deepEqual(await page.evaluate(() => window.closureFixture.calls), [{ mode: 'delete', confirmation: 'Owner@Example.test' }]);
});
