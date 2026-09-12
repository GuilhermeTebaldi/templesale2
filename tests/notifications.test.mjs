import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';

const server = readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
const section = server.slice(server.indexOf('async function selectNotificationsByOwnerRows'), server.indexOf('async function createProductRecord'));
const queries = [...section.matchAll(/`([\s\S]*?)`/g)].map(match => match[1]);
const sql = queries[1];
function fixture() {
  const db = new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE users (id INTEGER, name TEXT, avatar_url TEXT, city TEXT, country TEXT, preferred_locale TEXT, created_at INTEGER);
    CREATE TABLE products (id INTEGER, user_id INTEGER, name TEXT, image TEXT, image_url TEXT);
    CREATE TABLE establishments (id INTEGER, name TEXT, logo_url TEXT, cover_url TEXT);
    CREATE TABLE establishment_publications (id INTEGER, owner_user_id INTEGER, establishment_id INTEGER, caption TEXT, image_url TEXT);
    CREATE TABLE product_likes (user_id INTEGER, product_id INTEGER, created_at INTEGER);
    CREATE TABLE publication_likes (user_id INTEGER, publication_id INTEGER, created_at INTEGER);
    CREATE TABLE product_cart_notifications (id INTEGER, actor_user_id INTEGER, owner_user_id INTEGER, actor_name TEXT, product_id INTEGER, created_at INTEGER);
    CREATE TABLE product_comments (id INTEGER, user_id INTEGER, product_id INTEGER, publication_id INTEGER, parent_comment_id INTEGER, created_at INTEGER);
    CREATE TABLE admin_broadcast_notifications (id INTEGER, title TEXT, message TEXT, product_id INTEGER, publication_id INTEGER, recipient_user_id INTEGER, created_at INTEGER, title_translations TEXT, message_translations TEXT);
    CREATE TABLE notification_dismissals (owner_user_id INTEGER, event_id TEXT);
    INSERT INTO users VALUES (1, 'Author', '', '', '', 'pt-BR', 1), (2, 'Visitor', '', '', '', 'pt-BR', 1), (3, 'Other', '', '', '', 'pt-BR', 1);
    INSERT INTO products VALUES (10, 1, 'Product', '', '');
    INSERT INTO establishments VALUES (20, 'Profile', '', '');
    INSERT INTO establishment_publications VALUES (30, 1, 20, 'Photo', '');
    INSERT INTO publication_likes VALUES (2, 30, 100), (1, 30, 101);
    INSERT INTO product_likes VALUES (2, 10, 102);
    INSERT INTO product_comments VALUES (40, 2, NULL, 30, NULL, 103), (41, 2, 10, NULL, NULL, 104), (42, 1, NULL, 30, 40, 105);
    INSERT INTO admin_broadcast_notifications VALUES (50, 'Notice', 'Text only', NULL, NULL, NULL, 106, NULL, NULL), (51, 'Photo', 'Linked', NULL, 30, 1, 107, NULL, NULL);
  `);
  return db;
}
const list = (db, owner) => db.prepare(sql).all(...Array((sql.match(/\?/g) || []).length).fill(owner));

test('both SQL variants combine every notification branch', () => {
  assert.equal(queries.length, 2);
  for (const query of queries) assert.equal((query.match(/UNION ALL/g) || []).length, 7);
  const args = section.match(/\.all\(([\s\S]*?)\) as/)[1].match(/ownerId/g);
  assert.equal(args.length, (sql.match(/\?/g) || []).length);
});
test('author receives likes/comments and admin messages, not own activity', () => {
  const db = fixture();
  try {
    const rows = list(db, 1);
    for (const type of ['publication_like', 'product_like', 'publication_comment', 'product_comment', 'admin_broadcast'])
      assert.ok(rows.some(row => row.type === type), type);
    assert.ok(rows.every(row => row.actor_user_id !== 1));
    assert.equal(rows.find(row => row.type === 'publication_like').publication_id, 30);
    assert.equal(rows.find(row => row.type === 'publication_comment').comment_id, 40);
    assert.equal(rows.find(row => row.event_id === 'admin_broadcast:51').publication_id, 30);
    assert.equal(rows.find(row => row.event_id === 'admin_broadcast:50').publication_id, null);
    assert.ok(list(db, 2).some(row => row.event_id === 'publication_comment_reply:42'));
    assert.ok(list(db, 3).every(row => row.type === 'admin_broadcast'));
  } finally { db.close(); }
});
test('dismissing one notification does not hide the entire list', () => {
  const db = fixture();
  try {
    const before = list(db, 1);
    db.prepare('INSERT INTO notification_dismissals VALUES (?, ?)').run(1, before[0].event_id);
    const after = list(db, 1);
    assert.equal(after.length, before.length - 1);
    assert.ok(!after.some(row => row.event_id === before[0].event_id));
  } finally { db.close(); }
});
test('popover owns outside click; internal actions are not whole-row links', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  const popover = readFileSync(new URL('../src/components/NotificationsPopover.tsx', import.meta.url), 'utf8');
  assert.ok(!app.includes('notificationsPanelRef'));
  assert.ok(!app.includes('notificationsButtonRef'));
  assert.ok(popover.includes('if (event.target === event.currentTarget) onClose();'));
  assert.ok(popover.includes('onClick={(event) => event.stopPropagation()}'));
  assert.ok(!popover.includes("role={canOpen ? 'button'"));
  assert.ok(popover.includes('onClick={() => onSelectNotification(notification)}'));
  assert.ok(!popover.includes("document.body.style.touchAction = 'none'"));
});

