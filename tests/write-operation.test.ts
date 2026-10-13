import { test } from 'node:test';
import assert from 'node:assert/strict';
import { beginWriteOperation, completeWriteOperation } from '../src/lib/write-operation';

const values = new Map<string,string>();
const storage = new Proxy({
  getItem: (key:string) => values.get(key) ?? null,
  setItem: (key:string,value:string) => {values.set(key,value);},
  removeItem: (key:string) => {values.delete(key);},
}, {
  ownKeys: () => [...values.keys()],
  getOwnPropertyDescriptor: (_,key) => typeof key==='string' && values.has(key)
    ? {configurable:true,enumerable:true,value:values.get(key)} : undefined,
});
Object.defineProperty(globalThis,'localStorage',{value:storage,configurable:true});

test('lost response A keeps its identity after B succeeds and a fresh module recovers it', async () => {
  const scope='regression-device:comment:101';
  const first=await beginWriteOperation(scope,['A',null]);
  const second=await beginWriteOperation(scope,['B',null]);
  assert.notEqual(first,second);
  completeWriteOperation(scope,second);
  assert.equal(await beginWriteOperation(scope,['A',null]),first);
  const recovered=await import(new URL('../src/lib/write-operation.ts?recovered=1',import.meta.url).href);
  assert.equal(await recovered.beginWriteOperation(scope,['A',null]),first);
  // Persistence retains A, and completing A allows an intentional identical comment later.
  assert.equal(values.size,1);
  completeWriteOperation(scope,first);
  const intentional=await beginWriteOperation(scope,['A',null]);
  assert.notEqual(intentional,first);
  completeWriteOperation(scope,intentional);
});

test('legacy pending identity survives an unrelated send during rollout', async () => {
  const scope='legacy-device:comment:102';
  const payload=['legacy',null];
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(payload)));
  const fingerprint=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
  const key=crypto.randomUUID();
  storage.setItem('templesale:write-operation:'+scope,JSON.stringify({fingerprint,key,at:Date.now()}));
  const other=await beginWriteOperation(scope,['other',null]);
  completeWriteOperation(scope,other);
  assert.equal(await beginWriteOperation(scope,payload),key);
  completeWriteOperation(scope,key);
});

test('a full pending journal refuses new work without evicting a recoverable identity', async () => {
  const scope='capacity-device:comment:103';
  const keys:string[]=[];
  for(let i=0;i<32;i++)keys.push(await beginWriteOperation(scope,[String(i),null]));
  await assert.rejects(beginWriteOperation(scope,['overflow',null]),/32 invii/);
  assert.equal(await beginWriteOperation(scope,['0',null]),keys[0]);
  for(const key of keys)completeWriteOperation(scope,key);
});
