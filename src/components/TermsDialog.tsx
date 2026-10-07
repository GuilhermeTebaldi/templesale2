import React from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, ChevronDown, FileText, ShieldCheck, X } from "lucide-react";
import { api, type SessionUser } from "../lib/api";
import type { LegalLocale, LegalReceipt, LegalStatus } from "../lib/legal-types";

type Props = {
  key?: string | number;
  user: SessionUser | null;
  locale: LegalLocale;
  open: boolean;
  companyName?: string;
  onClose: () => void;
  onReject: () => Promise<void>;
  getIdentityToken: () => Promise<string>;
  onAccess: (allowed: boolean) => void;
};
export default function TermsDialog({ user, locale, open, companyName, onClose, onReject, getIdentityToken, onAccess }: Props) {
  const it = locale === "it-IT";
  const text = (pt: string, italian: string) => it ? italian : pt;
  const [status, setStatus] = React.useState<LegalStatus | null>(null);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [read, setRead] = React.useState(false);
  const [agreed, setAgreed] = React.useState(false);
  const [representative, setRepresentative] = React.useState(user?.name ?? "");
  const [company, setCompany] = React.useState(companyName ?? "");
  const [confirmed, setConfirmed] = React.useState<LegalReceipt | null>(null);
  const [selectedReceipt, setSelectedReceipt] = React.useState<LegalReceipt | null>(null);
  const [retry, setRetry] = React.useState(0);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const [host] = React.useState(() => window.document.createElement("div"));
  const mandatory = Boolean(user && (!status || (status.enabled && !status.accepted)));
  const visible = open || mandatory || Boolean(confirmed);
  const document = selectedReceipt?.document ?? status?.document;
  const receipt = selectedReceipt ?? confirmed ?? (!mandatory ? status?.receipts[0] : null);

  React.useEffect(() => {
    let cancelled = false;
    setStatus(null); setError(""); setRead(false); setAgreed(false); setSelectedReceipt(null);
    if (user) onAccess(false);
    if (!user && !open) return;
    void api.getLegalStatus(locale).then(result => {
      if (cancelled) return;
      setStatus(result);
      onAccess(!result.enabled || result.accepted);
    }).catch(() => {
      if (!cancelled) setError(text("Não foi possível carregar os termos. Tente novamente.", "Impossibile caricare le condizioni. Riprova."));
    });
    return () => { cancelled = true; };
  }, [user?.id, locale, retry, open]);

  React.useEffect(() => {
    window.document.body.appendChild(host);
    return () => host.remove();
  }, [host]);
  React.useEffect(() => {
    if (!visible) return;
    const previous = window.document.activeElement as HTMLElement | null;
    const overflow = window.document.body.style.overflow;
    window.document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => { window.document.body.style.overflow = overflow; previous?.focus(); };
  }, [visible]);
  React.useEffect(() => {
    if (!document) return;
    const element = scrollRef.current;
    if (element && element.scrollHeight <= element.clientHeight + 8) setRead(true);
  }, [document]);
  const accept = async () => {
    if (!status || !read || !agreed || busy) return;
    setBusy(true); setError("");
    try {
      const result = await api.acceptLegalTerms({
        locale, version: status.document.version, documentHash: status.documentHash,
        representative, company, agreed, authorized: agreed,
      }, await getIdentityToken());
      setConfirmed(result.receipt);
      setStatus({ ...status, accepted: true, receipts: [result.receipt, ...status.receipts] });
      // Keep the account behind the confirmation until the user presses Continue.
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : text("Não foi possível confirmar.", "Impossibile confermare."));
    } finally { setBusy(false); }
  };
  const download = () => {
    if (!receipt) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(receipt, null, 2)], { type: "application/json" }));
    const link = window.document.createElement("a");
    link.href = url; link.download = `TempleSale-aceite-${receipt.id}.json`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  if (!visible) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100010] flex items-center justify-center bg-black/85 p-0 backdrop-blur-md sm:p-5">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="terms-title" tabIndex={-1}
        className="flex h-[100dvh] w-full max-w-3xl flex-col overflow-hidden bg-neutral-950 text-neutral-100 outline-none sm:h-[min(90dvh,900px)] sm:rounded-3xl sm:border sm:border-neutral-800"
        onKeyDown={event => {
          if (event.key === "Escape") { event.stopPropagation(); if (!mandatory && !confirmed) onClose(); }
          if (event.key !== "Tab") return;
          const items = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select, [tabindex="0"]') ?? []) as HTMLElement[];
          const first = items[0], last = items[items.length - 1];
          if (!first) { event.preventDefault(); return; }
          if (event.shiftKey && (window.document.activeElement === first || window.document.activeElement === dialogRef.current)) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && (window.document.activeElement === last || window.document.activeElement === dialogRef.current)) { event.preventDefault(); first.focus(); }
        }}>
        <header className="shrink-0 border-b border-neutral-800 px-5 pb-4 pt-[max(20px,env(safe-area-inset-top))] sm:px-8">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-300"><ShieldCheck size={17} /> TempleSale</span>
            {!mandatory && !confirmed && <button onClick={onClose} aria-label={text("Fechar termos", "Chiudi condizioni")} className="rounded-full p-2 hover:bg-neutral-800"><X size={20} /></button>}
          </div>
          <h1 id="terms-title" className="mt-3 text-2xl font-semibold">{confirmed ? text("Aceite confirmado", "Accettazione confermata") : text("Uma comunidade com regras claras", "Una comunità con regole chiare")}</h1>
          <p className="mt-2 text-sm leading-6 text-neutral-400">{text("Leia o que o TempleSale oferece, suas responsabilidades e como seus dados são utilizados.", "Leggi cosa offre TempleSale, le tue responsabilità e come vengono utilizzati i tuoi dati.")}</p>
          {status && <p className="mt-2 text-xs text-neutral-500">{text("Versão", "Versione")} {document?.version} · {document?.locale}</p>}
        </header>
        <div ref={scrollRef} tabIndex={0} className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8"
          onScroll={event => { const el = event.currentTarget; if (el.scrollHeight - el.scrollTop - el.clientHeight < 20) setRead(true); }}>
          {!status && !error && <p role="status">{text("Carregando documento…", "Caricamento del documento…")}</p>}
          {status && !status.ready && <p className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">{text("Minuta em preparação. Os dados do responsável e a política de privacidade precisam ser concluídos antes do aceite.", "Bozza in preparazione. I dati del titolare e l'informativa privacy devono essere completati prima dell'accettazione.")}</p>}
          {status?.accepted && status.receipts.length > 0 && open && (
            <label className="mb-5 block text-sm">{text("Documento para leitura", "Documento da leggere")}
              <select className="mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-900 p-3"
                value={selectedReceipt?.id ?? ""} onChange={event => setSelectedReceipt(status.receipts.find(item => item.id === event.target.value) ?? null)}>
                <option value="">{text("Termos atuais", "Condizioni attuali")}</option>
                {status.receipts.map(item => <option key={item.id} value={item.id}>{text("Aceito em", "Accettato il")} {new Date(item.acceptedAt).toLocaleString(locale)} · {item.version}</option>)}
              </select>
            </label>
          )}
          {document && <>
            <section className="mb-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
              <h2 className="font-semibold">{document.title}</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-neutral-400">{document.operator.name || text("Responsável ainda não informado", "Titolare non ancora indicato")}{"\n"}{document.operator.address} · {document.operator.country}</p>
              {document.operator.taxId && <p className="text-sm text-neutral-400">{document.operator.taxId}</p>}
              <a href={`mailto:${document.operator.email}`} className="mt-2 inline-block break-all text-sm text-emerald-300">{document.operator.email}</a>
            </section>
            {[...document.terms, ...document.privacy].map(section => <section key={section.title} className="mb-7">
              <h2 className="mb-2 text-base font-semibold">{section.title}</h2>
              <p className="whitespace-pre-line text-sm leading-7 text-neutral-300">{section.body}</p>
            </section>)}
          </>}
          {mandatory && status?.enabled && !confirmed && <section className="rounded-2xl border border-neutral-700 bg-neutral-900 p-5">
            <h2 className="mb-4 flex items-center gap-2 font-semibold"><FileText size={18} />{text("Sua confirmação", "La tua conferma")}</h2>
            <label className="mb-4 block text-sm">{text("Nome completo do representante", "Nome completo del rappresentante")}
              <input autoComplete="name" maxLength={160} value={representative} onChange={event => setRepresentative(event.target.value)} className="mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 p-3" /></label>
            <label className="mb-4 block text-sm">{text("Empresa / atividade representada", "Impresa / attività rappresentata")}
              <input autoComplete="organization" maxLength={200} value={company} onChange={event => setCompany(event.target.value)} className="mt-2 w-full rounded-xl border border-neutral-700 bg-neutral-950 p-3" /></label>
            <p className="mb-4 break-all text-sm text-neutral-400">{text("E-mail da conta", "Email dell'account")}: {user?.email}</p>
            <label className="flex items-start gap-3 text-sm leading-6">
              <input type="checkbox" checked={agreed} onChange={event => setAgreed(event.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-emerald-400" />
              {text("Tenho 18 anos ou mais, estou autorizado a representar esta empresa, li e aceito os termos de uso e tomei conhecimento do aviso de privacidade.", "Ho almeno 18 anni, sono autorizzato a rappresentare questa attività, ho letto e accetto le condizioni d'uso e ho preso visione dell'informativa privacy.")}
            </label>
          </section>}
          {receipt && <section className="mt-6 rounded-2xl border-2 border-emerald-400/60 bg-emerald-400/5 p-5">
            <div className="flex items-center gap-3 text-emerald-300"><CheckCircle2 size={28} /><h2 className="font-bold uppercase tracking-wider">{text("Confirmado", "Confermato")}</h2></div>
            <dl className="mt-4 space-y-2 break-words text-sm">
              <div><dt className="text-neutral-500">{text("Representante / empresa", "Rappresentante / attività")}</dt><dd>{receipt.representative} · {receipt.company}</dd></div>
              <div><dt className="text-neutral-500">{text("E-mail verificado", "Email verificata")}</dt><dd>{receipt.email}</dd></div>
              <div><dt className="text-neutral-500">{text("Registrado em", "Registrato il")}</dt><dd>{new Date(receipt.acceptedAt).toLocaleString(locale)}</dd></div>
              <div><dt className="text-neutral-500">{text("Versão / identificador", "Versione / identificativo")}</dt><dd>{receipt.version} · {receipt.id}</dd></div>
            </dl>
            <p className="mt-4 text-xs text-neutral-400">{text("Registro de aceite eletrônico. Não é assinatura digital certificada.", "Registro di accettazione elettronica. Non è una firma digitale certificata.")}</p>
            <button onClick={download} className="mt-4 text-sm font-semibold text-emerald-300 underline">{text("Baixar comprovante e documento", "Scarica ricevuta e documento")}</button>
          </section>}
          {error && <div role="alert" className="mt-5 rounded-xl border border-red-500/30 p-4 text-sm text-red-300">{error}
            {!status && <button onClick={() => setRetry(value => value + 1)} className="ml-3 underline">{text("Tentar novamente", "Riprova")}</button>}
          </div>}
        </div>
        <footer className="shrink-0 border-t border-neutral-800 bg-neutral-950 px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-4 sm:px-8">
          {confirmed ? <button onClick={() => window.location.reload()} className="w-full rounded-xl bg-emerald-400 p-3 font-semibold text-neutral-950">{text("Continuar para minha conta", "Continua al mio account")}</button> :
            mandatory ? <>
              {!read && status && <p className="mb-3 flex items-center gap-2 text-xs text-neutral-400"><ChevronDown size={15} />{text("Percorra o documento até o final para confirmar.", "Scorri il documento fino alla fine per confermare.")}</p>}
              <div className="flex gap-3">
                <button disabled={busy} onClick={async () => { setBusy(true); try { await onReject(); } finally { setBusy(false); } }} className="rounded-xl border border-neutral-700 px-4 py-3 text-sm">{text("Não aceitar e sair", "Rifiuta ed esci")}</button>
                <button disabled={!status?.enabled || !status.ready || !read || !agreed || representative.trim().length < 3 || company.trim().length < 2 || busy}
                  onClick={() => void accept()} className="flex-1 rounded-xl bg-emerald-400 p-3 text-sm font-semibold text-neutral-950 disabled:opacity-35">
                  {busy ? text("Confirmando…", "Conferma in corso…") : text("Aceitar e confirmar", "Accetta e conferma")}
                </button>
              </div>
            </> : <button onClick={onClose} className="w-full rounded-xl border border-neutral-700 p-3 text-sm">{text("Fechar", "Chiudi")}</button>}
        </footer>
      </div>
    </div>, host,
  );
}
