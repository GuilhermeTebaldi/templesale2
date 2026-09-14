import React from 'react';
import { MapPin, Search, Navigation, LoaderCircle, MessageCircle, ArrowRight } from 'lucide-react';
import { api, type DiscoveryPage, type EstablishmentDto } from '../lib/api';
import { useDiscoveryLocation, type DiscoveryOrigin } from '../lib/discovery-location';
import { buildWhatsappUrl } from '../lib/whatsapp';
import { ProgressiveProductImage } from './ProductCard';
import { useI18n } from '../i18n/provider';

const CATEGORIES = ['All', 'Ristorante', 'Bar', 'Negozi', 'Barbieri', 'Officine', 'Mercati'];
const emptyPage: DiscoveryPage = { items: [], hasMore: false, nextOffset: 0 };

export function NearbyDiscovery({ active, locationActive = active, onOpenCompany, onOpenMap, onOriginChange }: {
  active: boolean; locationActive?: boolean; onOpenCompany: (company: EstablishmentDto) => void; onOpenMap: (company: EstablishmentDto) => void; onOriginChange?: (origin: DiscoveryOrigin | null) => void;
}) {
  const { t, locale } = useI18n();
  const location = useDiscoveryLocation(locationActive, onOriginChange);
  const [city, setCity] = React.useState(location.origin?.city || '');
  const [editingCity, setEditingCity] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [category, setCategory] = React.useState('All');
  const [radius, setRadius] = React.useState(5);
  const [offset, setOffset] = React.useState(0);
  const [page, setPage] = React.useState(emptyPage);
  const [pageKey, setPageKey] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [retry, setRetry] = React.useState(0);
  const key = JSON.stringify([location.origin, query, category, radius]);
  const previousKey = React.useRef(key);
  React.useEffect(() => {
    const timer = window.setTimeout(() => setQuery(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);
  React.useEffect(() => {
    if (previousKey.current !== key) { previousKey.current = key; setOffset(0); }
  }, [key]);
  React.useEffect(() => {
    if (!active || !location.origin) return;
    const controller = new AbortController();
    // A changed location/filter always starts a fresh page.
    const nextOffset = pageKey === key ? offset : 0;
    setLoading(true); setError('');
    void api.getDiscovery({ ...location.origin, radius, search: query, category, offset: nextOffset }, controller.signal).then(result => {
      if (controller.signal.aborted) return;
      setPage(current => ({ ...result, items: nextOffset ? [...new Map([...current.items, ...result.items].map(item => [item.establishment.id, item])).values()] : result.items }));
      setPageKey(key);
    }).catch(failure => {
      if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : t('Não foi possível carregar empresas próximas.'));
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
    // pageKey records the accepted response; it must not trigger another request.
  }, [active, key, offset, retry]);
  const results = pageKey === key ? page : emptyPage;
  const buttonClass = 'rounded-xl border border-neutral-700 px-4 py-2.5 text-sm font-medium text-neutral-100 hover:bg-neutral-800 disabled:opacity-50';
  return (
    <section className="mx-auto max-w-3xl px-4 py-5 sm:py-8" aria-label={t('Perto de você')}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-white">{t('Perto de você')}</h1>
          <p className="mt-1 text-sm text-neutral-400">{t('Encontre produtos e empresas na sua região.')}</p>
        </div>
        {location.origin && <button type="button" onClick={() => setEditingCity(value => !value)} className="shrink-0 rounded-lg px-2 py-2 text-sm text-emerald-300">{t('Alterar local')}</button>}
      </div>
      <div className="mb-5 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4">
        <p className="flex items-center gap-2 text-sm text-neutral-200"><MapPin className="h-4 w-4 shrink-0 text-emerald-400" />
          {location.origin?.city || (location.origin ? t(location.fresh ? 'Sua localização atual' : 'Última localização salva') : t('Escolha onde procurar'))}
        </p>
        {(!location.origin || editingCity || location.error) && <>
          <p className="mt-3 text-sm leading-6 text-neutral-400">{t('Usamos sua localização para mostrar empresas e produtos próximos, somente enquanto esta página estiver aberta.')}</p>
          {(location.error || location.origin) && <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={location.useGps} disabled={location.locating} className={buttonClass}>
              <span className="flex items-center gap-2">{location.locating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}{t(location.origin ? 'Atualizar localização' : 'Tentar localização')}</span>
            </button>
          </div>}
          <form className="mt-3 flex gap-2" onSubmit={event => { event.preventDefault(); if (city.trim()) { location.useCity(city); setEditingCity(false); } }}>
            <input aria-label={t('Cidade')} value={city} onChange={event => setCity(event.target.value)} maxLength={120} required placeholder={t('Digite a cidade')} className="min-w-0 flex-1 rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm text-white" />
            <button className={buttonClass} type="submit">{t('Buscar')}</button>
          </form>
        </>}
        {location.error && <p role="status" className="mt-3 text-sm text-amber-300">{t(location.error)}</p>}
      </div>
      {location.origin && <>
        <div className="flex gap-2">
          <label className="relative min-w-0 flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" /><span className="sr-only">{t('Buscar produtos e empresas')}</span>
            <input value={search} onChange={event => setSearch(event.target.value)} maxLength={120} placeholder={t('O que você procura?')} className="w-full rounded-xl border border-neutral-800 bg-neutral-900 py-2.5 pl-9 pr-3 text-sm text-white" />
          </label>
          {!location.origin.city && <select aria-label={t('Raio de busca')} value={radius} onChange={event => setRadius(Number(event.target.value))} className="rounded-xl border border-neutral-800 bg-neutral-900 px-2 text-sm text-white">{[2, 5, 10, 25, 50].map(km => <option key={km} value={km}>{km} km</option>)}</select>}
        </div>
        <div className="-mx-4 mb-5 mt-3 flex gap-2 overflow-x-auto px-4 pb-2" aria-label={t('Categorias')}>
          {CATEGORIES.map(value => <button type="button" key={value} aria-pressed={category === value} onClick={() => setCategory(value)} className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-medium ${category === value ? 'border-emerald-400 bg-emerald-400 text-neutral-950' : 'border-neutral-800 text-neutral-300'}`}>{t(value === 'All' ? 'Todas' : value)}</button>)}
        </div>
        {error && <div role="alert" className="mb-4 rounded-xl border border-amber-700/50 p-4 text-sm text-amber-200"><p>{t('Não foi possível carregar empresas próximas.')}</p><button type="button" onClick={() => setRetry(value => value + 1)} className="mt-2 underline">{t('Tentar novamente')}</button></div>}
        <div className="grid gap-4 sm:grid-cols-2" aria-busy={loading}>
          {results.items.map(({ establishment: company, distanceKm, publications, products }) => {
            const whatsapp = buildWhatsappUrl(company.whatsappCountryIso, company.whatsappNumber || company.phone, company.name, { kind: 'establishment' });
            const open = () => { void api.trackDiscovery('company_open', company.id); onOpenCompany(company); };
            const previews = publications.length ? publications.map(post => ({ id: post.id, image: post.imageUrl, label: post.caption, price: '' })) : products.map(product => ({ id: product.id, image: product.image, label: product.name, price: product.price }));
            return <article key={company.id} className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/50">
              <button type="button" onClick={open} className="flex w-full items-center gap-3 p-4 text-left">
                <img src={company.logoUrl || '/templesale-logo.svg'} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover" />
                <div className="min-w-0 flex-1"><h2 className="truncate text-base font-semibold text-white">{company.name}</h2><p className="truncate text-xs text-neutral-400">{company.category}</p></div><ArrowRight className="h-4 w-4 shrink-0 text-neutral-500" />
              </button>
              <p className="flex items-start gap-1.5 px-4 pb-3 text-xs text-neutral-300"><MapPin className="h-4 w-4 shrink-0 text-emerald-400" /><span>{distanceKm !== null && <strong className="mr-2 whitespace-nowrap text-emerald-300">{distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toLocaleString(locale, { maximumFractionDigits: 1 })} km`}</strong>}{company.city}{company.address ? ` · ${company.address}` : ''}</span></p>
              {previews.length > 0 && <div className="grid grid-cols-3 gap-0.5">{previews.map(preview => <button type="button" key={preview.id} onClick={open} aria-label={`${t('Ver vitrine')}: ${company.name}${preview.label ? ` — ${preview.label}` : ''}`} className="relative aspect-square overflow-hidden bg-neutral-800"><ProgressiveProductImage src={preview.image} alt={preview.label || company.name} className="h-full w-full object-cover" variant="thumbnail" />{preview.price && <span className="absolute bottom-0 inset-x-0 bg-black/75 px-1 py-1 text-xs text-white">{preview.price}</span>}</button>)}</div>}
              <div className="flex gap-2 p-3">
                {whatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer" onClick={() => { void api.trackDiscovery('whatsapp', company.id); }} className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-400 py-2.5 text-xs font-semibold text-neutral-950"><MessageCircle className="h-4 w-4" />WhatsApp</a>}
                {company.latitude !== undefined && company.longitude !== undefined && <button type="button" onClick={() => { void api.trackDiscovery('map', company.id); onOpenMap(company); }} className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl border border-neutral-700 py-2.5 text-xs text-white"><MapPin className="h-4 w-4" />{t('Mapa')}</button>}
              </div>
            </article>;
          })}
        </div>
        {loading && <p role="status" className="flex items-center justify-center gap-2 py-8 text-sm text-neutral-400"><LoaderCircle className="h-4 w-4 animate-spin" />{t('Buscando empresas próximas…')}</p>}
        {!loading && !error && !results.items.length && <div className="py-10 text-center"><p className="text-sm text-neutral-300">{t('Nenhuma empresa encontrada nesta região.')}</p><p className="mt-2 text-xs text-neutral-500">{t('Tente outra categoria, amplie o raio ou escolha outra cidade.')}</p></div>}
        {results.hasMore && <button type="button" disabled={loading} onClick={() => setOffset(results.nextOffset)} className={`${buttonClass} mx-auto mt-5 block`}>{t('Ver mais empresas')}</button>}
      </>}
    </section>
  );
}
