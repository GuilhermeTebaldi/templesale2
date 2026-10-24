import React from 'react';
import Curtidas from './Curtidas';
import { api, type PublicationDto } from '../lib/api';

export default function DeletedPublications({ onClose, onEdit, onRestored, onPermanentlyDeleted, updatedPublication }: {
  key?: number;
  onClose: () => void;
  onEdit: (publication: PublicationDto) => void;
  onRestored: (publication: PublicationDto) => void;
  onPermanentlyDeleted: (publication: PublicationDto) => void;
  updatedPublication: PublicationDto | null;
}) {
  const [items, setItems] = React.useState<PublicationDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [hasMore, setHasMore] = React.useState(false);
  const controller = React.useRef<AbortController | null>(null);
  const offset = React.useRef(0);
  const load = React.useCallback(async (more = false) => {
    controller.current?.abort();
    const request = new AbortController(); controller.current = request;
    setLoading(true); setError('');
    try {
      const page = await api.getDeletedPublications(more ? offset.current : 0, request.signal);
      if (request.signal.aborted) return;
      setItems(current => more ? [...current, ...page.publications.filter(item => !current.some(existing => existing.id === item.id))] : page.publications);
      offset.current = page.nextOffset; setHasMore(page.hasMore);
    } catch {
      if (!request.signal.aborted) setError('Impossibile caricare gli eliminati.');
    } finally { if (!request.signal.aborted) setLoading(false); }
  }, []);
  React.useEffect(() => { void load(); return () => controller.current?.abort(); }, [load]);
  React.useEffect(() => {
    if (updatedPublication) setItems(current => current.map(item => item.id === updatedPublication.id ? { ...item, ...updatedPublication, isTrashed: item.isTrashed } : item));
  }, [updatedPublication]);

  return <Curtidas kind="deleted" products={[]} publications={items} isLoading={loading}
    onClose={onClose} onOpenProduct={() => {}} onRemove={async () => {}} onOpenPublication={onEdit}
    status={error ? <p role="alert" className="mb-4 text-sm text-red-600">{error} <button type="button" className="underline" onClick={() => void load()}>Riprova</button></p> : null}
    footer={loading ? <p role="status" className="py-5 text-center text-sm text-neutral-400">Caricamento…</p> : hasMore ?
      <button type="button" className="my-4 w-full rounded-xl border border-neutral-700 p-3 text-sm" onClick={() => void load(true)}>Mostra altre</button> : null}
    onRestorePublication={async id => {
      const item = items.find(item => item.id === id);
      if (!item || item.isTrashed === false) return;
      controller.current?.abort(); setLoading(false);
      const restored = { ...item, ...await api.restorePublication(id), isTrashed: false };
      setItems(current => current.map(item => item.id === id ? restored : item));
      onRestored(restored);
    }}
    onRemovePublication={async id => {
      const item = items.find(item => item.id === id);
      if (!item || !window.confirm(item.isTrashed === false
        ? 'Eliminare definitivamente questa foto anche dal profilo? Non potrai recuperarla.'
        : 'Eliminare definitivamente questa foto? Non potrai recuperarla.')) return;
      controller.current?.abort(); setLoading(false);
      await api.permanentlyDeletePublication(id);
      setItems(current => current.filter(item => item.id !== id));
      offset.current = Math.max(0, offset.current - 1);
      onPermanentlyDeleted(item);
    }} />;
}
