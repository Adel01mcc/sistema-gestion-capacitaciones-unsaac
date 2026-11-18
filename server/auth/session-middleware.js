import { now } from '../db.js';
import { tokenHash } from './credentials.js';
import { createAuthRepository } from '../repositories/auth-repository.js';
import { createUserRepository } from '../repositories/user-repository.js';

export function sessionMiddleware(db) {
  const sessions = createAuthRepository(db);
  const users = createUserRepository(db);
  return (req, _res, next) => {
    const raw = /(?:^|;\s*)sgc_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '')?.[1];
    if (raw) {
      const session = sessions.session(tokenHash(raw), now());
      if (session) {
        // Permisos actuales en cada solicitud, sin caché de privilegios en la cookie.
        const user = users.find(session.user_id);
        if (user?.active) { req.user = user; req.session = session; }
      }
    }
    next();
  };
}
