import { z } from 'zod';
z.config(z.locales.es());

export class HttpError extends Error {
  constructor(status, message, fields) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

export function validate(schema, input) {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  const fields = {};
  for (const issue of result.error.issues) fields[issue.path.join('.') || 'form'] ??= issue.message;
  throw new HttpError(422, 'Revise los campos indicados.', fields);
}
export const asyncRoute = handler => (req, res, next) => Promise.resolve().then(() => handler(req, res, next)).catch(next);
export const idParam = value => validate(z.coerce.number().int().positive().safe(), value);
export const paginationSchema = {
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
};
export const paginated = (data, total, page, pageSize) => ({ data, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
export const searchPattern = value => `%${value.replace(/[\\%_]/g, match => `\\${match}`)}%`;

export function errorMiddleware(error, _req, res, _next) {
  let status = error instanceof HttpError ? error.status : 500;
  let message = error instanceof HttpError ? error.message : 'Ocurrió un error inesperado. Inténtelo nuevamente.';
  if (error.type === 'entity.parse.failed') { status = 400; message = 'El contenido JSON no es válido.'; }
  if (error.type === 'entity.too.large') { status = 413; message = 'El contenido supera el tamaño permitido.'; }
  // Códigos extendidos de SQLite: no se adivina el tipo mediante texto del error.
  if (error.code === 'ERR_SQLITE_ERROR') {
    if ([1555, 2067].includes(error.errcode)) { status = 409; message = 'Ya existe un registro con esos datos.'; }
    if (error.errcode === 787) { status = 409; message = 'El registro relacionado no existe o está en uso.'; }
    if (error.errcode === 275) { status = 422; message = 'Los datos no cumplen las restricciones del registro.'; }
    if ([5, 6].includes(error.errcode & 255)) { status = 503; message = 'La base de datos está ocupada. Inténtelo nuevamente.'; }
  }
  if (error instanceof HttpError && error.retryAfter) res.set('Retry-After', String(error.retryAfter));
  if (status === 500) console.error('Error de API:', error);
  res.status(status).json({ error: { message, ...(error instanceof HttpError && error.fields ? { fields: error.fields } : {}) } });
}
