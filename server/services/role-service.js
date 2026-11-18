import { HttpError } from '../errors.js';
import { assertPermission } from '../authorization/user-policy.js';
import { parseRoleInput } from '../validation/user-validation.js';

export function createRoleService({ roles, users, runInTransaction, writeAudit }) {
  return {
    list: () => roles.list(),
    permissions: () => roles.permissions(),
    update(id, input, actorId) {
      const value = parseRoleInput(input, roles.permissions().map(permission => permission.code));
      return runInTransaction(() => {
        assertPermission(users.find(actorId), 'roles.manage');
        const role = roles.find(id);
        if (!role) throw new HttpError(404, 'El rol no existe.');
        if (role.code === 'administrador') throw new HttpError(409, 'El rol administrador está protegido.');
        roles.update(id, value);
        writeAudit(actorId, 'update_permissions', 'role', id);
        return roles.list().find(item => item.id === id);
      });
    },
  };
}
