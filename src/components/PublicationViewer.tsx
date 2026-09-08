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
          isHighlighted ? "bg-amber-50 px-3 py-3" : ""
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-stone-100">
            {comment.authorAvatarUrl ? (
              <img src={comment.authorAvatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-stone-400">
                {comment.authorName.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold text-stone-950">{comment.authorName}</p>
              <span className="text-[11px] text-stone-400">
                {formatRelativeTime(comment.createdAt, locale)}
              </span>
            </div>
            {editingCommentId === comment.id ? (
              <div className="mt-2">
                <textarea
                  value={editingBody}
                  onChange={(event) => setEditingBody(event.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-stone-700"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void saveEdit(comment.id)}
                    className="rounded-lg bg-stone-950 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white"
                  >
                    {t("Salva")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCommentId(null);
                      setEditingBody("");
                    }}
                    className="rounded-lg border border-stone-200 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-stone-600"
                  >
                    {t("Annulla")}
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-stone-700">{comment.body}</p>
            )}
            <div className="mt-2 flex items-center gap-3">
              {!isReply && isOwner && currentUser && (
                <button
                  type="button"
                  onClick={() => setReplyToCommentId(comment.id)}
                  className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500 hover:text-stone-900"
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
                    className="text-stone-400 transition-colors hover:text-stone-900"
                    aria-label={t("Editar")}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteComment(comment.id)}
                    className="text-stone-400 transition-colors hover:text-red-600"
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
        className="grid max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl lg:grid-cols-[minmax(0,1.1fr)_380px]"
      >
        <div className="relative h-[42vh] overflow-hidden bg-stone-950 sm:h-[58vh] lg:h-[92vh]">
          <ProgressiveProductImage
            src={publication.imageUrl}
            alt={establishment.name}
            loading="eager"
            fetchPriority="high"
            variant="full"
            className="relative h-full w-full object-contain"
          />
        </div>
        <div className="flex max-h-[50vh] flex-col border-l border-stone-100 bg-[#fdfcfb] lg:max-h-[92vh]">
          <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-stone-100">
                {establishment.logoUrl ? (
                  <img src={establishment.logoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-serif text-lg text-stone-400">
                    {establishment.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-stone-950">{establishment.name}</p>
                <p className="truncate text-[11px] uppercase tracking-[0.14em] text-stone-400">
                  {[establishment.category, establishment.city].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
              aria-label={t("Fechar")}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-5">
            {isEditingPublication ? (
              <div>
                <textarea
                  value={publicationCaption}
                  onChange={(event) => setPublicationCaption(event.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-lg border border-stone-200 bg-white px-3 py-3 text-sm leading-6 text-stone-800 outline-none focus:border-stone-700"
                />
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void savePublication()}
                    disabled={isSavingPublication}
                    className="rounded-lg bg-stone-950 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white disabled:bg-stone-300"
                  >
                    {isSavingPublication ? t("Salvando...") : t("Salva")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPublicationCaption(publication.caption);
                      setIsEditingPublication(false);
                    }}
                    className="rounded-lg border border-stone-200 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-stone-600"
                  >
                    {t("Annulla")}
                  </button>
                </div>
              </div>
            ) : publication.caption ? (
              <p className="whitespace-pre-wrap text-sm leading-6 text-stone-800">{publication.caption}</p>
            ) : (
              <p className="text-sm italic text-stone-400">{t("Senza didascalia.")}</p>
            )}
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-stone-400">
                {formatRelativeTime(publication.createdAt, locale)}
              </p>
              {isOwner && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingPublication(true)}
                    className="rounded-full border border-stone-200 p-2 text-stone-500 transition-colors hover:border-stone-700 hover:text-stone-950"
                    aria-label={t("Editar publicação")}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void deletePublication()}
                    disabled={isSavingPublication}
                    className="rounded-full border border-stone-200 p-2 text-stone-500 transition-colors hover:border-red-200 hover:text-red-600 disabled:opacity-50"
                    aria-label={t("Excluir publicação")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
            {publicationError && (
              <p className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {publicationError}
              </p>
            )}
            <div className="mt-8 flex items-center gap-2 border-t border-stone-100 pt-5">
              <MessageCircle className="h-4 w-4 text-stone-400" />
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-500">
                {t("Commenti")}
              </p>
            </div>
            {isLoadingComments ? (
              <div className="flex items-center gap-2 py-8 text-sm text-stone-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("Caricamento commenti...")}
              </div>
            ) : comments.length === 0 ? (
              <p className="py-8 text-sm text-stone-400">{t("Ancora nessun commento.")}</p>
            ) : (
              <div>{comments.map((comment) => renderComment(comment))}</div>
            )}
            {commentsError && (
              <p className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {commentsError}
              </p>
            )}
          </div>
          <form onSubmit={submitComment} className="border-t border-stone-100 p-4">
            {replyTarget && (
              <div className="mb-3 flex items-center justify-between rounded-lg bg-stone-100 px-3 py-2 text-xs text-stone-600">
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
                className="min-h-11 flex-1 resize-none rounded-lg border border-stone-200 bg-white px-3 py-3 text-sm outline-none focus:border-stone-700"
              />
              <button
                type="submit"
                disabled={isSubmittingComment || !commentBody.trim()}
                className="flex h-11 w-11 items-center justify-center rounded-lg bg-stone-950 text-white transition-colors hover:bg-black disabled:bg-stone-300"
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
