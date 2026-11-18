import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { createDatabase } from '../server/db.js';
import { createApp } from '../server/app.js';
import { seedDemo } from '../server/seed.js';
import { demoPassword, fixture, login, trainingInput } from './helpers.js';

let context;
let admin;
before(async () => { context = await fixture(); admin = await login(context.app); });
after(() => context?.close());

const counts = () => ({
  trainings: context.db.prepare('SELECT COUNT(*) AS n FROM trainings').get().n,
  audit: context.db.prepare('SELECT COUNT(*) AS n FROM audit_log').get().n,
});
const stored = id => context.db.prepare('SELECT * FROM trainings WHERE id=?').get(id);
const create = input => admin.agent.post('/api/trainings').set('X-CSRF-Token', admin.csrf).send(input);
const update = (id, input) => admin.agent.put(`/api/trainings/${id}`).set('X-CSRF-Token', admin.csrf).send(input);

test('HU-03/HU-04: cada campo obligatorio ausente produce 422 sin registro ni auditoría parcial', async () => {
  const input = trainingInput({ code: 'OBLIGATORIOS' });
  const created = await create(input).expect(201);
  const id = created.body.data.id;
  const beforeCounts = counts();
  const beforeRow = stored(id);
  for (const field of ['code', 'title', 'start_date', 'end_date', 'start_time', 'end_time', 'modality', 'location', 'capacity']) {
    const incomplete = { ...input };
    delete incomplete[field];
    for (const call of [create(incomplete), update(id, incomplete)]) {
      const response = await call.expect(422);
      assert.equal(typeof response.body.error.fields[field], 'string', field);
      assert.deepEqual(counts(), beforeCounts, field);
      assert.deepEqual(stored(id), beforeRow, field);
    }
  }
});

test('HU-03/HU-04: fechas reales, años bisiestos y horas de frontera mantienen el contrato', async () => {
  for (const [index, date] of ['2000-02-29', '2028-02-29', '2027-12-31'].entries()) {
    const input = trainingInput({ code: `CALENDARIO-${index}`, start_date: date, end_date: date, start_time: '00:00', end_time: '23:59', capacity: 10000 });
    const created = await create(input).expect(201);
    const id = created.body.data.id;
    assert.equal(created.body.data.start_date, date);
    assert.equal(created.body.data.available_seats, 10000);
    const result = await update(id, { ...input, capacity: 1 }).expect(200);
    assert.equal(result.body.data.capacity, 1);
    assert.equal(result.body.data.end_time, '23:59');
  }
});

test('HU-03/HU-04: rechaza calendario, formatos e intervalos inválidos en alta y edición sin efectos', async () => {
  const input = trainingInput({ code: 'INVALIDOS-EDICION' });
  const id = (await create(input).expect(201)).body.data.id;
  const beforeCounts = counts();
  const beforeRow = stored(id);
  const invalidCases = [
    [{ start_date: '1900-02-29', end_date: '1900-03-01' }, 'start_date'],
    [{ start_date: '2027-02-29', end_date: '2027-03-01' }, 'start_date'],
    [{ end_date: '2027-04-31' }, 'end_date'],
    [{ start_date: '2027-1-20' }, 'start_date'],
    [{ start_date: '2027-01-20T00:00:00Z' }, 'start_date'],
    [{ end_date: '2027-01-19' }, 'end_date'],
    [{ start_time: '9:00' }, 'start_time'],
    [{ start_time: '09:00:00' }, 'start_time'],
    [{ start_time: '24:00' }, 'start_time'],
    [{ end_time: '11:60' }, 'end_time'],
    [{ end_time: '09:00' }, 'end_time'],
    [{ start_date: '2027-01-20', end_date: '2027-01-21', start_time: '23:00', end_time: '01:00' }, 'end_time'],
    [{ instructor_id: 999999 }, 'instructor_id'],
    [{ unexpected_field: 'no admitido' }, 'form'],
  ];
  for (const [overrides, field] of invalidCases) {
    for (const call of [create({ ...input, ...overrides }), update(id, { ...input, ...overrides })]) {
      const response = await call.expect(422);
      assert.equal(typeof response.body.error.fields[field], 'string', JSON.stringify(overrides));
      assert.deepEqual(counts(), beforeCounts);
      assert.deepEqual(stored(id), beforeRow);
    }
  }
});

test('HU-04: GET y PUT distinguen identificador inválido de capacitación inexistente', async () => {
  const beforeCounts = counts();
  for (const [id, status] of [['invalido', 422], ['0', 422], ['-1', 422], ['1.5', 422], ['9007199254740992', 422], ['999999', 404]]) {
    const read = await admin.agent.get(`/api/trainings/${id}`).expect(status);
    const edited = await update(id, trainingInput()).expect(status);
    assert.equal(typeof read.body.error.message, 'string');
    assert.equal(typeof edited.body.error.message, 'string');
  }
  assert.deepEqual(counts(), beforeCounts);
});

test('HU-04: PUT conserva ID, responsable y creación aunque otro gestor envíe responsable arbitrario', async () => {
  const input = trainingInput({ code: 'CONTRATO-EDICION' });
  const original = (await create(input).expect(201)).body.data;
  const coordinator = await login(context.app, 'coordinacion@demo.test');
  const next = { ...input, code: 'CONTRATO-ACTUALIZADO', title: 'Planificación actualizada', description: 'Descripción actualizada', location: 'Otra sala ficticia', modality: 'virtual', capacity: 22, status: 'programada', responsible_id: coordinator.user.id };
  const edited = await coordinator.agent.put(`/api/trainings/${original.id}`).set('X-CSRF-Token', coordinator.csrf).send(next).expect(200);
  const detail = await admin.agent.get(`/api/trainings/${original.id}`).expect(200);
  assert.deepEqual(detail.body, edited.body);
  const training = detail.body.data;
  assert.equal(training.id, original.id);
  assert.equal(training.responsible_id, admin.user.id);
  assert.notEqual(training.responsible_id, coordinator.user.id);
  assert.equal(training.created_at, original.created_at);
  assert.equal(training.enrolled_count, 0);
  assert.equal(training.available_seats, 22);
  assert.equal(training.instructor_name, null);
  assert.deepEqual(training.sessions, []);
  assert.deepEqual(training.enrollments, []);
  for (const field of ['code', 'title', 'description', 'location', 'modality', 'capacity', 'status']) assert.equal(training[field], next[field]);
  const audit = context.db.prepare("SELECT user_id FROM audit_log WHERE entity='training' AND entity_id=? AND action='update'").all(original.id);
  assert.deepEqual(audit.map(row => row.user_id), [coordinator.user.id]);
});

test('HU-04: conflicto de código sin distinguir mayúsculas preserva registro y auditoría', async () => {
  await create(trainingInput({ code: 'CODIGO-OCUPADO' })).expect(201);
  const input = trainingInput({ code: 'CODIGO-EDITABLE' });
  const id = (await create(input).expect(201)).body.data.id;
  const beforeRow = stored(id);
  const beforeCounts = counts();
  const conflict = await update(id, { ...input, code: 'codigo-ocupado', title: 'No debe persistir' }).expect(409);
  assert.equal(typeof conflict.body.error.fields.code, 'string');
  assert.deepEqual(stored(id), beforeRow);
  assert.deepEqual(counts(), beforeCounts);
});

test('HU-04: matriz completa de 25 pares de estados respeta transiciones y bloqueos terminales', async t => {
  // Tabla esperada independiente de constants.js: prueba las reglas del contrato.
  const allowed = {
    planificada: ['planificada', 'programada', 'cancelada'],
    programada: ['planificada', 'programada', 'en_curso', 'cancelada'],
    en_curso: ['en_curso', 'finalizada', 'cancelada'],
    finalizada: [],
    cancelada: [],
  };
  const paths = {
    planificada: [],
    programada: ['programada'],
    en_curso: ['programada', 'en_curso'],
    finalizada: ['programada', 'en_curso', 'finalizada'],
    cancelada: ['cancelada'],
  };
  for (const from of Object.keys(allowed)) {
    for (const to of Object.keys(allowed)) {
      await t.test(`${from} -> ${to}`, async () => {
        const input = trainingInput({ code: `E-${Object.keys(allowed).indexOf(from)}-${Object.keys(allowed).indexOf(to)}` });
        const id = (await create(input).expect(201)).body.data.id;
        for (const status of paths[from]) await update(id, { ...input, status }).expect(200);
        const beforeRow = stored(id);
        const beforeCounts = counts();
        const accepted = allowed[from].includes(to);
        const response = await update(id, { ...input, title: 'Edición por transición', status: to }).expect(accepted ? 200 : 409);
        if (accepted) {
          assert.equal(response.body.data.status, to);
          assert.equal(stored(id).title, 'Edición por transición');
          assert.equal(counts().audit, beforeCounts.audit + 1);
          assert.equal(counts().trainings, beforeCounts.trainings);
        } else {
          assert.equal(typeof response.body.error.message, 'string');
          assert.deepEqual(stored(id), beforeRow);
          assert.deepEqual(counts(), beforeCounts);
        }
      });
    }
  }
});

test('HU-03/HU-04: fallo de auditoría devuelve 500 genérico y revierte alta y edición completas', async t => {
  const input = trainingInput({ code: 'ROLLBACK-EDITABLE' });
  const id = (await create(input).expect(201)).body.data.id;
  const beforeRow = stored(id);
  const beforeCounts = counts();
  const errors = [];
  t.mock.method(console, 'error', (...args) => errors.push(args));
  context.db.exec(`CREATE TEMP TRIGGER fail_training_audit BEFORE INSERT ON audit_log
    WHEN NEW.entity='training' BEGIN SELECT RAISE(ABORT, 'fallo ficticio de auditoria'); END;`);
  try {
    for (const call of [create(trainingInput({ code: 'ROLLBACK-NUEVA' })), update(id, { ...input, title: 'Cambio que debe revertirse', status: 'programada' })]) {
      const response = await call.expect(500);
      assert.deepEqual(response.body, { error: { message: 'Ocurrió un error inesperado. Inténtelo nuevamente.' } });
      assert.deepEqual(counts(), beforeCounts);
      assert.deepEqual(stored(id), beforeRow);
    }
    assert.equal(errors.length, 2);
    assert.equal(context.db.prepare("SELECT COUNT(*) AS n FROM trainings WHERE code='ROLLBACK-NUEVA'").get().n, 0);
  } finally {
    context.db.exec('DROP TRIGGER fail_training_audit');
  }
  // La conexión sigue siendo utilizable después de los dos rollbacks.
  await update(id, { ...input, title: 'Edición posterior al fallo' }).expect(200);
});

test('HU-03/HU-04: búsqueda literal y paginación conservan data/meta y filtros de fecha inclusivos', async () => {
  const created = [];
  for (const code of ['LITERAL_%', 'LITERAL_A', 'LITERAL_B']) created.push((await create(trainingInput({ code, title: `Curso ${code}` })).expect(201)).body.data.id);
  const literal = await admin.agent.get('/api/trainings').query({ search: 'LITERAL_%', pageSize: 1 }).expect(200);
  assert.equal(literal.body.meta.total, 1);
  assert.equal(literal.body.data[0].id, created[0]);
  const page = await admin.agent.get('/api/trainings').query({ search: 'LITERAL_', status: 'planificada', from: '2027-01-20', to: '2027-01-20', page: 2, pageSize: 2 }).expect(200);
  assert.deepEqual(page.body.meta, { page: 2, pageSize: 2, total: 3, totalPages: 2 });
  assert.deepEqual(page.body.data.map(row => row.id), [created[0]]);
  assert.equal(page.body.data[0].sessions, undefined);
  assert.equal(page.body.data[0].available_seats, 10);
  for (const query of [{ page: 0 }, { pageSize: 101 }, { from: '2027-02-29' }, { from: '2027-02-01', to: '2027-01-01' }]) {
    const response = await admin.agent.get('/api/trainings').query(query).expect(422);
    assert.equal(typeof response.body.error.message, 'string');
  }
});

test('HU-04: actualización y auditoría persisten al cerrar y reabrir SQLite y la aplicación', async () => {
  const base = resolve('.verification');
  mkdirSync(base, { recursive: true });
  const directory = mkdtempSync(join(base, 'paz-sur-training-edit-'));
  const path = join(directory, 'isolated.sqlite');
  let db;
  try {
    db = createDatabase(path);
    await seedDemo(db, demoPassword);
    let app = createApp({ db, rateLimitEnabled: false });
    let session = await login(app);
    const input = trainingInput({ code: 'EDICION-PERSISTENTE' });
    const original = (await session.agent.post('/api/trainings').set('X-CSRF-Token', session.csrf).send(input).expect(201)).body.data;
    const edited = await session.agent.put(`/api/trainings/${original.id}`).set('X-CSRF-Token', session.csrf).send({ ...input, title: 'Título que sobrevive al reinicio', capacity: 3, status: 'programada' }).expect(200);
    db.close();
    db = undefined;
    db = createDatabase(path);
    app = createApp({ db, rateLimitEnabled: false });
    session = await login(app);
    const result = await session.agent.get(`/api/trainings/${original.id}`).expect(200);
    assert.deepEqual(result.body.data, edited.body.data);
    const history = db.prepare("SELECT action FROM audit_log WHERE entity='training' AND entity_id=? ORDER BY id").all(original.id);
    assert.deepEqual(history.map(row => row.action), ['create', 'update']);
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  } finally {
    db?.close();
    if (dirname(resolve(directory)) !== base) throw new Error('La base de prueba debe permanecer dentro de .verification.');
    rmSync(directory, { recursive: true, force: true });
  }
});
