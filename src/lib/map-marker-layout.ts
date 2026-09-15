export type MapScreenPoint = { x: number; y: number };
type MapScreenItem = MapScreenPoint & { key: string; priority?: boolean };
export type MapMarkerGroup = MapScreenPoint & { keys: string[]; detailed: boolean };

export const MAP_PIN_SIZE = 44;
export const MAP_PIN_ANCHOR: [number, number] = [22, 48];
export const MAP_LABEL_SIZE: [number, number] = [190, 68];
export const MAP_LABEL_ANCHOR: [number, number] = [95, 62];
export const MAP_DETAIL_ZOOM = 14;
// Leaves space between the 44px touch targets, including after rotation.
const CLUSTER_SPACING = 68;

type Rect = { left: number; top: number; right: number; bottom: number };
const pinRect = ({ x, y }: MapScreenPoint): Rect => ({
  left: x - MAP_PIN_ANCHOR[0], top: y - MAP_PIN_ANCHOR[1],
  right: x + MAP_PIN_SIZE / 2, bottom: y,
});
const overlaps = (a: Rect, b: Rect) =>
  a.left < b.right + 6 && a.right + 6 > b.left && a.top < b.bottom + 6 && a.bottom + 6 > b.top;

/** Presentation only: receives Leaflet's projected pixels, never changes company coordinates.
 * The map already limits its visible candidates to 80. Merge the closest anchors until
 * compact markers fit; weighted centers keep counts/positions stable regardless of input order.
 */
export function layoutMapMarkers(
  items: MapScreenItem[],
  zoom: number,
  viewport: MapScreenPoint,
  reservedPoints: MapScreenPoint[] = [],
): MapMarkerGroup[] {
  const unique = new Map(items.filter(p => Number.isFinite(p.x) && Number.isFinite(p.y)).map(p => [p.key, p]));
  const groups = [...unique.values()].sort((a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0)
    .map(p => ({ x: p.x, y: p.y, keys: [p.key], detailed: false }));

  // Recheck merged centers too: averaging a group must not cover a third marker.
  while (true) {
    let pair: [number, number] | null = null;
    let distance = CLUSTER_SPACING ** 2;
    for (let i = 0; i < groups.length; i++) {
      for (let j = i + 1; j < groups.length; j++) {
        const d = (groups[i].x - groups[j].x) ** 2 + (groups[i].y - groups[j].y) ** 2;
        if (d < distance) { distance = d; pair = [i, j]; }
      }
    }
    if (!pair) break;
    const [i, j] = pair;
    const a = groups[i], b = groups[j], count = a.keys.length + b.keys.length;
    a.x = (a.x * a.keys.length + b.x * b.keys.length) / count;
    a.y = (a.y * a.keys.length + b.y * b.keys.length) / count;
    a.keys.push(...b.keys);
    groups.splice(j, 1);
  }

  const visible = groups.filter(p => p.x >= -MAP_LABEL_SIZE[0] && p.x <= viewport.x + MAP_LABEL_SIZE[0]
    && p.y >= -MAP_LABEL_SIZE[1] && p.y <= viewport.y + MAP_LABEL_SIZE[1]);
  if (zoom < MAP_DETAIL_ZOOM) return visible;

  // Labels stay upright with map rotation. Use screen rectangles, not geographic radius.
  const occupied = visible.map(pinRect);
  const reserved = reservedPoints.map(p => ({ left: p.x - 22, top: p.y - 22, right: p.x + 22, bottom: p.y + 22 }));
  const candidates = visible.map((_, i) => i).sort((a, b) =>
    Number(visible[b].keys.some(key => unique.get(key)?.priority)) - Number(visible[a].keys.some(key => unique.get(key)?.priority)));
  for (const i of candidates) {
    const group = visible[i];
    if (group.keys.length !== 1) continue;
    const rect = {
      left: group.x - MAP_LABEL_ANCHOR[0], top: group.y - MAP_LABEL_ANCHOR[1],
      right: group.x - MAP_LABEL_ANCHOR[0] + MAP_LABEL_SIZE[0],
      bottom: group.y - MAP_LABEL_ANCHOR[1] + MAP_LABEL_SIZE[1],
    };
    if (rect.left < 8 || rect.top < 8 || rect.right > viewport.x - 8 || rect.bottom > viewport.y - 8) continue;
    if (occupied.some((other, j) => i !== j && overlaps(rect, other)) || reserved.some(other => overlaps(rect, other))) continue;
    group.detailed = true;
    occupied[i] = rect;
  }
  return visible;
}
