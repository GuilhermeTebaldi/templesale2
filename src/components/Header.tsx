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

  return (
    <>
      {/* TOP HEADER (Desktop & Mobile) */}
      <header
        id="main-header"
        className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800"
      >
        <div className="relative max-w-6xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-end gap-2 sm:gap-4">
          <div className="absolute inset-y-0 left-3 right-32 flex items-center justify-center sm:static sm:mr-auto sm:w-auto sm:justify-start">
            <button
              id="brand-text-btn"
              onClick={() => {
                setActiveTab('feed');
                onSearchChange('');
              }}
              className="text-[22px] font-semibold tracking-[0.03em] text-white transition-opacity active:opacity-70 sm:text-[24px] sm:hover:opacity-85"
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

            {onOpenFavorites && (
              <button
                id="btn-header-likes"
                onClick={onOpenFavorites}
                className="p-2 text-neutral-300 hover:text-red-300 rounded-xl hover:bg-neutral-800/80 transition-all active:scale-95 cursor-pointer"
                title="Curtidas"
              >
                <TempleSaleLikeIcon liked={false} className="w-5 h-5" />
              </button>
            )}

            {/* + PUBLICAR Button (Desktop) */}
            <button
              id="btn-header-publish"
              onClick={onOpenCreatePost}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-neutral-100 hover:bg-white text-neutral-950 text-xs font-bold rounded-xl transition-all shadow-sm active:scale-98 cursor-pointer"
              title="+ PUBLICAR foto da empresa"
            >
              <Plus className="w-4 h-4" />
              <span>+ PUBLICAR</span>
            </button>

            {/* SINO DE NOTIFICAÇÕES (Desktop) */}
            <div className="relative">
              <button
                id="btn-bell-notifications"
                onClick={onToggleNotifications}
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
        id="mobile-bottom-nav"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-neutral-900/95 backdrop-blur-md border-t border-neutral-800 px-2 py-1 flex items-center justify-around"
      >
        {/* Feed Tab */}
        <button
          onClick={() => setActiveTab('feed')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors ${
            activeTab === 'feed' ? 'text-white' : 'text-neutral-400'
          }`}
        >
          <Home className="w-4.5 h-4.5" />
          <span className="text-[10px] font-medium mt-0.5">Feed</span>
        </button>

        {/* Search Tab */}
        <button
          onClick={() => setActiveTab('search')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors ${
            activeTab === 'search' ? 'text-white' : 'text-neutral-400'
          }`}
        >
          <Search className="w-4.5 h-4.5" />
          <span className="text-[10px] font-medium mt-0.5">Buscar</span>
        </button>

        {/* + Publicar Central Highlight Button */}
        <button
          onClick={onOpenCreatePost}
          className="flex flex-col items-center justify-center -mt-3.5 group cursor-pointer"
          title="+ Publicar Foto"
        >
          <div className="w-11 h-11 rounded-full bg-neutral-100 text-neutral-950 flex items-center justify-center shadow-lg border-2 border-neutral-900 group-active:scale-95 transition-transform">
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-[9px] font-bold text-neutral-300 mt-0.5">Publicar</span>
        </button>

        {/* Mapa Tab */}
        <button
          id="mobile-tab-btn-map"
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
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
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors ${
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
