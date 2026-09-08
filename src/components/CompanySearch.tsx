import React, { useEffect, useRef } from 'react';
import { MapPin, MessageSquare, X, CheckCircle2, Sparkles, Search } from 'lucide-react';
import { Company, Post } from '../types';

interface CompanySearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  companies: Company[];
  posts: Post[];
  onSelectCompany: (companyId: string) => void;
  onOpenPost: (post: Post) => void;
}

const QUICK_TAGS = ['bar', 'pizza', 'barbeiro', 'Ardea', 'birra', 'motor', 'café', 'moda'];

export const CompanySearch: React.FC<CompanySearchProps> = ({
  searchQuery,
  onSearchChange,
  companies,
  posts,
  onSelectCompany,
  onOpenPost,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-foco suave no campo de busca quando a tela Buscar é aberta
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 120);
    return () => clearTimeout(timer);
  }, []);

  const query = searchQuery.trim().toLowerCase();

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
    const companyPosts = posts.filter((p) => p.companyId === company.id);

    if (!query) {
      return {
        company,
        matchedReasons: [] as string[],
        companyPosts,
        isMatch: true,
      };
    }

    const matchedReasons: string[] = [];

    // 1. Nome da empresa
    if (company.name.toLowerCase().includes(query)) {
      matchedReasons.push('Nome da empresa');
    }

    // 2. Categoria
    if (company.category.toLowerCase().includes(query)) {
      matchedReasons.push('Categoria');
    }

    // 3. Cidade
    if (company.city.toLowerCase().includes(query)) {
      matchedReasons.push('Cidade');
    }

    // 4. Palavras-chave
    if (company.keywords.some((kw) => kw.toLowerCase().includes(query))) {
      matchedReasons.push('Palavras-chave');
    }

    // 5. Descrição
    if (company.description.toLowerCase().includes(query)) {
      matchedReasons.push('Descrição');
    }

    // 6. Legendas das publicações
    const matchingPosts = companyPosts.filter((p) =>
      p.caption.toLowerCase().includes(query)
    );
    if (matchingPosts.length > 0) {
      matchedReasons.push(`Legenda em ${matchingPosts.length} publicação(ões)`);
    }

    return {
      company,
      matchedReasons,
      companyPosts,
      isMatch: matchedReasons.length > 0,
    };
  }).filter((res) => res.isMatch);

  return (
    <div id="search-view" className="max-w-3xl mx-auto px-3 sm:px-4 py-3 sm:py-5 space-y-3.5 sm:space-y-4 animate-in fade-in duration-200">
      {/* BARRA DE PESQUISA / BUSCA (Aparece ao clicar em Buscar) */}
      <div className="relative group">
        <div className="relative flex items-center w-full bg-neutral-900/95 hover:bg-neutral-900 border border-neutral-800/90 hover:border-neutral-700/90 focus-within:border-amber-400/70 focus-within:ring-2 focus-within:ring-amber-400/20 rounded-2xl transition-all duration-200 shadow-sm">
          <Search className="w-4 h-4 text-neutral-400 group-focus-within:text-amber-400 ml-3.5 shrink-0 transition-colors pointer-events-none" />
          <input
            ref={inputRef}
            id="company-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar empresas, serviços, cidades..."
            className="w-full pl-3 pr-9 py-2.5 sm:py-3 bg-transparent text-sm sm:text-base text-neutral-100 placeholder-neutral-500 font-normal focus:outline-hidden"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 p-1 text-neutral-400 hover:text-white bg-neutral-800/80 hover:bg-neutral-700 rounded-full transition-colors cursor-pointer"
              title="Limpar busca"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ÁREA DE RÁPIDOS: Tags e filtros rápidos */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-xs text-neutral-400 font-medium shrink-0 flex items-center pr-1 select-none">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 mr-1 shrink-0" />
          Rápido:
        </span>
        {QUICK_TAGS.map((tag) => {
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
            <span>Resultados para</span>
            <strong className="text-neutral-100 font-medium truncate">"{searchQuery}"</strong>
            <span className="text-neutral-500 font-mono text-[11px]">({searchResults.length})</span>
          </div>
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="flex items-center space-x-1 text-xs text-neutral-300 hover:text-white bg-neutral-800/80 hover:bg-neutral-700 px-2.5 py-0.5 rounded-full transition-colors cursor-pointer shrink-0"
            title="Limpar busca"
          >
            <X className="w-3 h-3" />
            <span>Limpar</span>
          </button>
        </div>
      )}

      {/* Companies Results List */}
      {searchResults.length === 0 ? (
        <div className="text-center py-16 bg-neutral-900/40 rounded-2xl border border-neutral-800/60 p-8 space-y-3">
          <p className="text-sm text-neutral-300 font-medium">
            Nenhuma empresa encontrada para "{searchQuery}".
          </p>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            Tente pesquisar por termos como <span className="text-neutral-200 font-semibold">bar</span>,{' '}
            <span className="text-neutral-200 font-semibold">pizza</span>,{' '}
            <span className="text-neutral-200 font-semibold">barbeiro</span>,{' '}
            <span className="text-neutral-200 font-semibold">Ardea</span> ou{' '}
            <span className="text-neutral-200 font-semibold">motor</span>.
          </p>
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 rounded-xl transition-colors cursor-pointer"
          >
            Ver todas as empresas
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {searchResults.map(({ company, companyPosts }) => {
            const cleanWhatsAppNumber = company.whatsapp.replace(/\D/g, '');
            const whatsappUrl = `https://wa.me/${cleanWhatsAppNumber}?text=${encodeURIComponent(
              `Olá! Encontrei a empresa ${company.name} no TempleSale e gostaria de saber mais.`
            )}`;

            const latestPosts = companyPosts.slice(0, 3);

            return (
              <div
                key={company.id}
                id={`search-card-${company.id}`}
                className="bg-neutral-900 border border-neutral-800/80 hover:border-neutral-700/80 rounded-2xl p-3 sm:p-3.5 shadow-sm space-y-2.5 transition-colors"
              >
                {/* Cabeçalho da Empresa + WhatsApp (Clicar no nome/avatar entra direto no perfil) */}
                <div className="flex items-center justify-between gap-2.5">
                  <div
                    onClick={() => onSelectCompany(company.id)}
                    className="flex items-center space-x-2.5 cursor-pointer group min-w-0 flex-1"
                    title={`Abrir perfil de ${company.name}`}
                  >
                    <img
                      src={company.logo}
                      alt={company.name}
                      className="w-10 h-10 rounded-full object-cover border border-neutral-700/80 group-hover:border-neutral-400 transition-colors shrink-0"
                    />
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
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Direto */}
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs active:scale-95 transition-all shrink-0 cursor-pointer"
                    title={`Conversar com ${company.name} no WhatsApp`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </a>
                </div>

                {/* As 3 últimas publicações enquadradas (Clicar na foto abre a publicação) */}
                {latestPosts.length > 0 ? (
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-0.5">
                    {latestPosts.map((post) => (
                      <div
                        key={post.id}
                        onClick={() => onOpenPost(post)}
                        className="aspect-square rounded-lg overflow-hidden bg-neutral-950 border border-neutral-800/80 hover:border-neutral-500 cursor-pointer transition-all group"
                        title={post.caption}
                      >
                        <img
                          src={post.imageUrl}
                          alt={post.caption}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-2 text-center text-[11px] text-neutral-500 italic border-t border-neutral-800/40">
                    Nenhuma foto publicada ainda
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
