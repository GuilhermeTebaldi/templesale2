// The production App reuses one search view and existing handlers. API data is mocked.
import {after,test} from 'node:test';
import assert from 'node:assert/strict';
import {preview} from 'vite';
const server=await preview({preview:{host:'127.0.0.1',port:0}});after(()=>new Promise(r=>server.httpServer.close(r)));
const baseURL=server.resolvedUrls.local[0];
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH});after(()=>browser.close());
const companies=['Pulizie Tebaldi','Bazar Casa Blanca','Caffè Centrale'].map((name,i)=>({id:i+7,ownerId:i+1,name,slug:'attivita-'+i,category:['Servizi di Pulizia','Bazar e casalinghi','Bar'][i],city:'Ardea',latitude:41.6+i*.001,longitude:12.5,logoUrl:'/photo.svg',whatsappNumber:'3331234567',keywords:[]}));
const photos=companies.map(c=>({id:c.id,ownerId:c.ownerId,establishmentId:c.id,establishmentName:c.name,establishmentCity:c.city,establishmentCategory:c.category,establishmentWhatsappNumber:c.whatsappNumber,latitude:c.latitude,longitude:c.longitude,caption:'Servizi e attività del territorio. Scopri le nostre novità e contattaci per informazioni.',imageUrl:'/photo.svg',media:['/photo.svg'],createdAt:1792910000000}));
async function fixture(t,width,searchState){
 const context=await browser.newContext({viewport:{width,height:1000},hasTouch:width<640,reducedMotion:'reduce'});t.after(()=>context.close());
 await context.addInitScript(hasLocation=>{
  window.EventSource=class{addEventListener(){}close(){}};
  Object.defineProperty(navigator,'permissions',{value:{query:async()=>({state:hasLocation?'granted':'denied'})}});
  if(hasLocation)Object.defineProperty(navigator,'geolocation',{value:{watchPosition(success){queueMicrotask(()=>success({coords:{latitude:41.6,longitude:12.5,accuracy:10}}));return 1},clearWatch(){}}});
 },Boolean(searchState));
 if(searchState)await context.addInitScript(()=>localStorage.setItem('templesale_map_user_location',JSON.stringify({lat:41.6,lng:12.5,at:Date.now()})));
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());if(url.origin!==new URL(baseURL).origin)return route.abort();
  if(url.pathname==='/photo.svg')return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="800" height="680"><rect width="800" height="680" fill="#e3ede9"/><path d="M0 480L240 180 480 420 650 250 800 480V680H0" fill="#9eb8ab"/><circle cx="610" cy="120" r="65" fill="#edcf95"/></svg>'});
  if(!url.pathname.startsWith('/api/'))return route.continue();
  const json=(body,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
  if(url.pathname==='/api/auth/me')return json({error:'Guest'},401);
  if(url.pathname==='/api/establishments'){
   if(!searchState)return json({establishments:companies});
   const query=url.searchParams.get('search')||'';searchState.requests.push({query,lat:url.searchParams.get('lat'),lng:url.searchParams.get('lng')});
   if(searchState.holds[query])await searchState.holds[query];
   if(searchState.fail===query)return json({error:'Temporary search failure'},500);
   const rows=!query||query==='Ardea'?companies:query.toLowerCase()==='bar'||query==='barr'?[companies[2]]:query==='Bazar e casalinghi'?[companies[1]]:query==='Servizi di Pulizia'?[companies[0]]:[];
   return json({establishments:rows});
  }
  if(url.pathname==='/api/publications')return json({publications:photos,pagination:{hasMore:false}});
  const match=url.pathname.match(/^\/api\/establishments\/(\d+)(\/publications)?$/);if(match){const c=companies.find(x=>x.id===Number(match[1]));return json(match[2]?{publications:photos.filter(p=>p.establishmentId===c.id),pagination:{hasMore:false}}:{establishment:c,publications:photos.filter(p=>p.establishmentId===c.id),products:[]});}
  return json([]);
 });
 const page=await context.newPage(),errors=[];page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));t.after(()=>assert.deepEqual(errors,[]));
 await page.goto(baseURL);await page.locator('#feed-post-publication_7').waitFor().catch(async e=>{console.log({width,errors,text:(await page.locator('body').innerText()).slice(0,1200)});await page.screenshot({path:'/tmp/desktop-mobile-failure.png'});throw e});return page;
}
for(const width of [1180,1440,1920])test(`${width}px: white three-column desktop reuses the search, profile and saved actions`,async t=>{
 const page=await fixture(t,width);
 await page.locator('.ts-desktop-search #search-card-company_7').waitFor();
 const nav=await page.locator('#desktop-left-nav').boundingBox(),feed=await page.locator('#feed-view').boundingBox(),search=await page.locator('.ts-desktop-search').boundingBox();
 assert.ok(nav.x+nav.width<=feed.x&&feed.x+feed.width<search.x&&search.x+search.width<=width);
 assert.ok(feed.width>=500&&feed.width<=601);assert.equal(await page.locator('#company-search-input').count(),1,'No duplicate search state or input IDs');
 assert.equal(await page.locator('body').evaluate(el=>el.scrollWidth<=innerWidth),true);
 assert.equal(await page.locator('#desktop-rail-search .ts-desktop-nav-label').isVisible(),true);
 assert.equal(await page.locator('#mobile-bottom-nav').isVisible(),false);
 assert.equal(await page.locator('.ts-desktop-search').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(255, 255, 255)');
 if(width===1440)await page.waitForTimeout(2400);
 if(width===1440)await page.screenshot({path:'/tmp/templesale-desktop-layout.png',animations:'disabled'});
 await page.locator('#company-search-input').fill('Bar');await page.locator('#company-search-input').press('Enter');
 await page.locator('.ts-desktop-search #search-card-company_9').waitFor();
 await page.locator('#desktop-rail-search').click();assert.equal(await page.locator('#search-view').isVisible(),true);
 const expanded=await page.locator('.ts-desktop-search').boundingBox();assert.ok(expanded.width>feed.width);
 await page.locator('#desktop-rail-feed').click();await page.locator('.ts-feed-header').getByRole('heading',{name:'Pulizie Tebaldi',exact:true}).click();
 await page.locator('#company-profile-view').waitFor();assert.equal(await page.locator('.ts-desktop-search').isVisible(),true);
 await page.locator('#desktop-rail-saved').click();await page.getByRole('heading',{name:'Salvati',exact:true}).waitFor();
});

for(const width of [390,1440])test(`${width}px: real App search keeps nearby examples, suppresses stale results and refreshes on Enter`,async t=>{
 let release;const pending=new Promise(resolve=>{release=resolve});t.after(()=>release());
 const state={requests:[],holds:{Bar:pending},fail:null};
 const page=await fixture(t,width,state);
 if(width<640)await page.locator('#mobile-bottom-nav').getByRole('button',{name:'Cerca',exact:true}).click();
 const view=page.locator('#search-view'),cards=view.locator('.ts-search-card'),input=view.locator('#company-search-input');
 await view.locator('#search-card-company_7').waitFor();
 assert.deepEqual(await cards.evaluateAll(elements=>elements.map(e=>e.id)),['search-card-company_7','search-card-company_8','search-card-company_9']);
 await view.getByRole('button',{name:'Bar',exact:true}).waitFor();
 assert.equal(await view.getByRole('button',{name:'pizza',exact:true}).count(),0,'Examples come from stored company data, not the old hardcoded vocabulary');
 await view.getByRole('button',{name:'Bar',exact:true}).click();
 await view.getByText('Ricerca in corso…',{exact:true}).waitFor();
 assert.equal(await cards.count(),0,'The previous nearby list must not be labeled as results for Bar');
 assert.equal(await view.getByText(/Nessuna attività trovata/).count(),0,'Pending search is not an empty result');
 await view.getByRole('button',{name:'Bazar e casalinghi',exact:true}).click();
 await view.locator('#search-card-company_8').waitFor();
 assert.equal(await cards.count(),1);
 release();await page.waitForTimeout(150);
 assert.equal(await cards.first().getAttribute('id'),'search-card-company_8','Late response for an abandoned query cannot overwrite the current one');
 await view.getByRole('button',{name:'Bar',exact:true}).click();
 await view.locator('#search-card-company_9').waitFor();assert.equal(await cards.count(),1);
 const request=page.waitForRequest(r=>new URL(r.url()).pathname==='/api/establishments'&&new URL(r.url()).searchParams.get('search')==='no registered match');
 await input.fill('no registered match');await input.press('Enter');await request;
 await view.getByText('Nessuna attività trovata per "no registered match".',{exact:true}).waitFor();assert.equal(await cards.count(),0);
 await view.getByRole('button',{name:'Vedi tutte le attività',exact:true}).click();
 await view.locator('#search-card-company_7').waitFor();assert.equal(await cards.count(),3);
 assert.ok(state.requests.every(r=>r.lat==='41.6'&&r.lng==='12.5'),'Location travels with initial, example and Enter searches');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
});

test('real App search distinguishes a failed query from zero results and retries using the existing Enter action',async t=>{
 const state={requests:[],holds:{},fail:'Bar'},page=await fixture(t,390,state);
 await page.locator('#mobile-bottom-nav').getByRole('button',{name:'Cerca',exact:true}).click();
 const view=page.locator('#search-view'),input=view.locator('#company-search-input');
 await view.locator('#search-card-company_7').waitFor();await input.fill('Bar');await input.press('Enter');
 await view.getByText('Ricerca non disponibile. Riprova.',{exact:true}).waitFor();
 assert.equal(await view.locator('.ts-search-card').count(),0);
 assert.equal(await view.getByText(/Nessuna attività trovata/).count(),0);
 state.fail=null;await input.press('Enter');await view.locator('#search-card-company_9').waitFor();assert.equal(await view.locator('.ts-search-card').count(),1);
 await input.fill('barr');await input.press('Enter');await view.locator('#search-card-company_9').waitFor();
 assert.equal(await input.inputValue(),'barr','Correction results do not overwrite what the person typed');
});
for(const width of [390,768])test(`${width}px: desktop styles do not change mobile or tablet pixels`,async t=>{
 const page=await fixture(t,width);await page.waitForTimeout(2400);
 assert.equal(await page.locator('.ts-desktop-search').isVisible(),false);
 const before=await page.screenshot({animations:'disabled'});
 await page.evaluate(()=>{window.desktopRules=[];for(const sheet of document.styleSheets){for(let i=sheet.cssRules.length-1;i>=0;i--){const rule=sheet.cssRules[i];if(rule instanceof CSSMediaRule&&/min-width:\s*1180px/.test(rule.conditionText)){window.desktopRules.push({sheet,index:i,text:rule.cssText});sheet.deleteRule(i);}}}});
 const baseline=await page.screenshot({animations:'disabled'});
 const changed=await page.evaluate(async urls=>{
   const pixels=await Promise.all(urls.map(async src=>{const image=new Image();image.src=src;await image.decode();const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);return ctx.getImageData(0,0,c.width,c.height).data;}));
   let count=0;for(let i=0;i<pixels[0].length;i+=4)if([0,1,2].some(k=>Math.abs(pixels[0][i+k]-pixels[1][i+k])>16))count++;
   return count/(pixels[0].length/4);
 },[before,baseline].map(buffer=>'data:image/png;base64,'+buffer.toString('base64')));
 assert.ok(changed<0.001,'Wide-screen styles must not change mobile pixels beyond rasterization noise: '+changed);
 await page.evaluate(()=>{for(const r of window.desktopRules.reverse())r.sheet.insertRule(r.text,r.index)});
 await (width<640?page.locator('#mobile-bottom-nav').getByRole('button',{name:'Cerca',exact:true}):page.locator('#desktop-rail-search')).click();await page.locator('#company-search-input').waitFor();
 assert.equal(await page.locator('.ts-desktop-search-heading').isVisible(),false);
});

test('real mobile App keeps footer outside scrolling and preserves map/profile return positions',async t=>{
 const page=await fixture(t,390);const region=page.locator('#app-scroll-region');
 await region.evaluate(el=>el.scrollTo(0,600));
 const footer=await page.locator('#mobile-bottom-nav').boundingBox();assert.equal(Math.round(footer.y+footer.height),1000);
 assert.equal(await page.evaluate(()=>window.scrollY),0);
 await page.locator('#mobile-tab-btn-map').click();
 const close=page.locator('button[title="Chiudi mappa"]');await close.waitFor();
 assert.equal(await page.evaluate(()=>getComputedStyle(document.body).position),'static');
 await close.click();await close.waitFor({state:'detached'});
 await page.waitForFunction(()=>!document.body.classList.contains('ts-scroll-lock'));
 assert.equal(await region.evaluate(el=>el.scrollTop),600);
 const heading=page.locator('.ts-feed-header').getByRole('heading',{name:'Caffè Centrale',exact:true});await heading.scrollIntoViewIfNeeded();
 const saved=await region.evaluate(el=>el.scrollTop);await heading.click();await page.locator('#company-profile-view').waitFor();
 await page.waitForFunction(()=>document.getElementById('app-scroll-region').scrollTop===0);
 await page.getByRole('button',{name:'Torna al feed',exact:true}).click();
 await page.waitForFunction(y=>Math.abs(document.getElementById('app-scroll-region').scrollTop-y)<2,saved);
 await region.evaluate(el=>el.scrollTo(0,600));
 let refreshes=0;page.on('request',req=>{if(new URL(req.url()).pathname==='/api/publications')refreshes++});
 const feed=page.locator('#feed-view');
 const pull=async()=>{await feed.dispatchEvent('touchstart',{touches:[{identifier:1,clientX:100,clientY:300}]});await feed.dispatchEvent('touchmove',{touches:[{identifier:1,clientX:100,clientY:480}]});await feed.dispatchEvent('touchend',{touches:[]});};
 await pull();await page.waitForTimeout(250);assert.equal(refreshes,0,'Pull-to-refresh is disabled away from the scroll owner’s top');
 await region.evaluate(el=>el.scrollTo(0,0));await pull();await page.waitForFunction(()=>document.querySelector('#pull-to-refresh-indicator')?.textContent.includes('Aggiornamento')||document.getElementById('app-scroll-region').scrollTop===0);
 await page.waitForTimeout(250);assert.ok(refreshes>0,'Pull-to-refresh still uses the original feed request');
 await page.screenshot({path:'/tmp/templesale-mobile-shell.png',animations:'disabled'});
});
