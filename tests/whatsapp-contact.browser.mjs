// Complete built App, actual feed/profile contacts, no real WhatsApp navigation or account changes.
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { preview } from 'vite';
const server = await preview({ preview: { host: '127.0.0.1', port: 0 } });
after(() => new Promise(resolve => server.httpServer.close(resolve)));
const baseURL = server.resolvedUrls.local[0];
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH });
after(() => browser.close());
const company = { id:7, ownerId:12, name:'Bazar Casa Blanca', slug:'bazar', category:'Bazar', city:'Ardea', whatsappNumber:'390000000', keywords:[] };
const photo = { id:11, ownerId:12, establishmentId:7, establishmentName:company.name, establishmentCity:company.city,
  establishmentCategory:company.category, establishmentWhatsappNumber:company.whatsappNumber, caption:'La nostra attività', imageUrl:'/photo.svg', media:['/photo.svg'], createdAt:Date.now() };
async function fixture(t, width=390, mode='normal') {
  const context = await browser.newContext({ viewport:{width,height:844}, hasTouch:width<800 }); t.after(()=>context.close());
  let confirmations=0, external=0;
  await context.addInitScript(()=>{
    window.EventSource=class {addEventListener(){} close(){}};
    Object.defineProperty(navigator,'permissions',{value:{query:async()=>({state:'denied'})}});
    document.addEventListener('click', e=>{const a=e.target.closest?.('a[href*="wa.me"]'); if(a?.closest('[role="dialog"]')) {e.preventDefault(); window.confirmedHref=a.href;}},true);
  });
  await context.route('**/*', async route=>{
    const url=new URL(route.request().url());
    if(url.origin!==new URL(baseURL).origin){if(url.host==='wa.me')external++;return route.abort();}
    if(url.pathname==='/photo.svg')return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#c9e8dd"/></svg>'});
    if(!url.pathname.startsWith('/api/'))return route.continue();
    const json=(body,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
    if(url.pathname==='/api/auth/me')return json({error:'Guest'},401);
    if(url.pathname==='/api/establishments')return json({establishments:[company]});
    if(url.pathname==='/api/publications'||url.pathname==='/api/establishments/7/publications')return json({publications:[photo],pagination:{hasMore:false}});
    if(url.pathname==='/api/establishments/7'){
      if(url.searchParams.has('contact')){
        if(mode==='slow')await new Promise(r=>setTimeout(r,500));
        if(mode==='error')return json({error:'Unavailable'},503);
        return json({ownerName:mode==='missing'?'':mode==='long'?'Alessandra Maria Francesca Rossi Bianchi di Montelupo':'Carla Rossi',companyName:company.name,photoUrl:'/photo.svg'});
      }
      return json({establishment:company,publications:[photo],products:[]});
    }
    if(url.pathname==='/api/discovery/events'&&route.request().method()==='POST'&&route.request().postDataJSON()?.event==='whatsapp')confirmations++;
    return json([]);
  });
  const page=await context.newPage(), errors=[];page.on('pageerror',e=>errors.push(e.message));
  t.after(()=>assert.deepEqual(errors,[]));
  await page.goto(baseURL);await page.locator('#feed-post-publication_11').waitFor();
  return {page,confirmations:()=>confirmations,external:()=>external};
}
for(const width of [340,390,768,1440])test(`${width}px: feed/profile open registered contact; cancel restores focus, scroll and bottom navigation`,async t=>{
  const f=await fixture(t,width), {page}=f;
  const link=page.getByTitle('Contatta su WhatsApp');const href=await link.getAttribute('href');
  await link.click();const dialog=page.getByRole('dialog',{name:'Carla Rossi'});await dialog.waitFor();
  await dialog.getByRole('link',{name:'Apri WhatsApp'}).waitFor();
  assert.equal(await dialog.getByText(company.name,{exact:true}).count(),1);
  assert.equal(await dialog.getByRole('link').getAttribute('href'),href);
  assert.equal(f.confirmations(),0);assert.equal(f.external(),0);
  await page.waitForTimeout(300);
  const rect=await dialog.boundingBox();assert.ok(rect.x>=0&&rect.x+rect.width<=width+1&&rect.y+rect.height<=844);
  assert.ok(Math.abs(rect.y+rect.height-(width<640?844:820))<2,'Sheet anchored to viewport bottom');
  assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('ts-scroll-lock')),true);
  if(width===390)await page.screenshot({path:'/tmp/templesale-whatsapp-contact.png'});
  await page.keyboard.press('Tab');assert.equal(await dialog.getByRole('link').evaluate(el=>el===document.activeElement),true);
  await page.keyboard.press('Tab');assert.equal(await dialog.getByRole('button').evaluate(el=>el===document.activeElement),true);
  await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});
  assert.equal(await link.evaluate(el=>el===document.activeElement),true);
  assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('ts-scroll-lock')),false);
  assert.equal(f.confirmations(),0);
  await page.locator('.ts-feed-header').getByRole('heading',{name:company.name,exact:true}).click();
  const profile=page.locator('#company-profile-view');await profile.waitFor();
  const profileLink=profile.getByTitle('WhatsApp',{exact:true});
  const profileHref=await profileLink.getAttribute('href');await profileLink.click();
  const contact=page.getByRole('dialog',{name:'Carla Rossi'});await contact.waitFor();
  await contact.getByRole('link',{name:'Apri WhatsApp'}).click();await contact.waitFor({state:'detached'});
  await page.waitForFunction(()=>!!window.confirmedHref);
  assert.equal(await page.evaluate(()=>window.confirmedHref),new URL(profileHref).href);
  assert.equal(f.confirmations(),1);assert.equal(f.external(),0);
  assert.equal(await profile.isVisible(),true);
});
for(const mode of ['missing','error','long','slow'])test(`${mode}: contact remains usable without stale owner details`,async t=>{
  const {page}=await fixture(t,340,mode);await page.getByTitle('Contatta su WhatsApp').click();
  const dialog=page.getByRole('dialog');await dialog.waitFor();
  if(mode==='slow'){
    await dialog.getByRole('button',{name:'Chiudi contatto'}).click();await dialog.waitFor({state:'detached'});
    await page.getByTitle('Contatta su WhatsApp').click();
  }
  await page.getByRole('dialog').getByRole('link',{name:'Apri WhatsApp'}).waitFor();
  const heading=await page.getByRole('dialog').getByRole('heading').textContent();
  assert.equal(heading,mode==='missing'||mode==='error'?company.name:mode==='long'?'Alessandra Maria Francesca Rossi Bianchi di Montelupo':'Carla Rossi');
  assert.equal(await page.getByRole('dialog').evaluate(el=>el.scrollWidth<=el.clientWidth),true);
  await page.mouse.click(5,5);await page.getByRole('dialog').waitFor({state:'detached'});
});
