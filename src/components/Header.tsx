import React from 'react';
import {
  Bell,
  Search,
  Plus,
  Home,
  Building2,
  MapPin,
} from 'lucide-react';
import { Company, ActiveTab, Auth0User } from '../types';
import { TempleSaleLogo } from './TempleSaleLogo';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  unreadNotificationsCount: number;
  onToggleNotifications: () => void;
  onOpenCreatePost: () => void;
  onOpenCompanyModal: () => void;
  user: Auth0User;
  activeCompany: Company;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  unreadNotificationsCount,
  onToggleNotifications,
  onOpenCreatePost,
  onOpenCompanyModal,
  user,
  activeCompany,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <>
      {/* TOP HEADER (Desktop & Mobile) */}
      <header
        id="main-header"
        className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800"
      >
        <div className="max-w-6xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand / Logo: Mais pequeno, delicado, Temple em âmbar e Sale em esmeralda */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              id="brand-logo-btn"
              onClick={() => {
                setActiveTab('feed');
                onSearchChange('');
              }}
              className="flex items-center space-x-2 text-left group cursor-pointer"
              title="TempleSale - Ir para o feed"
            >
              <TempleSaleLogo className="w-6 h-6 sm:w-7 sm:h-7 group-hover:scale-105 transition-transform" />
              <span className="text-[15px] sm:text-[17px] tracking-tight select-none">
                <span className="text-amber-400 font-medium group-hover:text-amber-300 transition-colors">Temple</span>
                <span className="text-emerald-400 font-semibold ml-0.5 group-hover:text-emerald-300 transition-colors">Sale</span>
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

            {/* Auth0 Company Logo / Profile Button (Desktop) */}
            <button
              id="btn-user-company-menu"
              onClick={onOpenCompanyModal}
              className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Gerenciar dados da empresa"
            >
              <img
                src={activeCompany.logo}
                alt={activeCompany.name}
                className="w-7 h-7 rounded-full object-cover border border-neutral-700"
              />
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

            {/* Avatar no Mobile */}
            <button
              id="btn-mobile-avatar"
              onClick={onOpenCompanyModal}
              className="p-0.5 rounded-full hover:ring-2 hover:ring-neutral-700 active:scale-95 transition-all cursor-pointer"
              title="Menu da Empresa"
            >
              <img
                src={activeCompany.logo}
                alt={activeCompany.name}
                className="w-7 h-7 rounded-full object-cover border border-neutral-700/80 shadow-xs"
              />
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
