import crypto from 'node:crypto';
import type { Pool } from 'pg';
import type { createPublicationCapacity, CapacityPermit } from './publication-capacity';

export class DirectUploadBusy extends Error {}
type Config = { cloud: string; key: string; secret: string; webhookSecret: string; folder: string; callbackBase: string; maxBytes: number };
const AGE = 7 * 86400000;
export function createPublicationDirectUpload(pool: Pool | null, config: Config, capacity: ReturnType<typeof createPublicationCapacity>, onFinished: (ms: number, success: boolean) => void) {
  let enabled = false, reason = 'Limites da conta ainda não verificados.', checkedAt = 0, accountMaxBytes: number | null = null;
  let refreshing: Promise<void> | undefined, timer: ReturnType<typeof setInterval> | undefined, cleaning = false;
  let adminPauseUntil=0,confirmationFallbacks=0,lastFallbackAt=0;
  const sign = (params: Record<string,string|number>) => crypto.createHash('sha1').update(Object.keys(params).sort().map(key => `${key}=${params[key]}`).join('&') + config.secret).digest('hex');
  const keyValid = (value: unknown): value is string => typeof value === 'string' && /^[\w-]{16,80}$/.test(value);
  const releaseRow = (row: any) => {
    if (row.lease_token) capacity.release({ kind:'uploads',slot:Number(row.lease_slot),token:row.lease_token,expiresAt:Number(row.lease_expires_at) } as CapacityPermit);
  };
  const acceptMetadata=async(id:string,data:any) => {
    if (!pool) return;
    const original=(await pool.query("SELECT public_id FROM publication_upload_receipts WHERE id=$1 AND state IN ('pending','expired')",[id])).rows[0];
    if(!original||data.public_id!==original.public_id)return;
    const bytes=Number(data.bytes),version=Number(data.version);
    const valid=data.resource_type==='image'&&data.format==='jpg'&&Number.isSafeInteger(bytes)&&bytes>0&&bytes<=config.maxBytes&&Number.isSafeInteger(version)&&version>0;
    const url=valid?`https://res.cloudinary.com/${config.cloud}/image/upload/f_auto,q_auto,c_limit,w_1600/v${version}/${original.public_id}.jpg`:null;
    const changed=await pool.query("UPDATE publication_upload_receipts SET state=$2,url=$3,bytes=$4 WHERE id=$1 AND state IN ('pending','expired') RETURNING *",[id,valid?'ready':'rejected',url,Number.isSafeInteger(bytes)?bytes:null]);
    if(changed.rows.length){releaseRow(changed.rows[0]);onFinished(Date.now()-Number(changed.rows[0].created_at),valid);}
  };
  const refresh = async () => {
    if (refreshing) return refreshing;
    refreshing = (async () => {
      checkedAt = Date.now();
      try {
        if (!pool || !config.cloud || !config.key || !config.secret || !config.callbackBase.startsWith('https://')) throw new Error();
        const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloud)}/usage`, {
          headers: { Authorization: 'Basic ' + Buffer.from(`${config.key}:${config.secret}`).toString('base64') }, signal: AbortSignal.timeout(8000),
        });
        if (!response.ok) throw new Error();
        const data = await response.json() as any;
        const limit = Number(data.media_limits?.image_max_size_bytes);
        if (!Number.isSafeInteger(limit) || limit <= 0) throw new Error();
        accountMaxBytes = limit;
        enabled = limit <= config.maxBytes;
        reason = enabled ? 'Limite da conta verificado; confirmação assinada exigida.' : 'Limite da conta acima do limite do site. Envio pelo servidor mantido.';
      } catch { enabled = false; reason = 'Não foi possível verificar os limites da conta. Envio pelo servidor mantido.'; }
    })().finally(() => { refreshing = undefined; });
    return refreshing;
  };
  return {
    async initialize(readOnly: boolean) {
      if (!pool || readOnly) { reason = 'Envio direto indisponível neste ambiente.'; return; }
      await pool.query(`CREATE TABLE IF NOT EXISTS publication_upload_receipts(
        id TEXT PRIMARY KEY,user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,establishment_id BIGINT NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
        public_id TEXT NOT NULL UNIQUE,payload_hash TEXT NOT NULL,state TEXT NOT NULL DEFAULT 'pending',url TEXT,bytes BIGINT,
        lease_slot INTEGER,lease_token TEXT,lease_expires_at BIGINT NOT NULL,created_at BIGINT NOT NULL,admin_checked_at BIGINT NOT NULL DEFAULT 0)`);
      await pool.query("CREATE UNIQUE INDEX IF NOT EXISTS idx_upload_receipt_pending_owner ON publication_upload_receipts(user_id) WHERE state='pending'");
      await pool.query('CREATE INDEX IF NOT EXISTS idx_upload_receipt_retention ON publication_upload_receipts(created_at)');
      await refresh();
      timer = setInterval(() => {
        if (Date.now()-checkedAt > 15*60000) void refresh();
        if (cleaning) return; cleaning = true;
        void pool.query("UPDATE publication_upload_receipts SET state='expired' WHERE state='pending' AND lease_expires_at<(EXTRACT(EPOCH FROM clock_timestamp())*1000)::bigint")
          .then(() => pool.query('DELETE FROM publication_upload_receipts WHERE id IN (SELECT id FROM publication_upload_receipts WHERE created_at<$1 ORDER BY created_at LIMIT 500)',[Date.now()-AGE]))
          .catch(() => console.error('Direct upload receipt cleanup unavailable.')).finally(() => { cleaning = false; });
      },60000); timer.unref();
    },
    snapshot() { return { enabled,reason,accountMaxBytes,checkedAt,maxBytes:config.maxBytes,confirmationFallbacks,lastFallbackAt }; },
    async refresh() { if (Date.now()-checkedAt >= 60000) await refresh(); return this.snapshot(); },
    async prepare(userId: number, establishmentId: number, input: { id: unknown; bytes: unknown; sha256: unknown; mime: unknown }) {
      if (!keyValid(input.id)) throw new Error('Identificação de foto inválida.');
      const bytes = Number(input.bytes);
      if (!Number.isSafeInteger(bytes) || bytes <= 0 || bytes > config.maxBytes || input.mime !== 'image/jpeg' || typeof input.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(input.sha256)) throw new Error('Foto inválida ou maior que o limite permitido.');
      const fingerprint = crypto.createHash('sha256').update(JSON.stringify([establishmentId,bytes,input.sha256,input.mime])).digest('hex');
      const existing = pool ? (await pool.query('SELECT state,url,payload_hash FROM publication_upload_receipts WHERE id=$1 AND user_id=$2 AND establishment_id=$3',[input.id,userId,establishmentId])).rows[0] : undefined;
      if (existing && existing.payload_hash!==fingerprint) throw new Error('Esta identificação de foto já foi usada para outro envio.');
      if (existing?.state === 'ready') return { direct:true,ready:true,url:existing.url,id:input.id };
      if (!enabled || !pool) return { direct:false };
      if (bytes>accountMaxBytes!) throw new Error('Foto maior que o limite da conta de imagens.');
      const client = await pool.connect(); let discard = false; let row: any;
      try {
        await client.query('BEGIN'); await client.query("SET LOCAL statement_timeout='8s'; SET LOCAL lock_timeout='1s'");
        await client.query("SELECT pg_advisory_xact_lock(hashtextextended('templesale-photo:'||$1::text,0))",[userId]);
        await client.query("UPDATE publication_upload_receipts SET state='expired' WHERE user_id=$1 AND state='pending' AND lease_expires_at<(EXTRACT(EPOCH FROM clock_timestamp())*1000)::bigint",[userId]);
        row = (await client.query('SELECT * FROM publication_upload_receipts WHERE id=$1 FOR UPDATE',[input.id])).rows[0];
        if (row && (Number(row.user_id)!==userId || row.payload_hash!==fingerprint)) throw new Error('Esta identificação de foto já foi usada para outro envio.');
        if (row?.state === 'rejected') throw new Error('Esta foto foi recusada na validação. Escolha outra foto.');
        if (!row || row.state==='expired') {
          if ((await client.query("SELECT 1 FROM publication_upload_receipts WHERE user_id=$1 AND state='pending' LIMIT 1",[userId])).rows.length) throw new DirectUploadBusy('Aguarde a confirmação da foto anterior.');
          const lease = await capacity.acquire('uploads',client);
          if (!lease?.permit) throw new DirectUploadBusy('Envios de fotos ocupados. Aguarde alguns segundos.');
          const permit = lease.permit;
          const publicId = row?.public_id ?? `${config.folder.replace(/\/+$/,'')}/publication_user_${userId}_${input.id}`;
          row = (await client.query(`INSERT INTO publication_upload_receipts(id,user_id,establishment_id,public_id,payload_hash,lease_slot,lease_token,lease_expires_at,created_at)
            VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(id) DO UPDATE SET state='pending',lease_slot=EXCLUDED.lease_slot,lease_token=EXCLUDED.lease_token,lease_expires_at=EXCLUDED.lease_expires_at RETURNING *`,
            [input.id,userId,establishmentId,publicId,fingerprint,permit.slot,permit.token,permit.expiresAt,Date.now()])).rows[0];
        }
        await client.query('COMMIT');
      } catch (error) { try { await client.query('ROLLBACK'); } catch { discard=true; } throw error; }
      finally { client.release(discard); }
      if (row.state==='ready') return { direct:true,ready:true,url:row.url,id:input.id };
      const params = { public_id:row.public_id,timestamp:Math.floor(Date.now()/1000),overwrite:'false',format:'jpg',allowed_formats:'jpg',notification_url:`${config.callbackBase.replace(/\/+$/,'')}/api/uploads/publication-image/notify/${input.id}` };
      return { direct:true,ready:false,id:input.id,endpoint:`https://api.cloudinary.com/v1_1/${config.cloud}/image/upload`,params:{...params,api_key:config.key,signature:sign(params)} };
    },
    async status(userId: number, establishmentId: number, id: string) {
      if (!pool || !keyValid(id)) throw new Error('Identificação de foto inválida.');
      let row = (await pool.query('SELECT * FROM publication_upload_receipts WHERE id=$1 AND user_id=$2 AND establishment_id=$3',[id,userId,establishmentId])).rows[0];
      if (!row) throw new Error('Foto não encontrada.');
      if(['pending','expired'].includes(row.state)&&Date.now()-Number(row.created_at)>20000&&Date.now()>adminPauseUntil) {
        const claim=await pool.query("UPDATE publication_upload_receipts SET admin_checked_at=$2 WHERE id=$1 AND state IN ('pending','expired') AND admin_checked_at<$3 RETURNING public_id",[id,Date.now(),Date.now()-60000]);
        if(claim.rows.length) {
          try {
            const response=await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloud)}/resources/image/upload/${encodeURIComponent(claim.rows[0].public_id)}`,{
              headers:{Authorization:'Basic '+Buffer.from(`${config.key}:${config.secret}`).toString('base64')},signal:AbortSignal.timeout(8000),
            });
            const remaining=response.headers.get('x-featureratelimit-remaining');
            if(response.status===429||(remaining!==null&&Number(remaining)<=10)) {
              const reset=response.headers.get('x-featureratelimit-reset')??'';
              const parsed=Number.isFinite(Number(reset))&&Number(reset)>0?Number(reset)*1000:Date.parse(reset);
              adminPauseUntil=Number.isFinite(parsed)&&parsed>Date.now()?parsed:Date.now()+60000;
            }
            if(response.ok) {await acceptMetadata(id,await response.json());confirmationFallbacks+=1;lastFallbackAt=Date.now();}
          } catch { /* Preserve the pending receipt for a later confirmation. */ }
          row=(await pool.query('SELECT state,url FROM publication_upload_receipts WHERE id=$1',[id])).rows[0]??row;
        }
      }
      return {state:row.state,url:row.url};
    },
    async validate(userId: number, establishmentId: number, id: unknown, url: string) {
      if (id === undefined) return;
      const row = await this.status(userId,establishmentId,String(id));
      if (row.state!=='ready' || row.url!==url) throw new Error('A foto ainda não possui confirmação válida.');
    },
    async notify(id: string, payload: Buffer, timestamp: string, signature: string) {
      if (!pool || !keyValid(id) || !/^\d{10}$/.test(timestamp) || Math.abs(Date.now()/1000-Number(timestamp))>7200 || !/^[a-f0-9]{40,64}$/.test(signature)) return false;
      const expected = crypto.createHash(signature.length===64?'sha256':'sha1').update(payload).update(timestamp).update(config.webhookSecret).digest('hex');
      if (expected.length!==signature.length || !crypto.timingSafeEqual(Buffer.from(expected),Buffer.from(signature))) return false;
      const data = JSON.parse(payload.toString('utf8'));
      if(data.notification_type==='upload')await acceptMetadata(id,data);
      return true;
    },
  };
}
