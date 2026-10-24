import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import Database from 'better-sqlite3';
import pg from 'pg';
import express from 'express';
import { sqliteBindings } from '../server/discovery.ts';
import { publicAccountRows, filterArchivedPublicSql, createAccountArchiveService } from '../server/account-archive.ts';
import { buildLocalFeedQuery, buildPublicationPreviewsQuery } from '../server/local-feed.ts';
import { createPublicationTrashService, initializePublicationLegacyRemovals, registerPublicationTrashRoutes } from '../server/publication-trash.ts';

async function fixture(t, postgres = false) {
  let db, close;
  if (postgres && process.env.DISCOVERY_TEST_DATABASE_URL) {
    db = new pg.Client({ connectionString: process.env.DISCOVERY_TEST_DATABASE_URL }); await db.connect();
    const schema = 'trash_test_' + randomUUID().replaceAll('-', '');
    await db.query('CREATE SCHEMA ' + schema); await db.query('SET search_path TO ' + schema);
    close = async () => { try { await db.query('DROP SCHEMA ' + schema + ' CASCADE'); } finally { await db.end(); } };
  } else if (postgres) {
    const { PGlite } = await import(process.env.DISCOVERY_PGLITE_MODULE); db = new PGlite(); close = () => db.close();
  } else { db = new Database(':memory:'); db.pragma('foreign_keys=ON'); close = () => db.close(); }
  t.after(close);
  const query = async (sql, values = []) => {
    if (postgres) return (await db.query(sql, values)).rows;
    const bound = sqliteBindings(sql, values), statement = db.prepare(bound.sql);
    return statement.reader ? statement.all(...bound.values) : (statement.run(...bound.values), []);
  };
  const transaction = async statements => {
    await query('BEGIN');
    try { for (const s of statements) await query(s.sql, s.values); await query('COMMIT'); }
    catch (e) { await query('ROLLBACK'); throw e; }
  };
  const ddl = `CREATE TABLE users(id INTEGER PRIMARY KEY, auth0_sub TEXT, avatar_url TEXT);
    CREATE TABLE establishments(id INTEGER PRIMARY KEY, owner_user_id INTEGER REFERENCES users(id), name TEXT, slug TEXT, category TEXT, city TEXT,
      logo_url TEXT, cover_url TEXT, address TEXT, whatsapp_country_iso TEXT, whatsapp_number TEXT, phone TEXT,
      latitude DOUBLE PRECISION, longitude DOUBLE PRECISION, is_active ${postgres ? 'BOOLEAN' : 'INTEGER'});
    CREATE TABLE products(id INTEGER PRIMARY KEY, user_id INTEGER REFERENCES users(id));
    CREATE TABLE establishment_publications(id INTEGER PRIMARY KEY, owner_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      establishment_id INTEGER REFERENCES establishments(id) ON DELETE CASCADE, caption TEXT, image_url TEXT, media TEXT,
      legacy_product_id INTEGER REFERENCES products(id) ON DELETE SET NULL, created_at BIGINT, updated_at BIGINT);
    CREATE TABLE publication_likes(user_id INTEGER, publication_id INTEGER REFERENCES establishment_publications(id) ON DELETE CASCADE);
    CREATE TABLE publication_saves(user_id INTEGER, publication_id INTEGER REFERENCES establishment_publications(id) ON DELETE CASCADE);
    CREATE TABLE product_comments(id INTEGER PRIMARY KEY, publication_id INTEGER REFERENCES establishment_publications(id) ON DELETE CASCADE, body TEXT);
    CREATE TABLE establishment_home_publications(establishment_id INTEGER PRIMARY KEY, publication_id INTEGER REFERENCES establishment_publications(id) ON DELETE CASCADE);
    INSERT INTO users VALUES(1,'auth0|one',''),(2,'auth0|two','');
    INSERT INTO establishments(id,owner_user_id,name,slug,category,city,latitude,longitude,is_active) VALUES(10,1,'One','one','Bar','Ardea',41.6,12.5,${postgres ? 'TRUE' : '1'}),(20,2,'Two','two','Bar','Ardea',41.6,12.5,${postgres ? 'TRUE' : '1'});
    INSERT INTO products VALUES(90,1);
    INSERT INTO establishment_publications VALUES(100,1,10,'First','first.jpg','["first.jpg"]',90,100,100),(101,1,10,'Latest','latest.jpg','["latest.jpg"]',NULL,200,200),(200,2,20,'Other','other.jpg','["other.jpg"]',NULL,100,100);
    INSERT INTO publication_likes VALUES(2,101); INSERT INTO publication_saves VALUES(2,101);
    INSERT INTO product_comments VALUES(1,101,'Kept comment'); INSERT INTO establishment_home_publications VALUES(10,101);`;
  if (postgres) await db.exec?.(ddl) ?? await db.query(ddl); else db.exec(ddl);
  await initializePublicationLegacyRemovals(query);
  const service = createPublicationTrashService(query, transaction, () => true); await service.initialize();
  const accounts = createAccountArchiveService(query, transaction, postgres, () => service.ready); await accounts.initialize();
  const publicQuery = accounts.publicQuery;
  return { query, transaction, service, accounts, publicQuery };
}
for (const postgres of [false, true]) {
  const engine = postgres ? 'PostgreSQL' : 'SQLite';
  const options = { skip: postgres && !process.env.DISCOVERY_TEST_DATABASE_URL && !process.env.DISCOVERY_PGLITE_MODULE };
  test(`${engine}: removal preserves interactions and hides the photo from profile, feed, previews and saved queries`, options, async t => {
    const f = await fixture(t, postgres);
    assert.equal(await f.service.remove(101,1), true);
    for (const table of ['establishment_publications','publication_likes','publication_saves','product_comments'])
      assert.equal(Number((await f.query(`SELECT COUNT(*) AS n FROM ${table} WHERE ${table === 'establishment_publications' ? 'id' : 'publication_id'}=101`))[0].n), 1);
    assert.equal((await f.publicQuery('SELECT ep.* FROM establishment_publications ep WHERE ep.id=$1',[101])).length,0);
    const feed = buildLocalFeedQuery({limit:10,offset:0,homeSelection:true},postgres);
    assert.ok((await f.publicQuery(feed.sql,feed.values)).every(row=>Number(row.id)!==101));
    const previews = buildPublicationPreviewsQuery([10]);
    assert.deepEqual((await f.publicQuery(previews.sql,previews.values)).map(row=>Number(row.id)),[100]);
    assert.equal((await f.publicQuery('SELECT ep.* FROM publication_saves ps JOIN establishment_publications ep ON ep.id=ps.publication_id')).length,0);
    assert.equal((await f.query('SELECT * FROM establishment_home_publications')).length,0);
  });
  test(`${engine}: each account is isolated; edits stay private and restoration keeps the ledger and original id`, options, async t => {
    const f = await fixture(t, postgres);
    assert.equal(await f.service.remove(101,2),false);
    await f.service.remove(101,1); await f.service.remove(200,2);
    assert.deepEqual((await f.service.list(1,10,0)).map(row=>Number(row.id)),[101]);
    assert.deepEqual((await f.service.list(2,10,0)).map(row=>Number(row.id)),[200]);
    assert.equal(await f.service.restore(101,2),false); assert.equal(await f.service.purge(101,2),false);
    await f.query('UPDATE establishment_publications SET caption=$1 WHERE id=$2 AND owner_user_id=$3',['Private edit',101,1]);
    assert.equal((await f.publicQuery('SELECT ep.* FROM establishment_publications ep WHERE ep.id=101')).length,0);
    assert.equal(await f.service.restore(101,1),true);
    assert.equal((await f.publicQuery('SELECT ep.* FROM establishment_publications ep WHERE ep.id=101'))[0].caption,'Private edit');
    assert.equal(Number((await f.service.list(1,10,0))[0].trash_hidden),0);
    await f.service.remove(101,1);
    assert.equal((await f.service.list(1,10,0)).length,1,'Repeated removal never creates duplicate archive entries');
    assert.equal(Number((await f.service.list(1,10,0))[0].trash_hidden),1);
    assert.equal((await f.service.list(1,1,1)).length,0);
    const restarted = createPublicationTrashService(f.query, f.transaction, () => true); await restarted.initialize();
    assert.deepEqual((await restarted.list(1,10,0)).map(row => Number(row.id)), [101], 'The list survives service restarts');
  });
  test(`${engine}: only archived photos can be purged, cascades are complete and legacy photos cannot be reimported`, options, async t => {
    const f = await fixture(t,postgres);
    assert.equal(await f.service.purge(101,1),false,'Normal photos require the archive first');
    await f.service.remove(101,1); assert.equal(await f.service.purge(101,1),true);
    for (const table of ['establishment_publications','publication_likes','publication_saves','product_comments','publication_trash'])
      assert.equal((await f.query(`SELECT * FROM ${table} WHERE ${table==='establishment_publications'?'id':'publication_id'}=101`)).length,0);
    await f.service.remove(100,1); await f.service.restore(100,1); assert.equal(await f.service.purge(100,1),true);
    assert.equal((await f.query('SELECT * FROM publication_legacy_removals WHERE legacy_product_id=90')).length,1);
    assert.equal((await f.query('SELECT p.id FROM products p WHERE NOT EXISTS (SELECT 1 FROM publication_legacy_removals pr WHERE pr.legacy_product_id=p.id)')).length,0);
    assert.equal((await f.query('SELECT * FROM establishment_publications WHERE id=200')).length,1);
  });
  test(`${engine}: failed removal rolls back both hiding and the selected Home photo`,options,async t=>{
    const f=await fixture(t,postgres);
    const broken=createPublicationTrashService(f.query,statements=>f.transaction([...statements,{sql:'UPDATE missing_table SET id=1',values:[]}]),()=>true);
    await broken.initialize(); await assert.rejects(()=>broken.remove(101,1));
    assert.equal((await f.service.list(1,10,0)).length,0);
    assert.equal((await f.publicQuery('SELECT ep.* FROM establishment_publications ep WHERE ep.id=101')).length,1);
    assert.equal((await f.query('SELECT * FROM establishment_home_publications')).length,1);
  });
  test(`${engine}: a failed permanent deletion restores the publication, interactions and legacy link`,options,async t=>{
    const f=await fixture(t,postgres); await f.service.remove(100,1);
    const broken=createPublicationTrashService(f.query,statements=>f.transaction([...statements,{sql:'UPDATE missing_table SET id=1',values:[]}]),()=>true);
    await broken.initialize();await assert.rejects(()=>broken.purge(100,1));
    assert.equal((await f.query('SELECT * FROM establishment_publications WHERE id=100')).length,1);
    assert.equal((await f.service.list(1,10,0)).length,1);
    assert.equal((await f.query('SELECT * FROM publication_legacy_removals')).length,0);
  });
  test(`${engine}: private HTTP routes reject guests, other owners and unconfirmed permanent deletion`,options,async t=>{
    const f=await fixture(t,postgres); await f.service.remove(101,1);
    const app=express();app.use(express.json());
    registerPublicationTrashRoutes(app,{publicationTrash:f.service,requireAuth:async(req,res)=>{
      const id=Number(req.header('x-test-user'));if(id===1||id===2)return {id};res.status(401).json({error:'Login'});return null;
    },normalizePublicationRow:row=>({id:Number(row.id),ownerId:Number(row.owner_user_id)}),selectPublicationByIdRecord:async id=>(await f.publicQuery('SELECT ep.* FROM establishment_publications ep WHERE ep.id=$1',[id]))[0]??null});
    const server=await new Promise(r=>{const s=app.listen(0,'127.0.0.1',()=>r(s));});t.after(()=>new Promise(r=>server.close(r)));
    const request=(path,owner,method='GET',body)=>fetch('http://127.0.0.1:'+server.address().port+path,{method,headers:{'content-type':'application/json',...(owner?{'x-test-user':String(owner)}:{})},body:body?JSON.stringify(body):undefined});
    assert.equal((await request('/api/publication-trash')).status,401);
    const empty=await request('/api/publication-trash',2);assert.equal(empty.headers.get('cache-control'),'no-store');assert.deepEqual((await empty.json()).publications,[]);
    assert.equal((await request('/api/publications/101/restore',2,'POST')).status,404);
    assert.equal((await request('/api/publication-trash/101',2,'DELETE',{confirm:true})).status,404);
    assert.equal((await request('/api/publication-trash/101',1,'DELETE')).status,400);
    assert.equal((await request('/api/publications/101/restore',1,'POST')).status,200);
    assert.equal((await (await request('/api/publication-trash',1)).json()).publications[0].isTrashed,false);
    assert.equal((await request('/api/publication-trash/101',1,'DELETE',{confirm:true})).status,200);
  });
}
test('read-only mode never changes schema or data',async()=>{
  const seen=[];const service=createPublicationTrashService(async sql=>{seen.push(sql);throw Error('missing');},()=>{throw Error('write');},()=>false);
  await service.initialize(true);assert.equal(service.ready,false);assert.ok(seen.every(sql=>sql.startsWith('SELECT')));
  await assert.rejects(()=>service.remove(1,1));await assert.rejects(()=>service.restore(1,1));await assert.rejects(()=>service.purge(1,1));
  assert.equal(publicAccountRows('establishment_publications',false,false),'establishment_publications');
  assert.match(filterArchivedPublicSql('SELECT * FROM establishment_publications',false,true),/AS establishment_publications$/);
});
