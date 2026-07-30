import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { TokenBundle } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || '/v1';
const ACCESS_KEY = 'cowork.access';
const REFRESH_KEY = 'cowork.refresh';

export const tokenStore = {
  get access(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  },
  get refresh(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  },
  set(tokens: TokenBundle) {
    localStorage.setItem(ACCESS_KEY, tokens.access.token);
    localStorage.setItem(REFRESH_KEY, tokens.refresh.token);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

const api = axios.create({ baseURL: BASE_URL });

// Attach the access token to every request.
api.interceptors.request.use((config) => {
  const token = tokenStore.access;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, try a single refresh + retry. If that fails, clear session.
let refreshing: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const refresh = tokenStore.refresh;
  if (!refresh) return null;
  try {
    const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken: refresh });
    const tokens = res.data.data.tokens as TokenBundle;
    tokenStore.set(tokens);
    return tokens.access.token;
  } catch {
    tokenStore.clear();
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const isAuthCall = original?.url?.includes('/auth/');
    if (error.response?.status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      refreshing = refreshing || doRefresh();
      const newToken = await refreshing;
      refreshing = null;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  }
);

/** Extract the human-readable message from an API error. */
export function apiError(err: unknown): string {
  const e = err as AxiosError<{ message?: string }>;
  return e.response?.data?.message || e.message || 'Something went wrong';
}

export default api;
