import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';
import { createWriteAdmission } from '../server/write-admission';

function response() {
  const state = { status: 200, headers: {} as Record<string, string>, body: undefined as unknown };
  const res = { setHeader: (key: string, value: string) => { state.headers[key] = value; },
    status: (status: number) => { state.status = status; return res; }, json: (body: unknown) => { state.body = body; } };
  return { state, res: res as unknown as Response };
}

test('write budget rejects excess work without queuing and frees completed slots', async () => {
  let release!: () => void;
  const waiting = new Promise<void>(resolve => { release = resolve; });
  let calls = 0;
  const handler = createWriteAdmission(1)(async () => { calls++; await waiting; });
  const first = handler({} as Request, response().res, () => {});
  const blocked = response();
  await handler({} as Request, blocked.res, () => {});
  assert.equal(calls, 1);
  assert.equal(blocked.state.status, 503);
  assert.equal(blocked.state.headers['Retry-After'], '2');
  release(); await first;
  await handler({} as Request, response().res, () => {});
  assert.equal(calls, 2);
});

test('failed handlers release their slot and invalid limits use a finite default', async () => {
  const handler = createWriteAdmission(1)(async () => { throw new Error('failure'); });
  let errors = 0;
  await handler({} as Request, response().res, () => { errors++; });
  const again = response();
  await handler({} as Request, again.res, () => { errors++; });
  assert.equal(errors, 2);
  assert.equal(again.state.status, 200);
  assert.equal(typeof createWriteAdmission(NaN), 'function');
});
