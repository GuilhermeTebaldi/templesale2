import React from 'react';
import MobileNavigation from './MobileNavigation';
import {
  Bell,
  Search,
  Plus,
  Home,
  Building2,
  MapPin,
  Menu,
  Bookmark,
} from 'lucide-react';
import { Company, ActiveTab, Auth0User } from '../types';
import {
  getNetworkLoadingSnapshot,
  subscribeNetworkLoading,
} from '../lib/networkActivity';
import { TempleSaleLikeIcon } from './TempleSaleLikeIcon';
import { ProgressiveProductImage } from './ProductCard';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  unreadNotificationsCount: number;
  onToggleNotifications: () => void;
  onOpenFavorites?: () => void;
  onOpenSaved?: () => void;
  onOpenCreatePost: () => void;
  onOpenCompanyModal: () => void;
  user: Auth0User;
  activeCompany: Company;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const CINEMA_BRAND_FONT = '"TempleSale Brand", serif';

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  unreadNotificationsCount,
  onToggleNotifications,
  onOpenFavorites,
  onOpenSaved,
  onOpenCreatePost,
  onOpenCompanyModal,
  user,
  activeCompany,
  searchQuery,
  onSearchChange,
}) => {
  const [hasBrandIntroStarted, setHasBrandIntroStarted] = React.useState(false);
  const [hasObservedGlobalLoading, setHasObservedGlobalLoading] = React.useState(false);
  const [canFallbackBrandIntroStart, setCanFallbackBrandIntroStart] = React.useState(false);
  const isGlobalLoadingVisible = React.useSyncExternalStore(
    subscribeNetworkLoading,
    getNetworkLoadingSnapshot,
    () => false,
  );
  const profileImage = user.picture || activeCompany.logo;
  const profileLabel = user.name || activeCompany.name;
  const hasRegisteredAccount = user.isAuthenticated;
  const desktopRailButtonClass = (isActive = false) =>
    `group relative flex h-11 w-11 items-center justify-center rounded-2xl transition-all active:scale-95 ${
      isActive
        ? 'bg-neutral-800 text-white'
        : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
    }`;

  React.useEffect(() => {
    if (isGlobalLoadingVisible) {
      setHasObservedGlobalLoading(true);
    }
  }, [isGlobalLoadingVisible]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const fallbackTimer = window.setTimeout(() => {
      setCanFallbackBrandIntroStart(true);
    }, 900);

    return () => window.clearTimeout(fallbackTimer);
  }, []);

  React.useEffect(() => {
    if (
      isGlobalLoadingVisible ||
      hasBrandIntroStarted ||
      (!hasObservedGlobalLoading && !canFallbackBrandIntroStart)
    ) {
      return;
    }

    const introTimer = window.setTimeout(() => {
      setHasBrandIntroStarted(true);
    }, 220);

    return () => window.clearTimeout(introTimer);
  }, [
    canFallbackBrandIntroStart,
    hasBrandIntroStarted,
    hasObservedGlobalLoading,
    isGlobalLoadingVisible,
  ]);



  return (
    <>
      {/* TOP HEADER (Desktop & Mobile) */}
      <header
        id="main-header"
        className="fixed inset-x-0 top-0 z-50 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800"
      >
        <div className="relative max-w-6xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-end gap-2 sm:justify-between sm:gap-4">
          <div className={`ts-header-brand absolute inset-y-0 left-3 ${!hasRegisteredAccount && onOpenSaved ? 'right-40' : 'right-32'} flex items-center justify-center sm:left-1/2 sm:right-auto sm:-translate-x-1/2`}>
            <button
              id="brand-text-btn"
              onClick={() => {
                setActiveTab('feed');
                onSearchChange('');
              }}
              className="text-[22px] font-semibold tracking-[0.03em] text-white transition-opacity active:opacity-70 sm:text-[25px] sm:hover:opacity-85"
              style={{ fontFamily: CINEMA_BRAND_FONT }}
              title="TempleSale - Home"
            >
              <span
                translate="no"
                className={
                  hasBrandIntroStarted
                    ? 'ts-brand-cinema-intro'
                    : 'ts-brand-cinema-pending'
                }
              >
                <span className="ts-brand-letter ts-brand-letter-t">T</span>
                <span className="ts-brand-rest ts-brand-rest-temple">emple</span>
                <span className="ts-brand-letter ts-brand-letter-s">S</span>
                <span className="ts-brand-rest ts-brand-rest-sale">ale</span>
              </span>
            </button>
          </div>

          {/* Desktop navigation lives in the left rail below. */}
          <div className="hidden items-center space-x-1 sm:space-x-2 shrink-0">
            {/* Feed Tab */}
            <button
              id="tab-btn-feed"
              onClick={() => setActiveTab('feed')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                activeTab === 'feed'
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
              title="Scopri le attività vicine"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>

            {/* Search Tab */}
            <button
              id="tab-btn-search"
              onClick={() => setActiveTab('search')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                activeTab === 'search'
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
              title="Cerca attività"
            >
              <Search className="w-4 h-4" />
              <span>Cerca</span>
            </button>

            {/* Mapa Tab (Desktop) */}
            <button
              id="tab-btn-map"
              onClick={() => setActiveTab('map')}
              hidden={hasRegisteredAccount}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                activeTab === 'map'
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
              title="Mappa delle attività"
            >
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>Mappa</span>
            </button>

            {/* Perfil da Minha Empresa Tab */}
            <button
              id="tab-btn-profile"
              onClick={() => setActiveTab('profile')}
              hidden={!hasRegisteredAccount}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
              title="Profilo dell’attività"
            >
              <Building2 className="w-4 h-4" />
              <span>La mia attività</span>
            </button>

            {!hasRegisteredAccount && onOpenSaved && <button type="button" id="btn-desktop-saved" onClick={onOpenSaved}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-800/50"
              title="Salvati" aria-label="Pubblicazioni salvate"><Bookmark className="h-4 w-4" /><span>Salvati</span></button>}
            <div className="h-6 w-px bg-neutral-800 mx-1" />

            {/* + PUBLICAR Button (Desktop) */}
            {hasRegisteredAccount && (
              <button
                id="btn-header-publish"
                onClick={onOpenCreatePost}
                className="-my-2 flex items-center space-x-2 rounded-2xl bg-neutral-100 px-5 py-3.5 text-sm font-black uppercase tracking-[0.14em] text-neutral-950 shadow-xl shadow-black/25 transition-all hover:-translate-y-0.5 hover:bg-white active:scale-98 cursor-pointer"
                title="+ PUBBLICA foto dell’attività"
              >
                <Plus className="w-5 h-5" />
                <span>Pubblica</span>
              </button>
            )}

            {/* SINO DE NOTIFICAÇÕES (Desktop) */}
            <div className="relative">
              <button
                id="btn-bell-notifications"
                onClick={onToggleNotifications}
                hidden={!hasRegisteredAccount}
                className="relative p-2 text-neutral-300 hover:text-white rounded-xl hover:bg-neutral-800/80 transition-all active:scale-95 cursor-pointer"
                title="Notifiche"
              >
                <Bell className="w-5 h-5 transition-transform group-hover:scale-105" />
                {unreadNotificationsCount > 0 && (
                  <span
                    id="bell-unread-badge"
                    className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] px-1 bg-amber-400 text-neutral-950 font-bold text-[9px] rounded-full flex items-center justify-center ring-2 ring-neutral-900 shadow-sm"
                  >
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
            </div>

            {/* Auth0 Profile Button (Desktop) */}
            <button
              id="btn-user-company-menu"
              onClick={onOpenCompanyModal}
              className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-neutral-800 transition-colors cursor-pointer"
              title={hasRegisteredAccount ? "Gestisci i dati dell’attività" : "Accedi o registrati"}
            >
              {hasRegisteredAccount ? (
                <div className="relative h-7 w-7 overflow-hidden rounded-full border border-neutral-700">
                  <ProgressiveProductImage
                    src={profileImage}
                    alt={profileLabel}
                    className="relative h-full w-full rounded-full object-cover"
                    loading="eager"
                    fetchPriority="high"
                    variant="thumbnail"
                  />
                </div>
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-700 bg-neutral-800 text-neutral-200">
                  <Menu className="h-4.5 w-4.5" />
                </div>
              )}
            </button>
          </div>

          {/* Mobile Right Controls: Sino no topo ao lado do Perfil/Avatar da Empresa */}
          <div className="flex sm:hidden items-center space-x-1.5">
            {hasRegisteredAccount && (
              <button
                id="btn-mobile-search-top"
                onClick={() => setActiveTab('search')}
                className={`relative p-2 rounded-full transition-colors cursor-pointer ${
                  activeTab === 'search'
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-300 active:text-white hover:bg-neutral-800/80'
                }`}
                title="Cerca attività"
              >
                <Search className="w-5 h-5" />
              </button>
            )}

            {/* Sino no Topo (Mobile) */}
            <button
              id="btn-mobile-bell"
              onClick={onToggleNotifications}
              className="relative p-2 text-neutral-300 active:text-white rounded-full hover:bg-neutral-800/80 transition-colors cursor-pointer"
              title="Notifiche"
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] px-0.5 bg-amber-400 text-neutral-950 font-bold text-[8px] rounded-full flex items-center justify-center ring-2 ring-neutral-900" />
              )}
            </button>

            {onOpenFavorites && (
              <button
                id="btn-mobile-likes"
                onClick={onOpenFavorites}
                hidden={hasRegisteredAccount}
                className="relative p-2 text-neutral-300 active:text-red-300 rounded-full hover:bg-neutral-800/80 transition-colors cursor-pointer"
                title="Preferiti"
              >
                <TempleSaleLikeIcon liked={false} className="w-5 h-5" />
              </button>
            )}

            {/* Avatar no Mobile */}
            {!hasRegisteredAccount && onOpenSaved && <button type="button" id="btn-mobile-saved" onClick={onOpenSaved}
              className="p-2 text-neutral-300 rounded-full hover:bg-neutral-800/80" title="Salvati" aria-label="Pubblicazioni salvate">
              <Bookmark className="h-5 w-5" />
            </button>}
            <button
              id="btn-mobile-avatar"
              onClick={onOpenCompanyModal}
              className="p-0.5 rounded-full hover:ring-2 hover:ring-neutral-700 active:scale-95 transition-all cursor-pointer"
              title={hasRegisteredAccount ? "Menu dell’attività" : "Accedi o registrati"}
            >
              {hasRegisteredAccount ? (
                <div className="relative h-7 w-7 overflow-hidden rounded-full border border-neutral-700/80 shadow-xs">
                  <ProgressiveProductImage
                    src={profileImage}
                    alt={profileLabel}
                    className="relative h-full w-full rounded-full object-cover"
                    loading="eager"
                    fetchPriority="high"
                    variant="thumbnail"
                  />
                </div>
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-700/80 bg-neutral-800 text-neutral-200 shadow-xs">
                  <Menu className="h-4.5 w-4.5" />
                </div>
              )}
            </button>
          </div>
        </div>
      </header>
      <div aria-hidden="true" className="ts-header-spacer h-14 shrink-0 sm:h-16" />

      {/* DESKTOP LEFT RAIL */}
      <aside
        id="desktop-left-nav"
        className="fixed bottom-0 left-0 top-16 z-40 hidden w-[72px] flex-col items-center justify-between border-r border-neutral-900 bg-white/95 px-2 py-4 backdrop-blur-md sm:flex"
      >
        <div className="flex flex-col items-center gap-2">
          <button
            id="desktop-rail-feed"
            onClick={() => setActiveTab('feed')}
            className={desktopRailButtonClass(activeTab === 'feed')}
            title="Home"
            aria-label="Home"
          >
            <Home className="h-6 w-6" /><span className="ts-desktop-nav-label" aria-hidden="true">Home</span>
          </button>

          <button
            id="desktop-rail-search"
            onClick={() => setActiveTab('search')}
            className={desktopRailButtonClass(activeTab === 'search')}
            title="Cerca"
            aria-label="Cerca"
          >
            <Search className="h-6 w-6" /><span className="ts-desktop-nav-label" aria-hidden="true">Cerca</span>
          </button>

          <button
            id="desktop-rail-map"
            onClick={() => setActiveTab('map')}
            data-desktop-extra={hasRegisteredAccount || undefined}
            className={desktopRailButtonClass(activeTab === 'map')}
            title="Mappa"
            aria-label="Mappa"
          >
            <MapPin className="h-6 w-6" /><span className="ts-desktop-nav-label" aria-hidden="true">Mappa</span>
          </button>

          {onOpenFavorites && (
            <button
              id="desktop-rail-favorites"
              onClick={onOpenFavorites}
              data-desktop-extra={hasRegisteredAccount || undefined}
              className={desktopRailButtonClass(false)}
              title="Preferiti"
              aria-label="Preferiti"
            >
              <TempleSaleLikeIcon liked={false} className="h-6 w-6" /><span className="ts-desktop-nav-label" aria-hidden="true">Preferiti</span>
            </button>
          )}

          {onOpenSaved && <button data-desktop-extra={hasRegisteredAccount || undefined} type="button" id="desktop-rail-saved" onClick={onOpenSaved}
            className={desktopRailButtonClass(false)} title="Salvati" aria-label="Pubblicazioni salvate">
            <Bookmark className="h-6 w-6" /><span className="ts-desktop-nav-label" aria-hidden="true">Salvati</span>
          </button>}
          <button
            id="desktop-rail-profile"
            onClick={() => setActiveTab('profile')}
            hidden={!hasRegisteredAccount}
            className={desktopRailButtonClass(activeTab === 'profile')}
            title="Attività"
            aria-label="Attività"
          >
            <Building2 className="h-6 w-6" /><span className="ts-desktop-nav-label" aria-hidden="true">La mia attività</span>
          </button>

          <button
            id="desktop-rail-publish"
            onClick={onOpenCreatePost}
            hidden={!hasRegisteredAccount}
            className="group relative mt-1 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-950 shadow-lg shadow-black/30 transition-all hover:bg-white active:scale-95"
            title="Pubblica"
            aria-label="Pubblica"
          >
            <Plus className="h-7 w-7 stroke-[2.8]" /><span className="ts-desktop-nav-label" aria-hidden="true">Pubblica</span>
          </button>

          <button
            id="desktop-rail-notifications"
            onClick={onToggleNotifications}
            hidden={!hasRegisteredAccount}
            className={desktopRailButtonClass(false)}
            title="Notifiche"
            aria-label="Notifiche"
          >
            <Bell className="h-6 w-6" /><span className="ts-desktop-nav-label" aria-hidden="true">Notifiche</span>
            {unreadNotificationsCount > 0 && (
              <span
                id="desktop-rail-unread-badge"
                className="absolute right-1.5 top-1.5 min-w-[16px] rounded-full bg-amber-400 px-1 text-center text-[9px] font-bold leading-4 text-neutral-950 ring-2 ring-black"
              >
                {unreadNotificationsCount}
              </span>
            )}
          </button>
        </div>

        <button
          id="desktop-rail-user-menu"
          onClick={onOpenCompanyModal}
          className="flex h-11 w-11 items-center justify-center rounded-2xl text-neutral-300 transition-all hover:bg-neutral-900 hover:text-white active:scale-95"
          title={hasRegisteredAccount ? "Gestisci i dati dell’attività" : "Accedi o registrati"}
          aria-label={hasRegisteredAccount ? "Gestisci i dati dell’attività" : "Accedi o registrati"}
        >
          {hasRegisteredAccount ? (
            <div className="relative h-7 w-7 overflow-hidden rounded-full border border-neutral-700">
              <ProgressiveProductImage
                src={profileImage}
                alt={profileLabel}
                className="relative h-full w-full rounded-full object-cover"
                loading="eager"
                fetchPriority="high"
                variant="thumbnail"
              />
            </div>
          ) : (
            <Menu className="h-6 w-6" />
          )}
          <span className="ts-desktop-nav-label ts-desktop-account" aria-hidden="true"><strong>{hasRegisteredAccount ? profileLabel : "Accedi"}</strong><small>{hasRegisteredAccount ? "Gestisci attività" : "La tua attività su TempleSale"}</small></span>
        </button>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <MobileNavigation activeTab={activeTab} setActiveTab={setActiveTab}
        onOpenCreatePost={onOpenCreatePost} hasRegisteredAccount={hasRegisteredAccount} />
    </>
  );
};
