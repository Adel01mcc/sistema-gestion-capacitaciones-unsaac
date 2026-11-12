import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { fixture, login, trainingInput, userInput } from './helpers.js';
import { createTraining, dashboard } from '../server/services/training-service.js';

let context;
let admin;
before(async () => { context = await fixture(); admin = await login(context.app); });
after(() => context?.close());

test('HU-16: health comprueba conexión y autenticación restaura sesión sin exponer hash', async () => {
  const health = await request(context.app).get('/api/health').expect(200);
  assert.equal(health.body.data.database, 'sqlite');
  const me = await admin.agent.get('/api/auth/me').expect(200);
  assert.equal(me.body.data.user.email, 'admin@demo.test');
  assert.equal(me.body.data.user.password_hash, undefined);
  assert.equal(me.body.data.csrfToken, admin.csrf);
});

test('HU-01: alta persiste perfil, roles y auditoría; correo se normaliza', async () => {
  const result = await admin.agent.post('/api/users').set('X-CSRF-Token', admin.csrf).send(userInput({ email: 'NUEVA@demo.test' })).expect(201);
  const user = result.body.data;
  assert.equal(user.email, 'nueva@demo.test');
  assert.deepEqual(user.roles, ['participante']);
  assert.equal(user.password_hash, undefined);
  assert.match(context.db.prepare('SELECT password_hash FROM users WHERE id=?').get(user.id).password_hash, /^scrypt\$/);
  const saved = await admin.agent.get(`/api/users/${user.id}`).expect(200);
  assert.equal(saved.body.data.document, 'FICTICIO-001');
  assert.equal(context.db.prepare("SELECT COUNT(*) AS n FROM audit_log WHERE entity='user' AND entity_id=? AND action='create'").get(user.id).n, 1);
});

test('HU-01: rechaza correo/documento duplicado sin insertar usuarios ni auditoría', async () => {
  const beforeCount = context.db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  const auditBefore = context.db.prepare('SELECT COUNT(*) AS n FROM audit_log').get().n;
  await admin.agent.post('/api/users').set('X-CSRF-Token', admin.csrf).send(userInput({ email: 'ADMIN@demo.test', document: null })).expect(409);
  await admin.agent.post('/api/users').set('X-CSRF-Token', admin.csrf).send(userInput({ email: 'otra@demo.test' })).expect(409);
  assert.equal(context.db.prepare('SELECT COUNT(*) AS n FROM users').get().n, beforeCount);
  assert.equal(context.db.prepare('SELECT COUNT(*) AS n FROM audit_log').get().n, auditBefore);
});

test('HU-01: valida nombres, correo, clave corta, rol desconocido y campos inesperados', async () => {
  for (const overrides of [{ first_name: '  ' }, { email: 'invalido' }, { password: 'corta' }, { roles: ['superusuario'] }, { roles: ['participante', 'participante'] }, { unknown: 'no permitido' }]) {
    const response = await admin.agent.post('/api/users').set('X-CSRF-Token', admin.csrf).send(userInput(overrides)).expect(422);
    assert.ok(response.body.error.fields);
  }
});

test('HU-01: búsqueda literal, filtro por rol y paginación con límites', async () => {
  await admin.agent.get('/api/users?role=&search=').expect(200);
  const result = await admin.agent.get('/api/users').query({ search: 'Demostración', role: 'instructor', pageSize: 1 }).expect(200);
  assert.equal(result.body.meta.total, 1);
  assert.equal(result.body.data.length, 1);
  const escaped = await admin.agent.get('/api/users').query({ search: '%' }).expect(200);
  assert.equal(escaped.body.meta.total, 0);
  await admin.agent.get('/api/users?page=0').expect(422);
  await admin.agent.get('/api/users?pageSize=101').expect(422);
  await admin.agent.get('/api/users/not-an-id').expect(422);
  await admin.agent.get('/api/users/999999').expect(404);
});

test('HU-01/HU-02: edición actualiza perfil y asignación explícita de múltiples roles', async () => {
  const created = await admin.agent.post('/api/users').set('X-CSRF-Token', admin.csrf).send(userInput({ email: 'edicion@demo.test', document: null })).expect(201);
  const id = created.body.data.id;
  const profile = userInput({ email: 'edicion@demo.test', first_name: 'Nombre editado', document: null });
  delete profile.password;
  const edited = await admin.agent.put(`/api/users/${id}`).set('X-CSRF-Token', admin.csrf).send(profile).expect(200);
  assert.equal(edited.body.data.first_name, 'Nombre editado');
  const roles = await admin.agent.put(`/api/users/${id}/roles`).set('X-CSRF-Token', admin.csrf).send({ roles: ['participante', 'instructor'] }).expect(200);
  assert.deepEqual(roles.body.data.roles, ['instructor', 'participante']);
  await admin.agent.put(`/api/users/${id}/roles`).set('X-CSRF-Token', admin.csrf).send({ roles: [] }).expect(422);
});

test('HU-02: impide retirar el último administrador activo o desactivarlo', async () => {
  await admin.agent.put(`/api/users/${admin.user.id}/roles`).set('X-CSRF-Token', admin.csrf).send({ roles: ['participante'] }).expect(409);
  const input = userInput({ first_name: admin.user.first_name, last_name: admin.user.last_name, email: admin.user.email, document: null, active: false, roles: ['administrador'] });
  delete input.password;
  await admin.agent.put(`/api/users/${admin.user.id}`).set('X-CSRF-Token', admin.csrf).send(input).expect(409);
  assert.equal(context.db.prepare('SELECT active FROM users WHERE id=?').get(admin.user.id).active, 1);
});

test('HU-03/HU-04: crea, consulta y edita capacitación con responsable autenticado', async () => {
  const result = await admin.agent.post('/api/trainings').set('X-CSRF-Token', admin.csrf).send(trainingInput({ responsible_id: 999999 })).expect(201);
  const training = result.body.data;
  assert.equal(training.responsible_id, admin.user.id);
  const read = await admin.agent.get(`/api/trainings/${training.id}`).expect(200);
  assert.equal(read.body.data.available_seats, 10);
  const edited = await admin.agent.put(`/api/trainings/${training.id}`).set('X-CSRF-Token', admin.csrf).send(trainingInput({ title: 'Título editado', capacity: 1, status: 'programada' })).expect(200);
  assert.equal(edited.body.data.title, 'Título editado');
  assert.equal(context.db.prepare('SELECT capacity FROM trainings WHERE id=?').get(training.id).capacity, 1);
});

test('HU-03: rechaza duplicados, cupos inválidos, fechas inexistentes y horarios invertidos', async () => {
  await admin.agent.post('/api/trainings').set('X-CSRF-Token', admin.csrf).send(trainingInput({ code: 'demo-001' })).expect(409);
  for (const overrides of [{ capacity: 0 }, { capacity: 1.5 }, { capacity: 10001 }, { end_date: '2027-01-01' }, { start_date: '2027-02-30', end_date: '2027-03-01' }, { start_time: '25:00' }, { end_time: '08:00' }, { status: 'finalizada' }, { instructor_id: admin.user.id }]) {
    await admin.agent.post('/api/trainings').set('X-CSRF-Token', admin.csrf).send(trainingInput({ code: 'INVALID', ...overrides })).expect(422);
  }
  assert.equal(context.db.prepare("SELECT COUNT(*) AS n FROM trainings WHERE code='INVALID'").get().n, 0);
});

test('HU-04: transiciones válidas y bloqueo terminal sin alterar información', async () => {
  const created = await admin.agent.post('/api/trainings').set('X-CSRF-Token', admin.csrf).send(trainingInput({ code: 'ESTADOS' })).expect(201);
  const id = created.body.data.id;
  const update = status => admin.agent.put(`/api/trainings/${id}`).set('X-CSRF-Token', admin.csrf).send(trainingInput({ code: 'ESTADOS', status }));
  await update('finalizada').expect(409);
  await update('programada').expect(200);
  await update('en_curso').expect(200);
  await update('planificada').expect(409);
  await update('finalizada').expect(200);
  await update('finalizada').expect(409);
  assert.equal(context.db.prepare('SELECT status FROM trainings WHERE id=?').get(id).status, 'finalizada');
});

test('HU-03/HU-04: filtros y dashboard usan datos persistidos', async () => {
  await admin.agent.get('/api/trainings?search=&status=&from=&to=').expect(200);
  const response = await admin.agent.get('/api/trainings').query({ search: 'DEMO', status: 'programada', from: '2026-01-01', to: '2099-01-01' }).expect(200);
  assert.equal(response.body.meta.total, 1);
  await admin.agent.get('/api/trainings?from=2027-01-02&to=2027-01-01').expect(422);
  const dashboard = await admin.agent.get('/api/dashboard').expect(200);
  assert.ok(dashboard.body.data.trainings >= 2);
  assert.equal(dashboard.body.data.roles, 6);
  const config = await admin.agent.get('/api/config').expect(200);
  assert.equal(config.body.data.minAttendance, 80);
});

test('Agenda: después de las 19:00 conserva actividades de hoy en America/Lima', (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date('2027-01-21T02:00:00.000Z') });
  try {
    createTraining(context.db, trainingInput({ code: 'LIMA-HOY', start_date: '2027-01-20', end_date: '2027-01-20' }), admin.user);
    const result = dashboard(context.db, admin.user);
    assert.ok(result.upcoming.some(training => training.code === 'LIMA-HOY'));
  } finally { t.mock.timers.reset(); }
});
