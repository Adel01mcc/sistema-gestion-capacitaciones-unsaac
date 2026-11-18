import { HttpError, paginated } from '../errors.js';
import { parseUserInput, parseUserQuery, parseUserRoles } from '../validation/user-validation.js';
import { assertAdminRemains, assertPermission, assertUserCreation, assertUserEdition } from '../authorization/user-policy.js';

// Puertos recibidos por inyección: este módulo no conoce Express, SQL ni scrypt.
export function createUserService({ users, roles, sessions, runInTransaction, passwordHasher, writeAudit, clock }) {
  function get(id) {
    const user = users.find(id);
    if (!user) throw new HttpError(404, 'El usuario no existe.');
    return user;
  }
  function assertUnique(value, id = 0) {
    if (users.emailExists(value.email, id)) throw new HttpError(409, 'El correo ya está registrado.', { email: 'Use otro correo.' });
    if (value.document && users.documentExists(value.document, id)) throw new HttpError(409, 'El documento ya está registrado.', { document: 'Use otro documento.' });
  }
  function protectAdmin(current, active, roleCodes) {
    assertAdminRemains(current, active, roleCodes, users.otherActiveAdmins(current.id));
  }
  return {
    get,
    list(query, forcedRole) {
      const filters = parseUserQuery(query, forcedRole);
      const { rows, total } = users.search(filters);
      return paginated(rows, total, filters.page, filters.pageSize);
    },
    async create(input, actorId) {
      const value = parseUserInput(input);
      // null es exclusivamente la semilla local; ninguna ruta pública lo acepta.
      if (actorId !== null) assertUserCreation(get(actorId), value, roles.participantIsPrivileged());
      const hash = await passwordHasher(value.password);
      return runInTransaction(() => {
        // Se reevalúa tras el await: un permiso revocado no autoriza la escritura.
        if (actorId !== null) assertUserCreation(get(actorId), value, roles.participantIsPrivileged());
        assertUnique(value);
        const id = users.insert(value, hash, clock());
        users.setRoles(id, value.roles);
        writeAudit(actorId, 'create', 'user', id);
        return get(id);
      });
    },
    async update(id, input, actorId) {
      const value = parseUserInput(input, true);
      assertUserEdition(get(actorId), get(id), value);
      const hash = value.password ? await passwordHasher(value.password) : null;
      return runInTransaction(() => {
        const current = get(id);
        assertUserEdition(get(actorId), current, value);
        protectAdmin(current, value.active, value.roles || current.roles);
        assertUnique(value, id);
        users.update(id, value, clock());
        if (value.roles) users.setRoles(id, value.roles);
        if (hash) users.setPassword(id, hash);
        if (!value.active || hash) sessions.revokeUser(id);
        writeAudit(actorId, 'update', 'user', id);
        return get(id);
      });
    },
    assignRoles(id, input, actorId) {
      const roleCodes = parseUserRoles(input);
      return runInTransaction(() => {
        assertPermission(get(actorId), 'roles.manage');
        const current = get(id);
        protectAdmin(current, current.active, roleCodes);
        users.setRoles(id, roleCodes);
        writeAudit(actorId, 'assign_roles', 'user', id);
        return get(id);
      });
    },
  };
}
