import React from 'react';
export default function BrowserTranslationHelp() {
  const [message,setMessage]=React.useState('');
  const url=window.location.href;
  return <section className="space-y-4 p-5 text-sm text-slate-900">
    <h3 className="font-semibold">Italiano</h3>
    <p><span translate="no" className="notranslate">TempleSale</span> mantiene l’italiano originale. La traduzione automatica è disattivata per mantenere corretti testi e pulsanti.</p>
    <button type="button" className="block font-semibold underline" onClick={async()=>{try{await navigator.clipboard.writeText(url);setMessage('Link copiato.');}catch{setMessage('Seleziona e copia il link qui sotto.');}}}>Copia il link</button>
    {message&&<p role="status">{message}</p>}
    <input aria-label="Link della pagina" readOnly value={url} onFocus={event=>event.currentTarget.select()} className="w-full rounded-lg border border-slate-300 p-2 text-xs" translate="no" />
  </section>;
}
