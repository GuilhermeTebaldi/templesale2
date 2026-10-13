import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pendingComment, withPendingComment } from '../src/lib/comment-delivery';

test('refresh cannot erase a draft; confirmation removes the temporary item', () => {
  const draft = pendingComment(5, 'Olá', null);
  const server = [{ ...draft, id: 21, body: 'Outro comentário', replies: [] }];
  const merged = withPendingComment(server, draft);
  assert.equal(merged[0].id, draft.id);
  assert.equal(merged[1].id, 21);
  assert.deepEqual(withPendingComment(server), server);
  assert.notEqual(pendingComment(5, 'Olá', null).id, draft.id);
});

test('pending reply preserves original thread and survives missing parent', () => {
  const parent = { ...pendingComment(5, 'Pai', null), id: 21, replies: [] };
  const draft = pendingComment(5, 'Resposta', null, 21);
  assert.equal(withPendingComment([parent], draft)[0].replies[0].id, draft.id);
  assert.equal(parent.replies.length, 0);
  assert.equal(withPendingComment([], draft)[0].id, draft.id);
  assert.equal(withPendingComment([], { ...draft, deliveryStatus: 'failed' })[0].body, 'Resposta');
});
