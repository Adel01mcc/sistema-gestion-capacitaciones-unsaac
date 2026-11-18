// Fachada compatible: las responsabilidades se implementan en m?dulos separados.
import { timingSafeEqual } from 'node:crypto';
import { HttpError } from './errors.js';
import { now } from './db.js';
import { createUserRepository } from './repositories/user-repository.js';
import { assertPermission } from './authorization/user-policy.js';
import { insertAudit } from './repositories/audit-repository.js';
export { hashPassword, verifyPassword, tokenHash, randomToken } from './auth/credentials.js';
export { sessionMiddleware } from './auth/session-middleware.js';
export const hydrateUser = (db, id) => createUserRepository(db).find(id);
export const requireAuth = (req, _res, next) => req.user?.active ? next() : next(new HttpError(401, 'Inicie sesi?n para continuar.'));
// Varios argumentos significan CUALQUIERA (OR), conservando el contrato existente.
export const requirePermission = (...permissions) => (req, _res, next) => {
  try { assertPermission(req.user, ...permissions); next(); } catch (error) { next(error); }
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
  insertAudit(db, userId, action, entity, entityId, now());
}
