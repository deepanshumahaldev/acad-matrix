import { env } from './env';

/** Mirrors the backend error envelope: { success: false, error: { code, message, details? }, requestId }. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface SuccessEnvelope<T> {
  success: true;
  data: T;
  meta?: { page: number; limit: number; total: number; totalPages: number };
}

type TokenProvider = {
  getAccessToken: () => string | null;
  /** Returns a new access token, or null if the session cannot be refreshed. Wired up in Phase 2. */
  refresh: () => Promise<string | null>;
  onAuthFailure: () => void;
};

let tokens: TokenProvider = {
  getAccessToken: () => null,
  refresh: async () => null,
  onAuthFailure: () => undefined,
};

export const configureAuth = (provider: TokenProvider) => {
  tokens = provider;
};

/** Endpoints where a 401 is a real answer (bad credentials / expired session), not a stale access token. */
const NO_REFRESH = /^\/api\/v1\/auth\/(login|verify-otp|resend-otp|forgot-password|reset-password|refresh|logout)/;

let refreshInFlight: Promise<string | null> | null = null;

async function send(path: string, init: RequestInit, token: string | null): Promise<Response> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(`${env.apiUrl}${path}`, { ...init, headers, credentials: 'include' });
}

async function parse<T>(res: Response): Promise<SuccessEnvelope<T>> {
  if (res.status === 204) return { success: true, data: undefined as unknown as T };
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.success) {
    const err = body?.error;
    throw new ApiError(
      res.status,
      err?.code ?? 'UNKNOWN_ERROR',
      err?.message ?? res.statusText ?? 'Request failed',
      err?.details,
      body?.requestId,
    );
  }
  return body as SuccessEnvelope<T>;
}

/** Single entry point for all API calls. On 401 it refreshes once (de-duplicated) and retries. */
export async function request<T>(path: string, init: RequestInit = {}): Promise<SuccessEnvelope<T>> {
  let res = await send(path, init, tokens.getAccessToken());

  if (res.status === 401 && !NO_REFRESH.test(path)) {
    refreshInFlight ??= tokens.refresh().finally(() => {
      refreshInFlight = null;
    });
    const fresh = await refreshInFlight;
    if (!fresh) {
      tokens.onAuthFailure();
      return parse<T>(res);
    }
    res = await send(path, init, fresh);
  }
  return parse<T>(res);
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body === undefined ? undefined : JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
