import React from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'motion/react';
import { LoaderCircle, MessageCircle, UserRound, X } from 'lucide-react';
import { api } from '../lib/api';
import { ProgressiveProductImage } from './ProductCard';

export type WhatsappContactTarget = {
  href: string; companyId?: string | number; companyName: string;
  origin: HTMLAnchorElement; onConfirm?: () => void;
};
export const WhatsappContactContext = React.createContext<((contact: WhatsappContactTarget) => void) | null>(null);

export function WhatsappContactLink({ companyId, companyName, onConfirm, children, ...props }:
  React.AnchorHTMLAttributes<HTMLAnchorElement> & { companyId?: string | number; companyName: string; onConfirm?: () => void }) {
  const open = React.useContext(WhatsappContactContext);
  return <a {...props} aria-haspopup={open ? 'dialog' : undefined} onClick={event => {
    if (open && props.href && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
      event.preventDefault(); event.stopPropagation();
      open({ href: props.href, companyId, companyName, origin: event.currentTarget, onConfirm });
    } else { props.onClick?.(event); onConfirm?.(); }
  }}>{children}</a>;
}

export default function WhatsappContact({ contact, onClose }: { key?: string; contact: WhatsappContactTarget; onClose: () => void }) {
  const [details, setDetails] = React.useState<{ ownerName: string; companyName: string; photoUrl: string } | null>(null);
  const [loading, setLoading] = React.useState(Boolean(contact.companyId));
  const dialog = React.useRef<HTMLDivElement>(null), closeButton = React.useRef<HTMLButtonElement>(null);
  const close = React.useRef(onClose); close.current = onClose;
  const reduced = useReducedMotion();
  const titleId = React.useId();
  React.useEffect(() => {
    const id = Number(String(contact.companyId ?? '').replace(/^company_/, ''));
    if (!Number.isSafeInteger(id) || id <= 0) { setLoading(false); return; }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    let alive = true; setLoading(true);
    api.getEstablishmentContact(id, controller.signal).then(value => { if (alive) setDetails(value); })
      .catch(() => { /* The existing WhatsApp contact remains usable if name lookup fails. */ })
      .finally(() => { clearTimeout(timeout); if (alive) setLoading(false); });
    return () => { alive = false; clearTimeout(timeout); controller.abort(); };
  }, [contact.companyId]);
  React.useEffect(() => {
    closeButton.current?.focus({ preventScroll: true });
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); close.current(); }
      if (event.key === 'Tab') {
        const buttons = dialog.current?.querySelectorAll<HTMLElement>('button, a[href]');
        const first = buttons?.[0], last = buttons?.[buttons.length - 1];
        if (first && last && (event.shiftKey ? document.activeElement === first : document.activeElement === last)) {
          event.preventDefault(); (event.shiftKey ? last : first).focus({ preventScroll: true });
        }
      }
    };
    document.addEventListener('keydown', key, true);
    return () => {
      document.removeEventListener('keydown', key, true);
      requestAnimationFrame(() => { if (contact.origin.isConnected && !contact.origin.closest('[inert]')) contact.origin.focus({ preventScroll: true }); });
    };
  }, [contact.origin]);
  const name = details?.ownerName || details?.companyName || contact.companyName;
  const companyName = details?.companyName || contact.companyName;
  return createPortal(<motion.div className="ts-whatsapp-contact" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    transition={{ duration: reduced ? 0 : 0.18 }} onClick={event => { event.stopPropagation(); if (event.target === event.currentTarget) onClose(); }}>
    <motion.div ref={dialog} role="dialog" aria-modal="true" aria-labelledby={titleId} className="ts-whatsapp-contact-sheet"
      initial={{ y: reduced ? 0 : '100%' }} animate={{ y: 0 }} exit={{ y: reduced ? 0 : '100%' }} transition={{ duration: reduced ? 0 : 0.24, ease: 'easeOut' }}>
      <div className="ts-whatsapp-contact-handle" aria-hidden="true" />
      <button ref={closeButton} type="button" className="ts-whatsapp-contact-close" aria-label="Chiudi contatto" onClick={onClose}><X size={20} /></button>
      <div className="ts-whatsapp-contact-avatar">{details?.photoUrl
        ? <ProgressiveProductImage src={details.photoUrl} alt="" variant="thumbnail" loading="eager" className="h-full w-full object-cover" />
        : <UserRound size={32} aria-hidden="true" />}</div>
      <p className="ts-whatsapp-contact-label">{details?.ownerName ? 'Parlerai con' : 'Contatta l’attività'}</p>
      <h2 id={titleId}>{name}</h2>
      {name !== companyName && <p className="ts-whatsapp-contact-company">{companyName}</p>}
      {loading ? <div role="status" aria-label="Caricamento contatto" className="ts-whatsapp-contact-pending"><LoaderCircle size={19} className="animate-spin" /></div>
        : <a href={contact.href} target="_blank" rel="noopener noreferrer" className="ts-whatsapp-contact-continue" onClick={() => { contact.onConfirm?.(); onClose(); }}><MessageCircle size={21} />Apri WhatsApp</a>}
    </motion.div>
  </motion.div>, document.body);
}
