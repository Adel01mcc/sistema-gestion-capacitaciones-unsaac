import { useEffect, useRef, type ReactNode } from 'react';
import type { PageMeta, TrainingStatus } from './types';
import { statusLabels } from './types';

export type IconName = 'grid' | 'calendar' | 'users' | 'shield' | 'arrow' | 'plus' | 'search' | 'close' | 'edit' | 'logout' | 'book' | 'check' | 'clock' | 'menu';
const paths: Record<IconName, ReactNode> = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18M8 15h2M14 15h2" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /><circle cx="9" cy="7" r="4" /></>,
  shield: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" /><path d="m8 12 3 3 5-6" /></>,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  edit: <><path d="m16 3 5 5-12 12-6 1 1-6L16 3ZM13 6l5 5" /></>,
  logout: <><path d="M9 21H4V3h5M9 12h12m-5-5 5 5-5 5" /></>,
  book: <><path d="M12 5C8 2 3 3 3 3v16s5-1 9 2c4-3 9-2 9-2V3s-5-1-9 2Zm0 0v16" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
};
export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export function Notice({ message, kind = 'error' }: { message: string; kind?: 'error' | 'success' | 'info' }) {
  return message ? <div className={`notice ${kind}`} role={kind === 'error' ? 'alert' : 'status'}>{message}</div> : null;
}

export function StatusBadge({ status }: { status: TrainingStatus }) {
  return <span className={`status-badge status-${status}`}><span />{statusLabels[status]}</span>;
}

export function Field({ label, children, hint, wide = false }: { label: string; children: ReactNode; hint?: string; wide?: boolean }) {
  return <label className={`field ${wide ? 'wide' : ''}`}><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="empty-state"><div className="empty-icon"><Icon name="book" size={28} /></div><h3>{title}</h3><p>{description}</p></div>;
}

export function Loading() { return <div className="loading" role="status"><span className="spinner" />Cargando información…</div>; }

export function Modal({ title, description, children, onClose }: { title: string; description?: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => { dialog?.close(); };
  }, []);
  return <dialog ref={ref} className="modal" aria-labelledby="modal-title" onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <div className="modal-heading"><div><p className="eyebrow">PAZ SUR · GESTIÓN</p><h2 id="modal-title">{title}</h2>{description && <p>{description}</p>}</div><button type="button" className="icon-button" aria-label="Cerrar formulario" onClick={onClose}><Icon name="close" /></button></div>
    {children}
  </dialog>;
}

export function Pagination({ meta, onPage }: { meta: PageMeta | null; onPage: (page: number) => void }) {
  if (!meta) return null;
  const start = meta.total === 0 ? 0 : (meta.page - 1) * meta.pageSize + 1;
  return <div className="pagination"><span>{start}–{Math.min(meta.page * meta.pageSize, meta.total)} de {meta.total} registros</span><div><button className="button secondary small" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>Anterior</button><span className="page-number">{meta.page} / {Math.max(1, meta.totalPages)}</span><button className="button secondary small" disabled={meta.page >= meta.totalPages} onClick={() => onPage(meta.page + 1)}>Siguiente</button></div></div>;
}

export function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}
