import React from 'react';
import {
  Bell,
  Search,
  Plus,
  Home,
  Building2,
  MapPin,
  Menu,
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
  onOpenCreatePost: () => void;
  onOpenCompanyModal: () => void;
  user: Auth0User;
  activeCompany: Company;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const CINEMA_BRAND_FONT = '"Copperplate", "Copperplate Gothic Light", fantasy';

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  unreadNotificationsCount,
  onToggleNotifications,
  onOpenFavorites,
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
  const [mobileNavTop, setMobileNavTop] = React.useState<number | null>(null);
  const [isMobileKeyboardOpen, setIsMobileKeyboardOpen] = React.useState(false);
  const mobileNavRef = React.useRef<HTMLElement | null>(null);
  const isGlobalLoadingVisible = React.useSyncExternalStore(
    subscribeNetworkLoading,
    getNetworkLoadingSnapshot,
    () => false,
  );
  const profileImage = user.picture || activeCompany.logo;
  const profileLabel = user.name || activeCompany.name;
  const hasRegisteredAccount = user.isAuthenticated;

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

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    let frameId = 0;
    let settleIntervalId: number | undefined;

    const readMobileNavTop = () => {
      const viewport = window.visualViewport;
      const navHeight = mobileNavRef.current?.offsetHeight ?? 72;
      if (!viewport) {
        return window.innerHeight - navHeight;
      }

      return viewport.offsetTop + viewport.height - navHeight;
    };

    const updateMobileNavPosition = () => {
      const viewport = window.visualViewport;
      const activeElement = document.activeElement;
      const isTextInputFocused =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        Boolean(activeElement?.getAttribute('contenteditable'));
      const keyboardOpen = Boolean(
        viewport &&
          isTextInputFocused &&
          window.innerHeight - viewport.height > 150,
      );
      setIsMobileKeyboardOpen((current) => (current === keyboardOpen ? current : keyboardOpen));

      if (keyboardOpen) {
        return;
      }

      const nextTop = Math.max(0, Math.round(readMobileNavTop()));
      setMobileNavTop((currentTop) => (currentTop === nextTop ? currentTop : nextTop));
    };

    const scheduleMobileNavPosition = () => {
      if (frameId) {
        return;
      }
      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        updateMobileNavPosition();
      });
    };

    const startScrollSettling = () => {
      scheduleMobileNavPosition();
      if (settleIntervalId) {
        window.clearInterval(settleIntervalId);
      }

      let ticks = 0;
      settleIntervalId = window.setInterval(() => {
        ticks += 1;
        scheduleMobileNavPosition();
        if (ticks >= 12 && settleIntervalId) {
          window.clearInterval(settleIntervalId);
          settleIntervalId = undefined;
        }
      }, 80);
    };

    updateMobileNavPosition();
    window.visualViewport?.addEventListener('resize', startScrollSettling);
    window.visualViewport?.addEventListener('scroll', startScrollSettling);
    window.addEventListener('resize', startScrollSettling);
    window.addEventListener('orientationchange', startScrollSettling);
    window.addEventListener('scroll', startScrollSettling, { passive: true });
    window.addEventListener('focusin', startScrollSettling);
    window.addEventListener('focusout', startScrollSettling);

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      if (settleIntervalId) {
        window.clearInterval(settleIntervalId);
      }
      window.visualViewport?.removeEventListener('resize', startScrollSettling);
      window.visualViewport?.removeEventListener('scroll', startScrollSettling);
      window.removeEventListener('resize', startScrollSettling);
      window.removeEventListener('orientationchange', startScrollSettling);
      window.removeEventListener('scroll', startScrollSettling);
      window.removeEventListener('focusin', startScrollSettling);
      window.removeEventListener('focusout', startScrollSettling);
    };
  }, []);

  return (
    <>
      {/* TOP HEADER (Desktop & Mobile) */}
      <header
        id="main-header"
        className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800"
      >
        <div className="relative max-w-6xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-end gap-2 sm:justify-between sm:gap-4">
          <div className="absolute inset-y-0 left-3 right-32 flex items-center justify-center sm:left-1/2 sm:right-auto sm:-translate-x-1/2">
            <button
              id="brand-text-btn"
              onClick={() => {
                setActiveTab('feed');
                onSearchChange('');
              }}
              className="text-[22px] font-semibold tracking-[0.03em] text-white transition-opacity active:opacity-70 sm:text-[25px] sm:hover:opacity-85"
              style={{ fontFamily: CINEMA_BRAND_FONT }}
              title="TempleSale - Ir para o feed"
            >
              <span
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

          {/* Desktop Navigation Tabs */}
          <div className="hidden sm:flex items-center space-x-1 sm:space-x-2 shrink-0">
            {/* Feed Tab */}
            <button
              id="tab-btn-feed"
              onClick={() => setActiveTab('feed')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                activeTab === 'feed'
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
              title="Feed de Publicações de Empresas"
            >
              <Home className="w-4 h-4" />
              <span>Feed</span>
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
              title="Buscar Empresas"
            >
              <Search className="w-4 h-4" />
              <span>Buscar</span>
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
              title="Mapa de Empresas"
            >
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>Mapa</span>
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
              title="Perfil da Empresa"
            >
              <Building2 className="w-4 h-4" />
              <span>Minha Empresa</span>
            </button>

            <div className="h-6 w-px bg-neutral-800 mx-1" />

            {/* + PUBLICAR Button (Desktop) */}
            {hasRegisteredAccount && (
              <button
                id="btn-header-publish"
                onClick={onOpenCreatePost}
                className="-my-2 flex items-center space-x-2 rounded-2xl bg-neutral-100 px-5 py-3.5 text-sm font-black uppercase tracking-[0.14em] text-neutral-950 shadow-xl shadow-black/25 transition-all hover:-translate-y-0.5 hover:bg-white active:scale-98 cursor-pointer"
                title="+ PUBLICAR foto da empresa"
              >
                <Plus className="w-5 h-5" />
                <span>Publicar</span>
              </button>
            )}

            {/* SINO DE NOTIFICAÇÕES (Desktop) */}
            <div className="relative">
              <button
                id="btn-bell-notifications"
                onClick={onToggleNotifications}
                hidden={!hasRegisteredAccount}
                className="relative p-2 text-neutral-300 hover:text-white rounded-xl hover:bg-neutral-800/80 transition-all active:scale-95 cursor-pointer"
                title="Notificações"
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
              title={hasRegisteredAccount ? 'Gerenciar dados da empresa' : 'Entrar ou cadastrar'}
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
                title="Buscar Empresas"
              >
                <Search className="w-5 h-5" />
              </button>
            )}

            {/* Sino no Topo (Mobile) */}
            <button
              id="btn-mobile-bell"
              onClick={onToggleNotifications}
              className="relative p-2 text-neutral-300 active:text-white rounded-full hover:bg-neutral-800/80 transition-colors cursor-pointer"
              title="Notificações"
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
                title="Curtidas"
              >
                <TempleSaleLikeIcon liked={false} className="w-5 h-5" />
              </button>
            )}

            {/* Avatar no Mobile */}
            <button
              id="btn-mobile-avatar"
              onClick={onOpenCompanyModal}
              className="p-0.5 rounded-full hover:ring-2 hover:ring-neutral-700 active:scale-95 transition-all cursor-pointer"
              title={hasRegisteredAccount ? 'Menu da Empresa' : 'Entrar ou cadastrar'}
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

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav
        ref={mobileNavRef}
        id="mobile-bottom-nav"
        className={`sm:hidden fixed left-0 right-0 z-40 bg-neutral-900/95 backdrop-blur-md border-t border-neutral-800 px-2 flex items-center justify-around will-change-[top] ${
          hasRegisteredAccount ? 'pt-1 pb-2' : 'py-1'
        } ${isMobileKeyboardOpen ? 'pointer-events-none opacity-0' : 'opacity-100'} transition-opacity duration-150`}
        style={{
          bottom: mobileNavTop === null ? 0 : 'auto',
          top: mobileNavTop === null ? 'auto' : `${mobileNavTop}px`,
        }}
      >
        {/* Feed Tab */}
        <button
          onClick={() => setActiveTab('feed')}
          className={`flex h-12 min-w-16 flex-col items-center justify-end rounded-lg px-2.5 pb-1 transition-colors ${
            activeTab === 'feed' ? 'text-white' : 'text-neutral-400'
          }`}
        >
          <Home className="w-4.5 h-4.5" />
          <span className="text-[10px] font-medium mt-0.5">Feed</span>
        </button>

        {/* Search Tab */}
        <button
          onClick={() => setActiveTab('search')}
          hidden={hasRegisteredAccount}
          className={`flex h-12 min-w-16 flex-col items-center justify-end rounded-lg px-2.5 pb-1 transition-colors ${
            activeTab === 'search' ? 'text-white' : 'text-neutral-400'
          }`}
        >
          <Search className="w-4.5 h-4.5" />
          <span className="text-[10px] font-medium mt-0.5">Buscar</span>
        </button>

        {/* + Publicar Central Highlight Button */}
        {hasRegisteredAccount && (
          <button
            onClick={onOpenCreatePost}
            className="group flex h-12 min-w-16 flex-col items-center justify-end rounded-lg px-2.5 pb-1 cursor-pointer"
            title="+ Publicar Foto"
          >
            <div className="mb-0.5 flex h-14 w-14 -translate-y-3 items-center justify-center rounded-full border-4 border-neutral-900 bg-neutral-100 text-neutral-950 shadow-2xl transition-transform group-active:-translate-y-3 group-active:scale-95">
              <Plus className="w-6 h-6 stroke-[2.8]" />
            </div>
            <span className="-mt-3 text-[10px] font-bold leading-none text-neutral-100">Publicar</span>
          </button>
        )}

        {/* Mapa Tab */}
        <button
          id="mobile-tab-btn-map"
          onClick={() => setActiveTab('map')}
          hidden={hasRegisteredAccount}
          className={`flex h-12 min-w-16 flex-col items-center justify-end rounded-lg px-2.5 pb-1 transition-colors cursor-pointer ${
            activeTab === 'map' ? 'text-white' : 'text-neutral-400'
          }`}
          title="Mapa de Empresas"
        >
          <MapPin className="w-4.5 h-4.5" />
          <span className="text-[10px] font-medium mt-0.5">Mapa</span>
        </button>

        {/* Minha Empresa Tab */}
        <button
          onClick={() => setActiveTab('profile')}
          hidden={!hasRegisteredAccount}
          className={`flex h-12 min-w-16 flex-col items-center justify-end rounded-lg px-2.5 pb-1 transition-colors ${
            activeTab === 'profile' ? 'text-white' : 'text-neutral-400'
          }`}
        >
          <Building2 className="w-4.5 h-4.5" />
          <span className="text-[10px] font-medium mt-0.5">Empresa</span>
        </button>
      </nav>
    </>
  );
};
