import React from "react";
import { withPendingComment, reconcileCommentMutation, mergeCommentPages, type PendingComment } from "../lib/comment-delivery";
import { motion } from "motion/react";
import { Loader2, MessageCircle, Pencil, Send, Trash2, X } from "lucide-react";
import { api, type EstablishmentDto, type ProductCommentDto, type CommentMutationResult, type PublicationDto, type SessionUser } from "../lib/api";
import { formatRelativeTime } from "../i18n/formatters";
import { useI18n } from "../i18n/provider";
import { ProgressiveProductImage } from "./ProductCard";
import { LinkedText } from './SharedLink';
import PublicationLikes from './PublicationLikes';

interface PublicationViewerProps {
  publication: PublicationDto;
  establishment: EstablishmentDto;
  currentUser: SessionUser | null;
  pendingComment?: PendingComment;
  onSubmitComment: (publicationId: number, body: string, parentCommentId?: number) => Promise<CommentMutationResult>;
  focusCommentId?: number | null;
  initialTab?: 'comments' | 'likes';
  onClose: () => void;
  onOpenEstablishment?: (establishmentId: number) => void;
  onDeleted?: (publicationId: number) => void;
  onCommentsChanged?: (publicationId: number, comments: ProductCommentDto[]) => void;
}

function flattenCommentIds(comments: ProductCommentDto[]): Set<number> {
  const ids = new Set<number>();
  for (const comment of comments) {
    ids.add(comment.id);
    for (const reply of comment.replies) {
      ids.add(reply.id);
    }
  }
  return ids;
}

export default function PublicationViewer({
  publication,
  establishment,
  currentUser,
  pendingComment,
  onSubmitComment,
  focusCommentId,
  initialTab = 'comments',
  onClose,
  onOpenEstablishment,
  onDeleted,
  onCommentsChanged,
}: PublicationViewerProps) {
  const { t, locale } = useI18n();
  const [interactionTab, setInteractionTab] = React.useState(initialTab);
  const [likesOpened, setLikesOpened] = React.useState(initialTab === 'likes');
  React.useEffect(() => {
    setInteractionTab(initialTab); setLikesOpened(initialTab === 'likes');
  }, [publication.id, initialTab]);
  const [comments, setCommentState] = React.useState<ProductCommentDto[]>([]);
  const commentsRef = React.useRef<ProductCommentDto[]>([]);
  const setComments = (next: React.SetStateAction<ProductCommentDto[]>) => {
    commentsRef.current = typeof next === "function" ? next(commentsRef.current) : next;
    setCommentState(commentsRef.current);
  };
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [hasMoreComments, setHasMoreComments] = React.useState(false);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [replyPages, setReplyPages] = React.useState<Record<number, { nextCursor: string | null; hasMore: boolean; loading: boolean }>>({});
  const pageRequestsRef = React.useRef(new Set<string>());
  const currentPublicationRef = React.useRef(publication.id);
  currentPublicationRef.current = publication.id;
  const [commentBody, setCommentBody] = React.useState("");
  const [replyToCommentId, setReplyToCommentId] = React.useState<number | null>(null);
  const [editingCommentId, setEditingCommentId] = React.useState<number | null>(null);
  const [editingBody, setEditingBody] = React.useState("");
  const [isLoadingComments, setIsLoadingComments] = React.useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = React.useState(false);
  const [commentsError, setCommentsError] = React.useState("");
  const [isSavingPublication, setIsSavingPublication] = React.useState(false);
  const [publicationError, setPublicationError] = React.useState("");
  const highlightedCommentRef = React.useRef<HTMLDivElement | null>(null);
  const isOwner = currentUser?.id === publication.ownerId;
  const visibleComments = withPendingComment(comments, pendingComment);
  const submittingRef = React.useRef(false);
  const commentsVersionRef = React.useRef(0);
  const initialReadCreatesRef = React.useRef<ProductCommentDto[]>([]);
  const initialReadPendingRef = React.useRef(false);

  const openEstablishmentProfile = () => {
    onClose();
    onOpenEstablishment?.(establishment.id);
  };

  React.useEffect(() => {
    setPublicationError("");
  }, [publication.id]);

  React.useEffect(() => {
    let isActive = true;
    const readVersion = commentsVersionRef.current;
    initialReadCreatesRef.current = [];
    initialReadPendingRef.current = true;
    setComments([]);
    setNextCursor(null); setHasMoreComments(false); setReplyPages({}); setIsLoadingMore(false);
    setIsLoadingComments(true);
    setCommentsError("");
    api
      .getPublicationCommentPage(publication.id, { focus: focusCommentId })
      .then((page) => {
        if (isActive) { setNextCursor(page.nextCursor); setHasMoreComments(page.hasMore); }
        if (isActive && readVersion === commentsVersionRef.current) {
          setComments(initialReadCreatesRef.current.reduce((current, comment) =>
            reconcileCommentMutation(current, { comments: [comment], incremental: true }), mergeCommentPages(page.comments, page.focused)));
        }
      })
      .catch((error) => {
        if (isActive) {
          setCommentsError(error instanceof Error ? error.message : t("Não foi possível carregar comentários."));
        }
      })
      .finally(() => {
        if (isActive) {
          initialReadPendingRef.current = false;
          initialReadCreatesRef.current = [];
          setIsLoadingComments(false);
        }
      });
    return () => {
      isActive = false;
    };
  }, [publication.id, t, focusCommentId]);

  React.useEffect(() => {
    if (!focusCommentId || isLoadingComments || comments.length === 0) {
      return;
    }
    if (!flattenCommentIds(comments).has(focusCommentId)) {
      return;
    }
    window.setTimeout(() => {
      highlightedCommentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
  }, [comments, focusCommentId, isLoadingComments]);

  const loadMoreComments = async (parentId?: number) => {
    const publicationId = publication.id;
    const requestId = `${publicationId}:${parentId ?? "roots"}`;
    if (pageRequestsRef.current.has(requestId)) return;
    pageRequestsRef.current.add(requestId);
    if (parentId) setReplyPages(current => ({ ...current, [parentId]: { nextCursor: current[parentId]?.nextCursor ?? null, hasMore: true, loading: true } }));
    else setIsLoadingMore(true);
    setCommentsError("");
    try {
      const page = await api.getPublicationCommentPage(publicationId, { parentId, cursor: parentId ? replyPages[parentId]?.nextCursor : nextCursor });
      if (currentPublicationRef.current !== publicationId) return;
      setComments(current => mergeCommentPages(current, page.comments));
      if (parentId) setReplyPages(current => ({ ...current, [parentId]: { nextCursor: page.nextCursor, hasMore: page.hasMore, loading: false } }));
      else { setNextCursor(page.nextCursor); setHasMoreComments(page.hasMore); }
    } catch (error) {
      if (currentPublicationRef.current === publicationId) setCommentsError(error instanceof Error ? error.message : t("Não foi possível carregar comentários."));
    } finally {
      pageRequestsRef.current.delete(requestId);
      if (currentPublicationRef.current === publicationId) {
        if (parentId) setReplyPages(current => ({ ...current, [parentId]: { nextCursor: current[parentId]?.nextCursor ?? null, hasMore: current[parentId]?.hasMore ?? true, loading: false } }));
        else setIsLoadingMore(false);
      }
    }
  };

  const submitComment = async (event: React.FormEvent) => {
    event.preventDefault();
    const body = commentBody.trim();
    if (!body || submittingRef.current || pendingComment?.deliveryStatus === "sending") {
      return;
    }
    submittingRef.current = true;
    const parentCommentId = replyToCommentId ?? undefined;
    setIsSubmittingComment(true);
    setCommentBody("");
    setReplyToCommentId(null);
    setCommentsError("");
    try {
      const result = await onSubmitComment(publication.id, body, parentCommentId);
      if (result.incremental && initialReadPendingRef.current) initialReadCreatesRef.current.push(...result.comments);
      if (!result.incremental) commentsVersionRef.current += 1;
      setComments(current => reconcileCommentMutation(current, result));
    } catch (error) {
      setCommentBody(current => current || body);
      setReplyToCommentId(current => current ?? parentCommentId ?? null);
      setCommentsError(error instanceof Error ? error.message : t("Não foi possível enviar o comentário."));
    } finally {
      submittingRef.current = false;
      setIsSubmittingComment(false);
    }
  };

  const saveEdit = async (commentId: number) => {
    const body = editingBody.trim();
    if (!body) {
      return;
    }
    setCommentsError("");
    try {
      const result = await api.updatePublicationComment(publication.id, commentId, { body });
      const nextComments = reconcileCommentMutation(commentsRef.current, result);
      commentsVersionRef.current += 1;
      setComments(nextComments);
      onCommentsChanged?.(publication.id, nextComments);
      setEditingCommentId(null);
      setEditingBody("");
    } catch (error) {
      setCommentsError(error instanceof Error ? error.message : t("Não foi possível editar o comentário."));
    }
  };

  const deleteComment = async (commentId: number) => {
    setCommentsError("");
    try {
      const result = await api.deletePublicationComment(publication.id, commentId);
      const nextComments = reconcileCommentMutation(commentsRef.current, result);
      commentsVersionRef.current += 1;
      setComments(nextComments);
      onCommentsChanged?.(publication.id, nextComments);
    } catch (error) {
      setCommentsError(error instanceof Error ? error.message : t("Não foi possível excluir o comentário."));
    }
  };

  const deletePublication = async () => {
    if (!isOwner || isSavingPublication) {
      return;
    }
    setIsSavingPublication(true);
    setPublicationError("");
    try {
      await api.deletePublication(publication.id);
      onDeleted?.(publication.id);
      onClose();
    } catch (error) {
      setPublicationError(error instanceof Error ? error.message : t("Não foi possível excluir a publicação."));
    } finally {
      setIsSavingPublication(false);
    }
  };

  const renderComment = (comment: ProductCommentDto, isReply = false) => {
    const deliveryStatus = (comment as PendingComment).deliveryStatus;
    const canManage = comment.id > 0 && pendingComment?.deliveryStatus !== "sending" && currentUser?.id === comment.userId;
    const isHighlighted = focusCommentId === comment.id;
    return (
      <div
        key={comment.id}
        ref={isHighlighted ? highlightedCommentRef : null}
        className={`${isReply ? "ml-8 mt-3" : "mt-5"} rounded-lg ${
          isHighlighted ? "bg-amber-400/10 px-3 py-3 ring-1 ring-amber-400/30" : ""
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-neutral-800">
            {comment.authorAvatarUrl ? (
              <ProgressiveProductImage
                src={comment.authorAvatarUrl}
                alt=""
                className="relative h-full w-full object-cover"
                loading="lazy"
                variant="thumbnail"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-neutral-400">
                {comment.authorName.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold text-neutral-100">{comment.authorName}</p>
              <span className="text-[11px] text-neutral-500">
                {formatRelativeTime(comment.createdAt, locale)}
              </span>
            </div>
            {editingCommentId === comment.id ? (
              <div className="mt-2">
                <textarea
                  value={editingBody}
                  onChange={(event) => setEditingBody(event.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-amber-400"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void saveEdit(comment.id)}
                    className="rounded-lg bg-neutral-100 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-950"
                  >
                    {t("Salva")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCommentId(null);
                      setEditingBody("");
                    }}
                    className="rounded-lg border border-neutral-700 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-300"
                  >
                    {t("Annulla")}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-neutral-300"><LinkedText text={comment.body} /></p>
              </div>
            )}
            <div className="mt-2 flex items-center gap-3">
              {!isReply && comment.id > 0 && (
                <button
                  type="button"
                  onClick={() => setReplyToCommentId(comment.id)}
                  className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500 hover:text-amber-400"
                >
                  {t("Rispondi")}
                </button>
              )}
              {canManage && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCommentId(comment.id);
                      setEditingBody(comment.body);
                    }}
                    className="text-neutral-500 transition-colors hover:text-white"
                    aria-label={t("Editar")}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteComment(comment.id)}
                    className="text-neutral-500 transition-colors hover:text-red-400"
                    aria-label={t("Excluir")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
            {deliveryStatus === "sending" && <div role="status" aria-label={t("Enviando comentário")} className="ts-comment-progress mt-2" />}
            {deliveryStatus === "failed" && <p role="alert" className="mt-2 text-xs text-red-600">{t("Não foi possível confirmar o comentário. O texto foi preservado; confira os comentários antes de reenviar.")}</p>}
            {comment.replies.map((reply) => renderComment(reply, true))}
            {comment.id > 0 && (comment.hasReplies !== false || comment.replies.length > 0) && (replyPages[comment.id]?.hasMore ?? true) && (
              <button type="button" disabled={replyPages[comment.id]?.loading} onClick={() => void loadMoreComments(comment.id)}
                className="mt-2 text-xs text-neutral-500 hover:text-sky-600 disabled:opacity-50">
                {replyPages[comment.id]?.loading ? t("Carregando...") : t("Ver respostas")}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const replyTarget = comments.find((comment) => comment.id === replyToCommentId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-130 flex items-end justify-center overscroll-none bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        className="grid h-[100dvh] w-full overflow-hidden bg-neutral-900 shadow-2xl sm:h-[92vh] sm:max-w-5xl sm:rounded-2xl sm:border sm:border-neutral-800 lg:grid-cols-[minmax(0,1.1fr)_380px]"
      >
        <div className="relative h-[42dvh] overflow-hidden bg-neutral-950 sm:h-[58vh] lg:h-[92vh]">
          <ProgressiveProductImage
            src={publication.imageUrl}
            alt={establishment.name}
            loading="eager"
            fetchPriority="high"
            variant="full"
            className="relative h-full w-full object-contain"
          />
        </div>
        <div className="flex min-h-0 flex-1 flex-col border-l border-neutral-800 bg-neutral-900 lg:h-[92vh]">
          <div className="flex shrink-0 items-center justify-between border-b border-neutral-800 px-5 py-4">
            <button
              type="button"
              onClick={openEstablishmentProfile}
              className="flex min-w-0 items-center gap-3 text-left transition-opacity hover:opacity-85"
              title={t("Ver perfil")}
            >
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-neutral-800">
                {establishment.logoUrl ? (
                  <ProgressiveProductImage
                    src={establishment.logoUrl}
                    alt=""
                    className="relative h-full w-full object-cover"
                    loading="eager"
                    variant="thumbnail"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-serif text-lg text-neutral-400">
                    {establishment.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-neutral-100">{establishment.name}</p>
                <p className="truncate text-[11px] uppercase tracking-[0.14em] text-neutral-400">
                  {[establishment.category, establishment.city].filter(Boolean).join(" · ")}
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
              aria-label={t("Fechar")}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
            {publication.caption ? (
              <div>
                <p className="whitespace-pre-wrap text-sm leading-6 text-neutral-200"><LinkedText text={publication.caption} /></p>
              </div>
            ) : (
              <p className="text-sm italic text-neutral-500">{t("Senza didascalia.")}</p>
            )}
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                {formatRelativeTime(publication.createdAt, locale)}
              </p>
              {isOwner && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void deletePublication()}
                    disabled={isSavingPublication}
                    className="rounded-full border border-neutral-700 p-2 text-neutral-400 transition-colors hover:border-red-500/50 hover:text-red-400 disabled:opacity-50"
                    aria-label={t("Excluir publicação")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
            {publicationError && (
              <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {publicationError}
              </p>
            )}
            <div className="mt-6 flex border-b border-neutral-200" role="tablist" aria-label="Interazioni">
              <button type="button" role="tab" aria-selected={interactionTab === 'comments'} onClick={() => setInteractionTab('comments')}
                className={`flex flex-1 items-center justify-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold ${interactionTab === 'comments' ? 'border-sky-600 text-sky-600' : 'border-transparent text-neutral-400'}`}>
                <MessageCircle className="h-4 w-4" />Commenti
              </button>
              <button type="button" role="tab" aria-selected={interactionTab === 'likes'} onClick={() => { setInteractionTab('likes'); setLikesOpened(true); }}
                className={`flex-1 border-b-2 px-3 py-3 text-sm font-semibold ${interactionTab === 'likes' ? 'border-sky-600 text-sky-600' : 'border-transparent text-neutral-400'}`}>
                Mi piace <span className="ml-1 text-xs tabular-nums">{publication.likesCount ?? 0}</span>
              </button>
            </div>
            <div hidden={interactionTab !== 'likes'}>{likesOpened && <PublicationLikes key={publication.id} publicationId={publication.id} />}</div>
            <div hidden={interactionTab !== 'comments'} role="tabpanel" aria-label="Commenti">
            {isLoadingComments && !pendingComment ? (
              <div className="flex items-center gap-2 py-8 text-sm text-neutral-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("Caricamento commenti...")}
              </div>
            ) : visibleComments.length === 0 ? (
              <p className="py-8 text-sm text-neutral-500">{t("Ancora nessun commento.")}</p>
            ) : (
              <div>{visibleComments.map((comment) => renderComment(comment))}</div>
            )}
            {hasMoreComments && (
              <button type="button" disabled={isLoadingMore || isLoadingComments} onClick={() => void loadMoreComments()}
                className="mt-4 rounded-lg border border-neutral-200 px-4 py-2 text-sm text-neutral-500 hover:text-sky-600 disabled:opacity-50">
                {isLoadingMore ? t("Carregando...") : t("Carregar mais comentários")}
              </button>
            )}
            {commentsError && (
              <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {commentsError}
              </p>
            )}
            </div>
          </div>
          <form hidden={interactionTab !== 'comments'} onSubmit={submitComment} className="shrink-0 border-t border-neutral-800 bg-neutral-900/98 p-3 shadow-[0_-12px_30px_rgba(0,0,0,0.25)] sm:p-4">
            {replyTarget && (
              <div className="mb-3 flex items-center justify-between rounded-lg bg-neutral-800 px-3 py-2 text-xs text-neutral-300">
                <span>{t("Risposta a")} {replyTarget.authorName}</span>
                <button type="button" onClick={() => setReplyToCommentId(null)} className="font-semibold">
                  {t("Annulla")}
                </button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <textarea
                value={commentBody}
                onChange={(event) => setCommentBody(event.target.value)}
                rows={1}
                placeholder={t("Scrivi un commento...")}
                className="min-h-11 flex-1 resize-none rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-3 text-base text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-amber-400 sm:text-sm"
              />
              <button
                type="submit"
                disabled={isSubmittingComment || pendingComment?.deliveryStatus === "sending" || !commentBody.trim()}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-100 text-neutral-950 transition-colors hover:bg-white disabled:bg-neutral-800 disabled:text-neutral-500"
                aria-label={t("Invia")}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}
