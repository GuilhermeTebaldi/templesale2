import cors from "cors";
import crypto from "node:crypto";
import Database from "better-sqlite3";
import express, { type Request, type Response } from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";

type ProductRecord = {
  id: number;
  name: string;
  category: string;
  price: string;
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

type UserRow = {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  password_salt: string;
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
  country?: string;
  state?: string;
  city?: string;
  neighborhood?: string;
  street?: string;
  whatsappCountryIso?: string;
  whatsappNumber?: string;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DB_DIR, "local.db");
const DEFAULT_IMAGE = "https://picsum.photos/seed/placeholder/800/1200";
const SESSION_COOKIE_NAME = "templesale_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WHATSAPP_COUNTRIES = {
  IT: {
    iso: "IT",
    name: "Italia",
    dialDigits: "39",
  },
} as const;

type WhatsappCountryIso = keyof typeof WHATSAPP_COUNTRIES;

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

const productColumns = db.prepare("PRAGMA table_info(products)").all() as Array<{
  name: string;
}>;

if (!productColumns.some((column) => column.name === "user_id")) {
  db.exec("ALTER TABLE products ADD COLUMN user_id INTEGER");
}
if (!productColumns.some((column) => column.name === "latitude")) {
  db.exec("ALTER TABLE products ADD COLUMN latitude REAL");
}
if (!productColumns.some((column) => column.name === "longitude")) {
  db.exec("ALTER TABLE products ADD COLUMN longitude REAL");
}

const userColumns = db.prepare("PRAGMA table_info(users)").all() as Array<{
  name: string;
}>;

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

const selectAllProducts = db.prepare(`
  SELECT
    p.id,
    p.name,
    p.category,
    p.price,
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
  FROM products p
  LEFT JOIN users u ON u.id = p.user_id
  ORDER BY p.id DESC
`);

const selectProductsByOwner = db.prepare(`
  SELECT
    p.id,
    p.name,
    p.category,
    p.price,
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
  FROM products p
  LEFT JOIN users u ON u.id = p.user_id
  WHERE p.user_id = ?
  ORDER BY p.id DESC
`);

const selectProductById = db.prepare(`
  SELECT
    p.id,
    p.name,
    p.category,
    p.price,
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
  FROM products p
  LEFT JOIN users u ON u.id = p.user_id
  WHERE p.id = ?
`);

const selectLikedProductsByUser = db.prepare(`
  SELECT
    p.id,
    p.name,
    p.category,
    p.price,
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
  FROM product_likes l
  INNER JOIN products p ON p.id = l.product_id
  LEFT JOIN users u ON u.id = p.user_id
  WHERE l.user_id = ?
  ORDER BY l.created_at DESC, p.id DESC
`);

const createProductStatement = db.prepare(`
  INSERT INTO products (
    name,
    category,
    price,
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
    @image,
    @images,
    @description,
    @details,
    @user_id,
    @latitude,
    @longitude
  )
`);

const updateProductByIdStatement = db.prepare(`
  UPDATE products
  SET
    name = @name,
    category = @category,
    price = @price,
    image = @image,
    images = @images,
    description = @description,
    details = @details,
    latitude = @latitude,
    longitude = @longitude
  WHERE id = @id
`);

const deleteProductById = db.prepare(`
  DELETE FROM products
  WHERE id = ?
`);

const createProductLikeStatement = db.prepare(`
  INSERT OR IGNORE INTO product_likes (user_id, product_id)
  VALUES (?, ?)
`);

const deleteProductLikeStatement = db.prepare(`
  DELETE FROM product_likes
  WHERE user_id = ? AND product_id = ?
`);

const selectUserByEmail = db.prepare(`
  SELECT
    id,
    name,
    email,
    password_hash,
    password_salt,
    country,
    state,
    city,
    neighborhood,
    street,
    whatsapp_country_iso,
    whatsapp_number
  FROM users
  WHERE email = ?
`);

const selectUserById = db.prepare(`
  SELECT
    id,
    name,
    email,
    password_hash,
    password_salt,
    country,
    state,
    city,
    neighborhood,
    street,
    whatsapp_country_iso,
    whatsapp_number
  FROM users
  WHERE id = ?
`);

const createUserStatement = db.prepare(`
  INSERT INTO users (name, email, password_hash, password_salt)
  VALUES (?, ?, ?, ?)
`);

const updateUserProfileStatement = db.prepare(`
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
`);

const createSessionStatement = db.prepare(`
  INSERT INTO sessions (user_id, token_hash, expires_at)
  VALUES (?, ?, ?)
`);

const deleteSessionByTokenHash = db.prepare(`
  DELETE FROM sessions
  WHERE token_hash = ?
`);

const deleteExpiredSessions = db.prepare(`
  DELETE FROM sessions
  WHERE expires_at <= strftime('%s', 'now')
`);

const selectSessionUserByTokenHash = db.prepare(`
  SELECT
    u.id,
    u.name,
    u.email,
    u.country,
    u.state,
    u.city,
    u.neighborhood,
    u.street,
    u.whatsapp_country_iso,
    u.whatsapp_number
  FROM sessions s
  INNER JOIN users u ON u.id = s.user_id
  WHERE s.token_hash = ? AND s.expires_at > strftime('%s', 'now')
`);

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

function normalizeIncomingProduct(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Payload inválido.");
  }

  const body = payload as Record<string, unknown>;
  const name = String(body.name ?? "").trim();
  const category = String(body.category ?? "").trim();
  const price = String(body.price ?? "").trim();
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
  if (!price) {
    throw new Error("Preço é obrigatório.");
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

function sessionCookieOptions(isProduction: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction,
    path: "/",
    maxAge: SESSION_TTL_SECONDS * 1000,
  };
}

function setSessionCookie(res: Response, token: string, isProduction: boolean) {
  res.cookie(SESSION_COOKIE_NAME, token, sessionCookieOptions(isProduction));
}

function clearSessionCookie(res: Response, isProduction: boolean) {
  res.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions(isProduction));
}

function sanitizeUser(
  user: Pick<
    UserRow,
    | "id"
    | "name"
    | "email"
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
    country: user.country ?? "",
    state: user.state ?? "",
    city: user.city ?? "",
    neighborhood: user.neighborhood ?? "",
    street: user.street ?? "",
    whatsappCountryIso: user.whatsapp_country_iso ?? "IT",
    whatsappNumber: user.whatsapp_number ?? "",
  };
}

function createSession(userId: number): string {
  deleteExpiredSessions.run();

  const token = crypto.randomBytes(48).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;

  createSessionStatement.run(userId, tokenHash, expiresAt);

  return token;
}

function getSessionUser(req: Request): SessionUser | null {
  deleteExpiredSessions.run();

  const token = getSessionTokenFromRequest(req);
  if (!token) {
    return null;
  }

  const tokenHash = hashToken(token);
  const user = selectSessionUserByTokenHash.get(tokenHash) as
    | Pick<
        UserRow,
        | "id"
        | "name"
        | "email"
        | "country"
        | "state"
        | "city"
        | "neighborhood"
        | "street"
        | "whatsapp_country_iso"
        | "whatsapp_number"
      >
    | undefined;
  if (!user) {
    return null;
  }
  return sanitizeUser(user);
}

function requireAuth(req: Request, res: Response): SessionUser | null {
  const user = getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: "Faça login para continuar." });
    return null;
  }
  return user;
}

async function bootstrap() {
  const app = express();
  const isProduction = process.env.NODE_ENV === "production";
  const port = Number(process.env.PORT || 5173);

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "2mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, mode: isProduction ? "production" : "development" });
  });

  app.post("/api/auth/register", (req, res) => {
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

      const existingUser = selectUserByEmail.get(email) as UserRow | undefined;
      if (existingUser) {
        res.status(409).json({ error: "Este email já está cadastrado." });
        return;
      }

      const passwordCredentials = createPasswordCredentials(password);
      const insertResult = createUserStatement.run(
        name,
        email,
        passwordCredentials.hash,
        passwordCredentials.salt,
      );

      const createdUser = selectUserById.get(Number(insertResult.lastInsertRowid)) as
        | UserRow
        | undefined;

      if (!createdUser) {
        res.status(500).json({ error: "Falha ao criar usuário." });
        return;
      }

      const token = createSession(createdUser.id);
      setSessionCookie(res, token, isProduction);
      res.status(201).json(sanitizeUser(createdUser));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao criar conta.";
      res.status(500).json({ error: message });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    try {
      const body = req.body as Record<string, unknown>;
      const email = normalizeEmail(String(body.email ?? ""));
      const password = String(body.password ?? "").trim();

      if (!EMAIL_REGEX.test(email) || !password) {
        res.status(400).json({ error: "Email e senha são obrigatórios." });
        return;
      }

      const user = selectUserByEmail.get(email) as UserRow | undefined;
      if (!user || !verifyPassword(password, user.password_salt, user.password_hash)) {
        res.status(401).json({ error: "Email ou senha inválidos." });
        return;
      }

      const token = createSession(user.id);
      setSessionCookie(res, token, isProduction);
      res.json(sanitizeUser(user));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao realizar login.";
      res.status(500).json({ error: message });
    }
  });

  app.get("/api/auth/me", (req, res) => {
    const user = getSessionUser(req);
    if (!user) {
      res.status(401).json({ error: "Sessão não encontrada." });
      return;
    }

    res.json(user);
  });

  app.put("/api/profile", (req, res) => {
    const sessionUser = requireAuth(req, res);
    if (!sessionUser) {
      return;
    }

    const currentUser = selectUserById.get(sessionUser.id) as UserRow | undefined;
    if (!currentUser) {
      res.status(404).json({ error: "Usuário não encontrado." });
      return;
    }

    try {
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

      updateUserProfileStatement.run({
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

      const updatedUser = selectUserById.get(currentUser.id) as UserRow | undefined;
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

  app.post("/api/auth/logout", (req, res) => {
    const token = getSessionTokenFromRequest(req);
    if (token) {
      deleteSessionByTokenHash.run(hashToken(token));
    }

    clearSessionCookie(res, isProduction);
    res.json({ success: true });
  });

  app.get("/api/products", (_req, res) => {
    const rows = selectAllProducts.all() as ProductRow[];
    res.json(rows.map(rowToProduct));
  });

  app.get("/api/my-products", (req, res) => {
    const user = requireAuth(req, res);
    if (!user) {
      return;
    }

    const rows = selectProductsByOwner.all(user.id) as ProductRow[];
    res.json(rows.map(rowToProduct));
  });

  app.get("/api/likes", (req, res) => {
    const user = requireAuth(req, res);
    if (!user) {
      return;
    }

    const rows = selectLikedProductsByUser.all(user.id) as ProductRow[];
    res.json(rows.map(rowToProduct));
  });

  app.post("/api/products", (req, res) => {
    const user = requireAuth(req, res);
    if (!user) {
      return;
    }

    try {
      const normalized = normalizeIncomingProduct(req.body);
      const result = createProductStatement.run({
        ...normalized,
        user_id: user.id,
      });

      const created = selectProductById.get(Number(result.lastInsertRowid)) as
        | ProductRow
        | undefined;

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

  app.put("/api/products/:id", (req, res) => {
    const user = requireAuth(req, res);
    if (!user) {
      return;
    }

    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "ID inválido." });
      return;
    }

    const existing = selectProductById.get(id) as ProductRow | undefined;
    if (!existing) {
      res.status(404).json({ error: "Produto não encontrado." });
      return;
    }
    if (existing.user_id !== user.id) {
      res.status(403).json({ error: "Você não tem permissão para editar este produto." });
      return;
    }

    try {
      const normalized = normalizeIncomingProduct(req.body);
      updateProductByIdStatement.run({
        id,
        ...normalized,
      });

      const updated = selectProductById.get(id) as ProductRow | undefined;
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

  app.post("/api/products/:id/like", (req, res) => {
    const user = requireAuth(req, res);
    if (!user) {
      return;
    }

    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "ID inválido." });
      return;
    }

    const existing = selectProductById.get(id) as ProductRow | undefined;
    if (!existing) {
      res.status(404).json({ error: "Produto não encontrado." });
      return;
    }

    createProductLikeStatement.run(user.id, id);
    res.status(201).json({ success: true });
  });

  app.delete("/api/products/:id/like", (req, res) => {
    const user = requireAuth(req, res);
    if (!user) {
      return;
    }

    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "ID inválido." });
      return;
    }

    deleteProductLikeStatement.run(user.id, id);
    res.json({ success: true });
  });

  app.delete("/api/products/:id", (req, res) => {
    const user = requireAuth(req, res);
    if (!user) {
      return;
    }

    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "ID inválido." });
      return;
    }

    const existing = selectProductById.get(id) as ProductRow | undefined;
    if (!existing) {
      res.status(404).json({ error: "Produto não encontrado." });
      return;
    }

    if (existing.user_id !== user.id) {
      res.status(403).json({ error: "Você não tem permissão para excluir este produto." });
      return;
    }

    deleteProductById.run(id);
    res.json({ success: true });
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
    console.log(`SQLite DB: ${DB_PATH}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start local server:", error);
  process.exit(1);
});
