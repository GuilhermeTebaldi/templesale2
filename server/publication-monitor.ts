import crypto from 'node:crypto';
import type { Pool } from 'pg';

type Policy = { memoryBudgetMb: number; slowMs: number; errorPercent: number; busyPercent: number };
const DEFAULTS: Policy = { memoryBudgetMb:512,slowMs:3000,errorPercent:5,busyPercent:10 };
type Alert = { code:string; message:string; since:number };
export function createPublicationMonitor(pool: Pool|null, readMetrics: () => any, directStatus: () => any) {
  const instanceId = crypto.randomUUID();
  let policy = {...DEFAULTS}, ready=false,running=false,timer:ReturnType<typeof setInterval>|undefined;
  let previous:any, previousAt=Date.now(),lastSampleAt=0,lastError:string|null=null;
  const samples:any[]=[];
  let alerts:Alert[]=[];
  const readPolicy = async () => {
    if (!pool || !ready) return;
    const row=(await pool.query("SELECT payload FROM publication_monitor_state WHERE key='policy'")).rows[0];
    if (row) policy=validate(JSON.parse(row.payload));
  };
  const validate=(input:any):Policy => {
    const limits={memoryBudgetMb:[64,16384],slowMs:[100,60000],errorPercent:[1,50],busyPercent:[1,90]};
    for (const [key,[min,max]] of Object.entries(limits)) if (!Number.isFinite(input?.[key]) || input[key]<min || input[key]>max) throw new Error('Parâmetro de monitoramento inválido.');
    return {memoryBudgetMb:input.memoryBudgetMb,slowMs:input.slowMs,errorPercent:input.errorPercent,busyPercent:input.busyPercent};
  };
  const sample = async () => {
    if (running) return; running=true;
    try {
      const now=Date.now(),current=readMetrics();
      const delta={completed:0,failed:0,rejected:0,durations:[] as {upToMs:number|null;count:number}[]};
      for (const [kind,raw] of Object.entries(current.writes) as [string,any][]) {
        const before=previous?.writes[kind]??raw;
        delta.completed+=Math.max(0,raw.completed-before.completed);
        delta.failed+=Math.max(0,raw.failed-before.failed);
        delta.rejected+=Math.max(0,raw.rejected-before.rejected);
        raw.durations.forEach((bucket:any,index:number) => {
          delta.durations[index]??={upToMs:bucket.upToMs,count:0};
          delta.durations[index].count+=Math.max(0,bucket.count-(before.durations[index]?.count??0));
        });
      }
      const seen=delta.completed+delta.rejected;
      const observed={...delta,operationsPerMinute:delta.completed*60000/Math.max(1,now-previousAt),
        errorPercent:delta.completed?delta.failed*100/delta.completed:0,busyPercent:seen?delta.rejected*100/seen:0};
      previous=current; previousAt=now;
      const messages:{code:string;message:string}[]=[];
      if (current.memory.rss>policy.memoryBudgetMb*1024*1024*0.8) messages.push({code:'memory',message:'Memória acima de 80% do orçamento informado.'});
      if ((current.databasePool?.waiting??0)>=4) messages.push({code:'pool',message:'Há espera elevada por conexões do banco.'});
      if (current.eventLoopP99Ms>200) messages.push({code:'event-loop',message:'O servidor apresenta atraso elevado para processar eventos.'});
      if (seen>=10 && observed.busyPercent>=policy.busyPercent) messages.push({code:'busy',message:'Muitas operações foram recusadas por sobrecarga nesta amostra.'});
      if (delta.completed>=10 && observed.errorPercent>=policy.errorPercent) messages.push({code:'errors',message:'A proporção de falhas excedeu o parâmetro definido.'});
      let accumulated=0;const total=delta.durations.reduce((sum,bucket)=>sum+bucket.count,0);
      const p95=total?delta.durations.find(bucket => { accumulated+=bucket.count;return accumulated>=total*0.95; })?.upToMs:undefined;
      if (total>=10 && (p95===null || (p95??0)>policy.slowMs)) messages.push({code:'latency',message:'A faixa estimada de demora dos envios excedeu o parâmetro definido.'});
      const direct=directStatus();
      if (!direct.enabled) messages.push({code:'direct-upload',message:direct.reason});
      if(direct.lastFallbackAt&&now-direct.lastFallbackAt<15*60000)messages.push({code:'photo-confirmation',message:'Uma foto precisou de confirmação alternativa. Verifique a entrega das notificações Cloudinary e a chave de verificação.'});
      const old=alerts;
      alerts=messages.map(item=>({...item,since:old.find(alert=>alert.code===item.code)?.since??now}));
      alerts.filter(item=>!old.some(alert=>alert.code===item.code)).forEach(item=>console.warn('Publication capacity alert:',item.code,item.message));
      const point={sampledAt:now,instanceId,observed,p95UpperMs:p95??null,hasDurations:total>0,rssMb:current.memory.rss/1024/1024,waiting:current.databasePool?.waiting??0};
      samples.push(point);while(samples.length>60)samples.shift();lastSampleAt=now;
      if (pool && ready && (current.databasePool?.waiting??0)===0) {
        await readPolicy();
        await pool.query(`INSERT INTO publication_monitor_samples(instance_id,slot,sampled_at,payload) VALUES($1,$2,$3,$4)
          ON CONFLICT(instance_id,slot) DO UPDATE SET sampled_at=EXCLUDED.sampled_at,payload=EXCLUDED.payload`,[instanceId,Math.floor(now/60000)%1440,now,JSON.stringify(point)]);
        await pool.query(`INSERT INTO publication_monitor_state(key,payload,updated_at) VALUES($1,$2,$3)
          ON CONFLICT(key) DO UPDATE SET payload=EXCLUDED.payload,updated_at=EXCLUDED.updated_at`,['instance:'+instanceId,JSON.stringify({alerts,lastSampleAt}),now]);
        await pool.query('DELETE FROM publication_monitor_samples WHERE (instance_id,slot) IN (SELECT instance_id,slot FROM publication_monitor_samples WHERE sampled_at<$1 ORDER BY sampled_at LIMIT 500)',[now-86400000]);
        await pool.query("DELETE FROM publication_monitor_state WHERE key<>'policy' AND key IN (SELECT key FROM publication_monitor_state WHERE key<>'policy' AND updated_at<$1 ORDER BY updated_at LIMIT 100)",[now-86400000]);
      }
      lastError=null;
    } catch { lastError='Uma amostra não pôde ser registrada; acompanhe a próxima atualização.'; }
    finally {running=false;}
  };
  return {
    async initialize(readOnly:boolean) {
      if (pool && !readOnly) {
        await pool.query('CREATE TABLE IF NOT EXISTS publication_monitor_state(key TEXT PRIMARY KEY,payload TEXT NOT NULL,updated_at BIGINT NOT NULL)');
        await pool.query('CREATE TABLE IF NOT EXISTS publication_monitor_samples(instance_id TEXT NOT NULL,slot INTEGER NOT NULL,sampled_at BIGINT NOT NULL,payload TEXT NOT NULL,PRIMARY KEY(instance_id,slot))');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_publication_monitor_retention ON publication_monitor_samples(sampled_at)');
        await pool.query("INSERT INTO publication_monitor_state(key,payload,updated_at) VALUES('policy',$1,$2) ON CONFLICT DO NOTHING",[JSON.stringify(policy),Date.now()]);
        ready=true;await readPolicy();
      }
      previous=readMetrics();previousAt=Date.now();
      await sample();timer=setInterval(()=>void sample(),60000);timer.unref();
    },
    async updatePolicy(input:unknown) {
      const next=validate(input);
      if (!pool || !ready) throw new Error('Configuração persistente indisponível neste ambiente.');
      await pool.query("UPDATE publication_monitor_state SET payload=$1,updated_at=$2 WHERE key='policy'",[JSON.stringify(next),Date.now()]);
      policy=next;return next;
    },
    async snapshot() {
      let history=samples,instances:any[]=[];
      if (pool && ready) {
        await readPolicy();
        history=(await pool.query('SELECT payload FROM publication_monitor_samples WHERE instance_id=$1 ORDER BY sampled_at DESC LIMIT 60',[instanceId])).rows.map(row=>JSON.parse(row.payload)).reverse();
        instances=(await pool.query("SELECT key,payload,updated_at FROM publication_monitor_state WHERE key LIKE 'instance:%' AND updated_at>$1 ORDER BY updated_at DESC LIMIT 20",[Date.now()-180000])).rows.map(row=>({id:row.key,...JSON.parse(row.payload),updatedAt:Number(row.updated_at)}));
      }
      return {policy,alerts,history,instances,lastSampleAt,lastError,instanceId,retentionHours:24,intervalSeconds:60};
    },
  };
}
