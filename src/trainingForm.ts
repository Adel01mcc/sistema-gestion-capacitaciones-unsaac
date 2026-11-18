import type { Training, TrainingStatus } from './types';

export const initialTrainingStatuses: readonly TrainingStatus[] = ['planificada', 'programada'];

export const trainingEditStatuses: Readonly<Record<TrainingStatus, readonly TrainingStatus[]>> = {
  planificada: ['planificada', 'programada', 'cancelada'],
  programada: ['programada', 'planificada', 'en_curso', 'cancelada'],
  en_curso: ['en_curso', 'finalizada', 'cancelada'],
  finalizada: [],
  cancelada: [],
};

export function initialTrainingValues(training: Training | null) {
  return {
    code: training?.code ?? '',
    title: training?.title ?? '',
    description: training?.description ?? '',
    start_date: training?.start_date ?? '',
    end_date: training?.end_date ?? '',
    start_time: training?.start_time ?? '09:00',
    end_time: training?.end_time ?? '10:00',
    modality: training?.modality ?? 'presencial',
    location: training?.location ?? '',
    capacity: String(training?.capacity ?? 20),
    status: training?.status ?? 'planificada',
    instructor_id: String(training?.instructor_id ?? ''),
  };
}

export type TrainingFormValues = ReturnType<typeof initialTrainingValues>;
export type TrainingFieldName = keyof TrainingFormValues;
export type TrainingFieldErrors = Partial<Record<TrainingFieldName, string>>;

export function validateTrainingForm(values: TrainingFormValues): TrainingFieldErrors {
  const errors: TrainingFieldErrors = {};
  if (values.end_date < values.start_date) {
    errors.end_date = 'La fecha de fin debe ser igual o posterior a la de inicio.';
  }
  if (values.end_time <= values.start_time) {
    errors.end_time = 'La hora de fin debe ser posterior a la hora de inicio en cada día de la capacitación.';
  }
  return errors;
}

export function toTrainingPayload(values: TrainingFormValues) {
  return {
    ...values,
    capacity: Number(values.capacity),
    instructor_id: values.instructor_id ? Number(values.instructor_id) : null,
  };
}

export type TrainingPayload = ReturnType<typeof toTrainingPayload>;
