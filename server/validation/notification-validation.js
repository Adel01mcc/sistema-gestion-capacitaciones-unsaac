import { z } from 'zod';
import { paginationSchema, validate } from '../errors.js';

export const parseNotificationQuery = query => validate(z.object(paginationSchema), query);
