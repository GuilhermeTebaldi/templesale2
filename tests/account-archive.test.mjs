import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { createAccountArchiveService, filterArchivedPublicSql, validateAccountClosure } from '../server/account-archive.ts';
import { sqliteBindings, buildDiscoveryQuery } from '../server/discovery.ts';
import { buildLocalFeedQuery } from '../server/local-feed.ts';
async function fixture() {
  const db = new DatabaseSync(':memory:');
  db.exec(`PRAGMA foreign_keys=ON;
    CREATE TABLE users(id INTEGER PRIMARY KEY, auth0_sub TEXT, name TEXT, avatar_url TEXT);
    CREATE TABLE establishments(id INTEGER PRIMARY KEY, owner_user_id INTEGER, is_active INTEGER,
      name TEXT, slug TEXT, category TEXT, city TEXT, address TEXT, latitude REAL, longitude REAL,
      logo_url TEXT, cover_url TEXT, whatsapp_country_iso TEXT, whatsapp_number TEXT, phone TEXT, keywords TEXT);
    CREATE TABLE products(id INTEGER PRIMARY KEY, user_id INTEGER, establishment_id INTEGER);
    CREATE TABLE establishment_publications(id INTEGER PRIMARY KEY, owner_user_id INTEGER, establishment_id INTEGER, created_at INTEGER);
    CREATE TABLE publication_likes(user_id INTEGER, publication_id INTEGER);
    CREATE TABLE sessions(user_id INTEGER);
    CREATE TABLE legal_acceptances(user_id INTEGER, receipt_json TEXT);
    INSERT INTO users VALUES(1,'auth0|one','One',''),(2,'auth0|two','Two','');
    INSERT INTO establishments(id,owner_user_id,is_active,name,latitude,longitude) VALUES(10,1,1,'One',41,12),(11,1,0,'Inactive',41,12),(20,2,1,'Two',41,12);
    INSERT INTO products VALUES(100,1,10),(200,2,20);
    INSERT INTO establishment_publications VALUES(1000,1,10,100),(2000,2,20,100);
    INSERT INTO sessions VALUES(1),(2);
    INSERT INTO legal_acceptances VALUES(1,'original receipt');`);
  const run = (sql, values=[]) => {
    const bound=sqliteBindings(sql,values), stmt=db.prepare(bound.sql);
    return stmt.columns().length ? stmt.all(...bound.values) : (stmt.run(...bound.values), []);
  };
  const query=async (sql,values)=>run(sql,values);
  const transaction=async statements=>{
    db.exec("BEGIN");
    try { for(const s of statements)run(s.sql,s.values); db.exec("COMMIT"); }
    catch(error) { db.exec("ROLLBACK"); throw error; }
  };
  const service=createAccountArchiveService(query,transaction,false);
  await service.initialize();
  return { db,query,transaction,service };
}
test('deactivation preserves all account rows, hides public content and revokes sessions', async () => {
  const { db,service }=await fixture();
  await service.archive(1);
  assert.equal(await service.archived(1),true);
  for(const table of ['users','products','establishment_publications','legal_acceptances']) {
    assert.ok(db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n>0);
  }
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM sessions WHERE user_id=1').get().n,0);
  for(const table of ['users','products','establishments','establishment_publications']) {
    const rows=await service.publicQuery(`SELECT * FROM ${table}`);
    assert.equal(rows.length,1);
  }
  const discovery=buildDiscoveryQuery({lat:41,lng:12,city:'',radius:5,search:'',category:'',limit:10,offset:0},false);
  const feed=buildLocalFeedQuery({limit:10,offset:0},false);
  assert.equal((await service.publicQuery(discovery.sql,discovery.values)).length,1);
  assert.equal((await service.publicQuery(feed.sql,feed.values))[0].owner_user_id,2);
  await service.archive(1); // Repetition must not overwrite original company visibility.
  assert.equal(await service.restore(1,{sub:'auth0|one',email_verified:true}),true);
  assert.deepEqual(db.prepare('SELECT is_active FROM establishments WHERE owner_user_id=1 ORDER BY id').all().map(r=>r.is_active),[1,0]);
  assert.equal(db.prepare('SELECT receipt_json FROM legal_acceptances').get().receipt_json,'original receipt');
  assert.equal((await service.publicQuery('SELECT * FROM products p WHERE p.id=$1',[100])).length,1);
  db.close();
});
test('different or unverified identities cannot recover preserved accounts', async () => {
  const { db,service }=await fixture(); await service.archive(1);
  for(const identity of [{sub:'auth0|two',email_verified:true},{sub:'auth0|one',email_verified:false},{sub:'auth0|one',email_verified:'true'}]) {
    await assert.rejects(()=>service.restore(1,identity));
    assert.equal(await service.archived(1),true);
  }
  db.close();
});
test('failed archival transaction rolls back visibility, history and sessions', async () => {
  const { db,query,transaction }=await fixture();
  const service=createAccountArchiveService(query,statements=>transaction([...statements,{sql:'UPDATE missing_table SET id=1',values:[]}]),false);
  await service.initialize();
  await assert.rejects(()=>service.archive(1));
  assert.equal(await service.archived(1),false);
  assert.equal(db.prepare('SELECT is_active FROM establishments WHERE id=10').get().is_active,1);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM sessions WHERE user_id=1').get().n,1);
  db.close();
});
test('read-only initialization never writes and original SQL is retained without archive schema', async () => {
  const service=createAccountArchiveService(async sql=>{assert.match(sql,/^SELECT/);throw Error('missing');},()=>{throw Error('write');},true);
  await service.initialize(true); assert.equal(service.ready,false);
  assert.equal(filterArchivedPublicSql('SELECT * FROM users u',false),'SELECT * FROM users u');
  await assert.rejects(()=>service.archive(1));
});
test('PostgreSQL deactivation and recovery preserve history and filter aliases',
  { skip: !process.env.DISCOVERY_TEST_DATABASE_URL && !process.env.DISCOVERY_PGLITE_MODULE }, async () => {
  let db,close;
  if(process.env.DISCOVERY_TEST_DATABASE_URL) {
    const { Client }=await import('pg');
    db=new Client({connectionString:process.env.DISCOVERY_TEST_DATABASE_URL}); await db.connect();
    const {randomUUID}=await import('node:crypto'); const schema='archive_test_'+randomUUID().replaceAll('-','');
    await db.query('CREATE SCHEMA '+schema); await db.query('SET search_path TO '+schema);
    close=async()=>{try{await db.query('DROP SCHEMA '+schema+' CASCADE');}finally{await db.end();}};
  } else {
    const {PGlite}=await import(process.env.DISCOVERY_PGLITE_MODULE); db=new PGlite(); close=()=>db.close();
  }
  try {
    await db.exec?.(`CREATE TABLE users(id BIGINT PRIMARY KEY, auth0_sub TEXT);`) ?? await db.query(`CREATE TABLE users(id BIGINT PRIMARY KEY, auth0_sub TEXT);`);
    await db.query('CREATE TABLE establishments(id BIGINT PRIMARY KEY, owner_user_id BIGINT, is_active BOOLEAN);');
    await db.query('CREATE TABLE sessions(user_id BIGINT);');
    await db.query("INSERT INTO users VALUES(1,'auth0|one'),(2,'auth0|two');");
    await db.query('INSERT INTO establishments VALUES(10,1,TRUE),(11,1,FALSE),(20,2,TRUE);');
    await db.query('INSERT INTO sessions VALUES(1),(2);');
    const query=async(sql,values=[]) => (await db.query(sql,values)).rows;
    const transaction=async statements=>{await db.query('BEGIN');try{for(const s of statements)await db.query(s.sql,s.values);await db.query('COMMIT');}catch(error){await db.query('ROLLBACK');throw error;}};
    const service=createAccountArchiveService(query,transaction,true);await service.initialize();
    await service.archive(1);
    assert.equal((await service.publicQuery('SELECT * FROM users')).length,1);
    assert.equal((await service.publicQuery('SELECT e.* FROM establishments e JOIN users u ON u.id=e.owner_user_id')).length,1);
    await assert.rejects(()=>service.restore(1,{sub:'auth0|two',email_verified:true}));
    await service.restore(1,{sub:'auth0|one',email_verified:true});
    assert.deepEqual((await query('SELECT is_active FROM establishments WHERE owner_user_id=1 ORDER BY id')).map(r=>r.is_active),[true,false]);
    await service.purge(1);
    assert.equal((await query('SELECT id FROM users WHERE id=1')).length,0);
    assert.equal((await query('SELECT id FROM establishments WHERE owner_user_id=1')).length,0);
  } finally {await close();}
});

test('permanent deletion removes preserved history and the same identity starts without old content', async () => {
  const { db,service }=await fixture(); await service.archive(1);
  assert.equal(await service.purge(1),true);
  for(const [table,column] of [['users','id'],['products','user_id'],['establishments','owner_user_id'],['establishment_publications','owner_user_id'],['sessions','user_id'],['legal_acceptances','user_id'],['account_archives','user_id']]) {
    assert.equal(db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE ${column}=1`).get().n,0,table);
  }
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM users WHERE id=2').get().n,1);
  db.prepare("INSERT INTO users VALUES(3,'auth0|one','Fresh','')").run();
  assert.equal(await service.restore(3,{sub:'auth0|one',email_verified:true}),false);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM establishments WHERE owner_user_id=3').get().n,0);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM legal_acceptances WHERE user_id=3').get().n,0);
  db.close();
});
test('permanent deletion rolls back every operation on failure', async () => {
  const {db,query,transaction}=await fixture();
  const service=createAccountArchiveService(query,statements=>transaction([...statements,{sql:'DELETE FROM missing_table',values:[]}]),false);
  await service.initialize(); await assert.rejects(()=>service.purge(1));
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM users WHERE id=1').get().n,1);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM products WHERE user_id=1').get().n,1);
  assert.equal(db.prepare('SELECT receipt_json FROM legal_acceptances WHERE user_id=1').get().receipt_json,'original receipt');
  db.close();
});

test('account closure requires verified matching identity and explicit own-email confirmation', () => {
  const user={email:'one@example.test'}, identity={sub:'auth0|one',email:user.email,email_verified:true};
  assert.equal(validateAccountClosure(user,identity,identity.sub,{mode:'delete',confirmation:user.email}),'delete');
  for(const invalid of [{...identity,sub:'auth0|other'},{...identity,email:'other@example.test'},{...identity,email_verified:false},{...identity,email_verified:'true'}]) {
    assert.throws(()=>validateAccountClosure(user,invalid,identity.sub,{mode:'delete',confirmation:user.email}));
  }
  for(const input of [{mode:'delete'},{mode:'purge',confirmation:user.email},{mode:'delete',confirmation:'other@example.test'}]) {
    assert.throws(()=>validateAccountClosure(user,identity,identity.sub,input));
  }
});
