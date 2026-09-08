import React from "react";
import { motion } from "motion/react";
import { Loader2, MessageCircle, Pencil, Send, Trash2, X } from "lucide-react";
import { api, type EstablishmentDto, type ProductCommentDto, type PublicationDto, type SessionUser } from "../lib/api";
import { formatRelativeTime } from "../i18n/formatters";
import { useI18n } from "../i18n/provider";
import { ProgressiveProductImage } from "./ProductCard";

interface PublicationViewerProps {
  publication: PublicationDto;
  establishment: EstablishmentDto;
  currentUser: SessionUser | null;
  focusCommentId?: number | null;
  onClose: () => void;
  onRequireAuth: () => void;
  onUpdated?: (publication: PublicationDto) => void;
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
  focusCommentId,
  onClose,
  onRequireAuth,
  onUpdated,
  onDeleted,
  onCommentsChanged,
}: PublicationViewerProps) {
  const { t, locale } = useI18n();
  const [comments, setComments] = React.useState<ProductCommentDto[]>([]);
  const [commentBody, setCommentBody] = React.useState("");
  const [replyToCommentId, setReplyToCommentId] = React.useState<number | null>(null);
  const [editingCommentId, setEditingCommentId] = React.useState<number | null>(null);
  const [editingBody, setEditingBody] = React.useState("");
  const [isLoadingComments, setIsLoadingComments] = React.useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = React.useState(false);
  const [commentsError, setCommentsError] = React.useState("");
  const [isEditingPublication, setIsEditingPublication] = React.useState(false);
  const [publicationCaption, setPublicationCaption] = React.useState(publication.caption);
  const [isSavingPublication, setIsSavingPublication] = React.useState(false);
  const [publicationError, setPublicationError] = React.useState("");
  const highlightedCommentRef = React.useRef<HTMLDivElement | null>(null);
  const isOwner = currentUser?.id === publication.ownerId;

  React.useEffect(() => {
    setPublicationCaption(publication.caption);
    setIsEditingPublication(false);
    setPublicationError("");
  }, [publication.id, publication.caption]);

  React.useEffect(() => {
    let isActive = true;
    setIsLoadingComments(true);
    setCommentsError("");
    api
      .getPublicationComments(publication.id)
      .then((items) => {
        if (isActive) {
          setComments(items);
        }
      })
      .catch((error) => {
        if (isActive) {
          setCommentsError(error instanceof Error ? error.message : t("Não foi possível carregar comentários."));
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingComments(false);
        }
      });
    return () => {
      isActive = false;
    };
  }, [publication.id, t]);

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

  const submitComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    const body = commentBody.trim();
    if (!body || isSubmittingComment) {
      return;
    }
    setIsSubmittingComment(true);
    setCommentsError("");
    try {
      const nextComments = await api.createPublicationComment(publication.id, {
        body,
        parentCommentId: replyToCommentId ?? undefined,
      });
      setComments(nextComments);
      onCommentsChanged?.(publication.id, nextComments);
      setCommentBody("");
      setReplyToCommentId(null);
    } catch (error) {
      setCommentsError(error instanceof Error ? error.message : t("Não foi possível enviar o comentário."));
    } finally {
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
      const nextComments = await api.updatePublicationComment(publication.id, commentId, { body });
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
      const nextComments = await api.deletePublicationComment(publication.id, commentId);
      setComments(nextComments);
      onCommentsChanged?.(publication.id, nextComments);
    } catch (error) {
      setCommentsError(error instanceof Error ? error.message : t("Não foi possível excluir o comentário."));
    }
  };

  const savePublication = async () => {
    if (!isOwner || isSavingPublication) {
      return;
    }
    setIsSavingPublication(true);
    setPublicationError("");
    try {
      const updated = await api.updatePublication(publication.id, {
        caption: publicationCaption.trim(),
        media: publication.media,
      });
      onUpdated?.(updated);
      setIsEditingPublication(false);
    } catch (error) {
      setPublicationError(error instanceof Error ? error.message : t("Não foi possível atualizar a publicação."));
    } finally {
      setIsSavingPublication(false);
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
    const canManage = currentUser?.id === comment.userId;
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
          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-neutral-800">
            {comment.authorAvatarUrl ? (
              <img src={comment.authorAvatarUrl} alt="" className="h-full w-full object-cover" />
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
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-neutral-300">{comment.body}</p>
            )}
            <div className="mt-2 flex items-center gap-3">
              {!isReply && isOwner && currentUser && (
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
            {comment.replies.map((reply) => renderComment(reply, true))}
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
      className="fixed inset-0 z-130 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-6"
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
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-neutral-800">
                {establishment.logoUrl ? (
                  <img src={establishment.logoUrl} alt="" className="h-full w-full object-cover" />
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
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
              aria-label={t("Fechar")}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            {isEditingPublication ? (
              <div>
                <textarea
                  value={publicationCaption}
                  onChange={(event) => setPublicationCaption(event.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-3 text-sm leading-6 text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-amber-400"
                />
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void savePublication()}
                    disabled={isSavingPublication}
                    className="rounded-lg bg-neutral-100 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-950 disabled:bg-neutral-700 disabled:text-neutral-400"
                  >
                    {isSavingPublication ? t("Salvando...") : t("Salva")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPublicationCaption(publication.caption);
                      setIsEditingPublication(false);
                    }}
                    className="rounded-lg border border-neutral-700 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-300"
                  >
                    {t("Annulla")}
                  </button>
                </div>
              </div>
            ) : publication.caption ? (
              <p className="whitespace-pre-wrap text-sm leading-6 text-neutral-200">{publication.caption}</p>
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
                    onClick={() => setIsEditingPublication(true)}
                    className="rounded-full border border-neutral-700 p-2 text-neutral-400 transition-colors hover:border-neutral-500 hover:text-white"
                    aria-label={t("Editar publicação")}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
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
            <div className="mt-8 flex items-center gap-2 border-t border-neutral-800 pt-5">
              <MessageCircle className="h-4 w-4 text-neutral-400" />
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-400">
                {t("Commenti")}
              </p>
            </div>
            {isLoadingComments ? (
              <div className="flex items-center gap-2 py-8 text-sm text-neutral-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("Caricamento commenti...")}
              </div>
            ) : comments.length === 0 ? (
              <p className="py-8 text-sm text-neutral-500">{t("Ancora nessun commento.")}</p>
            ) : (
              <div>{comments.map((comment) => renderComment(comment))}</div>
            )}
            {commentsError && (
              <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {commentsError}
              </p>
            )}
          </div>
          <form onSubmit={submitComment} className="shrink-0 border-t border-neutral-800 bg-neutral-900/98 p-3 shadow-[0_-12px_30px_rgba(0,0,0,0.25)] sm:p-4">
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
                placeholder={currentUser ? t("Scrivi un commento...") : t("Accedi per commentare")}
                className="min-h-11 flex-1 resize-none rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-3 text-base text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-amber-400 sm:text-sm"
              />
              <button
                type="submit"
                disabled={isSubmittingComment || !commentBody.trim()}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-100 text-neutral-950 transition-colors hover:bg-white disabled:bg-neutral-800 disabled:text-neutral-500"
                aria-label={t("Invia")}
              >
                {isSubmittingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}
