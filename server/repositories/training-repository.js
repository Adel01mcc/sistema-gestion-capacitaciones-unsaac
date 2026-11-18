import { searchPattern } from '../errors.js';

const select = `SELECT t.*, trim(i.first_name || ' ' || i.last_name) AS instructor_name, 0 AS enrolled_count, t.capacity AS available_seats FROM trainings t LEFT JOIN users i ON i.id=t.instructor_id`;

// scope.where sólo recibe fragmentos definidos por el servicio, nunca texto del cliente.
export function findTraining(db, id, scope) {
  return db.prepare(`${select} WHERE t.id=? AND (${scope.where})`).get(id, ...scope.args);
}

export function searchTrainings(db, filters, scope) {
  const { page, pageSize, search, status, from, to } = filters;
  let where = `(${scope.where}) AND (t.title LIKE ? ESCAPE '\\' OR t.code LIKE ? ESCAPE '\\')`;
  const args = [...scope.args, searchPattern(search), searchPattern(search)];
  if (status) { where += ' AND t.status=?'; args.push(status); }
  if (from) { where += ' AND t.start_date>=?'; args.push(from); }
  if (to) { where += ' AND t.start_date<=?'; args.push(to); }
  const total = db.prepare(`SELECT COUNT(*) AS total FROM trainings t WHERE ${where}`).get(...args).total;
  const rows = db.prepare(`${select} WHERE ${where} ORDER BY t.start_date DESC,t.id DESC LIMIT ? OFFSET ?`).all(...args, pageSize, (page - 1) * pageSize);
  return { rows, total };
}

export function isActiveInstructor(db, id) {
  return Boolean(db.prepare(`SELECT 1 FROM users u WHERE u.id=? AND u.active=1
    AND EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id=ur.role_id
      WHERE ur.user_id=u.id AND r.code='instructor')`).get(id));
}

export function trainingCodeExists(db, code, excludingId = 0) {
  return Boolean(db.prepare('SELECT 1 FROM trainings WHERE code=? AND id<>?').get(code, excludingId));
}

export function insertTraining(db, value, responsibleId, timestamp) {
  const result = db.prepare('INSERT INTO trainings (code,title,description,start_date,end_date,start_time,end_time,modality,location,capacity,status,instructor_id,responsible_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(value.code, value.title, value.description, value.start_date, value.end_date, value.start_time, value.end_time, value.modality, value.location, value.capacity, value.status, value.instructor_id, responsibleId, timestamp, timestamp);
  return Number(result.lastInsertRowid);
}

export function saveTraining(db, id, value, timestamp) {
  db.prepare('UPDATE trainings SET code=?,title=?,description=?,start_date=?,end_date=?,start_time=?,end_time=?,modality=?,location=?,capacity=?,status=?,instructor_id=?,updated_at=? WHERE id=?').run(value.code, value.title, value.description, value.start_date, value.end_date, value.start_time, value.end_time, value.modality, value.location, value.capacity, value.status, value.instructor_id, timestamp, id);
}

export function readTrainingDashboard(db, scope, today, includeAccounts) {
  const trainings = db.prepare(`SELECT COUNT(*) AS total FROM trainings t WHERE ${scope.where}`).get(...scope.args).total;
  const upcoming = db.prepare(`${select} WHERE (${scope.where}) AND t.status IN ('planificada','programada') AND t.start_date>=? ORDER BY t.start_date,t.start_time,t.id LIMIT 5`).all(...scope.args, today);
  return { trainings, users: includeAccounts ? db.prepare('SELECT COUNT(*) AS total FROM users').get().total : null, roles: includeAccounts ? db.prepare('SELECT COUNT(*) AS total FROM roles').get().total : null, enrollments: 0, certificates: 0, upcoming };
}
