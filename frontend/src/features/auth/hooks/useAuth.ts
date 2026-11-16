import { useCallback, useSyncExternalStore } from 'react';
import { logout as logoutRequest } from '../api/authApi';
import { clearSession, getSessionState, subscribeSession } from '../session';

export function useAuth() {
  const state = useSyncExternalStore(subscribeSession, getSessionState, getSessionState);
  const signOut = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      clearSession(); // even if the request fails, this device is signed out locally
    }
  }, []);
  return { ...state, signOut };
}
