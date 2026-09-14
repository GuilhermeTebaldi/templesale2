export type FeedItem = { id: number; establishmentId: number };
export type FeedMergeMode = 'reset' | 'nearby' | 'append';

/** Keep the entire prefix through the last visible card, so heights above it cannot change. */
export function protectedFeedPrefix<T extends FeedItem>(items: T[], seen: ReadonlySet<number>): T[] {
  let lastSeen = -1;
  items.forEach((item, index) => { if (seen.has(item.id)) lastSeen = index; });
  return items.slice(0, lastSeen + 1);
}

export function mergePublicationFeed<T extends FeedItem>(
  current: T[], incoming: T[], seen: ReadonlySet<number>, mode: FeedMergeMode,
): T[] {
  const result = mode === 'append' ? [...current] : mode === 'nearby' ? protectedFeedPrefix(current, seen) : [];
  const companies = new Set(result.map(item => item.establishmentId));
  const ids = new Set(result.map(item => item.id));
  for (const item of incoming) {
    if (companies.has(item.establishmentId) || ids.has(item.id)) continue;
    result.push(item);
    companies.add(item.establishmentId);
    ids.add(item.id);
  }
  return result;
}

/** Aborted or superseded requests cannot commit their results or clear a newer loading state. */
export class FeedRequestGate {
  private current: AbortController | null = null;
  get busy() { return this.current !== null; }
  begin() {
    this.cancel();
    this.current = new AbortController();
    return this.current;
  }
  accepts(request: AbortController) { return this.current === request && !request.signal.aborted; }
  finish(request: AbortController) { if (this.current === request) this.current = null; }
  cancel() { this.current?.abort(); this.current = null; }
}
