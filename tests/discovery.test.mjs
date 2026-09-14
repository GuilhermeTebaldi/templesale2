import { buildLocalFeedQuery } from '../server/local-feed.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import express from 'express';
import { buildDiscoveryQuery, parseDiscoveryInput, sqliteBindings, initializeDiscovery, registerDiscovery } from '../server/discovery.ts';
import { shouldUpdateLocation } from '../src/lib/discovery-location.ts';

const input = (extra = {}) => parseDiscoveryInput({ lat: '41.6', lng: '12.5', radius: '5', ...extra });
async function fixture(postgres = false) {
  const db = postgres ? new (await import(process.env.DISCOVERY_PGLITE_MODULE)).PGlite() : new Database(':memory:');
  const query = async (sql, values = []) => {
    if (postgres) return (await db.query(sql, values)).rows;
    const bound = sqliteBindings(sql, values);
    const statement = db.prepare(bound.sql);
    if (statement.reader) return statement.all(...bound.values);
    statement.run(...bound.values); return [];
  };
  await db.exec(`
    CREATE TABLE establishments(id INTEGER PRIMARY KEY, name TEXT, category TEXT DEFAULT 'Bar', city TEXT DEFAULT 'Ardea',
      latitude DOUBLE PRECISION, longitude DOUBLE PRECISION, is_active ${postgres ? 'BOOLEAN DEFAULT TRUE' : 'INTEGER DEFAULT 1'},
      description TEXT DEFAULT '', keywords TEXT DEFAULT '[]', logo_url TEXT DEFAULT '', whatsapp_number TEXT DEFAULT '');
    CREATE TABLE products(id INTEGER PRIMARY KEY, establishment_id INTEGER, name TEXT, title TEXT, category TEXT, description TEXT, price TEXT, image_url TEXT, image TEXT, latitude DOUBLE PRECISION, longitude DOUBLE PRECISION);
    CREATE TABLE establishment_publications(id INTEGER PRIMARY KEY, establishment_id INTEGER, caption TEXT, image_url TEXT, created_at INTEGER);
    INSERT INTO establishments(id,name,latitude,longitude) VALUES
      (1,'Near',41.6,12.5),(2,'Second',41.61,12.5),(3,'Outside',41.7,12.5),
      (4,'No coordinates',NULL,NULL),(5,'Date line',0,-179.99),(6,'Pole',89.999,120),(7,'Zero',0,0);
    INSERT INTO establishments(id,name,latitude,longitude,is_active) VALUES (8,'Inactive',41.6,12.5,${postgres ? 'FALSE' : '0'});
    INSERT INTO products VALUES (1,2,'Unique pizza','','Food','', '8 EUR','','test.jpg',0,0);
    INSERT INTO establishment_publications VALUES (1,1,'caffè','1.jpg',1),(2,1,'tea','2.jpg',2),(3,1,'bread','3.jpg',3),(4,1,'100%','4.jpg',4),(5,2,'pizza','5.jpg',5);
  `);
  await initializeDiscovery(query);
  return { db, query, postgres, close: () => db.close() };
}
async function run(f, params) {
  const built = buildDiscoveryQuery(params, f.postgres);
  return f.query(built.sql, built.values);
}
test('invalid, missing, repeated and out-of-range parameters return validation errors', () => {
  for (const raw of [{}, { lat:'0' }, { city:['Ardea'] }, {lat:'91',lng:'0'}, {lat:'0',lng:'NaN'}, {lat:'',lng:'0'}, {city:'Ardea',radius:'0'}, {city:'Ardea',radius:'51'}, {city:'Ardea',limit:'2.5'}, {city:'Ardea',offset:'-1'}]) assert.throws(() => parseDiscoveryInput(raw));
  assert.equal(input({lat:'0',lng:'0'}).lat, 0);
});
for (const postgres of [false, true]) {
  test(`${postgres ? 'PostgreSQL' : 'SQLite'}: radius, ordering, city, text, canonical location and edge geography`, { skip: postgres && !process.env.DISCOVERY_PGLITE_MODULE }, async () => {
    const f = await fixture(postgres);
    try {
      const rows = await run(f, input());
      assert.deepEqual(rows.map(row => row.id), [1,2]);
      assert.ok(rows[0].distance_km < 0.001);
      assert.ok(rows[1].distance_km > 1 && rows[1].distance_km < 1.2);
      assert.deepEqual((await run(f,input({search:'Unique pizza'}))).map(row => row.id), [2]);
      assert.deepEqual((await run(f,input({search:'100%'}))).map(row => row.id), [1]);
      assert.equal((await run(f,input({search:"' OR 1=1 --"}))).length, 0);
      assert.equal((await run(f,input({category:'Officine'}))).length, 0);
      assert.equal((await run(f,input({radius:'1'}))).length, 1);
      assert.deepEqual((await run(f,input({lat:'0',lng:'179.99'}))).map(row => row.id), [5]);
      assert.deepEqual((await run(f,input({lat:'89.999',lng:'0'}))).map(row => row.id), [6]);
      assert.deepEqual((await run(f,input({lat:'0',lng:'0'}))).map(row => row.id), [7]);
      const city = await run(f, parseDiscoveryInput({city:'ardea'}));
      assert.equal(city.length, 6);
      assert.ok(city.every(row => row.distance_km === null));
      assert.ok(!city.some(row => row.id === 4));
      assert.equal((await run(f,parseDiscoveryInput({city:'Roma'}))).length, 0);
      assert.deepEqual((await run(f,input({offset:'1'}))).map(row => row.id), [2]);
    } finally { await f.close(); }
  });
}
test('API paginates and bounds previews, handles invalid requests and restricts aggregate metrics', async () => {
  const f = await fixture();
  const app = express(); app.use(express.json());
  registerDiscovery(app, { query: f.query, postgres: false, normalizeEstablishment: row => row, normalizePublication: row => row, requireAdmin: (req,res) => { if (req.headers.authorization === 'test-admin') return true; res.sendStatus(401); return false; } });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening',resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const response = await fetch(`${base}/api/discovery?lat=41.6&lng=12.5&limit=1`);
    assert.equal(response.status,200);
    assert.equal(response.headers.get('cache-control'),'no-store');
    const page = await response.json();
    assert.equal(page.items.length,1); assert.equal(page.hasMore,true); assert.equal(page.nextOffset,1);
    assert.deepEqual(page.items[0].publications.map(row => row.id),[4,3,2]);
    assert.equal((await fetch(`${base}/api/discovery?lat=0&lng=NaN`)).status,400);
    assert.equal((await fetch(`${base}/api/admin/discovery-metrics`)).status,401);
    const event = () => fetch(`${base}/api/discovery/events`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event:'whatsapp',establishmentId:1})});
    assert.equal((await event()).status,204); assert.equal((await event()).status,204);
    const metrics = await (await fetch(`${base}/api/admin/discovery-metrics`,{headers:{authorization:'test-admin'}})).json();
    assert.equal(metrics.metrics.find(row => row.event === 'whatsapp').count,1);
    assert.ok(metrics.metrics.every(row => !('latitude' in row) && !('search' in row)));
  } finally { await new Promise(resolve => server.close(resolve)); await f.close(); }
});
test('GPS requires both elapsed time and meaningful movement', () => {
  const previous = {lat:41.6,lng:12.5,at:100000};
  assert.equal(shouldUpdateLocation(null,previous,100000),true);
  assert.equal(shouldUpdateLocation(previous,{lat:41.61,lng:12.5},110000),false);
  assert.equal(shouldUpdateLocation(previous,{lat:41.6001,lng:12.5},150000),false);
  assert.equal(shouldUpdateLocation(previous,{lat:41.61,lng:12.5},150000),true);
});


test('feed selects recent photos per company, then orders and paginates by distance', async () => {
  const f = await fixture();
  try {
    await f.db.exec(`
      ALTER TABLE establishments ADD COLUMN slug TEXT DEFAULT '';
      ALTER TABLE establishments ADD COLUMN cover_url TEXT DEFAULT '';
      ALTER TABLE establishment_publications ADD COLUMN owner_user_id INTEGER;
      CREATE TABLE users(id INTEGER PRIMARY KEY, avatar_url TEXT);
      CREATE TABLE publication_likes(publication_id INTEGER);
    `);
    const load = async (extra = {}) => {
      const built = buildLocalFeedQuery({latitude:41.6,longitude:12.5,limit:3,offset:0,...extra},false);
      return f.query(built.sql,built.values);
    };
    const rows = await load();
    assert.deepEqual(rows.map(row=>row.id), [4,3,2,5]);
    assert.ok(rows[3].distance_km > 1 && rows[3].distance_km < 1.2);
    assert.deepEqual((await load({offset:3})).map(row=>row.id), [5]);
    assert.deepEqual((await load({latitude:41.61})).map(row=>row.id), [5,4,3,2]);
    assert.deepEqual((await load({latitude:undefined,longitude:undefined,limit:10})).map(row=>row.id),[5,4,3,2,1]);
  } finally { await f.close(); }
});
