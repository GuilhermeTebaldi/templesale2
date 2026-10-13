import React from 'react';
import { ExternalLink } from 'lucide-react';
import { fetchLinkPreview } from '../lib/api';
import { sharedLink, splitSharedLinks } from '../lib/shared-links';

type Preview = Awaited<ReturnType<typeof fetchLinkPreview>>;
const previews = new Map<string, Promise<Preview>>();
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
  if (existing) return existing;
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
  previews.set(url, work);
  if (previews.size > 128) previews.delete(previews.keys().next().value!);
  void drain();
  return work;
}

export function LinkedText({ text }: { text: string }) {
  return <>{splitSharedLinks(text).map((part, index) => part.href ? (
    <a key={index} href={part.href} target="_blank" rel="noopener noreferrer ugc"
      className="text-sky-600 hover:underline break-words" onClick={event => event.stopPropagation()}>
      {part.text}
    </a>
  ) : <React.Fragment key={index}>{part.text}</React.Fragment>)}</>;
}

export function LinkPreview({ text }: { text: string }) {
  const href = React.useMemo(() => splitSharedLinks(text).find(part => part.href)?.href, [text]);
  const anchor = React.useRef<HTMLAnchorElement>(null);
  const [loaded, setLoaded] = React.useState<{ href: string; data: Preview } | null>(null);
  const [brokenImage, setBrokenImage] = React.useState('');
  React.useEffect(() => {
    if (!href || !anchor.current) return;
    let cancelled = false;
    const load = () => { void previewFor(href).then(data => { if (!cancelled) setLoaded({ href, data }); }); };
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { observer?.disconnect(); load(); }
    });
    if (observer) observer.observe(anchor.current); else load();
    return () => { cancelled = true; observer?.disconnect(); };
  }, [href]);
  if (!href) return null;
  const domain = new URL(href).hostname;
  const data = loaded?.href === href ? loaded.data : null;
  const image = data?.image && sharedLink(data.image)?.protocol === 'https:' ? data.image : null;
  return (
    <a ref={anchor} href={href} target="_blank" rel="noopener noreferrer ugc"
      onClick={event => event.stopPropagation()}
      className="mt-3 block overflow-hidden rounded-2xl border border-stone-200 bg-white text-stone-900 hover:bg-stone-50 transition-colors"
      aria-label={`Apri ${domain}`}>
      {image && brokenImage !== image && <img src={image} alt="" loading="lazy" referrerPolicy="no-referrer"
        className="h-40 w-full object-cover" onError={() => setBrokenImage(image)} />}
      <div className="space-y-1 p-3">
        <div className="flex items-center gap-2 text-xs text-stone-500"><ExternalLink className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{domain}</span></div>
        <p className="line-clamp-2 text-sm font-semibold">{data?.title || domain}</p>
        {data?.description && <p className="line-clamp-2 text-xs text-stone-600">{data.description}</p>}
      </div>
    </a>
  );
}
