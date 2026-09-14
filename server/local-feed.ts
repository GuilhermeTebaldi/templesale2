import { Buffer } from 'node:buffer';

export type FeedLocation = { latitude?: number; longitude?: number };
export type FeedCursor = {
  version: 1; latitude: number | null; longitude: number | null;
  snapshotId: number; distance: number | null; createdAt: number; id: number;
};

export function parseFeedCursor(value: unknown, location: FeedLocation): FeedCursor | undefined {
  if (value === undefined || value === '') return undefined;
  try {
    if (typeof value !== 'string' || value.length > 1024 || !/^[\w-]+$/.test(value)) throw new Error();
    const cursor = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as FeedCursor;
    const nearby = location.latitude !== undefined && location.longitude !== undefined;
    if (cursor.version !== 1 || cursor.latitude !== (location.latitude ?? null) ||
        cursor.longitude !== (location.longitude ?? null) ||
        !Number.isSafeInteger(cursor.snapshotId) || cursor.snapshotId < 0 ||
        !Number.isSafeInteger(cursor.id) || cursor.id <= 0 || cursor.id > cursor.snapshotId ||
        !Number.isSafeInteger(cursor.createdAt) || cursor.createdAt < 0 ||
        (nearby ? typeof cursor.distance !== 'number' || !Number.isFinite(cursor.distance) ||
          cursor.distance < 0 || cursor.distance > 20040 : cursor.distance !== null)) throw new Error();
    return cursor;
  } catch {
    throw new Error('Paginação inválida. Reinicie a consulta para esta localização.');
  }
}

export function encodeFeedCursor(row: Record<string, unknown>, snapshotId: number, location: FeedLocation): string {
  const cursor: FeedCursor = {
    version: 1, latitude: location.latitude ?? null, longitude: location.longitude ?? null,
    snapshotId, distance: row.distance_km == null ? null : Number(row.distance_km),
    createdAt: Number(row.created_at), id: Number(row.id),
  };
  return Buffer.from(JSON.stringify(cursor)).toString('base64url');
}

export function parseFeedExclusions(value: unknown): number[] {
  if (value === undefined || value === '') return [];
  if (typeof value !== 'string' || !/^\d+(,\d+)*$/.test(value)) throw new Error('Empresas excluídas inválidas.');
  const ids = value.split(',').map(Number);
  if (ids.length > 200 || ids.some(id => !Number.isSafeInteger(id) || id <= 0)) throw new Error('Empresas excluídas inválidas.');
  return [...new Set(ids)];
}

/** One latest publication per company, including older photos when no new one exists. */
export function buildLocalFeedQuery(input: FeedLocation & { limit: number; offset: number; snapshotId?: number; cursor?: FeedCursor; excludeIds?: number[] }, postgres: boolean) {
  const nearby = input.latitude !== undefined && input.longitude !== undefined;
  const values: unknown[] = [input.limit + 1, input.offset];
  if (nearby) values.push(input.latitude, input.longitude);
  const distance = nearby
    ? `12742.0 * ASIN(SQRT(${postgres ? 'LEAST' : 'MIN'}(1.0,
        POWER(SIN(RADIANS(e.latitude - $3) / 2), 2) +
        COS(RADIANS($3)) * COS(RADIANS(e.latitude)) * POWER(SIN(RADIANS(e.longitude - $4) / 2), 2))))`
    : 'NULL';
  const bind = (value: unknown) => { values.push(value); return '$' + values.length; };
  const snapshot = input.snapshotId === undefined ? '' : 'AND ep.id <= ' + bind(input.snapshotId);
  const filters = ['company_position = 1'];
  if (input.excludeIds?.length) filters.push('establishment_id NOT IN (' + input.excludeIds.map(bind).join(',') + ')');
  if (input.cursor) {
    const time = bind(input.cursor.createdAt);
    const id = bind(input.cursor.id);
    const after = '(created_at < ' + time + ' OR (created_at = ' + time + ' AND id < ' + id + '))';
    if (nearby) {
      const distanceRef = bind(input.cursor.distance);
      filters.push('(distance_km > ' + distanceRef + ' OR (distance_km = ' + distanceRef + ' AND ' + after + '))');
    } else filters.push(after);
  }
  return {
    values,
    sql: `WITH ranked AS (
      SELECT ep.*, e.name AS establishment_name, e.slug AS establishment_slug,
        e.category AS establishment_category, e.city AS establishment_city,
        e.logo_url AS establishment_logo_url, e.cover_url AS establishment_cover_url,
        u.avatar_url AS owner_avatar_url,
        e.latitude AS establishment_latitude, e.longitude AS establishment_longitude,
        e.address AS establishment_address, e.whatsapp_country_iso AS establishment_whatsapp_country_iso,
        COALESCE(NULLIF(e.whatsapp_number, ''), e.phone, '') AS establishment_whatsapp_number,
        (SELECT COUNT(*) FROM publication_likes pl WHERE pl.publication_id = ep.id) AS likes_count,
        ${distance} AS distance_km,
        ROW_NUMBER() OVER (PARTITION BY ep.establishment_id ORDER BY ep.created_at DESC, ep.id DESC) AS company_position
      FROM establishment_publications ep
      INNER JOIN establishments e ON e.id = ep.establishment_id
      LEFT JOIN users u ON u.id = ep.owner_user_id
      WHERE e.is_active = ${postgres ? 'TRUE' : '1'} ${snapshot}
        AND e.latitude IS NOT NULL AND e.longitude IS NOT NULL
        AND e.latitude BETWEEN -90 AND 90 AND e.longitude BETWEEN -180 AND 180
    )
    SELECT * FROM ranked
    WHERE ${filters.join(' AND ')}
    ORDER BY ${nearby ? 'distance_km ASC, ' : ''}created_at DESC, id DESC
    LIMIT $1 OFFSET $2`,
  };
}


/** Search thumbnails are independent of the one-photo-per-company feed. */
export function buildPublicationPreviewsQuery(establishmentIds: number[]) {
  if (!establishmentIds.length || establishmentIds.length > 100 ||
      establishmentIds.some(id => !Number.isSafeInteger(id) || id <= 0)) {
    throw new Error('Empresas inválidas para prévias.');
  }
  return {
    values: establishmentIds,
    sql: `WITH ranked AS (
      SELECT ep.*, ROW_NUMBER() OVER (
        PARTITION BY ep.establishment_id ORDER BY ep.created_at DESC, ep.id DESC
      ) AS position
      FROM establishment_publications ep
      WHERE ep.establishment_id IN (${establishmentIds.map((_, index) => '$' + (index + 1)).join(',')})
    )
    SELECT ranked.*, u.avatar_url AS owner_avatar_url,
      (SELECT COUNT(*) FROM publication_likes pl WHERE pl.publication_id = ranked.id) AS likes_count
    FROM ranked LEFT JOIN users u ON u.id = ranked.owner_user_id
    WHERE position <= 3 ORDER BY created_at DESC, id DESC`,
  };
}
