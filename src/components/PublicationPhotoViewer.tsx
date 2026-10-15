import React from 'react';
import { ArrowLeft, Bookmark, MoreHorizontal, MessageCircle, Share2, Minus, Plus } from 'lucide-react';
import type { PublicationDto, EstablishmentDto } from '../lib/api';
import { ProgressiveProductImage } from './ProductCard';
import { TempleSaleLikeIcon } from './TempleSaleLikeIcon';
import { LinkedText } from './SharedLink';

type Pose = { scale: number; x: number; y: number };
const initialPose: Pose = { scale: 1, x: 0, y: 0 };

export default function PublicationPhotoViewer({ publication, establishment, liked, saved, commentsCount,
  onClose, onLike, onSave, onDiscussion, onProfile, onNavigate }: {
  publication: PublicationDto; establishment: EstablishmentDto; liked: boolean; saved: boolean; commentsCount?: number;
  onClose: () => void; onLike: () => void; onSave: () => void;
  onDiscussion: (tab: 'comments' | 'likes') => void; onProfile: () => void;
  onNavigate?: (direction: -1 | 1) => void;
}) {
  const stage = React.useRef<HTMLDivElement>(null);
  const dialog = React.useRef<HTMLDivElement>(null);
  const menu = React.useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [notice, setNotice] = React.useState('');
  const [pose, setPose] = React.useState<Pose>(initialPose);
  const livePose = React.useRef(initialPose);
  const pointers = React.useRef(new Map<number, { x: number; y: number }>());
  const gesture = React.useRef({ pose: initialPose, x: 0, y: 0, distance: 0 });
  const moved = React.useRef(false);
  const lastTap = React.useRef(0);
  const close = React.useRef(onClose);
  close.current = onClose;
  React.useEffect(() => {
    pointers.current.clear();
    livePose.current = initialPose;
    setPose(initialPose);
    setMenuOpen(false);
    setNotice('');
    lastTap.current = 0;
  }, [publication.id]);

  const applyPose = React.useCallback((next: Pose) => {
    const bounds = stage.current?.getBoundingClientRect();
    const image = stage.current?.querySelector('img');
    const scale = Math.min(4, Math.max(1, next.scale));
    const width = bounds?.width ?? 0, height = bounds?.height ?? 0;
    const ratio = image?.naturalWidth && image.naturalHeight ? image.naturalWidth / image.naturalHeight : width / Math.max(1, height);
    const imageWidth = Math.min(width, height * ratio), imageHeight = imageWidth / Math.max(0.001, ratio);
    const limitX = Math.max(0, (imageWidth * scale - width) / 2), limitY = Math.max(0, (imageHeight * scale - height) / 2);
    const clamped = { scale, x: Math.max(-limitX, Math.min(limitX, next.x)), y: Math.max(-limitY, Math.min(limitY, next.y)) };
    livePose.current = clamped; setPose(clamped);
  }, []);

  const zoom = React.useCallback((scale: number, point?: { x: number; y: number }) => {
    const bounds = stage.current?.getBoundingClientRect();
    const current = livePose.current;
    const x = point && bounds ? point.x - bounds.left - bounds.width / 2 : 0;
    const y = point && bounds ? point.y - bounds.top - bounds.height / 2 : 0;
    const next = Math.min(4, Math.max(1, scale));
    applyPose({ scale: next, x: x - (x - current.x) * next / current.scale, y: y - (y - current.y) * next / current.scale });
  }, [applyPose]);

  const beginGesture = () => {
    const [a, b] = [...pointers.current.values()];
    if (!a) return;
    gesture.current = { pose: livePose.current, x: b ? (a.x + b.x) / 2 : a.x,
      y: b ? (a.y + b.y) / 2 : a.y, distance: b ? Math.hypot(a.x - b.x, a.y - b.y) : 0 };
  };
  const pointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId);
    if (!pointers.current.size) moved.current = false;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size > 1) moved.current = true;
    beginGesture();
  };
  const pointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const [a, b] = [...pointers.current.values()];
    const start = gesture.current;
    const x = b ? (a.x + b.x) / 2 : a.x, y = b ? (a.y + b.y) / 2 : a.y;
    if (Math.hypot(x - start.x, y - start.y) > 5) moved.current = true;
    if (b && start.distance > 0) {
      const bounds = stage.current!.getBoundingClientRect();
      const scale = Math.min(4, Math.max(1, start.pose.scale * Math.hypot(a.x - b.x, a.y - b.y) / start.distance));
      const anchorX = (start.x - bounds.left - bounds.width / 2 - start.pose.x) / start.pose.scale;
      const anchorY = (start.y - bounds.top - bounds.height / 2 - start.pose.y) / start.pose.scale;
      applyPose({ scale, x: x - bounds.left - bounds.width / 2 - anchorX * scale, y: y - bounds.top - bounds.height / 2 - anchorY * scale });
    } else applyPose({ ...start.pose, x: start.pose.x + x - start.x, y: start.pose.y + y - start.y });
  };
  const pointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const singlePointer = pointers.current.size === 1 && pointers.current.has(event.pointerId);
    const distanceX = event.clientX - gesture.current.x;
    const distanceY = event.clientY - gesture.current.y;
    const swipe = event.type === 'pointerup' && singlePointer && onNavigate &&
      gesture.current.pose.scale === 1 && Math.abs(distanceX) > 70 &&
      Math.abs(distanceX) > Math.abs(distanceY) * 1.5;
    pointers.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (event.type === 'pointerup' && !moved.current && !pointers.current.size) {
      const now = Date.now();
      if (now - lastTap.current < 320) { zoom(livePose.current.scale > 1 ? 1 : 2.5, { x: event.clientX, y: event.clientY }); lastTap.current = 0; }
      else lastTap.current = now;
    } else lastTap.current = 0;
    beginGesture();
    if (swipe) onNavigate(distanceX < 0 ? 1 : -1);
  };

  React.useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.focus();
    const keyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); close.current(); } };
    window.addEventListener('keydown', keyDown);
    return () => { window.removeEventListener('keydown', keyDown); previous?.focus(); };
  }, []);
  React.useEffect(() => {
    const resize = () => applyPose(livePose.current);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
    if (stage.current) observer?.observe(stage.current);
    window.addEventListener('resize', resize);
    return () => { observer?.disconnect(); window.removeEventListener('resize', resize); };
  }, [applyPose]);
  React.useEffect(() => {
    if (!menuOpen) return;
    const outside = (event: PointerEvent) => { if (!menu.current?.contains(event.target as Node)) setMenuOpen(false); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [menuOpen]);

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: establishment.name, text: publication.caption, url: publication.imageUrl });
      else if (navigator.clipboard) { await navigator.clipboard.writeText(publication.imageUrl); setNotice('Link della foto copiato.'); }
      else window.prompt('Copia il link della foto', publication.imageUrl);
    } catch (error) { if (!(error instanceof DOMException && error.name === 'AbortError')) setNotice('Impossibile condividere la foto. Riprova.'); }
  };

  return (
    <div ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Foto della pubblicazione" className="ts-photo-viewer">
      <header className="ts-photo-header">
        <button type="button" className="ts-photo-round" onClick={onClose} aria-label="Chiudi foto"><ArrowLeft size={24} /></button>
        <div className="ts-photo-zoom" aria-label="Zoom foto">
          <button type="button" disabled={pose.scale <= 1} onClick={() => zoom(pose.scale - 0.5)} aria-label="Riduci zoom"><Minus size={18} /></button>
          <button type="button" onClick={() => zoom(1)} aria-label="Ripristina zoom">{Math.round(pose.scale * 100)}%</button>
          <button type="button" disabled={pose.scale >= 4} onClick={() => zoom(pose.scale + 0.5)} aria-label="Aumenta zoom"><Plus size={18} /></button>
        </div>
        <div ref={menu} className="relative">
          <button type="button" className="ts-photo-round" aria-label="Opzioni foto" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><MoreHorizontal size={24} /></button>
          {menuOpen && <div className="ts-photo-menu">
            <button type="button" onClick={() => { zoom(1); setMenuOpen(false); }}>Ripristina zoom</button>
            <button type="button" onClick={() => onDiscussion('comments')}>Didascalia e commenti</button>
            <a href={publication.imageUrl} target="_blank" rel="noopener noreferrer">Apri foto originale</a>
          </div>}
        </div>
      </header>
      <div ref={stage} className="ts-photo-stage" onPointerDown={pointerDown} onPointerMove={pointerMove}
        onPointerUp={pointerUp} onPointerCancel={pointerUp} onDoubleClick={event => event.preventDefault()}
        onLoadCapture={() => applyPose(livePose.current)}>
        <div className="ts-photo-plane" style={{ transform: `translate(${pose.x}px, ${pose.y}px) scale(${pose.scale})` }}>
          <ProgressiveProductImage src={publication.imageUrl} alt={`Foto di ${establishment.name}`} loading="eager" fetchPriority="high" variant="full" className="h-full w-full object-contain pointer-events-none select-none" />
        </div>
      </div>
      <footer className="ts-photo-footer">
        <button type="button" className="ts-photo-author" onClick={onProfile}>
          <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
            {establishment.logoUrl ? <ProgressiveProductImage src={establishment.logoUrl} alt="" variant="thumbnail" className="h-full w-full object-cover" /> : establishment.name.slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0"><strong className="block truncate">{establishment.name}</strong><span className="ts-photo-muted">{[establishment.category, establishment.city].filter(Boolean).join(' · ')}</span></span>
        </button>
        {publication.caption && <p className="ts-photo-caption line-clamp-2 whitespace-pre-wrap"><LinkedText text={publication.caption} /></p>}
        <div className="ts-photo-actions">
          <button type="button" className="ts-photo-action" onClick={() => onDiscussion('comments')} aria-label="Apri commenti"><MessageCircle size={23} />{commentsCount !== undefined && <span>{commentsCount}</span>}</button>
          <div className="ts-photo-action">
            <button type="button" onClick={onLike} aria-pressed={liked} aria-label={liked ? 'Rimuovi Mi piace' : 'Mi piace'}><TempleSaleLikeIcon liked={liked} className="h-6 w-6" /></button>
            <button type="button" onClick={() => onDiscussion('likes')} aria-label="Vedi chi ha messo Mi piace">{publication.likesCount ?? 0}</button>
          </div>
          <button type="button" className="ts-photo-action" onClick={onSave} aria-pressed={saved} aria-label={saved ? 'Rimuovi dai salvati' : 'Salva foto'}><Bookmark size={23} fill={saved ? 'currentColor' : 'none'} /></button>
          <button type="button" className="ts-photo-action" onClick={() => void share()} aria-label="Condividi foto"><Share2 size={23} /></button>
        </div>
        <button type="button" className="ts-photo-reply" onClick={() => onDiscussion('comments')}>Scrivi un commento…</button>
        {notice && <p className="ts-photo-muted" role="status">{notice}</p>}
      </footer>
    </div>
  );
}
