import { useEffect, useState } from 'react';
import { errorMessage, request } from './api';
import { EmptyState, formatDate, Icon, Loading, Modal, Notice, Pagination, StatusBadge } from './components';
import { usePaged } from './hooks';
import { TrainingForm } from './TrainingForm.tsx';
import { trainingEditStatuses, type TrainingPayload } from './trainingForm.ts';
import { modalityLabels, statusLabels, type DashboardData, type Training, type User } from './types';

function TrainingDetails({ id, onClose, inline = false }: { id: number; onClose: () => void; inline?: boolean }) {
  const [training, setTraining] = useState<Training | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    request<{ data: Training }>(`/trainings/${id}`).then((response) => { if (active) setTraining(response.data); })
      .catch((failure) => { if (active) setError(errorMessage(failure)); });
    return () => { active = false; };
  }, [id]);
  const content = <><Notice message={error} />{!training && !error && <Loading />}{training && <>
      <div className="detail-top"><span className="code-label">{training.code}</span><StatusBadge status={training.status} /></div>
      <p className="detail-description">{training.description || 'Sin descripción adicional.'}</p>
      <dl className="detail-grid"><div><dt>Inicio</dt><dd>{formatDate(training.start_date)} · {training.start_time}</dd></div><div><dt>Fin</dt><dd>{formatDate(training.end_date)} · {training.end_time}</dd></div><div><dt>Modalidad</dt><dd>{modalityLabels[training.modality]}</dd></div><div><dt>Lugar o enlace</dt><dd className="break-word">{training.location || 'Por definir'}</dd></div><div><dt>Instructor</dt><dd>{training.instructor_name || 'Sin asignar'}</dd></div><div><dt>Capacidad</dt><dd>{training.capacity} personas</dd></div></dl>
    </>}</>;
  if (inline) return <section aria-label="Versión vigente" className="panel modal-body">
    <h3>{training?.title ?? 'Versión vigente'}</h3>
    {content}
    <button type="button" className="button secondary small" onClick={onClose}>Cerrar consulta</button>
  </section>;
  return <Modal title={training?.title ?? 'Detalle de capacitación'} onClose={onClose}>
    <div className="modal-body">{content}</div>
    <div className="modal-actions"><button className="button secondary" onClick={onClose}>Cerrar detalle</button></div>
  </Modal>;
}

function TrainingEditor({ id, onClose, onSubmit }: {
  id: number;
  onClose: () => void;
  onSubmit: (payload: TrainingPayload) => Promise<void>;
}) {
  const [training, setTraining] = useState<Training | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [viewCurrent, setViewCurrent] = useState(false);

  useEffect(() => {
    let active = true;
    request<{ data: Training }>(`/trainings/${id}`)
      .then(({ data }) => { if (active) setTraining(data); })
      .catch((failure) => { if (active) setError(errorMessage(failure)); });
    return () => { active = false; };
  }, [id, attempt]);

  if (training && trainingEditStatuses[training.status].length > 0) {
    return <TrainingForm
      training={training}
      onClose={onClose}
      onSubmit={onSubmit}
      onConsultCurrent={() => setViewCurrent(true)}
      currentVersion={viewCurrent && <TrainingDetails id={id} inline onClose={() => setViewCurrent(false)} />}
    />;
  }

  return <Modal title="Editar capacitación" onClose={onClose}>
    <div className="modal-body">
      <Notice message={error || (training ? 'La capacitación está finalizada o cancelada y ya no admite cambios.' : '')} />
      {!training && !error && <Loading />}
    </div>
    <div className="modal-actions">
      <button type="button" className="button secondary" onClick={onClose}>Cerrar</button>
      {error && <button type="button" className="button primary" onClick={() => {
        setError('');
        setAttempt((value) => value + 1);
      }}>Reintentar</button>}
    </div>
  </Modal>;
}

export function TrainingsPage({ user }: { user: User }) {
  const [page, setPage] = useState(1);
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [success, setSuccess] = useState('');
  const query = new URLSearchParams({ page: String(page), pageSize: '10', search, status, from, to });
  const { data, meta, loading, error, reload } = usePaged<Training>(`/trainings?${query}`);
  const canManage = user.permissions.includes('trainings.manage');

  async function saveTraining(payload: TrainingPayload, id: number | null) {
    await request(id === null ? '/trainings' : `/trainings/${id}`, {
      method: id === null ? 'POST' : 'PUT',
      body: JSON.stringify(payload),
    });
    setSuccess(id === null ? 'La capacitación se registró correctamente.' : 'La capacitación se actualizó correctamente.');
    setCreating(false);
    setEditingId(null);
    reload();
  }
  return <>
    <div className="page-heading"><div><p className="eyebrow">PLANIFICACIÓN Y DESARROLLO</p><h1>Capacitaciones</h1><p>Organiza actividades y consulta su programación.</p></div>{canManage && <button className="button primary" onClick={() => { setSuccess(''); setCreating(true); }}><Icon name="plus" size={19} />Nueva capacitación</button>}</div>
    <Notice message={success} kind="success" /><Notice message={error} />
    <section className="panel"><div className="panel-topline"><div><h2>Listado de capacitaciones</h2><p>{canManage ? 'Toda la información de tus actividades, en un solo lugar.' : 'Actividades disponibles según tu rol y asignación.'}</p></div>{meta && <span className="count-badge">{meta.total} en total</span>}</div>
      <form className="filter-bar" onSubmit={(event) => { event.preventDefault(); setPage(1); setSearch(searchDraft.trim()); }}><div className="search-input"><Icon name="search" size={18} /><input aria-label="Buscar capacitaciones por título o código" value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="Buscar por título o código…" maxLength={160} /></div><select aria-label="Filtrar por estado" value={status} onChange={(event) => { setPage(1); setStatus(event.target.value); }}><option value="">Todos los estados</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button className="button secondary" type="submit">Buscar</button><div className="date-filters"><label>Desde<input type="date" value={from} onChange={(event) => { setPage(1); setFrom(event.target.value); }} /></label><label>Hasta<input type="date" min={from || undefined} value={to} onChange={(event) => { setPage(1); setTo(event.target.value); }} /></label></div></form>
      {loading ? <Loading /> : error ? <div className="retry-row"><button className="button secondary" onClick={reload}>Reintentar</button></div> : data.length === 0 ? <EmptyState title="No hay capacitaciones para mostrar" description={search || status || from || to ? 'Ajusta los filtros para encontrar otras actividades.' : canManage ? 'Crea la primera capacitación para comenzar a organizar la formación.' : 'Cuando tengas una capacitación asignada, aparecerá aquí.'} /> : <div className="table-scroll"><table><thead><tr><th>Capacitación</th><th>Programación</th><th>Instructor</th><th>Capacidad</th><th>Estado</th><th className="align-right">Acciones</th></tr></thead><tbody>{data.map((training) => <tr key={training.id}><td><button className="text-link table-title" onClick={() => setDetailId(training.id)}>{training.title}</button><span className="table-subtext">{training.code} <span>·</span> {modalityLabels[training.modality]}</span></td><td><span className="table-date">{formatDate(training.start_date)}</span><span className="table-subtext">{training.start_time} – {training.end_time}</span></td><td>{training.instructor_name || <span className="muted">Sin asignar</span>}</td><td><span className="capacity-label"><Icon name="users" size={16} />{training.capacity}</span></td><td><StatusBadge status={training.status} /></td><td className="align-right"><div className="table-actions"><button className="button ghost small" onClick={() => setDetailId(training.id)}>Ver detalle</button>{canManage && trainingEditStatuses[training.status].length > 0 && <button className="icon-button" onClick={() => { setSuccess(''); setEditingId(training.id); }} title={`Editar ${training.title}`} aria-label={`Editar ${training.title}`}><Icon name="edit" size={17} /></button>}</div></td></tr>)}</tbody></table></div>}
      {!loading && !error && <Pagination meta={meta} onPage={setPage} />}
    </section>
    {creating && <TrainingForm training={null} onClose={() => setCreating(false)} onSubmit={(payload) => saveTraining(payload, null)} />}
    {editingId !== null && <TrainingEditor key={editingId} id={editingId} onClose={() => setEditingId(null)} onSubmit={(payload) => saveTraining(payload, editingId)} />}
    {detailId !== null && <TrainingDetails id={detailId} onClose={() => setDetailId(null)} />}
  </>;
}

export function DashboardPage({ user, onNavigate }: { user: User; onNavigate: () => void }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [detailId, setDetailId] = useState<number | null>(null);
  useEffect(() => {
    let active = true; setError('');
    request<{ data: DashboardData }>('/dashboard').then((result) => { if (active) setData(result.data); }).catch((failure) => { if (active) setError(errorMessage(failure)); });
    return () => { active = false; };
  }, [revision]);
  const date = new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Lima' });
  const admin = user.permissions.includes('users.manage');
  return <>
    <div className="page-heading dashboard-heading"><div><p className="eyebrow">TU EQUIPO, EN MOVIMIENTO</p><h1>Hola, {user.first_name}<span className="greeting-dot">.</span></h1><p>Así va la formación de tu equipo.</p></div><div className="date-chip"><Icon name="calendar" size={17} /><span>{date}</span></div></div>
    <Notice message={error} />{error && <button className="button secondary" onClick={() => setRevision((value) => value + 1)}>Reintentar</button>}
    {!data && !error ? <Loading /> : data && <>
      <section className={`stats-grid ${admin ? '' : 'compact-stats'}`} aria-label="Resumen del sistema">
        <div className="stat-card"><div className="stat-top"><span>Capacitaciones</span><span className="stat-icon teal"><Icon name="book" /></span></div><strong>{data.trainings}</strong><small>Actividades en tu alcance</small></div>
        {admin && <div className="stat-card"><div className="stat-top"><span>Usuarios registrados</span><span className="stat-icon blue"><Icon name="users" /></span></div><strong>{data.users}</strong><small>Personas con cuenta en el sistema</small></div>}
        {user.permissions.includes('roles.manage') && <div className="stat-card"><div className="stat-top"><span>Roles del sistema</span><span className="stat-icon purple"><Icon name="shield" /></span></div><strong>{data.roles}</strong><small>Perfiles de acceso configurados</small></div>}
        <div className="stat-card"><div className="stat-top"><span>Próximas actividades</span><span className="stat-icon amber"><Icon name="clock" /></span></div><strong>{data.upcoming.length}</strong><small>Actividades mostradas en la agenda</small></div>
      </section>
      <section className="welcome-banner"><div><span className="section-kicker">CADA APRENDIZAJE CUENTA</span><h2>Prepara hoy el crecimiento<br />de tu equipo.</h2><p>Consulta las actividades y mantén su programación al día.</p><button className="button banner-button" onClick={onNavigate}>Explorar capacitaciones<Icon name="arrow" size={18} /></button></div><div className="banner-art" aria-hidden="true"><div className="art-orbit" /><div className="art-book"><Icon name="book" size={76} /></div><div className="art-check"><Icon name="check" size={25} /></div><span className="art-dot one" /><span className="art-dot two" /></div></section>
      <section className="panel"><div className="panel-topline"><div><div className="title-with-icon"><span className="small-icon"><Icon name="calendar" size={18} /></span><h2>En la agenda</h2></div><p>Próximas capacitaciones planificadas y programadas.</p></div><button className="button ghost" onClick={onNavigate}>Ver todas<Icon name="arrow" size={17} /></button></div>{data.upcoming.length === 0 ? <EmptyState title="Tu agenda está despejada" description="Las próximas capacitaciones aparecerán aquí cuando estén registradas y disponibles para tu cuenta." /> : <div className="agenda-list">{data.upcoming.map((training) => <button className="agenda-item" key={training.id} onClick={() => setDetailId(training.id)}><div className="agenda-date"><strong>{training.start_date.slice(8, 10)}</strong><span>{new Date(`${training.start_date}T12:00:00`).toLocaleDateString('es-PE', { month: 'short' }).replace('.', '')}</span></div><div className="agenda-copy"><strong>{training.title}</strong><span>{formatDate(training.start_date)} <span>·</span> {training.start_time} <span>·</span> {modalityLabels[training.modality]}</span></div><StatusBadge status={training.status} /><Icon name="arrow" size={18} /></button>)}</div>}</section>
    </>}
    {detailId !== null && <TrainingDetails id={detailId} onClose={() => setDetailId(null)} />}
  </>;
}
