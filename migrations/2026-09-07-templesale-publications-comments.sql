BEGIN;

SET search_path TO templesale, public;

ALTER TABLE establishments
  ADD COLUMN IF NOT EXISTS keywords TEXT NOT NULL DEFAULT '[]';

CREATE TABLE IF NOT EXISTS establishment_publications (
  id BIGSERIAL PRIMARY KEY,
  establishment_id BIGINT NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  owner_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  caption TEXT NOT NULL DEFAULT '',
  media TEXT NOT NULL DEFAULT '[]',
  image_url TEXT NOT NULL DEFAULT '',
  legacy_product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT),
  updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT)
);

CREATE INDEX IF NOT EXISTS idx_establishment_publications_establishment_created
  ON establishment_publications(establishment_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_establishment_publications_legacy_product
  ON establishment_publications(legacy_product_id)
  WHERE legacy_product_id IS NOT NULL;

ALTER TABLE product_comments
  ADD COLUMN IF NOT EXISTS publication_id BIGINT REFERENCES establishment_publications(id) ON DELETE CASCADE;

ALTER TABLE product_comments
  ALTER COLUMN product_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_comments_publication_created
  ON product_comments(publication_id, created_at DESC);

INSERT INTO establishment_publications (
  establishment_id,
  owner_user_id,
  caption,
  media,
  image_url,
  legacy_product_id,
  created_at,
  updated_at
)
SELECT
  p.establishment_id,
  p.user_id,
  COALESCE(NULLIF(BTRIM(p.description), ''), NULLIF(BTRIM(p.name), ''), ''),
  CASE
    WHEN COALESCE(NULLIF(BTRIM(p.image_urls), ''), NULLIF(BTRIM(p.images), '')) IS NOT NULL
      THEN COALESCE(NULLIF(BTRIM(p.image_urls), ''), NULLIF(BTRIM(p.images), ''))
    ELSE '["' || REPLACE(COALESCE(NULLIF(BTRIM(p.image), ''), NULLIF(BTRIM(p.image_url), '')), '"', '\"') || '"]'
  END,
  COALESCE(NULLIF(BTRIM(p.image), ''), NULLIF(BTRIM(p.image_url), '')),
  p.id,
  CASE
    WHEN p.created_at::TEXT ~ '^[0-9]+$' THEN p.created_at::TEXT::BIGINT
    ELSE EXTRACT(EPOCH FROM p.created_at::TEXT::TIMESTAMPTZ)::BIGINT
  END,
  CASE
    WHEN p.created_at::TEXT ~ '^[0-9]+$' THEN p.created_at::TEXT::BIGINT
    ELSE EXTRACT(EPOCH FROM p.created_at::TEXT::TIMESTAMPTZ)::BIGINT
  END
FROM products p
WHERE p.establishment_id IS NOT NULL
  AND COALESCE(NULLIF(BTRIM(p.image), ''), NULLIF(BTRIM(p.image_url), '')) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM establishment_publications ep
    WHERE ep.legacy_product_id = p.id
  );

COMMIT;
