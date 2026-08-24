export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface LoginResult {
  authenticated: boolean;
}

export interface RecurringLogResult {
  transaction: import('./types').Transaction;
  recurring: import('./types').RecurringTemplate;
}

/**
 * Single authenticated API helper. Same-origin cookies only; no CORS config needed.
 * Throws `ApiError` on non-2xx responses, carrying the server's JSON error message.
 */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('Content-Type') ?? '';
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : null;

  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'error' in payload
      ? String((payload as { error: unknown }).error)
      : `Request failed with status ${response.status}`;
    throw new ApiError(response.status, message);
  }

  return payload as T;
}

export const apiPaths = {
  session: '/api/session',
  data: '/api/data',
} as const;
