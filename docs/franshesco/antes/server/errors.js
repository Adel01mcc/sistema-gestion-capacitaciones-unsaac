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
