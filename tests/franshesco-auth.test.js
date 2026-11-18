import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAuthService } from '../server/services/auth-service.js';
import { createLoginLimiter } from '../server/auth/login-limiter.js';
import { errorMiddleware } from '../server/errors.js';

test('Fran/auth-DIP: cambio de credenciales o desactivación durante scrypt no abre sesión', async () => {
  for (const changed of [{ id: 1, active: 0, password_hash: 'original' }, { id: 1, active: 1, password_hash: 'nuevo' }, null]) {
    let row = { id: 1, active: 1, password_hash: 'original' };
    let inserted = false;
    const service = createAuthService({
      sessions: { credentials: () => row, insertSession() { inserted = true; } }, users: {}, limiter: { check() {} },
      credentials: { randomToken: () => 'ficticio', hashPassword: async () => 'dummy', verifyPassword: async () => { row = changed; return true; } },
      clock: () => '2026-11-18T12:00:00.000Z', runInTransaction: fn => fn(), writeAudit() {},
    });
    await assert.rejects(service.login({ email: 'ficticio@demo.test', password: 'ficticia' }, { ip: 'local' }), { status: 401 });
    assert.equal(inserted, false);
  }
});

test('Fran/auth: ventana de intentos vence sin depender de esperas reales', () => {
  let timestamp = 1000;
  const limiter = createLoginLimiter({ clock: () => timestamp });
  for (let i = 0; i < 10; i++) limiter.check('ip-ficticia');
  assert.throws(() => limiter.check('ip-ficticia'), error => error.status === 429 && error.retryAfter === 900);
  timestamp += 900000;
  assert.doesNotThrow(() => limiter.check('ip-ficticia'));
});

test('Fran/errores: sólo códigos SQLite reales se traducen; fallos inesperados no filtran datos', () => {
  const result = {};
  const response = { status(code) { result.status = code; return this; }, json(body) { result.body = body; }, set() {} };
  for (const [errcode, status] of [[2067, 409], [787, 409], [275, 422], [5, 503]]) {
    errorMiddleware(Object.assign(new Error('detalle privado'), { code: 'ERR_SQLITE_ERROR', errcode }), {}, response, () => {});
    assert.equal(result.status, status);
    assert.equal(JSON.stringify(result.body).includes('detalle privado'), false);
  }
  const original = console.error; console.error = () => {};
  try { errorMiddleware(Object.assign(new Error('UNIQUE constraint failed: detalle privado'), { fields: { token: 'privado' } }), {}, response, () => {}); }
  finally { console.error = original; }
  assert.equal(result.status, 500);
  assert.equal(result.body.error.fields, undefined);
});
