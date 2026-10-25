import {after,test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {build} from 'esbuild';
const bundle=await build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`
import React from 'react';import {createRoot} from 'react-dom/client';
import {ProgressiveProductImage} from './src/components/ProductCard';
import {preloadAdjacentImages,loadedImages} from './src/lib/image-memory';
const url=n=>'https://res.cloudinary.com/demo/image/upload/v1/'+n+'.jpg';
window.preload=(names)=>preloadAdjacentImages(names.map(url));window.cacheSize=()=>loadedImages.size;
function Fixture(){const [photo,setPhoto]=React.useState(null);return <><div id="grid">{['a','b'].map(n=><div key={n} style={{position:'relative',width:100,height:140}}><ProgressiveProductImage src={url(n)} alt={n} variant="thumbnail" loading="eager" className="photo"/><button onClick={()=>setPhoto(n)}>Open {n}</button></div>)}</div><button onClick={()=>setPhoto(null)}>Close</button>{photo&&<div id="viewer" style={{position:'relative',width:400,height:400}}><ProgressiveProductImage src={url(photo)} alt={photo} variant="full" loading="eager" className="photo"/></div>}</>}
createRoot(document.getElementById('root')).render(<Fixture/>);
`},bundle:true,format:'esm',write:false,define:{'process.env.NODE_ENV':'"production"','import.meta.env':'{}'}});
const server=createServer((req,res)=>{res.setHeader('content-type',req.url==='/fixture.js'?'text/javascript':'text/html');res.end(req.url==='/fixture.js'?bundle.outputFiles[0].text:'<style>.photo{width:100%;height:100px;object-fit:contain}#viewer .photo{height:100%}</style><div id="root"></div><script type="module" src="/fixture.js"></script>')});
await new Promise(r=>server.listen(0,'127.0.0.1',r));after(()=>new Promise(r=>server.close(r)));
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH});after(()=>browser.close());
const svg='<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="green"/></svg>';
async function setup(t, handler){const context=await browser.newContext();t.after(()=>context.close());const page=await context.newPage();const requests=[];await context.route('https://res.cloudinary.com/**',async route=>{requests.push(route.request().url());if(await handler?.(route))return;await route.fulfill({contentType:'image/svg+xml',body:svg})});await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>[...document.querySelectorAll('#grid img:not([aria-hidden])')].every(i=>i.complete&&i.naturalWidth>0&&i.style.opacity==='1'));return {page,requests};}
test('loaded thumbnail is visible immediately while full image is slow; no timed format restart',async t=>{
 let release;const gate=new Promise(r=>release=r);t.after(()=>release());
 const {page,requests}=await setup(t,async route=>{if(route.request().url().includes('w_1600')){await gate;await route.fulfill({contentType:'image/svg+xml',body:svg});return true;}});
 await page.getByText('Open a',{exact:true}).click();await page.waitForFunction(()=>document.querySelector('#viewer img[aria-hidden]')?.naturalWidth>0);
 assert.match(await page.locator('#viewer img[aria-hidden]').getAttribute('src'),/w_180/);
 assert.equal(await page.locator('#viewer img[aria-hidden]').evaluate(i=>getComputedStyle(i).position),'absolute');
 await page.waitForTimeout(3900);assert.equal(requests.filter(u=>/f_jpg|f_webp/.test(u)).length,0);
 release();await page.waitForFunction(()=>document.querySelector('#viewer img:not([aria-hidden])')?.style.opacity==='1');assert.equal(await page.locator('#viewer img[aria-hidden]').count(),0);
 await page.getByText('Close',{exact:true}).click();await page.getByText('Open a',{exact:true}).click();await page.waitForFunction(()=>document.querySelector('#viewer img:not([aria-hidden])')?.style.opacity==='1');
});
test('actual error retries format, changing photo never keeps the previous photo preview',async t=>{
 const {page}=await setup(t,async route=>{if(route.request().url().includes('w_1600')&&route.request().url().includes('f_auto')){await route.abort();return true;}});
 await page.getByText('Open a',{exact:true}).click();await page.waitForFunction(()=>document.querySelector('#viewer img:not([aria-hidden])')?.style.opacity==='1');assert.match(await page.locator('#viewer img:not([aria-hidden])').getAttribute('src'),/f_jpg/);
 await page.getByText('Open b',{exact:true}).click();await page.waitForFunction(()=>document.querySelector('#viewer img:not([aria-hidden])')?.src.endsWith('/b.jpg'));assert.equal(await page.locator('#viewer img').evaluateAll(imgs=>imgs.every(i=>i.src.endsWith('/b.jpg'))),true);
});
test('prefetch is bounded, deduplicated and cancelled when closing',async t=>{
 const {page,requests}=await setup(t);await page.evaluate(()=>window.preload(['c','c','d','e']));await page.waitForTimeout(600);
 assert.equal(requests.filter(u=>u.includes('w_1600')).length,2);
 await page.evaluate(()=>window.preload(['f','g'])());await page.waitForTimeout(500);assert.equal(requests.filter(u=>/\/(f|g)\.jpg/.test(u)).length,0);
 await page.evaluate(()=>window.preload(['c','d']));await page.waitForTimeout(500);assert.equal(requests.filter(u=>u.includes('w_1600')).length,2);
});
test('data saver prevents speculative downloads',async t=>{
 const {page,requests}=await setup(t);await page.evaluate(()=>{Object.defineProperty(navigator,'connection',{value:{saveData:true},configurable:true});window.preload(['c','d']);});await page.waitForTimeout(500);assert.equal(requests.filter(u=>u.includes('w_1600')).length,0);
});
