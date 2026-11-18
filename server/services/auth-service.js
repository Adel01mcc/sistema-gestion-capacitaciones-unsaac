import { HttpError } from '../errors.js';
import { parseLogin } from '../validation/auth-validation.js';

export function createAuthService({ sessions, users, credentials, limiter, runInTransaction, writeAudit, clock }) {
  let dummyHash;
  return {
    async login(input, { ip, previousTokenHash } = {}) {
      const value = parseLogin(input);
      limiter.check(ip);
      dummyHash ??= credentials.hashPassword(credentials.randomToken());
      const row = sessions.credentials(value.email);
      const correct = await credentials.verifyPassword(value.password, row?.password_hash || await dummyHash);
      if (!correct || !row?.active) throw new HttpError(401, 'Correo o contraseña incorrectos.');
      const token = credentials.randomToken();
      const csrfToken = credentials.randomToken();
      const expiresAt = new Date(new Date(clock()).getTime() + 8 * 60 * 60 * 1000).toISOString();
      return runInTransaction(() => {
        // Una desactivación/cambio de clave durante scrypt no debe abrir una sesión.
        const current = sessions.credentials(value.email);
        if (!current?.active || current.id !== row.id || current.password_hash !== row.password_hash) throw new HttpError(401, 'Correo o contraseña incorrectos.');
        sessions.deleteExpired(clock());
        if (previousTokenHash) sessions.revoke(previousTokenHash);
        sessions.insertSession({ tokenHash: credentials.tokenHash(token), userId: row.id, csrfToken, expiresAt });
        writeAudit(row.id, 'login', 'user', row.id);
        return { token, csrfToken, user: users.find(row.id) };
      });
    },
    logout: tokenHash => sessions.revoke(tokenHash),
  };
}
