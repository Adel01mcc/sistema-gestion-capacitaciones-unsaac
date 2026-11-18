import { now, transaction } from './db.js';
import { audit } from './security.js';
import * as credentials from './auth/credentials.js';
import { createLoginLimiter } from './auth/login-limiter.js';
import { createAuthRepository } from './repositories/auth-repository.js';
import { createRoleRepository } from './repositories/role-repository.js';
import { createUserRepository } from './repositories/user-repository.js';
import { createUserService } from './services/user-management.js';
import { createRoleService } from './services/role-service.js';
import { createAuthService } from './services/auth-service.js';

// Punto de composición: las implementaciones SQLite se conectan a los casos de uso.
export function createUserServices(db) {
  const dependencies = {
    users: createUserRepository(db), roles: createRoleRepository(db), sessions: createAuthRepository(db),
    runInTransaction: operation => transaction(db, operation),
    passwordHasher: credentials.hashPassword, writeAudit: (...args) => audit(db, ...args), clock: now,
  };
  return { users: createUserService(dependencies), roles: createRoleService(dependencies) };
}
export function createAuthentication(db, { rateLimitEnabled = true } = {}) {
  return createAuthService({
    sessions: createAuthRepository(db), users: createUserRepository(db), credentials,
    limiter: createLoginLimiter({ enabled: rateLimitEnabled }),
    runInTransaction: operation => transaction(db, operation), writeAudit: (...args) => audit(db, ...args), clock: now,
  });
}
