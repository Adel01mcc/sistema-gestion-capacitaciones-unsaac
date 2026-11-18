// Fachada de compatibilidad para la semilla y consumidores de la V1.
// Los casos de uso reciben repositorios y colaboradores en composition.js.
import { createUserServices } from '../composition.js';
export { passwordSchema } from '../validation/user-validation.js';
export const getUser = (db, id) => createUserServices(db).users.get(id);
export const listUsers = (db, query, forcedRole) => createUserServices(db).users.list(query, forcedRole);
export const createUser = (db, input, actorId) => createUserServices(db).users.create(input, actorId);
export const updateUser = (db, id, input, actorId) => createUserServices(db).users.update(id, input, actorId);
export const assignRoles = (db, id, input, actorId) => createUserServices(db).users.assignRoles(id, input, actorId);
export const listRoles = db => createUserServices(db).roles.list();
export const updateRole = (db, id, input, actorId) => createUserServices(db).roles.update(id, input, actorId);
