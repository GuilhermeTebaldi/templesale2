import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { api, type PublicationDto } from './api';
import { type DiscoveryOrigin } from './discovery-location';
import { FeedRequestGate, mergePublicationFeed, protectedFeedPrefix, type FeedMergeMode } from './publication-feed';

export function usePublicationFeed(input: {
  origin: DiscoveryOrigin | null;
  active: boolean;
  publications: PublicationDto[];
  setPublications: Dispatch<SetStateAction<PublicationDto[]>>;
  deletedIds: number[];
}) {
  const latest = useRef(input);
  latest.current = input;
  const seen = useRef(new Set<number>());
  const gate = useRef(new FeedRequestGate());
  const paging = useRef({ origin: '', cursor: undefined as string | null | undefined, offset: 0, hasMore: false });
  const [visible, setVisible] = useState(() => document.visibilityState === 'visible');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');
  const lat = input.origin?.lat;
  const lng = input.origin?.lng;
  const originKey = lat !== undefined && lng !== undefined ? lat + ':' + lng : 'no-gps';

  const markSeen = useCallback((postId: string) => {
    const id = Number(postId.replace(/^publication_/, ''));
    if (Number.isSafeInteger(id) && id > 0) seen.current.add(id);
  }, []);

  // Check geometry immediately before committing too: the reader can scroll while a request is in flight.
  const captureVisible = useCallback(() => {
    if (!latest.current.active) return;
    for (const item of latest.current.publications) {
      const element = document.getElementById('feed-post-publication_' + item.id);
      if (!element || !element.getClientRects().length) continue;
      const bounds = element.getBoundingClientRect();
      if (bounds.bottom > 0 && bounds.top < window.innerHeight + 240) seen.current.add(item.id);
    }
  }, []);

  const load = useCallback(async (mode: FeedMergeMode): Promise<void> => {
    if (document.visibilityState !== 'visible' || !latest.current.active) return;
    if (mode === 'append' && (gate.current.busy || !paging.current.hasMore)) return;
    if (mode === 'append' && paging.current.origin !== originKey) mode = 'nearby';
    const request = gate.current.begin();
    setIsLoadingMore(mode === 'append');
    setIsLoading(mode !== 'append');
    setError('');
    captureVisible();
    const previous = latest.current.publications;
    const protectedItems: PublicationDto[] =
      mode === 'append' ? previous : mode === 'nearby' ? protectedFeedPrefix(previous, seen.current) : [];
    const excluded = new Set<number>(protectedItems.map(item => item.establishmentId));
    const location = latest.current.origin;
    let cursor = mode === 'append' ? paging.current.cursor : undefined;
    let offset = mode === 'append' ? paging.current.offset : 0;
    try {
      // On a large, already-read list, skip exhausted pages without changing the visible cards.
      while (gate.current.accepts(request)) {
        const page = await api.getPublicationsFeed({
          limit: mode === 'append' ? 8 : 18, offset, pagination: 'cursor', cursor,
          excludeIds: [...excluded].slice(-200),
          ...(location?.lat !== undefined && location.lng !== undefined ? { lat: location.lat, lng: location.lng } : {}),
        }, request.signal);
        if (!gate.current.accepts(request)) return;
        const nextCursor = page.nextCursor;
        const canContinue = nextCursor === undefined ? page.hasMore : page.hasMore && nextCursor !== null;
        if (canContinue && (nextCursor === undefined ? page.nextOffset <= offset : nextCursor === cursor)) {
          throw new Error('Não foi possível continuar o feed. Tente atualizar novamente.');
        }
        const candidates = page.publications.filter(item => !latest.current.deletedIds.includes(item.id));
        cursor = nextCursor;
        offset = page.nextOffset;
        if (canContinue && !candidates.some(item => !excluded.has(item.establishmentId))) continue;
        captureVisible();
        if (mode === 'reset') seen.current.clear();
        const protectedIds = new Set<number>(seen.current);
        latest.current.setPublications(current => mergePublicationFeed(
          current, candidates, protectedIds, mode,
        ).filter(item => !latest.current.deletedIds.includes(item.id)));
        paging.current = { origin: originKey, cursor, offset, hasMore: canContinue };
        setHasMore(canContinue);
        return;
      }
    } catch (failure) {
      if (!gate.current.accepts(request)) return;
      setError(failure instanceof Error ? failure.message : 'Falha ao carregar publicações.');
      setHasMore(false);
      paging.current.hasMore = false;
      // Existing cards remain available offline; the next foreground refresh retries.
    } finally {
      if (gate.current.accepts(request)) {
        gate.current.finish(request);
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    }
  }, [originKey, captureVisible]);

  useEffect(() => {
    const update = () => setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  useEffect(() => {
    if (!input.active || !visible) {
      gate.current.cancel();
      setIsLoading(false);
      setIsLoadingMore(false);
      return;
    }
    void load('nearby');
    const interval = window.setInterval(() => {
      if (!gate.current.busy) void load('nearby');
    }, 60000);
    return () => { window.clearInterval(interval); gate.current.cancel(); };
  }, [input.active, visible, load]);

  const loadPage = useCallback(({ append, preserveSeen = false }: { append: boolean; preserveSeen?: boolean }) =>
    load(append ? 'append' : preserveSeen ? 'nearby' : 'reset'), [load]);
  return { loadPage, markSeen, isLoading, isLoadingMore, hasMore, error };
}
