import React from 'react';
import { ArrowUpRight, BookOpen, ChevronRight, Search, X } from 'lucide-react';
import { helpArticles, helpCategories, searchHelp, type HelpAction } from '../data/help';

interface HelpCenterProps {
  articleId: string | null;
  onSelectArticle: (id: string | null) => void;
  onAction: (action: HelpAction) => void;
}
const actionLabels: Record<HelpAction, string> = {
  'edit-profile': 'Modifica il profilo', profile: 'Apri il mio profilo', saved: 'Apri i salvati',
  language: 'Istruzioni per tradurre', terms: 'Apri condizioni e contatti',
};
const brandText = (text: string) => text.split(/(TempleSale)/).map((part, index) =>
  part === 'TempleSale' ? <span key={index} translate="no" className="notranslate">{part}</span> : part);
const popularIds = ['visibilita', 'parole-chiave', 'foto-home', 'pubblicare'];

export default function HelpCenter({ articleId, onSelectArticle, onAction }: HelpCenterProps) {
  const [query, setQuery] = React.useState('');
  const searchRef = React.useRef<HTMLInputElement>(null);
  const heading = React.useRef<HTMLHeadingElement>(null);
  const article = helpArticles.find(item => item.id === articleId);
  const results = React.useMemo(() => searchHelp(query), [query]);
  React.useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [articleId]);

  const articleButton = (item: typeof helpArticles[number], showSummary = false) => (
    <button key={item.id} type="button" className="ts-help-result" onClick={() => onSelectArticle(item.id)}>
      <span className="min-w-0 flex-1">
        {showSummary && <span className="ts-help-eyebrow">{item.category}</span>}
        <span className="block font-semibold">{brandText(item.title)}</span>
        {showSummary && <span className="ts-help-summary">{brandText(item.summary)}</span>}
      </span>
      <ChevronRight size={18} aria-hidden="true" className="shrink-0 text-slate-400" />
    </button>
  );

  return <section className="ts-help" aria-label="Centro assistenza">
    {article ? <article aria-labelledby="ts-help-article-title">
      <div className="ts-help-article-heading">
        <p className="ts-help-eyebrow">{article.category}</p>
        <h3 id="ts-help-article-title" ref={heading} tabIndex={-1}>{brandText(article.title)}</h3>
        <p className="ts-help-summary">{brandText(article.summary)}</p>
      </div>
      <ol className="ts-help-steps">{article.steps.map((step, index) => <li key={step}>
        <span className="ts-help-step-number" aria-hidden="true">{index + 1}</span><p>{brandText(step)}</p>
      </li>)}</ol>
      {article.note && <aside className="ts-help-note">{brandText(article.note)}</aside>}
      {article.action && <button type="button" className="ts-help-action" onClick={() => onAction(article.action!)}>
        {actionLabels[article.action]}<ArrowUpRight size={17} aria-hidden="true" />
      </button>}
      <div className="ts-help-related">
        <h4 className="ts-help-eyebrow">Potrebbe esserti utile</h4>
        {article.related.map(id => helpArticles.find(item => item.id === id)).filter((item): item is typeof helpArticles[number] => Boolean(item)).map(item => articleButton(item))}
      </div>
      <button type="button" className="ts-help-back" onClick={() => onSelectArticle(null)}>Torna a tutte le guide</button>
    </article> : <>
      <div className="ts-help-intro">
        <span className="ts-help-icon"><BookOpen size={23} aria-hidden="true" /></span>
        <h3 ref={heading} tabIndex={-1}>Come possiamo aiutarti?</h3>
        <p>Trova istruzioni per usare <span translate="no" className="notranslate">TempleSale</span> e far conoscere la tua attività.</p>
      </div>
      <form className="ts-help-search" role="search" aria-label="Cerca nelle guide" onSubmit={event => { event.preventDefault(); searchRef.current?.blur(); }}>
        <label htmlFor="ts-help-query" className="sr-only">Cerca un argomento o una domanda</label>
        <div className="ts-help-search-field">
          <Search size={19} aria-hidden="true" />
          <input ref={searchRef} id="ts-help-query" type="search" enterKeyHint="search" autoComplete="off" maxLength={120}
            value={query} onChange={event => setQuery(event.target.value)} placeholder="Es. Come farmi trovare?" aria-controls="ts-help-results" />
          {query && <button type="button" aria-label="Cancella ricerca" onClick={() => { setQuery(''); searchRef.current?.focus(); }}><X size={18} /></button>}
        </div>
      </form>
      <div id="ts-help-results">
        {query.trim() ? <>
          <p role="status" aria-live="polite" className="ts-help-count">{results.length ? `${results.length} ${results.length === 1 ? 'guida trovata' : 'guide trovate'}` : 'Nessuna guida trovata'}</p>
          {results.length ? <div className="ts-help-list">{results.map(item => articleButton(item, true))}</div> : <div className="ts-help-empty">
            <p>Prova con poche parole, come “foto Home”, “parole chiave”, “commenti” o “posizione”.</p>
            <button type="button" className="ts-help-back" onClick={() => setQuery('')}>Mostra tutti gli argomenti</button>
          </div>}
        </> : <>
          <div className="ts-help-popular">
            <h4 className="ts-help-eyebrow">Da dove iniziare</h4>
            <div className="ts-help-list">{popularIds.map(id => helpArticles.find(item => item.id === id)!).map(item => articleButton(item))}</div>
          </div>
          {helpCategories.map(category => <div key={category} className="ts-help-category">
            <h4>{category}</h4>
            <div className="ts-help-list">{helpArticles.filter(item => item.category === category).map(item => articleButton(item))}</div>
          </div>)}
        </>}
      </div>
    </>}
  </section>;
}
