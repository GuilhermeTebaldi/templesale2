// Real photo menu and existing editor, using App's actual ownership gate and edit callback.
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync, readdirSync } from 'node:fs';
import { build } from 'esbuild';
const app = readFileSync('src/App.tsx', 'utf8');
const start = app.indexOf('  const openSocialPublicationEditor =');
const end = app.indexOf('  const selectSocialCompany =', start);
assert.ok(start > 0 && end > start);
const helper = app.slice(start, end);
const gate = app.match(/onEdit=\{(hasMemberAccess && currentUser\?\.id === selectedPublication\.ownerId[\s\S]*?: undefined)\}/);
assert.ok(gate, 'Use the production ownership gate and click handler');
const bundle = await build({ stdin: { resolveDir: process.cwd(), loader: 'tsx', contents: `
import React from 'react';import {createRoot} from 'react-dom/client';
import PublicationPhotoViewer from './src/components/PublicationPhotoViewer';
import EditPublicationModal from './src/components/EditPublicationModal';
import {I18nProvider} from './src/i18n/provider';import {api} from './src/lib/api';
const photo={id:11,ownerId:1,establishmentId:7,caption:'Originale',imageUrl:'/photo.svg',media:['/photo.svg'],createdAt:1};
api.updatePublication=async(id,input)=>{window.saved={id,...input};return {...photo,...input}};
function Fixture(){
const mode=new URLSearchParams(location.search).get('mode');
const currentUser=mode==='guest'?null:{id:mode==='other'?2:1};const hasMemberAccess=!!currentUser;
const [selectedPublication,setSelectedPublication]=React.useState(photo);
const [isPublicationPhotoOpen,setIsPublicationPhotoOpen]=React.useState(true);
const [editingSocialPublication,setEditingSocialPublication]=React.useState(null);
const [publicationFeed,setPublicationFeed]=React.useState(mode==='selected-only'?[]:[photo]);
const selectedEstablishmentPublications=[],savedPublications=[];
const publicationIdFromSocialPostId=id=>Number(id.replace('publication_',''));
const socialPostIdFromPublicationId=id=>'publication_'+id;
const setAuthModalMode=()=>{window.authRequested=true},setIsAuthModalOpen=()=>{};
const setFocusedPublicationCommentId=()=>{};
${helper}
window.tryEdit=()=>openSocialPublicationEditor('publication_11');
return <><p data-testid="feed-caption">{publicationFeed[0]?.caption}</p>
{selectedPublication&&isPublicationPhotoOpen&&<PublicationPhotoViewer publication={selectedPublication}
 establishment={{id:7,name:'Mago'}} liked={false} saved={false} onClose={()=>setSelectedPublication(null)}
 onLike={()=>{}} onSave={()=>{}} onDiscussion={()=>{window.discussion=true}} onProfile={()=>{}}
 onEdit={${gate[1]}}/>}
{editingSocialPublication&&<EditPublicationModal publication={editingSocialPublication}
 establishment={{id:7,name:'Mago'}} onClose={()=>setEditingSocialPublication(null)}
 onUpdated={p=>setPublicationFeed([p])}/>}
</>}
createRoot(document.getElementById('root')).render(<I18nProvider><Fixture/></I18nProvider>);
` }, bundle: true, format: 'esm', write: false, define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env': '{}' } });
const css = readFileSync('dist/assets/' + readdirSync('dist/assets').find(n => /^index-.*\.css$/.test(n)));
const server = createServer((req, res) => {
  if(req.url==='/fixture.js'){res.setHeader('content-type','text/javascript');res.end(bundle.outputFiles[0].text)}
  else if(req.url==='/fixture.css'){res.setHeader('content-type','text/css');res.end(css)}
  else if(req.url==='/photo.svg'){res.setHeader('content-type','image/svg+xml');res.end('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#accabb"/></svg>')}
  else{res.setHeader('content-type','text/html');res.end('<meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"><div id="root"></div><script type="module" src="/fixture.js"></script>')}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));after(()=>new Promise(r=>server.close(r)));
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH});after(()=>browser.close());
async function fixture(t,mode='owner',width=390){
 const context=await browser.newContext({viewport:{width,height:844},hasTouch:true,isMobile:width<640});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));t.after(()=>assert.deepEqual(errors,[]));
 await page.goto('http://127.0.0.1:'+server.address().port+'/?mode='+mode);
 await page.getByRole('button',{name:'Opzioni foto',exact:true}).click();return page;
}
for(const width of [340,390,768,1440])test(width+'px: owner opens the existing editor from the photo menu and saves back to the feed',async t=>{
 const page=await fixture(t,'owner',width);
 await page.getByRole('button',{name:'Didascalia e commenti',exact:true}).waitFor();
 await page.getByRole('button',{name:'Modifica foto',exact:true}).click();
 assert.equal(await page.getByRole('dialog',{name:'Foto della pubblicazione'}).count(),0);
 await page.locator('textarea').fill('Aggiornata dal feed');await page.getByRole('button',{name:'Salva',exact:true}).click();
 await page.locator('textarea').waitFor({state:'detached'});
 assert.equal(await page.getByTestId('feed-caption').textContent(),'Aggiornata dal feed');
 assert.equal(await page.evaluate(()=>window.saved.id),11);
});
for(const mode of ['other','guest'])test(mode+': edit is hidden and the shared callback rejects a non-owner',async t=>{
 const page=await fixture(t,mode);assert.equal(await page.getByRole('button',{name:'Modifica foto',exact:true}).count(),0);
 await page.evaluate(()=>window.tryEdit());assert.equal(await page.locator('textarea').count(),0);
 assert.equal(await page.evaluate(()=>window.authRequested),true);
});
test('a selected photo absent from loaded lists can be edited; cancelling never saves',async t=>{
 const page=await fixture(t,'selected-only');await page.getByRole('button',{name:'Modifica foto',exact:true}).click();
 await page.locator('textarea').fill('Non salvata');await page.getByRole('button',{name:'Chiudi',exact:true}).click();
 await page.locator('textarea').waitFor({state:'detached'});assert.equal(await page.evaluate(()=>window.saved),undefined);
});
