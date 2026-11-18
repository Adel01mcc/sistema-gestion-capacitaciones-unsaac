import { useEffect, useState } from 'react';
import { errorMessage, request } from './api';
import { EmptyState, Loading, Notice, Pagination } from './components';
import type { ListResponse, PageMeta, User } from './types';

interface Notification {
  id: number;
  training_id: number;
  title: string;
  message: string;
  created_at: string;
  read_at: string | null;
}
export function NotificationsPage({ user }: { user: User }) {
  const [rows, setRows] = useState<Notification[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState(false);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    request<ListResponse<Notification>>(`/notifications?page=${page}&pageSize=10`)
      .then(result => { if (active) { setRows(result.data); setMeta(result.meta); } })
      .catch(failure => { if (active) setError(errorMessage(failure)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, revision]);
  async function markRead(id: number) {
    setPending(true); setError('');
    try {
      await request(`/notifications/${id}/read`, { method: 'PATCH', body: JSON.stringify({}) });
      setRevision(value => value + 1);
    } catch (failure) { setError(errorMessage(failure)); }
    finally { setPending(false); }
  }
  async function retry() {
    setPending(true); setError(''); setNotice('');
    try {
      const result = await request<{ data: { processed: number; pending: number } }>('/notifications/retry', { method: 'POST', body: JSON.stringify({}) });
      setNotice(`Eventos procesados: ${result.data.processed}. Pendientes: ${result.data.pending}.`);
      setRevision(value => value + 1);
    } catch (failure) { setError(errorMessage(failure)); }
    finally { setPending(false); }
  }
  return <>
    <div className="page-heading"><div><p className="eyebrow">TU ESPACIO DE INFORMACIÓN</p><h1>Avisos</h1><p>Consulta las novedades de las capacitaciones disponibles para tu cuenta.</p></div>
      <div className="notification-actions"><button className="button secondary" onClick={() => setRevision(value => value + 1)} disabled={loading || pending}>Actualizar avisos</button>
        {user.permissions.includes('trainings.manage') && <button className="button secondary" onClick={retry} disabled={pending || loading}>Reintentar avisos pendientes</button>}</div>
    </div>
    <Notice message={error} /><Notice message={notice} kind="info" />
    {loading ? <Loading /> : !error && <section className="panel" aria-label="Bandeja de avisos">
      {rows.length ? <ul className="notification-list">{rows.map(row => <li key={row.id} className={`notification-item ${row.read_at ? '' : 'notification-unread'}`}>
        <div><span className="notification-state">{row.read_at ? 'Leído' : 'Sin leer'}</span><h2>{row.title}</h2><p>{row.message}</p>
          <time dateTime={row.created_at}>{new Date(row.created_at).toLocaleString('es-PE')}</time></div>
        {!row.read_at && <button className="button secondary small" disabled={pending} onClick={() => markRead(row.id)}>Marcar como leído</button>}
      </li>)}</ul> : <EmptyState title="Todavía no tienes avisos" description="Aquí aparecerán las capacitaciones programadas o modificadas que puedas consultar." />}
      <Pagination meta={meta} onPage={setPage} />
    </section>}
  </>;
}
