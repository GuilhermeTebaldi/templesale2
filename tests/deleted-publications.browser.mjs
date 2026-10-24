// Real menu, collections and editor; API fixtures never touch user accounts.
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync, readdirSync } from 'node:fs';
import { build } from 'esbuild';
const bundle=await build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`
import React from 'react';import {createRoot} from 'react-dom/client';
import DeletedPublications from './src/components/DeletedPublications';
import EditPublicationModal from './src/components/EditPublicationModal';
import Curtidas from './src/components/Curtidas';
import {CompanyProfileDrawer} from './src/components/CompanyProfileDrawer';
import {I18nProvider} from './src/i18n/provider';import {api} from './src/lib/api';
window.photos=Array.from({length:14},(_,i)=>({id:i+1,ownerId:i<12?1:2,establishmentId:10,
 establishmentName:'Foto '+(i+1),caption:'Didascalia '+(i+1),imageUrl:'/photo.svg',media:['/photo.svg'],createdAt:i+1,updatedAt:i+1,isTrashed:true}));
api.getDeletedPublications=async(offset=0)=>{if(window.failLoad)throw Error('load');const rows=window.photos.filter(p=>p.ownerId===window.owner);return {publications:rows.slice(offset,offset+8).map(p=>({...p})),hasMore:rows.length>offset+8,nextOffset:offset+Math.min(rows.length-offset,8)}};
api.updatePublication=async(id,input)=>{const row=window.photos.find(p=>p.id===id);Object.assign(row,input);return {...row}};
api.restorePublication=async(id)=>{if(window.failRestore)throw Error('restore');const row=window.photos.find(p=>p.id===id);row.isTrashed=false;return {...row}};
api.permanentlyDeletePublication=async(id)=>{window.purgeCalls=(window.purgeCalls||0)+1;if(window.failPurge)throw Error('purge');window.photos=window.photos.filter(p=>p.id!==id)};
function Fixture(){const [mode,setMode]=React.useState('menu');const [owner,setOwner]=React.useState(1);
const [editing,setEditing]=React.useState(null),[updated,setUpdated]=React.useState(null);window.owner=owner;
window.switchAccount=()=>{setUpdated(null);setEditing(null);setOwner(2)};window.showSaved=()=>setMode('saved');
return <><CompanyProfileDrawer isOpen={mode==='menu'} onClose={()=>setMode('closed')}
company={{id:'company_10',name:'Mago'}} user={{name:'Mago',email:'one@example.com',isAuthenticated:true}}
savedPosts={[]} onOpenPost={()=>{}} onToggleSavePost={()=>{}} onOpenEditCompany={()=>{}} onViewPublicProfile={()=>{}}
onOpenFavorites={()=>{}} onOpenDeleted={()=>setMode('deleted')}/>
{mode==='deleted'&&<DeletedPublications key={owner} onClose={()=>setMode('menu')} onEdit={setEditing}
 updatedPublication={updated} onRestored={()=>{}} onPermanentlyDeleted={()=>{}}/>}
{editing&&<EditPublicationModal publication={editing} establishment={{id:10,name:'Mago'}} onClose={()=>setEditing(null)} onUpdated={setUpdated}/>}
{mode==='saved'&&<Curtidas kind="saved" products={[]} publications={window.photos.slice(0,2)} onClose={()=>setMode('menu')}
 onOpenProduct={()=>{}} onRemove={async()=>{}} onRemovePublication={async()=>{}}/>}</>}
createRoot(document.getElementById('root')).render(<I18nProvider><Fixture/></I18nProvider>);
`},bundle:true,format:'esm',write:false,define:{'process.env.NODE_ENV':'"production"','import.meta.env':'{}'}});
const css=readFileSync('dist/assets/'+readdirSync('dist/assets').find(name=>/^index-.*\.css$/.test(name)));
const server=createServer((req,res)=>{
 if(req.url==='/fixture.js'){res.setHeader('content-type','text/javascript');res.end(bundle.outputFiles[0].text)}
 else if(req.url==='/fixture.css'){res.setHeader('content-type','text/css');res.end(css)}
 else if(req.url==='/photo.svg'){res.setHeader('content-type','image/svg+xml');res.end('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#accabb"/><circle cx="210" cy="230" r="120" fill="#dfc999"/></svg>')}
 else{res.setHeader('content-type','text/html');res.end('<meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"><div id="root"></div><script type="module" src="/fixture.js"></script>')}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));after(()=>new Promise(r=>server.close(r)));
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH});after(()=>browser.close());
async function fixture(t,width=390){const context=await browser.newContext({viewport:{width,height:844},hasTouch:true,isMobile:width<640});t.after(()=>context.close());
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));t.after(()=>assert.deepEqual(errors,[]));await page.goto('http://127.0.0.1:'+server.address().port);
await page.getByRole('button',{name:/Eliminati/}).click();await page.getByRole('button',{name:'Modifica foto: Foto 1',exact:true}).waitFor();return page;}
for(const width of [340,390,768,1440])test(
`${width}px: existing menu opens the archive; edit stays hidden, restore stays listed, permanent delete asks confirmation`,async t=>{
 const page=await fixture(t,width);
 await page.waitForFunction(()=>{const r=document.querySelector('button[title="Modifica foto"]').closest('div.fixed').getBoundingClientRect();return r.left>=-0.5&&r.right<=innerWidth+0.5});
 const bounds=await page.getByRole('heading',{name:'Eliminati',exact:true}).evaluate(h=>h.closest('div.fixed').getBoundingClientRect().toJSON());
 assert.ok(bounds.x>=-0.5&&bounds.right<=width+1,JSON.stringify(bounds));
 if(width===390&&process.env.DELETED_SCREENSHOT)await page.screenshot({path:process.env.DELETED_SCREENSHOT});
 await page.getByRole('button',{name:'Modifica foto: Foto 1',exact:true}).click();
 await page.locator('textarea').fill('Modifica privata');await page.getByRole('button',{name:'Salva',exact:true}).click();
 await page.locator('textarea').waitFor({state:'detached'});
 assert.equal(await page.evaluate(()=>window.photos.find(p=>p.id===1).caption),'Modifica privata');
 assert.equal(await page.evaluate(()=>window.photos.find(p=>p.id===1).isTrashed),true);
 await page.getByRole('button',{name:'Ripristina foto: Foto 1',exact:true}).click();
 await page.getByText('Nel profilo',{exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:'Modifica foto: Foto 1',exact:true}).count(),1,'Restoration retains the archive entry');
 page.once('dialog',d=>d.dismiss());await page.getByRole('button',{name:'Elimina definitivamente: Foto 1',exact:true}).click();
 assert.equal(await page.evaluate(()=>window.purgeCalls||0),0);
 page.once('dialog',d=>{assert.match(d.message(),/anche dal profilo/);return d.accept()});
 await page.getByRole('button',{name:'Elimina definitivamente: Foto 1',exact:true}).click();
 await page.getByRole('button',{name:'Modifica foto: Foto 1',exact:true}).waitFor({state:'detached'});
 assert.equal(await page.evaluate(()=>window.photos.some(p=>p.id===1)),false);
 await page.getByRole('button',{name:'Mostra altre',exact:true}).click();
 await page.getByRole('button',{name:'Modifica foto: Foto 12',exact:true}).waitFor();
 assert.equal(await page.locator('button[title="Modifica foto"]').count(),11,'Pagination remains complete after deletion');
 await page.getByRole('button',{name:'Chiudi raccolta',exact:true}).click();
 await page.getByRole('button',{name:/Eliminati/}).click();
 await page.getByRole('button',{name:'Modifica foto: Foto 2',exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:'Modifica foto: Foto 1',exact:true}).count(),0,'Deletion persists on reopening');
});
test('failed operations keep photos and account switches never retain another account’s list',async t=>{
 const page=await fixture(t);
 await page.evaluate(()=>{window.failRestore=true});await page.getByRole('button',{name:'Ripristina foto: Foto 1',exact:true}).click();
 await page.getByRole('alert').waitFor();assert.equal(await page.evaluate(()=>window.photos[0].isTrashed),true);
 await page.evaluate(()=>{window.failPurge=true});page.once('dialog',d=>d.accept());
 await page.getByRole('button',{name:'Elimina definitivamente: Foto 1',exact:true}).click();await page.getByRole('alert').waitFor();
 assert.equal(await page.getByRole('button',{name:'Modifica foto: Foto 1',exact:true}).count(),1);
 await page.evaluate(()=>window.switchAccount());await page.getByRole('button',{name:'Modifica foto: Foto 13',exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:'Modifica foto: Foto 1',exact:true}).count(),0);
});
test('saved collection retains its existing actions and has no restore control',async t=>{
 const page=await fixture(t);await page.evaluate(()=>window.showSaved());await page.getByRole('heading',{name:'Salvati',exact:true}).waitFor();
 assert.equal(await page.locator('button[title="Rimuovi dai salvati"]').count(),2);
 assert.equal(await page.getByRole('button',{name:/Ripristina/}).count(),0);
});
