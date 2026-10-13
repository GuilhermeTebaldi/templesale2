import crypto from 'node:crypto';
import type { Pool, PoolClient } from 'pg';

type Kind = 'publications' | 'comments' | 'uploads';
export type CapacityPermit = { kind: Kind; slot: number; token: string; expiresAt: number };
export type CapacityLease = (() => void) & { permit?: CapacityPermit };
export function createPublicationCapacity(pool: Pool | null, limits: Record<Kind, number>) {
  let enabled = false;
  let readOnlyMode = false;
  const leaseMs = 300000;
  const bounded = Object.fromEntries(Object.entries(limits).map(([kind,value]) => [kind, Number.isSafeInteger(value) && value > 0 ? Math.min(64,value) : 4])) as Record<Kind, number>;
  const release = (permit: CapacityPermit) => {
    void pool?.query('UPDATE publication_capacity_slots SET lease_token=NULL,expires_at=0 WHERE kind=$1 AND slot=$2 AND lease_token=$3', [permit.kind,permit.slot,permit.token])
      .catch(error => console.error('Capacity lease release failed:', error.message));
  };
  return {
    async initialize(readOnly: boolean) {
      readOnlyMode = readOnly;
      if (!pool || readOnly) return;
      await pool.query(`CREATE TABLE IF NOT EXISTS publication_capacity_slots(
        kind TEXT NOT NULL,slot INTEGER NOT NULL,lease_token TEXT,expires_at BIGINT NOT NULL DEFAULT 0,PRIMARY KEY(kind,slot))`);
      for (const kind of Object.keys(bounded) as Kind[]) await pool.query(
        'INSERT INTO publication_capacity_slots(kind,slot) SELECT $1,generate_series(1,$2::integer) ON CONFLICT DO NOTHING', [kind,bounded[kind]]);
      enabled = true;
    },
    async acquire(kind: Kind, existingClient?: PoolClient): Promise<CapacityLease | null> {
      if (!pool || readOnlyMode) return () => {};
      if (!enabled) return null;
      const token = crypto.randomUUID();
      const client = existingClient ?? await pool.connect();
      let discard = false;
      let result: { rows: { slot: number; expires_at: string }[] };
      try {
      if (!existingClient) { await client.query('BEGIN'); await client.query("SET LOCAL statement_timeout='5s'; SET LOCAL lock_timeout='1s'"); }
      result = await client.query<{ slot: number; expires_at: string }>(`UPDATE publication_capacity_slots target SET lease_token=$3,expires_at=(EXTRACT(EPOCH FROM clock_timestamp())*1000)::bigint+$4
        FROM (SELECT slot FROM publication_capacity_slots WHERE kind=$1 AND slot<=$2 AND expires_at<=(EXTRACT(EPOCH FROM clock_timestamp())*1000)::bigint
          ORDER BY slot LIMIT 1 FOR UPDATE SKIP LOCKED) candidate WHERE target.kind=$1 AND target.slot=candidate.slot RETURNING target.slot,target.expires_at`, [kind,bounded[kind],token,leaseMs]);
      if (!existingClient) await client.query('COMMIT');
      } catch (error) { if (!existingClient) { try { await client.query('ROLLBACK'); } catch { discard = true; } } throw error; }
      finally { if (!existingClient) client.release(discard); }
      if (!result!.rows.length) return null;
      let released = false;
      const permit: CapacityPermit = { kind,slot: result!.rows[0].slot,token,expiresAt: Number(result!.rows[0].expires_at) };
      return Object.assign(() => {
        if (released) return; released = true;
        release(permit);
      }, { permit });
    },
    release,
    snapshot() { return { mode: enabled ? 'postgres-leases' : 'local', limits: bounded, leaseMs }; },
    async active() {
      if (!pool || !enabled) return [];
      return (await pool.query(`SELECT kind,COUNT(*) FILTER(WHERE expires_at>(EXTRACT(EPOCH FROM clock_timestamp())*1000)::bigint) AS active
        FROM publication_capacity_slots GROUP BY kind`)).rows;
    },
  };
}
