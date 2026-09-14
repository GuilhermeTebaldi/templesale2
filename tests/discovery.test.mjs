import { buildLocalFeedQuery, buildPublicationPreviewsQuery, parseFeedCursor, encodeFeedCursor, parseFeedExclusions } from '../server/local-feed.ts';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import express from 'express';
import { buildDiscoveryQuery, parseDiscoveryInput, sqliteBindings, initializeDiscovery, registerDiscovery } from '../server/discovery.ts';
import { shouldUpdateLocation } from '../src/lib/discovery-location.ts';

const input = (extra = {}) => parseDiscoveryInput({ lat: '41.6', lng: '12.5', radius: '5', ...extra });
async function fixture(postgres = false) {
  let client;
  let schema;
  let db;
  if (postgres && process.env.DISCOVERY_TEST_DATABASE_URL) {
    client = new pg.Client({ connectionString: process.env.DISCOVERY_TEST_DATABASE_URL });
    await client.connect();
    schema = 'discovery_test_' + randomUUID().replaceAll('-', '');
    await client.query('CREATE SCHEMA ' + schema);
    await client.query('SET search_path TO ' + schema);
    db = { exec: sql => client.query(sql), query: (sql, values) => client.query(sql, values),
      close: async () => { try { await client.query('DROP SCHEMA ' + schema + ' CASCADE'); } finally { await client.end(); } } };
  } else {
    db = postgres ? new (await import(process.env.DISCOVERY_PGLITE_MODULE)).PGlite() : new Database(':memory:');
  }
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
      description TEXT DEFAULT '', keywords TEXT DEFAULT '[]', logo_url TEXT DEFAULT '', whatsapp_number TEXT DEFAULT '',
      slug TEXT DEFAULT '', cover_url TEXT DEFAULT '', address TEXT DEFAULT '', phone TEXT DEFAULT '', whatsapp_country_iso TEXT DEFAULT 'IT');
    CREATE TABLE products(id INTEGER PRIMARY KEY, establishment_id INTEGER, name TEXT, title TEXT, category TEXT, description TEXT, price TEXT, image_url TEXT, image TEXT, latitude DOUBLE PRECISION, longitude DOUBLE PRECISION);
    CREATE TABLE establishment_publications(id INTEGER PRIMARY KEY, establishment_id INTEGER, caption TEXT, image_url TEXT, created_at INTEGER, owner_user_id INTEGER);
    CREATE TABLE users(id INTEGER PRIMARY KEY, avatar_url TEXT);
    CREATE TABLE publication_likes(publication_id INTEGER);
    INSERT INTO establishments(id,name,latitude,longitude) VALUES
      (1,'Near',41.6,12.5),(2,'Second',41.61,12.5),(3,'Outside',41.7,12.5),
      (4,'No coordinates',NULL,NULL),(5,'Date line',0,-179.99),(6,'Pole',89.999,120),(7,'Zero',0,0);
    INSERT INTO establishments(id,name,latitude,longitude,is_active) VALUES (8,'Inactive',41.6,12.5,${postgres ? 'FALSE' : '0'});
    INSERT INTO products VALUES (1,2,'Unique pizza','','Food','', '8 EUR','','test.jpg',0,0);
    INSERT INTO establishment_publications(id,establishment_id,caption,image_url,created_at) VALUES (1,1,'caffè','1.jpg',1),(2,1,'tea','2.jpg',2),(3,1,'bread','3.jpg',3),(4,1,'100%','4.jpg',4),(5,2,'pizza','5.jpg',5);
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
  test(`${postgres ? 'PostgreSQL' : 'SQLite'}: radius, ordering, city, text, canonical location and edge geography`, { skip: postgres && !process.env.DISCOVERY_TEST_DATABASE_URL && !process.env.DISCOVERY_PGLITE_MODULE }, async () => {
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
  registerDiscovery(app, { query: f.query, postgres: false, normalizeEstablishment: row => row, normalizePublication: row => row, requireAdmin: async (req,res) => { if (req.headers.authorization === 'test-admin') return true; res.sendStatus(401); return false; } });
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
    const searchEvent = await fetch(`${base}/api/discovery/events`, {
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event:'search',establishmentId:0})
    });
    assert.equal(searchEvent.status,204);
    const invalidEvent = await fetch(`${base}/api/discovery/events`, {
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event:'whatsapp',establishmentId:0})
    });
    assert.equal(invalidEvent.status,400);
    const metrics = await (await fetch(`${base}/api/admin/discovery-metrics`,{headers:{authorization:'test-admin'}})).json();
    assert.equal(metrics.locationAudit.missingCoordinates,1);
    assert.equal(metrics.locationAudit.establishments[0].id,4);
    assert.equal(metrics.metrics.find(row => row.event === 'search').count,1);
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


for (const postgres of [false, true]) {
  test(`${postgres ? 'PostgreSQL' : 'SQLite'}: feed keeps one latest photo per company, including older photos, and orders by proximity`,
    { skip: postgres && !process.env.DISCOVERY_TEST_DATABASE_URL && !process.env.DISCOVERY_PGLITE_MODULE }, async () => {
    const f = await fixture(postgres);
    try {
      const loadFeed = async (extra = {}) => {
        const built = buildLocalFeedQuery({latitude:41.6,longitude:12.5,limit:3,offset:0,...extra},postgres);
        return f.query(built.sql,built.values);
      };
      const rows = await loadFeed();
      assert.deepEqual(rows.map(row=>row.id), [4,5]);
      assert.ok(rows[1].distance_km > 1 && rows[1].distance_km < 1.2);
      assert.deepEqual((await loadFeed({offset:1})).map(row=>row.id), [5]);
      assert.deepEqual((await loadFeed({latitude:41.61})).map(row=>row.id), [5,4]);
      assert.deepEqual((await loadFeed({latitude:undefined,longitude:undefined,limit:10})).map(row=>row.id),[5,4]);
      await f.db.exec(`
        INSERT INTO establishment_publications(id,establishment_id,caption,image_url,created_at) VALUES
        (6,1,'New afternoon photo','6.jpg',6),(7,3,'Distant photo','7.jpg',1),
        (8,4,'No coordinates','8.jpg',8),(9,8,'Inactive','9.jpg',9);
      `);
      assert.deepEqual((await loadFeed()).map(row=>row.id), [6,5,7]);
      assert.ok((await loadFeed())[2].distance_km > 10, 'Feed must not hide companies past the map radius');
      const previews = buildPublicationPreviewsQuery([1,2,3]);
      assert.deepEqual((await f.query(previews.sql,previews.values)).filter(row=>row.establishment_id === 1).map(row=>row.id),[6,4,3]);
      assert.deepEqual((await loadFeed({excludeIds:[1]})).map(row=>row.id),[5,7]);
    } finally { await f.close(); }
  });

  test(`${postgres ? 'PostgreSQL' : 'SQLite'}: cursor pagination survives new posts, ties, removed anchors and origin changes`,
    { skip: postgres && !process.env.DISCOVERY_TEST_DATABASE_URL && !process.env.DISCOVERY_PGLITE_MODULE }, async () => {
    const f = await fixture(postgres);
    try {
      await f.db.exec(`
        UPDATE establishments SET latitude = 41.61, longitude = 12.5 WHERE id = 3;
        INSERT INTO establishment_publications(id,establishment_id,caption,image_url,created_at) VALUES (6,3,'Same distance and time','6.jpg',5);
      `);
      for (const location of [{latitude:41.6,longitude:12.5}, {}]) {
        const queryPage = async (cursor, snapshotId = cursor?.snapshotId ?? 6) => {
          const built = buildLocalFeedQuery({...location,limit:1,offset:0,snapshotId,cursor},postgres);
          return f.query(built.sql,built.values);
        };
        const ids = [];
        let cursor;
        for (let page = 0; page < 5; page++) {
          const rows = await queryPage(cursor);
          if (!rows.length) break;
          ids.push(rows[0].id);
          cursor = parseFeedCursor(encodeFeedCursor(rows[0],6,location),location);
          assert.equal(cursor.snapshotId,6);
          if (rows.length === 1) break;
        }
        assert.deepEqual(ids,location.latitude === undefined ? [6,5,4] : [4,6,5]);
        const first = (await queryPage())[0];
        const anchor = parseFeedCursor(encodeFeedCursor(first,6,location),location);
        await f.query('INSERT INTO establishment_publications(id,establishment_id,created_at) VALUES ($1,$2,$3)',[7,2,100]);
        const remaining = await queryPage(anchor);
        assert.ok(remaining.every(row=>row.id !== 7), 'new publications belong to a new snapshot');
        assert.ok(remaining.some(row=>row.id === 5), 'an older page must not skip a merchant after a new post');
        await f.query('DELETE FROM establishment_publications WHERE id = $1',[7]);
        await f.query('DELETE FROM establishment_publications WHERE id = $1',[first.id]);
        const withoutAnchor = await queryPage(anchor);
        assert.ok(withoutAnchor.length > 0, 'cursor does not require the anchor row to exist');
        await f.query('INSERT INTO establishment_publications(id,establishment_id,created_at) VALUES ($1,$2,$3)',[first.id,first.establishment_id,first.created_at]);
      }
      const built = buildLocalFeedQuery({latitude:41.61,longitude:12.5,limit:10,offset:0,snapshotId:6,excludeIds:[1]},postgres);
      assert.deepEqual((await f.query(built.sql,built.values)).map(row=>row.establishment_id),[3,2]);
    } finally { await f.close(); }
  });
}

test('feed cursor validation rejects mismatched locations, malformed values and unbounded exclusion lists', () => {
  const location = {latitude:41.6,longitude:12.5};
  const good = encodeFeedCursor({id:4,created_at:4,distance_km:0},5,location);
  assert.equal(parseFeedCursor(good,location).id,4);
  assert.equal(parseFeedCursor(undefined,location),undefined);
  assert.throws(()=>parseFeedCursor(good,{latitude:41.61,longitude:12.5}));
  assert.throws(()=>parseFeedCursor(good,{}));
  for (const value of ['bad!', [], {}, 'a'.repeat(1025), Buffer.from('null').toString('base64url')]) assert.throws(()=>parseFeedCursor(value,location));
  const cursor = parseFeedCursor(good,location);
  for (const invalid of [{id:0},{id:6},{snapshotId:-1},{distance:-1},{distance:21000},{createdAt:1.5}]) {
    assert.throws(()=>parseFeedCursor(Buffer.from(JSON.stringify({...cursor,...invalid})).toString('base64url'),location));
  }
  assert.deepEqual(parseFeedExclusions('1,2,1'),[1,2]);
  for(const value of ['0','1,-2',[], '1 OR 1=1', Array.from({length:201},(_,i)=>i+1).join(',')]) assert.throws(()=>parseFeedExclusions(value));
  assert.throws(()=>buildPublicationPreviewsQuery([]));
});
