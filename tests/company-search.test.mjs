import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import pg from 'pg';
import {buildCompanySearch, initializeCompanySearch, searchCompanies} from '../server/company-search.ts';
import {sqliteBindings} from '../server/discovery.ts';

const tables={publications:'establishment_publications',products:'products',users:'users',archived:true};
function setup(postgres=false){
 return `CREATE TABLE users(id INTEGER PRIMARY KEY,avatar_url TEXT);
 CREATE TABLE establishments(id INTEGER PRIMARY KEY,owner_user_id INTEGER,name TEXT,category TEXT,city TEXT,keywords TEXT DEFAULT '[]',description TEXT DEFAULT '',latitude DOUBLE PRECISION,longitude DOUBLE PRECISION,is_active ${postgres?'BOOLEAN DEFAULT TRUE':'INTEGER DEFAULT 1'});
 CREATE TABLE establishment_publications(id INTEGER PRIMARY KEY,establishment_id INTEGER,caption TEXT);
 CREATE TABLE products(id INTEGER PRIMARY KEY,establishment_id INTEGER,name TEXT,title TEXT,category TEXT,description TEXT,details TEXT);
 CREATE TABLE storefront_sections(establishment_id INTEGER,name TEXT);
 CREATE TABLE account_archives(user_id INTEGER);
 INSERT INTO establishments(id,owner_user_id,name,category,city,latitude,longitude,keywords,description) VALUES
 (1,1,'Caffè vicino','Bar','Ardea',41.6,12.5,'["Aperitivo","Caffè"]','Colazione'),
 (2,2,'Bar','Bar','Ardea',41.65,12.5,'["Birra"]',''),
 (3,3,'Barbiere vicino','Barbieri','Ardea',41.6001,12.5,'["Capelli"]',''),
 (4,4,'Bazar Casa Blanca','Bazar e casalinghi','Ardea',41.6002,12.5,'["Barbecue"]','Barbecue e mobili'),
 (5,5,'Pulizie Tebaldi','Servizi di Pulizia','Ardea',41.6003,12.5,'["Pulizia"]','Pulizie per bar e negozi'),
 (6,6,'Pudineira','Cucina','Pomezia',41.61,12.5,'["Dolci","Pasticceria"]','Pudim fatto in casa'),
 (7,7,'Pizzeria Aurora','Pizzeria','Ardea',41.62,12.5,'["Pizza","Forno"]',''),
 (8,8,'Closed','Bar','Ardea',41.6004,12.5,'[]',''),
 (9,9,'Archived','Bar','Ardea',41.6005,12.5,'[]',''),
 (10,10,'Spettacoli','Mago per eventi','Ardea',41.63,12.5,'[]','');
 UPDATE establishments SET is_active=${postgres?'FALSE':'0'} WHERE id=8;
 INSERT INTO account_archives VALUES(9);
 INSERT INTO establishment_publications VALUES(1,5,'Servizi per bar'),(2,6,'Torta alla fragola');
 INSERT INTO products VALUES(1,4,'Statua artigianale','','Arredamento','Terracotta','{}');
 INSERT INTO storefront_sections VALUES(4,'Giardino');`;
}
function sqliteFixture(){
 const db=new DatabaseSync(':memory:');db.exec(setup());
 const query=async(search,extra={})=>{const built=buildCompanySearch({search,limit:80,requireLocation:true,latitude:41.6,longitude:12.5,...extra},false,tables);const bound=sqliteBindings(built.sql,built.values);return db.prepare(bound.sql).all(...bound.values);};
 return {db,query};
}
test('company search: every PostgreSQL parameter is used, including short, combined and startup searches',()=>{
 for(const search of ['bar','pizza','caffè','mago','bar Ardea','???',"' OR 1=1 --",'neverfound'])for(const allowTypos of [false,true]){
  const b=buildCompanySearch({search,limit:80,allowTypos,latitude:41.6,longitude:12.5,ownerId:7},true,tables);
  const used=new Set([...b.sql.matchAll(/\$(\d+)/g)].map(m=>Number(m[1])));
  assert.deepEqual([...used].sort((a,b)=>a-b),b.values.map((_,i)=>i+1),search);
 }
});
test('SQLite: actual category intent excludes barbiere, barbecue, unrelated businesses and captions; nearest first',async()=>{
 const f=sqliteFixture();try{
  assert.deepEqual((await f.query('Bar')).map(r=>r.id),[1,2]);
  assert.deepEqual((await f.query('bar')).map(r=>r.id),[1,2]);
  assert.deepEqual((await f.query('Pizzeria')).map(r=>r.id),[7]);
  assert.deepEqual((await f.query('servizi di pulizia')).map(r=>r.id),[5]);
 }finally{f.db.close();}
});
test('SQLite: stored names, keywords, locations, publications and products remain searchable; real empty result stays empty',async()=>{
 const f=sqliteFixture();try{
  for(const [search,expected] of [['caffe',[1]],['dolci',[6]],['Pudineira',[6]],['pizza Ardea',[7]],['statua',[4]],['fragola',[6]],['giardino',[4]],['nothingregistered',[]],["' OR 1=1 --",[]],['%',[]]]) assert.deepEqual((await f.query(search)).map(r=>r.id),expected,search);
  f.db.exec("DELETE FROM establishments WHERE category='Bar'");
  f.db.exec("UPDATE establishments SET description='' WHERE id=5; DELETE FROM establishment_publications WHERE establishment_id=5");
  assert.deepEqual(await f.query('bar'),[],'bar does not become a substring match for barbiere/barbecue');
 }finally{f.db.close();}
});
test('PostgreSQL: executes real SQL and corrects typos only against stored data after a genuine empty result', {skip:!process.env.DISCOVERY_TEST_DATABASE_URL&&!process.env.DISCOVERY_PGLITE_MODULE}, async()=>{
 const native=Boolean(process.env.DISCOVERY_TEST_DATABASE_URL);
 const client=native?new pg.Client({connectionString:process.env.DISCOVERY_TEST_DATABASE_URL}):new (await import(process.env.DISCOVERY_PGLITE_MODULE)).PGlite();
 if(native)await client.connect();
 const schema='company_search_'+randomUUID().replaceAll('-','');
 try{
  if(native)await client.query('CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public');
  await client.query('CREATE SCHEMA '+schema);await client.query('SET search_path TO '+schema+',public');
  if(native)await client.query(setup(true));else await client.exec(setup(true));
  const pool={connect:async()=>({query:(sql,values)=>client.query(sql,values),release(){}})};
  if(native)await initializeCompanySearch(pool);
  const query=(search,allowTypos=false)=>searchCompanies(pool,buildCompanySearch({search,allowTypos,limit:80,requireLocation:true,latitude:41.6,longitude:12.5},true,tables));
  assert.deepEqual((await query('bar')).map(r=>r.id),[1,2]);
  assert.deepEqual((await query('pizza')).map(r=>r.id),[7]);
  assert.deepEqual(await query('barr'),[]);
  assert.deepEqual((await query('barr',true)).map(r=>r.id),[1,2]);
  assert.deepEqual((await query('bazra',true)).map(r=>r.id),[4]);
  assert.deepEqual(await query('nothingregistered',true),[]);
  assert.deepEqual(await query('pera',true),[],'A connector such as per must not create an unrelated correction');
  assert.deepEqual((await query('mgao',true)).map(r=>r.id),[10]);
  assert.deepEqual((await query('pasticeria',true)).map(r=>r.id),[6],'Corrections include stored keywords, not just built-in categories');
  // Exercise the real selector: exact query first; typo fallback only for zero
  // matches. No app server, authentication or real account is started here.
  const source=readFileSync('server.ts','utf8'),start=source.indexOf('async function selectEstablishmentsRows('),end=source.indexOf('type TaxonomySuggestionRecord',start);
  const body=ts.transpileModule(source.slice(start,end)+'\nreturn selectEstablishmentsRows;', {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
  const calls=[];
  const select=new Function('pgPool','buildCompanySearch','searchCompanies','publicAccountRows','accountArchives','publicationTrash','normalizeEstablishmentRow',body)(pool,buildCompanySearch,async(p,b)=>{calls.push(b.sql);return searchCompanies(p,b);},name=>name,{ready:true},{ready:false},row=>row);
  assert.deepEqual((await select({search:'bar',latitude:41.6,longitude:12.5})).map(r=>r.id),[1,2]);assert.equal(calls.length,1);
  calls.length=0;assert.deepEqual((await select({search:'barr',latitude:41.6,longitude:12.5})).map(r=>r.id),[1,2]);assert.equal(calls.length,2);
 }finally{await client.query('DROP SCHEMA IF EXISTS '+schema+' CASCADE');await (native?client.end():client.close());}
});
