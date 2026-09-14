/** Company coordinates determine proximity; recency chooses each company's previews. */
export function buildLocalFeedQuery(input: { latitude?: number; longitude?: number; limit: number; offset: number }, postgres: boolean) {
  const nearby = input.latitude !== undefined && input.longitude !== undefined;
  const values: unknown[] = [input.limit + 1, input.offset];
  if (nearby) values.push(input.latitude, input.longitude);
  const distance = nearby
    ? `12742.0 * ASIN(SQRT(${postgres ? 'LEAST' : 'MIN'}(1.0,
        POWER(SIN(RADIANS(e.latitude - $3) / 2), 2) +
        COS(RADIANS($3)) * COS(RADIANS(e.latitude)) * POWER(SIN(RADIANS(e.longitude - $4) / 2), 2))))`
    : 'NULL';
  return {
    values,
    sql: `WITH ranked AS (
      SELECT ep.*, e.name AS establishment_name, e.slug AS establishment_slug,
        e.category AS establishment_category, e.city AS establishment_city,
        e.logo_url AS establishment_logo_url, e.cover_url AS establishment_cover_url,
        u.avatar_url AS owner_avatar_url,
        (SELECT COUNT(*) FROM publication_likes pl WHERE pl.publication_id = ep.id) AS likes_count,
        ${distance} AS distance_km,
        ROW_NUMBER() OVER (PARTITION BY ep.establishment_id ORDER BY ep.created_at DESC, ep.id DESC) AS company_position
      FROM establishment_publications ep
      INNER JOIN establishments e ON e.id = ep.establishment_id
      LEFT JOIN users u ON u.id = ep.owner_user_id
      WHERE e.is_active = ${postgres ? 'TRUE' : '1'}
        AND e.latitude IS NOT NULL AND e.longitude IS NOT NULL
        AND e.latitude BETWEEN -90 AND 90 AND e.longitude BETWEEN -180 AND 180
    )
    SELECT * FROM ranked
    ${nearby ? 'WHERE company_position <= 3' : ''}
    ORDER BY ${nearby ? 'distance_km ASC, ' : ''}created_at DESC, id DESC
    LIMIT $1 OFFSET $2`,
  };
}
