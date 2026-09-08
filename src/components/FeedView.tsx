import React, { useState, useRef } from 'react';
import {
  MessageCircle,
  MessageSquare,
  MapPin,
  Clock,
  Send,
  Plus,
  Share2,
  Bookmark,
  Smile,
  ArrowDown,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';
import { Company, Post } from '../types';
import { TempleSaleLikeIcon } from './TempleSaleLikeIcon';

interface FeedViewProps {
  posts: Post[];
  companies: Company[];
  onOpenPost: (post: Post) => void;
  onSelectCompany: (companyId: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onOpenCreatePost: () => void;
  savedPostIds?: string[];
  onToggleSavePost?: (postId: string) => void;
  onRefresh?: () => Promise<void> | void;
}

interface FlyingLikeState {
  x: number;
  y: number;
  deltaX: number;
  deltaY: number;
  key: number;
}

const QUICK_EMOJIS = ['❤️', '👏', '🔥', '✨'];

export const FeedView: React.FC<FeedViewProps> = ({
  posts,
  companies,
  onOpenPost,
  onSelectCompany,
  onAddComment,
  onOpenCreatePost,
  savedPostIds,
  onToggleSavePost,
  onRefresh,
}) => {
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [internalSavedPosts, setInternalSavedPosts] = useState<Record<string, boolean>>({});
  const [flyingLikes, setFlyingLikes] = useState<Record<string, FlyingLikeState>>({});
  const [absorbedLikes, setAbsorbedLikes] = useState<Record<string, boolean>>({});

  // PULL-TO-REFRESH STATE
  const [pullDistance, setPullDistance] = useState<number>(0);
  const [refreshState, setRefreshState] = useState<
    'idle' | 'pulling' | 'ready' | 'refreshing' | 'success'
  >('idle');
  const touchStartY = useRef<number>(0);
  const isPullingRef = useRef<boolean>(false);

  const companyMap = new Map<string, Company>(companies.map((c) => [c.id, c]));

  // Pull-to-refresh touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY <= 3 && refreshState === 'idle') {
      touchStartY.current = e.touches[0].clientY;
      isPullingRef.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPullingRef.current || refreshState === 'refreshing') return;

    if (window.scrollY > 3) {
      isPullingRef.current = false;
      setPullDistance(0);
      setRefreshState('idle');
      return;
    }

    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;

    if (diff > 0) {
      // Damped curve so pulling feels elastic and responsive
      const distance = Math.min(diff * 0.45, 80);
      setPullDistance(distance);
      if (distance >= 50) {
        setRefreshState('ready');
      } else {
        setRefreshState('pulling');
      }
    } else {
      setPullDistance(0);
      setRefreshState('idle');
    }
  };

  const triggerRefresh = async () => {
    setRefreshState('refreshing');
    setPullDistance(48);

    try {
      if (onRefresh) {
        await onRefresh();
      } else {
        await new Promise((r) => setTimeout(r, 800));
      }
    } catch (err) {
      console.error(err);
    }

    setRefreshState('success');
    setTimeout(() => {
      setPullDistance(0);
      setTimeout(() => {
        setRefreshState('idle');
      }, 250);
    }, 600);
  };

  const handleTouchEnd = () => {
    if (!isPullingRef.current) return;
    isPullingRef.current = false;

    if (pullDistance >= 50 && refreshState !== 'refreshing') {
      triggerRefresh();
    } else {
      setPullDistance(0);
      setRefreshState('idle');
    }
  };

  const triggerFlyLike = (postId: string, clientX?: number, clientY?: number) => {
    const articleEl = document.getElementById(`feed-post-${postId}`);
    const likeBtn = document.getElementById(`btn-like-${postId}`);

    let startX = 0;
    let startY = 0;
    let deltaX = 0;
    let deltaY = 0;

    if (articleEl) {
      const articleRect = articleEl.getBoundingClientRect();
      const photoEl = document.getElementById(`feed-photo-${postId}`);

      if (clientX !== undefined && clientY !== undefined && clientX > 0) {
        startX = clientX - articleRect.left;
        startY = clientY - articleRect.top;
      } else if (photoEl) {
        const photoRect = photoEl.getBoundingClientRect();
        startX = photoRect.left + photoRect.width / 2 - articleRect.left;
        startY = photoRect.top + photoRect.height / 2 - articleRect.top;
      } else {
        startX = articleRect.width / 2;
        startY = articleRect.height / 3;
      }

      if (likeBtn) {
        const btnRect = likeBtn.getBoundingClientRect();
        const targetX = btnRect.left + btnRect.width / 2 - articleRect.left;
        const targetY = btnRect.top + btnRect.height / 2 - articleRect.top;
        deltaX = targetX - startX;
        deltaY = targetY - startY;
      } else {
        deltaX = 24 - startX;
        deltaY = articleRect.height - 80 - startY;
      }
    }

    setFlyingLikes((prev) => ({
      ...prev,
      [postId]: {
        x: startX,
        y: startY,
        deltaX,
        deltaY,
        key: Date.now(),
      },
    }));

    // Pulso no botão de curtir quando a logo atinge a posição final (~720ms)
    setTimeout(() => {
      setAbsorbedLikes((prev) => ({ ...prev, [postId]: true }));
      setTimeout(() => {
        setAbsorbedLikes((prev) => ({ ...prev, [postId]: false }));
      }, 380);
    }, 720);

    // Limpeza da animação
    setTimeout(() => {
      setFlyingLikes((prev) => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });
    }, 1000);
  };

  const handleToggleLike = (postId: string) => {
    setLikedPosts((prev) => {
      const willBeLiked = !prev[postId];
      if (willBeLiked) {
        triggerFlyLike(postId);
      }
      return {
        ...prev,
        [postId]: willBeLiked,
      };
    });
  };

  const handleToggleSave = (postId: string) => {
    if (onToggleSavePost) {
      onToggleSavePost(postId);
    } else {
      setInternalSavedPosts((prev) => ({
        ...prev,
        [postId]: !prev[postId],
      }));
    }
  };

  const lastTapRef = useRef<{ [postId: string]: { time: number; x: number; y: number } }>({});
  const lastTriggeredRef = useRef<{ [postId: string]: number }>({});

  // Clique simples na foto não abre a publicação e nem comentários.
  // Toque duplo / duplo clique na foto faz a logomarca TempleSale surgir no ponto exato tocado e voar para a curtida.
  const handlePhotoInteraction = (
    postId: string,
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    const now = Date.now();
    const lastTriggered = lastTriggeredRef.current[postId] || 0;
    if (now - lastTriggered < 300) return;

    const lastTap = lastTapRef.current[postId] || { time: 0, x: 0, y: 0 };
    const delta = now - lastTap.time;

    // Se o toque anterior foi há menos de 380ms, consideramos duplo clique/toque
    if (delta > 30 && delta < 380) {
      lastTapRef.current[postId] = { time: 0, x: 0, y: 0 };
      lastTriggeredRef.current[postId] = now;

      setLikedPosts((prev) => ({
        ...prev,
        [postId]: true,
      }));
      triggerFlyLike(postId, e.clientX, e.clientY);
    } else {
      lastTapRef.current[postId] = { time: now, x: e.clientX, y: e.clientY };
    }
  };

  const handlePhotoDoubleClick = (
    postId: string,
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    const now = Date.now();
    const lastTriggered = lastTriggeredRef.current[postId] || 0;
    if (now - lastTriggered < 300) return;
    lastTriggeredRef.current[postId] = now;

    setLikedPosts((prev) => ({
      ...prev,
      [postId]: true,
    }));
    triggerFlyLike(postId, e.clientX, e.clientY);
  };

  const handleQuickComment = (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    const text = commentInputs[postId]?.trim();
    if (!text) return;
    onAddComment(postId, text);
    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
  };

  const handleAddEmoji = (postId: string, emoji: string) => {
    setCommentInputs((prev) => ({
      ...prev,
      [postId]: (prev[postId] || '') + emoji,
    }));
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const now = Date.now();
      const time = new Date(dateStr).getTime();
      const diffSec = Math.max(0, Math.floor((now - time) / 1000));
      if (diffSec < 60) return 'Agora';
      if (diffSec < 3600) return `Há ${Math.floor(diffSec / 60)} min`;
      if (diffSec < 86400) return `Há ${Math.floor(diffSec / 3600)} h`;
      const days = Math.floor(diffSec / 86400);
      return days === 1 ? 'Há 1 dia' : `Há ${days} dias`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      id="feed-view"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="max-w-xl mx-auto px-2 sm:px-4 py-2 sm:py-4 space-y-4 sm:space-y-6"
    >
      {/* PULL-TO-REFRESH VISUAL BAR / INDICATOR */}
      <div
        id="pull-to-refresh-indicator"
        className="overflow-hidden transition-all duration-200 ease-out select-none flex flex-col items-center justify-center"
        style={{
          height: `${pullDistance}px`,
          opacity: pullDistance > 10 ? 1 : 0,
        }}
      >
        <div className="flex items-center space-x-2 px-3.5 py-1.5 bg-neutral-900/95 border border-neutral-800 rounded-full shadow-xl">
          {refreshState === 'pulling' && (
            <>
              <ArrowDown className="w-3.5 h-3.5 text-neutral-400 animate-bounce" />
              <span className="text-xs font-medium text-neutral-400">
                Puxe para atualizar...
              </span>
            </>
          )}

          {refreshState === 'ready' && (
            <>
              <ArrowDown className="w-3.5 h-3.5 text-amber-400 rotate-180 transition-transform duration-150" />
              <span className="text-xs font-bold text-amber-400">
                Solte para atualizar ✨
              </span>
            </>
          )}

          {refreshState === 'refreshing' && (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span className="text-xs font-semibold text-neutral-200">
                Atualizando feed...
              </span>
            </>
          )}

          {refreshState === 'success' && (
            <>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400">
                Feed atualizado!
              </span>
            </>
          )}
        </div>

        {/* Progress bar line when refreshing */}
        {refreshState === 'refreshing' && (
          <div className="w-36 h-0.5 bg-neutral-800 rounded-full overflow-hidden mt-1.5">
            <div className="h-full bg-amber-400 w-full animate-pulse" />
          </div>
        )}
      </div>

      {/* Feed Posts */}
      <div className="space-y-6 sm:space-y-8">
        {posts.map((post) => {
          const company = companyMap.get(post.companyId);
          if (!company) return null;

          const isLiked = !!likedPosts[post.id];
          const isSaved = savedPostIds ? savedPostIds.includes(post.id) : !!internalSavedPosts[post.id];
          const likesCount = (post.likesCount || 0) + (isLiked ? 1 : 0);
          const currentCommentText = commentInputs[post.id] || '';

          const cleanWhatsApp = company.whatsapp.replace(/\D/g, '');
          const whatsappUrl = `https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent(
            `Olá! Vi sua foto no TempleSale e gostaria de mais detalhes: "${post.caption.slice(
              0,
              40
            )}..."`
          )}`;

          return (
            <article
              key={post.id}
              id={`feed-post-${post.id}`}
              className="relative bg-neutral-900 border border-neutral-800/90 rounded-2xl overflow-hidden shadow-xl"
            >
              {/* Efeito Visual Mágico: Logomarca TempleSale surge no local exato do clique na foto e voa até o botão de curtir */}
              {flyingLikes[post.id] && (
                <div
                  key={flyingLikes[post.id].key}
                  className="absolute pointer-events-none z-40"
                  style={{
                    left: `${flyingLikes[post.id].x}px`,
                    top: `${flyingLikes[post.id].y}px`,
                    '--target-x': `${flyingLikes[post.id].deltaX}px`,
                    '--target-y': `${flyingLikes[post.id].deltaY}px`,
                  } as React.CSSProperties}
                >
                  <div className="animate-like-fly filter drop-shadow-[0_14px_30px_rgba(0,0,0,0.92)]">
                    <TempleSaleLikeIcon
                      liked={true}
                      className="w-24 h-24 sm:w-28 sm:h-28"
                    />
                  </div>
                </div>
              )}

              {/* 1. Post Header: Perfil da Empresa */}
              <div className="px-3.5 py-3 flex items-center justify-between">
                <div
                  className="flex items-center space-x-2.5 cursor-pointer group min-w-0"
                  onClick={() => onSelectCompany(company.id)}
                >
                  <img
                    src={company.logo}
                    alt={company.name}
                    className="w-9 h-9 rounded-full object-cover border border-neutral-700/80 group-hover:border-neutral-400 transition-colors shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-neutral-100 group-hover:text-white truncate">
                      {company.name}
                    </h3>
                    <div className="flex items-center text-[11px] text-neutral-400 space-x-1 truncate">
                      <MapPin className="w-3 h-3 text-neutral-500 shrink-0" />
                      <span className="truncate">{company.city}</span>
                      <span>•</span>
                      <span className="text-neutral-300 truncate">{company.category}</span>
                    </div>
                  </div>
                </div>

                {/* Botão de WhatsApp direto da empresa */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800/60 text-emerald-300 text-xs font-medium transition-colors shrink-0"
                  title="Falar no WhatsApp"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline text-[11px]">WhatsApp</span>
                </a>
              </div>

              {/* 2. Foto da Publicação (1:1 Quadrado Perfeito) - O clique simples na foto NÃO abre detalhes ou comentários */}
              <div
                id={`feed-photo-${post.id}`}
                className="relative aspect-square w-full bg-neutral-950 overflow-hidden select-none cursor-pointer"
                onClick={(e) => handlePhotoInteraction(post.id, e)}
                onDoubleClick={(e) => handlePhotoDoubleClick(post.id, e)}
              >
                <img
                  src={post.imageUrl}
                  alt={post.caption}
                  className="w-full h-full object-cover select-none pointer-events-none"
                />
              </div>

              {/* 3. Barra de Ações Rápidas */}
              <div className="px-4 pt-3 pb-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Botão de Curtir com a Logomarca TempleSale */}
                    <button
                      id={`btn-like-${post.id}`}
                      onClick={() => handleToggleLike(post.id)}
                      className={`transition-transform cursor-pointer flex items-center justify-center ${
                        absorbedLikes[post.id]
                          ? 'animate-like-absorb'
                          : 'active:scale-125'
                      }`}
                      title={isLiked ? 'Descurtir' : 'Curtir'}
                    >
                      <TempleSaleLikeIcon
                        liked={isLiked}
                        className={`w-6 h-6 transition-all duration-200 ${
                          isLiked
                            ? 'filter drop-shadow-sm scale-105'
                            : 'text-neutral-300 hover:text-white'
                        }`}
                      />
                    </button>

                    {/* Botão de Comentar - Abre a área de comentários */}
                    <button
                      id={`btn-comment-${post.id}`}
                      onClick={() => onOpenPost(post)}
                      className="text-neutral-200 hover:text-white transition-transform active:scale-125 cursor-pointer"
                      title="Comentar"
                    >
                      <MessageCircle className="w-6 h-6 stroke-neutral-200 hover:stroke-white" />
                    </button>

                    {/* Compartilhar WhatsApp */}
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-200 hover:text-white transition-transform active:scale-125"
                      title="Compartilhar pelo WhatsApp"
                    >
                      <Share2 className="w-5 h-5 stroke-neutral-200 hover:stroke-white" />
                    </a>
                  </div>

                  {/* Salvar Publicação */}
                  <button
                    onClick={() => handleToggleSave(post.id)}
                    className={`transition-transform active:scale-125 cursor-pointer ${
                      isSaved ? 'text-amber-400' : 'text-neutral-200 hover:text-white'
                    }`}
                    title={isSaved ? 'Salvo' : 'Salvar foto'}
                  >
                    <Bookmark
                      className={`w-6 h-6 ${
                        isSaved ? 'fill-amber-400 stroke-amber-400' : 'stroke-neutral-200 hover:stroke-white'
                      }`}
                    />
                  </button>
                </div>

                {/* Curtidas */}
                <div className="text-xs font-bold text-neutral-100">
                  {likesCount === 1 ? '1 curtida' : `${likesCount} curtidas`}
                </div>

                {/* Legenda */}
                <div className="text-xs sm:text-sm text-neutral-200 leading-snug">
                  <button
                    onClick={() => onSelectCompany(company.id)}
                    className="font-bold text-neutral-100 hover:underline mr-1.5 cursor-pointer"
                  >
                    {company.name}
                  </button>
                  <span className="whitespace-pre-wrap">{post.caption}</span>
                </div>

                {/* Comentários Recentes */}
                {post.comments.length > 0 ? (
                  <div className="space-y-1 pt-0.5">
                    <button
                      id={`btn-view-all-comments-${post.id}`}
                      type="button"
                      onClick={() => onOpenPost(post)}
                      className="text-xs text-neutral-400 hover:text-neutral-200 cursor-pointer block text-left font-medium"
                    >
                      {post.comments.length === 1
                        ? 'Ver 1 comentário'
                        : `Ver todos os ${post.comments.length} comentários`}
                    </button>
                    {/* Último comentário */}
                    <div className="text-xs text-neutral-300">
                      <span className="font-semibold text-neutral-200 mr-1.5">
                        {post.comments[post.comments.length - 1].authorName}:
                      </span>
                      <span>{post.comments[post.comments.length - 1].text}</span>
                    </div>
                  </div>
                ) : (
                  <div className="pt-0.5">
                    <button
                      id={`btn-view-comments-empty-${post.id}`}
                      type="button"
                      onClick={() => onOpenPost(post)}
                      className="text-xs text-neutral-500 hover:text-neutral-300 cursor-pointer block text-left"
                    >
                      Adicionar um comentário...
                    </button>
                  </div>
                )}

                {/* Horário Relativo */}
                <div className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium pt-0.5">
                  {formatRelativeTime(post.createdAt)}
                </div>

                {/* Campo de Comentário */}
                <form
                  onSubmit={(e) => handleQuickComment(e, post.id)}
                  className="border-t border-neutral-800/80 pt-2.5 mt-2 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={currentCommentText}
                    onChange={(e) =>
                      setCommentInputs((prev) => ({
                        ...prev,
                        [post.id]: e.target.value,
                      }))
                    }
                    placeholder="Adicione um comentário..."
                    className="flex-1 bg-transparent text-base sm:text-xs text-neutral-100 placeholder-neutral-400 focus:outline-none"
                  />

                  {/* Emojis Rápidos */}
                  <div className="hidden sm:flex items-center space-x-1">
                    {QUICK_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleAddEmoji(post.id, emoji)}
                        className="text-xs hover:scale-125 transition-transform p-0.5 cursor-pointer opacity-70 hover:opacity-100"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  {/* Botão Publicar */}
                  <button
                    type="submit"
                    disabled={!currentCommentText.trim()}
                    className="text-xs font-semibold text-sky-400 hover:text-sky-300 disabled:opacity-20 disabled:hover:text-sky-400 transition-opacity cursor-pointer disabled:cursor-default shrink-0 px-1 py-0.5"
                  >
                    Publicar
                  </button>
                </form>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
