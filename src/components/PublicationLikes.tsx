import React from 'react';
import { Loader2 } from 'lucide-react';
import { api, type PublicLikerDto } from '../lib/api';
import { ProgressiveProductImage } from './ProductCard';
import { ProfilePhotoButton } from './ProfilePhotoViewer';

export default function PublicationLikes({ publicationId }: { publicationId: number }) {
  const [users, setUsers] = React.useState<PublicLikerDto[]>([]);
  const [cursor, setCursor] = React.useState<string | null>(null);
  const [hasMore, setHasMore] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const active = React.useRef(false);
  const busy = React.useRef(false);
  const load = React.useCallback(async (after: string | null = null) => {
    if (busy.current) return;
    busy.current = true; setLoading(true); setError('');
    try {
      const page = await api.getPublicationLikers(publicationId, after);
      if (!active.current) return;
      setUsers(current => after ? [...current, ...page.users.filter(user => !current.some(item => item.id === user.id))] : page.users);
      setCursor(page.nextCursor); setHasMore(page.hasMore);
    } catch { if (active.current) setError('Impossibile caricare i Mi piace. Riprova.'); }
    finally { busy.current = false; if (active.current) setLoading(false); }
  }, [publicationId]);
  React.useEffect(() => { active.current = true; void load(); return () => { active.current = false; }; }, [load]);
  return (
    <div className="py-3" role="tabpanel" aria-label="Mi piace">
      {users.map(user => (
        <div key={user.id} className="flex items-center gap-3 border-b border-neutral-200/70 py-3">
          <ProfilePhotoButton src={user.avatarUrl} name={user.name} className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-stone-100">
            {user.avatarUrl ? <ProgressiveProductImage src={user.avatarUrl} alt="" className="h-full w-full object-cover" variant="thumbnail" />
              : <span className="flex h-full items-center justify-center text-sm font-semibold text-stone-500">{user.name.slice(0, 1).toUpperCase()}</span>}
          </ProfilePhotoButton>
          <span className="min-w-0 truncate text-sm font-semibold text-neutral-100">{user.name}</span>
        </div>
      ))}
      {loading && <p role="status" className="flex items-center gap-2 py-6 text-sm text-neutral-400"><Loader2 className="h-4 w-4 animate-spin" />Caricamento Mi piace…</p>}
      {!loading && !error && !users.length && <p className="py-8 text-sm text-neutral-500">Ancora nessun Mi piace.</p>}
      {error && <div className="py-4"><p role="alert" className="text-sm text-red-600">{error}</p><button type="button" onClick={() => void load(cursor)} className="mt-2 text-sm font-semibold text-sky-600">Riprova</button></div>}
      {hasMore && !error && <button type="button" disabled={loading} onClick={() => void load(cursor)} className="mt-4 rounded-lg border border-neutral-200 px-4 py-2 text-sm text-neutral-500 hover:text-sky-600 disabled:opacity-50">Carica altri Mi piace</button>}
    </div>
  );
}
