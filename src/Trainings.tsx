import { useEffect, useState, type FormEvent } from 'react';
import { errorMessage, request } from './api';
import { EmptyState, Field, formatDate, Icon, Loading, Modal, Notice, Pagination, StatusBadge } from './components';
import { usePaged } from './hooks';
import { modalityLabels, statusLabels, type DashboardData, type ListResponse, type Training, type TrainingStatus, type User } from './types';

function TrainingDetails({ id, onClose }: { id: number; onClose: () => void }) {
  const [training, setTraining] = useState<Training | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    request<{ data: Training }>(`/trainings/${id}`).then((response) => { if (active) setTraining(response.data); })
      .catch((failure) => { if (active) setError(errorMessage(failure)); });
    return () => { active = false; };
  }, [id]);
  return <Modal title={training?.title ?? 'Detalle de capacitación'} onClose={onClose}>
    <div className="modal-body"><Notice message={error} />{!training && !error && <Loading />}{training && <>
      <div className="detail-top"><span className="code-label">{training.code}</span><StatusBadge status={training.status} /></div>
      <p className="detail-description">{training.description || 'Sin descripción adicional.'}</p>
      <dl className="detail-grid"><div><dt>Inicio</dt><dd>{formatDate(training.start_date)} · {training.start_time}</dd></div><div><dt>Fin</dt><dd>{formatDate(training.end_date)} · {training.end_time}</dd></div><div><dt>Modalidad</dt><dd>{modalityLabels[training.modality]}</dd></div><div><dt>Lugar o enlace</dt><dd className="break-word">{training.location || 'Por definir'}</dd></div><div><dt>Instructor</dt><dd>{training.instructor_name || 'Sin asignar'}</dd></div><div><dt>Capacidad</dt><dd>{training.capacity} personas</dd></div></dl>
    </>}</div><div className="modal-actions"><button className="button secondary" onClick={onClose}>Cerrar detalle</button></div>
  </Modal>;
}

const transitions: Record<TrainingStatus, TrainingStatus[]> = {
  planificada: ['planificada', 'programada', 'cancelada'],
  programada: ['programada', 'planificada', 'en_curso', 'cancelada'],
  en_curso: ['en_curso', 'finalizada', 'cancelada'], finalizada: ['finalizada'], cancelada: ['cancelada'],
};

function TrainingForm({ training, onClose, onSaved }: { training: Training | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    code: training?.code ?? '', title: training?.title ?? '', description: training?.description ?? '',
    start_date: training?.start_date ?? '', end_date: training?.end_date ?? '',
    start_time: training?.start_time ?? '09:00', end_time: training?.end_time ?? '10:00',
    modality: training?.modality ?? 'presencial', location: training?.location ?? '', capacity: String(training?.capacity ?? 20),
    status: training?.status ?? 'planificada', instructor_id: String(training?.instructor_id ?? ''),
  });
  const [instructors, setInstructors] = useState<User[]>([]);
  const [lookupError, setLookupError] = useState('');
  const [lookupLoading, setLookupLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    async function loadInstructors() {
      const first = await request<ListResponse<User>>('/users?role=instructor&pageSize=100&page=1');
      const people = [...first.data];
      for (let page = 2; active && page <= first.meta.totalPages; page += 1) {
        const next = await request<ListResponse<User>>(`/users?role=instructor&pageSize=100&page=${page}`);
        people.push(...next.data);
      }
      return people;
    }
    loadInstructors().then((people) => { if (active) setInstructors(people.filter((user) => user.active || user.id === training?.instructor_id)); })
      .catch((failure) => { if (active) setLookupError(errorMessage(failure)); })
      .finally(() => { if (active) setLookupLoading(false); });
    return () => { active = false; };
  }, [training?.instructor_id]);
  function update(field: keyof typeof form, value: string) { setForm((current) => ({ ...current, [field]: value })); }
  async function submit(event: FormEvent) {
    event.preventDefault(); setError('');
    if (form.end_date < form.start_date || (form.end_date === form.start_date && form.end_time <= form.start_time)) {
      setError('La fecha y hora de fin deben ser posteriores al inicio.'); return;
    }
    setSaving(true);
    try {
      await request(`/trainings${training ? `/${training.id}` : ''}`, {
        method: training ? 'PUT' : 'POST', body: JSON.stringify({ ...form, capacity: Number(form.capacity), instructor_id: form.instructor_id ? Number(form.instructor_id) : null }),
      }); onSaved();
    } catch (failure) { setError(errorMessage(failure)); }
    finally { setSaving(false); }
  }
  const allowedStatuses = training ? transitions[training.status] : ['planificada', 'programada'] as TrainingStatus[];
  return <Modal title={training ? 'Editar capacitación' : 'Nueva capacitación'} description="Organiza los datos y la programación de la actividad." onClose={() => { if (!saving) onClose(); }}>
    <form onSubmit={submit}><div className="modal-body"><Notice message={error} /><Notice message={lookupError} kind="info" /><div className="form-grid">
      <Field label="Código *"><input value={form.code} onChange={(event) => update('code', event.target.value)} required maxLength={30} placeholder="CAP-001" /></Field>
      <Field label="Estado *"><select value={form.status} onChange={(event) => update('status', event.target.value)}>{allowedStatuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></Field>
      <Field label="Título de la capacitación *" wide><input value={form.title} onChange={(event) => update('title', event.target.value)} required minLength={3} maxLength={160} placeholder="Ej. Conocimiento de productos" /></Field>
      <Field label="Descripción" wide><textarea value={form.description} onChange={(event) => update('description', event.target.value)} rows={3} maxLength={4000} placeholder="Objetivo y contenido de la actividad" /></Field>
      <Field label="Fecha de inicio *"><input type="date" value={form.start_date} onChange={(event) => update('start_date', event.target.value)} required /></Field>
      <Field label="Fecha de fin *"><input type="date" value={form.end_date} min={form.start_date || undefined} onChange={(event) => update('end_date', event.target.value)} required /></Field>
      <Field label="Hora de inicio *"><input type="time" value={form.start_time} onChange={(event) => update('start_time', event.target.value)} required /></Field>
      <Field label="Hora de fin *"><input type="time" value={form.end_time} onChange={(event) => update('end_time', event.target.value)} required /></Field>
      <Field label="Modalidad *"><select value={form.modality} onChange={(event) => update('modality', event.target.value)}>{Object.entries(modalityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
      <Field label="Capacidad de personas *"><input type="number" min={1} max={10000} step={1} value={form.capacity} onChange={(event) => update('capacity', event.target.value)} required /></Field>
      <Field label="Lugar o enlace *" wide><input value={form.location} onChange={(event) => update('location', event.target.value)} required maxLength={240} placeholder="Dirección, sala o enlace de reunión" /></Field>
      <Field label="Instructor" wide hint="La asignación es opcional; se muestran instructores activos."><select value={form.instructor_id} disabled={lookupLoading} onChange={(event) => update('instructor_id', event.target.value)}><option value="">{lookupLoading ? 'Cargando instructores…' : 'Sin asignar'}</option>{training?.instructor_id && !instructors.some((person) => person.id === training.instructor_id) && <option value={training.instructor_id}>{training.instructor_name ?? `Instructor #${training.instructor_id}`}</option>}{instructors.map((person) => <option key={person.id} value={person.id}>{person.first_name} {person.last_name}</option>)}</select></Field>
    </div><p className="form-required">* Campos obligatorios. Los cambios se validan al guardar.</p>{form.status === 'cancelada' || form.status === 'finalizada' ? <Notice message="Al guardar este estado, la capacitación quedará cerrada y no admitirá más ediciones." kind="info" /> : null}</div>
      <div className="modal-actions"><button type="button" className="button secondary" disabled={saving} onClick={onClose}>Cancelar</button><button type="submit" className="button primary" disabled={saving}>{saving ? 'Guardando…' : training ? 'Guardar cambios' : 'Crear capacitación'}<Icon name="check" size={18} /></button></div>
    </form>
  </Modal>;
}

export function TrainingsPage({ user }: { user: User }) {
  const [page, setPage] = useState(1);
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [editing, setEditing] = useState<Training | null | undefined>(undefined);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [success, setSuccess] = useState('');
  const query = new URLSearchParams({ page: String(page), pageSize: '10', search, status, from, to });
  const { data, meta, loading, error, reload } = usePaged<Training>(`/trainings?${query}`);
  const canManage = user.permissions.includes('trainings.manage');
  return <>
    <div className="page-heading"><div><p className="eyebrow">PLANIFICACIÓN Y DESARROLLO</p><h1>Capacitaciones</h1><p>Organiza actividades y consulta su programación.</p></div>{canManage && <button className="button primary" onClick={() => { setSuccess(''); setEditing(null); }}><Icon name="plus" size={19} />Nueva capacitación</button>}</div>
    <Notice message={success} kind="success" /><Notice message={error} />
    <section className="panel"><div className="panel-topline"><div><h2>Listado de capacitaciones</h2><p>{canManage ? 'Toda la información de tus actividades, en un solo lugar.' : 'Actividades disponibles según tu rol y asignación.'}</p></div>{meta && <span className="count-badge">{meta.total} en total</span>}</div>
      <form className="filter-bar" onSubmit={(event) => { event.preventDefault(); setPage(1); setSearch(searchDraft.trim()); }}><div className="search-input"><Icon name="search" size={18} /><input aria-label="Buscar capacitaciones por título o código" value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="Buscar por título o código…" maxLength={160} /></div><select aria-label="Filtrar por estado" value={status} onChange={(event) => { setPage(1); setStatus(event.target.value); }}><option value="">Todos los estados</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button className="button secondary" type="submit">Buscar</button><div className="date-filters"><label>Desde<input type="date" value={from} onChange={(event) => { setPage(1); setFrom(event.target.value); }} /></label><label>Hasta<input type="date" min={from || undefined} value={to} onChange={(event) => { setPage(1); setTo(event.target.value); }} /></label></div></form>
      {loading ? <Loading /> : error ? <div className="retry-row"><button className="button secondary" onClick={reload}>Reintentar</button></div> : data.length === 0 ? <EmptyState title="No hay capacitaciones para mostrar" description={search || status || from || to ? 'Ajusta los filtros para encontrar otras actividades.' : canManage ? 'Crea la primera capacitación para comenzar a organizar la formación.' : 'Cuando tengas una capacitación asignada, aparecerá aquí.'} /> : <div className="table-scroll"><table><thead><tr><th>Capacitación</th><th>Programación</th><th>Instructor</th><th>Capacidad</th><th>Estado</th><th className="align-right">Acciones</th></tr></thead><tbody>{data.map((training) => <tr key={training.id}><td><button className="text-link table-title" onClick={() => setDetailId(training.id)}>{training.title}</button><span className="table-subtext">{training.code} <span>·</span> {modalityLabels[training.modality]}</span></td><td><span className="table-date">{formatDate(training.start_date)}</span><span className="table-subtext">{training.start_time} – {training.end_time}</span></td><td>{training.instructor_name || <span className="muted">Sin asignar</span>}</td><td><span className="capacity-label"><Icon name="users" size={16} />{training.capacity}</span></td><td><StatusBadge status={training.status} /></td><td className="align-right"><div className="table-actions"><button className="button ghost small" onClick={() => setDetailId(training.id)}>Ver detalle</button>{canManage && !['cancelada', 'finalizada'].includes(training.status) && <button className="icon-button" onClick={() => { setSuccess(''); setEditing(training); }} title={`Editar ${training.title}`} aria-label={`Editar ${training.title}`}><Icon name="edit" size={17} /></button>}</div></td></tr>)}</tbody></table></div>}
      {!loading && !error && <Pagination meta={meta} onPage={setPage} />}
    </section>
    {editing !== undefined && <TrainingForm training={editing} onClose={() => setEditing(undefined)} onSaved={() => { setSuccess(editing ? 'La capacitación se actualizó correctamente.' : 'La capacitación se registró correctamente.'); setEditing(undefined); reload(); }} />}
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
