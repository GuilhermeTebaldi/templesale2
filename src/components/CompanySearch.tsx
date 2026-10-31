import { WhatsappContactLink } from './WhatsappContact';
import React, { useEffect, useRef, useState } from 'react';
import { MapPin, MessageSquare, X, CheckCircle2, Sparkles, Search, LoaderCircle } from 'lucide-react';
import { Company, Post } from '../types';
import { api } from '../lib/api';
import { ProgressiveProductImage } from './ProductCard';
import { buildWhatsappUrl } from '../lib/whatsapp';
import { distanceMeters } from '../lib/discovery-location';
import { ProfilePhotoButton } from './ProfilePhotoViewer';

interface CompanySearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit?: () => void;
  isSearching?: boolean;
  searchError?: string;
  companies: Company[];
  posts: Post[];
  onSelectCompany: (companyId: string) => void;
  onOpenMap?: (company: Company) => void;
  onOpenPost: (post: Post) => void;
  serverResults?: boolean;
  origin?: { lat: number; lng: number };
}

function normalizeSearchTerm(value: string): string {
  return String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export const CompanySearch: React.FC<CompanySearchProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  isSearching = false,
  searchError = '',
  companies,
  posts,
  onSelectCompany,
  onOpenMap,
  onOpenPost,
  origin,
  serverResults = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showSearchFeedback, setShowSearchFeedback] = useState(false);
  const [submission, setSubmission] = useState(0);
  const [quickTags, setQuickTags] = useState<string[]>([]);
  useEffect(() => {
    if (searchQuery.trim() || isSearching || searchError) return;
    const seen = new Set<string>();
    const tags = [...companies.map(company => company.category), ...companies.map(company => company.city), ...companies.flatMap(company => company.keywords)]
      .map(value => String(value || '').trim()).filter(value => {
        const key = normalizeSearchTerm(value);
        if (!key || seen.has(key)) return false;
        seen.add(key); return true;
      }).slice(0, 8);
    setQuickTags(current => JSON.stringify(current) === JSON.stringify(tags) ? current : tags);
  }, [companies, searchQuery, isSearching, searchError]);
  useEffect(() => {
    if (isSearching) { setShowSearchFeedback(true); return; }
    const timer = setTimeout(() => setShowSearchFeedback(false), 450);
    return () => clearTimeout(timer);
  }, [isSearching, submission]);

  // Auto-foco suave no campo de busca quando a tela Buscar é aberta
  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.matchMedia("(min-width: 1180px)").matches && inputRef.current?.closest(".ts-desktop-search:not(.is-active)")) return;
      inputRef.current?.focus();
    }, 120);
    return () => clearTimeout(timer);
  }, []);

  const query = normalizeSearchTerm(searchQuery);
  const queryTerms = query.split(/\s+/).filter(Boolean);

  // Search logic:
  // Procura em:
  // - nome da empresa
  // - categoria
  // - cidade
  // - palavras-chave
  // - descrição
  // - legendas das publicações
  // E mostra EMPRESAS, não produtos.
  const searchResults = companies.map((company) => {
    const companyPosts = posts.filter((p) => p.companyId === company.id)
      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
    const hasLocation =
      typeof company.lat === 'number' && Number.isFinite(company.lat) && company.lat >= -90 && company.lat <= 90 &&
      typeof company.lng === 'number' && Number.isFinite(company.lng) && company.lng >= -180 && company.lng <= 180;
    const distanceKm = origin && hasLocation
      ? distanceMeters(origin, { lat: company.lat as number, lng: company.lng as number }) / 1000
      : null;

    if (!query) {
      return {
        company,
        matchedReasons: [] as string[],
        companyPosts,
        hasLocation,
        distanceKm,
        isMatch: true,
      };
    }

    const matchedReasons: string[] = [];

    // 1. Nome da empresa
    const normalizedName = normalizeSearchTerm(company.name);
    const normalizedCategory = normalizeSearchTerm(company.category);
    const normalizedCity = normalizeSearchTerm(company.city);
    const normalizedDescription = normalizeSearchTerm(company.description);
    const normalizedKeywords = company.keywords.map(normalizeSearchTerm);
    const searchableText = [
      normalizedName,
      normalizedCategory,
      normalizedCity,
      normalizedDescription,
      ...normalizedKeywords,
      ...companyPosts.map((post) => normalizeSearchTerm(post.caption)),
    ].join(" ");
    const matchesAllTerms =
      queryTerms.length > 1 && queryTerms.every((term) => searchableText.includes(term));

    if (normalizedName.includes(query)) {
      matchedReasons.push('Nome da empresa');
    }

    // 2. Categoria
    if (normalizedCategory.includes(query)) {
      matchedReasons.push('Categoria');
    }

    // 3. Cidade
    if (normalizedCity.includes(query)) {
      matchedReasons.push('Cidade');
    }

    // 4. Palavras-chave
    if (normalizedKeywords.some((kw) => kw.includes(query))) {
      matchedReasons.push('Palavras-chave');
    }
    if (
      matchedReasons.length === 0 &&
      queryTerms.some((term) => normalizedKeywords.some((kw) => kw.includes(term)))
    ) {
      matchedReasons.push('Palavras-chave');
    }

    // 5. Descrição
    if (normalizedDescription.includes(query)) {
      matchedReasons.push('Descrição');
    }

    // 6. Legendas das publicações
    const matchingPosts = companyPosts.filter((p) =>
      normalizeSearchTerm(p.caption).includes(query)
    );
    if (matchingPosts.length > 0) {
      matchedReasons.push(`Legenda em ${matchingPosts.length} publicação(ões)`);
    }
    if (matchedReasons.length === 0 && matchesAllTerms) {
      matchedReasons.push('Busca combinada');
    }

    const score =
      normalizedKeywords.some((kw) => kw === query) ? 0 :
      queryTerms.some((term) => normalizedKeywords.some((kw) => kw === term)) ? 1 :
      normalizedName === query ? 1 :
      normalizedCategory === query ? 2 :
      normalizedKeywords.some((kw) => kw.includes(query)) ? 3 :
      matchesAllTerms ? 4 :
      normalizedName.includes(query) ? 4 :
      normalizedCategory.includes(query) ? 5 :
      matchingPosts.length > 0 ? 6 :
      7;

    return {
      company,
      matchedReasons,
      companyPosts,
      hasLocation,
      distanceKm,
      score,
      isMatch: matchedReasons.length > 0,
    };
  }).filter((res) => (serverResults || res.isMatch) && res.hasLocation).sort((left, right) => {
    if (serverResults) return 0;
    if (left.distanceKm !== right.distanceKm) {
      if (left.distanceKm === null) return 1;
      if (right.distanceKm === null) return -1;
      return left.distanceKm - right.distanceKm;
    }
    if (!query) {
      return 0;
    }
    if (left.score !== right.score) {
      return left.score - right.score;
    }
    return right.companyPosts.length - left.companyPosts.length;
  });

  return (
    <div id="search-view" className="max-w-3xl mx-auto px-3 sm:px-4 py-3 sm:py-5 space-y-3.5 sm:space-y-4 animate-in fade-in duration-200">
      {/* BARRA DE PESQUISA / BUSCA (Aparece ao clicar em Buscar) */}
      <form className="relative group" role="search" onSubmit={event => {
        event.preventDefault();
        setShowSearchFeedback(true);
        setSubmission(value => value + 1);
        onSearchSubmit?.();
        inputRef.current?.blur();
      }}>
        <div className="relative flex items-center w-full bg-neutral-900/95 hover:bg-neutral-900 border border-neutral-800/90 hover:border-neutral-700/90 focus-within:border-amber-400/70 focus-within:ring-2 focus-within:ring-amber-400/20 rounded-2xl transition-all duration-200 shadow-sm">
          <Search className="w-4 h-4 text-neutral-400 group-focus-within:text-amber-400 ml-3.5 shrink-0 transition-colors pointer-events-none" />
          <input
            ref={inputRef}
            id="company-search-input"
            type="text"
            enterKeyHint="search"
            aria-label="Cerca attività, servizi o città"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cerca attività, servizi, città..."
            className="w-full pl-3 pr-9 py-2.5 sm:py-3 bg-transparent text-sm sm:text-base text-neutral-100 placeholder-neutral-500 font-normal focus:outline-hidden"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 p-1 text-neutral-400 hover:text-white bg-neutral-800/80 hover:bg-neutral-700 rounded-full transition-colors cursor-pointer"
              title="Pulisci ricerca"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </form>

      <div role="status" aria-live="polite" className="min-h-4 text-xs text-neutral-500 flex items-center gap-1.5">
        {searchError && !isSearching ? <span>{searchError}</span> : showSearchFeedback && (isSearching ? <><LoaderCircle className="w-3.5 h-3.5 animate-spin motion-reduce:animate-none" /><span>Ricerca in corso…</span></> : <><CheckCircle2 className="w-3.5 h-3.5" /><span>Ricerca inviata</span></>)}
      </div>

      {/* ÁREA DE RÁPIDOS: Tags e filtros rápidos */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-xs text-neutral-400 font-medium shrink-0 flex items-center pr-1 select-none">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 mr-1 shrink-0" />
          Ricerca rapida:
        </span>
        {quickTags.map((tag) => {
          const isSelected = searchQuery.toLowerCase() === tag.toLowerCase();
          return (
            <button
              key={tag}
              type="button"
              onClick={() => {
                if (isSelected) {
                  onSearchChange('');
                } else {
                  onSearchChange(tag);
                }
              }}
              className={`text-xs px-3 py-1 rounded-full whitespace-nowrap transition-all duration-150 border shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-neutral-100 text-neutral-950 font-bold border-white shadow-xs'
                  : 'bg-neutral-950/70 hover:bg-neutral-800 text-neutral-300 hover:text-white border-neutral-800 hover:border-neutral-700 active:scale-95'
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {/* Status Bar only when query is active, with quick clear button */}
      {query && (
        <div className="flex items-center justify-between bg-neutral-950/70 border border-neutral-800/80 rounded-full px-4 py-2 text-xs text-neutral-400 backdrop-blur-xs">
          <div className="flex items-center space-x-1.5 truncate">
            <span>Risultati per</span>
            <strong className="text-neutral-100 font-medium truncate">"{searchQuery}"</strong>
            {!isSearching && !searchError && <span className="text-neutral-500 font-mono text-[11px]">({searchResults.length})</span>}
          </div>
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="flex items-center space-x-1 text-xs text-neutral-300 hover:text-white bg-neutral-800/80 hover:bg-neutral-700 px-2.5 py-0.5 rounded-full transition-colors cursor-pointer shrink-0"
            title="Pulisci ricerca"
          >
            <X className="w-3 h-3" />
            <span>Pulisci</span>
          </button>
        </div>
      )}

      {/* Companies Results List */}
      {isSearching || searchError ? null : searchResults.length === 0 ? (
        <div className="text-center py-16 bg-neutral-900/40 rounded-2xl border border-neutral-800/60 p-8 space-y-3">
          <p className="text-sm text-neutral-300 font-medium">
            Nessuna attività trovata per "{searchQuery}".
          </p>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            Prova un altro termine o una città.
          </p>
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 rounded-xl transition-colors cursor-pointer"
          >
            Vedi tutte le attività
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {searchResults.map(({ company, companyPosts, distanceKm }) => {
            const whatsappUrl = buildWhatsappUrl(undefined, company.whatsapp, company.name, {
              kind: 'establishment',
            });

            const latestPosts = companyPosts.slice(0, 3);
            const profilePhoto =
              company.ownerAvatarUrl ||
              latestPosts.find((post) => post.authorAvatarUrl)?.authorAvatarUrl ||
              company.logo;

            return (
              <div
                key={company.id}
                id={`search-card-${company.id}`}
                className="ts-search-card bg-neutral-900 border border-neutral-800/80 hover:border-neutral-700/80 rounded-2xl p-3 sm:p-3.5 shadow-sm space-y-2.5 transition-colors"
              >
                {/* Cabeçalho da Empresa + WhatsApp (Clicar no nome/avatar entra direto no perfil) */}
                <div className="flex items-center justify-between gap-2.5">
                  <div
                    onClick={() => onSelectCompany(company.id)}
                    className="flex items-center space-x-2.5 cursor-pointer group min-w-0 flex-1"
                    title={`Apri il profilo di ${company.name}`}
                  >
                    <ProfilePhotoButton src={profilePhoto} name={company.name} className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-neutral-700/80 transition-colors group-hover:border-neutral-400">
                      <ProgressiveProductImage
                        src={profilePhoto}
                        alt={company.name}
                        className="relative h-full w-full rounded-full object-cover"
                        loading="lazy"
                        variant="thumbnail"
                      />
                    </ProfilePhotoButton>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1.5 truncate">
                        <span className="text-sm font-bold text-neutral-100 group-hover:text-white transition-colors truncate">
                          {company.name}
                        </span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      </div>
                      <div className="flex items-center text-[11px] text-neutral-400 space-x-1.5 truncate">
                        <span className="text-neutral-300 font-medium truncate">{company.category}</span>
                        <span>•</span>
                        <span className="flex items-center text-neutral-400 truncate">
                          <MapPin className="w-3 h-3 mr-0.5 shrink-0" />
                          <span className="truncate">{company.city}</span>
                        </span>
                        {distanceKm !== null && (
                          <>
                            <span>•</span>
                            <span className="shrink-0 text-emerald-300">
                              {distanceKm < 1
                                ? `${Math.round(distanceKm * 1000)} m`
                                : `${distanceKm.toLocaleString(undefined, { maximumFractionDigits: 1 })} km`}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="ts-search-card-actions flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onOpenMap?.(company)}
                      className="flex items-center space-x-1.5 rounded-xl border border-sky-500/40 px-3 py-1.5 text-xs font-semibold text-sky-300 shadow-xs transition-all hover:bg-sky-500 hover:text-neutral-950 active:scale-95"
                      title={`Vedi ${company.name} sulla mappa TempleSale`}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Mappa</span>
                    </button>

                    {whatsappUrl && (
                      <WhatsappContactLink companyId={company.id} companyName={company.name}
                        href={whatsappUrl}
                onConfirm={() => void api.trackDiscovery('whatsapp', company.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs active:scale-95 transition-all cursor-pointer"
                        title={`Contatta ${company.name} su WhatsApp`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </WhatsappContactLink>
                    )}
                  </div>
                </div>

                {/* As 3 últimas publicações enquadradas (Clicar na foto abre a publicação) */}
                {latestPosts.length > 0 ? (
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-0.5">
                    {latestPosts.map((post) => (
                      <div
                        key={post.id}
                        onClick={() => onOpenPost(post)}
                        className="relative aspect-square rounded-lg overflow-hidden bg-neutral-950 border border-neutral-800/80 hover:border-neutral-500 cursor-pointer transition-all group"
                        title={post.caption}
                      >
                        <ProgressiveProductImage
                          src={post.imageUrl}
                          alt={post.caption}
                          className="relative w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          variant="thumbnail"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-2 text-center text-[11px] text-neutral-500 italic border-t border-neutral-800/40">
                    Nessuna foto pubblicata
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
