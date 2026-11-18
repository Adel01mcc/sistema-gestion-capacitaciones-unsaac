import { z } from 'zod';
import { paginationSchema, validate } from '../errors.js';
import { ROLES } from '../constants.js';

const rolesSchema = z.array(z.enum(ROLES.map(role => role.code))).min(1, 'Seleccione al menos un rol.').max(6)
  .refine(roles => new Set(roles).size === roles.length, 'No repita roles.');
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
export const parseUserInput = (input, update = false) => validate(update ? updateSchema : createSchema, input);
export const parseUserRoles = input => validate(z.object({ roles: rolesSchema }).strict(), input).roles;
export const parseUserQuery = (query, forcedRole) => validate(z.object({
  ...paginationSchema,
  search: z.string().trim().max(160).default(''),
  role: z.preprocess(value => value === '' ? undefined : value, z.enum(ROLES.map(role => role.code)).optional()),
}), { ...query, ...(forcedRole ? { role: forcedRole } : {}) });
export const parseRoleInput = (input, permissions) => validate(z.object({
  name: z.string().trim().min(1).max(80),
  permissions: z.array(z.enum(permissions)).max(permissions.length)
    .refine(items => new Set(items).size === items.length, 'No repita permisos.'),
}).strict(), input);
