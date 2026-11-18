import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { mkdirSync, mkdtempSync, copyFileSync, rmSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { createDatabase } from '../server/db.js';
import { createApp } from '../server/app.js';
import { seedDemo } from '../server/seed.js';
import { createObserver } from '../server/events/observer.js';
import { createNotificationModule } from '../server/notifications/composition.js';
import { fixture, login, trainingInput, demoPassword } from './helpers.js';

const save = (admin, input) => admin.agent.post('/api/trainings').set('X-CSRF-Token', admin.csrf).send(input);
const edit = (admin, id, input) => admin.agent.put(`/api/trainings/${id}`).set('X-CSRF-Token', admin.csrf).send(input);
const eventCount = db => db.prepare('SELECT COUNT(*) AS n FROM training_events').get().n;

test('Fran/Observer: suscribe por tipo, publica a varios y permite desuscribirse', () => {
  const observer = createObserver();
  const received = [];
  const unsubscribe = observer.subscribe('training.scheduled', event => { received.push(`a:${event.id}`); });
  observer.subscribe('training.scheduled', event => { received.push(`b:${event.id}`); });
  observer.publish({ type: 'training.updated', id: 'ignorado' });
  observer.publish({ type: 'training.scheduled', id: '1' });
  unsubscribe();
  observer.publish({ type: 'training.scheduled', id: '2' });
  assert.deepEqual(received, ['a:1', 'b:1', 'b:2']);
});

test('Fran/eventos: planificar no avisa; programar crea un evento y avisos sólo para gestores e instructor', async () => {
  const context = await fixture();
  try {
    const admin = await login(context.app);
    const input = trainingInput({ instructor_id: 3 });
    const training = (await save(admin, input).expect(201)).body.data;
    assert.equal(eventCount(context.db), 0); // La semilla no produce avisos históricos.
    await edit(admin, training.id, { ...input, status: 'programada' }).expect(200);
    const events = context.db.prepare('SELECT * FROM training_events').all();
    assert.equal(events.length, 1);
    assert.equal(events[0].type, 'training.scheduled');
    assert.ok(events[0].processed_at);
    assert.equal(events[0].attempts, 1);
    const recipients = context.db.prepare('SELECT user_id FROM notifications WHERE training_id=? ORDER BY user_id').all(training.id).map(row => row.user_id);
    assert.deepEqual(recipients, [1, 2, 3]);
    assert.equal(JSON.stringify(events).includes('password'), false);
  } finally { context.close(); }
});

test('Fran/eventos: alta programada avisa; modificación real avisa; PUT idéntico no duplica', async () => {
  const context = await fixture();
  try {
    const admin = await login(context.app);
    const input = trainingInput({ status: 'programada' });
    const training = (await save(admin, input).expect(201)).body.data;
    await edit(admin, training.id, input).expect(200);
    assert.equal(eventCount(context.db), 1);
    await edit(admin, training.id, { ...input, location: 'Otra sala ficticia' }).expect(200);
    assert.equal(eventCount(context.db), 2);
    assert.equal(context.db.prepare("SELECT COUNT(*) AS n FROM training_events WHERE type='training.updated'").get().n, 1);
  } finally { context.close(); }
});

test('Fran/eventos: validación, duplicado y fallo de auditoría no generan eventos ni avisos', async () => {
  const context = await fixture();
  try {
    const admin = await login(context.app);
    await save(admin, trainingInput({ capacity: 0, status: 'programada' })).expect(422);
    await save(admin, trainingInput({ code: 'DEMO-001', status: 'programada' })).expect(409);
    context.db.exec("CREATE TRIGGER fail_training_audit BEFORE INSERT ON audit_log WHEN NEW.entity='training' BEGIN SELECT RAISE(ABORT,'fallo de prueba'); END");
    const original = console.error; console.error = () => {};
    try { await save(admin, trainingInput({ code: 'ROLLBACK', status: 'programada' })).expect(500); }
    finally { console.error = original; }
    assert.equal(eventCount(context.db), 0);
    assert.equal(context.db.prepare('SELECT COUNT(*) AS n FROM notifications').get().n, 0);
    assert.equal(context.db.prepare("SELECT COUNT(*) AS n FROM trainings WHERE code='ROLLBACK'").get().n, 0);
  } finally { context.close(); }
});

test('Fran/outbox: si no se puede registrar el evento se revierte también la capacitación y auditoría', async () => {
  const context = await fixture();
  try {
    const admin = await login(context.app);
    const auditBefore = context.db.prepare('SELECT COUNT(*) AS n FROM audit_log').get().n;
    context.db.exec("CREATE TRIGGER fail_event BEFORE INSERT ON training_events BEGIN SELECT RAISE(ABORT,'fallo de evento'); END");
    const original = console.error; console.error = () => {};
    try { await save(admin, trainingInput({ status: 'programada' })).expect(500); }
    finally { console.error = original; }
    assert.equal(context.db.prepare('SELECT COUNT(*) AS n FROM trainings').get().n, 2);
    assert.equal(context.db.prepare('SELECT COUNT(*) AS n FROM audit_log').get().n, auditBefore);
    assert.equal(eventCount(context.db), 0);
  } finally { context.close(); }
});

test('Fran/outbox: un observador falla después del commit; reintento atómico e idempotente sin perder la capacitación', async () => {
  let fail = true;
  const failures = [];
  const context = await fixture({ notificationOptions: { observers: [() => { if (fail) throw new Error('fallo ficticio'); }], reportFailure: id => failures.push(id) } });
  try {
    const admin = await login(context.app);
    const training = (await save(admin, trainingInput({ status: 'programada', instructor_id: 3 })).expect(201)).body.data;
    assert.ok(context.db.prepare('SELECT id FROM trainings WHERE id=?').get(training.id));
    assert.equal(failures.length, 1);
    assert.equal(context.db.prepare('SELECT COUNT(*) AS n FROM notifications').get().n, 0); // Se revierten avisos parciales.
    const pending = context.db.prepare('SELECT * FROM training_events').get();
    assert.equal(pending.processed_at, null);
    assert.equal(pending.attempts, 1);
    fail = false;
    const retry = await admin.agent.post('/api/notifications/retry').set('X-CSRF-Token', admin.csrf).send({}).expect(200);
    assert.deepEqual(retry.body.data, { processed: 1, pending: 0 });
    assert.equal(context.db.prepare('SELECT COUNT(*) AS n FROM notifications').get().n, 3);
    await admin.agent.post('/api/notifications/retry').set('X-CSRF-Token', admin.csrf).send({}).expect(200);
    assert.equal(context.db.prepare('SELECT COUNT(*) AS n FROM notifications').get().n, 3);
    assert.equal(context.db.prepare('SELECT attempts FROM training_events').get().attempts, 2);
  } finally { context.close(); }
});

test('Fran/avisos: sesión, CSRF, paginación y propiedad protegen lectura y marcado', async () => {
  const context = await fixture();
  try {
    const admin = await login(context.app);
    const participant = await login(context.app, 'participante@demo.test');
    await save(admin, trainingInput({ status: 'programada' })).expect(201);
    await request(context.app).get('/api/notifications').expect(401);
    await admin.agent.get('/api/notifications?pageSize=101').expect(422);
    const rows = (await admin.agent.get('/api/notifications?pageSize=1').expect(200)).body;
    assert.equal(rows.meta.total, 1);
    const id = rows.data[0].id;
    assert.equal((await participant.agent.get('/api/notifications').expect(200)).body.meta.total, 0);
    await participant.agent.patch(`/api/notifications/${id}/read`).set('X-CSRF-Token', participant.csrf).send({}).expect(404);
    await admin.agent.patch(`/api/notifications/${id}/read`).send({}).expect(403);
    await admin.agent.patch('/api/notifications/0/read').set('X-CSRF-Token', admin.csrf).send({}).expect(422);
    await admin.agent.patch(`/api/notifications/${id}/read`).set('X-CSRF-Token', admin.csrf).send({}).expect(200);
    const firstRead = context.db.prepare('SELECT read_at FROM notifications WHERE id=?').get(id).read_at;
    await admin.agent.patch(`/api/notifications/${id}/read`).set('X-CSRF-Token', admin.csrf).send({}).expect(200);
    assert.equal(context.db.prepare('SELECT read_at FROM notifications WHERE id=?').get(id).read_at, firstRead);
    await participant.agent.post('/api/notifications/retry').set('X-CSRF-Token', participant.csrf).send({}).expect(403);
  } finally { context.close(); }
});

test('Fran/avisos: una reasignación o revocación elimina acceso a los avisos anteriores', async () => {
  const context = await fixture();
  try {
    const admin = await login(context.app);
    const instructor = await login(context.app, 'instructor@demo.test');
    const input = trainingInput({ status: 'programada', instructor_id: 3 });
    const training = (await save(admin, input).expect(201)).body.data;
    const notice = (await instructor.agent.get('/api/notifications').expect(200)).body.data[0];
    await edit(admin, training.id, { ...input, instructor_id: null }).expect(200);
    assert.equal((await instructor.agent.get('/api/notifications').expect(200)).body.meta.total, 0);
    await instructor.agent.patch(`/api/notifications/${notice.id}/read`).set('X-CSRF-Token', instructor.csrf).send({}).expect(404);
    context.db.prepare("DELETE FROM role_permissions WHERE role_id=(SELECT id FROM roles WHERE code='coordinador') AND permission_code IN ('trainings.manage','trainings.view_all')").run();
    const coordinator = await login(context.app, 'coordinacion@demo.test');
    assert.equal((await coordinator.agent.get('/api/notifications').expect(200)).body.meta.total, 0);
  } finally { context.close(); }
});

test('Fran/migración: 003 conserva datos y permisos; evento pendiente sobrevive al reinicio y se procesa una sola vez', async () => {
  const base = resolve('.verification'); mkdirSync(base, { recursive: true });
  const directory = mkdtempSync(join(base, 'fran-events-'));
  const migrations = join(directory, 'migrations'); mkdirSync(migrations);
  let db;
  try {
    for (const name of ['001_initial.sql', '002_training_dates.sql']) copyFileSync(new URL(`../server/migrations/${name}`, import.meta.url), join(migrations, name));
    const path = join(directory, 'ficticia.sqlite');
    db = createDatabase(path, { migrationsDirectory: migrations });
    await seedDemo(db, demoPassword);
    db.prepare("UPDATE roles SET name='Coordinación personalizada' WHERE code='coordinador'").run();
    const usersBefore = db.prepare('SELECT * FROM users ORDER BY id').all();
    const rolesBefore = db.prepare('SELECT * FROM roles ORDER BY id').all();
    const trainingsBefore = db.prepare('SELECT * FROM trainings ORDER BY id').all();
    db.close();
    copyFileSync(new URL('../server/migrations/003_notifications.sql', import.meta.url), join(migrations, '003_notifications.sql'));
    db = createDatabase(path, { migrationsDirectory: migrations });
    assert.deepEqual(db.prepare('SELECT * FROM users ORDER BY id').all(), usersBefore);
    assert.deepEqual(db.prepare('SELECT * FROM roles ORDER BY id').all(), rolesBefore);
    assert.deepEqual(db.prepare('SELECT * FROM trainings ORDER BY id').all(), trainingsBefore);
    const app = createApp({ db, rateLimitEnabled: false, notificationOptions: { observers: [() => { throw new Error('falla ficticia'); }], reportFailure() {} } });
    const admin = await login(app);
    await save(admin, trainingInput({ status: 'programada' })).expect(201);
    db.close(); db = createDatabase(path, { migrationsDirectory: migrations });
    const module = createNotificationModule(db);
    assert.deepEqual(module.events.retryPending(), { processed: 1, pending: 0 });
    assert.deepEqual(module.events.retryPending(), { processed: 0, pending: 0 });
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM notifications').get().n, 2);
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  } finally {
    db?.close();
    if (dirname(resolve(directory)) !== base) throw new Error('Ruta temporal fuera de .verification.');
    rmSync(directory, { recursive: true, force: true });
  }
});
