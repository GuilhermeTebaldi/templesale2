import React from 'react';
import type { TaxonomySuggestionDto } from '../lib/api';
import { ChevronDown } from 'lucide-react';

const key = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export default function BusinessCategoryInput({ value, suggestions, onChange }: {
  value: string; suggestions: TaxonomySuggestionDto[]; onChange: (value: string) => void;
}) {
  const id = React.useId();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [active, setActive] = React.useState(-1);
  const options = suggestions.filter(item => key(item.label).includes(key(query)));
  const choose = (label: string) => { onChange(label); setOpen(false); setQuery(''); setActive(-1); };
  React.useEffect(() => {
    if (open && active >= 0) document.getElementById(`${id}-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, id, open]);
  return <div className="relative">
    <input required value={value} role="combobox" aria-label="Categoria dell’attività" autoComplete="off"
      aria-expanded={open} aria-controls={id} aria-autocomplete="list"
      aria-activedescendant={open && active >= 0 ? `${id}-${active}` : undefined}
      placeholder="Bar, Ristorante, Mago…"
      className="w-full border-b border-neutral-300 bg-transparent py-3 pr-8 text-neutral-900 outline-none focus:border-sky-600"
      onFocus={() => { setOpen(true); setQuery(''); setActive(-1); }}
      onClick={() => { if (!open) { setOpen(true); setQuery(''); setActive(-1); } }}
      onBlur={() => setOpen(false)}
      onChange={event => { onChange(event.target.value); setQuery(event.target.value); setOpen(true); setActive(-1); }}
      onKeyDown={event => {
        if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); }
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault(); setOpen(true);
          setActive(current => options.length ? (current + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length : -1);
        }
        if (event.key === 'Enter' && open) { event.preventDefault(); if (active >= 0 && options[active]) choose(options[active].label); else setOpen(false); }
      }} />
    <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-1 top-3.5 h-4 w-4 text-slate-500" />
    {open && <div id={id} role="listbox" aria-label="Categorie disponibili"
      className="absolute inset-x-0 top-full z-30 max-h-56 overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white py-1 text-sm text-slate-800 shadow-lg">
      {options.map((item, index) => <button key={item.key} id={`${id}-${index}`} type="button" role="option"
        aria-selected={active === index} tabIndex={-1} onMouseDown={event => event.preventDefault()} onClick={() => choose(item.label)}
        className={`block w-full px-4 py-3 text-left hover:bg-slate-50 ${active === index ? 'bg-slate-100' : ''}`}>{item.label}</button>)}
      {!options.length && <p className="px-4 py-3 text-slate-500">Nuova categoria: {value.trim()}</p>}
    </div>}
  </div>;
}
