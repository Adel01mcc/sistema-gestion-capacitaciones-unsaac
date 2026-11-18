import { Router } from 'express';
import { asyncRoute } from '../errors.js';
import { requireAuth } from '../security.js';
import { createAuthentication } from '../composition.js';

export function createAuthRouter(db, { secureCookies = false, rateLimitEnabled = true, service = createAuthentication(db, { rateLimitEnabled }) } = {}) {
  const router = Router();
  const cookieOptions = { httpOnly: true, secure: secureCookies, sameSite: 'lax', path: '/api' };
  router.get('/auth/me', requireAuth, (req, res) => res.json({ data: { user: req.user, csrfToken: req.session.csrf_token } }));
  router.post('/auth/login', asyncRoute(async (req, res) => {
    const { token, user, csrfToken } = await service.login(req.body, { ip: req.ip, previousTokenHash: req.session?.token_hash });
    res.cookie('sgc_session', token, { ...cookieOptions, maxAge: 8 * 60 * 60 * 1000 });
    res.json({ data: { user, csrfToken } });
  }));
  router.post('/auth/logout', requireAuth, (req, res) => {
    service.logout(req.session.token_hash);
    res.clearCookie('sgc_session', cookieOptions);
    res.json({ data: { message: 'Sesi?n cerrada.' } });
  });
  return router;
}
