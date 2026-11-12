export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  document: string | null;
  active: boolean;
  department: string;
  specialty: string;
  roles: string[];
  permissions: string[];
}

export interface Role {
  id: number;
  code: string;
  name: string;
  permissions: string[];
}

export interface Permission { code: string; name: string }
export type TrainingStatus = 'planificada' | 'programada' | 'en_curso' | 'finalizada' | 'cancelada';
export interface Training {
  id: number;
  code: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  modality: 'presencial' | 'virtual' | 'hibrida';
  location: string;
  capacity: number;
  status: TrainingStatus;
  instructor_id: number | null;
  instructor_name: string | null;
  responsible_id: number;
  enrolled_count: number;
  available_seats: number;
}

export interface PageMeta { page: number; pageSize: number; total: number; totalPages: number }
export interface ListResponse<T> { data: T[]; meta: PageMeta }
export interface DashboardData {
  trainings: number;
  users: number;
  roles: number;
  enrollments: number;
  certificates: number;
  upcoming: Training[];
}

export const statusLabels: Record<TrainingStatus, string> = {
  planificada: 'Planificada', programada: 'Programada', en_curso: 'En curso',
  finalizada: 'Finalizada', cancelada: 'Cancelada',
};
export const roleLabels: Record<string, string> = {
  administrador: 'Administrador', coordinador: 'Coordinador', instructor: 'Instructor',
  participante: 'Participante', rrhh: 'Recursos humanos', gerencia: 'Gerencia',
};
export const modalityLabels = { presencial: 'Presencial', virtual: 'Virtual', hibrida: 'Híbrida' };
