import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../infrastructure/api/repositories';
import type { AuthUser } from '../../domain/entities';

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  login: (identifier: string, password: string, remember: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  can: (permission: string) => boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();

  const refresh = useCallback(async () => {
    try {
      const { user: fresh } = await authApi.me();
      setUser(fresh);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(
    async (identifier: string, password: string, remember: boolean) => {
      const { user: fresh } = await authApi.login(identifier, password, remember);
      setUser(fresh);
      void qc.invalidateQueries();
    },
    [qc],
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    void qc.invalidateQueries();
  }, [qc]);

  const can = useCallback(
    (permission: string) => !!user && (user.role === 'ADMIN' || user.permissions.includes('*') || user.permissions.includes(permission)),
    [user],
  );

  const value = useMemo(() => ({ user, loading, login, logout, refresh, can }), [user, loading, login, logout, refresh, can]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
