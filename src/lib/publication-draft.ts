import type { FilterPreset, PhotoAdjustments, PhotoCrop, OverlayItem } from '../components/photo-publisher/types';
export type PublicationDraft = { file: File; source?: Blob; editor?: { filter: FilterPreset; adjustments: PhotoAdjustments; crop: PhotoCrop; overlays: OverlayItem[]; dimensions: {width:number;height:number} }; caption: string; uploadedUrl?: string; operationKey?: string; uploadKey?: string; uploadReceiptId?:string; savedAt: number };
const MAX_AGE = 7 * 86400000;
const memory = new Map<number, PublicationDraft>();
async function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('templesale-publication-drafts', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('drafts');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Armazenamento de rascunhos indisponível.'));
  });
}
async function access<T>(id: number, mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await database();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction('drafts', mode);
      const request = run(tx.objectStore('drafts'));
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = tx.onabort = () => reject(tx.error ?? request.error);
    });
  } finally { db.close(); }
}
export async function savePublicationDraft(id: number, draft: PublicationDraft): Promise<boolean> {
  memory.set(id, draft);
  while (memory.size > 4) memory.delete(memory.keys().next().value!);
  try { await access(id, 'readwrite', store => {
    const cursor = store.openCursor();
    const retained: { key: IDBValidKey; at: number }[] = [];
    cursor.onsuccess = () => {
      const row = cursor.result;
      if (row) {
        if (row.value.savedAt < Date.now() - MAX_AGE) row.delete();
        else if (row.key !== id) retained.push({ key: row.key, at: row.value.savedAt });
        row.continue();
      } else retained.sort((a,b) => b.at-a.at).slice(3).forEach(item => store.delete(item.key));
    };
    return store.put(draft, id);
  }); return true; }
  catch { return false; }
}
export async function loadPublicationDraft(id: number): Promise<PublicationDraft | undefined> {
  let draft = memory.get(id);
  try { draft = await access(id, 'readonly', store => store.get(id)) ?? draft; } catch { /* Session fallback. */ }
  if (!draft || !(draft.file instanceof Blob) || draft.file.size === 0 || draft.file.size > 12 * 1024 * 1024 || !Number.isFinite(draft.savedAt) || draft.savedAt < Date.now() - MAX_AGE || typeof draft.caption !== 'string') {
    await clearPublicationDraft(id); return;
  }
  return draft;
}
export async function clearPublicationDraft(id: number): Promise<void> {
  memory.delete(id);
  try { await access(id, 'readwrite', store => store.delete(id)); } catch { /* Storage can be disabled. */ }
}
