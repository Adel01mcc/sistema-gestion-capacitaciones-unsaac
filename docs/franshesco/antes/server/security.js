import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { HttpError } from './errors.js';
import { now } from './db.js';

const scrypt = promisify(scryptCallback);
export const tokenHash = value => createHash('sha256').update(value).digest('hex');
export const randomToken = () => randomBytes(32).toString('hex');
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, 64, { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 });
  return `scrypt$32768$8$3$${salt}$${derived.toString('hex')}`;
}
export async function verifyPassword(password, hash) {
  const [algorithm, n, r, p, salt, digest] = hash.split('$');
  if (algorithm !== 'scrypt' || n !== '32768' || r !== '8' || p !== '3' || !/^[a-f0-9]{128}$/.test(digest || '')) return false;
  const derived = await scrypt(password, salt, 64, { N: Number(n), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024 });
  return timingSafeEqual(derived, Buffer.from(digest, 'hex'));
}
export function hydrateUser(db, id) {
  const row = db.prepare('SELECT id, first_name, last_name, email, document, active, department, specialty, created_at, updated_at FROM users WHERE id = ?').get(id);
  if (!row) return null;
  const roles = db.prepare('SELECT r.code FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = ? ORDER BY r.code').all(id).map(item => item.code);
  const permissions = db.prepare('SELECT DISTINCT rp.permission_code FROM role_permissions rp JOIN user_roles ur ON ur.role_id = rp.role_id WHERE ur.user_id = ? ORDER BY rp.permission_code').all(id).map(item => item.permission_code);
  return { ...row, active: Boolean(row.active), roles, permissions };
}
export function sessionMiddleware(db) {
  return (req, _res, next) => {
    const raw = /(?:^|;\s*)sgc_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '')?.[1];
    if (raw) {
      const session = db.prepare('SELECT * FROM sessions_auth WHERE token_hash = ? AND expires_at > ?').get(tokenHash(raw), now());
      if (session) {
        const user = hydrateUser(db, session.user_id);
        if (user?.active) { req.user = user; req.session = session; }
      }
    }
    next();
  };
}
export const requireAuth = (req, _res, next) => req.user ? next() : next(new HttpError(401, 'Inicie sesión para continuar.'));
export const requirePermission = (...permissions) => (req, _res, next) => {
  if (!req.user) return next(new HttpError(401, 'Inicie sesión para continuar.'));
  if (!permissions.some(permission => req.user.permissions.includes(permission))) return next(new HttpError(403, 'No tiene permiso para realizar esta acción.'));
  next();
};
export function csrfMiddleware(req, _res, next) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  if (!req.is('application/json')) return next(new HttpError(415, 'Envíe el contenido como application/json.'));
  if (!req.user) return next();
  const value = req.get('X-CSRF-Token') || '';
  const expected = req.session.csrf_token;
  if (!/^[a-f0-9]{64}$/.test(value) || !timingSafeEqual(Buffer.from(value), Buffer.from(expected))) return next(new HttpError(403, 'La verificación de seguridad caducó. Actualice la página.'));
  next();
}
export function audit(db, userId, action, entity, entityId) {
  db.prepare('INSERT INTO audit_log (user_id, action, entity, entity_id, created_at) VALUES (?, ?, ?, ?, ?)').run(userId, action, entity, entityId, now());
}
