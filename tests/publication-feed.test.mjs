import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FeedRequestGate, protectedFeedPrefix, mergePublicationFeed } from '../src/lib/publication-feed.ts';

const post = (id, establishmentId = id) => ({id, establishmentId, caption: 'Photo ' + id});
test('movement preserves every card through the last seen card and replaces only the unseen tail', () => {
  const current = [post(1),post(2),post(3),post(4)];
  const incoming = [post(20,2),post(5),post(6),post(6),post(60,6)];
  const seen = new Set([2]);
  assert.deepEqual(protectedFeedPrefix(current,seen), current.slice(0,2));
  const result = mergePublicationFeed(current,incoming,seen,'nearby');
  assert.deepEqual(result.map(item=>item.id),[1,2,5,6]);
  assert.equal(result[0],current[0]);
  assert.equal(result[1],current[1], 'the card being read must retain its object and key');
  assert.deepEqual(current.map(item=>item.id),[1,2,3,4], 'inputs remain immutable');
  assert.deepEqual(mergePublicationFeed(current,[],seen,'nearby').map(item=>item.id),[1,2]);
});

test('scrolling during a request protects the newly visible card before committing', () => {
  const current = [post(1),post(2),post(3)];
  const seen = new Set([1]);
  seen.add(2); // The next card entered the viewport while the network was pending.
  const next = mergePublicationFeed(current,[post(8),post(9)],seen,'nearby');
  assert.deepEqual(next.map(item=>item.id),[1,2,8,9]);
  assert.equal(next[1],current[1]);
});

test('refresh takes the latest photo; pagination and movement never duplicate a company', () => {
  const current = [post(1),post(2)];
  const incoming = [post(10,1),post(20,2),post(3),post(30,3)];
  const seen = new Set([1,2]);
  assert.deepEqual(mergePublicationFeed(current,incoming,seen,'reset').map(item=>item.id),[10,20,3]);
  assert.deepEqual(mergePublicationFeed(current,incoming,seen,'append').map(item=>item.id),[1,2,3]);
  assert.deepEqual(mergePublicationFeed(current,[post(4)],seen,'nearby').map(item=>item.id),[1,2,4]);
  assert.deepEqual(mergePublicationFeed(current,[post(4)],new Set(),'nearby').map(item=>item.id),[4]);
});

test('a superseded response or failure cannot overwrite newer data or loading state', async () => {
  const gate = new FeedRequestGate();
  const state = {posts:[post(1)],error:''};
  let deliverFirst;
  const firstResponse = new Promise(resolve=>{deliverFirst=resolve;});
  const first = gate.begin();
  const pending = firstResponse.then(items=>{
    if (gate.accepts(first)) state.posts = items;
  }).finally(()=>gate.finish(first));
  const second = gate.begin();
  assert.equal(first.signal.aborted,true);
  state.posts = [post(2)];
  deliverFirst([post(9)]);
  await pending;
  assert.deepEqual(state.posts.map(item=>item.id),[2]);
  assert.equal(gate.busy,true);
  assert.equal(gate.accepts(second),true);
  if (gate.accepts(first)) state.error = 'stale network error';
  assert.equal(state.error,'');
  gate.finish(second);
  assert.equal(gate.busy,false);
});

test('closing an overlay or returning from a hidden page starts a fresh request', () => {
  const gate = new FeedRequestGate();
  const old = gate.begin();
  gate.cancel();
  assert.equal(old.signal.aborted,true);
  assert.equal(gate.accepts(old),false);
  assert.equal(gate.busy,false);
  const next = gate.begin();
  assert.equal(gate.accepts(next),true);
  gate.finish(old);
  assert.equal(gate.accepts(next),true);
});
