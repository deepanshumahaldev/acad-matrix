import { api, configureAuth } from '@/lib/apiClient';
import type { SessionPayload, User } from './types';

export interface SessionState {
  status: 'loading' | 'authenticated' | 'anonymous';
  user: User | null;
}

/** The access token lives only in memory (never localStorage); the refresh token is an httpOnly cookie. */
let accessToken: string | null = null;
let state: SessionState = { status: 'loading', user: null };
const listeners = new Set<() => void>();

const publish = (next: SessionState) => {
  state = next;
  listeners.forEach((l) => l());
};

export const getSessionState = () => state;
export const subscribeSession = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};

export function setSession(payload: SessionPayload) {
  accessToken = payload.accessToken;
  publish({ status: 'authenticated', user: payload.user });
}

export function clearSession() {
  accessToken = null;
  publish({ status: 'anonymous', user: null });
}

let inFlight: Promise<string | null> | null = null;

/**
 * Exchanges the refresh cookie for a new access token. Shared by app start-up and the API client's 401 retry,
 * and de-duplicated: the server rotates the cookie on every call, so two parallel refreshes would look like token theft.
 */
export function refreshSession(): Promise<string | null> {
  inFlight ??= api
    .post<SessionPayload>('/api/v1/auth/refresh')
    .then((res) => {
      setSession(res.data);
      return res.data.accessToken;
    })
    .catch(() => {
      clearSession();
      return null;
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

configureAuth({
  getAccessToken: () => accessToken,
  refresh: refreshSession,
  onAuthFailure: clearSession,
});
