import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, csrf, installRefresh, refreshOnce, setToken } from '../../services/api';
import type { User } from '../../types';
type Auth = {
  user: User | null;
  pending: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  sync: () => Promise<void>;
  resetToken: string;
  setResetToken: (s: string) => void;
};
const Context = createContext<Auth | null>(null);
export const useAuth = () => {
  const value = useContext(Context);
  if (!value) throw new Error('Auth provider missing');
  return value;
};
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [pending, setPending] = useState(true);
  const [resetToken, setResetToken] = useState('');
  const queryClient = useQueryClient();
  const sync = useCallback(async () => {
    const { data } = await api.get<User>('/auth/me');
    setUser(data);
  }, []);
  const renew = useCallback(async () => {
    try {
      const headers = await csrf();
      const { data } = await api.post<{ accessToken: string }>(
        '/auth/refresh',
        {},
        { headers: { ...headers, Authorization: '' } },
      );
      setToken(data.accessToken);
      await sync();
    } catch (e) {
      setToken(null);
      setUser(null);
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] === 'admin' });
      throw e;
    }
  }, [sync, queryClient]);
  useEffect(() => {
    installRefresh(renew);
    const restore = async () => {
      const { data } = await api.get<{ hasRefreshSession: boolean }>('/auth/config', {
        headers: { Authorization: '' },
      });
      if (data.hasRefreshSession) await refreshOnce(renew);
      else {
        setToken(null);
        setUser(null);
      }
    };
    void restore()
      .catch(() => {})
      .finally(() => setPending(false));
  }, [renew]);
  const login = async (email: string, password: string) => {
    setToken(null);
    const { data } = await api.post<{ accessToken: string }>(
      '/auth/login',
      { email, password },
      { headers: await csrf() },
    );
    setToken(data.accessToken);
    await sync();
  };
  const logout = async () => {
    await api.post('/auth/logout', {}, { headers: { ...(await csrf()), Authorization: '' } });
    setToken(null);
    setUser(null);
    setResetToken('');
    queryClient.clear();
  };
  return (
    <Context.Provider value={{ user, pending, login, logout, sync, resetToken, setResetToken }}>
      {children}
    </Context.Provider>
  );
}
