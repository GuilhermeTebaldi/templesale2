// Real Auth component and installed Auth0 SDK. Capture /authorize before leaving
// the fixture; never authenticate, exchange tokens, or modify an account.
import {after,test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {build} from 'esbuild';
const domain='dev-dc1ylz5a2z8st3lr.eu.auth0.com';
const clientId='74nHgpfPlMws3oEOGBj1Q7dbqfcWNZ0F';
const audience='https://templesale-api';
const bundle=await build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`
import React from 'react';import {createRoot} from 'react-dom/client';
import {Auth0Provider,Auth0Context,useAuth0} from '@auth0/auth0-react';
import Auth from './src/components/Auth';import {I18nProvider} from './src/i18n/provider';
function Fixture(){const auth=useAuth0();return <Auth0Context.Provider value={{...auth,loginWithRedirect:async options=>{
 window.loginCalls=(window.loginCalls||0)+1;window.loginOptions=options;
 if(location.search.includes('failure')&&window.loginCalls===1)throw Error('Errore di prova');
 return auth.loginWithRedirect({...options,openUrl:url=>{window.authorizeUrl=url}});
}}}><I18nProvider><Auth defaultMode={location.search.includes('register')?'register':'login'} onClose={()=>{window.closed=true}} onSubmit={async()=>{window.legacySubmit=true}}/></I18nProvider></Auth0Context.Provider>}
createRoot(document.getElementById('root')).render(<Auth0Provider domain="${domain}" clientId="${clientId}" authorizationParams={{redirect_uri:location.origin,audience:'${audience}'}} cacheLocation="localstorage" useRefreshTokens><Fixture/></Auth0Provider>);
`},bundle:true,format:'esm',write:false,define:{'process.env.NODE_ENV':'"production"','import.meta.env':JSON.stringify({VITE_AUTH0_DOMAIN:domain,VITE_AUTH0_CLIENT_ID:clientId,VITE_AUTH0_AUDIENCE:audience})}});
const server=createServer((req,res)=>{res.setHeader('content-type',req.url==='/fixture.js'?'text/javascript':'text/html');res.end(req.url==='/fixture.js'?bundle.outputFiles[0].text:'<div id="root"></div><script type="module" src="/fixture.js"></script>')});
await new Promise(r=>server.listen(0,'127.0.0.1',r));after(()=>new Promise(r=>server.close(r)));
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH});after(()=>browser.close());
for(const mode of ['login','register','failure'])test(`${mode}: existing button sends Google connection through SDK with callback, audience and PKCE preserved`,async t=>{
 const context=await browser.newContext();t.after(()=>context.close());
 await context.addInitScript(()=>localStorage.setItem('templesale_test_draft','preserve'));
 await context.route('https://**/*',route=>route.abort());
 const page=await context.newPage();await page.goto('http://127.0.0.1:'+server.address().port+'/?'+mode);
 const button=page.locator('button').last();await button.waitFor();await button.click();
 if(mode==='failure'){await page.getByText('Errore di prova',{exact:true}).waitFor();assert.equal(await page.evaluate(()=>window.authorizeUrl),undefined);await button.click();}
 await page.waitForFunction(()=>!!window.authorizeUrl);
 const params=await page.evaluate(()=>({url:window.authorizeUrl,options:window.loginOptions,draft:localStorage.getItem('templesale_test_draft'),legacySubmit:window.legacySubmit,transaction:JSON.parse(sessionStorage.getItem('a0.spajs.txs.'+'74nHgpfPlMws3oEOGBj1Q7dbqfcWNZ0F'))}));
 const url=new URL(params.url);assert.equal(url.origin,'https://'+domain);assert.equal(url.pathname,'/authorize');
 assert.equal(url.searchParams.get('client_id'),clientId);assert.equal(url.searchParams.get('connection'),'google-oauth2');
 assert.equal(url.searchParams.get('audience'),audience);assert.equal(url.searchParams.get('redirect_uri'),new URL(page.url()).origin);
 assert.equal(url.searchParams.get('response_type'),'code');assert.equal(url.searchParams.get('code_challenge_method'),'S256');
 for(const scope of ['openid','profile','email','offline_access'])assert.ok(url.searchParams.get('scope').split(' ').includes(scope));
 assert.ok(url.searchParams.get('state'));assert.ok(url.searchParams.get('nonce'));assert.ok(url.searchParams.get('code_challenge'));
 assert.deepEqual(params.options.authorizationParams,{connection:'google-oauth2',redirect_uri:new URL(page.url()).origin,audience});
 assert.equal(params.draft,'preserve');assert.equal(params.legacySubmit,undefined);
 assert.equal(params.transaction.state,url.searchParams.get('state'));assert.ok(params.transaction.code_verifier);
});
