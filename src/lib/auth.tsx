import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
  api, clearTokens, get, getStoredRefreshToken, refreshAccessToken, saveTokens, setSessionExpiredHandler,
} from './api';
import { IDLE_TIMEOUT_MS } from './config';
import { registerForPush, unregisterPush } from './push';
import type { User } from './types';

type AuthState = {
  user: User | null;
  ready: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: (reason?: string) => Promise<void>;
  reloadUser: () => Promise<void>;
  signOutReason: string | null;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [signOutReason, setSignOutReason] = useState<string | null>(null);
  const backgroundedAt = useRef<number | null>(null);

  const signOut = useCallback(async (reason?: string) => {
    await unregisterPush();
    const refresh = await getStoredRefreshToken();
    if (refresh) {
      // Blacklist the refresh token on the server; ignore network failures.
      api('/auth/token/blacklist/', { method: 'POST', body: { refresh }, auth: false }).catch(() => {});
    }
    await clearTokens();
    setUser(null);
    setSignOutReason(reason ?? null);
  }, []);

  const reloadUser = useCallback(async () => {
    setUser(await get<User>('/auth/me/'));
  }, []);

  // Restore a saved session on launch.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null);
      setSignOutReason('Your session has expired. Please sign in again.');
    });
    (async () => {
      try {
        if (await getStoredRefreshToken()) {
          const token = await refreshAccessToken();
          if (token) {
            setUser(await get<User>('/auth/me/'));
            registerForPush();
          }
        }
      } catch {
        // stay signed out
      } finally {
        setReady(true);
      }
    })();
    return () => setSessionExpiredHandler(null);
  }, []);

  // Auto-logout after a long time in the background.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        backgroundedAt.current ??= Date.now();
      } else if (state === 'active') {
        const since = backgroundedAt.current;
        backgroundedAt.current = null;
        if (user && since && Date.now() - since > IDLE_TIMEOUT_MS) {
          signOut('You were signed out after 30 minutes of inactivity.');
        }
      }
    });
    return () => sub.remove();
  }, [user, signOut]);

  const signIn = useCallback(async (username: string, password: string) => {
    const data = await api<{ access: string; refresh: string; user: User }>('/auth/token/', {
      method: 'POST',
      body: { username: username.trim(), password },
      auth: false,
    });
    await saveTokens(data.access, data.refresh);
    setSignOutReason(null);
    setUser(data.user);
    registerForPush();
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, signIn, signOut, reloadUser, signOutReason }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export const isApprover = (u: User | null) => !!u && u.role !== 'EMPLOYEE';
