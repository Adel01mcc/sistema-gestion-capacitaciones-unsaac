import express from 'express';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ATTENDANCE_STATUSES, GRADE_MAX, GRADE_MIN, MIN_ATTENDANCE, MODALITIES, PASSING_GRADE, TRAINING_STATUSES } from './constants.js';
import { HttpError } from './errors.js';
import { csrfMiddleware, requireAuth, sessionMiddleware } from './security.js';
import { createAuthRouter } from './routes/auth.js';
import { createUserRouter } from './routes/users.js';
import { createTrainingRouter } from './routes/trainings.js';

export function createApp({ db, secureCookies = false, rateLimitEnabled = true, staticDirectory = fileURLToPath(new URL('../dist/', import.meta.url)) }) {
  const app = express();
  app.disable('x-powered-by');
  app.use((_req, res, next) => {
    res.set({ 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'same-origin', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'" });
    next();
  });
  app.use('/api', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.use('/api', express.json({ limit: '64kb' }), sessionMiddleware(db), csrfMiddleware);
  app.get('/api/health', (_req, res) => { db.prepare('SELECT 1').get(); res.json({ data: { status: 'ok', database: 'sqlite', version: 'v1-working-increment' } }); });
  app.use('/api', createAuthRouter(db, { secureCookies, rateLimitEnabled }));
  app.get('/api/config', requireAuth, (_req, res) => res.json({ data: { trainingStatuses: TRAINING_STATUSES, modalities: MODALITIES, attendanceStatuses: ATTENDANCE_STATUSES, gradeMin: GRADE_MIN, gradeMax: GRADE_MAX, passingGrade: PASSING_GRADE, minAttendance: MIN_ATTENDANCE } }));
  app.use('/api', createTrainingRouter(db), createUserRouter(db));
  app.use('/api', (_req, _res, next) => next(new HttpError(404, 'La ruta solicitada no existe en este incremento.')));
  if (existsSync(staticDirectory)) {
    app.use(express.static(staticDirectory, { index: false }));
    app.get('/{*path}', (_req, res) => res.sendFile('index.html', { root: staticDirectory }));
  }
  app.use((error, _req, res, _next) => {
    let status = error instanceof HttpError ? error.status : 500;
    let message = error instanceof HttpError ? error.message : 'Ocurrió un error inesperado. Inténtelo nuevamente.';
    if (error.type === 'entity.parse.failed') { status = 400; message = 'El contenido JSON no es válido.'; }
    if (error.type === 'entity.too.large') { status = 413; message = 'El contenido supera el tamaño permitido.'; }
    if (String(error.message).includes('UNIQUE constraint failed')) { status = 409; message = 'Ya existe un registro con esos datos.'; }
    if (status === 500) console.error('Error de API:', error);
    res.status(status).json({ error: { message, ...(error.fields ? { fields: error.fields } : {}) } });
  });
  return app;
}
