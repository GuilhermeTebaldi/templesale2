import type { ProductCommentDto, SessionUser, CommentMutationResult } from "./api";

export type PendingComment = ProductCommentDto & { deliveryStatus: "sending" | "failed" };
let nextTemporaryId = -1;

export function pendingComment(publicationId: number, body: string, user: SessionUser | null, parentCommentId?: number): PendingComment {
  return { id: nextTemporaryId--, publicationId, body, parentCommentId, userId: user?.id ?? -1,
    authorName: user?.name || "Tu", authorAvatarUrl: user?.avatarUrl,
    createdAt: Math.floor(Date.now() / 1000), replies: [], deliveryStatus: "sending" };
}

// Keep drafts separate from server state so refreshes cannot erase unconfirmed sends.
export function withPendingComment(items: ProductCommentDto[], draft?: ProductCommentDto | PendingComment): ProductCommentDto[] {
  if (!draft) return items;
  if (!draft.parentCommentId) return [draft, ...items];
  let found = false;
  const attach = (comments: ProductCommentDto[]): ProductCommentDto[] => comments.map(comment => {
    if (comment.id === draft.parentCommentId) {
      found = true;
      return { ...comment, replies: [...comment.replies, draft] };
    }
    return { ...comment, replies: attach(comment.replies) };
  });
  const merged = attach(items);
  return found ? merged : [draft, ...items];
}

export function reconcileCommentMutation(items: ProductCommentDto[], result: CommentMutationResult): ProductCommentDto[] {
  if (!result.incremental) return result.comments;
  if (result.deletedId !== undefined) {
    const remove = (comments: ProductCommentDto[]): ProductCommentDto[] => comments.filter(comment => comment.id !== result.deletedId)
      .map(comment => ({ ...comment, replies: remove(comment.replies) }));
    return remove(items);
  }
  const incoming = result.comments[0];
  if (!incoming) return items;
  let found = false;
  const replace = (comments: ProductCommentDto[]): ProductCommentDto[] => comments.map(comment => {
    if (comment.id === incoming.id) { found = true; return { ...comment, ...incoming, replies: mergeCommentPages(comment.replies, incoming.replies) }; }
    return { ...comment, replies: replace(comment.replies) };
  });
  const next = replace(items);
  return found ? next : withPendingComment(items, incoming);
}

export function mergeCommentPages(items: ProductCommentDto[], page: ProductCommentDto[]): ProductCommentDto[] {
  let next = items;
  for (const incoming of page) {
    let found = false;
    const merge = (comments: ProductCommentDto[]): ProductCommentDto[] => comments.map(comment => {
      if (comment.id === incoming.id) { found = true; return { ...comment, ...incoming, replies: mergeCommentPages(comment.replies, incoming.replies) }; }
      if (comment.id === incoming.parentCommentId) { found = true; return { ...comment, replies: mergeCommentPages(comment.replies, [incoming]) }; }
      return { ...comment, replies: merge(comment.replies) };
    });
    const merged = merge(next);
    next = found ? merged : [...next, incoming];
  }
  return next;
}

export function previewComments(items: ProductCommentDto[]): ProductCommentDto[] {
  const flat: ProductCommentDto[] = [];
  const visit = (comments: ProductCommentDto[]) => comments.forEach(comment => {
    flat.push({ ...comment, replies: [] }); visit(comment.replies);
  });
  visit(items);
  return flat.sort((a, b) => b.createdAt - a.createdAt || b.id - a.id).slice(0, 2);
}
