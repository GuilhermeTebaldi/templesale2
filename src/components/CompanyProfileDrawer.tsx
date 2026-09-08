import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Bookmark,
  Globe,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  Check,
  ExternalLink,
  Edit3,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  Heart,
  LogOut,
  Package,
} from 'lucide-react';
import { Company, Post, Auth0User } from '../types';
import { TempleSaleAvatarFrame } from './TempleSaleAvatarFrame';

export type SupportedLanguage = 'pt-BR' | 'it-IT' | 'en-US';

interface CompanyProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company;
  user: Auth0User;
  savedPosts: Post[];
  onOpenPost: (post: Post) => void;
  onToggleSavePost: (postId: string) => void;
  onOpenEditCompany: () => void;
  onOpenListings?: () => void;
  onOpenFavorites?: () => void;
  onLogout?: () => void;
  onViewPublicProfile: (companyId: string) => void;
  currentLanguage: SupportedLanguage;
  onChangeLanguage: (lang: SupportedLanguage) => void;
}

const LANGUAGE_OPTIONS: { id: SupportedLanguage; name: string; flag: string; region: string }[] = [
  { id: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷', region: 'Padrão' },
  { id: 'it-IT', name: 'Italiano', flag: '🇮🇹', region: 'Ardea, Roma' },
  { id: 'en-US', name: 'English', flag: '🇺🇸', region: 'International' },
];

export const CompanyProfileDrawer: React.FC<CompanyProfileDrawerProps> = ({
  isOpen,
  onClose,
  company,
  user,
  savedPosts,
  onOpenPost,
  onToggleSavePost,
  onOpenEditCompany,
  onOpenListings,
  onOpenFavorites,
  onLogout,
  onViewPublicProfile,
  currentLanguage,
  onChangeLanguage,
}) => {
  const [currentView, setCurrentView] = useState<'main' | 'saved' | 'language'>('main');

  // Reset to main view whenever drawer is closed/opened
  useEffect(() => {
    if (isOpen) {
      setCurrentView('main');
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (currentView !== 'main') {
          setCurrentView('main');
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentView, onClose]);

  if (!isOpen) return null;

  const currentLangLabel = LANGUAGE_OPTIONS.find((l) => l.id === currentLanguage)?.flag || '🇧🇷';

  return (
    <div id="company-profile-drawer-backdrop" className="fixed inset-0 z-50 overflow-hidden">
      {/* Dark overlay backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel (Right to Left) */}
      <div className="fixed inset-y-0 right-0 max-w-sm sm:max-w-md w-full bg-neutral-900 border-l border-neutral-800 shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-300 ease-out">
        {/* TOP BAR */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800/80 bg-neutral-900/90 shrink-0">
          <div className="flex items-center space-x-2 min-w-0">
            {currentView !== 'main' ? (
              <button
                type="button"
                onClick={() => setCurrentView('main')}
                className="p-1 -ml-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Voltar"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <Building2 className="w-5 h-5 text-neutral-400 shrink-0" />
            )}
            <h2 className="font-bold text-base text-neutral-100 truncate">
              {currentView === 'main' && 'Menu da Empresa'}
              {currentView === 'saved' && `Publicações Salvas (${savedPosts.length})`}
              {currentView === 'language' && 'Idioma / Lingua'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* DRAWER CONTENT */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* VIEW: MAIN MENU */}
          {currentView === 'main' && (
            <div className="p-5 space-y-6">
              {/* COMPANY IDENTITY CARD */}
              <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-2xl p-4.5 space-y-3.5 shadow-sm">
                <div className="flex items-center space-x-3.5">
                  <TempleSaleAvatarFrame
                    src={company.logo}
                    alt={company.name}
                    size="md"
                    className="shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1.5 truncate">
                      <h3 className="font-bold text-base text-neutral-100 truncate">{company.name}</h3>
                      <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                    </div>
                    <p className="text-xs text-neutral-400 truncate">{company.category} • {company.city}</p>
                    <p className="text-[11px] text-emerald-400 font-medium truncate mt-0.5">
                      WhatsApp: {company.whatsapp}
                    </p>
                  </div>
                </div>

                {/* Button to view public profile in app */}
                <button
                  type="button"
                  onClick={() => {
                    onViewPublicProfile(company.id);
                    onClose();
                  }}
                  className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-neutral-800/80 hover:bg-neutral-700/90 text-neutral-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  <span>Ver perfil público no feed</span>
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
                </button>
              </div>

              {/* ACTION MENU ITEMS */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 px-1">
                  Gerenciamento & Preferências
                </span>

                <div className="bg-neutral-950/60 border border-neutral-800/70 rounded-2xl overflow-hidden divide-y divide-neutral-800/60 shadow-sm">
                  {/* Item: Editar Perfil */}
                  <button
                    type="button"
                    onClick={() => {
                      onOpenEditCompany();
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-3.5 hover:bg-neutral-800/50 transition-colors text-left group cursor-pointer"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-neutral-800 flex items-center justify-center text-neutral-300 group-hover:text-white shrink-0">
                        <Edit3 className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-neutral-200 group-hover:text-white">
                          Editar perfil do usuário
                        </div>
                        <div className="text-xs text-neutral-400 truncate">
                          Nome, WhatsApp, endereço, empresa, fotos e horários
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-neutral-300 shrink-0" />
                  </button>

                  {onOpenListings && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenListings();
                        onClose();
                      }}
                      className="w-full flex items-center justify-between p-3.5 hover:bg-neutral-800/50 transition-colors text-left group cursor-pointer"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-emerald-400/10 flex items-center justify-center text-emerald-400 shrink-0">
                          <Package className="w-4.5 h-4.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-neutral-200 group-hover:text-white">
                            Minhas publicações
                          </div>
                          <div className="text-xs text-neutral-400 truncate">
                            Gerenciar, editar e apagar seus anúncios
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-neutral-300 shrink-0" />
                    </button>
                  )}

                  {onOpenFavorites && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenFavorites();
                        onClose();
                      }}
                      className="w-full flex items-center justify-between p-3.5 hover:bg-neutral-800/50 transition-colors text-left group cursor-pointer"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-red-400/10 flex items-center justify-center text-red-300 shrink-0">
                          <Heart className="w-4.5 h-4.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-neutral-200 group-hover:text-white">
                            Favoritos
                          </div>
                          <div className="text-xs text-neutral-400 truncate">
                            Produtos e publicações salvas
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-neutral-300 shrink-0" />
                    </button>
                  )}

                  {/* Item: Salvos / Preferidos */}
                  <button
                    type="button"
                    onClick={() => setCurrentView('saved')}
                    className="w-full flex items-center justify-between p-3.5 hover:bg-neutral-800/50 transition-colors text-left group cursor-pointer"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-amber-400/10 flex items-center justify-center text-amber-400 shrink-0">
                        <Bookmark className="w-4.5 h-4.5 fill-amber-400/30" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-neutral-200 group-hover:text-white flex items-center space-x-2">
                          <span>Salvos & Preferidos</span>
                          {savedPosts.length > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300">
                              {savedPosts.length}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-neutral-400 truncate">
                          Fotos e publicações marcadas para rever
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-neutral-300 shrink-0" />
                  </button>

                  {/* Item: Idioma */}
                  <button
                    type="button"
                    onClick={() => setCurrentView('language')}
                    className="w-full flex items-center justify-between p-3.5 hover:bg-neutral-800/50 transition-colors text-left group cursor-pointer"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-sky-400/10 flex items-center justify-center text-sky-400 shrink-0">
                        <Globe className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-neutral-200 group-hover:text-white flex items-center space-x-2">
                          <span>Idioma do Aplicativo</span>
                          <span className="text-xs text-neutral-300 font-normal">{currentLangLabel}</span>
                        </div>
                        <div className="text-xs text-neutral-400 truncate">
                          Português, Italiano ou English
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-neutral-300 shrink-0" />
                  </button>
                </div>
              </div>

              {/* AUTH0 & SEGURANÇA */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 px-1">
                  Conta & Segurança
                </span>
                <div className="bg-neutral-950/60 border border-neutral-800/70 rounded-2xl p-3.5 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 min-w-0">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-xs font-semibold text-neutral-200 truncate">
                        Autenticado via Auth0
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-emerald-300">
                      Verificado
                    </span>
                  </div>
                  <div className="text-xs text-neutral-400 truncate pl-6">
                    {user.email || 'guilhermemessi77@gmail.com'}
                  </div>
                </div>
              </div>

              {/* RODAPÉ DO DRAWER */}
              <div className="pt-2 text-center text-[11px] text-neutral-400 space-y-1">
                {onLogout && (
                  <button
                    type="button"
                    onClick={() => {
                      onLogout();
                      onClose();
                    }}
                    className="mb-4 w-full flex items-center justify-center space-x-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-300 transition-colors hover:bg-red-500/15 hover:text-red-200"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sair da conta</span>
                  </button>
                )}
                <div className="flex items-center justify-center space-x-1.5 font-medium text-neutral-400">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>
                    <span className="text-amber-400 font-medium">Temple</span>
                    <span className="text-emerald-400 font-semibold ml-0.5">Sale</span>
                    <span className="text-neutral-400"> • Vitrine Direta</span>
                  </span>
                </div>
                <p>Sem preço • Sem carrinho • Conexão direta via WhatsApp</p>
              </div>
            </div>
          )}

          {/* VIEW: SALVOS / PREFERIDOS */}
          {currentView === 'saved' && (
            <div className="p-4 sm:p-5 space-y-4">
              {savedPosts.length === 0 ? (
                <div className="py-16 text-center space-y-3 px-4">
                  <div className="w-14 h-14 rounded-full bg-neutral-800/80 flex items-center justify-center mx-auto text-neutral-500">
                    <Bookmark className="w-7 h-7 stroke-[1.5]" />
                  </div>
                  <h4 className="text-sm font-bold text-neutral-200">
                    Nenhuma publicação salva ainda
                  </h4>
                  <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
                    Navegue pelo feed de empresas e toque no ícone de marcador 🔖 nas fotos que você gostar para guardá-las aqui.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
                    <span>{savedPosts.length} {savedPosts.length === 1 ? 'foto salva' : 'fotos salvas'}</span>
                    <span className="text-[11px] text-neutral-500">Toque para abrir</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {savedPosts.map((post) => (
                      <div
                        key={post.id}
                        onClick={() => {
                          onOpenPost(post);
                          onClose();
                        }}
                        className="group relative aspect-square rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800/80 hover:border-neutral-500 transition-all cursor-pointer shadow-sm"
                        title={post.caption}
                      >
                        <img
                          src={post.imageUrl}
                          alt={post.caption}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* Overlay on hover */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1">
                          <span className="text-[10px] text-white font-medium line-clamp-2 text-center">
                            {post.caption}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* VIEW: IDIOMA */}
          {currentView === 'language' && (
            <div className="p-4 sm:p-5 space-y-4">
              <p className="text-xs text-neutral-400 px-1">
                Escolha o idioma preferido para a sua navegação no TempleSale:
              </p>

              <div className="space-y-2">
                {LANGUAGE_OPTIONS.map((lang) => {
                  const isSelected = currentLanguage === lang.id;
                  return (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => {
                        onChangeLanguage(lang.id);
                      }}
                      className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left cursor-pointer ${
                        isSelected
                          ? 'bg-neutral-800/90 border-neutral-600 shadow-md text-white'
                          : 'bg-neutral-950/60 border-neutral-800/70 hover:bg-neutral-800/40 text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{lang.flag}</span>
                        <div>
                          <div className="text-sm font-semibold flex items-center space-x-2">
                            <span>{lang.name}</span>
                            {isSelected && (
                              <span className="text-[10px] bg-neutral-700 text-neutral-200 px-2 py-0.2 rounded-full">
                                Ativo
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-neutral-400">{lang.region}</div>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-neutral-950 flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
