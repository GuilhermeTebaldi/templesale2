import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { ProgressiveProductImage } from './ProductCard';
import { TempleSaleLogo } from './TempleSaleLogo';

export type ProfilePhoto = { src: string; name: string; origin: HTMLElement };
export const ProfilePhotoContext = React.createContext<((photo: ProfilePhoto) => void) | null>(null);

export function ProfilePhotoButton({ src, name, children, className = '' }: {
  src?: string; name: string; children: React.ReactNode; className?: string;
}) {
  const open = React.useContext(ProfilePhotoContext);
  return <button type="button" className={className} disabled={!src || !open}
    aria-label={`Apri foto del profilo di ${name}`} aria-haspopup="dialog"
    onClick={event => {
      event.preventDefault(); event.stopPropagation();
      if (src) open?.({ src, name, origin: event.currentTarget });
    }}>{children}</button>;
}

export default function ProfilePhotoViewer({ photo, onClose }: { photo: ProfilePhoto; onClose: () => void }) {
  const button = React.useRef<HTMLButtonElement>(null);
  const close = React.useRef(onClose);
  close.current = onClose;
  React.useEffect(() => {
    button.current?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); close.current(); }
      if (event.key === 'Tab') { event.preventDefault(); button.current?.focus(); }
    };
    document.addEventListener('keydown', key, true);
    return () => {
      document.removeEventListener('keydown', key, true);
      requestAnimationFrame(() => { if (photo.origin.isConnected && !photo.origin.closest('[inert]')) photo.origin.focus({ preventScroll: true }); });
    };
  }, []);
  return createPortal(
    <div className="ts-profile-photo-viewer" role="dialog" aria-modal="true" aria-label={`Foto del profilo di ${photo.name}`} onClick={event => event.stopPropagation()}>
      <header>
        <span className="ts-profile-photo-brand" translate="no"><TempleSaleLogo className="h-9 w-9" /><span>TempleSale</span></span>
        <button ref={button} type="button" onClick={onClose} aria-label="Chiudi foto del profilo"><X size={26} /></button>
      </header>
      <div className="ts-profile-photo-image"><ProgressiveProductImage src={photo.src} alt={`Foto del profilo di ${photo.name}`} variant="full" loading="eager" fetchPriority="high" className="relative h-full w-full object-contain" /></div>
      <p>{photo.name}</p>
    </div>, document.body,
  );
}
