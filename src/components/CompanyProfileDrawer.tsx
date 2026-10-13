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
} from 'lucide-react';
import { Company, Post, Auth0User } from '../types';
import { TempleSaleAvatarFrame } from './TempleSaleAvatarFrame';
import { ProgressiveProductImage } from './ProductCard';
import BrowserTranslationHelp from './BrowserTranslationHelp';

interface CompanyProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company;
  user: Auth0User;
  savedPosts: Post[];
  onOpenPost: (post: Post) => void;
  onToggleSavePost: (postId: string) => void;
  onOpenEditCompany: () => void;
  onOpenFavorites?: () => void;
  onLogout?: () => void;
  onOpenTerms?: () => void;
  onCloseAccount?: (mode: "deactivate" | "delete", confirmation: string) => Promise<void>;
  onViewPublicProfile: (companyId: string) => void;
}

export const CompanyProfileDrawer: React.FC<CompanyProfileDrawerProps> = ({
  isOpen,
  onClose,
  company,
  user,
  savedPosts,
  onOpenPost,
  onToggleSavePost,
  onOpenEditCompany,
  onOpenFavorites,
  onLogout,
  onOpenTerms,
  onCloseAccount,
  onViewPublicProfile,
}) => {
  const [currentView, setCurrentView] = useState<'main' | 'saved' | 'language' | 'account'>('main');

  const [accountMode, setAccountMode] = useState<'deactivate' | 'delete'>('deactivate');
  const [accountEmail, setAccountEmail] = useState('');
  const [accountBusy, setAccountBusy] = useState(false);
  const [accountError, setAccountError] = useState('');
  const accountText = (_pt: string, it: string) => it;
  const closeAccount = async () => {
    if (!onCloseAccount || accountBusy || accountEmail !== user.email) return;
    const message = accountMode === 'delete'
      ? accountText('Excluir definitivamente os dados da conta no TempleSale? Um novo cadastro começará vazio. Esta ação não pode ser desfeita.', 'Eliminare definitivamente i dati dell’account su TempleSale? Una nuova registrazione partirà vuota. L’operazione non è reversibile.')
      : accountText('Desativar e ocultar sua empresa, preservando os dados para recuperação?', 'Disattivare e nascondere l’attività conservando i dati per il recupero?');
    if (!window.confirm(message)) return;
    setAccountBusy(true); setAccountError('');
    try { await onCloseAccount(accountMode, accountEmail); }
    catch (error) { setAccountError(error instanceof Error ? error.message : accountText('Não foi possível encerrar a conta.', 'Impossibile chiudere l’account.')); }
    finally { setAccountBusy(false); }
  };

  // Reset to main view whenever drawer is closed/opened
  useEffect(() => {
    if (isOpen) {
      setCurrentView('main'); setAccountEmail(''); setAccountError(''); setAccountMode('deactivate');
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

  const userProfileImage = user.picture || '/templesale-logo.svg';
  const userDisplayName = user.name || company.name;

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
                title="Indietro"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <Building2 className="w-5 h-5 text-neutral-400 shrink-0" />
            )}
            <h2 className="font-bold text-base text-neutral-100 truncate">
              {currentView === 'main' && "Menu dell’attività"}
              {currentView === 'saved' && `Pubblicazioni salvate (${savedPosts.length})`}
              {currentView === 'language' && 'Traduci questa pagina'}
              {currentView === 'account' && accountText('Encerrar conta', 'Chiudi account')}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Chiudi menu"
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
                    src={userProfileImage}
                    alt={userDisplayName}
                    size="md"
                    className="shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1.5 truncate">
                      <h3 className="font-bold text-base text-neutral-100 truncate">{userDisplayName}</h3>
                      <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                    </div>
                    <p className="text-xs text-neutral-400 truncate">{company.name}</p>
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
                  <span>Vedi il profilo pubblico nel feed</span>
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
                </button>
              </div>

              {/* ACTION MENU ITEMS */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 px-1">
                  Gestione e preferenze
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
                          Modifica profilo
                        </div>
                        <div className="text-xs text-neutral-400 truncate">
                          Nome, WhatsApp, indirizzo, attività, foto e orari
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-neutral-300 shrink-0" />
                  </button>

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
                            Preferiti
                          </div>
                          <div className="text-xs text-neutral-400 truncate">
                            Prodotti e pubblicazioni salvati
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
                          <span>Salvati e preferiti</span>
                          {savedPosts.length > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300">
                              {savedPosts.length}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-neutral-400 truncate">
                          Foto e pubblicazioni salvate da rivedere
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-neutral-300 shrink-0" />
                  </button>

                  {onOpenTerms && <button type="button" onClick={onOpenTerms}
                    className="flex w-full items-center justify-between p-3.5 text-left hover:bg-neutral-800/50">
                    <div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-emerald-300" />
                      <span className="text-sm font-semibold">Condizioni e ricevuta</span>
                    </div><ChevronRight className="h-4 w-4 text-neutral-500" />
                  </button>}
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
                          <span>Traduci questa pagina</span>

                        </div>
                        <div className="text-xs text-neutral-400 truncate">
                          Usa la traduzione del browser
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
                  Account e sicurezza
                </span>
                <div className="bg-neutral-950/60 border border-neutral-800/70 rounded-2xl p-3.5 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 min-w-0">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-xs font-semibold text-neutral-200 truncate">
                        Autenticato tramite Auth0
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-emerald-300">
                      Verificato
                    </span>
                  </div>
                  <div className="text-xs text-neutral-400 truncate pl-6">
                    {user.email || 'guilhermemessi77@gmail.com'}
                  </div>
                </div>
              </div>

              {onCloseAccount && <button type="button" onClick={() => setCurrentView('account')}
                className="w-full rounded-2xl border border-neutral-700 px-4 py-3 text-sm text-neutral-300">
                {accountText('Desativar ou excluir conta', 'Disattiva o elimina account')}
              </button>}
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
                    <span>Esci dall’account</span>
                  </button>
                )}
                <div className="flex items-center justify-center space-x-1.5 font-medium text-neutral-400">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>
                    <span translate="no" className="notranslate text-amber-400 font-medium">Temple</span>
                    <span translate="no" className="notranslate text-emerald-400 font-semibold ml-0.5">Sale</span>
                    <span className="text-neutral-400"> • Vetrina diretta</span>
                  </span>
                </div>
                <p>Senza prezzo • Senza carrello • Contatto diretto tramite WhatsApp</p>
              </div>
            </div>
          )}

          {currentView === 'account' && <div className="space-y-4 p-5">
            <h3 className="text-lg font-semibold">{accountText('O que deseja fazer?', 'Cosa vuoi fare?')}</h3>
            {(['deactivate', 'delete'] as const).map(mode => <button key={mode} type="button" disabled={accountBusy}
              onClick={() => { setAccountMode(mode); setAccountError(''); }} aria-pressed={accountMode === mode}
              className={`w-full rounded-2xl border p-4 text-left ${accountMode === mode ? 'border-emerald-400 bg-emerald-400/5' : 'border-neutral-700'}`}>
              <strong className="block text-sm">{mode === 'deactivate' ? accountText('Desativar e preservar', 'Disattiva e conserva') : accountText('Excluir definitivamente do TempleSale', 'Elimina definitivamente da TempleSale')}</strong>
              <span className="mt-2 block text-xs leading-6 text-neutral-400">{mode === 'deactivate'
                ? accountText('Sua empresa fica oculta. Cadastro, fotos, publicações e comprovantes permanecem. Entre novamente com a mesma conta de acesso e e-mail confirmado para recuperar tudo.', 'La tua attività viene nascosta. Dati, foto, pubblicazioni e ricevute rimangono. Accedi nuovamente con lo stesso account ed email verificata per recuperare tutto.')
                : accountText('Remove cadastro, publicações, fotos cadastradas e comprovantes do banco do TempleSale. Voltar com o mesmo e-mail cria um cadastro vazio. A identidade de acesso, arquivos externos e backups têm procedimentos de limpeza separados; solicitações pelo contato dos termos.', 'Rimuove dati dell’account, pubblicazioni, foto registrate e ricevute dal database TempleSale. Tornando con la stessa email si crea un account vuoto. Identità di accesso, file esterni e backup seguono procedure di pulizia separate; richieste al contatto delle condizioni.')}</span>
            </button>)}
            <label className="block text-sm">{accountText('Digite o e-mail da sua conta para confirmar', 'Digita l’email del tuo account per confermare')}
              <input type="email" autoComplete="off" disabled={accountBusy} value={accountEmail} onChange={event => setAccountEmail(event.target.value)}
                className="mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 p-3" />
            </label>
            {accountError && <p role="alert" className="text-sm text-red-300">{accountError}</p>}
            <button type="button" disabled={accountBusy || accountEmail !== user.email} onClick={() => void closeAccount()}
              className="w-full rounded-xl bg-red-500/15 p-3 font-semibold text-red-300 disabled:opacity-40">
              {accountBusy ? accountText('Processando…', 'Elaborazione…') : accountMode === 'delete' ? accountText("Elimina definitivamente", 'Elimina definitivamente') : accountText("Disattiva attività", 'Disattiva attività')}
            </button>
          </div>}

          {/* VIEW: SALVOS / PREFERIDOS */}
          {currentView === 'saved' && (
            <div className="p-4 sm:p-5 space-y-4">
              {savedPosts.length === 0 ? (
                <div className="py-16 text-center space-y-3 px-4">
                  <div className="w-14 h-14 rounded-full bg-neutral-800/80 flex items-center justify-center mx-auto text-neutral-500">
                    <Bookmark className="w-7 h-7 stroke-[1.5]" />
                  </div>
                  <h4 className="text-sm font-bold text-neutral-200">
                    Nessuna pubblicazione salvata
                  </h4>
                  <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
                    Esplora il feed delle attività e tocca il segnalibro delle foto per salvarle qui.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
                    <span>{savedPosts.length} {savedPosts.length === 1 ? "foto salvata" : "foto salvate"}</span>
                    <span className="text-[11px] text-neutral-500">Tocca per aprire</span>
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
                        <ProgressiveProductImage
                          src={post.imageUrl}
                          alt={post.caption}
                          className="relative w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          variant="thumbnail"
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
          {currentView === 'language' && <BrowserTranslationHelp />}

        </div>
      </div>
    </div>
  );
};
