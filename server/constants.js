export const PERMISSIONS = {
  'users.manage': 'Gestionar usuarios',
  'roles.manage': 'Gestionar roles y permisos',
  'trainings.manage': 'Gestionar capacitaciones',
  'trainings.view_all': 'Consultar todas las capacitaciones',
  'people.manage': 'Gestionar instructores y participantes',
  'teaching.manage': 'Consultar capacitaciones asignadas como instructor',
  'learning.view': 'Consultar capacitaciones inscritas',
  'history.view': 'Consultar historial de trabajadores',
  'reports.view': 'Consultar reportes',
  'certificates.manage': 'Gestionar certificados',
};
export const ROLES = [
  { code: 'administrador', name: 'Administrador', permissions: Object.keys(PERMISSIONS) },
  { code: 'coordinador', name: 'Coordinador', permissions: ['trainings.manage', 'trainings.view_all', 'people.manage', 'certificates.manage'] },
  { code: 'instructor', name: 'Instructor', permissions: ['teaching.manage'] },
  { code: 'participante', name: 'Participante', permissions: ['learning.view'] },
  { code: 'rrhh', name: 'Recursos humanos', permissions: ['history.view', 'trainings.view_all', 'reports.view'] },
  { code: 'gerencia', name: 'Gerencia', permissions: ['reports.view', 'trainings.view_all'] },
];
export const TRAINING_STATUSES = ['planificada', 'programada', 'en_curso', 'finalizada', 'cancelada'];
export const MODALITIES = ['presencial', 'virtual', 'hibrida'];
export const ATTENDANCE_STATUSES = ['presente', 'ausente', 'tardanza'];
export const GRADE_MIN = 0;
export const GRADE_MAX = 20;
export const PASSING_GRADE = 14;
export const MIN_ATTENDANCE = 80;
export const TRANSITIONS = {
  planificada: ['programada', 'cancelada'],
  programada: ['planificada', 'en_curso', 'cancelada'],
  en_curso: ['finalizada', 'cancelada'],
  finalizada: [],
  cancelada: [],
};
