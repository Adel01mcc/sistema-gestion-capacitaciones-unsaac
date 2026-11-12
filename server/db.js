import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PERMISSIONS, ROLES } from './constants.js';

export const now = () => new Date().toISOString();

export function transaction(db, operation) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = operation();
    if (result?.then) throw new Error('Una transacción SQLite requiere una función síncrona.');
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export function createDatabase(path = process.env.DATABASE_PATH || './data/paz-sur.sqlite', { migrationsDirectory = fileURLToPath(new URL('./migrations/', import.meta.url)) } = {}) {
  if (path !== ':memory:') mkdirSync(dirname(resolve(path)), { recursive: true });
  const db = new DatabaseSync(path);
  try {
    db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');
    db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL) STRICT');
    const directory = migrationsDirectory;
    for (const version of readdirSync(directory).filter(name => name.endsWith('.sql')).sort()) {
      if (db.prepare('SELECT 1 FROM schema_migrations WHERE version = ?').get(version)) continue;
      transaction(db, () => {
        db.exec(readFileSync(resolve(directory, version), 'utf8'));
        if (version === '001_initial.sql') {
          for (const [code, name] of Object.entries(PERMISSIONS)) db.prepare('INSERT INTO permissions (code, name) VALUES (?, ?)').run(code, name);
          for (const role of ROLES) {
            const { lastInsertRowid } = db.prepare('INSERT INTO roles (code, name) VALUES (?, ?)').run(role.code, role.name);
            for (const permission of role.permissions) db.prepare('INSERT INTO role_permissions (role_id, permission_code) VALUES (?, ?)').run(lastInsertRowid, permission);
          }
        }
        db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(version, now());
      });
    }
    return db;
  } catch (error) {
    db.close();
    throw error;
  }
}
