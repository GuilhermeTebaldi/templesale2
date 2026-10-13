export type CommentCursor = { createdAt: number; id: number };
export function parseCommentCursor(value: unknown): CommentCursor | undefined {
  if (value === undefined || value === '') return;
  try {
    if (typeof value !== 'string' || value.length > 256 || !/^[\w-]+$/.test(value)) throw new Error();
    const cursor = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
    if (!Number.isSafeInteger(cursor.id) || cursor.id <= 0 || !Number.isSafeInteger(cursor.createdAt) || cursor.createdAt < 0) throw new Error();
    return { id: cursor.id, createdAt: cursor.createdAt };
  } catch { throw new Error('Cursor de comentários inválido.'); }
}
export function encodeCommentCursor(row: { created_at: number; id: number }): string {
  return Buffer.from(JSON.stringify({ createdAt: row.created_at, id: row.id })).toString('base64url');
}
