SET search_path TO templesale, public;

CREATE TABLE IF NOT EXISTS establishments (
  id BIGSERIAL PRIMARY KEY,
  owner_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Altro',
  logo_url TEXT NOT NULL DEFAULT '',
  cover_url TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  whatsapp_country_iso TEXT NOT NULL DEFAULT 'IT',
  whatsapp_number TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  opening_hours TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT),
  updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT)
);

CREATE TABLE IF NOT EXISTS storefront_sections (
  id BIGSERIAL PRIMARY KEY,
  establishment_id BIGINT NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT),
  updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT),
  UNIQUE(establishment_id, slug)
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS establishment_id BIGINT REFERENCES establishments(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS section_id BIGINT REFERENCES storefront_sections(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_establishments_slug_unique ON establishments(slug);
CREATE INDEX IF NOT EXISTS idx_establishments_owner ON establishments(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_establishments_category_city ON establishments(category, city);
CREATE INDEX IF NOT EXISTS idx_storefront_sections_establishment ON storefront_sections(establishment_id, position);
CREATE INDEX IF NOT EXISTS idx_products_establishment_id ON products(establishment_id);
CREATE INDEX IF NOT EXISTS idx_products_section_id ON products(section_id);

INSERT INTO establishments (
  owner_user_id,
  name,
  slug,
  category,
  logo_url,
  city,
  address,
  latitude,
  longitude,
  whatsapp_country_iso,
  whatsapp_number,
  phone
)
SELECT
  u.id,
  COALESCE(NULLIF(BTRIM(u.name), ''), CONCAT('Attivita ', u.id::text)),
  CONCAT(
    REGEXP_REPLACE(
      LOWER(COALESCE(NULLIF(BTRIM(u.name), ''), CONCAT('attivita ', u.id::text))),
      '[^a-z0-9]+',
      '-',
      'g'
    ),
    '-',
    u.id::text
  ),
  'Altro',
  COALESCE(u.avatar_url, ''),
  COALESCE(u.city, ''),
  BTRIM(CONCAT_WS(', ', NULLIF(u.street, ''), NULLIF(u.neighborhood, ''))),
  u.location_latitude,
  u.location_longitude,
  COALESCE(NULLIF(u.whatsapp_country_iso, ''), 'IT'),
  COALESCE(u.whatsapp_number, ''),
  COALESCE(u.whatsapp_number, '')
FROM users u
WHERE
  EXISTS (SELECT 1 FROM products p WHERE p.user_id = u.id)
  AND NOT EXISTS (SELECT 1 FROM establishments e WHERE e.owner_user_id = u.id);

UPDATE products p
SET establishment_id = e.id
FROM establishments e
WHERE
  p.user_id = e.owner_user_id
  AND p.establishment_id IS NULL;
