import { Router } from 'express';
import { z } from 'zod';
import { HttpError, asyncRoute, validate } from '../errors.js';
import { audit, hashPassword, hydrateUser, randomToken, requireAuth, tokenHash, verifyPassword } from '../security.js';
import { now, transaction } from '../db.js';

export function createAuthRouter(db, { secureCookies = false, rateLimitEnabled = true } = {}) {
  const router = Router();
  const attempts = new Map();
  const dummyHash = hashPassword(randomToken());
  const cookieOptions = { httpOnly: true, secure: secureCookies, sameSite: 'lax', path: '/api' };
  router.get('/auth/me', requireAuth, (req, res) => res.json({ data: { user: req.user, csrfToken: req.session.csrf_token } }));
  router.post('/auth/login', asyncRoute(async (req, res) => {
    const { email, password } = validate(z.object({ email: z.email().max(254).transform(value => value.toLowerCase()), password: z.string().min(1).max(128) }).strict(), req.body);
    const timestamp = Date.now();
    const key = req.ip;
    // La ventana y el límite pertenecen a esta instancia local. No es un limitador distribuido.
    for (const [ip, item] of attempts) if (item.until < timestamp) attempts.delete(ip);
    if (rateLimitEnabled) {
      const item = attempts.get(key) || { count: 0, until: timestamp + 15 * 60 * 1000 };
      if (item.count >= 10) { res.set('Retry-After', String(Math.max(1, Math.ceil((item.until - timestamp) / 1000)))); throw new HttpError(429, 'Demasiados intentos. Espere 15 minutos e inténtelo de nuevo.'); }
      item.count += 1;
      attempts.set(key, item);
    }
    const row = db.prepare('SELECT id,password_hash,active FROM users WHERE email=?').get(email);
    const correct = await verifyPassword(password, row?.password_hash || await dummyHash);
    if (!correct || !row?.active) throw new HttpError(401, 'Correo o contraseña incorrectos.');
    const token = randomToken();
    const csrfToken = randomToken();
    const expires = new Date(timestamp + 8 * 60 * 60 * 1000);
    transaction(db, () => {
      db.prepare('DELETE FROM sessions_auth WHERE expires_at<=?').run(now());
      if (req.session) db.prepare('DELETE FROM sessions_auth WHERE token_hash=?').run(req.session.token_hash);
      db.prepare('INSERT INTO sessions_auth (token_hash,user_id,csrf_token,expires_at) VALUES (?,?,?,?)').run(tokenHash(token), row.id, csrfToken, expires.toISOString());
      audit(db, row.id, 'login', 'user', row.id);
    });
    res.cookie('sgc_session', token, { ...cookieOptions, maxAge: 8 * 60 * 60 * 1000 });
    res.json({ data: { user: hydrateUser(db, row.id), csrfToken } });
  }));
  router.post('/auth/logout', requireAuth, (req, res) => {
    db.prepare('DELETE FROM sessions_auth WHERE token_hash=?').run(req.session.token_hash);
    res.clearCookie('sgc_session', cookieOptions);
    res.json({ data: { message: 'Sesión cerrada.' } });
  });
  return router;
}
