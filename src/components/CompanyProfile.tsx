import React, { useState } from 'react';
import {
  MessageSquare,
  MapPin,
  Clock,
  Tag,
  Edit3,
  Plus,
  Compass,
  MessageCircle,
  Grid3X3,
  CheckCircle2,
  ArrowLeft,
  Share2,
  Phone,
  Bookmark,
  X,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { Company, Post } from '../types';
import { TempleSaleLikeIcon } from './TempleSaleLikeIcon';
import { TempleSaleAvatarFrame } from './TempleSaleAvatarFrame';

interface CompanyProfileProps {
  company: Company;
  posts: Post[];
  isOwner?: boolean;
  onBack?: () => void;
  onOpenPost: (post: Post) => void;
  onOpenCreatePost?: () => void;
  onEditCompany?: (company: Company) => void;
  onKeywordClick?: (keyword: string) => void;
  onDeletePost?: (postId: string) => void;
}

export const CompanyProfile: React.FC<CompanyProfileProps> = ({
  company,
  posts,
  isOwner,
  onBack,
  onOpenPost,
  onOpenCreatePost,
  onEditCompany,
  onKeywordClick,
  onDeletePost,
}) => {
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);

  const cleanWhatsAppNumber = company.whatsapp.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${cleanWhatsAppNumber}?text=${encodeURIComponent(
    `Olá! Vi o perfil da empresa ${company.name} no TempleSale e gostaria de mais informações.`
  )}`;

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${company.address} ${company.city}`
  )}`;

  const totalLikes = posts.reduce((sum, p) => sum + (p.likesCount || 0), 0);

  // Formatar identificador da empresa
  const companyHandle = company.name.toLowerCase().replace(/[^a-z0-9]/g, '_');

  return (
    <div id="company-profile-view" className="max-w-xl mx-auto px-0 sm:px-4 py-0 sm:py-4 space-y-4">
      {/* 1. TOP BAR DO PERFIL */}
      <div className="sticky top-14 sm:top-16 z-40 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800/80 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-1 -ml-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Voltar ao Feed"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-sm sm:text-base text-neutral-100">
              {companyHandle}
            </span>
            <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-neutral-300 hover:text-emerald-400 transition-colors"
            title="WhatsApp"
          >
            <MessageSquare className="w-5 h-5" />
          </a>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-neutral-300 hover:text-white transition-colors"
            title="Google Maps"
          >
            <Compass className="w-5 h-5" />
          </a>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* 2. CABEÇALHO DO PERFIL (Avatar com Moldura Oficial TempleSale + Estatísticas) */}
        <div className="flex items-center justify-between pt-1">
          {/* Avatar com a Moldura Exclusiva dos Quadradinhos do TempleSale */}
          <div className="shrink-0 mr-4 sm:mr-7">
            <TempleSaleAvatarFrame
              src={company.logo}
              alt={company.name}
              size="lg"
              isOwner={isOwner}
            />
          </div>

          {/* Estatísticas (publicações, curtidas, local) */}
          <div className="flex-1 flex items-center justify-around text-center">
            <div className="cursor-default">
              <div className="text-base sm:text-lg font-bold text-neutral-100">
                {posts.length}
              </div>
              <div className="text-[11px] sm:text-xs text-neutral-400">
                publicações
              </div>
            </div>

            <div className="cursor-default">
              <div className="text-base sm:text-lg font-bold text-neutral-100">
                {totalLikes}
              </div>
              <div className="text-[11px] sm:text-xs text-neutral-400">
                curtidas
              </div>
            </div>

            <div className="cursor-default">
              <div className="text-xs sm:text-sm font-bold text-emerald-400 truncate max-w-[95px] sm:max-w-none">
                {company.city}
              </div>
              <div className="text-[11px] sm:text-xs text-neutral-400">
                cidade
              </div>
            </div>
          </div>
        </div>

        {/* 3. BIO / DADOS DA EMPRESA */}
        <div className="space-y-1.5 text-xs sm:text-sm">
          <div className="font-bold text-neutral-100 text-sm sm:text-base leading-tight">
            {company.name}
          </div>

          <div className="text-neutral-400 text-xs font-medium">
            {company.category}
          </div>

          <p className="text-neutral-200 leading-relaxed whitespace-pre-line text-xs sm:text-sm">
            {company.description}
          </p>

          <div className="space-y-1 pt-1 text-xs text-neutral-300">
            <div className="flex items-center space-x-1.5 text-neutral-400">
              <Clock className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
              <span>{company.hours}</span>
            </div>

            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 text-sky-400 hover:underline"
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{company.address} • {company.city}</span>
            </a>
          </div>
        </div>

        {/* 4. BOTÕES DO PROPRIETÁRIO (Se for dono da empresa) */}
        {isOwner && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            {onOpenCreatePost && (
              <button
                type="button"
                onClick={onOpenCreatePost}
                id="btn-profile-add-post"
                className="py-2 px-3 rounded-lg bg-neutral-100 hover:bg-white text-neutral-950 font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm active:scale-98 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Publicar Foto</span>
              </button>
            )}

            {onEditCompany && (
              <button
                type="button"
                onClick={() => onEditCompany(company)}
                id="btn-profile-edit"
                className="py-2 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white font-semibold text-xs flex items-center justify-center space-x-1.5 active:scale-98 transition-all cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar Perfil</span>
              </button>
            )}
          </div>
        )}

        {/* 5. ATALHOS RÁPIDOS DA EMPRESA (Em formato de cartões / quadradinhos adaptados) */}
        <div className="pt-2 pb-2 border-b border-neutral-800/80">
          <div className="flex items-center space-x-3.5 sm:space-x-4 overflow-x-auto no-scrollbar py-1">
            {/* Destaque Horários */}
            <div
              onClick={() => setActiveHighlight(activeHighlight === 'hours' ? null : 'hours')}
              className="flex flex-col items-center space-y-1 shrink-0 cursor-pointer group"
            >
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl p-0.5 border border-neutral-800 group-hover:border-amber-400/60 transition-all flex items-center justify-center bg-neutral-900/90 group-hover:bg-neutral-800/80 shadow-xs">
                <Clock className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-[11px] text-neutral-300 font-medium">Horários</span>
            </div>

            {/* Destaque Endereço */}
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center space-y-1 shrink-0 group"
            >
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl p-0.5 border border-neutral-800 group-hover:border-sky-400/60 transition-all flex items-center justify-center bg-neutral-900/90 group-hover:bg-neutral-800/80 shadow-xs">
                <MapPin className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-[11px] text-neutral-300 font-medium">Endereço</span>
            </a>

            {/* Destaque Contato */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center space-y-1 shrink-0 group"
            >
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl p-0.5 border border-neutral-800 group-hover:border-emerald-400/60 transition-all flex items-center justify-center bg-neutral-900/90 group-hover:bg-neutral-800/80 shadow-xs">
                <MessageSquare className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-[11px] text-neutral-300 font-medium">WhatsApp</span>
            </a>

            {/* Destaque Palavras-chave */}
            <div
              onClick={() => setActiveHighlight(activeHighlight === 'tags' ? null : 'tags')}
              className="flex flex-col items-center space-y-1 shrink-0 cursor-pointer group"
            >
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl p-0.5 border border-neutral-800 group-hover:border-purple-400/60 transition-all flex items-center justify-center bg-neutral-900/90 group-hover:bg-neutral-800/80 shadow-xs">
                <Tag className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-[11px] text-neutral-300 font-medium">Tags</span>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL FLUTUANTE DE DESTAQUE (Não empurra a grade de fotos) */}
      {activeHighlight && (
        <div
          id="highlight-floating-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setActiveHighlight(null)}
        >
          <div
            id="highlight-floating-card"
            className="relative w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-2xl space-y-3 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
              <div className="flex items-center space-x-2">
                {activeHighlight === 'hours' ? (
                  <>
                    <div className="w-7 h-7 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400">
                      <Clock className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold text-sm text-neutral-100">Horário de Funcionamento</h4>
                  </>
                ) : (
                  <>
                    <div className="w-7 h-7 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                      <Tag className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold text-sm text-neutral-100">Palavras-chave</h4>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => setActiveHighlight(null)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {activeHighlight === 'hours' && (
              <div className="py-2 text-sm text-neutral-200">
                <p className="leading-relaxed whitespace-pre-line">{company.hours}</p>
              </div>
            )}

            {activeHighlight === 'tags' && (
              <div className="py-2 space-y-2.5">
                <p className="text-xs text-neutral-400">
                  Toque em uma tag para pesquisar empresas deste segmento:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {company.keywords.map((kw, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setActiveHighlight(null);
                        if (onKeywordClick) onKeywordClick(kw);
                      }}
                      className="text-xs bg-neutral-950 text-neutral-200 hover:text-white hover:border-neutral-600 px-3 py-1.5 rounded-lg border border-neutral-800 transition-colors cursor-pointer"
                    >
                      #{kw}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. ABA DE PUBLICAÇÕES (Ícone Grid) */}
      <div className="border-t border-neutral-800">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-2 py-3 px-6 text-xs font-bold uppercase tracking-wider text-neutral-100 border-t-2 border-neutral-100 -mt-[1px]">
            <Grid3X3 className="w-4 h-4" />
            <span className="hidden sm:inline">Publicações</span>
          </div>
        </div>

        {/* 7. GRADE DE FOTOS 3 COLUNAS (Edge-to-edge sem barras pretas) */}
        {posts.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-2">
            <div className="w-12 h-12 rounded-full border border-neutral-800 mx-auto flex items-center justify-center text-neutral-500 mb-2">
              <Grid3X3 className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-neutral-300">
              Nenhuma publicação ainda
            </p>
            <p className="text-xs text-neutral-500 max-w-xs mx-auto">
              {isOwner
                ? 'Comece a divulgar os serviços e ambiente da sua empresa com fotos e legendas!'
                : 'Esta empresa ainda não publicou nenhuma foto no perfil.'}
            </p>
            {isOwner && onOpenCreatePost && (
              <button
                type="button"
                onClick={onOpenCreatePost}
                className="mt-3 px-4 py-2 bg-neutral-100 hover:bg-white text-neutral-950 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                + Publicar Primeira Foto
              </button>
            )}
          </div>
        ) : (
          <div
            id="company-posts-grid"
            className="grid grid-cols-3 gap-0.5 sm:gap-1"
          >
            {posts.map((post) => (
              <div
                key={post.id}
                id={`grid-post-${post.id}`}
                onClick={() => onOpenPost(post)}
                className="group relative aspect-square bg-neutral-950 cursor-pointer overflow-hidden"
              >
                <img
                  src={post.imageUrl}
                  alt={post.caption}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  loading="lazy"
                />

                {/* Botão de Excluir / Apagar (Exclusivo para o perfil da empresa do usuário) */}
                {isOwner && onDeletePost && (
                  <button
                    type="button"
                    id={`btn-delete-post-${post.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPostToDelete(post);
                    }}
                    className="absolute top-1.5 right-1.5 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-neutral-950/85 hover:bg-red-600 text-neutral-300 hover:text-white border border-neutral-700/80 hover:border-red-500 flex items-center justify-center transition-all duration-150 shadow-md cursor-pointer active:scale-90"
                    title="Excluir publicação"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Overlay no Hover com Curtidas e Comentários */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-white pointer-events-none">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <span className="flex items-center space-x-1.5 text-xs font-bold">
                      <TempleSaleLikeIcon liked={true} className="w-4 h-4 filter drop-shadow-sm" />
                      <span>{post.likesCount || 0}</span>
                    </span>
                    <span className="flex items-center space-x-1 text-xs font-bold">
                      <MessageCircle className="w-3.5 h-3.5 fill-white" />
                      <span>{post.comments.length}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO (Clica uma vez, confirmação de segurança antes de excluir) */}
      {postToDelete && (
        <div
          id="delete-post-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setPostToDelete(null)}
        >
          <div
            id="delete-post-modal-card"
            className="relative w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho com ícone da lixeira */}
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-red-950/70 border border-red-800/80 flex items-center justify-center shrink-0 text-red-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-neutral-100">
                  Excluir publicação?
                </h3>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  Você tem certeza de que quer excluir esta publicação? Esta foto será removida permanentemente do feed e do perfil da sua empresa.
                </p>
              </div>
            </div>

            {/* Prévia da publicação que será excluída */}
            <div className="flex items-center space-x-3 p-2.5 bg-neutral-950 rounded-xl border border-neutral-800">
              <img
                src={postToDelete.imageUrl}
                alt={postToDelete.caption}
                className="w-14 h-14 rounded-lg object-cover border border-neutral-800 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-neutral-200 line-clamp-2 italic">
                  "{postToDelete.caption || 'Sem legenda'}"
                </p>
                <span className="text-[10px] text-neutral-500 block mt-1 font-medium">
                  {postToDelete.comments.length} comentários • {postToDelete.likesCount || 0} curtidas
                </span>
              </div>
            </div>

            {/* Botões de Ação: Cancelar (Não excluir) ou Confirmar (Excluir) */}
            <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-neutral-800">
              <button
                type="button"
                id="btn-cancel-delete-post"
                onClick={() => setPostToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 active:scale-95 rounded-xl transition-all cursor-pointer"
              >
                Não excluir
              </button>
              <button
                type="button"
                id="btn-confirm-delete-post"
                onClick={() => {
                  if (onDeletePost) {
                    onDeletePost(postToDelete.id);
                  }
                  setPostToDelete(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 active:scale-95 rounded-xl transition-all shadow-lg shadow-red-950/40 cursor-pointer flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
