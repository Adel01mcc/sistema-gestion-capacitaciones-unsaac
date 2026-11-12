import { z } from 'zod';
import { HttpError, paginationSchema, validate, paginated, searchPattern } from '../errors.js';
import { ROLES } from '../constants.js';
import { now, transaction } from '../db.js';
import { audit, hashPassword, hydrateUser } from '../security.js';

const rolesSchema = z.array(z.enum(ROLES.map(role => role.code))).min(1, 'Seleccione al menos un rol.').max(6).refine(roles => new Set(roles).size === roles.length, 'No repita roles.');
export const passwordSchema = z.string().min(12, 'Use al menos 12 caracteres.').max(128, 'Use como máximo 128 caracteres.');
const fields = {
  first_name: z.string().trim().min(1, 'Ingrese los nombres.').max(80),
  last_name: z.string().trim().min(1, 'Ingrese los apellidos.').max(80),
  email: z.email('Ingrese un correo válido.').max(254).transform(value => value.toLowerCase()),
  document: z.string().trim().max(20).nullable().optional().transform(value => value || null),
  active: z.boolean().default(true),
  department: z.string().trim().max(120).default(''),
  specialty: z.string().trim().max(120).default(''),
};
const createSchema = z.object({ ...fields, password: passwordSchema, roles: rolesSchema }).strict();
const updateSchema = z.object({ ...fields, password: passwordSchema.optional(), roles: rolesSchema.optional() }).strict();

function assertLastAdmin(db, id, active, roles) {
  const current = hydrateUser(db, id);
  if (!current.active || !current.roles.includes('administrador') || (active && roles.includes('administrador'))) return;
  const other = db.prepare("SELECT COUNT(*) AS total FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON r.id = ur.role_id WHERE u.active = 1 AND r.code = 'administrador' AND u.id <> ?").get(id);
  if (other.total === 0) throw new HttpError(409, 'Debe conservar al menos un administrador activo.');
}
function setRoles(db, id, roles) {
  db.prepare('DELETE FROM user_roles WHERE user_id = ?').run(id);
  for (const role of roles) db.prepare('INSERT INTO user_roles (user_id, role_id) SELECT ?, id FROM roles WHERE code = ?').run(id, role);
}
function assertUnique(db, user, id = 0) {
  if (db.prepare('SELECT 1 FROM users WHERE email = ? AND id <> ?').get(user.email, id)) throw new HttpError(409, 'El correo ya está registrado.', { email: 'Use otro correo.' });
  if (user.document && db.prepare('SELECT 1 FROM users WHERE document = ? AND id <> ?').get(user.document, id)) throw new HttpError(409, 'El documento ya está registrado.', { document: 'Use otro documento.' });
}
export function getUser(db, id) {
  const user = hydrateUser(db, id);
  if (!user) throw new HttpError(404, 'El usuario no existe.');
  return user;
}
export function listUsers(db, query, forcedRole) {
  const { page, pageSize, search, role } = validate(z.object({
    ...paginationSchema,
    search: z.string().trim().max(160).default(''),
    role: z.preprocess(value => value === '' ? undefined : value, z.enum(ROLES.map(item => item.code)).optional()),
  }), { ...query, ...(forcedRole ? { role: forcedRole } : {}) });
  const filter = role ? ' AND EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = u.id AND r.code = ?)' : '';
  const args = [searchPattern(search), searchPattern(search), searchPattern(search), ...(role ? [role] : [])];
  const where = `(u.first_name LIKE ? ESCAPE '\\' OR u.last_name LIKE ? ESCAPE '\\' OR u.email LIKE ? ESCAPE '\\')${filter}`;
  const total = db.prepare(`SELECT COUNT(*) AS total FROM users u WHERE ${where}`).get(...args).total;
  const rows = db.prepare(`SELECT u.id FROM users u WHERE ${where} ORDER BY u.last_name, u.first_name, u.id LIMIT ? OFFSET ?`).all(...args, pageSize, (page - 1) * pageSize);
  return paginated(rows.map(row => hydrateUser(db, row.id)), total, page, pageSize);
}
export async function createUser(db, input, actorId) {
  const user = validate(createSchema, input);
  if (actorId !== null && !getUser(db, actorId).permissions.includes('roles.manage')) {
    const privilegedParticipant = db.prepare("SELECT 1 FROM role_permissions rp JOIN roles r ON r.id=rp.role_id WHERE r.code='participante' AND rp.permission_code IN ('users.manage','roles.manage')").get();
    if (user.roles.some(role => role !== 'participante') || privilegedParticipant) throw new HttpError(403, 'Asignar roles adicionales o administrativos requiere el permiso de gestionar roles.');
  }
  const hash = await hashPassword(user.password);
  return transaction(db, () => {
    assertUnique(db, user);
    const timestamp = now();
    const result = db.prepare('INSERT INTO users (first_name,last_name,email,document,password_hash,active,department,specialty,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)').run(user.first_name, user.last_name, user.email, user.document, hash, Number(user.active), user.department, user.specialty, timestamp, timestamp);
    const id = Number(result.lastInsertRowid);
    setRoles(db, id, user.roles);
    audit(db, actorId, 'create', 'user', id);
    return hydrateUser(db, id);
  });
}
export async function updateUser(db, id, input, actorId) {
  const target = getUser(db, id);
  const user = validate(updateSchema, input);
  const actor = getUser(db, actorId);
  if (!actor.permissions.includes('roles.manage') && (user.roles || target.permissions.some(permission => ['users.manage', 'roles.manage'].includes(permission)))) throw new HttpError(403, 'Gestionar roles o cuentas administrativas requiere el permiso de gestionar roles.');
  const hash = user.password ? await hashPassword(user.password) : null;
  return transaction(db, () => {
    const current = getUser(db, id);
    const roles = user.roles || current.roles;
    assertLastAdmin(db, id, user.active, roles);
    assertUnique(db, user, id);
    db.prepare('UPDATE users SET first_name=?,last_name=?,email=?,document=?,active=?,department=?,specialty=?,updated_at=? WHERE id=?').run(user.first_name, user.last_name, user.email, user.document, Number(user.active), user.department, user.specialty, now(), id);
    if (user.roles) setRoles(db, id, roles);
    if (hash) db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(hash, id);
    if (!user.active || hash) db.prepare('DELETE FROM sessions_auth WHERE user_id=?').run(id);
    audit(db, actorId, 'update', 'user', id);
    return hydrateUser(db, id);
  });
}
export function assignRoles(db, id, input, actorId) {
  if (!getUser(db, actorId).permissions.includes('roles.manage')) throw new HttpError(403, 'No tiene permiso para asignar roles.');
  const { roles } = validate(z.object({ roles: rolesSchema }).strict(), input);
  return transaction(db, () => {
    const user = getUser(db, id);
    assertLastAdmin(db, id, user.active, roles);
    setRoles(db, id, roles);
    audit(db, actorId, 'assign_roles', 'user', id);
    return hydrateUser(db, id);
  });
}
export function listRoles(db) {
  return db.prepare('SELECT * FROM roles ORDER BY id').all().map(role => ({ ...role, permissions: db.prepare('SELECT permission_code FROM role_permissions WHERE role_id=? ORDER BY permission_code').all(role.id).map(row => row.permission_code) }));
}
export function updateRole(db, id, input, actorId) {
  const validPermissions = db.prepare('SELECT code FROM permissions').all().map(row => row.code);
  const value = validate(z.object({ name: z.string().trim().min(1).max(80), permissions: z.array(z.enum(validPermissions)).max(validPermissions.length).refine(items => new Set(items).size === items.length, 'No repita permisos.') }).strict(), input);
  return transaction(db, () => {
    const role = db.prepare('SELECT * FROM roles WHERE id=?').get(id);
    if (!role) throw new HttpError(404, 'El rol no existe.');
    if (role.code === 'administrador') throw new HttpError(409, 'El rol administrador está protegido.');
    db.prepare('UPDATE roles SET name=? WHERE id=?').run(value.name, id);
    db.prepare('DELETE FROM role_permissions WHERE role_id=?').run(id);
    for (const permission of value.permissions) db.prepare('INSERT INTO role_permissions (role_id,permission_code) VALUES (?,?)').run(id, permission);
    audit(db, actorId, 'update_permissions', 'role', id);
    return listRoles(db).find(item => item.id === id);
  });
}
