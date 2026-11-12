let csrfToken = '';

export class ApiError extends Error {
  constructor(public status: number, message: string, public fields?: Record<string, string | string[]>) {
    super(message);
  }
}

export function setCsrfToken(token: string) { csrfToken = token; }

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set('Content-Type', 'application/json');
  if (options.method && options.method !== 'GET' && csrfToken) headers.set('X-CSRF-Token', csrfToken);
  let response: Response;
  try {
    response = await fetch(`/api${path}`, { ...options, headers, credentials: 'same-origin' });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. Comprueba que la API esté en ejecución.');
  }
  let payload: unknown;
  try { payload = await response.json(); } catch {
    throw new ApiError(response.status, 'El servidor devolvió una respuesta inesperada.');
  }
  if (!response.ok) {
    const failure = payload as { error?: { message?: string; fields?: Record<string, string | string[]> } };
    if (response.status === 401 && path !== '/auth/login' && path !== '/auth/me') {
      window.dispatchEvent(new Event('session-expired'));
    }
    throw new ApiError(response.status, failure.error?.message ?? 'No se pudo completar la operación.', failure.error?.fields);
  }
  return payload as T;
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError && error.fields) {
    const details = Object.entries(error.fields).map(([field, value]) => `${field}: ${Array.isArray(value) ? value.join(', ') : value}`);
    return `${error.message} ${details.join('. ')}`;
  }
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado. Inténtalo nuevamente.';
}
