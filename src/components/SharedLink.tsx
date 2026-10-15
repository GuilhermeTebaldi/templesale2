import React from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, Globe, LoaderCircle, X, ArrowUpRight } from 'lucide-react';
import { fetchLinkPreview } from '../lib/api';
import { sharedLink, splitSharedLinks } from '../lib/shared-links';

type Preview = Awaited<ReturnType<typeof fetchLinkPreview>>;
const previews = new Map<string, { expires: number; work: Promise<Preview> }>();
const queue: (() => Promise<void>)[] = [];
let active = false;
async function drain() {
  if (active) return;
  active = true;
  try { while (queue.length) await queue.shift()!(); }
  finally { active = false; }
}
function previewFor(url: string): Promise<Preview> {
  const existing = previews.get(url);
  if (existing && existing.expires > Date.now()) return existing.work;
  if (queue.length >= 20) return Promise.resolve(null);
  const work = new Promise<Preview>(resolve => {
    queue.push(async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      try { resolve(await fetchLinkPreview(url, controller.signal)); }
      catch { resolve(null); }
      finally { clearTimeout(timer); }
    });
  });
  previews.delete(url);
  previews.set(url, { work, expires: Date.now() + 300000 });
  if (previews.size > 128) previews.delete(previews.keys().next().value!);
  void drain();
  return work;
}

export const LinkPreviewContext = React.createContext<((href: string) => void) | null>(null);

export function LinkedText({ text }: { text: string }) {
  const openPreview = React.useContext(LinkPreviewContext);
  return <>{splitSharedLinks(text).map((part, index) => part.href ? (
    <a key={index} href={part.href} target="_blank" rel="noopener noreferrer ugc"
      className="text-sky-600 hover:underline break-words" onClick={event => {
        event.stopPropagation();
        if (openPreview && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0) {
          event.preventDefault(); openPreview(part.href!);
        }
      }}>
      {part.text}
    </a>
  ) : <React.Fragment key={index}>{part.text}</React.Fragment>)}</>;
}

export function LinkPreviewDialog({ href, onClose, returnFocus }: { href: string; onClose: () => void; returnFocus?: HTMLElement | null }) {
  const dialog = React.useRef<HTMLDivElement>(null);
  const closeButton = React.useRef<HTMLButtonElement>(null);
  const close = React.useRef(onClose);
  close.current = onClose;
  const [loaded, setLoaded] = React.useState<{ href: string; data: Preview } | null>(null);
  const [brokenImage, setBrokenImage] = React.useState('');
  const titleId = React.useId();
  React.useEffect(() => {
    let cancelled = false;
    if (sharedLink(href)) void previewFor(href).then(data => { if (!cancelled) setLoaded({ href, data }); });
    return () => { cancelled = true; };
  }, [href]);
  React.useEffect(() => {
    const previous = returnFocus ?? document.activeElement as HTMLElement | null;
    closeButton.current?.focus();
    const keyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault(); event.stopImmediatePropagation(); close.current();
      }
      if (event.key === 'Tab') {
        const controls = dialog.current?.querySelectorAll<HTMLElement>('button, a[href]');
        const first = controls?.[0], last = controls?.[controls.length - 1];
        if (first && last && (event.shiftKey ? document.activeElement === first : document.activeElement === last)) {
          event.preventDefault(); (event.shiftKey ? last : first).focus();
        }
      }
    };
    document.addEventListener('keydown', keyDown, true);
    return () => {
      document.removeEventListener('keydown', keyDown, true);
      requestAnimationFrame(() => { if (previous?.isConnected && !previous.closest('[inert]')) previous.focus({ preventScroll: true }); });
    };
  }, []);
  const url = sharedLink(href);
  if (!url) return null;
  const domain = url.hostname.replace(/^www\./, '');
  const data = loaded?.href === href ? loaded.data : null;
  const loading = loaded?.href !== href;
  const image = data?.image && sharedLink(data.image)?.protocol === 'https:' ? data.image : null;
  return createPortal(
    <div className="ts-link-backdrop" onClick={event => { event.stopPropagation(); if (event.target === event.currentTarget) onClose(); }}>
      <div ref={dialog} className="ts-link-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={event => event.stopPropagation()}>
        <header className="ts-link-header">
          <div><span translate="no" className="font-semibold tracking-wide">TempleSale</span><p>Anteprima del link</p></div>
          <button ref={closeButton} type="button" onClick={onClose} aria-label="Chiudi anteprima"><X size={23} /></button>
        </header>
        <div className="ts-link-content">
          <div className={`ts-link-hero${data?.imageKind === 'icon' ? ' ts-link-hero-icon' : ''}`}>
            {image && brokenImage !== image ? <img src={image} alt="" referrerPolicy="no-referrer" onError={() => setBrokenImage(image)} /> :
              <div className={`ts-link-placeholder${loading ? '' : ' ts-link-placeholder-compact'}`}>{loading ? <LoaderCircle size={36} className="animate-spin motion-reduce:animate-none" /> : <Globe size={52} strokeWidth={1.2} />}<span>{domain}</span></div>}
          </div>
          <section className="ts-link-details">
            <div className="ts-link-domain"><ExternalLink size={14} /><span>{domain}</span></div>
            <h2 id={titleId}>{data?.title || domain}</h2>
            <p role="status" aria-live="polite">{loading ? 'Caricamento anteprima…' : data?.description || (data ? 'Questo sito non fornisce una descrizione per l’anteprima. Aprilo per vedere il contenuto completo.' : 'Anteprima non disponibile. Puoi comunque aprire il sito.')}</p>
          </section>
        </div>
        <footer className="ts-link-footer">
          <a href={url.href} target="_blank" rel="noopener noreferrer ugc" className="ts-link-open">Apri sito<ArrowUpRight size={20} /></a>
          <p>Si apre in una nuova scheda.</p>
        </footer>
      </div>
    </div>, document.body,
  );
}
