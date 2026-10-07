export function validateAccountClosure(user: { email: string }, identity: { sub?: string; email?: string; email_verified?: boolean }, expectedSub: string | null, input: Record<string, unknown>): "deactivate" | "delete" {
  if (!expectedSub || identity.sub !== expectedSub || identity.email_verified !== true ||
    String(identity.email ?? "").trim().toLowerCase() !== user.email.trim().toLowerCase()) {
    throw new Error("Confirme seu e-mail e entre com a mesma conta Auth0.");
  }
  if ((input.mode !== "deactivate" && input.mode !== "delete") || input.confirmation !== user.email) {
    throw new Error("Escolha a operação e confirme o e-mail da sua conta.");
  }
  return input.mode;
}

type Row = Record<string, any>;
type Query = (sql: string, values?: unknown[]) => Promise<Row[]>;
type Statement = { sql: string; values: unknown[] };
type Transaction = (statements: Statement[]) => Promise<void>;
const owners = { users: 'id', products: 'user_id', establishments: 'owner_user_id', establishment_publications: 'owner_user_id' } as const;
export function publicAccountRows(table: keyof typeof owners, ready = false): string {
  return ready ? `(SELECT * FROM ${table} WHERE NOT EXISTS (SELECT 1 FROM account_archives aa WHERE aa.user_id = ${table}.${owners[table]}))` : table;
}
export function filterArchivedPublicSql(sql: string, ready = true): string {
  return sql.replace(/\b(FROM|JOIN) (users|products|establishments|establishment_publications)\b/g,
    (_, clause, table: keyof typeof owners, offset: number) => {
      const rest = sql.slice(offset + _.length);
      const hasAlias = /^\s+[a-z][a-z_]*\b/.test(rest);
      return `${clause} ${publicAccountRows(table, ready)}${ready && !hasAlias ? ` AS ${table}` : ""}`;
    });
}
export function createAccountArchiveService(query: Query, transaction: Transaction, postgres: boolean) {
  let ready = false;
  return {
    get ready() { return ready; },
    async initialize(readOnly = false) {
      if (readOnly) {
        // Never create or modify schema when development uses a read-only remote database.
        try { await query('SELECT user_id FROM account_archives LIMIT 0'); ready = true; } catch { ready = false; }
        return;
      }
      await query(`CREATE TABLE IF NOT EXISTS account_archives (
        user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        identity_sub TEXT NOT NULL, archived_at TEXT NOT NULL, company_states TEXT NOT NULL
      )`);
      ready = true;
    },
    async archived(userId: number) {
      return ready && (await query('SELECT user_id FROM account_archives WHERE user_id = $1', [userId])).length > 0;
    },
    async archive(userId: number) {
      if (!ready) throw new Error('Desativação indisponível neste ambiente.');
      const user = (await query('SELECT id, auth0_sub FROM users WHERE id = $1', [userId]))[0];
      if (!user) return false;
      const states = await query('SELECT id, is_active FROM establishments WHERE owner_user_id = $1', [userId]);
      await transaction([
        { sql: `INSERT INTO account_archives(user_id, identity_sub, archived_at, company_states)
          VALUES($1, $2, $3, $4) ON CONFLICT(user_id) DO NOTHING`,
          values: [userId, user.auth0_sub ?? '', new Date().toISOString(), JSON.stringify(states)] },
        { sql: `UPDATE establishments SET is_active = ${postgres ? 'FALSE' : '0'} WHERE owner_user_id = $1`, values: [userId] },
        { sql: 'DELETE FROM sessions WHERE user_id = $1', values: [userId] },
      ]);
      return true;
    },
    async restore(userId: number, identity: { sub?: string; email_verified?: boolean }) {
      if (!ready) return false;
      const archive = (await query('SELECT * FROM account_archives WHERE user_id = $1', [userId]))[0];
      if (!archive) return false;
      if (!archive.identity_sub || identity.sub !== archive.identity_sub || identity.email_verified !== true) {
        throw new Error('Para recuperar esta empresa, entre com a mesma conta Auth0 e confirme seu e-mail.');
      }
      const states = JSON.parse(archive.company_states) as Row[];
      await transaction([
        ...states.map(state => ({ sql: `UPDATE establishments SET is_active = $1 WHERE id = $2 AND owner_user_id = $3
          AND EXISTS (SELECT 1 FROM account_archives WHERE user_id = $3 AND identity_sub = $4)`,
          values: [postgres ? Boolean(state.is_active) : Number(Boolean(state.is_active)), state.id, userId, identity.sub] })),
        { sql: 'DELETE FROM account_archives WHERE user_id = $1 AND identity_sub = $2', values: [userId, identity.sub] },
      ]);
      return true;
    },
    async purge(userId: number) {
      if (!ready) throw new Error('Exclusão indisponível neste ambiente.');
      if (!(await query('SELECT id FROM users WHERE id = $1', [userId])).length) return false;
      const tables = new Set((await query(postgres
        ? "SELECT table_name AS name FROM information_schema.tables WHERE table_schema = ANY(current_schemas(false))"
        : "SELECT name FROM sqlite_master WHERE type = 'table'")).map(row => row.name));
      const ownedProducts = 'SELECT id FROM products WHERE user_id = $1 OR establishment_id IN (SELECT id FROM establishments WHERE owner_user_id = $1)';
      const ownedPublications = 'SELECT id FROM establishment_publications WHERE owner_user_id = $1 OR establishment_id IN (SELECT id FROM establishments WHERE owner_user_id = $1)';
      const conditions: [string, string][] = [
        ['product_likes', `user_id = $1 OR product_id IN (${ownedProducts})`],
        ['publication_saves', `user_id = $1 OR publication_id IN (${ownedPublications})`],
        ['publication_likes', `user_id = $1 OR publication_id IN (${ownedPublications})`],
        ['product_cart_notifications', `owner_user_id = $1 OR actor_user_id = $1 OR product_id IN (${ownedProducts})`],
        ['product_comments', `user_id = $1 OR product_id IN (${ownedProducts}) OR publication_id IN (${ownedPublications})`],
        ['notification_dismissals', 'owner_user_id = $1'],
        ['admin_broadcast_notifications', `recipient_user_id = $1 OR product_id IN (${ownedProducts}) OR publication_id IN (${ownedPublications})`],
        ['legal_acceptances', 'user_id = $1'],
        ['account_archives', 'user_id = $1'],
        ['sessions', 'user_id = $1'],
        ['products', `user_id = $1 OR establishment_id IN (SELECT id FROM establishments WHERE owner_user_id = $1)`],
        ['establishment_publications', 'owner_user_id = $1 OR establishment_id IN (SELECT id FROM establishments WHERE owner_user_id = $1)'],
        ['storefront_sections', 'establishment_id IN (SELECT id FROM establishments WHERE owner_user_id = $1)'],
        ['establishments', 'owner_user_id = $1'],
        ['users', 'id = $1'],
      ];
      await transaction(conditions.filter(([table]) => tables.has(table)).map(([table, condition]) => ({
        sql: `DELETE FROM ${table} WHERE ${condition}`, values: [userId],
      })));
      return true;
    },
    publicQuery(sql: string, values: unknown[] = []) { return query(filterArchivedPublicSql(sql, ready), values); },
  };
}
