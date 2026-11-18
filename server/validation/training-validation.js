import { z } from 'zod';
import { validate, paginationSchema } from '../errors.js';
import { MODALITIES, TRAINING_STATUSES } from '../constants.js';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use una fecha YYYY-MM-DD.').refine(value => {
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, 'La fecha no existe.');
const timeSchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'Use una hora HH:mm.');
const trainingSchema = z.object({
  code: z.string().trim().min(1, 'Ingrese el código.').max(30),
  title: z.string().trim().min(3, 'Ingrese un título de al menos 3 caracteres.').max(160),
  description: z.string().trim().max(4000).default(''),
  start_date: dateSchema,
  end_date: dateSchema,
  start_time: timeSchema,
  end_time: timeSchema,
  modality: z.enum(MODALITIES),
  location: z.string().trim().min(1, 'Indique el lugar o enlace.').max(240),
  capacity: z.number().int().min(1, 'El cupo mínimo es 1.').max(10000),
  status: z.enum(TRAINING_STATUSES).default('planificada'),
  instructor_id: z.number().int().positive().nullable().default(null),
  // Se acepta por compatibilidad: el alta usa al actor y la edición conserva al responsable.
  responsible_id: z.number().int().positive().optional(),
}).strict().superRefine((value, context) => {
  if (value.end_date < value.start_date) context.addIssue({ code: 'custom', path: ['end_date'], message: 'La fecha final debe ser igual o posterior al inicio.' });
  if (value.end_time <= value.start_time) context.addIssue({ code: 'custom', path: ['end_time'], message: 'La hora final debe ser posterior a la inicial (horario diario).' });
});
const optionalFilter = schema => z.preprocess(value => value === '' ? undefined : value, schema.optional());
const querySchema = z.object({
  ...paginationSchema,
  search: z.string().trim().max(160).default(''),
  status: optionalFilter(z.enum(TRAINING_STATUSES)),
  from: optionalFilter(dateSchema),
  to: optionalFilter(dateSchema),
}).refine(value => !value.from || !value.to || value.from <= value.to, {
  path: ['to'], message: 'El rango de fechas está invertido.',
});

export const parseTrainingInput = input => validate(trainingSchema, input);
export const parseTrainingQuery = query => validate(querySchema, query);
