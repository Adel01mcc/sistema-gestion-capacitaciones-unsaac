import { HttpError, paginated } from '../errors.js';
import { TRANSITIONS } from '../constants.js';
import { now, transaction } from '../db.js';
import { audit } from '../security.js';
import { parseTrainingInput, parseTrainingQuery } from '../validation/training-validation.js';
import { findTraining, searchTrainings, isActiveInstructor, trainingCodeExists, insertTraining, saveTraining, readTrainingDashboard } from '../repositories/training-repository.js';

function accessFilter(user) {
  if (user.permissions.includes('trainings.view_all') || user.permissions.includes('trainings.manage')) return { where: '1=1', args: [] };
  if (user.permissions.includes('teaching.manage')) return { where: 't.instructor_id=?', args: [user.id] };
  // V1 aún no tiene inscripciones; el participante no obtiene datos de terceros.
  return { where: '0=1', args: [] };
}
export function getTraining(db, id, user) {
  const row = findTraining(db, id, accessFilter(user));
  if (!row) throw new HttpError(404, 'La capacitación no existe o no está disponible para su cuenta.');
  return { ...row, sessions: [], enrollments: [] };
}
export function listTrainings(db, query, user) {
  const filters = parseTrainingQuery(query);
  const { rows, total } = searchTrainings(db, filters, accessFilter(user));
  return paginated(rows, total, filters.page, filters.pageSize);
}
function checkInstructor(db, id) {
  if (id !== null && !isActiveInstructor(db, id)) throw new HttpError(422, 'Seleccione un instructor activo.', { instructor_id: 'El usuario debe estar activo y tener rol instructor.' });
}
function assertCode(db, code, id = 0) {
  if (trainingCodeExists(db, code, id)) throw new HttpError(409, 'Ya existe una capacitación con ese código.', { code: 'Use otro código.' });
}
export function createTraining(db, input, user) {
  const value = parseTrainingInput(input);
  if (!['planificada', 'programada'].includes(value.status)) throw new HttpError(422, 'Una capacitación nueva debe estar planificada o programada.', { status: 'Seleccione planificada o programada.' });
  return transaction(db, () => {
    checkInstructor(db, value.instructor_id);
    assertCode(db, value.code);
    const id = insertTraining(db, value, user.id, now());
    audit(db, user.id, 'create', 'training', id);
    return getTraining(db, id, user);
  });
}
export function updateTraining(db, id, input, user) {
  const value = parseTrainingInput(input);
  return transaction(db, () => {
    const current = getTraining(db, id, user);
    if (['finalizada', 'cancelada'].includes(current.status)) throw new HttpError(409, 'Una capacitación finalizada o cancelada no admite cambios.');
    if (value.status !== current.status && !TRANSITIONS[current.status].includes(value.status)) throw new HttpError(409, 'El cambio de estado solicitado no está permitido.', { status: 'Revise las transiciones documentadas.' });
    checkInstructor(db, value.instructor_id);
    assertCode(db, value.code, id);
    saveTraining(db, id, value, now());
    audit(db, user.id, 'update', 'training', id);
    return getTraining(db, id, user);
  });
}
export function dashboard(db, user) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return readTrainingDashboard(db, accessFilter(user), today, user.permissions.includes('users.manage'));
}
