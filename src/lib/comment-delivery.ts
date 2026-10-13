import type { ProductCommentDto, SessionUser, CommentMutationResult } from "./api";

export type PendingComment = ProductCommentDto & { deliveryStatus: "sending" | "failed" };
let nextTemporaryId = -1;

export function pendingComment(publicationId: number, body: string, user: SessionUser | null, parentCommentId?: number): PendingComment {
  return { id: nextTemporaryId--, publicationId, body, parentCommentId, userId: user?.id ?? -1,
    authorName: user?.name || "Você", authorAvatarUrl: user?.avatarUrl,
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
  const incoming = result.comments[0];
  if (!incoming) return items;
  const remove = (comments: ProductCommentDto[]): ProductCommentDto[] => comments
    .filter(comment => comment.id !== incoming.id)
    .map(comment => ({ ...comment, replies: remove(comment.replies) }));
  return withPendingComment(remove(items), incoming);
}

export function previewComments(items: ProductCommentDto[]): ProductCommentDto[] {
  const flat: ProductCommentDto[] = [];
  const visit = (comments: ProductCommentDto[]) => comments.forEach(comment => {
    flat.push({ ...comment, replies: [] }); visit(comment.replies);
  });
  visit(items);
  return flat.sort((a, b) => b.createdAt - a.createdAt || b.id - a.id).slice(0, 2);
}
