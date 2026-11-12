import * as SecureStore from 'expo-secure-store';
import { fetch as expoFetch } from 'expo/fetch';
import { API_URL } from './config';

const REFRESH_KEY = 'gw.refresh_token';

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;
let onSessionExpired: (() => void) | null = null;

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(status: number, data: any, message?: string) {
    super(message ?? extractMessage(data) ?? `Request failed (${status})`);
    this.status = status;
    this.data = data;
  }
}

/** Turns DRF error payloads ({detail}, {field: [msg]}, [msg]) into one readable sentence. */
function extractMessage(data: any): string | undefined {
  if (!data) return undefined;
  if (typeof data === 'string') return data.length < 300 ? data : undefined;
  if (typeof data.detail === 'string') return data.detail;
  if (Array.isArray(data)) return data.join(' ');
  const parts = Object.entries(data)
    .filter(([, v]) => Array.isArray(v) || typeof v === 'string')
    .map(([k, v]) => `${k === 'non_field_errors' ? '' : k + ': '}${Array.isArray(v) ? v.join(' ') : v}`);
  return parts.length ? parts.join('\n') : undefined;
}

export function setSessionExpiredHandler(fn: (() => void) | null) {
  onSessionExpired = fn;
}

export async function saveTokens(access: string, refresh: string) {
  accessToken = access;
  await SecureStore.setItemAsync(REFRESH_KEY, refresh);
}

export async function clearTokens() {
  accessToken = null;
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

export async function getStoredRefreshToken() {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

/** Exchanges the stored refresh token for a new access token (single-flight). */
export function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refresh = await getStoredRefreshToken();
      if (!refresh) return null;
      try {
        const res = await fetch(`${API_URL}/auth/token/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ refresh }),
        });
        if (!res.ok) {
          // Only discard the token if the server rejected it, not on network errors.
          if (res.status === 401 || res.status === 400) await clearTokens();
          return null;
        }
        const data = await res.json();
        accessToken = data.access;
        // ROTATE_REFRESH_TOKENS is on: the server returns a new refresh token each time.
        if (data.refresh) await SecureStore.setItemAsync(REFRESH_KEY, data.refresh);
        return accessToken;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

type Options = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  form?: FormData;
  auth?: boolean;
};

async function send(path: string, opts: Options, token: string | null) {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token && opts.auth !== false) headers.Authorization = `Bearer ${token}`;
  const url = path.startsWith('http') ? path : `${API_URL}${path}`;

  if (opts.form) {
    // expo/fetch supports FormData containing expo-file-system File objects.
    return expoFetch(url, { method: opts.method ?? 'POST', headers, body: opts.form as any });
  }
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  return fetch(url, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
}

async function parse(res: { headers: { get(name: string): string | null }; text(): Promise<string> }) {
  const text = await res.text();
  if (!text) return null;
  const type = res.headers.get('content-type') ?? '';
  if (type.includes('application/json')) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  return text;
}

export async function api<T = any>(path: string, opts: Options = {}): Promise<T> {
  let res;
  try {
    res = await send(path, opts, accessToken);
    if (res.status === 401 && opts.auth !== false) {
      const fresh = await refreshAccessToken();
      if (!fresh) {
        onSessionExpired?.();
        throw new ApiError(401, null, 'Your session has expired. Please sign in again.');
      }
      res = await send(path, opts, fresh);
    }
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(0, null, `Cannot reach the Great Waters server at ${API_URL}. Check your connection.`);
  }

  const data = await parse(res);
  if (!res.ok) throw new ApiError(res.status, data);
  return data as T;
}

export const get = <T = any>(path: string) => api<T>(path);
export const post = <T = any>(path: string, body?: unknown) => api<T>(path, { method: 'POST', body: body ?? {} });
export const patch = <T = any>(path: string, body: unknown) => api<T>(path, { method: 'PATCH', body });
export const del = <T = any>(path: string) => api<T>(path, { method: 'DELETE' });
export const upload = <T = any>(path: string, form: FormData) => api<T>(path, { method: 'POST', form });

/** DRF list views may return either an array or a paginated {results} object. */
export function asList<T>(data: any): T[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}
