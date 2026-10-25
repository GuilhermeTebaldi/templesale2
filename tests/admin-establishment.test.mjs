import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { DatabaseSync } from 'node:sqlite';
import { registerAdminEstablishmentRoutes } from '../server/admin-establishment.ts';

async function fixture(t) {
  const db = new DatabaseSync(':memory:'); t.after(() => db.close());
  db.exec(`CREATE TABLE users(id INTEGER PRIMARY KEY,email TEXT,auth0_sub TEXT,password_hash TEXT,is_banned INTEGER);
    CREATE TABLE establishments(id INTEGER PRIMARY KEY,owner_user_id INTEGER,name TEXT,slug TEXT,logo_url TEXT,
      category TEXT,description TEXT,city TEXT,address TEXT,latitude REAL,longitude REAL,keywords TEXT,is_active INTEGER);
    CREATE TABLE publications(id INTEGER PRIMARY KEY,owner_user_id INTEGER,image_url TEXT,caption TEXT);
    INSERT INTO users VALUES(1,'owner@example.test',NULL,'unchanged',0),(2,'other@example.test','other-sub','other-hash',0);
    INSERT INTO establishments VALUES(7,1,'Original name','original-slug','original-photo','Altro','','Roma','Original address',NULL,NULL,'[]',1),
      (8,2,'Other','other','other-photo','Bar','','Roma','Other address',41,12,'[]',1);
    INSERT INTO publications VALUES(10,1,'photo-one','caption-one'),(11,2,'photo-two','caption-two');`);
  const getCompany = async id => { const row = db.prepare('SELECT * FROM establishments WHERE owner_user_id=?').get(id); return row ? { ...row, ownerId:row.owner_user_id } : null; };
  let writes=0, fail=false, wrongOwner=false;
  const app=express();app.use(express.json());
  registerAdminEstablishmentRoutes(app,{
    requireAdmin:(req,res)=>{if(req.headers.authorization==='Bearer test-admin')return {email:'admin@example.test'};res.status(401).json({error:'Unauthorized'});return null},
    getUser:async id=>db.prepare('SELECT * FROM users WHERE id=?').get(id),
    getCompany:async id=>{const row=await getCompany(id);return wrongOwner&&row?{...row,ownerId:2}:row},
    updateCompany:async(id,owner,p)=>{if(fail)throw Error('database unavailable');writes++;
      return db.prepare('UPDATE establishments SET category=?,description=?,city=?,address=?,latitude=?,longitude=?,keywords=? WHERE id=? AND owner_user_id=?')
        .run(p.category,p.description,p.city,p.address,p.latitude,p.longitude,JSON.stringify(p.keywords),id,owner).changes===1},
    normalizeText:(value,field,limit)=>{if(typeof value!=='string'||value.trim().length>limit)throw Error('Invalid '+field);return value.trim()},
    normalizeKeywords:value=>[...new Set(value.map(word=>String(word).trim()).filter(Boolean))],
  });
  const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));t.after(()=>new Promise(r=>server.close(r)));
  const payload={expectedEmail:'owner@example.test',expectedEstablishmentId:7,category:'Bazar e casalinghi',description:'Articoli per la casa.',city:'Ardea',address:'Via Laurentina, km 35,500',latitude:41.590685,longitude:12.523005,keywords:['casalinghi','tappeti']};
  const request=(patch={},auth=true,id=1)=>fetch(`http://127.0.0.1:${server.address().port}/api/admin/users/${id}/establishment`,{
    method:'PATCH',headers:{'Content-Type':'application/json',...(auth?{Authorization:'Bearer test-admin'}:{})},body:JSON.stringify({...payload,...patch})});
  return {db,request,payload,writes:()=>writes,setFail:v=>fail=v,setWrongOwner:v=>wrongOwner=v};
}
test('administrative repair rejects missing authentication, invalid IDs and missing accounts',async t=>{
 const f=await fixture(t);assert.equal((await f.request({},false)).status,401);
 assert.equal((await f.request({},true,'invalid')).status,400);assert.equal((await f.request({},true,99)).status,404);assert.equal(f.writes(),0);
});
test('email, company ID, ownership and banned-account guards prevent repairing a different account',async t=>{
 const f=await fixture(t);
 for(const patch of [{expectedEmail:'other@example.test'},{expectedEmail:''},{expectedEstablishmentId:8}])assert.equal((await f.request(patch)).status,409);
 f.setWrongOwner(true);assert.equal((await f.request()).status,409);f.setWrongOwner(false);
 f.db.prepare('UPDATE users SET is_banned=1 WHERE id=1').run();assert.equal((await f.request()).status,409);assert.equal(f.writes(),0);
});
test('coordinates and required metadata are validated before any write',async t=>{
 const f=await fixture(t);
 for(const patch of [{latitude:null},{latitude:91},{longitude:181},{latitude:'41.6'},{keywords:'text'},{category:''},{city:''},{address:''},{description:'x'.repeat(5001)}])assert.equal((await f.request(patch)).status,400);
 assert.equal(f.writes(),0);
});
test('repair preserves user identity, passwords, names, photos, publication rows and other accounts',async t=>{
 const f=await fixture(t);const users=f.db.prepare('SELECT * FROM users').all(),photos=f.db.prepare('SELECT * FROM publications').all();
 const other=f.db.prepare('SELECT * FROM establishments WHERE id=8').get();
 const response=await f.request({ownerId:2,auth0_sub:'forged',password:'ignored',name:'Ignored name',is_active:0});assert.equal(response.status,200);
 assert.match(response.headers.get('cache-control'),/no-store/);
 const row=(await response.json()).establishment;
 assert.equal(row.category,f.payload.category);assert.equal(row.latitude,f.payload.latitude);assert.equal(row.longitude,f.payload.longitude);
 assert.deepEqual(JSON.parse(row.keywords),f.payload.keywords);assert.equal(row.name,'Original name');assert.equal(row.slug,'original-slug');assert.equal(row.logo_url,'original-photo');assert.equal(row.is_active,1);
 assert.deepEqual(f.db.prepare('SELECT * FROM users').all(),users);assert.deepEqual(f.db.prepare('SELECT * FROM publications').all(),photos);
 assert.deepEqual(f.db.prepare('SELECT * FROM establishments WHERE id=8').get(),other);
 assert.equal((await f.request()).status,200);assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM publications').get().n,2,'Repeating repair cannot duplicate publications');
});
test('database failures leave stored data intact and do not reveal the database error',async t=>{
 const f=await fixture(t);const before=f.db.prepare('SELECT * FROM establishments').all();f.setFail(true);
 const response=await f.request();assert.equal(response.status,500);assert.doesNotMatch(await response.text(),/database unavailable/);
 assert.deepEqual(f.db.prepare('SELECT * FROM establishments').all(),before);
});
