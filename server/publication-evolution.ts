import crypto from 'node:crypto';
import type { Pool } from 'pg';
import type Database from 'better-sqlite3';
import { sqliteBindings } from './discovery';

type Row = Record<string, any>;
type Statement = { sql: string; values?: unknown[] };
type Recipe<T> = Generator<Statement, T, Row[]>;
export class WriteConflict extends Error { constructor() { super('Esta identificação de envio já foi usada com outro conteúdo.'); } }
export function requestKey(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || !/^[\w-]{16,80}$/.test(value)) throw new Error('Identificação de envio inválida.');
  return value;
}
const hash = (value: unknown) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const RETENTION_MS = 7 * 86400000;

export function createPublicationEvolution(pool: Pool | null, sqlite: Database.Database | null) {
  let enabled = false;
  let cleaning = false;
  let timer: ReturnType<typeof setInterval> | undefined;
  const syncQuery = (sql: string, values: unknown[] = []): Row[] => {
    if (!sqlite) throw new Error('Banco indisponível.');
    const bound = sqliteBindings(sql, values);
    const stmt = sqlite.prepare(bound.sql);
    if (stmt.reader) return stmt.all(...bound.values) as Row[];
    stmt.run(...bound.values); return [];
  };
  const query = async (sql: string, values: unknown[] = []): Promise<Row[]> => pool ? (await pool.query(sql, values)).rows : syncQuery(sql, values);
  // The same SQL recipe runs asynchronously on PG and synchronously inside SQLite's transaction.
  const atomic = async <T>(recipe: Recipe<T>): Promise<T> => {
    if (!enabled) throw new Error("Gravação indisponível em modo somente leitura.");
    if (!pool) return sqlite!.transaction(() => {
      let step = recipe.next();
      while (!step.done) { const q = step.value as Statement; step = recipe.next(syncQuery(q.sql, q.values)); }
      return step.value;
    })();
    const client = await pool.connect();
    try {
      await client.query('BEGIN'); let step = recipe.next();
      while (!step.done) { const q = step.value as Statement; step = recipe.next((await client.query(q.sql, q.values)).rows); }
      await client.query('COMMIT'); return step.value;
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  };

  function* creation(kind: 'comment' | 'publication', userId: number, key: string | null, payload: unknown, insert: Statement, table: string, ownerColumn: string): Recipe<Row> {
    const fingerprint = hash(payload);
    if (key) {
      const claimed = yield { sql: `INSERT INTO publication_write_operations(user_id,operation_key,kind,payload_hash,created_at)
        VALUES($1,$2,$3,$4,$5) ON CONFLICT(user_id,operation_key,kind) DO NOTHING RETURNING operation_key`, values: [userId,key,kind,fingerprint,Date.now()] };
      if (!claimed.length) {
        const [op] = yield { sql: 'SELECT payload_hash,resource_id FROM publication_write_operations WHERE user_id=$1 AND operation_key=$2 AND kind=$3', values: [userId,key,kind] };
        if (!op || op.payload_hash !== fingerprint) throw new WriteConflict();
        const [existing] = yield { sql: `SELECT * FROM ${table} WHERE id=$1 AND ${ownerColumn}=$2`, values: [op.resource_id,userId] };
        if (!existing) throw new Error('O conteúdo deste envio já foi excluído; não será recriado.');
        return existing;
      }
    }
    const [row] = yield insert;
    if (key) yield { sql: 'UPDATE publication_write_operations SET resource_id=$1 WHERE user_id=$2 AND operation_key=$3 AND kind=$4', values: [row.id,userId,key,kind] };
    return row;
  }

  return {
    get enabled() { return enabled; },
    async initialize(readOnly = false) {
      if (readOnly) return;
      await query(`CREATE TABLE IF NOT EXISTS publication_write_operations(user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        operation_key TEXT NOT NULL,kind TEXT NOT NULL,payload_hash TEXT NOT NULL,resource_id BIGINT,created_at BIGINT NOT NULL,
        PRIMARY KEY(user_id,operation_key,kind))`);
      await query('CREATE INDEX IF NOT EXISTS idx_publication_operations_retention ON publication_write_operations(created_at)');
      await query(`CREATE INDEX ${pool ? "CONCURRENTLY " : ""}IF NOT EXISTS idx_publication_comment_pages ON product_comments(publication_id,parent_comment_id,created_at DESC,id DESC)`);
      enabled = true;
    },
    start() {
      if (!enabled || timer) return;
      timer = setInterval(() => {
        if (cleaning) return;
        cleaning = true;
        void query(`DELETE FROM publication_write_operations WHERE (user_id,operation_key,kind) IN
          (SELECT user_id,operation_key,kind FROM publication_write_operations WHERE created_at<$1 ORDER BY created_at LIMIT 1000)`, [Date.now()-RETENTION_MS])
          .catch(error => console.error('Write operation cleanup failed:', error)).finally(() => { cleaning = false; });
      }, 60000);
      timer.unref();
    },
    stop() { if (timer) clearInterval(timer); timer = undefined; },
    snapshot() { return { enabled, retentionDays: 7, commentTimestampSource: 'database-default' }; },
    async createComment(input: { productId?: number | null; publicationId?: number | null; userId: number; parentCommentId: number | null; rating: number | null; body: string; clientRequestId?: unknown }) {
      const key = requestKey(input.clientRequestId);
      const row = await atomic(creation('comment',input.userId,key,[input.productId??null,input.publicationId??null,input.parentCommentId,input.rating,input.body],
        { sql: 'INSERT INTO product_comments(product_id,publication_id,user_id,parent_comment_id,rating,body,body_translations) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *',
          values: [input.productId??null,input.publicationId??null,input.userId,input.parentCommentId,input.rating,input.body,'{}'] }, 'product_comments','user_id'));
      return Number(row.id);
    },
    async createPublication(establishmentId: number, ownerId: number, caption: string, media: string[], clientRequestId?: unknown) {
      return atomic(creation('publication',ownerId,requestKey(clientRequestId),[establishmentId,caption,media],
        { sql: 'INSERT INTO establishment_publications(establishment_id,owner_user_id,caption,media,image_url) VALUES($1,$2,$3,$4,$5) RETURNING *', values: [establishmentId,ownerId,caption,JSON.stringify(media),media[0]] }, 'establishment_publications','owner_user_id'));
    },
    async updateComment(id: number, userId: number, body: string) {
      if (!enabled) throw new Error("Gravação indisponível em modo somente leitura.");
      return (await query("UPDATE product_comments SET body=$1,body_translations='{}' WHERE id=$2 AND user_id=$3 RETURNING id", [body,id,userId])).length > 0;
    },
  };
}
