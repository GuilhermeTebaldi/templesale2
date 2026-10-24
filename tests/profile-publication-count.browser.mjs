// Exercise the production deletion callbacks and real profile with API refresh
// deliberately stalled: the visible total must not depend on another request.
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync, readdirSync } from 'node:fs';
import { build } from 'esbuild';
const app = readFileSync('src/App.tsx', 'utf8');
function between(start, end) {
  const a = app.indexOf(start), b = app.indexOf(end, a + start.length);
  assert.ok(a >= 0 && b > a, 'Production callback boundaries must exist'); return app.slice(a, b);
}
const removal = between('  const removePublicationFromLocalState =', '  const openSocialPublicationEditor =');
const deletion = between('  const deleteSocialPost =', '\n  return (');
const bundle = await build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`
import React from 'react';import {createRoot} from 'react-dom/client';
import {CompanyProfile} from './src/components/CompanyProfile';import {I18nProvider} from './src/i18n/provider';import {api} from './src/lib/api';
api.deletePublication=()=>new Promise((resolve,reject)=>{window.finishDelete=()=>resolve(true);window.failDelete=()=>reject(Error('failure'));window.deletePending=true});
function Fixture(){
const initial={id:7,ownerId:1,name:'Mago',category:'Magia',city:'Ardea',description:'',hours:'',keywords:[],publicationCount:Number(new URLSearchParams(location.search).get('count')??20)};
const [myEstablishment,setMyEstablishment]=React.useState(initial),[selectedEstablishment,setSelectedEstablishment]=React.useState({...initial});
const [establishments,setEstablishments]=React.useState([{...initial},{...initial,id:8,publicationCount:9}]);
const seed=Array.from({length:12},(_,i)=>({id:i+1,establishmentId:7,ownerId:1,caption:'Foto '+(i+1),imageUrl:'/photo.svg',media:['/photo.svg'],likesCount:0,comments:[],createdAt:1}));
const [publicationFeed,setPublicationFeed]=React.useState(seed),[selectedEstablishmentPublications,setSelectedEstablishmentPublications]=React.useState(seed);
const [savedPublications,setSavedPublications]=React.useState([]),[likedPublications,setLikedPublications]=React.useState([]);
const [deletedPublicationIds,setDeletedPublicationIds]=React.useState([]),[homePublication,setHomePublication]=React.useState(null);
const [savedPublicationIds,setSavedPublicationIds]=React.useState([]),[likedPublicationIds,setLikedPublicationIds]=React.useState([]);
const [selectedPublication,setSelectedPublication]=React.useState(null),[editingSocialPublication,setEditingSocialPublication]=React.useState(null);
const [publicationCommentsById,setPublicationCommentsById]=React.useState({});
const socialPostIdFromPublicationId=React.useCallback(id=>'publication_'+id,[]),publicationIdFromSocialPostId=React.useCallback(id=>Number(id.replace('publication_','')),[]);
const currentUser={id:1},hasMemberAccess=true,activeCategory='All',debouncedSearchQuery='';
const setAuthModalMode=()=>{},setIsAuthModalOpen=()=>{};
const refreshEstablishments=React.useCallback(()=>{window.refreshRequests=(window.refreshRequests||0)+1},[]);
${removal}
${deletion}
window.profileState={myEstablishment,selectedEstablishment,establishments};
window.viewerDeleted=()=>removePublicationFromLocalState(1,seed[0]);window.hiddenPermanentlyDeleted=()=>removePublicationFromLocalState(999,null);
const posts=selectedEstablishmentPublications.map(p=>({...p,id:'publication_'+p.id,companyId:'company_7'}));
return <CompanyProfile company={{...selectedEstablishment,id:'company_7'}} posts={posts} isOwner hasMorePosts onOpenPost={()=>{}} onDeletePost={deleteSocialPost}/>;
}
createRoot(document.getElementById('root')).render(<I18nProvider><Fixture/></I18nProvider>);
`},bundle:true,format:'esm',write:false,define:{'process.env.NODE_ENV':'"production"','import.meta.env':'{}'}});
const css=readFileSync('dist/assets/'+readdirSync('dist/assets').find(name=>/^index-.*\.css$/.test(name)));
const server=createServer((req,res)=>{
 if(req.url==='/fixture.js'){res.setHeader('content-type','text/javascript');res.end(bundle.outputFiles[0].text)}
 else if(req.url==='/fixture.css'){res.setHeader('content-type','text/css');res.end(css)}
 else if(req.url==='/photo.svg'){res.setHeader('content-type','image/svg+xml');res.end('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#ddd"/></svg>')}
 else{res.setHeader('content-type','text/html');res.end('<meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"><div id="root"></div><script type="module" src="/fixture.js"></script>')}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));after(()=>new Promise(r=>server.close(r)));
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH});after(()=>browser.close());
async function fixture(t,count=20){const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});t.after(()=>context.close());const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));t.after(()=>assert.deepEqual(errors,[]));await page.goto('http://127.0.0.1:'+server.address().port+'/?count='+count);await page.locator('#company-publication-count').waitFor();return page;}
async function confirmRemoval(page){await page.locator('#btn-delete-post-publication_1').click();await page.locator('#btn-confirm-delete-post').click();await page.waitForFunction(()=>window.deletePending);}
async function assertCounts(page,count){await page.waitForFunction(n=>document.querySelector('#company-publication-count').textContent===String(n),count);const state=await page.evaluate(()=>window.profileState);assert.equal(state.myEstablishment.publicationCount,count);assert.equal(state.selectedEstablishment.publicationCount,count);assert.equal(state.establishments[0].publicationCount,count);assert.equal(state.establishments[1].publicationCount,9);}
test('20 becomes 19 after confirmed grid deletion, before a refresh response and with only 12 photos loaded',async t=>{const page=await fixture(t);await confirmRemoval(page);await assertCounts(page,20);await page.evaluate(()=>window.finishDelete());await assertCounts(page,19);assert.equal(await page.locator('#btn-delete-post-publication_1').count(),0);assert.equal(await page.evaluate(()=>window.refreshRequests),1);});
test('a failed deletion keeps the total and the photo',async t=>{const page=await fixture(t);await confirmRemoval(page);await page.evaluate(()=>window.failDelete());await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await assertCounts(page,20);assert.equal(await page.locator('#btn-delete-post-publication_1').count(),1);assert.equal(await page.evaluate(()=>window.refreshRequests||0),0);});
test('viewer deletion synchronizes every snapshot; permanent deletion of an already hidden photo does not subtract again',async t=>{const page=await fixture(t);await page.evaluate(()=>window.hiddenPermanentlyDeleted());await assertCounts(page,20);await page.evaluate(()=>window.viewerDeleted());await assertCounts(page,19);});
test('the total cannot become negative',async t=>{const page=await fixture(t,0);await page.evaluate(()=>window.viewerDeleted());await assertCounts(page,0);});
