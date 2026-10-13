export type CommentCursor = { createdAt: number; id: number; rawCreatedAt?: string };
export function parseCommentCursor(value: unknown): CommentCursor | undefined {
  if (value === undefined || value === '') return;
  try {
    if (typeof value !== 'string' || value.length > 256 || !/^[\w-]+$/.test(value)) throw new Error();
    const cursor = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
    if (!Number.isSafeInteger(cursor.id) || cursor.id <= 0 || !Number.isSafeInteger(cursor.createdAt) || cursor.createdAt < 0) throw new Error();
    if (cursor.rawCreatedAt !== undefined && (typeof cursor.rawCreatedAt !== 'string' || cursor.rawCreatedAt.length > 64 || !/^[\d .:+TZ-]+$/.test(cursor.rawCreatedAt))) throw new Error();
    return { id: cursor.id, createdAt: cursor.createdAt, rawCreatedAt: cursor.rawCreatedAt };
  } catch { throw new Error('Cursor de comentários inválido.'); }
}
export function encodeCommentCursor(row: { created_at: number; id: number; cursor_created_at?: string }): string {
  return Buffer.from(JSON.stringify({ createdAt: row.created_at, id: row.id, rawCreatedAt: row.cursor_created_at })).toString('base64url');
}
