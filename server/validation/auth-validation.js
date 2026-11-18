import { z } from 'zod';
import { validate } from '../errors.js';

// Login conserva las claves históricas; las altas y cambios exigen 12 caracteres.
const loginSchema = z.object({
  email: z.email().max(254).transform(value => value.toLowerCase()),
  password: z.string().min(1).max(128),
}).strict();
export const parseLogin = input => validate(loginSchema, input);
