import { HttpError } from '../errors.js';

export const hasAnyPermission = (user, ...permissions) => Boolean(user?.active && permissions.some(permission => user.permissions.includes(permission)));
export function assertPermission(user, ...permissions) {
  if (!user?.active) throw new HttpError(401, 'Inicie sesión para continuar.');
  if (!hasAnyPermission(user, ...permissions)) throw new HttpError(403, 'No tiene permiso para realizar esta acción.');
}
export function assertUserCreation(actor, value, participantIsPrivileged) {
  assertPermission(actor, 'users.manage');
  if (!hasAnyPermission(actor, 'roles.manage') && (value.roles.some(role => role !== 'participante') || participantIsPrivileged)) {
    throw new HttpError(403, 'Asignar roles adicionales o administrativos requiere el permiso de gestionar roles.');
  }
}
export function assertUserEdition(actor, target, value) {
  assertPermission(actor, 'users.manage');
  if (!hasAnyPermission(actor, 'roles.manage') && (value.roles || target.permissions.some(permission => ['users.manage', 'roles.manage'].includes(permission)))) {
    throw new HttpError(403, 'Gestionar roles o cuentas administrativas requiere el permiso de gestionar roles.');
  }
}
export function assertAdminRemains(current, active, roles, otherAdmins) {
  if (current.active && current.roles.includes('administrador') && !(active && roles.includes('administrador')) && otherAdmins === 0) {
    throw new HttpError(409, 'Debe conservar al menos un administrador activo.');
  }
}
