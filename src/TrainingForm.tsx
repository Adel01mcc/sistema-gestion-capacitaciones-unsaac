import { useEffect, useId, useState, type ChangeEvent, type ComponentProps, type FormEvent, type ReactNode } from 'react';
import { ApiError, errorMessage, request } from './api';
import { Field, Icon, Modal, Notice } from './components';
import {
  initialTrainingStatuses, initialTrainingValues, toTrainingPayload, trainingEditStatuses, validateTrainingForm,
  type TrainingFieldErrors, type TrainingFieldName, type TrainingPayload,
} from './trainingForm.ts';
import { modalityLabels, statusLabels, type ListResponse, type Training, type User } from './types';

type InstructorOption = Pick<User, 'id' | 'first_name' | 'last_name' | 'active'>;
type FieldFeedback = { id: string; message: string };
type TrainingFormProps = {
  training: Training | null;
  onClose: () => void;
  onSubmit: (payload: TrainingPayload) => Promise<void>;
  onConsultCurrent?: () => void;
  currentVersion?: ReactNode;
};

function TrainingField({ feedback, wide, ...props }: ComponentProps<typeof Field> & { feedback?: FieldFeedback }) {
  return (
    <div className={wide ? 'wide' : undefined}>
      <Field {...props} />
      {feedback && <p id={feedback.id} className="training-field-error" role="alert">{feedback.message}</p>}
    </div>
  );
}

export function TrainingForm({ training, onClose, onSubmit, onConsultCurrent, currentVersion }: TrainingFormProps) {
  const [form, setForm] = useState(() => initialTrainingValues(training));
  const [instructors, setInstructors] = useState<InstructorOption[]>([]);
  const [lookupFailure, setLookupFailure] = useState<{ message: string; canRetry: boolean } | null>(null);
  const [lookupLoading, setLookupLoading] = useState(true);
  const [lookupAttempt, setLookupAttempt] = useState(0);
  const [rejectedInstructorId, setRejectedInstructorId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<TrainingFieldErrors>({});
  const [stateConflict, setStateConflict] = useState(false);
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
    loadInstructors().then((people) => {
      if (active) {
        const eligible = people.filter((person) => person.active);
        setInstructors(eligible);
        setRejectedInstructorId((id) => eligible.some((person) => String(person.id) === id) ? '' : id);
      }
    })
      .catch((failure) => {
        if (active) setLookupFailure({
          message: errorMessage(failure),
          canRetry: !(failure instanceof ApiError && failure.status === 403),
        });
      })
      .finally(() => { if (active) setLookupLoading(false); });
    return () => { active = false; };
  }, [lookupAttempt]);

  const assignedId = training?.instructor_id?.toString() ?? '';
  const assignedName = training?.instructor_name ?? `Instructor #${assignedId}`;
  const eligibleInstructors = instructors.filter((person) => String(person.id) !== rejectedInstructorId);
  const assignmentUnavailable = Boolean(assignedId && (
    assignedId === rejectedInstructorId ||
    (!lookupLoading && !lookupFailure && !eligibleInstructors.some((person) => String(person.id) === assignedId))
  ));
  const selectedInstructorMissing = Boolean(form.instructor_id &&
    !eligibleInstructors.some((person) => String(person.id) === form.instructor_id));
  const instructorNeedsChange = Boolean(training && form.instructor_id && (
    form.instructor_id === rejectedInstructorId || (!lookupLoading && !lookupFailure && selectedInstructorMissing)
  ));
  const submitBlocked = saving || stateConflict || instructorNeedsChange ||
    Boolean(training && form.instructor_id && lookupLoading);

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
    if (submitBlocked) return;
    setError('');
    const errors = validateTrainingForm(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      await onSubmit(toTrainingPayload(form));
    } catch (failure) {
      if (training && failure instanceof ApiError) {
        if (failure.status === 409 && (failure.fields?.status || !failure.fields)) {
          setStateConflict(true);
          setError('El estado de la capacitación cambió mientras la editabas. El borrador sigue abierto. Consulta la versión vigente.');
          return;
        }
        if (failure.status === 422 && failure.fields?.instructor_id) {
          setRejectedInstructorId(form.instructor_id);
        }
      }
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

  const allowedStatuses = training ? trainingEditStatuses[training.status] : initialTrainingStatuses;
  return (
    <Modal
      title={training ? 'Editar capacitación' : 'Nueva capacitación'}
      description="Organiza los datos y la programación de la actividad."
      onClose={() => { if (!saving) onClose(); }}
    >
      <form onSubmit={submit}>
        <div className="modal-body">
          <Notice message={error} />
          {stateConflict && (currentVersion || <button type="button" className="button secondary small" onClick={onConsultCurrent}>
            Consultar versión vigente
          </button>)}
          {lookupFailure && <>
            <Notice message={training
              ? `No se pudo consultar el catálogo de instructores. ${lookupFailure.message}`
              : lookupFailure.message} kind={training ? 'error' : 'info'} />
            {training && lookupFailure.canRetry && <button type="button" className="button secondary small" onClick={() => {
              setLookupLoading(true);
              setLookupFailure(null);
              setLookupAttempt((value) => value + 1);
            }}>Reintentar catálogo</button>}
          </>}
          {assignmentUnavailable && <Notice kind="info" message={
            `Asignación actual: ${assignedName}. El instructor está inactivo o ya no es elegible. Selecciona un instructor activo o «Sin asignar» para retirarlo.`
          } />}
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
                {selectedInstructorMissing && <option value={form.instructor_id} disabled={instructorNeedsChange}>
                  {form.instructor_id === assignedId ? assignedName : `Instructor #${form.instructor_id}`}
                  {instructorNeedsChange ? ' (no elegible)' : ' (sin verificar)'}
                </option>}
                {eligibleInstructors.map((person) => <option key={person.id} value={person.id}>{person.first_name} {person.last_name}</option>)}
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
          <button type="submit" className="button primary" disabled={submitBlocked}>
            {saving ? 'Guardando…' : training ? 'Guardar cambios' : 'Crear capacitación'}<Icon name="check" size={18} />
          </button>
        </div>
      </form>
    </Modal>
  );
}
