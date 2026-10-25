import React from 'react';
import { api, type TaxonomySuggestionDto } from '../lib/api';

export default function AdminTaxonomy() {
  const [categories, setCategories] = React.useState<TaxonomySuggestionDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [version, setVersion] = React.useState(0);
  React.useEffect(() => {
    let cancelled = false;
    setLoading(true); setError('');
    api.getBusinessCategorySuggestions().then(rows => { if (!cancelled) setCategories(rows); })
      .catch(() => { if (!cancelled) setError('Impossibile caricare le categorie.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [version]);
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const visible = categories.filter(item => normalize([item.label, ...(item.keywords ?? [])].join(' ')).includes(normalize(query)));
  const keywordCount = new Set(categories.flatMap(item => (item.keywords ?? []).map(normalize))).size;
  return <section className="space-y-4" aria-label="Categorie e parole chiave">
    <article className="border border-stone-200 bg-white p-4 sm:p-5">
      <h2 className="text-base font-semibold text-stone-900">Categorie e parole chiave</h2>
      <p className="mt-1 text-xs text-stone-500">{categories.length} categorie · {keywordCount} parole chiave · {categories.filter(item => item.usageCount > 0).length} categorie utilizzate</p>
      <input type="search" aria-label="Cerca categorie o parole chiave" placeholder="Cerca categorie o parole chiave"
        value={query} onChange={event => setQuery(event.target.value)}
        className="mt-4 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900" />
    </article>
    {loading && <p role="status" className="text-sm text-stone-600">Caricamento…</p>}
    {error && <div role="alert" className="text-sm text-red-700">{error} <button type="button" className="underline" onClick={() => setVersion(value => value + 1)}>Riprova</button></div>}
    {!loading && !error && <div className="grid gap-3 sm:grid-cols-2">
      {visible.map(item => <article key={item.key} className="min-w-0 border border-stone-200 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="break-words text-sm font-semibold text-stone-900">{item.label}</h3>
          <span className="shrink-0 text-xs text-stone-500">{item.usageCount} attività</span>
        </div>
        <p className="mt-1 text-[11px] text-stone-500">{item.source === 'system' ? 'Categoria di sistema' : 'Inserita dagli utenti'}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">{item.keywords?.length ? item.keywords.map(word =>
          <span key={word} className="max-w-full break-words rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-700">{word}</span>) : <span className="text-xs text-stone-400">Nessuna parola chiave</span>}</div>
      </article>)}
      {!visible.length && <p className="text-sm text-stone-500">Nessuna categoria trovata.</p>}
    </div>}
  </section>;
}
