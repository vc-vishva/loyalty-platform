import { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import api, { tokenStore, apiError } from '../api/client';
import type { User, TokenBundle, Role } from '../types';

const USER_KEY = 'cowork.user';

interface AuthState {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: Role) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

function readUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as User) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readUser());

  function persist(u: User, tokens: TokenBundle) {
    tokenStore.set(tokens);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
  }

  const value = useMemo<AuthState>(
    () => ({
      user,
      async login(email, password) {
        try {
          const res = await api.post('/auth/login', { email, password });
          persist(res.data.data.user, res.data.data.tokens);
        } catch (err) {
          throw new Error(apiError(err));
        }
      },
      async register(name, email, password, role) {
        try {
          const res = await api.post('/auth/register', { name, email, password, role });
          persist(res.data.data.user, res.data.data.tokens);
        } catch (err) {
          throw new Error(apiError(err));
        }
      },
      async logout() {
        try {
          if (tokenStore.refresh) {
            await api.post('/auth/logout', { refreshToken: tokenStore.refresh });
          }
        } catch {
          // ignore — clear locally regardless
        }
        tokenStore.clear();
        localStorage.removeItem(USER_KEY);
        setUser(null);
      },
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
