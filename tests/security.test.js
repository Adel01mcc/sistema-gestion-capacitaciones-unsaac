import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../server/app.js';
import { fixture, login, demoPassword, trainingInput, userInput } from './helpers.js';

let context;
let admin;
before(async () => { context = await fixture(); admin = await login(context.app); });
after(() => context?.close());

test('HU-16: cookie HttpOnly SameSite y token opaco se guarda con hash', () => {
  const cookie = admin.response.headers['set-cookie'][0];
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  const raw = /sgc_session=([a-f0-9]+)/.exec(cookie)[1];
  const row = context.db.prepare('SELECT token_hash FROM sessions_auth WHERE user_id=?').get(admin.user.id);
  assert.notEqual(row.token_hash, raw);
});

test('HU-16: requiere sesión y devuelve mensaje genérico para credenciales inválidas', async () => {
  await request(context.app).get('/api/users').expect(401);
  await request(context.app).get('/api/trainings').expect(401);
  const bad = await request(context.app).post('/api/auth/login').send({ email: 'admin@demo.test', password: 'incorrecta' }).expect(401);
  const absent = await request(context.app).post('/api/auth/login').send({ email: 'ausente@demo.test', password: 'incorrecta' }).expect(401);
  assert.equal(bad.body.error.message, absent.body.error.message);
});

test('CSRF: rechaza token ausente, ajeno y Unicode; no modifica la base', async () => {
  for (const token of [null, '0'.repeat(64), 'é'.repeat(64)]) {
    let call = admin.agent.post('/api/trainings');
    if (token) call = call.set('X-CSRF-Token', token);
    await call.send(trainingInput({ code: 'CSRF' })).expect(403);
  }
  assert.equal(context.db.prepare("SELECT COUNT(*) AS n FROM trainings WHERE code='CSRF'").get().n, 0);
});

test('Entrada HTTP: rechaza formularios, JSON mal formado, payload excesivo e inyección de filtros', async () => {
  await request(context.app).post('/api/auth/login').type('form').send({ email: 'admin@demo.test', password: demoPassword }).expect(415);
  await request(context.app).post('/api/auth/login').set('Content-Type', 'application/json').send('{invalido').expect(400);
  await request(context.app).post('/api/auth/login').send({ data: 'x'.repeat(70000) }).expect(413);
  const response = await admin.agent.get('/api/users').query({ search: "' OR 1=1 --" }).expect(200);
  assert.equal(response.body.meta.total, 0);
});

test('HU-02: coordinador puede administrar capacitaciones y no usuarios ni roles', async () => {
  const coordinator = await login(context.app, 'coordinacion@demo.test');
  await coordinator.agent.post('/api/trainings').set('X-CSRF-Token', coordinator.csrf).send(trainingInput({ code: 'COORD' })).expect(201);
  await coordinator.agent.get('/api/users').expect(403);
  await coordinator.agent.get('/api/roles').expect(403);
  await coordinator.agent.post('/api/users').set('X-CSRF-Token', coordinator.csrf).send(userInput()).expect(403);
  const selection = await coordinator.agent.get('/api/users?role=instructor').expect(200);
  assert.equal(selection.body.data.length, 1);
  assert.equal(selection.body.data[0].email, undefined);
  assert.equal(selection.body.data[0].permissions, undefined);
});

test('Alcance: instructor sólo ve asignadas y participante no obtiene datos ajenos', async () => {
  const instructor = await login(context.app, 'instructor@demo.test');
  const participant = await login(context.app, 'participante@demo.test');
  const instructorTrainings = await instructor.agent.get('/api/trainings').expect(200);
  assert.equal(instructorTrainings.body.meta.total, 2);
  const unrelated = context.db.prepare("SELECT id FROM trainings WHERE code='COORD'").get().id;
  await instructor.agent.get(`/api/trainings/${unrelated}`).expect(404);
  const rows = await participant.agent.get('/api/trainings').expect(200);
  assert.equal(rows.body.meta.total, 0);
  const trainingId = instructorTrainings.body.data[0].id;
  await participant.agent.get(`/api/trainings/${trainingId}`).expect(404);
  await instructor.agent.post('/api/trainings').set('X-CSRF-Token', instructor.csrf).send(trainingInput()).expect(403);
});

test('HU-02: cambios de permisos se aplican a sesiones existentes y administrador está protegido', async () => {
  const coordinator = await login(context.app, 'coordinacion@demo.test');
  const roles = (await admin.agent.get('/api/roles').expect(200)).body.data;
  const role = roles.find(row => row.code === 'coordinador');
  const protectedRole = roles.find(row => row.code === 'administrador');
  await admin.agent.put(`/api/roles/${protectedRole.id}`).set('X-CSRF-Token', admin.csrf).send({ name: 'Administrador', permissions: [] }).expect(409);
  await admin.agent.put(`/api/roles/${role.id}`).set('X-CSRF-Token', admin.csrf).send({ name: role.name, permissions: ['trainings.view_all'] }).expect(200);
  await coordinator.agent.post('/api/trainings').set('X-CSRF-Token', coordinator.csrf).send(trainingInput({ code: 'REVOKED' })).expect(403);
  await admin.agent.put(`/api/roles/${role.id}`).set('X-CSRF-Token', admin.csrf).send({ name: role.name, permissions: role.permissions }).expect(200);
  await admin.agent.put(`/api/roles/${role.id}`).set('X-CSRF-Token', admin.csrf).send({ name: role.name, permissions: ['inventado'] }).expect(422);
});

test('HU-02: users.manage delegado no permite elevar roles ni editar cuentas privilegiadas', async () => {
  const coordinator = await login(context.app, 'coordinacion@demo.test');
  const role = (await admin.agent.get('/api/roles').expect(200)).body.data.find(row => row.code === 'coordinador');
  await admin.agent.put(`/api/roles/${role.id}`).set('X-CSRF-Token', admin.csrf).send({ name: role.name, permissions: [...role.permissions, 'users.manage'] }).expect(200);
  try {
    await coordinator.agent.put(`/api/users/${coordinator.user.id}/roles`).set('X-CSRF-Token', coordinator.csrf).send({ roles: ['administrador'] }).expect(403);
    await coordinator.agent.post('/api/users').set('X-CSRF-Token', coordinator.csrf).send(userInput({ email: 'escalada@demo.test', document: null, roles: ['administrador'] })).expect(403);
    const payload = userInput({ first_name: admin.user.first_name, last_name: admin.user.last_name, email: admin.user.email, document: null });
    delete payload.roles;
    await coordinator.agent.put(`/api/users/${admin.user.id}`).set('X-CSRF-Token', coordinator.csrf).send(payload).expect(403);
    await coordinator.agent.post('/api/users').set('X-CSRF-Token', coordinator.csrf).send(userInput({ email: 'delegado@demo.test', document: null })).expect(201);
  } finally {
    await admin.agent.put(`/api/roles/${role.id}`).set('X-CSRF-Token', admin.csrf).send({ name: role.name, permissions: role.permissions }).expect(200);
  }
});

test('HU-02: la protección de altas delegadas respeta los permisos actuales del rol participante', async () => {
  const coordinator = await login(context.app, 'coordinacion@demo.test');
  const roles = (await admin.agent.get('/api/roles').expect(200)).body.data;
  const coordinatorRole = roles.find(row => row.code === 'coordinador');
  const participantRole = roles.find(row => row.code === 'participante');
  await admin.agent.put(`/api/roles/${coordinatorRole.id}`).set('X-CSRF-Token', admin.csrf).send({ name: coordinatorRole.name, permissions: [...coordinatorRole.permissions, 'users.manage'] }).expect(200);
  await admin.agent.put(`/api/roles/${participantRole.id}`).set('X-CSRF-Token', admin.csrf).send({ name: participantRole.name, permissions: ['learning.view', 'roles.manage'] }).expect(200);
  try {
    await coordinator.agent.post('/api/users').set('X-CSRF-Token', coordinator.csrf).send(userInput({ email: 'privilegio-indirecto@demo.test', document: null })).expect(403);
  } finally {
    await admin.agent.put(`/api/roles/${participantRole.id}`).set('X-CSRF-Token', admin.csrf).send({ name: participantRole.name, permissions: participantRole.permissions }).expect(200);
    await admin.agent.put(`/api/roles/${coordinatorRole.id}`).set('X-CSRF-Token', admin.csrf).send({ name: coordinatorRole.name, permissions: coordinatorRole.permissions }).expect(200);
  }
});

test('HU-16: cambio de contraseña y desactivación invalidan sesiones', async () => {
  const created = (await admin.agent.post('/api/users').set('X-CSRF-Token', admin.csrf).send(userInput({ email: 'revocable@demo.test', document: null })).expect(201)).body.data;
  const session = await login(context.app, created.email);
  await admin.agent.put(`/api/users/${created.id}`).set('X-CSRF-Token', admin.csrf).send(userInput({ email: created.email, document: null, password: 'Nueva-ficticia-2026!' })).expect(200);
  await session.agent.get('/api/auth/me').expect(401);
  const nextSession = await login(context.app, created.email, 'Nueva-ficticia-2026!');
  const profile = userInput({ email: created.email, document: null, active: false });
  delete profile.password;
  await admin.agent.put(`/api/users/${created.id}`).set('X-CSRF-Token', admin.csrf).send(profile).expect(200);
  await nextSession.agent.get('/api/auth/me').expect(401);
  await request(context.app).post('/api/auth/login').send({ email: created.email, password: 'Nueva-ficticia-2026!' }).expect(401);
});

test('HU-16: logout y vencimiento eliminan acceso', async () => {
  const session = await login(context.app, 'participante@demo.test');
  await session.agent.post('/api/auth/logout').set('X-CSRF-Token', session.csrf).send({}).expect(200);
  await session.agent.get('/api/auth/me').expect(401);
  const expired = await login(context.app, 'participante@demo.test');
  context.db.prepare('UPDATE sessions_auth SET expires_at=? WHERE user_id=?').run('2000-01-01T00:00:00.000Z', expired.user.id);
  await expired.agent.get('/api/auth/me').expect(401);
});

test('HU-16: once intentos por IP se limitan; cookie Secure configurable', async () => {
  const limitedApp = createApp({ db: context.db, rateLimitEnabled: true });
  for (let i = 0; i < 10; i++) await request(limitedApp).post('/api/auth/login').send({ email: 'admin@demo.test', password: 'incorrecta' }).expect(401);
  const limited = await request(limitedApp).post('/api/auth/login').send({ email: 'admin@demo.test', password: demoPassword }).expect(429);
  assert.ok(Number(limited.headers['retry-after']) > 0);
  const secureApp = createApp({ db: context.db, secureCookies: true, rateLimitEnabled: false });
  const secure = await request(secureApp).post('/api/auth/login').send({ email: 'admin@demo.test', password: demoPassword }).expect(200);
  assert.match(secure.headers['set-cookie'][0], /; Secure/);
});

test('HU-16: un login correcto no reinicia el límite de intentos por IP', async () => {
  const app = createApp({ db: context.db, rateLimitEnabled: true });
  for (let i = 0; i < 8; i++) await request(app).post('/api/auth/login').send({ email: 'admin@demo.test', password: 'incorrecta' }).expect(401);
  await request(app).post('/api/auth/login').send({ email: 'participante@demo.test', password: demoPassword }).expect(200);
  await request(app).post('/api/auth/login').send({ email: 'admin@demo.test', password: 'incorrecta' }).expect(401);
  await request(app).post('/api/auth/login').send({ email: 'admin@demo.test', password: demoPassword }).expect(429);
});
