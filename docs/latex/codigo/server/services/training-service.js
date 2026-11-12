import { z } from 'zod';
import { HttpError, validate, paginationSchema, paginated, searchPattern } from '../errors.js';
import { MODALITIES, TRAINING_STATUSES, TRANSITIONS } from '../constants.js';
import { now, transaction } from '../db.js';
import { audit, hydrateUser } from '../security.js';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use una fecha YYYY-MM-DD.').refine(value => {
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, 'La fecha no existe.');
const timeSchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'Use una hora HH:mm.');
const schema = z.object({
  code: z.string().trim().min(1, 'Ingrese el código.').max(30),
  title: z.string().trim().min(3, 'Ingrese un título de al menos 3 caracteres.').max(160),
  description: z.string().trim().max(4000).default(''),
  start_date: dateSchema,
  end_date: dateSchema,
  start_time: timeSchema,
  end_time: timeSchema,
  modality: z.enum(MODALITIES),
  location: z.string().trim().min(1, 'Indique el lugar o enlace.').max(240),
  capacity: z.number().int().min(1, 'El cupo mínimo es 1.').max(10000),
  status: z.enum(TRAINING_STATUSES).default('planificada'),
  instructor_id: z.number().int().positive().nullable().default(null),
  // Se acepta por compatibilidad, pero siempre se conserva el responsable autenticado.
  responsible_id: z.number().int().positive().optional(),
}).strict().superRefine((value, context) => {
  if (value.end_date < value.start_date) context.addIssue({ code: 'custom', path: ['end_date'], message: 'La fecha final debe ser igual o posterior al inicio.' });
  if (value.end_time <= value.start_time) context.addIssue({ code: 'custom', path: ['end_time'], message: 'La hora final debe ser posterior a la inicial (horario diario).' });
});
const select = `SELECT t.*, trim(i.first_name || ' ' || i.last_name) AS instructor_name, 0 AS enrolled_count, t.capacity AS available_seats FROM trainings t LEFT JOIN users i ON i.id=t.instructor_id`;
function accessFilter(user) {
  if (user.permissions.includes('trainings.view_all') || user.permissions.includes('trainings.manage')) return { where: '1=1', args: [] };
  if (user.permissions.includes('teaching.manage')) return { where: 't.instructor_id=?', args: [user.id] };
  // V1 aún no tiene inscripciones; el participante no obtiene datos de terceros.
  return { where: '0=1', args: [] };
}
export function getTraining(db, id, user) {
  const { where, args } = accessFilter(user);
  const row = db.prepare(`${select} WHERE t.id=? AND (${where})`).get(id, ...args);
  if (!row) throw new HttpError(404, 'La capacitación no existe o no está disponible para su cuenta.');
  return { ...row, sessions: [], enrollments: [] };
}
export function listTrainings(db, query, user) {
  const { page, pageSize, search, status, from, to } = validate(z.object({
    ...paginationSchema, search: z.string().trim().max(160).default(''),
    status: z.preprocess(value => value === '' ? undefined : value, z.enum(TRAINING_STATUSES).optional()),
    from: z.preprocess(value => value === '' ? undefined : value, dateSchema.optional()),
    to: z.preprocess(value => value === '' ? undefined : value, dateSchema.optional()),
  }).refine(value => !value.from || !value.to || value.from <= value.to, { path: ['to'], message: 'El rango de fechas está invertido.' }), query);
  const access = accessFilter(user);
  let where = `(${access.where}) AND (t.title LIKE ? ESCAPE '\\' OR t.code LIKE ? ESCAPE '\\')`;
  const args = [...access.args, searchPattern(search), searchPattern(search)];
  if (status) { where += ' AND t.status=?'; args.push(status); }
  if (from) { where += ' AND t.start_date>=?'; args.push(from); }
  if (to) { where += ' AND t.start_date<=?'; args.push(to); }
  const total = db.prepare(`SELECT COUNT(*) AS total FROM trainings t WHERE ${where}`).get(...args).total;
  const rows = db.prepare(`${select} WHERE ${where} ORDER BY t.start_date DESC,t.id DESC LIMIT ? OFFSET ?`).all(...args, pageSize, (page - 1) * pageSize);
  return paginated(rows, total, page, pageSize);
}
function checkInstructor(db, id) {
  if (id === null) return;
  const user = hydrateUser(db, id);
  if (!user?.active || !user.roles.includes('instructor')) throw new HttpError(422, 'Seleccione un instructor activo.', { instructor_id: 'El usuario debe estar activo y tener rol instructor.' });
}
function assertCode(db, code, id = 0) {
  if (db.prepare('SELECT 1 FROM trainings WHERE code=? AND id<>?').get(code, id)) throw new HttpError(409, 'Ya existe una capacitación con ese código.', { code: 'Use otro código.' });
}
export function createTraining(db, input, user) {
  const value = validate(schema, input);
  if (!['planificada', 'programada'].includes(value.status)) throw new HttpError(422, 'Una capacitación nueva debe estar planificada o programada.', { status: 'Seleccione planificada o programada.' });
  return transaction(db, () => {
    checkInstructor(db, value.instructor_id);
    assertCode(db, value.code);
    const timestamp = now();
    const result = db.prepare('INSERT INTO trainings (code,title,description,start_date,end_date,start_time,end_time,modality,location,capacity,status,instructor_id,responsible_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(value.code, value.title, value.description, value.start_date, value.end_date, value.start_time, value.end_time, value.modality, value.location, value.capacity, value.status, value.instructor_id, user.id, timestamp, timestamp);
    const id = Number(result.lastInsertRowid);
    audit(db, user.id, 'create', 'training', id);
    return getTraining(db, id, user);
  });
}
export function updateTraining(db, id, input, user) {
  const value = validate(schema, input);
  return transaction(db, () => {
    const current = getTraining(db, id, user);
    if (['finalizada', 'cancelada'].includes(current.status)) throw new HttpError(409, 'Una capacitación finalizada o cancelada no admite cambios.');
    if (value.status !== current.status && !TRANSITIONS[current.status].includes(value.status)) throw new HttpError(409, 'El cambio de estado solicitado no está permitido.', { status: 'Revise las transiciones documentadas.' });
    checkInstructor(db, value.instructor_id);
    assertCode(db, value.code, id);
    db.prepare('UPDATE trainings SET code=?,title=?,description=?,start_date=?,end_date=?,start_time=?,end_time=?,modality=?,location=?,capacity=?,status=?,instructor_id=?,updated_at=? WHERE id=?').run(value.code, value.title, value.description, value.start_date, value.end_date, value.start_time, value.end_time, value.modality, value.location, value.capacity, value.status, value.instructor_id, now(), id);
    audit(db, user.id, 'update', 'training', id);
    return getTraining(db, id, user);
  });
}
export function dashboard(db, user) {
  const access = accessFilter(user);
  const trainings = db.prepare(`SELECT COUNT(*) AS total FROM trainings t WHERE ${access.where}`).get(...access.args).total;
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const upcoming = db.prepare(`${select} WHERE (${access.where}) AND t.status IN ('planificada','programada') AND t.start_date>=? ORDER BY t.start_date,t.start_time,t.id LIMIT 5`).all(...access.args, today);
  const canManage = user.permissions.includes('users.manage');
  return { trainings, users: canManage ? db.prepare('SELECT COUNT(*) AS total FROM users').get().total : null, roles: canManage ? db.prepare('SELECT COUNT(*) AS total FROM roles').get().total : null, enrollments: 0, certificates: 0, upcoming };
}
