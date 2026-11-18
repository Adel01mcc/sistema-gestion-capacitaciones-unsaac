import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createDatabase, transaction } from '../server/db.js';

const migration = '002_training_dates.sql';
const triggerNames = ['trainings_validate_dates_insert', 'trainings_validate_dates_update'];
const reverseMigration = `DROP TRIGGER trainings_validate_dates_insert;
DROP TRIGGER trainings_validate_dates_update;
DELETE FROM schema_migrations WHERE version='002_training_dates.sql';`;
const input = { code: 'CAL-001', title: 'Capacitación ficticia', start_date: '2027-01-20', end_date: '2027-01-20', start_time: '09:00', end_time: '11:00', modality: 'presencial', location: 'Sala ficticia', capacity: 10, status: 'planificada', instructor_id: 1, responsible_id: 1, created_at: '2026-11-17T12:00:00.000Z', updated_at: '2026-11-17T12:00:00.000Z' };

function insertTraining(db, overrides = {}) {
  const value = { ...input, ...overrides };
  const keys = Object.keys(value);
  return db.prepare(`INSERT INTO trainings (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`).run(...Object.values(value));
}

function legacyFixture(t) {
  const base = resolve('.verification');
  mkdirSync(base, { recursive: true });
  const directory = mkdtempSync(join(base, 'training-migration-'));
  const migrationsDirectory = join(directory, 'migrations');
  mkdirSync(migrationsDirectory);
  writeFileSync(join(migrationsDirectory, '001_initial.sql'), readFileSync(new URL('../server/migrations/001_initial.sql', import.meta.url)));
  const context = { path: join(directory, 'isolated.sqlite'), migrationsDirectory, db: undefined };
  t.after(() => {
    context.db?.close();
    if (dirname(resolve(directory)) !== base) throw new Error('Directorio temporal fuera de .verification.');
    rmSync(directory, { recursive: true, force: true });
  });
  context.db = createDatabase(context.path, { migrationsDirectory });
  context.db.prepare('INSERT INTO users (first_name,last_name,email,password_hash,created_at,updated_at) VALUES (?,?,?,?,?,?)')
    .run('Persona', 'Ficticia', 'calendar@demo.test', 'fixture-no-login', input.created_at, input.updated_at);
  context.installMigration = () => writeFileSync(join(migrationsDirectory, migration), readFileSync(new URL(`../server/migrations/${migration}`, import.meta.url)));
  context.reopen = () => {
    context.db?.close();
    context.db = undefined;
    context.db = createDatabase(context.path, { migrationsDirectory });
  };
  return context;
}

function triggers(db) {
  return db.prepare("SELECT name FROM sqlite_schema WHERE type='trigger' AND name LIKE 'trainings_validate_dates_%' ORDER BY name").all().map(row => row.name);
}

test('HU-03/HU-04: migrar desde 001 conserva registros, auditoría, permisos personalizados y FK; reapertura idempotente', t => {
  const context = legacyFixture(t);
  const db = context.db;
  const id = Number(insertTraining(db).lastInsertRowid);
  db.prepare("INSERT INTO audit_log (user_id,action,entity,entity_id,created_at) VALUES (1,'create','training',?,?)").run(id, input.created_at);
  db.prepare("UPDATE roles SET name='Coordinación personalizada' WHERE code='coordinador'").run();
  db.prepare("DELETE FROM role_permissions WHERE role_id=(SELECT id FROM roles WHERE code='coordinador') AND permission_code='certificates.manage'").run();
  const before = db.prepare('SELECT * FROM trainings WHERE id=?').get(id);
  const auditBefore = db.prepare('SELECT * FROM audit_log').all();
  const permissionsBefore = db.prepare('SELECT * FROM role_permissions ORDER BY role_id,permission_code').all();
  context.installMigration();
  context.reopen();
  context.reopen();
  assert.deepEqual(context.db.prepare('SELECT * FROM trainings WHERE id=?').get(id), before);
  assert.deepEqual(context.db.prepare('SELECT * FROM audit_log').all(), auditBefore);
  assert.deepEqual(context.db.prepare('SELECT * FROM role_permissions ORDER BY role_id,permission_code').all(), permissionsBefore);
  assert.equal(context.db.prepare("SELECT name FROM roles WHERE code='coordinador'").get().name, 'Coordinación personalizada');
  assert.equal(context.db.prepare('SELECT COUNT(*) AS n FROM schema_migrations WHERE version=?').get(migration).n, 1);
  assert.equal(context.db.prepare('PRAGMA foreign_keys').get().foreign_keys, 1);
  assert.deepEqual(context.db.prepare('PRAGMA foreign_key_check').all(), []);
  assert.deepEqual(triggers(context.db), triggerNames);
  assert.throws(() => context.db.prepare('UPDATE trainings SET responsible_id=999999 WHERE id=?').run(id), /FOREIGN KEY/);
});

test('HU-03/HU-04: SQL rechaza INSERT y UPDATE de fechas/horas inválidas sin alterar registros', t => {
  const context = legacyFixture(t);
  context.installMigration();
  context.reopen();
  const db = context.db;
  const id = Number(insertTraining(db).lastInsertRowid);
  const before = db.prepare('SELECT * FROM trainings WHERE id=?').get(id);
  const invalid = [
    { start_date: '2027-02-30', end_date: '2027-03-01' },
    { end_date: '2027-02-30' },
    { start_date: '2023-02-29', end_date: '2023-03-01' },
    { start_date: '2027-1-01', end_date: '2027-1-01' },
    { start_date: '2027-13-01', end_date: '2027-13-01' },
    { start_date: '2027-01-01T00:00:00Z', end_date: '2027-01-02' },
    { start_date: null }, { end_date: null },
    { start_time: '25:00', end_time: '26:00' },
    { start_time: '09:60' }, { start_time: '9:00' },
    { end_time: '24:00' }, { end_time: '11:00:00' },
    { start_time: null }, { end_time: null },
  ];
  for (const [index, overrides] of invalid.entries()) {
    assert.throws(() => insertTraining(db, { code: `INVALID-${index}`, ...overrides }), /fecha YYYY-MM-DD u hora HH:mm invalida/);
    const keys = Object.keys(overrides);
    assert.throws(() => db.prepare(`UPDATE trainings SET ${keys.map(key => `${key}=?`).join(',')} WHERE id=?`).run(...Object.values(overrides), id), /fecha YYYY-MM-DD u hora HH:mm invalida/);
    assert.deepEqual(db.prepare('SELECT * FROM trainings WHERE id=?').get(id), before);
  }
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM trainings').get().n, 1);
  for (const date of ['0000-02-29', '2024-02-29', '9999-12-31']) {
    insertTraining(db, { code: `VALID-${date}`, start_date: date, end_date: date, start_time: '00:00', end_time: '23:59' });
  }
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM trainings').get().n, 4);
});

for (const [label, overrides] of [
  ['fecha imposible', { start_date: '2027-02-30', end_date: '2027-03-01' }],
  ['hora inválida', { start_time: '25:00', end_time: '26:00' }],
]) {
  test(`HU-03/HU-04: histórico con ${label} aborta migración completa y conserva datos`, t => {
    const context = legacyFixture(t);
    insertTraining(context.db, overrides);
    const before = context.db.prepare('SELECT * FROM trainings').all();
    context.installMigration();
    assert.throws(() => context.reopen(), /training_dates_valid/);
    // Abrir sólo con 001 demuestra que el fallo no borró datos ni registró 002.
    context.db = new DatabaseSync(context.path);
    assert.deepEqual(context.db.prepare('SELECT * FROM trainings').all(), before);
    assert.equal(context.db.prepare('SELECT COUNT(*) AS n FROM schema_migrations WHERE version=?').get(migration).n, 0);
    assert.equal(context.db.prepare('SELECT COUNT(*) AS n FROM schema_migrations').get().n, 1);
    assert.deepEqual(triggers(context.db), []);
  });
}

test('HU-03/HU-04: reversión transaccional de 002 conserva datos y permite reaplicar la migración', t => {
  const context = legacyFixture(t);
  const id = Number(insertTraining(context.db).lastInsertRowid);
  const before = context.db.prepare('SELECT * FROM trainings WHERE id=?').get(id);
  context.installMigration();
  context.reopen();
  assert.throws(() => transaction(context.db, () => {
    context.db.exec(reverseMigration);
    throw new Error('fallo deliberado de reversión');
  }), /fallo deliberado/);
  assert.deepEqual(triggers(context.db), triggerNames);
  assert.equal(context.db.prepare('SELECT COUNT(*) AS n FROM schema_migrations WHERE version=?').get(migration).n, 1);
  transaction(context.db, () => context.db.exec(reverseMigration));
  assert.deepEqual(triggers(context.db), []);
  assert.equal(context.db.prepare('SELECT COUNT(*) AS n FROM schema_migrations WHERE version=?').get(migration).n, 0);
  assert.deepEqual(context.db.prepare('SELECT * FROM trainings WHERE id=?').get(id), before);
  context.reopen();
  assert.deepEqual(triggers(context.db), triggerNames);
  assert.deepEqual(context.db.prepare('SELECT * FROM trainings WHERE id=?').get(id), before);
});
