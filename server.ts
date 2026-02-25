import cors from "cors";
import crypto from "node:crypto";
import Database from "better-sqlite3";
import dotenv from "dotenv";
import express, { type Request, type Response } from "express";
import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";

type ProductRecord = {
  id: number;
  name: string;
  category: string;
  price: string;
  quantity?: number;
  image: string;
  images: string[];
  description?: string;
  details?: Record<string, string>;
  ownerId?: number;
  latitude?: number;
  longitude?: number;
  sellerName?: string;
  sellerWhatsappCountryIso?: string;
  sellerWhatsappNumber?: string;
};

type ProductRow = {
  id: number;
  name: string;
  category: string;
  price: string;
  quantity: number;
  image: string;
  images: string;
  description: string | null;
  details: string | null;
  user_id: number | null;
  latitude: number | null;
  longitude: number | null;
  seller_name: string | null;
  seller_whatsapp_country_iso: string | null;
  seller_whatsapp_number: string | null;
};

type LikeNotificationRow = {
  actor_user_id: number;
  actor_name: string;
  product_id: number;
  product_name: string;
  created_at: number;
};

type NotificationRecord = {
  id: string;
  type: "product_like";
  title: string;
  message: string;
  createdAt: number;
  actorUserId: number;
  productId: number;
};

type UserRow = {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  password_salt: string;
  avatar_url: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  neighborhood: string | null;
  street: string | null;
  whatsapp_country_iso: string | null;
  whatsapp_number: string | null;
};

type SessionUser = {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string;
  country?: string;
  state?: string;
  city?: string;
  neighborhood?: string;
  street?: string;
  whatsappCountryIso?: string;
  whatsappNumber?: string;
};

type PublicVendorRecord = {
  id: number;
  name: string;
  avatarUrl?: string;
  productCount: number;
};

type AdminSessionUser = {
  email: string;
};

type AdminUserRecord = {
  id: number;
  name: string;
  email: string;
  username?: string;
  phone?: string;
  country?: string;
  city?: string;
  productCount: number;
  createdAt?: string;
};

type NormalizedProductInput = {
  name: string;
  category: string;
  price: string;
  quantity: number;
  image: string;
  images: string;
  description: string;
  details: string;
  latitude: number;
  longitude: number;
};

type UserProfileUpdateInput = {
  id: number;
  name: string;
  country: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  whatsapp_country_iso: string;
  whatsapp_number: string;
};

type VendorRow = {
  id: number;
  name: string;
  avatar_url: string | null;
  product_count: number;
};

type SessionUserRow = Pick<
  UserRow,
  | "id"
  | "name"
  | "email"
  | "avatar_url"
  | "country"
  | "state"
  | "city"
  | "neighborhood"
  | "street"
  | "whatsapp_country_iso"
  | "whatsapp_number"
>;

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DB_DIR, "local.db");
const DATABASE_URL = String(process.env.DATABASE_URL ?? "").trim();
if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is required. Configure the Render PostgreSQL URL to start the backend.",
  );
}
const DEFAULT_IMAGE = "https://picsum.photos/seed/placeholder/800/1200";
const CLOUDINARY_CLOUD_NAME = String(process.env.CLOUDINARY_CLOUD_NAME ?? "").trim();
const CLOUDINARY_API_KEY = String(process.env.CLOUDINARY_API_KEY ?? "").trim();
const CLOUDINARY_API_SECRET = String(process.env.CLOUDINARY_API_SECRET ?? "").trim();
const CLOUDINARY_UPLOAD_FOLDER =
  String(process.env.CLOUDINARY_UPLOAD_FOLDER ?? "").trim() || "templesale/products";
const CLOUDINARY_PROFILE_UPLOAD_FOLDER =
  String(process.env.CLOUDINARY_PROFILE_UPLOAD_FOLDER ?? "").trim() ||
  `${CLOUDINARY_UPLOAD_FOLDER.replace(/\/+$/, "")}/profiles`;
const CLEAN_LOCAL_PRODUCTS_ON_BOOT =
  String(process.env.CLEAN_LOCAL_PRODUCTS_ON_BOOT ?? "true").toLowerCase() === "true";
const SESSION_COOKIE_NAME = "templesale_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL ?? "templesale@admin.com")
  .trim()
  .toLowerCase();
const ADMIN_PASSWORD = String(process.env.ADMIN_PASSWORD ?? "Gui@1604").trim();
const ADMIN_SESSION_COOKIE_NAME = "templesale_admin_session";
const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 12;
const ADMIN_SESSION_SECRET = String(
  process.env.ADMIN_SESSION_SECRET ?? "templesale_admin_secret",
).trim();
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAP_TILE_PROVIDER_TEMPLATES = [
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  "https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
  "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
] as const;
const MAP_TILE_MIN_ZOOM = 0;
const MAP_TILE_MAX_ZOOM = 20;
const MAP_TILE_FETCH_TIMEOUT_MS = 4500;
const MAP_TILE_CACHE_CONTROL = "public, max-age=21600, stale-while-revalidate=43200";
const UPLOAD_MAX_BYTES = 12 * 1024 * 1024;
const WHATSAPP_COUNTRIES = {
  IT: {
    iso: "IT",
    name: "Italia",
    dialDigits: "39",
  },
} as const;

type WhatsappCountryIso = keyof typeof WHATSAPP_COUNTRIES;

const PRODUCT_SELECT_FIELDS = `
  p.id,
  p.name,
  p.category,
  p.price,
  p.quantity,
  p.image,
  p.images,
  p.description,
  p.details,
  p.user_id,
  p.latitude,
  p.longitude,
  u.name AS seller_name,
  u.whatsapp_country_iso AS seller_whatsapp_country_iso,
  u.whatsapp_number AS seller_whatsapp_number
`;

const USER_SELECT_FIELDS = `
  id,
  name,
  email,
  password_hash,
  password_salt,
  avatar_url,
  country,
  state,
  city,
  neighborhood,
  street,
  whatsapp_country_iso,
  whatsapp_number
`;

const SESSION_USER_SELECT_FIELDS = `
  u.id,
  u.name,
  u.email,
  u.avatar_url,
  u.country,
  u.state,
  u.city,
  u.neighborhood,
  u.street,
  u.whatsapp_country_iso,
  u.whatsapp_number
`;

let sqliteDb: Database.Database | null = null;
let pgPool: Pool | null = null;

pgPool = new Pool({
  connectionString: DATABASE_URL,
  ssl: String(process.env.PGSSL ?? "").toLowerCase() === "false"
    ? false
    : { rejectUnauthorized: false },
});

function requireSqliteDb(): Database.Database {
  if (!sqliteDb) {
    throw new Error("SQLite database is not initialized.");
  }
  return sqliteDb;
}

function toNullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  return String(value);
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toRequiredNumber(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error("Invalid numeric value returned from database.");
  }
  return parsed;
}

function toRequiredNonNegativeInteger(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  const integerValue = Math.floor(parsed);
  if (integerValue < 0) {
    return fallback;
  }
  return integerValue;
}

function normalizeProductRow(row: Record<string, unknown>): ProductRow {
  return {
    id: toRequiredNumber(row.id),
    name: String(row.name ?? ""),
    category: String(row.category ?? ""),
    price: String(row.price ?? ""),
    quantity: toRequiredNonNegativeInteger(row.quantity, 1),
    image: String(row.image ?? DEFAULT_IMAGE),
    images: String(row.images ?? "[]"),
    description: toNullableString(row.description),
    details: toNullableString(row.details),
    user_id: toNullableNumber(row.user_id),
    latitude: toNullableNumber(row.latitude),
    longitude: toNullableNumber(row.longitude),
    seller_name: toNullableString(row.seller_name),
    seller_whatsapp_country_iso: toNullableString(row.seller_whatsapp_country_iso),
    seller_whatsapp_number: toNullableString(row.seller_whatsapp_number),
  };
}

function normalizeUserRow(row: Record<string, unknown>): UserRow {
  return {
    id: toRequiredNumber(row.id),
    name: String(row.name ?? ""),
    email: String(row.email ?? ""),
    password_hash: String(row.password_hash ?? ""),
    password_salt: String(row.password_salt ?? ""),
    avatar_url: toNullableString(row.avatar_url),
    country: toNullableString(row.country),
    state: toNullableString(row.state),
    city: toNullableString(row.city),
    neighborhood: toNullableString(row.neighborhood),
    street: toNullableString(row.street),
    whatsapp_country_iso: toNullableString(row.whatsapp_country_iso),
    whatsapp_number: toNullableString(row.whatsapp_number),
  };
}

function normalizeSessionUserRow(row: Record<string, unknown>): SessionUserRow {
  return {
    id: toRequiredNumber(row.id),
    name: String(row.name ?? ""),
    email: String(row.email ?? ""),
    avatar_url: toNullableString(row.avatar_url),
    country: toNullableString(row.country),
    state: toNullableString(row.state),
    city: toNullableString(row.city),
    neighborhood: toNullableString(row.neighborhood),
    street: toNullableString(row.street),
    whatsapp_country_iso: toNullableString(row.whatsapp_country_iso),
    whatsapp_number: toNullableString(row.whatsapp_number),
  };
}

function normalizeLikeNotificationRow(row: Record<string, unknown>): LikeNotificationRow {
  return {
    actor_user_id: toRequiredNumber(row.actor_user_id),
    actor_name: String(row.actor_name ?? ""),
    product_id: toRequiredNumber(row.product_id),
    product_name: String(row.product_name ?? ""),
    created_at: toRequiredNumber(row.created_at),
  };
}

function normalizeVendorRow(row: Record<string, unknown>): VendorRow {
  return {
    id: toRequiredNumber(row.id),
    name: String(row.name ?? "").trim(),
    avatar_url: toNullableString(row.avatar_url),
    product_count: toRequiredNonNegativeInteger(row.product_count, 0),
  };
}

function toOptionalTrimmedString(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : undefined;
}

function toOptionalIsoDateString(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  const stringValue = String(value).trim();
  if (!stringValue) {
    return undefined;
  }
  const parsed = new Date(stringValue);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }
  return stringValue;
}

function normalizeAdminUserRecord(row: Record<string, unknown>): AdminUserRecord {
  return {
    id: toRequiredNumber(row.id),
    name:
      toOptionalTrimmedString(row.name) ??
      toOptionalTrimmedString(row.username) ??
      toOptionalTrimmedString(row.email) ??
      `Usuário ${toRequiredNumber(row.id)}`,
    email: toOptionalTrimmedString(row.email) ?? "",
    username: toOptionalTrimmedString(row.username),
    phone: toOptionalTrimmedString(row.phone),
    country: toOptionalTrimmedString(row.country),
    city: toOptionalTrimmedString(row.city),
    productCount: toRequiredNumber(row.product_count ?? row.productCount ?? 0),
    createdAt: toOptionalIsoDateString(row.created_at ?? row.createdAt),
  };
}

function initializeSqliteDatabase() {
  if (sqliteDb) {
    return;
  }

  fs.mkdirSync(DB_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      image TEXT NOT NULL,
      images TEXT NOT NULL DEFAULT '[]',
      description TEXT DEFAULT '',
      details TEXT NOT NULL DEFAULT '{}',
      user_id INTEGER,
      latitude REAL,
      longitude REAL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      avatar_url TEXT NOT NULL DEFAULT '',
      country TEXT NOT NULL DEFAULT '',
      state TEXT NOT NULL DEFAULT '',
      city TEXT NOT NULL DEFAULT '',
      neighborhood TEXT NOT NULL DEFAULT '',
      street TEXT NOT NULL DEFAULT '',
      whatsapp_country_iso TEXT NOT NULL DEFAULT 'IT',
      whatsapp_number TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS product_likes (
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      PRIMARY KEY (user_id, product_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_product_likes_product_id ON product_likes(product_id);
  `);

  const productColumns = db.prepare("PRAGMA table_info(products)").all() as Array<{ name: string }>;
  if (!productColumns.some((column) => column.name === "user_id")) {
    db.exec("ALTER TABLE products ADD COLUMN user_id INTEGER");
  }
  if (!productColumns.some((column) => column.name === "latitude")) {
    db.exec("ALTER TABLE products ADD COLUMN latitude REAL");
  }
  if (!productColumns.some((column) => column.name === "longitude")) {
    db.exec("ALTER TABLE products ADD COLUMN longitude REAL");
  }
  if (!productColumns.some((column) => column.name === "quantity")) {
    db.exec("ALTER TABLE products ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1");
  }
  db.exec("UPDATE products SET quantity = 1 WHERE quantity IS NULL OR quantity < 0");

  const userColumns = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
  if (!userColumns.some((column) => column.name === "avatar_url")) {
    db.exec("ALTER TABLE users ADD COLUMN avatar_url TEXT NOT NULL DEFAULT ''");
  }
  if (!userColumns.some((column) => column.name === "country")) {
    db.exec("ALTER TABLE users ADD COLUMN country TEXT NOT NULL DEFAULT ''");
  }
  if (!userColumns.some((column) => column.name === "state")) {
    db.exec("ALTER TABLE users ADD COLUMN state TEXT NOT NULL DEFAULT ''");
  }
  if (!userColumns.some((column) => column.name === "city")) {
    db.exec("ALTER TABLE users ADD COLUMN city TEXT NOT NULL DEFAULT ''");
  }
  if (!userColumns.some((column) => column.name === "neighborhood")) {
    db.exec("ALTER TABLE users ADD COLUMN neighborhood TEXT NOT NULL DEFAULT ''");
  }
  if (!userColumns.some((column) => column.name === "street")) {
    db.exec("ALTER TABLE users ADD COLUMN street TEXT NOT NULL DEFAULT ''");
  }
  if (!userColumns.some((column) => column.name === "whatsapp_country_iso")) {
    db.exec("ALTER TABLE users ADD COLUMN whatsapp_country_iso TEXT NOT NULL DEFAULT 'IT'");
  }
  if (!userColumns.some((column) => column.name === "whatsapp_number")) {
    db.exec("ALTER TABLE users ADD COLUMN whatsapp_number TEXT NOT NULL DEFAULT ''");
  }

  db.exec("CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id)");
  sqliteDb = db;
}

async function initializePostgresDatabase() {
  if (!pgPool) {
    return;
  }

  const migrationStatements = [
    `
      CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        username TEXT NOT NULL DEFAULT '',
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        avatar_url TEXT NOT NULL DEFAULT '',
        country TEXT NOT NULL DEFAULT '',
        state TEXT NOT NULL DEFAULT '',
        city TEXT NOT NULL DEFAULT '',
        neighborhood TEXT NOT NULL DEFAULT '',
        street TEXT NOT NULL DEFAULT '',
        whatsapp_country_iso TEXT NOT NULL DEFAULT 'IT',
        whatsapp_number TEXT NOT NULL DEFAULT '',
        created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT)
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS products (
        id BIGSERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        image TEXT NOT NULL,
        images TEXT NOT NULL DEFAULT '[]',
        description TEXT DEFAULT '',
        details TEXT NOT NULL DEFAULT '{}',
        user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS sessions (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at BIGINT NOT NULL,
        created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT)
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS product_likes (
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT),
        PRIMARY KEY (user_id, product_id)
      )
    `,
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_salt TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS user_id BIGINT",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS name TEXT",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS title TEXT",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS price TEXT",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS quantity INTEGER",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS image TEXT",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT DEFAULT '[]'",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS image_urls TEXT",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT DEFAULT ''",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS details TEXT DEFAULT '{}'",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()",
    "ALTER TABLE sessions ADD COLUMN IF NOT EXISTS user_id BIGINT",
    "ALTER TABLE sessions ADD COLUMN IF NOT EXISTS token_hash TEXT",
    "ALTER TABLE sessions ADD COLUMN IF NOT EXISTS expires_at BIGINT",
    "ALTER TABLE sessions ADD COLUMN IF NOT EXISTS created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT)",
    "ALTER TABLE product_likes ADD COLUMN IF NOT EXISTS user_id BIGINT",
    "ALTER TABLE product_likes ADD COLUMN IF NOT EXISTS product_id BIGINT",
    "ALTER TABLE product_likes ADD COLUMN IF NOT EXISTS created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS state TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS neighborhood TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS street TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_country_iso TEXT NOT NULL DEFAULT 'IT'",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_number TEXT NOT NULL DEFAULT ''",
    "UPDATE products SET title = COALESCE(NULLIF(BTRIM(title), ''), NULLIF(BTRIM(name), ''), 'Produto sem título') WHERE title IS NULL OR BTRIM(title) = ''",
    "UPDATE products SET image_url = COALESCE(NULLIF(BTRIM(image_url), ''), NULLIF(BTRIM(image), ''), '') WHERE image_url IS NULL OR BTRIM(image_url) = ''",
    "UPDATE products SET image_urls = COALESCE(NULLIF(BTRIM(image_urls), ''), images, '[]') WHERE image_urls IS NULL OR BTRIM(image_urls) = ''",
    "UPDATE products SET quantity = 1 WHERE quantity IS NULL OR quantity < 0",
    "UPDATE products SET lat = COALESCE(lat, latitude) WHERE lat IS NULL",
    "UPDATE products SET lng = COALESCE(lng, longitude) WHERE lng IS NULL",
    "ALTER TABLE products ALTER COLUMN quantity SET DEFAULT 1",
    "ALTER TABLE products ALTER COLUMN quantity SET NOT NULL",
    "ALTER TABLE products ALTER COLUMN title SET DEFAULT ''",
    "ALTER TABLE products ALTER COLUMN title SET NOT NULL",
    "UPDATE users SET password = COALESCE(NULLIF(BTRIM(password), ''), password_hash, '') WHERE password IS NULL OR BTRIM(password) = ''",
    "ALTER TABLE users ALTER COLUMN password SET DEFAULT ''",
    "ALTER TABLE users ALTER COLUMN password SET NOT NULL",
    "UPDATE users SET username = COALESCE(NULLIF(BTRIM(username), ''), NULLIF(BTRIM(email), ''), CONCAT('user_', id::text)) WHERE username IS NULL OR BTRIM(username) = ''",
    "ALTER TABLE users ALTER COLUMN username SET DEFAULT ''",
    "ALTER TABLE users ALTER COLUMN username SET NOT NULL",
    "CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash)",
    "CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_product_likes_product_id ON product_likes(product_id)",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email)",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_product_likes_user_product_unique ON product_likes(user_id, product_id)",
    "CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id)",
  ];

  for (const statement of migrationStatements) {
    await pgPool.query(statement);
  }

  if (CLEAN_LOCAL_PRODUCTS_ON_BOOT) {
    const cleanupResult = await pgPool.query(
      `
        DELETE FROM products
        WHERE
          COALESCE(NULLIF(BTRIM(name), ''), '') = ''
          OR image LIKE 'https://picsum.photos/%'
          OR images LIKE '%picsum.photos/%'
      `,
    );
    const deleted = cleanupResult.rowCount ?? 0;
    if (deleted > 0) {
      console.log(`Cleanup: removed ${deleted} local/placeholder products from PostgreSQL.`);
    }
  }
}

async function initializeDatabase() {
  await initializePostgresDatabase();
}

async function selectAllProductsRows(): Promise<ProductRow[]> {
  if (pgPool) {
    const result = await pgPool.query<Record<string, unknown>>(
      `
        SELECT ${PRODUCT_SELECT_FIELDS}
        FROM products p
        LEFT JOIN users u ON u.id = p.user_id
        ORDER BY p.id DESC
      `,
    );
    return result.rows.map(normalizeProductRow);
  }

  const rows = requireSqliteDb()
    .prepare(
      `
        SELECT ${PRODUCT_SELECT_FIELDS}
        FROM products p
        LEFT JOIN users u ON u.id = p.user_id
        ORDER BY p.id DESC
      `,
    )
    .all() as Array<Record<string, unknown>>;
  return rows.map(normalizeProductRow);
}

async function selectProductsByOwnerRows(ownerId: number): Promise<ProductRow[]> {
  if (pgPool) {
    const result = await pgPool.query<Record<string, unknown>>(
      `
        SELECT ${PRODUCT_SELECT_FIELDS}
        FROM products p
        LEFT JOIN users u ON u.id = p.user_id
        WHERE p.user_id = $1
        ORDER BY p.id DESC
      `,
      [ownerId],
    );
    return result.rows.map(normalizeProductRow);
  }

  const rows = requireSqliteDb()
    .prepare(
      `
        SELECT ${PRODUCT_SELECT_FIELDS}
        FROM products p
        LEFT JOIN users u ON u.id = p.user_id
        WHERE p.user_id = ?
        ORDER BY p.id DESC
      `,
    )
    .all(ownerId) as Array<Record<string, unknown>>;
  return rows.map(normalizeProductRow);
}

async function selectAdminUsersRows(): Promise<AdminUserRecord[]> {
  if (pgPool) {
    const result = await pgPool.query<Record<string, unknown>>(
      `
        SELECT
          u.id,
          COALESCE(NULLIF(BTRIM(u.name), ''), NULLIF(BTRIM(u.username), ''), u.email) AS name,
          NULLIF(BTRIM(u.username), '') AS username,
          u.email,
          NULLIF(BTRIM(u.whatsapp_number), '') AS phone,
          NULLIF(BTRIM(u.country), '') AS country,
          NULLIF(BTRIM(u.city), '') AS city,
          u.created_at,
          COUNT(p.id)::INT AS product_count
        FROM users u
        LEFT JOIN products p ON p.user_id = u.id
        GROUP BY
          u.id,
          u.name,
          u.username,
          u.email,
          u.whatsapp_number,
          u.country,
          u.city,
          u.created_at
        ORDER BY u.id DESC
      `,
    );
    return result.rows.map(normalizeAdminUserRecord);
  }

  const rows = requireSqliteDb()
    .prepare(
      `
        SELECT
          u.id,
          u.name,
          u.email,
          u.whatsapp_number AS phone,
          u.country,
          u.city,
          u.created_at,
          COUNT(p.id) AS product_count
        FROM users u
        LEFT JOIN products p ON p.user_id = u.id
        GROUP BY
          u.id,
          u.name,
          u.email,
          u.whatsapp_number,
          u.country,
          u.city,
          u.created_at
        ORDER BY u.id DESC
      `,
    )
    .all() as Array<Record<string, unknown>>;
  return rows.map(normalizeAdminUserRecord);
}

async function selectProductByIdRow(productId: number): Promise<ProductRow | undefined> {
  if (pgPool) {
    const result = await pgPool.query<Record<string, unknown>>(
      `
        SELECT ${PRODUCT_SELECT_FIELDS}
        FROM products p
        LEFT JOIN users u ON u.id = p.user_id
        WHERE p.id = $1
      `,
      [productId],
    );
    const row = result.rows[0];
    return row ? normalizeProductRow(row) : undefined;
  }

  const row = requireSqliteDb()
    .prepare(
      `
        SELECT ${PRODUCT_SELECT_FIELDS}
        FROM products p
        LEFT JOIN users u ON u.id = p.user_id
        WHERE p.id = ?
      `,
    )
    .get(productId) as Record<string, unknown> | undefined;
  return row ? normalizeProductRow(row) : undefined;
}

async function selectLikedProductsByUserRows(userId: number): Promise<ProductRow[]> {
  if (pgPool) {
    const result = await pgPool.query<Record<string, unknown>>(
      `
        SELECT ${PRODUCT_SELECT_FIELDS}
        FROM product_likes l
        INNER JOIN products p ON p.id = l.product_id
        LEFT JOIN users u ON u.id = p.user_id
        WHERE l.user_id = $1
        ORDER BY l.created_at DESC, p.id DESC
      `,
      [userId],
    );
    return result.rows.map(normalizeProductRow);
  }

  const rows = requireSqliteDb()
    .prepare(
      `
        SELECT ${PRODUCT_SELECT_FIELDS}
        FROM product_likes l
        INNER JOIN products p ON p.id = l.product_id
        LEFT JOIN users u ON u.id = p.user_id
        WHERE l.user_id = ?
        ORDER BY l.created_at DESC, p.id DESC
      `,
    )
    .all(userId) as Array<Record<string, unknown>>;
  return rows.map(normalizeProductRow);
}

async function selectLikeNotificationsByOwnerRows(ownerId: number): Promise<LikeNotificationRow[]> {
  if (pgPool) {
    const result = await pgPool.query<Record<string, unknown>>(
      `
        SELECT
          l.user_id AS actor_user_id,
          lu.name AS actor_name,
          p.id AS product_id,
          p.name AS product_name,
          l.created_at
        FROM product_likes l
        INNER JOIN products p ON p.id = l.product_id
        INNER JOIN users lu ON lu.id = l.user_id
        WHERE p.user_id = $1 AND l.user_id <> $2
        ORDER BY l.created_at DESC, p.id DESC
        LIMIT 100
      `,
      [ownerId, ownerId],
    );
    return result.rows.map(normalizeLikeNotificationRow);
  }

  const rows = requireSqliteDb()
    .prepare(
      `
        SELECT
          l.user_id AS actor_user_id,
          lu.name AS actor_name,
          p.id AS product_id,
          p.name AS product_name,
          l.created_at
        FROM product_likes l
        INNER JOIN products p ON p.id = l.product_id
        INNER JOIN users lu ON lu.id = l.user_id
        WHERE p.user_id = ? AND l.user_id <> ?
        ORDER BY l.created_at DESC, p.id DESC
        LIMIT 100
      `,
    )
    .all(ownerId, ownerId) as Array<Record<string, unknown>>;
  return rows.map(normalizeLikeNotificationRow);
}

async function createProductRecord(
  normalized: NormalizedProductInput,
  userId: number,
): Promise<number> {
  if (pgPool) {
    const result = await pgPool.query<{ id: number | string }>(
      `
        INSERT INTO products (
          title,
          name,
          category,
          price,
          quantity,
          image,
          images,
          image_url,
          image_urls,
          description,
          details,
          user_id,
          latitude,
          longitude,
          lat,
          lng
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING id
      `,
      [
        normalized.name,
        normalized.name,
        normalized.category,
        normalized.price,
        normalized.quantity,
        normalized.image,
        normalized.images,
        normalized.image,
        normalized.images,
        normalized.description,
        normalized.details,
        userId,
        normalized.latitude,
        normalized.longitude,
        normalized.latitude,
        normalized.longitude,
      ],
    );
    return toRequiredNumber(result.rows[0]?.id);
  }

  const result = requireSqliteDb()
    .prepare(
      `
        INSERT INTO products (
          name,
          category,
          price,
          quantity,
          image,
          images,
          description,
          details,
          user_id,
          latitude,
          longitude
        )
        VALUES (
          @name,
          @category,
          @price,
          @quantity,
          @image,
          @images,
          @description,
          @details,
          @user_id,
          @latitude,
          @longitude
        )
      `,
    )
    .run({
      ...normalized,
      user_id: userId,
    });
  return Number(result.lastInsertRowid);
}

async function updateProductRecord(id: number, normalized: NormalizedProductInput): Promise<void> {
  if (pgPool) {
    await pgPool.query(
      `
        UPDATE products
        SET
          title = $1,
          name = $2,
          category = $3,
          price = $4,
          quantity = $5,
          image = $6,
          images = $7,
          image_url = $8,
          image_urls = $9,
          description = $10,
          details = $11,
          latitude = $12,
          longitude = $13,
          lat = $14,
          lng = $15
        WHERE id = $16
      `,
      [
        normalized.name,
        normalized.name,
        normalized.category,
        normalized.price,
        normalized.quantity,
        normalized.image,
        normalized.images,
        normalized.image,
        normalized.images,
        normalized.description,
        normalized.details,
        normalized.latitude,
        normalized.longitude,
        normalized.latitude,
        normalized.longitude,
        id,
      ],
    );
    return;
  }

  requireSqliteDb()
    .prepare(
      `
        UPDATE products
        SET
          name = @name,
          category = @category,
          price = @price,
          quantity = @quantity,
          image = @image,
          images = @images,
          description = @description,
          details = @details,
          latitude = @latitude,
          longitude = @longitude
        WHERE id = @id
      `,
    )
    .run({
      id,
      ...normalized,
    });
}

async function deleteProductRecord(id: number): Promise<void> {
  if (pgPool) {
    await pgPool.query("DELETE FROM products WHERE id = $1", [id]);
    return;
  }

  requireSqliteDb().prepare("DELETE FROM products WHERE id = ?").run(id);
}

async function deleteProductRecordAsAdmin(productId: number): Promise<boolean> {
  if (pgPool) {
    const client = await pgPool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM product_likes WHERE product_id = $1", [productId]);
      const deleted = await client.query("DELETE FROM products WHERE id = $1", [productId]);
      await client.query("COMMIT");
      return (deleted.rowCount ?? 0) > 0;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  const db = requireSqliteDb();
  const deleteProduct = db.prepare("DELETE FROM products WHERE id = ?");
  const deleteLikes = db.prepare("DELETE FROM product_likes WHERE product_id = ?");
  const runDelete = db.transaction((id: number) => {
    deleteLikes.run(id);
    const result = deleteProduct.run(id);
    return Number(result.changes ?? 0) > 0;
  });
  return runDelete(productId);
}

async function deleteUserRecordAsAdmin(userId: number): Promise<boolean> {
  if (pgPool) {
    const client = await pgPool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `
          DELETE FROM product_likes
          WHERE product_id IN (SELECT id FROM products WHERE user_id = $1)
        `,
        [userId],
      );
      await client.query("DELETE FROM product_likes WHERE user_id = $1", [userId]);
      await client.query("DELETE FROM sessions WHERE user_id = $1", [userId]);
      await client.query("DELETE FROM products WHERE user_id = $1", [userId]);
      const deleted = await client.query("DELETE FROM users WHERE id = $1", [userId]);
      await client.query("COMMIT");
      return (deleted.rowCount ?? 0) > 0;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  const db = requireSqliteDb();
  const deleteLikesByProducts = db.prepare(
    `
      DELETE FROM product_likes
      WHERE product_id IN (SELECT id FROM products WHERE user_id = ?)
    `,
  );
  const deleteLikesByUser = db.prepare("DELETE FROM product_likes WHERE user_id = ?");
  const deleteSessions = db.prepare("DELETE FROM sessions WHERE user_id = ?");
  const deleteProducts = db.prepare("DELETE FROM products WHERE user_id = ?");
  const deleteUser = db.prepare("DELETE FROM users WHERE id = ?");

  const runDelete = db.transaction((id: number) => {
    deleteLikesByProducts.run(id);
    deleteLikesByUser.run(id);
    deleteSessions.run(id);
    deleteProducts.run(id);
    const result = deleteUser.run(id);
    return Number(result.changes ?? 0) > 0;
  });

  return runDelete(userId);
}

async function createProductLikeRecord(userId: number, productId: number): Promise<void> {
  if (pgPool) {
    await pgPool.query(
      `
        INSERT INTO product_likes (user_id, product_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, product_id) DO NOTHING
      `,
      [userId, productId],
    );
    return;
  }

  requireSqliteDb()
    .prepare(
      `
        INSERT OR IGNORE INTO product_likes (user_id, product_id)
        VALUES (?, ?)
      `,
    )
    .run(userId, productId);
}

async function deleteProductLikeRecord(userId: number, productId: number): Promise<void> {
  if (pgPool) {
    await pgPool.query("DELETE FROM product_likes WHERE user_id = $1 AND product_id = $2", [
      userId,
      productId,
    ]);
    return;
  }

  requireSqliteDb()
    .prepare(
      `
        DELETE FROM product_likes
        WHERE user_id = ? AND product_id = ?
      `,
    )
    .run(userId, productId);
}

async function selectUserByEmailRow(email: string): Promise<UserRow | undefined> {
  if (pgPool) {
    const result = await pgPool.query<Record<string, unknown>>(
      `
        SELECT ${USER_SELECT_FIELDS}
        FROM users
        WHERE email = $1
      `,
      [email],
    );
    const row = result.rows[0];
    return row ? normalizeUserRow(row) : undefined;
  }

  const row = requireSqliteDb()
    .prepare(
      `
        SELECT ${USER_SELECT_FIELDS}
        FROM users
        WHERE email = ?
      `,
    )
    .get(email) as Record<string, unknown> | undefined;
  return row ? normalizeUserRow(row) : undefined;
}

async function selectUserByIdRow(id: number): Promise<UserRow | undefined> {
  if (pgPool) {
    const result = await pgPool.query<Record<string, unknown>>(
      `
        SELECT ${USER_SELECT_FIELDS}
        FROM users
        WHERE id = $1
      `,
      [id],
    );
    const row = result.rows[0];
    return row ? normalizeUserRow(row) : undefined;
  }

  const row = requireSqliteDb()
    .prepare(
      `
        SELECT ${USER_SELECT_FIELDS}
        FROM users
        WHERE id = ?
      `,
    )
    .get(id) as Record<string, unknown> | undefined;
  return row ? normalizeUserRow(row) : undefined;
}

async function createUserRecord(
  name: string,
  email: string,
  passwordHash: string,
  passwordSalt: string,
): Promise<number> {
  if (pgPool) {
    const username = email;
    const legacyPassword = passwordHash;
    const result = await pgPool.query<{ id: number | string }>(
      `
        INSERT INTO users (name, username, email, password, password_hash, password_salt)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `,
      [name, username, email, legacyPassword, passwordHash, passwordSalt],
    );
    return toRequiredNumber(result.rows[0]?.id);
  }

  const result = requireSqliteDb()
    .prepare(
      `
        INSERT INTO users (name, email, password_hash, password_salt)
        VALUES (?, ?, ?, ?)
      `,
    )
    .run(name, email, passwordHash, passwordSalt);
  return Number(result.lastInsertRowid);
}

async function updateUserProfileRecord(input: UserProfileUpdateInput): Promise<void> {
  if (pgPool) {
    await pgPool.query(
      `
        UPDATE users
        SET
          name = $1,
          country = $2,
          state = $3,
          city = $4,
          neighborhood = $5,
          street = $6,
          whatsapp_country_iso = $7,
          whatsapp_number = $8
        WHERE id = $9
      `,
      [
        input.name,
        input.country,
        input.state,
        input.city,
        input.neighborhood,
        input.street,
        input.whatsapp_country_iso,
        input.whatsapp_number,
        input.id,
      ],
    );
    return;
  }

  requireSqliteDb()
    .prepare(
      `
        UPDATE users
        SET
          name = @name,
          country = @country,
          state = @state,
          city = @city,
          neighborhood = @neighborhood,
          street = @street,
          whatsapp_country_iso = @whatsapp_country_iso,
          whatsapp_number = @whatsapp_number
        WHERE id = @id
      `,
    )
    .run(input);
}

async function updateUserAvatarRecord(userId: number, avatarUrl: string): Promise<void> {
  if (pgPool) {
    await pgPool.query(
      `
        UPDATE users
        SET avatar_url = $1
        WHERE id = $2
      `,
      [avatarUrl, userId],
    );
    return;
  }

  requireSqliteDb()
    .prepare(
      `
        UPDATE users
        SET avatar_url = @avatar_url
        WHERE id = @id
      `,
    )
    .run({
      id: userId,
      avatar_url: avatarUrl,
    });
}

async function selectVendorsRows(searchTerm: string, limit: number): Promise<VendorRow[]> {
  if (pgPool) {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const likeQuery = `%${normalizedSearch}%`;
    const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 100);
    const result = await pgPool.query<Record<string, unknown>>(
      `
        SELECT
          u.id,
          COALESCE(
            NULLIF(BTRIM(u.name), ''),
            NULLIF(BTRIM(u.username), ''),
            NULLIF(BTRIM(u.email), ''),
            CONCAT('Vendedor ', u.id::text)
          ) AS name,
          NULLIF(BTRIM(u.avatar_url), '') AS avatar_url,
          COUNT(p.id)::INT AS product_count
        FROM users u
        INNER JOIN products p ON p.user_id = u.id
        WHERE
          $1 = ''
          OR LOWER(COALESCE(NULLIF(BTRIM(u.name), ''), '')) LIKE $2
          OR LOWER(COALESCE(NULLIF(BTRIM(u.username), ''), '')) LIKE $2
          OR LOWER(COALESCE(NULLIF(BTRIM(u.email), ''), '')) LIKE $2
        GROUP BY u.id, u.name, u.username, u.email, u.avatar_url
        ORDER BY product_count DESC, u.id DESC
        LIMIT $3
      `,
      [normalizedSearch, likeQuery, safeLimit],
    );
    return result.rows.map(normalizeVendorRow);
  }

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const likeQuery = `%${normalizedSearch}%`;
  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 100);
  const rows = requireSqliteDb()
    .prepare(
      `
        SELECT
          u.id,
          COALESCE(NULLIF(TRIM(u.name), ''), NULLIF(TRIM(u.email), ''), 'Vendedor') AS name,
          NULLIF(TRIM(u.avatar_url), '') AS avatar_url,
          COUNT(p.id) AS product_count
        FROM users u
        INNER JOIN products p ON p.user_id = u.id
        WHERE
          ? = ''
          OR LOWER(COALESCE(NULLIF(TRIM(u.name), ''), '')) LIKE ?
          OR LOWER(COALESCE(NULLIF(TRIM(u.email), ''), '')) LIKE ?
        GROUP BY u.id, u.name, u.email, u.avatar_url
        ORDER BY product_count DESC, u.id DESC
        LIMIT ?
      `,
    )
    .all(normalizedSearch, likeQuery, likeQuery, safeLimit) as Array<Record<string, unknown>>;
  return rows.map(normalizeVendorRow);
}

async function createSessionRecord(userId: number, tokenHash: string, expiresAt: number): Promise<void> {
  if (pgPool) {
    await pgPool.query(
      `
        INSERT INTO sessions (user_id, token_hash, expires_at)
        VALUES ($1, $2, $3)
      `,
      [userId, tokenHash, expiresAt],
    );
    return;
  }

  requireSqliteDb()
    .prepare(
      `
        INSERT INTO sessions (user_id, token_hash, expires_at)
        VALUES (?, ?, ?)
      `,
    )
    .run(userId, tokenHash, expiresAt);
}

async function deleteSessionByTokenHashRecord(tokenHash: string): Promise<void> {
  if (pgPool) {
    await pgPool.query("DELETE FROM sessions WHERE token_hash = $1", [tokenHash]);
    return;
  }

  requireSqliteDb()
    .prepare(
      `
        DELETE FROM sessions
        WHERE token_hash = ?
      `,
    )
    .run(tokenHash);
}

async function deleteExpiredSessionsRecords(): Promise<void> {
  if (pgPool) {
    await pgPool.query(
      "DELETE FROM sessions WHERE expires_at <= EXTRACT(EPOCH FROM NOW())::BIGINT",
    );
    return;
  }

  requireSqliteDb()
    .prepare(
      `
        DELETE FROM sessions
        WHERE expires_at <= strftime('%s', 'now')
      `,
    )
    .run();
}

async function selectSessionUserByTokenHashRow(
  tokenHash: string,
): Promise<SessionUserRow | undefined> {
  if (pgPool) {
    const result = await pgPool.query<Record<string, unknown>>(
      `
        SELECT ${SESSION_USER_SELECT_FIELDS}
        FROM sessions s
        INNER JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = $1 AND s.expires_at > EXTRACT(EPOCH FROM NOW())::BIGINT
      `,
      [tokenHash],
    );
    const row = result.rows[0];
    return row ? normalizeSessionUserRow(row) : undefined;
  }

  const row = requireSqliteDb()
    .prepare(
      `
        SELECT ${SESSION_USER_SELECT_FIELDS}
        FROM sessions s
        INNER JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ? AND s.expires_at > strftime('%s', 'now')
      `,
    )
    .get(tokenHash) as Record<string, unknown> | undefined;
  return row ? normalizeSessionUserRow(row) : undefined;
}

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizeImages(images: unknown, fallbackImage: string): string[] {
  if (Array.isArray(images)) {
    const cleaned = images
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);

    if (cleaned.length > 0) {
      return cleaned;
    }
  }

  const image = fallbackImage.trim();
  return image ? [image] : [DEFAULT_IMAGE];
}

function rowToProduct(row: ProductRow): ProductRecord {
  const images = safeJsonParse<string[]>(row.images, []);
  const details = safeJsonParse<Record<string, string>>(row.details, {});

  const product: ProductRecord = {
    id: row.id,
    name: row.name,
    category: row.category,
    price: row.price,
    quantity: row.quantity,
    image: row.image,
    images: images.length > 0 ? images : [row.image || DEFAULT_IMAGE],
    description: row.description ?? "",
    details,
  };

  if (row.user_id !== null) {
    product.ownerId = row.user_id;
  }
  if (row.latitude !== null) {
    product.latitude = row.latitude;
  }
  if (row.longitude !== null) {
    product.longitude = row.longitude;
  }
  if (row.seller_name) {
    product.sellerName = row.seller_name;
  }
  if (row.seller_whatsapp_country_iso) {
    product.sellerWhatsappCountryIso = row.seller_whatsapp_country_iso;
  }
  if (row.seller_whatsapp_number) {
    product.sellerWhatsappNumber = row.seller_whatsapp_number;
  }

  return product;
}

function rowToPublicVendor(row: VendorRow): PublicVendorRecord {
  return {
    id: row.id,
    name: row.name || `Vendedor ${row.id}`,
    avatarUrl: row.avatar_url ?? "",
    productCount: row.product_count,
  };
}

function rowToNotification(row: LikeNotificationRow): NotificationRecord {
  const actorName = row.actor_name.trim() || "Alguém";
  const productName = row.product_name.trim() || "sua publicação";
  const createdAt = Number.isFinite(row.created_at)
    ? row.created_at
    : Math.floor(Date.now() / 1000);

  return {
    id: `like:${row.product_id}:${row.actor_user_id}:${createdAt}`,
    type: "product_like",
    title: "Nova curtida",
    message: `${actorName} curtiu sua publicação "${productName}".`,
    createdAt,
    actorUserId: row.actor_user_id,
    productId: row.product_id,
  };
}

function parseIncomingPriceToNumber(rawValue: unknown): number | null {
  const value = String(rawValue ?? "").trim();
  if (!value) {
    return null;
  }

  const cleaned = value.replace(/[^\d,.-]/g, "");
  if (!cleaned) {
    return null;
  }

  const commaCount = (cleaned.match(/,/g) ?? []).length;
  const dotCount = (cleaned.match(/\./g) ?? []).length;

  let normalized = cleaned;

  if (commaCount > 0 && dotCount > 0) {
    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");
    const decimalSeparator = lastComma > lastDot ? "," : ".";

    if (decimalSeparator === ",") {
      normalized = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = cleaned.replace(/,/g, "");
    }
  } else if (commaCount > 0) {
    const lastComma = cleaned.lastIndexOf(",");
    const fractionLength = cleaned.length - lastComma - 1;
    normalized =
      fractionLength > 0 && fractionLength <= 2
        ? cleaned.replace(/\./g, "").replace(",", ".")
        : cleaned.replace(/,/g, "");
  } else if (dotCount > 0) {
    const lastDot = cleaned.lastIndexOf(".");
    const fractionLength = cleaned.length - lastDot - 1;
    normalized =
      fractionLength > 0 && fractionLength <= 2
        ? cleaned.replace(/,/g, "")
        : cleaned.replace(/\./g, "");
  }

  const parsed = Number(normalized);
  if (Number.isFinite(parsed)) {
    return parsed;
  }

  const digits = value.replace(/\D/g, "");
  if (!digits) {
    return null;
  }

  const fallback = Number(digits) / 100;
  return Number.isFinite(fallback) ? fallback : null;
}

function normalizeIncomingPrice(rawValue: unknown): string {
  const parsed = parseIncomingPriceToNumber(rawValue);
  if (parsed === null) {
    throw new Error("Preço é obrigatório.");
  }
  if (parsed <= 0) {
    throw new Error("Preço deve ser maior que zero.");
  }
  return parsed.toFixed(2);
}

function normalizeIncomingQuantity(rawValue: unknown): number {
  const normalizedRaw = String(rawValue ?? "").trim();
  if (!normalizedRaw) {
    return 1;
  }

  const parsed = Number(normalizedRaw);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    throw new Error("Quantidade inválida.");
  }
  if (parsed < 0) {
    throw new Error("Quantidade não pode ser negativa.");
  }
  if (parsed > 999999) {
    throw new Error("Quantidade muito alta.");
  }
  return parsed;
}

function normalizeIncomingProduct(payload: unknown): NormalizedProductInput {
  if (!payload || typeof payload !== "object") {
    throw new Error("Payload inválido.");
  }

  const body = payload as Record<string, unknown>;
  const name = String(body.name ?? "").trim();
  const category = String(body.category ?? "").trim();
  const price = normalizeIncomingPrice(body.price);
  const quantity = normalizeIncomingQuantity(body.quantity);
  const rawImage = String(body.image ?? "").trim();
  const images = normalizeImages(body.images, rawImage || DEFAULT_IMAGE);
  const image = rawImage || images[0] || DEFAULT_IMAGE;
  const description = String(body.description ?? "").trim();
  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);
  const details =
    body.details && typeof body.details === "object"
      ? (body.details as Record<string, string>)
      : {};

  if (!name) {
    throw new Error("Nome do produto é obrigatório.");
  }
  if (!category) {
    throw new Error("Categoria é obrigatória.");
  }
  if (!description) {
    throw new Error("Descrição é obrigatória.");
  }
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("Latitude e longitude são obrigatórias.");
  }
  if (latitude < -90 || latitude > 90) {
    throw new Error("Latitude deve estar entre -90 e 90.");
  }
  if (longitude < -180 || longitude > 180) {
    throw new Error("Longitude deve estar entre -180 e 180.");
  }

  return {
    name,
    category,
    price,
    quantity,
    image,
    images: JSON.stringify(images),
    description,
    details: JSON.stringify(details),
    latitude,
    longitude,
  };
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeTextField(value: unknown, fieldName: string, maxLength: number): string {
  const normalized = String(value ?? "").trim();
  if (normalized.length > maxLength) {
    throw new Error(`${fieldName} deve ter no maximo ${maxLength} caracteres.`);
  }
  return normalized;
}

function normalizeAvatarUrl(value: unknown): string {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return "";
  }
  if (normalized.length > 1200) {
    throw new Error("URL da foto de perfil muito longa.");
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(normalized);
  } catch {
    throw new Error("URL da foto de perfil inválida.");
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error("URL da foto de perfil inválida.");
  }

  return parsedUrl.toString();
}

function normalizeWhatsappCountryIso(value: unknown): WhatsappCountryIso {
  const normalized = String(value ?? "IT").trim().toUpperCase();
  if (normalized in WHATSAPP_COUNTRIES) {
    return normalized as WhatsappCountryIso;
  }
  throw new Error("Pais do WhatsApp invalido.");
}

function normalizeWhatsappNumber(value: unknown, countryIso: WhatsappCountryIso): string {
  let digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) {
    return "";
  }

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  const dialDigits = WHATSAPP_COUNTRIES[countryIso].dialDigits;
  const withoutCountryPrefix =
    digits.startsWith(dialDigits) && digits.length > dialDigits.length + 5
      ? digits.slice(dialDigits.length)
      : digits;

  if (withoutCountryPrefix.length < 6 || withoutCountryPrefix.length > 15) {
    throw new Error("Numero de WhatsApp invalido.");
  }

  return withoutCountryPrefix;
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function createPasswordCredentials(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = hashPassword(password, salt);
  return { salt, hash };
}

function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  const calculatedHash = hashPassword(password, salt);
  const calculatedBuffer = Buffer.from(calculatedHash, "hex");
  const storedBuffer = Buffer.from(storedHash, "hex");

  if (calculatedBuffer.length !== storedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(calculatedBuffer, storedBuffer);
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function decodeHeaderFilename(value: string | undefined): string {
  if (!value) {
    return "";
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function buildCloudinarySignature(
  params: Record<string, string | number>,
  apiSecret: string,
): string {
  const toSign = Object.entries(params)
    .filter(([, value]) => value !== "")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return crypto
    .createHash("sha1")
    .update(`${toSign}${apiSecret}`)
    .digest("hex");
}

function assertCloudinaryConfig() {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error(
      "Cloudinary não configurado. Defina CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET.",
    );
  }
}

type CloudinaryUploadedImage = {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
};

function parseIncomingImageUpload(req: Request): {
  contentType: string;
  payload: Buffer;
  safeFilename: string;
} {
  const rawContentType = String(req.headers["content-type"] ?? "");
  const contentType = rawContentType.split(";")[0]?.trim().toLowerCase();
  if (!contentType.startsWith("image/")) {
    throw new Error("Arquivo inválido. Envie uma imagem.");
  }

  const payload = req.body;
  if (!Buffer.isBuffer(payload) || payload.length === 0) {
    throw new Error("Arquivo de imagem não encontrado.");
  }

  const rawFilename = decodeHeaderFilename(req.header("x-file-name"));
  const safeFilename =
    rawFilename && rawFilename.length < 200
      ? rawFilename
      : `upload-${Date.now()}.${contentType.slice("image/".length) || "jpg"}`;

  return {
    contentType,
    payload,
    safeFilename,
  };
}

async function uploadImageToCloudinary(
  options: {
    payload: Buffer;
    contentType: string;
    safeFilename: string;
    folder: string;
    publicIdPrefix: string;
  },
): Promise<CloudinaryUploadedImage> {
  assertCloudinaryConfig();

  const timestamp = Math.floor(Date.now() / 1000);
  const uniqueSuffix = crypto.randomBytes(6).toString("hex");
  const publicId = `${options.publicIdPrefix}_${Date.now()}_${uniqueSuffix}`;
  const folder = options.folder;

  const signature = buildCloudinarySignature(
    {
      folder,
      public_id: publicId,
      timestamp,
    },
    CLOUDINARY_API_SECRET,
  );

  const formData = new FormData();
  formData.append(
    "file",
    new Blob([options.payload], { type: options.contentType }),
    options.safeFilename,
  );
  formData.append("api_key", CLOUDINARY_API_KEY);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("folder", folder);
  formData.append("public_id", publicId);

  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  const uploadText = await uploadResponse.text();
  let uploadJson: Record<string, unknown> = {};
  try {
    uploadJson = JSON.parse(uploadText) as Record<string, unknown>;
  } catch {
    uploadJson = {};
  }

  if (!uploadResponse.ok) {
    const cloudinaryError =
      typeof uploadJson.error === "object" && uploadJson.error
        ? String((uploadJson.error as Record<string, unknown>).message ?? "").trim()
        : "";
    throw new Error(cloudinaryError || "Falha ao enviar imagem para o Cloudinary.");
  }

  const secureUrl = String(uploadJson.secure_url ?? "").trim();
  if (!secureUrl) {
    throw new Error("Cloudinary não retornou a URL da imagem.");
  }

  return {
    url: secureUrl,
    publicId: String(uploadJson.public_id ?? publicId),
    width: Number(uploadJson.width ?? 0) || undefined,
    height: Number(uploadJson.height ?? 0) || undefined,
  };
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  const parsed: Record<string, string> = {};
  for (const entry of cookieHeader.split(";")) {
    const [key, ...valueParts] = entry.trim().split("=");
    if (!key) {
      continue;
    }
    parsed[key] = decodeURIComponent(valueParts.join("="));
  }

  return parsed;
}

function getSessionTokenFromRequest(req: Request): string | null {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[SESSION_COOKIE_NAME];
  return token ? token.trim() : null;
}

function createAdminSessionToken(): string {
  const expiresAt = Math.floor(Date.now() / 1000) + ADMIN_SESSION_TTL_SECONDS;
  const nonce = crypto.randomBytes(16).toString("hex");
  const payload = `${expiresAt}.${nonce}`;
  const signature = crypto
    .createHmac("sha256", ADMIN_SESSION_SECRET)
    .update(payload)
    .digest("hex");
  return `${payload}.${signature}`;
}

function verifyAdminSessionToken(token: string): boolean {
  const [expiresAtRaw, nonce, signature] = token.split(".");
  if (!expiresAtRaw || !nonce || !signature) {
    return false;
  }
  if (!/^\d+$/.test(expiresAtRaw)) {
    return false;
  }
  if (!/^[a-f0-9]{32}$/i.test(nonce) || !/^[a-f0-9]{64}$/i.test(signature)) {
    return false;
  }

  const payload = `${expiresAtRaw}.${nonce}`;
  const expectedSignature = crypto
    .createHmac("sha256", ADMIN_SESSION_SECRET)
    .update(payload)
    .digest("hex");
  const providedBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");
  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }
  if (!crypto.timingSafeEqual(providedBuffer, expectedBuffer)) {
    return false;
  }

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt)) {
    return false;
  }

  return expiresAt > Math.floor(Date.now() / 1000);
}

function getAdminSessionTokenFromRequest(req: Request): string | null {
  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies[ADMIN_SESSION_COOKIE_NAME];
  if (cookieToken) {
    return cookieToken.trim();
  }

  const authorizationHeader = String(req.headers.authorization ?? "").trim();
  if (authorizationHeader.toLowerCase().startsWith("bearer ")) {
    const token = authorizationHeader.slice(7).trim();
    return token || null;
  }

  return null;
}

function sessionCookieBaseOptions(isProduction: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction,
    path: "/",
  };
}

function sessionCookieOptions(isProduction: boolean) {
  return {
    ...sessionCookieBaseOptions(isProduction),
    maxAge: SESSION_TTL_SECONDS * 1000,
  };
}

function adminSessionCookieBaseOptions(isProduction: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction,
    path: "/",
  };
}

function adminSessionCookieOptions(isProduction: boolean) {
  return {
    ...adminSessionCookieBaseOptions(isProduction),
    maxAge: ADMIN_SESSION_TTL_SECONDS * 1000,
  };
}

function setSessionCookie(res: Response, token: string, isProduction: boolean) {
  res.cookie(SESSION_COOKIE_NAME, token, sessionCookieOptions(isProduction));
}

function clearSessionCookie(res: Response, isProduction: boolean) {
  res.clearCookie(SESSION_COOKIE_NAME, sessionCookieBaseOptions(isProduction));
}

function setAdminSessionCookie(res: Response, token: string, isProduction: boolean) {
  res.cookie(ADMIN_SESSION_COOKIE_NAME, token, adminSessionCookieOptions(isProduction));
}

function clearAdminSessionCookie(res: Response, isProduction: boolean) {
  res.clearCookie(ADMIN_SESSION_COOKIE_NAME, adminSessionCookieBaseOptions(isProduction));
}

function sanitizeUser(
  user: Pick<
    UserRow,
    | "id"
    | "name"
    | "email"
    | "avatar_url"
    | "country"
    | "state"
    | "city"
    | "neighborhood"
    | "street"
    | "whatsapp_country_iso"
    | "whatsapp_number"
  >,
): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatar_url ?? "",
    country: user.country ?? "",
    state: user.state ?? "",
    city: user.city ?? "",
    neighborhood: user.neighborhood ?? "",
    street: user.street ?? "",
    whatsappCountryIso: user.whatsapp_country_iso ?? "IT",
    whatsappNumber: user.whatsapp_number ?? "",
  };
}

function sanitizePublicUser(
  user: Pick<
    UserRow,
    | "id"
    | "name"
    | "avatar_url"
    | "country"
    | "state"
    | "city"
    | "neighborhood"
    | "street"
    | "whatsapp_country_iso"
    | "whatsapp_number"
  >,
) {
  return {
    id: user.id,
    name: user.name,
    avatarUrl: user.avatar_url ?? "",
    country: user.country ?? "",
    state: user.state ?? "",
    city: user.city ?? "",
    neighborhood: user.neighborhood ?? "",
    street: user.street ?? "",
    whatsappCountryIso: user.whatsapp_country_iso ?? "IT",
    whatsappNumber: user.whatsapp_number ?? "",
  };
}

function hasRequiredProfileForPublishing(user: SessionUser): boolean {
  const normalizedName = String(user.name ?? "").trim();
  const normalizedWhatsapp = String(user.whatsappNumber ?? "").replace(/\D/g, "").trim();

  return normalizedName.length >= 2 && normalizedWhatsapp.length >= 6;
}

async function createSession(userId: number): Promise<string> {
  await deleteExpiredSessionsRecords();

  const token = crypto.randomBytes(48).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;

  await createSessionRecord(userId, tokenHash, expiresAt);

  return token;
}

async function getSessionUser(req: Request): Promise<SessionUser | null> {
  await deleteExpiredSessionsRecords();

  const token = getSessionTokenFromRequest(req);
  if (!token) {
    return null;
  }

  const tokenHash = hashToken(token);
  const user = await selectSessionUserByTokenHashRow(tokenHash);
  if (!user) {
    return null;
  }
  return sanitizeUser(user);
}

async function requireAuth(req: Request, res: Response): Promise<SessionUser | null> {
  const user = await getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: "Faça login para continuar." });
    return null;
  }
  return user;
}

function parseTileCoordinate(value: string): number | null {
  if (!/^\d+$/.test(value)) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    return null;
  }
  return parsed;
}

function isValidTileCoordinate(z: number, x: number, y: number): boolean {
  if (z < MAP_TILE_MIN_ZOOM || z > MAP_TILE_MAX_ZOOM) {
    return false;
  }
  const maxIndex = 2 ** z - 1;
  if (!Number.isFinite(maxIndex) || maxIndex < 0) {
    return false;
  }
  return x >= 0 && y >= 0 && x <= maxIndex && y <= maxIndex;
}

function buildTileProviderUrl(template: string, z: number, x: number, y: number): string {
  return template
    .replace("{z}", String(z))
    .replace("{x}", String(x))
    .replace("{y}", String(y));
}

async function fetchTileFromProviders(
  z: number,
  x: number,
  y: number,
): Promise<{ buffer: Buffer; contentType: string } | null> {
  for (const template of MAP_TILE_PROVIDER_TEMPLATES) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, MAP_TILE_FETCH_TIMEOUT_MS);

    try {
      const url = buildTileProviderUrl(template, z, x, y);
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "TempleSaleMapProxy/1.0",
          Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        },
      });

      if (!response.ok) {
        continue;
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.startsWith("image/")) {
        continue;
      }

      const arrayBuffer = await response.arrayBuffer();
      return {
        buffer: Buffer.from(arrayBuffer),
        contentType,
      };
    } catch {
      // Try next tile provider.
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return null;
}

async function bootstrap() {
  await initializeDatabase();

  const app = express();
  const isProduction = process.env.NODE_ENV === "production";
  const port = Number(process.env.PORT || 5173);

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "2mb" }));

  const requireAdmin = (req: Request, res: Response): AdminSessionUser | null => {
    const adminToken = getAdminSessionTokenFromRequest(req);
    if (!adminToken || !verifyAdminSessionToken(adminToken)) {
      clearAdminSessionCookie(res, isProduction);
      res.status(401).json({ error: "Acesso de administrador não autorizado." });
      return null;
    }

    return { email: ADMIN_EMAIL };
  };

  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      mode: isProduction ? "production" : "development",
      database: "postgres",
      cloudinary:
        CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET
          ? "configured"
          : "missing_env",
    });
  });

  if (!isProduction) {
    app.get("/api/debug/db-columns/:table", async (req, res) => {
      try {
        const tableName = String(req.params.table ?? "").trim().toLowerCase();
        if (!tableName || !/^[a-z_]+$/.test(tableName)) {
          res.status(400).json({ error: "Nome de tabela inválido." });
          return;
        }

        if (!pgPool) {
          res.status(500).json({ error: "Pool do Postgres indisponível." });
          return;
        }

        const result = await pgPool.query<{
          column_name: string;
          is_nullable: string;
          data_type: string;
          column_default: string | null;
        }>(
          `
            SELECT column_name, is_nullable, data_type, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = $1
            ORDER BY ordinal_position
          `,
          [tableName],
        );

        res.json({
          table: tableName,
          columns: result.rows.map((row) => ({
            name: row.column_name,
            nullable: row.is_nullable === "YES",
            dataType: row.data_type,
            default: row.column_default,
          })),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha ao consultar schema.";
        res.status(500).json({ error: message });
      }
    });

    app.post("/api/debug/cleanup-local-products", async (_req, res) => {
      try {
        if (!pgPool) {
          res.status(500).json({ error: "Pool do Postgres indisponível." });
          return;
        }

        const result = await pgPool.query<{
          id: number | string;
        }>(
          `
            DELETE FROM products
            WHERE
              COALESCE(NULLIF(BTRIM(name), ''), '') = ''
              OR image LIKE 'https://picsum.photos/%'
              OR images LIKE '%picsum.photos/%'
            RETURNING id
          `,
        );

        res.json({
          deletedCount: result.rowCount ?? result.rows.length,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha ao limpar produtos locais.";
        res.status(500).json({ error: message });
      }
    });
  }

  app.get("/api/map-tiles/:z/:x/:y.png", async (req, res) => {
    const z = parseTileCoordinate(req.params.z);
    const x = parseTileCoordinate(req.params.x);
    const y = parseTileCoordinate(req.params.y);

    if (z === null || x === null || y === null || !isValidTileCoordinate(z, x, y)) {
      res.status(400).end();
      return;
    }

    const tile = await fetchTileFromProviders(z, x, y);
    if (!tile) {
      res.status(502).end();
      return;
    }

    res.setHeader("Content-Type", tile.contentType);
    res.setHeader("Cache-Control", MAP_TILE_CACHE_CONTROL);
    res.status(200).send(tile.buffer);
  });

  app.post(
    "/api/uploads/product-image",
    express.raw({
      type: "image/*",
      limit: `${UPLOAD_MAX_BYTES}b`,
    }),
    async (req, res) => {
      const user = await requireAuth(req, res);
      if (!user) {
        return;
      }

      try {
        const { contentType, payload, safeFilename } = parseIncomingImageUpload(req);
        const uploaded = await uploadImageToCloudinary({
          payload,
          contentType,
          safeFilename,
          folder: CLOUDINARY_UPLOAD_FOLDER,
          publicIdPrefix: `product_user_${user.id}`,
        });

        res.status(201).json(uploaded);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha ao fazer upload da imagem.";
        const statusCode =
          message.includes("Arquivo inválido") || message.includes("não encontrado")
            ? 400
            : message.includes("Cloudinary")
              ? 502
              : 500;
        res.status(statusCode).json({ error: message });
      }
    },
  );

  app.post(
    "/api/uploads/profile-image",
    express.raw({
      type: "image/*",
      limit: `${UPLOAD_MAX_BYTES}b`,
    }),
    async (req, res) => {
      const user = await requireAuth(req, res);
      if (!user) {
        return;
      }

      try {
        const { contentType, payload, safeFilename } = parseIncomingImageUpload(req);
        const uploaded = await uploadImageToCloudinary({
          payload,
          contentType,
          safeFilename,
          folder: CLOUDINARY_PROFILE_UPLOAD_FOLDER,
          publicIdPrefix: `avatar_user_${user.id}`,
        });

        res.status(201).json(uploaded);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Falha ao enviar foto de perfil.";
        const statusCode =
          message.includes("Arquivo inválido") || message.includes("não encontrado")
            ? 400
            : message.includes("Cloudinary")
              ? 502
              : 500;
        res.status(statusCode).json({ error: message });
      }
    },
  );

  const handleAdminLogin = (req: Request, res: Response) => {
    try {
      const body = req.body as Record<string, unknown>;
      const email = String(body.email ?? "").trim().toLowerCase();
      const password = String(body.password ?? "").trim();

      if (!email || !password) {
        res.status(400).json({ error: "Email e senha do administrador são obrigatórios." });
        return;
      }

      if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
        clearAdminSessionCookie(res, isProduction);
        res.status(401).json({ error: "Credenciais de administrador inválidas." });
        return;
      }

      const token = createAdminSessionToken();
      setAdminSessionCookie(res, token, isProduction);
      res.json({
        email: ADMIN_EMAIL,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao autenticar administrador.";
      res.status(500).json({ error: message });
    }
  };

  const handleAdminCurrent = (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) {
      return;
    }

    res.json({ email: ADMIN_EMAIL });
  };

  const handleAdminLogout = (_req: Request, res: Response) => {
    clearAdminSessionCookie(res, isProduction);
    res.json({ success: true });
  };

  // Canonical admin auth routes
  app.post("/api/admin/auth/login", handleAdminLogin);
  app.get("/api/admin/auth/me", handleAdminCurrent);
  app.post("/api/admin/auth/logout", handleAdminLogout);

  // Backward-compatible aliases for older frontends
  app.post("/api/admin/auth", handleAdminLogin);
  app.get("/api/admin/auth", handleAdminCurrent);
  app.delete("/api/admin/auth", handleAdminLogout);

  app.get("/api/admin/users", async (req, res) => {
    if (!requireAdmin(req, res)) {
      return;
    }

    try {
      const users = await selectAdminUsersRows();
      res.json(users);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao listar usuários.";
      res.status(500).json({ error: message });
    }
  });

  app.get("/api/admin/users/:id/products", async (req, res) => {
    if (!requireAdmin(req, res)) {
      return;
    }

    const userId = Number(req.params.id);
    if (!Number.isInteger(userId) || userId <= 0) {
      res.status(400).json({ error: "ID de usuário inválido." });
      return;
    }

    try {
      const user = await selectUserByIdRow(userId);
      if (!user) {
        res.status(404).json({ error: "Usuário não encontrado." });
        return;
      }

      const products = await selectProductsByOwnerRows(userId);
      res.json(products.map(rowToProduct));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao listar produtos do usuário.";
      res.status(500).json({ error: message });
    }
  });

  app.delete("/api/admin/products/:id", async (req, res) => {
    if (!requireAdmin(req, res)) {
      return;
    }

    const productId = Number(req.params.id);
    if (!Number.isInteger(productId) || productId <= 0) {
      res.status(400).json({ error: "ID de produto inválido." });
      return;
    }

    try {
      const existingProduct = await selectProductByIdRow(productId);
      if (!existingProduct) {
        res.status(404).json({ error: "Produto não encontrado." });
        return;
      }

      const deleted = await deleteProductRecordAsAdmin(productId);
      if (!deleted) {
        res.status(404).json({ error: "Produto não encontrado." });
        return;
      }

      res.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao excluir produto.";
      res.status(500).json({ error: message });
    }
  });

  app.delete("/api/admin/users/:id", async (req, res) => {
    if (!requireAdmin(req, res)) {
      return;
    }

    const userId = Number(req.params.id);
    if (!Number.isInteger(userId) || userId <= 0) {
      res.status(400).json({ error: "ID de usuário inválido." });
      return;
    }

    try {
      const existingUser = await selectUserByIdRow(userId);
      if (!existingUser) {
        res.status(404).json({ error: "Usuário não encontrado." });
        return;
      }

      const deleted = await deleteUserRecordAsAdmin(userId);
      if (!deleted) {
        res.status(404).json({ error: "Usuário não encontrado." });
        return;
      }

      res.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao excluir usuário.";
      res.status(500).json({ error: message });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const body = req.body as Record<string, unknown>;
      const name = String(body.name ?? "").trim();
      const email = normalizeEmail(String(body.email ?? ""));
      const password = String(body.password ?? "").trim();

      if (name.length < 2) {
        res.status(400).json({ error: "Nome deve ter pelo menos 2 caracteres." });
        return;
      }
      if (!EMAIL_REGEX.test(email)) {
        res.status(400).json({ error: "Email inválido." });
        return;
      }
      if (password.length < 6) {
        res.status(400).json({ error: "Senha deve ter pelo menos 6 caracteres." });
        return;
      }

      const existingUser = await selectUserByEmailRow(email);
      if (existingUser) {
        res.status(409).json({ error: "Este email já está cadastrado." });
        return;
      }

      const passwordCredentials = createPasswordCredentials(password);
      const userId = await createUserRecord(
        name,
        email,
        passwordCredentials.hash,
        passwordCredentials.salt,
      );

      const createdUser = await selectUserByIdRow(userId);
      if (!createdUser) {
        res.status(500).json({ error: "Falha ao criar usuário." });
        return;
      }

      const token = await createSession(createdUser.id);
      setSessionCookie(res, token, isProduction);
      res.status(201).json(sanitizeUser(createdUser));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao criar conta.";
      res.status(500).json({ error: message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const body = req.body as Record<string, unknown>;
      const email = normalizeEmail(String(body.email ?? ""));
      const password = String(body.password ?? "").trim();

      if (!EMAIL_REGEX.test(email) || !password) {
        res.status(400).json({ error: "Email e senha são obrigatórios." });
        return;
      }

      const user = await selectUserByEmailRow(email);
      if (!user || !verifyPassword(password, user.password_salt, user.password_hash)) {
        res.status(401).json({ error: "Email ou senha inválidos." });
        return;
      }

      const token = await createSession(user.id);
      setSessionCookie(res, token, isProduction);
      res.json(sanitizeUser(user));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao realizar login.";
      res.status(500).json({ error: message });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      const user = await getSessionUser(req);
      if (!user) {
        res.status(401).json({ error: "Sessão não encontrada." });
        return;
      }

      res.json(user);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar sessão.";
      res.status(500).json({ error: message });
    }
  });

  app.put("/api/profile", async (req, res) => {
    const sessionUser = await requireAuth(req, res);
    if (!sessionUser) {
      return;
    }

    try {
      const currentUser = await selectUserByIdRow(sessionUser.id);
      if (!currentUser) {
        res.status(404).json({ error: "Usuário não encontrado." });
        return;
      }

      const body = req.body as Record<string, unknown>;
      const name = normalizeTextField(body.name ?? currentUser.name, "Nome", 120);
      const country = normalizeTextField(body.country ?? currentUser.country ?? "", "Pais", 120);
      const state = normalizeTextField(body.state ?? currentUser.state ?? "", "Estado", 120);
      const city = normalizeTextField(body.city ?? currentUser.city ?? "", "Cidade", 120);
      const neighborhood = normalizeTextField(
        body.neighborhood ?? currentUser.neighborhood ?? "",
        "Bairro",
        120,
      );
      const street = normalizeTextField(body.street ?? currentUser.street ?? "", "Rua", 200);
      const whatsappCountryIso = normalizeWhatsappCountryIso(
        body.whatsappCountryIso ?? currentUser.whatsapp_country_iso ?? "IT",
      );
      const whatsappNumber = normalizeWhatsappNumber(
        body.whatsappNumber ?? currentUser.whatsapp_number ?? "",
        whatsappCountryIso,
      );

      if (name.length < 2) {
        res.status(400).json({ error: "Nome deve ter pelo menos 2 caracteres." });
        return;
      }
      if (!whatsappNumber) {
        res.status(400).json({ error: "Numero de WhatsApp e obrigatorio." });
        return;
      }

      await updateUserProfileRecord({
        id: currentUser.id,
        name,
        country,
        state,
        city,
        neighborhood,
        street,
        whatsapp_country_iso: whatsappCountryIso,
        whatsapp_number: whatsappNumber,
      });

      const updatedUser = await selectUserByIdRow(currentUser.id);
      if (!updatedUser) {
        res.status(500).json({ error: "Falha ao atualizar perfil." });
        return;
      }

      res.json(sanitizeUser(updatedUser));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao atualizar perfil.";
      res.status(400).json({ error: message });
    }
  });

  app.put("/api/profile/avatar", async (req, res) => {
    const sessionUser = await requireAuth(req, res);
    if (!sessionUser) {
      return;
    }

    try {
      const body = req.body as Record<string, unknown>;
      const avatarUrl = normalizeAvatarUrl(body.avatarUrl);
      await updateUserAvatarRecord(sessionUser.id, avatarUrl);

      const updatedUser = await selectUserByIdRow(sessionUser.id);
      if (!updatedUser) {
        res.status(404).json({ error: "Usuário não encontrado." });
        return;
      }

      res.json(sanitizeUser(updatedUser));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao atualizar foto de perfil.";
      res.status(400).json({ error: message });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      const token = getSessionTokenFromRequest(req);
      if (token) {
        await deleteSessionByTokenHashRecord(hashToken(token));
      }

      clearSessionCookie(res, isProduction);
      res.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao encerrar sessão.";
      res.status(500).json({ error: message });
    }
  });

  app.get("/api/products", async (_req, res) => {
    try {
      const rows = await selectAllProductsRows();
      res.json(rows.map(rowToProduct));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao listar produtos.";
      res.status(500).json({ error: message });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId) || userId <= 0) {
      res.status(400).json({ error: "ID de usuário inválido." });
      return;
    }

    try {
      const user = await selectUserByIdRow(userId);
      if (!user) {
        res.status(404).json({ error: "Usuário não encontrado." });
        return;
      }
      res.json(sanitizePublicUser(user));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao carregar vendedor.";
      res.status(500).json({ error: message });
    }
  });

  app.get("/api/vendors", async (req, res) => {
    try {
      const rawSearch = String(req.query.search ?? "");
      const rawLimit = Number(req.query.limit ?? 60);
      const search = normalizeTextField(rawSearch, "Busca", 120).toLowerCase();
      const limit = Number.isFinite(rawLimit) ? rawLimit : 60;
      const rows = await selectVendorsRows(search, limit);
      res.json(rows.map(rowToPublicVendor));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao listar vendedores.";
      const statusCode = message.includes("Busca") ? 400 : 500;
      res.status(statusCode).json({ error: message });
    }
  });

  app.get("/api/vendors/:id/products", async (req, res) => {
    const vendorId = Number(req.params.id);
    if (!Number.isInteger(vendorId) || vendorId <= 0) {
      res.status(400).json({ error: "ID de vendedor inválido." });
      return;
    }

    try {
      const vendor = await selectUserByIdRow(vendorId);
      if (!vendor) {
        res.status(404).json({ error: "Vendedor não encontrado." });
        return;
      }

      const vendorProducts = await selectProductsByOwnerRows(vendorId);
      const vendorRecord: PublicVendorRecord = {
        id: vendor.id,
        name: vendor.name || `Vendedor ${vendor.id}`,
        avatarUrl: vendor.avatar_url ?? "",
        productCount: vendorProducts.length,
      };

      res.json({
        vendor: vendorRecord,
        products: vendorProducts.map(rowToProduct),
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha ao listar produtos do vendedor.";
      res.status(500).json({ error: message });
    }
  });

  app.get("/api/my-products", async (req, res) => {
    const user = await requireAuth(req, res);
    if (!user) {
      return;
    }

    try {
      const rows = await selectProductsByOwnerRows(user.id);
      res.json(rows.map(rowToProduct));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao listar seus produtos.";
      res.status(500).json({ error: message });
    }
  });

  app.get("/api/likes", async (req, res) => {
    const user = await requireAuth(req, res);
    if (!user) {
      return;
    }

    try {
      const rows = await selectLikedProductsByUserRows(user.id);
      res.json(rows.map(rowToProduct));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao listar curtidas.";
      res.status(500).json({ error: message });
    }
  });

  app.get("/api/notifications", async (req, res) => {
    const user = await requireAuth(req, res);
    if (!user) {
      return;
    }

    try {
      const rows = await selectLikeNotificationsByOwnerRows(user.id);
      res.json(rows.map(rowToNotification));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao listar notificações.";
      res.status(500).json({ error: message });
    }
  });

  app.post("/api/products", async (req, res) => {
    const user = await requireAuth(req, res);
    if (!user) {
      return;
    }
    if (!hasRequiredProfileForPublishing(user)) {
      res.status(400).json({
        error: "Para publicar, complete seu perfil com nome e numero de telefone.",
      });
      return;
    }

    try {
      const normalized = normalizeIncomingProduct(req.body);
      const productId = await createProductRecord(normalized, user.id);
      const created = await selectProductByIdRow(productId);

      if (!created) {
        res.status(500).json({ error: "Falha ao salvar o produto." });
        return;
      }

      res.status(201).json(rowToProduct(created));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao criar produto.";
      res.status(400).json({ error: message });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    const user = await requireAuth(req, res);
    if (!user) {
      return;
    }

    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "ID inválido." });
      return;
    }

    try {
      const existing = await selectProductByIdRow(id);
      if (!existing) {
        res.status(404).json({ error: "Produto não encontrado." });
        return;
      }
      if (existing.user_id !== user.id) {
        res.status(403).json({ error: "Você não tem permissão para editar este produto." });
        return;
      }

      const normalized = normalizeIncomingProduct(req.body);
      await updateProductRecord(id, normalized);

      const updated = await selectProductByIdRow(id);
      if (!updated) {
        res.status(500).json({ error: "Falha ao atualizar o produto." });
        return;
      }

      res.json(rowToProduct(updated));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao atualizar produto.";
      res.status(400).json({ error: message });
    }
  });

  app.post("/api/products/:id/like", async (req, res) => {
    const user = await requireAuth(req, res);
    if (!user) {
      return;
    }

    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "ID inválido." });
      return;
    }

    try {
      const existing = await selectProductByIdRow(id);
      if (!existing) {
        res.status(404).json({ error: "Produto não encontrado." });
        return;
      }

      await createProductLikeRecord(user.id, id);
      res.status(201).json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao curtir produto.";
      res.status(500).json({ error: message });
    }
  });

  app.delete("/api/products/:id/like", async (req, res) => {
    const user = await requireAuth(req, res);
    if (!user) {
      return;
    }

    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "ID inválido." });
      return;
    }

    try {
      await deleteProductLikeRecord(user.id, id);
      res.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao remover curtida.";
      res.status(500).json({ error: message });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    const user = await requireAuth(req, res);
    if (!user) {
      return;
    }

    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "ID inválido." });
      return;
    }

    try {
      const existing = await selectProductByIdRow(id);
      if (!existing) {
        res.status(404).json({ error: "Produto não encontrado." });
        return;
      }

      if (existing.user_id !== user.id) {
        res.status(403).json({ error: "Você não tem permissão para excluir este produto." });
        return;
      }

      await deleteProductRecord(id);
      res.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao excluir produto.";
      res.status(500).json({ error: message });
    }
  });

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Rota da API não encontrada." });
  });

  if (isProduction) {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== "true" },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(port, () => {
    const mode = isProduction ? "production" : "development";
    console.log(`Server running at http://localhost:${port} (${mode})`);
    console.log("Database: PostgreSQL via DATABASE_URL");
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start local server:", error);
  process.exit(1);
});
