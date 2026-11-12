import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { createDatabase, transaction } from '../server/db.js';
import { seedDemo } from '../server/seed.js';
import { createTraining } from '../server/services/training-service.js';
import { hydrateUser } from '../server/security.js';
import { demoPassword, trainingInput } from './helpers.js';

test('Persistencia real: migraciones/seed idempotentes y datos conservados al reabrir SQLite', async () => {
  // Base propia temporal; nunca apunta a DATABASE_PATH ni a datos del usuario.
  const base = resolve('.verification');
  mkdirSync(base, { recursive: true });
  const directory = mkdtempSync(join(base, 'paz-sur-test-'));
  const path = join(directory, 'isolated.sqlite');
  let db;
  try {
    db = createDatabase(path);
    await seedDemo(db, demoPassword);
    await seedDemo(db, demoPassword);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM users').get().n, 4);
    const admin = hydrateUser(db, 1);
    const training = createTraining(db, trainingInput({ code: 'PERSISTENTE' }), admin);
    db.close();
    db = createDatabase(path);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM schema_migrations').get().n, 1);
    assert.equal(db.prepare('SELECT title FROM trainings WHERE id=?').get(training.id).title, training.title);
    assert.equal(db.prepare('PRAGMA foreign_keys').get().foreign_keys, 1);
    assert.throws(() => db.prepare('UPDATE trainings SET capacity=0 WHERE id=?').run(training.id), /CHECK constraint/);
  } finally {
    db?.close();
    if (dirname(resolve(directory)) !== base) throw new Error('La base temporal debe permanecer dentro de .verification.');
    rmSync(directory, { recursive: true, force: true });
  }
});

test('Integridad: rollback revierte toda operación y las restricciones SQL protegen referencias', () => {
  const db = createDatabase(':memory:');
  try {
    assert.throws(() => transaction(db, () => {
      db.prepare("INSERT INTO roles (code,name) VALUES ('prueba','Prueba')").run();
      throw new Error('fallo deliberado');
    }), /fallo deliberado/);
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM roles WHERE code='prueba'").get().n, 0);
    assert.throws(() => db.prepare('INSERT INTO user_roles (user_id,role_id) VALUES (9999,1)').run(), /FOREIGN KEY/);
  } finally { db.close(); }
});

test('Migraciones incrementales: una segunda migración conserva roles y permisos personalizados', () => {
  const base = resolve('.verification');
  mkdirSync(base, { recursive: true });
  const directory = mkdtempSync(join(base, 'paz-sur-migrations-'));
  const migrationsDirectory = join(directory, 'migrations');
  mkdirSync(migrationsDirectory);
  writeFileSync(join(migrationsDirectory, '001_initial.sql'), readFileSync(new URL('../server/migrations/001_initial.sql', import.meta.url)));
  const path = join(directory, 'migration.sqlite');
  let db;
  try {
    db = createDatabase(path, { migrationsDirectory });
    db.prepare("UPDATE roles SET name='Coordinación personalizada' WHERE code='coordinador'").run();
    db.close();
    db = undefined;
    writeFileSync(join(migrationsDirectory, '002_probe.sql'), 'CREATE TABLE migration_probe (id INTEGER PRIMARY KEY) STRICT;');
    db = createDatabase(path, { migrationsDirectory });
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM schema_migrations').get().n, 2);
    assert.equal(db.prepare("SELECT name FROM roles WHERE code='coordinador'").get().name, 'Coordinación personalizada');
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM permissions').get().n, 10);
  } finally {
    db?.close();
    if (dirname(resolve(directory)) !== base) throw new Error('Directorio temporal fuera del workspace.');
    rmSync(directory, { recursive: true, force: true });
  }
});
