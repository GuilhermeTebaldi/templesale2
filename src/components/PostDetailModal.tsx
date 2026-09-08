import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  MessageCircle,
  MapPin,
  MessageSquare,
  Share2,
  Bookmark,
  ArrowLeft,
  Trash2,
} from 'lucide-react';
import { Post, Company } from '../types';
import { TempleSaleLikeIcon } from './TempleSaleLikeIcon';

interface PostDetailModalProps {
  post: Post | null;
  company: Company | null;
  onClose: () => void;
  onAddComment: (postId: string, text: string) => void;
  onSelectCompany?: (companyId: string) => void;
  isSaved?: boolean;
  onToggleSave?: () => void;
  isOwner?: boolean;
  onDeletePost?: (postId: string) => void;
}

const QUICK_EMOJIS = ['❤️', '👏', '🔥', '✨'];

interface FlyingLikeState {
  x: number;
  y: number;
  deltaX: number;
  deltaY: number;
  key: number;
}

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
  post,
  company,
  onClose,
  onAddComment,
  onSelectCompany,
  isSaved,
  onToggleSave,
  isOwner,
  onDeletePost,
}) => {
  const [newCommentText, setNewCommentText] = useState('');
  const [liked, setLiked] = useState(false);
  const [flyingLike, setFlyingLike] = useState<FlyingLikeState | null>(null);
  const [absorbedLike, setAbsorbedLike] = useState(false);
  const [internalSaved, setInternalSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(post?.likesCount || 0);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isCurrentSaved = isSaved !== undefined ? isSaved : internalSaved;

  // Lock background body scroll while modal is open
  useEffect(() => {
    if (!post) return;

    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    // Handle Escape key to close
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [post, onClose]);

  // Sync likes count if post changes
  useEffect(() => {
    if (post) {
      setLikesCount(post.likesCount || 0);
      setLiked(false);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [post]);

  if (!post || !company) return null;

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    onAddComment(post.id, newCommentText.trim());
    setNewCommentText('');
    // Scroll to bottom of comments smoothly
    setTimeout(() => {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const triggerFlyLike = (clientX?: number, clientY?: number) => {
    const containerEl = document.getElementById('modal-post-detail-container');
    const likeBtn = document.getElementById('btn-modal-like');

    let startX = 0;
    let startY = 0;
    let deltaX = 0;
    let deltaY = 0;

    if (containerEl) {
      const containerRect = containerEl.getBoundingClientRect();
      const photoEl = document.getElementById('modal-post-photo');

      if (clientX !== undefined && clientY !== undefined && clientX > 0) {
        startX = clientX - containerRect.left;
        startY = clientY - containerRect.top;
      } else if (photoEl) {
        const photoRect = photoEl.getBoundingClientRect();
        startX = photoRect.left + photoRect.width / 2 - containerRect.left;
        startY = photoRect.top + photoRect.height / 2 - containerRect.top;
      } else {
        startX = containerRect.width / 3;
        startY = containerRect.height / 3;
      }

      if (likeBtn) {
        const btnRect = likeBtn.getBoundingClientRect();
        const targetX = btnRect.left + btnRect.width / 2 - containerRect.left;
        const targetY = btnRect.top + btnRect.height / 2 - containerRect.top;
        deltaX = targetX - startX;
        deltaY = targetY - startY;
      }
    }

    setFlyingLike({
      x: startX,
      y: startY,
      deltaX,
      deltaY,
      key: Date.now(),
    });

    setTimeout(() => {
      setAbsorbedLike(true);
      setTimeout(() => {
        setAbsorbedLike(false);
      }, 380);
    }, 720);

    setTimeout(() => {
      setFlyingLike(null);
    }, 1000);
  };

  const handleToggleLike = () => {
    if (liked) {
      setLikesCount((prev) => Math.max(0, prev - 1));
      setLiked(false);
    } else {
      setLikesCount((prev) => prev + 1);
      setLiked(true);
      triggerFlyLike();
    }
  };

  const lastTapRef = useRef<{ time: number; x: number; y: number }>({ time: 0, x: 0, y: 0 });
  const lastTriggeredRef = useRef<number>(0);

  const handlePhotoInteraction = (e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    if (now - lastTriggeredRef.current < 300) return;

    const delta = now - lastTapRef.current.time;
    if (delta > 30 && delta < 380) {
      lastTapRef.current = { time: 0, x: 0, y: 0 };
      lastTriggeredRef.current = now;

      if (!liked) {
        setLikesCount((prev) => prev + 1);
        setLiked(true);
      }
      triggerFlyLike(e.clientX, e.clientY);
    } else {
      lastTapRef.current = { time: now, x: e.clientX, y: e.clientY };
    }
  };

  const handlePhotoDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    if (now - lastTriggeredRef.current < 300) return;
    lastTriggeredRef.current = now;

    if (!liked) {
      setLikesCount((prev) => prev + 1);
      setLiked(true);
    }
    triggerFlyLike(e.clientX, e.clientY);
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

  const cleanWhatsAppNumber = company.whatsapp.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${cleanWhatsAppNumber}?text=${encodeURIComponent(
    `Olá! Vi sua publicação no TempleSale e gostaria de mais informações.`
  )}`;

  return (
    <div
      id="modal-post-detail-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 sm:bg-black/85 backdrop-blur-xs p-0 sm:p-4 overflow-hidden"
      onClick={onClose}
    >
      <div
        id="modal-post-detail-container"
        className="relative w-full h-[100dvh] sm:h-[90vh] sm:max-w-4xl bg-neutral-900 sm:border sm:border-neutral-800 sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Efeito Visual Mágico: Logomarca TempleSale surge no local exato do clique na foto e voa até o botão de curtir */}
        {flyingLike && (
          <div
            key={flyingLike.key}
            className="absolute pointer-events-none z-50"
            style={{
              left: `${flyingLike.x}px`,
              top: `${flyingLike.y}px`,
              '--target-x': `${flyingLike.deltaX}px`,
              '--target-y': `${flyingLike.deltaY}px`,
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
        {/* MOBILE TOP BAR WITH FIXED CLOSE X */}
        <div className="md:hidden shrink-0 bg-neutral-900 border-b border-neutral-800 px-3 py-2.5 flex items-center justify-between z-30">
          <div
            className="flex items-center space-x-2.5 min-w-0 cursor-pointer"
            onClick={() => {
              if (onSelectCompany) {
                onSelectCompany(company.id);
                onClose();
              }
            }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1 -ml-1 text-neutral-400 hover:text-white"
              title="Voltar"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <img
              src={company.logo}
              alt={company.name}
              className="w-7 h-7 rounded-full object-cover border border-neutral-700 shrink-0"
            />
            <div className="min-w-0">
              <h4 className="font-bold text-xs text-neutral-100 truncate">
                {company.name}
              </h4>
              <p className="text-[10px] text-neutral-400 truncate">
                {company.city} • {company.category}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            {isOwner && onDeletePost && (
              <button
                type="button"
                id="btn-delete-post-mobile-detail"
                onClick={() => setIsConfirmingDelete(true)}
                className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded-full transition-colors cursor-pointer"
                title="Excluir publicação"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-emerald-400 hover:text-emerald-300"
              title="WhatsApp"
            >
              <MessageSquare className="w-4 h-4" />
            </a>
            <button
              id="btn-close-modal-mobile"
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-full transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* FOTO CONTAINER: Fixada no topo em mobile, lado esquerdo no desktop */}
        <div
          id="modal-post-photo"
          className="relative shrink-0 md:shrink md:flex-1 md:w-3/5 bg-neutral-950 flex items-center justify-center overflow-hidden h-[34vh] sm:h-[40vh] md:h-full border-b md:border-b-0 md:border-r border-neutral-800 select-none cursor-pointer"
          onClick={handlePhotoInteraction}
          onDoubleClick={handlePhotoDoubleClick}
        >
          {/* Ambient blur backdrop to eliminate black empty voids */}
          <div
            className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-35 scale-125 pointer-events-none"
            style={{ backgroundImage: `url(${post.imageUrl})` }}
          />

          <img
            src={post.imageUrl}
            alt={post.caption}
            className="relative z-10 w-full h-full object-cover select-none pointer-events-none"
          />

          {/* Desktop Close Button */}
          <button
            id="btn-close-post-detail-desktop"
            type="button"
            onClick={onClose}
            className="hidden md:flex absolute top-3 left-3 z-30 p-2 bg-black/60 hover:bg-black/90 text-white rounded-full transition-colors cursor-pointer"
            title="Fechar publicação"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ÁREA DE DETALHES E COMENTÁRIOS: Rolagem fluida e independente */}
        <div className="flex-1 flex flex-col min-h-0 bg-neutral-900 md:w-2/5">
          {/* Desktop Header */}
          <div className="hidden md:flex p-3.5 border-b border-neutral-800 items-center justify-between shrink-0">
            <div
              className="flex items-center space-x-2.5 cursor-pointer min-w-0 group"
              onClick={() => {
                if (onSelectCompany) {
                  onSelectCompany(company.id);
                  onClose();
                }
              }}
            >
              <img
                src={company.logo}
                alt={company.name}
                className="w-9 h-9 rounded-full object-cover border border-neutral-700 group-hover:border-neutral-400 transition-colors shrink-0"
              />
              <div className="min-w-0">
                <h4 className="font-bold text-xs sm:text-sm text-neutral-100 group-hover:text-white truncate">
                  {company.name}
                </h4>
                <div className="flex items-center text-[11px] text-neutral-400 space-x-1 truncate">
                  <MapPin className="w-3 h-3 text-neutral-500 shrink-0" />
                  <span className="truncate">{company.city}</span>
                  <span>•</span>
                  <span className="text-neutral-300 font-medium truncate">{company.category}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1 shrink-0">
              {isOwner && onDeletePost && (
                <button
                  type="button"
                  id="btn-delete-post-desktop-detail"
                  onClick={() => setIsConfirmingDelete(true)}
                  className="p-2 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition-colors shrink-0 cursor-pointer"
                  title="Excluir publicação"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-neutral-800 rounded-lg transition-colors shrink-0"
                title="Conversar no WhatsApp"
              >
                <MessageSquare className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* LISTA ROLÁVEL DE COMENTÁRIOS: overscroll-contain garante isolamento de rolagem */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-3.5 sm:p-4 space-y-4 text-xs">
            {/* Post Caption / Legenda do autor */}
            <div className="flex items-start space-x-2.5 pb-3 border-b border-neutral-800/80">
              <img
                src={company.logo}
                alt={company.name}
                className="w-7 h-7 rounded-full object-cover border border-neutral-700 shrink-0 mt-0.5"
              />
              <div className="space-y-1 min-w-0 flex-1">
                <div className="leading-relaxed">
                  <span className="font-bold text-neutral-100 mr-1.5">{company.name}</span>
                  <span className="text-neutral-200 whitespace-pre-wrap">{post.caption}</span>
                </div>
                <div className="text-[10px] text-neutral-400">{formatRelativeTime(post.createdAt)}</div>
              </div>
            </div>

            {/* Comentários dos Clientes / Visitantes */}
            <div className="space-y-3">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-neutral-400">
                Comentários ({post.comments.length})
              </div>

              {post.comments.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-400 italic">
                  Nenhum comentário ainda. Seja o primeiro a comentar!
                </div>
              ) : (
                post.comments.map((comment) => (
                  <div key={comment.id} className="flex items-start space-x-2.5">
                    <div className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-[10px] text-neutral-300 shrink-0 uppercase">
                      {comment.authorName.slice(0, 2)}
                    </div>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="leading-snug">
                        <span className="font-semibold text-neutral-200 mr-1.5">
                          {comment.authorName}
                        </span>
                        <span className="text-neutral-300 whitespace-pre-wrap">{comment.text}</span>
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        {formatRelativeTime(comment.createdAt)}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={commentsEndRef} />
            </div>
          </div>

          {/* BARRA DE AÇÕES RÁPIDAS E CURTIDAS */}
          <div className="shrink-0 bg-neutral-900 border-t border-neutral-800/80 px-3.5 py-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  id="btn-modal-like"
                  type="button"
                  onClick={handleToggleLike}
                  className={`transition-transform cursor-pointer flex items-center justify-center ${
                    absorbedLike ? 'animate-like-absorb' : 'active:scale-125'
                  }`}
                  title={liked ? 'Descurtir' : 'Curtir'}
                >
                  <TempleSaleLikeIcon
                    liked={liked}
                    className={`w-6 h-6 transition-all duration-200 ${
                      liked
                        ? 'filter drop-shadow-sm scale-105'
                        : 'text-neutral-300 hover:text-white'
                    }`}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => inputRef.current?.focus()}
                  className="text-neutral-200 hover:text-white transition-transform active:scale-125 cursor-pointer"
                  title="Comentar"
                >
                  <MessageCircle className="w-5 h-5 stroke-neutral-200" />
                </button>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-200 hover:text-white transition-transform active:scale-125"
                  title="WhatsApp"
                >
                  <Share2 className="w-4 h-4 stroke-neutral-200" />
                </a>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (onToggleSave) {
                    onToggleSave();
                  } else {
                    setInternalSaved(!internalSaved);
                  }
                }}
                className={`transition-transform active:scale-125 cursor-pointer ${
                  isCurrentSaved ? 'text-amber-400' : 'text-neutral-200 hover:text-white'
                }`}
                title={isCurrentSaved ? 'Salvo nos preferidos' : 'Salvar nos preferidos'}
              >
                <Bookmark
                  className={`w-5 h-5 ${isCurrentSaved ? 'fill-amber-400 stroke-amber-400' : 'stroke-neutral-200'}`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-neutral-100">
                {likesCount === 1 ? '1 curtida' : `${likesCount} curtidas`}
              </span>
              <span className="text-[10px] text-neutral-400 uppercase font-medium">
                {formatRelativeTime(post.createdAt)}
              </span>
            </div>
          </div>

          {/* INPUT FIXO DE COMENTÁRIO: Não quebra o layout ao abrir teclado */}
          <div className="shrink-0 bg-neutral-950 border-t border-neutral-800 p-2.5 sm:p-3">
            <form onSubmit={handleCommentSubmit} className="flex items-center gap-2">
              <input
                ref={inputRef}
                id="input-comment-modal"
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Adicione um comentário..."
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-base sm:text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-700"
              />

              {/* Quick Emojis */}
              <div className="flex items-center space-x-0.5">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setNewCommentText((prev) => prev + emoji)}
                    className="text-xs hover:scale-125 transition-transform p-1 cursor-pointer opacity-70 hover:opacity-100"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={!newCommentText.trim()}
                className="text-xs font-semibold text-sky-400 hover:text-sky-300 disabled:opacity-25 disabled:hover:text-sky-400 transition-opacity cursor-pointer disabled:cursor-default px-2 py-1 shrink-0"
              >
                Publicar
              </button>
            </form>
          </div>
        </div>

        {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DENTRO DO MODAL DE DETALHES */}
        {isConfirmingDelete && (
          <div
            id="detail-delete-modal-backdrop"
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 animate-in fade-in duration-150"
            onClick={() => setIsConfirmingDelete(false)}
          >
            <div
              id="detail-delete-modal-card"
              className="relative w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
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

              <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  id="btn-detail-cancel-delete"
                  onClick={() => setIsConfirmingDelete(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 active:scale-95 rounded-xl transition-all cursor-pointer"
                >
                  Não excluir
                </button>
                <button
                  type="button"
                  id="btn-detail-confirm-delete"
                  onClick={() => {
                    if (onDeletePost) {
                      onDeletePost(post.id);
                    }
                    setIsConfirmingDelete(false);
                    onClose();
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
    </div>
  );
};
