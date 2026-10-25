import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync, readdirSync } from 'node:fs';
import { build } from 'esbuild';
const bundle = await build({ stdin: { resolveDir: process.cwd(), loader: 'tsx', contents: `
import React from 'react';import {createRoot} from 'react-dom/client';
import EditePerfil from './src/components/EditePerfil';import AdminPanel from './src/components/AdminPanelV2';
import {I18nProvider} from './src/i18n/provider';import {api} from './src/lib/api';
const user={id:1,name:'Proprietario',email:'owner@example.test',whatsappNumber:'3331234567',city:'Ardea'};
function Fixture(){const [version,setVersion]=React.useState(0),[open,setOpen]=React.useState(true);
const [company,setCompany]=React.useState({id:7,ownerId:1,name:'Attività di prova',category:'Altro',city:'Ardea',latitude:41.6,longitude:12.5,keywords:[]});
window.reopen=()=>{setVersion(v=>v+1);setOpen(true)};
return new URLSearchParams(location.search).get('mode')==='admin'?<AdminPanel/>:
open?<EditePerfil key={version} initialData={user} initialEstablishment={company}
onClose={()=>{window.profileClosed=true;setOpen(false)}} onSave={async(_,data)=>{await api.saveEstablishment(data);window.saved=data;setCompany({...company,...data})}}/>:<p>Salvato</p>}
createRoot(document.getElementById('root')).render(<I18nProvider><Fixture/></I18nProvider>);
` }, bundle: true, format: 'esm', write: false, define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env': '{}' } });
const css = readFileSync('dist/assets/' + readdirSync('dist/assets').find(n => /^index-.*\.css$/.test(n)));
const server = createServer((req, res) => {
  if(req.url==='/fixture.js'){res.setHeader('content-type','text/javascript');res.end(bundle.outputFiles[0].text)}
  else if(req.url==='/fixture.css'){res.setHeader('content-type','text/css');res.end(css)}
  else{res.setHeader('content-type','text/html');res.end('<meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"><div id="root"></div><script type="module" src="/fixture.js"></script>')}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));after(()=>new Promise(r=>server.close(r)));
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH});after(()=>browser.close());
async function fixture(t,width=390,mode='profile'){
 const context=await browser.newContext({viewport:{width,height:844},hasTouch:true,isMobile:width<640});t.after(()=>context.close());
 await context.addInitScript(()=>{localStorage.setItem('templesale_admin_password_v2','old-test-password');localStorage.setItem('templesale_admin_remember_password_v2','true')});
 const state={failLoad:false,failSave:false,loginCalls:0,requests:[],rows:[
 {label:'Altro',key:'altro',source:'system',usageCount:0,keywords:[]},
 {label:'Bar',key:'bar',source:'system',usageCount:1,keywords:['Caffè','Aperitivo']},
 {label:'mago per eventi',key:'mago per eventi',source:'user',usageCount:2,keywords:['Illusionismo','Eventi aziendali']},
 {label:'Servizi di Pulizia',key:'servizi di pulizia',source:'user',usageCount:1,keywords:['Pulizie appartamenti','Uffici']},
 ]};
 await context.route('**/api/**',route=>{
  const req=route.request(),url=new URL(req.url());
  const json=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
  if(url.pathname==='/api/taxonomy/business-categories'){
   state.requests.push(url.searchParams.get('search'));return state.failLoad?json({error:'failure'},500):json({suggestions:state.rows});
  }
  if(url.pathname==='/api/establishments/7'){
   if(state.failSave)return json({error:'Salvataggio non riuscito'},500);
   const data=req.postDataJSON();state.rows.push({label:data.category,key:data.category.toLowerCase(),source:'user',usageCount:1,keywords:data.keywords});
   return json({establishment:{id:7,ownerId:1,...data}});
  }
  if(url.pathname==='/api/admin/publication-capacity')return json({error:'Test metrics unavailable'},500);
  if(url.pathname==='/api/admin/auth/me'||url.pathname==='/api/admin/me')return json({email:'admin@example.test'});
  if(/\/api\/admin\/(auth\/)?login$/.test(url.pathname)){
   state.loginCalls++;return req.postDataJSON().password==='test-only-admin'?json({email:'admin@example.test',token:'test-session-token'}):json({error:'Credenziali non valide'},401);
  }
  return json([]);
 });
 const page=await context.newPage(),errors=[];page.setDefaultTimeout(5000);page.on('pageerror',e=>errors.push(e.message));t.after(()=>assert.deepEqual(errors,[]));
 await page.goto('http://127.0.0.1:'+server.address().port+'/?mode='+mode);
 return {page,state};
}
for(const width of [340,390,768,1440])test(width+'px: categories appear on focus, keyboard/touch selection changes keyword examples and a new category saves/reopens',async t=>{
 const {page,state}=await fixture(t,width);const input=page.getByRole('combobox',{name:'Categoria dell’attività',exact:true});await input.click();
 await page.getByRole('option',{name:'Bar',exact:true}).waitFor();
 assert.equal(state.requests[0],null,'Initial request must not filter by Altro');
 const list=await page.getByRole('listbox').boundingBox();assert.ok(list.x>=0&&list.x+list.width<=width+1);
 await page.getByRole('option',{name:'mago per eventi',exact:true}).tap();
 assert.equal(await input.inputValue(),'mago per eventi');await page.getByRole('button',{name:'+ Illusionismo',exact:true}).waitFor();
 await input.click();await input.press('Escape');assert.equal(await input.getAttribute('aria-expanded'),'false');assert.equal(await page.locator('form').count(),1,'Escape closes the list, not the profile');
 await input.fill('Pulizia');await page.getByRole('option',{name:'Servizi di Pulizia',exact:true}).waitFor();await input.press('ArrowDown');await input.press('Enter');
 await page.getByRole('button',{name:'+ Pulizie appartamenti',exact:true}).waitFor();
 await input.fill('Restauro artigianale');await page.getByText('Nuova categoria: Restauro artigianale',{exact:true}).waitFor();
 const keyword=page.getByRole('textbox',{name:'Parole chiave',exact:true});await keyword.fill('Legno, Mobili');
 await page.getByRole('button',{name:/Salva/}).click();await page.getByText('Salvato',{exact:true}).waitFor();
 const saved=await page.evaluate(()=>window.saved);assert.equal(saved.category,'Restauro artigianale');assert.deepEqual(saved.keywords,['Legno','Mobili']);
 await page.evaluate(()=>window.reopen());await page.getByRole('combobox',{name:'Categoria dell’attività',exact:true}).click();await page.getByRole('option',{name:'Restauro artigianale',exact:true}).waitFor();
});
test('taxonomy fetch failure can retry; a failed save preserves the typed category',async t=>{
 const {page,state}=await fixture(t);await page.getByRole('combobox',{name:'Categoria dell’attività',exact:true}).waitFor();state.failSave=true;
 await page.getByRole('combobox',{name:'Categoria dell’attività',exact:true}).fill('Riparazioni');await page.getByRole('button',{name:/Salva/}).click();
 await page.getByText('Salvataggio non riuscito',{exact:true}).waitFor();assert.equal(await page.getByRole('combobox',{name:'Categoria dell’attività',exact:true}).inputValue(),'Riparazioni');
 state.failLoad=true;await page.reload();await page.getByRole('button',{name:'Categorie non disponibili. Riprova',exact:true}).waitFor();state.failLoad=false;
 await page.getByRole('button',{name:'Categorie non disponibili. Riprova',exact:true}).click();await page.getByRole('combobox',{name:'Categoria dell’attività',exact:true}).click();await page.getByRole('option',{name:'Bar',exact:true}).waitFor();
});
test('admin starts blank, clears old plaintext passwords, rejects one failed login, then shows searchable persisted taxonomy',async t=>{
 const {page,state}=await fixture(t,390,'admin');const email=page.getByLabel('Email',{exact:true}),password=page.getByLabel('Password',{exact:true});
 await email.waitFor();assert.equal(await email.inputValue(),'');assert.equal(await email.getAttribute('placeholder'),'Email amministratore');assert.equal(await password.inputValue(),'');
 assert.equal(await page.evaluate(()=>localStorage.getItem('templesale_admin_password_v2')),null);
 await email.fill('admin@example.test');await password.fill('wrong-test-password');await page.getByRole('button',{name:'Accedi all’amministrazione',exact:true}).click();
 await page.getByText('Credenziali non valide',{exact:true}).waitFor();assert.equal(state.loginCalls,1);
 await password.fill('test-only-admin');await page.getByRole('button',{name:'Accedi all’amministrazione',exact:true}).click();
 await page.getByRole('button',{name:'Categorie',exact:true}).click();await page.getByRole('heading',{name:'Categorie e parole chiave',exact:true}).waitFor();
 await page.getByRole('heading',{name:'mago per eventi',exact:true}).waitFor();await page.getByText('2 attività',{exact:true}).waitFor();
 await page.getByRole('searchbox',{name:'Cerca categorie o parole chiave',exact:true}).fill('uffici');
 assert.equal(await page.getByRole('heading',{name:'Servizi di Pulizia',exact:true}).count(),1);assert.equal(await page.getByRole('heading',{name:'Bar',exact:true}).count(),0);
 assert.equal(await page.evaluate(()=>localStorage.getItem('templesale_admin_password_v2')),null);
});
