import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { analyze, compare, included, cssRules, git } from '../tools/atlas/analyze.mjs';
import { generate } from '../tools/atlas/generate.mjs';

const root = mkdtempSync(path.join(tmpdir(), 'templesale-atlas-test-'));
const write = (file, content) => { mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); writeFileSync(path.join(root, file), content); };
const commit = message => { git(root, 'add', '.'); git(root, '-c', 'user.name=Atlas Fixture', '-c', 'user.email=atlas@example.test', 'commit', '-qm', message); return git(root, 'rev-parse', 'HEAD').trim(); };
let first, second, beforeAtlas, afterAtlas;
before(() => {
  git(root, 'init', '-q');
  write('src/main.tsx', `import App from './App'; import './index.css'; App();`);
  write('src/util.ts', `export const RESTORED='fixture:restored'; export function helper(){ return 1; } export function removed(){return false;}`);
  write('src/App.tsx', `import {helper as renamed,RESTORED} from './util';
declare function useState(value:boolean):[boolean,(v:boolean)=>void];
const [map,setMap]=useState(false);
const [,setSkipped]=useState(false); setSkipped(true);
export function open(){setMap(true); return renamed();}
for(const event of ['focus',RESTORED]) window.addEventListener(event,()=>{});
window.dispatchEvent(new Event(RESTORED));
const timer=setTimeout(()=>{},1000);
export default function App(){return <div id="dock" className={map?'bar active':'bar'} />;}
`);
  write('src/index.css', `/* comment { } */\n@media (max-width:639px) { .bar, #dock { position:relative; content:"}"; } }\n@keyframes bounce { 0% {transform:none;} }`);
  write('server.ts', `declare const app:any; app.get(['/api/example','/api/alias'],()=>{}); app.use('/api',()=>{});`);
  write('tests/example.test.mjs', `import {helper} from '../src/util.ts'; test('literal <script> name',()=>helper());`);
  write('.github/workflows/example.yml', 'run: node --test tests/example.test.mjs');
  write('vercel.json', '{"privateValue":"DO_NOT_PUBLISH_CONFIG_CONTENT"}');
  write('.env', 'SECRET=DO_NOT_PUBLISH_ENV');
  write('backup.sql', 'DO_NOT_PUBLISH_DATABASE');
  write('data/example.ts', 'DO_NOT_PUBLISH_DATA');
  write('tools/atlas/flows.json', JSON.stringify([{id:'dock',title:'Dock',description:'Fixture',steps:[{file:'src/App.tsx',anchor:'const [map,setMap]',label:'State'}],tests:['tests/example.test.mjs']}]));
  first = commit('first'); beforeAtlas = analyze(root, first);
  write('src/util.ts', `export const RESTORED='fixture:restored'; export function helper(){ return 2; } export function added(){return true;}`);
  write('src/App.tsx', '\n\n' + readFileSync(path.join(root,'src/App.tsx'),'utf8'));
  second = commit('second'); afterAtlas = analyze(root, second);
});
after(() => rmSync(root, { recursive: true, force: true }));

test('atlas: inventories CSS, tests and configs without including secrets, backups or database files', () => {
  assert.ok(afterAtlas.files.some(f => f.path === 'src/index.css' && f.category === 'styles'));
  assert.ok(afterAtlas.files.some(f => f.path === 'vercel.json' && f.category === 'configuration'));
  assert.ok(!afterAtlas.files.some(f => /\.env|backup|^data\//.test(f.path)));
  const serialized = JSON.stringify(afterAtlas);
  for (const secret of ['DO_NOT_PUBLISH_CONFIG_CONTENT','DO_NOT_PUBLISH_ENV','DO_NOT_PUBLISH_DATABASE','DO_NOT_PUBLISH_DATA']) assert.ok(!serialized.includes(secret));
  assert.equal(included('public/photo.webp'), false);
});
test('atlas: reads committed blobs rather than dirty files in the checkout', () => {
  write('src/util.ts','export function uncommittedOnly(){}');
  const snapshot = analyze(root, first);
  assert.ok(snapshot.symbols.some(s => s.name === 'removed'));
  assert.ok(!snapshot.symbols.some(s => s.name === 'uncommittedOnly'));
});
test('atlas: resolves aliases, reverse imports and local CSS imports', () => {
  const app = afterAtlas.files.find(f => f.path === 'src/App.tsx');
  assert.deepEqual(app.imports, ['src/util.ts']);
  assert.ok(afterAtlas.files.find(f => f.path === 'src/util.ts').importedBy.includes('src/App.tsx'));
  assert.ok(afterAtlas.files.find(f => f.path === 'src/main.tsx').imports.includes('src/index.css'));
  const open = afterAtlas.symbols.find(s => s.name === 'open');
  assert.ok(open.calls.some(id => id.includes('#helper@')));
  assert.ok(afterAtlas.symbols.find(s => s.name === 'helper').calledBy.includes(open.id));
  assert.ok(afterAtlas.files.find(f => f.path === 'src/util.ts').transitiveImporters.includes('src/main.tsx'));
  assert.ok(!afterAtlas.symbols.some(s => s.name === 'timer'));
});
test('atlas: indexes media context and quoted braces without treating keyframes as component selectors', () => {
  assert.equal(afterAtlas.css.length, 1);
  const rule = afterAtlas.css[0];
  assert.equal(rule.selector, '.bar, #dock');
  assert.deepEqual(rule.context, ['@media (max-width:639px)']);
  assert.deepEqual(rule.candidates, ['src/App.tsx']);
  assert.equal(cssRules('test.css', '.outer { color:red; &:hover { height:2px; } }').length, 2);
});
test('atlas: links actual state setter bindings and resolves event constants and loop arrays', () => {
  const app = afterAtlas.files.find(f => f.path === 'src/App.tsx');
  assert.equal(app.states[0].name, 'map');
  assert.equal(app.states[0].writes.length, 1);
  assert.deepEqual(app.events.find(e => e.action === 'addEventListener').names, ['focus','fixture:restored']);
  assert.deepEqual(app.events.find(e => e.action === 'dispatchEvent').names, ['fixture:restored']);
});
test('atlas: separates aliases from USE mounts and labels workflow references without claiming test execution', () => {
  assert.equal(afterAtlas.stats.httpRegistrations, 2);
  assert.equal(afterAtlas.routes.length, 3);
  const testFile = afterAtlas.files.find(f => f.path === 'tests/example.test.mjs');
  assert.deepEqual(testFile.listedInWorkflows, ['.github/workflows/example.yml']);
  assert.equal(afterAtlas.flows[0].steps[0].status, 'located');
  assert.equal(afterAtlas.flows[0].steps[0].line, beforeAtlas.flows[0].steps[0].line + 2);
});
test('atlas: compares function content while ignoring changed line numbers', () => {
  const diff = compare(beforeAtlas, afterAtlas);
  assert.ok(diff.definitions.added.some(id => id.includes('#added@')));
  assert.ok(diff.definitions.removed.some(id => id.includes('#removed@')));
  assert.ok(diff.definitions.changed.some(id => id.includes('#helper@')));
  assert.ok(!diff.definitions.changed.some(id => id.startsWith('src/App.tsx#')));
});
test('atlas: exports deterministic static HTML with escaped names, source links and no scripts', () => {
  const out = path.join(root, 'atlas-output');
  generate({ root, ref: second, base: first, out, strict: true });
  const firstHtml = readFileSync(path.join(out,'index.html'),'utf8');
  generate({ root, ref: second, base: first, out, strict: true });
  assert.equal(firstHtml, readFileSync(path.join(out,'index.html'),'utf8'));
  assert.ok(firstHtml.includes('literal &lt;script&gt; name'));
  assert.ok(!/<script[\s>]/i.test(firstHtml));
  assert.ok(firstHtml.includes('/blob/' + second + '/'));
  assert.ok(firstHtml.includes('id="css"'));
  assert.throws(() => generate({root, ref:second,out:path.join(root,'src')}), /output directory/);
});
test('atlas: strict validation detects a stale flow reference before producing a misleading report', () => {
  write('tools/atlas/flows.json', JSON.stringify([{id:'missing',title:'Missing',description:'Fixture',steps:[{file:'src/App.tsx',anchor:'removed exact anchor',label:'Missing'}],tests:[]}]));
  const bad = commit('stale flow');
  assert.throws(() => generate({root,ref:bad,out:path.join(root,'atlas-output'),strict:true}), /missing-anchor/);
});
