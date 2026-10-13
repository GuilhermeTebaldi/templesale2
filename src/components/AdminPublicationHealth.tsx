import React from 'react';
import { translate } from '../i18n';
const italian=(text:string)=>translate('it-IT',text);

type Requester=(path:string,options?:{method?:'GET'|'PUT'|'POST';token?:string;body?:unknown;signal?:AbortSignal})=>Promise<any>;
const LABELS:Record<string,string>={publications:'Pubblicazioni',comments:'Commenti',uploads:'Foto'};
export default function AdminPublicationHealth({token,request}:{token:string;request:Requester}) {
  const [data,setData]=React.useState<any>(null),[error,setError]=React.useState(''),[busy,setBusy]=React.useState(false);
  const [policy,setPolicy]=React.useState<any>(null),[message,setMessage]=React.useState('');
  const alive=React.useRef(true),loading=React.useRef(false);
  const load=React.useCallback(async(signal?:AbortSignal)=>{
    if(loading.current)return;loading.current=true;
    try {
      const next=await request('/api/admin/publication-capacity',{token,signal});
      if(alive.current){setData(next);setPolicy((current:any)=>current??next.monitor.policy);setError('');}
    } catch(error){if(alive.current&&!signal?.aborted)setError(error instanceof Error?error.message:"Impossibile aggiornare.");}
    finally {loading.current=false;}
  },[token,request]);
  React.useEffect(()=>{
    alive.current=true;const controller=new AbortController();void load(controller.signal);
    const timer=setInterval(()=>{if(document.visibilityState==='visible')void load(controller.signal);},30000);
    return()=>{alive.current=false;controller.abort();clearInterval(timer);};
  },[load]);
  const save=async()=>{
    setBusy(true);setMessage('');
    try{await request('/api/admin/publication-capacity/policy',{method:'PUT',token,body:policy});setMessage("Parametri salvati.");await load();}
    catch(error){setMessage(error instanceof Error?error.message:"Salvataggio non riuscito.");}finally{setBusy(false);}
  };
  const alerts=[...(data?.monitor?.alerts??[]),...(data?.monitor?.instances?.flatMap((instance:any)=>instance.alerts??[])??[])];
  const unique=Array.from(new Map(alerts.map((alert:any)=>[alert.code,alert])).values()) as any[];
  const history=data?.monitor?.history??[];
  const last=history[history.length-1];
  const peak=Math.max(1,...history.map((point:any)=>point.observed.operationsPerMinute));
  return <article className="border border-stone-200 bg-white p-4 sm:p-5 space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold text-stone-900">Stato delle pubblicazioni</h2><p className="text-xs text-stone-500">Utilizzo reale, limiti e avvisi automatici. Aggiornamenti mentre questa schermata è aperta.</p></div><button type="button" onClick={()=>void load()} className="border border-stone-300 px-3 py-2 text-xs">Aggiorna</button></div>
    {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
    {!data&&!error&&<p className="text-sm text-stone-500">Caricamento indicatori...</p>}
    {data&&<>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
        <div className="bg-stone-50 p-3"><p className="text-xs text-stone-500">Memoria dell’istanza</p><strong>{(data.memory.rss/1024/1024).toFixed(0)} MB</strong></div>
        <div className="bg-stone-50 p-3"><p className="text-xs text-stone-500">Connessioni al database</p><strong>{data.databasePool?.total??0} / {data.databasePool?.max??'—'}</strong><p className="text-xs">{data.databasePool?.waiting??0} in attesa</p></div>
        <div className="bg-stone-50 p-3"><p className="text-xs text-stone-500">Operazioni al minuto</p><strong>{last?last.observed.operationsPerMinute.toFixed(1):"In attesa di campioni"}</strong></div>
        <div className="bg-stone-50 p-3"><p className="text-xs text-stone-500">Ritardo del server, p99</p><strong>{Number(data.eventLoopP99Ms).toFixed(0)} ms</strong></div>
      </div>
      <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b"><th className="py-2">Fase</th><th>In corso, globale</th><th>Limite globale</th><th>Rifiuti nell’istanza</th></tr></thead><tbody>{Object.entries(LABELS).map(([key,label])=><tr key={key} className="border-b border-stone-100"><td className="py-2">{label}</td><td>{Number(data.globalActive.find((row:any)=>row.kind===key)?.active??0)}</td><td>{data.capacity.limits[key]}</td><td>{data.writes[key].rejected}</td></tr>)}</tbody></table></div>
      <div aria-label="Operazioni osservate nei campioni recenti"><p className="text-xs text-stone-500 mb-2">Andamento recente dell’istanza · operazioni al minuto</p><div className="flex h-16 items-end gap-1 bg-stone-50 p-2">{history.map((point:any)=><div key={point.sampledAt} title={`${new Date(point.sampledAt).toLocaleTimeString()}: ${point.observed.operationsPerMinute.toFixed(1)}/min`} className="min-w-1 flex-1 bg-sky-600" style={{height:`${Math.max(2,point.observed.operationsPerMinute/peak*100)}%`}}/>)}</div></div>
      <p className="text-xs text-stone-500">{last?`Ultimo campione: ${new Date(last.sampledAt).toLocaleTimeString()}. Errori: ${last.observed.failed}; rifiuti: ${last.observed.rejected}.`:"Non ci sono ancora campioni sufficienti."} Storico conservato fino a 24 ore. I limiti non indicano una capacità massima misurata.</p>
      {data.monitor.lastError&&<p role="alert" className="text-xs text-amber-800">{italian(data.monitor.lastError)}</p>}
      <div className="space-y-2"><h3 className="text-sm font-semibold">Avvisi automatici</h3>{unique.length?unique.map(alert=><p key={alert.code} role="alert" className="border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">{italian(alert.message)}</p>):<p className="text-xs text-stone-500">Nessun avviso nei campioni disponibili.</p>}</div>
      <div className="border-t pt-3"><h3 className="text-sm font-semibold">Invio diretto delle foto</h3><p className="text-xs mt-1">{data.directUpload.enabled?"Disponibile":"Invio tramite server"} · {italian(data.directUpload.reason)}</p><p className="text-xs text-stone-500">Limite dichiarato dall’account: {data.directUpload.accountMaxBytes?(data.directUpload.accountMaxBytes/1024/1024).toFixed(1)+' MB':"non confermato"}.</p><button type="button" disabled={busy} className="mt-2 border px-3 py-2 text-xs" onClick={async()=>{setBusy(true);try{await request('/api/admin/publication-capacity/cloudinary-refresh',{method:'POST',token});await load();}catch(error){setMessage(error instanceof Error?error.message:"Richiesta non riuscita.");}finally{setBusy(false);}}}>Verifica Cloudinary</button></div>
      <details className="border-t pt-3"><summary className="cursor-pointer text-sm font-semibold">Parametri degli avvisi</summary><p className="text-xs text-stone-500 mt-2">Questi valori regolano gli avvisi. Non aumentano la concorrenza né modificano il piano Render. Il budget di memoria deve corrispondere al piano.</p><div className="grid grid-cols-2 gap-3 mt-3">{[['memoryBudgetMb',"Budget di memoria, MB",64,16384],['slowMs',"Tempo accettabile, ms",100,60000],['errorPercent',"Errori, %",1,50],['busyPercent',"Rifiuti, %",1,90]].map(([key,label,min,max])=><label key={String(key)} className="text-xs">{label}<input type="number" min={Number(min)} max={Number(max)} value={policy?.[String(key)]??''} onChange={event=>setPolicy({...policy,[String(key)]:Number(event.target.value)})} className="mt-1 w-full border border-stone-300 p-2"/></label>)}</div><button type="button" disabled={busy} onClick={()=>void save()} className="mt-3 bg-stone-900 text-white px-3 py-2 text-xs">Salva parametri</button></details>
    </>}
    {message&&<p role="status" className="text-xs text-stone-700">{message}</p>}
  </article>;
}
