import { useEffect, useId, useState, type ChangeEvent, type ComponentProps, type FormEvent } from 'react';
import { ApiError, errorMessage, request } from './api';
import { Field, Icon, Modal, Notice } from './components';
import {
  initialTrainingStatuses, initialTrainingValues, toTrainingPayload, validateTrainingForm,
  type TrainingFieldErrors, type TrainingFieldName, type TrainingPayload,
} from './trainingForm.ts';
import { modalityLabels, statusLabels, type ListResponse, type Training, type TrainingStatus, type User } from './types';

const transitions: Record<TrainingStatus, TrainingStatus[]> = {
  planificada: ['planificada', 'programada', 'cancelada'],
  programada: ['programada', 'planificada', 'en_curso', 'cancelada'],
  en_curso: ['en_curso', 'finalizada', 'cancelada'], finalizada: ['finalizada'], cancelada: ['cancelada'],
};

type InstructorOption = Pick<User, 'id' | 'first_name' | 'last_name' | 'active'>;
type FieldFeedback = { id: string; message: string };
type TrainingFormProps = {
  training: Training | null;
  onClose: () => void;
  onSubmit: (payload: TrainingPayload) => Promise<void>;
};

function TrainingField({ feedback, wide, ...props }: ComponentProps<typeof Field> & { feedback?: FieldFeedback }) {
  return (
    <div className={wide ? 'wide' : undefined}>
      <Field {...props} />
      {feedback && <p id={feedback.id} className="training-field-error" role="alert">{feedback.message}</p>}
    </div>
  );
}

export function TrainingForm({ training, onClose, onSubmit }: TrainingFormProps) {
  const [form, setForm] = useState(() => initialTrainingValues(training));
  const [instructors, setInstructors] = useState<InstructorOption[]>([]);
  const [lookupError, setLookupError] = useState('');
  const [lookupLoading, setLookupLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<TrainingFieldErrors>({});
  const fieldId = useId();

  useEffect(() => {
    let active = true;
    async function loadInstructors() {
      const first = await request<ListResponse<InstructorOption>>('/users?role=instructor&pageSize=100&page=1');
      const people = [...first.data];
      for (let page = 2; active && page <= first.meta.totalPages; page += 1) {
        const next = await request<ListResponse<InstructorOption>>(`/users?role=instructor&pageSize=100&page=${page}`);
        people.push(...next.data);
      }
      return people;
    }
    loadInstructors().then((people) => { if (active) setInstructors(people.filter((user) => user.active || user.id === training?.instructor_id)); })
      .catch((failure) => { if (active) setLookupError(errorMessage(failure)); })
      .finally(() => { if (active) setLookupLoading(false); });
    return () => { active = false; };
  }, [training?.instructor_id]);

  function feedback(name: TrainingFieldName): FieldFeedback | undefined {
    const message = fieldErrors[name];
    return message ? { id: `${fieldId}-${name}-error`, message } : undefined;
  }

  function control(name: TrainingFieldName) {
    const issue = feedback(name);
    return {
      value: form[name],
      'aria-invalid': issue ? true : undefined,
      'aria-describedby': issue?.id,
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const value = event.target.value;
        setForm((current) => ({ ...current, [name]: value }));
        setFieldErrors((current) => {
          const next = { ...current };
          delete next[name];
          if (name === 'start_date') delete next.end_date;
          if (name === 'start_time') delete next.end_time;
          return next;
        });
      },
    };
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setError('');
    const errors = validateTrainingForm(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      await onSubmit(toTrainingPayload(form));
    } catch (failure) {
      if (failure instanceof ApiError && failure.fields) {
        const fields: TrainingFieldErrors = {};
        const generalMessages: string[] = [];
        for (const [name, messages] of Object.entries(failure.fields)) {
          const message = Array.isArray(messages) ? messages.join(' · ') : messages;
          if (!message) continue;
          if (Object.hasOwn(form, name)) fields[name as TrainingFieldName] = message;
          else generalMessages.push(message);
        }
        setFieldErrors(fields);
        if (generalMessages.length > 0 || Object.keys(fields).length === 0) {
          setError([failure.message, ...generalMessages].join(' '));
        }
      } else {
        setError(errorMessage(failure));
      }
    } finally {
      setSaving(false);
    }
  }

  const allowedStatuses = training ? transitions[training.status] : initialTrainingStatuses;
  return (
    <Modal
      title={training ? 'Editar capacitación' : 'Nueva capacitación'}
      description="Organiza los datos y la programación de la actividad."
      onClose={() => { if (!saving) onClose(); }}
    >
      <form onSubmit={submit}>
        <div className="modal-body">
          <Notice message={error} />
          <Notice message={lookupError} kind="info" />
          <div className="form-grid">
            <TrainingField label="Código *" feedback={feedback('code')}>
              <input {...control('code')} required maxLength={30} placeholder="CAP-001" />
            </TrainingField>
            <TrainingField label="Estado *" feedback={feedback('status')}>
              <select {...control('status')}>
                {allowedStatuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
              </select>
            </TrainingField>
            <TrainingField label="Título de la capacitación *" feedback={feedback('title')} wide>
              <input {...control('title')} required minLength={3} maxLength={160} placeholder="Ej. Conocimiento de productos" />
            </TrainingField>
            <TrainingField label="Descripción" feedback={feedback('description')} wide>
              <textarea {...control('description')} rows={3} maxLength={4000} placeholder="Objetivo y contenido de la actividad" />
            </TrainingField>
            <TrainingField label="Fecha de inicio *" feedback={feedback('start_date')}>
              <input type="date" {...control('start_date')} required />
            </TrainingField>
            <TrainingField label="Fecha de fin *" feedback={feedback('end_date')}>
              <input type="date" {...control('end_date')} min={form.start_date || undefined} required />
            </TrainingField>
            <TrainingField label="Hora de inicio *" feedback={feedback('start_time')}>
              <input type="time" {...control('start_time')} required />
            </TrainingField>
            <TrainingField label="Hora de fin *" feedback={feedback('end_time')}>
              <input type="time" {...control('end_time')} required />
            </TrainingField>
            <TrainingField label="Modalidad *" feedback={feedback('modality')}>
              <select {...control('modality')}>
                {Object.entries(modalityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </TrainingField>
            <TrainingField label="Capacidad de personas *" feedback={feedback('capacity')}>
              <input type="number" {...control('capacity')} min={1} max={10000} step={1} required />
            </TrainingField>
            <TrainingField label="Lugar o enlace *" feedback={feedback('location')} wide>
              <input {...control('location')} required maxLength={240} placeholder="Dirección, sala o enlace de reunión" />
            </TrainingField>
            <TrainingField
              label="Instructor"
              feedback={feedback('instructor_id')}
              hint="La asignación es opcional; se muestran instructores activos."
              wide
            >
              <select {...control('instructor_id')} disabled={lookupLoading}>
                <option value="">{lookupLoading ? 'Cargando instructores…' : 'Sin asignar'}</option>
                {training?.instructor_id && !instructors.some((person) => person.id === training.instructor_id) && (
                  <option value={training.instructor_id}>{training.instructor_name ?? `Instructor #${training.instructor_id}`}</option>
                )}
                {instructors.map((person) => <option key={person.id} value={person.id}>{person.first_name} {person.last_name}</option>)}
              </select>
            </TrainingField>
          </div>
          <p className="form-required">* Campos obligatorios. Los cambios se validan al guardar.</p>
          {(form.status === 'cancelada' || form.status === 'finalizada') && (
            <Notice message="Al guardar este estado, la capacitación quedará cerrada y no admitirá más ediciones." kind="info" />
          )}
        </div>
        <div className="modal-actions">
          <button type="button" className="button secondary" disabled={saving} onClick={onClose}>Cancelar</button>
          <button type="submit" className="button primary" disabled={saving}>
            {saving ? 'Guardando…' : training ? 'Guardar cambios' : 'Crear capacitación'}<Icon name="check" size={18} />
          </button>
        </div>
      </form>
    </Modal>
  );
}
