import React from 'react';
function browserHelp() {
  const ua=navigator.userAgent,ios=/iPhone|iPad|iPod/.test(ua);
  const installed=window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & {standalone?:boolean}).standalone);
  if(installed)return {installed,title:'App installata',steps:['Apri questa pagina nel browser oppure copia il link e incollalo in Safari o Chrome.','Usa il comando di traduzione nel menu del browser. La finestra dell’app installata può non offrire questo comando.']};
  if(/Edg\/|EdgiOS/.test(ua))return {installed,title:'Microsoft Edge',steps:['Apri il menu ⋯ del browser.','Scegli Traduci e seleziona la lingua desiderata.']};
  if(/Chrome|CriOS/.test(ua))return {installed,title:'Google Chrome',steps:[ios?'Apri il menu ⋯ di Chrome.':'Apri il menu ⋮ di Chrome oppure l’icona di traduzione nella barra degli indirizzi.','Scegli Traduci e seleziona la lingua desiderata.']};
  if(/Safari/.test(ua)&&!/Android|FxiOS|EdgiOS/.test(ua))return {installed,title:'Safari',steps:[ios?'Tocca il menu della pagina nella barra degli indirizzi.':'Clicca l’icona di traduzione nella barra degli indirizzi.','Scegli Traduci nella tua lingua, se disponibile.']};
  return {installed,title:'Il tuo browser',steps:['Apri il menu del browser e cerca Traduci pagina.','Se il comando non è disponibile, apri il link in Safari, Chrome o Edge.']};
}
export default function BrowserTranslationHelp() {
  const help=React.useMemo(browserHelp,[]),[message,setMessage]=React.useState('');
  const url=window.location.href;
  return <section className="space-y-4 p-5 text-sm text-slate-900">
    <p>La lingua originale di <span translate="no" className="notranslate">TempleSale</span> è l’italiano. Per leggere il sito in un’altra lingua usa la traduzione del browser.</p>
    <h3 className="font-semibold">{help.title}</h3>
    <ol className="list-decimal space-y-3 pl-5">{help.steps.map(step=><li key={step}>{step}</li>)}</ol>
    <p className="text-xs text-slate-500">Il sito non può avviare automaticamente il traduttore del browser. Il comando e le lingue disponibili dipendono dal dispositivo. Se il telefono è già in italiano, scegli un’altra lingua nelle impostazioni di traduzione del browser.</p>
    {help.installed&&<a href={url} target="_blank" rel="noopener noreferrer" className="inline-block rounded-lg border border-slate-300 px-4 py-2 font-semibold">Apri nel browser</a>}
    <button type="button" className="block font-semibold underline" onClick={async()=>{try{await navigator.clipboard.writeText(url);setMessage('Link copiato.');}catch{setMessage('Seleziona e copia il link qui sotto.');}}}>Copia il link</button>
    {message&&<p role="status">{message}</p>}
    <input aria-label="Link della pagina" readOnly value={url} onFocus={event=>event.currentTarget.select()} className="w-full rounded-lg border border-slate-300 p-2 text-xs" translate="no" />
  </section>;
}
