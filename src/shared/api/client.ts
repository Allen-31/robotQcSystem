/**
 * 请求基础路径。开发时可在 .env 中设置 VITE_API_BASE_URL，如 http://localhost:8080/api
 */
const BASE_URL =
  (typeof import.meta !== 'undefined' && (import.meta as { env?: Record<string, string> }).env?.VITE_API_BASE_URL) ||
  'http://localhost:8080/api';

const TOKEN_STORAGE_KEY = 'robot-qc-auth-token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export interface PageData<T> {
  list: T[];
  total: number;
  pageNum: number;
  pageSize: number;
  pages: number;
}

/** 401 时回调（如跳转登录），默认跳转登录页 */
let onUnauthorized: (() => void) | null = () => {
  window.location.href = '/home/login';
};

export function setOnUnauthorized(callback: () => void): void {
  onUnauthorized = callback;
}

export async function request<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {},
): Promise<ApiResponse<T>> {
  const { skipAuth, ...init } = options;
  const url = path.startsWith('http') ? path : `${BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  const headers = new Headers(init.headers as HeadersInit);
  if (!headers.has('Content-Type') && (init.body && typeof init.body === 'string')) {
    headers.set('Content-Type', 'application/json');
  }
  if (!skipAuth) {
    const token = getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const res = await fetch(url, {
    ...init,
    headers,
  });

  const body = (await res.json().catch(() => ({}))) as ApiResponse<T>;

  if (res.status === 401) {
    setToken(null);
    if (!skipAuth) {
      onUnauthorized?.();
    }
    throw new Error(body?.message || '未授权');
  }

  if (body.code !== undefined && body.code !== 200) {
    throw new Error(body.message || '请求失败');
  }

  return body;
}

export function get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<ApiResponse<T>> {
  const search = params
    ? '?' +
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
    : '';
  return request<T>(path + search, { method: 'GET' });
}

export function post<T>(path: string, body?: object): Promise<ApiResponse<T>> {
  return request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
}

export function put<T>(path: string, body?: object): Promise<ApiResponse<T>> {
  return request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined });
}

export function del<T>(path: string): Promise<ApiResponse<T>> {
  return request<T>(path, { method: 'DELETE' });
}
