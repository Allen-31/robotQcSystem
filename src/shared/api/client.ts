import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig, type Method } from 'axios';

/**
 * Request base URL.
 * Priority: VITE_API_BASE_URL -> current host + :8080/api -> localhost fallback.
 */
function resolveBaseUrl(): string {
  const envBaseUrl =
    typeof import.meta !== 'undefined' ? (import.meta as { env?: Record<string, string> }).env?.VITE_API_BASE_URL?.trim() : '';
  if (envBaseUrl) {
    return envBaseUrl.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined' && window.location?.hostname) {
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    return `${protocol}//${window.location.hostname}:8080/api`;
  }

  return 'http://localhost:8080/api';
}

const BASE_URL = resolveBaseUrl();
const TOKEN_STORAGE_KEY = 'robot-qc-auth-token';

type InternalRequestConfig = InternalAxiosRequestConfig & {
  skipAuth?: boolean;
  retry?: number;
  _retryCount?: number;
};

export interface RequestOptions {
  method?: Method;
  headers?: Record<string, string>;
  body?: string | object;
  params?: Record<string, string | number | undefined>;
  skipAuth?: boolean;
  retry?: number;
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

function isSuccessCode(code: unknown): boolean {
  return code === 200 || code === '200' || code === 0 || code === '0';
}

function isNumericCode(value: unknown): boolean {
  if (typeof value === 'number') {
    return Number.isFinite(value);
  }
  if (typeof value === 'string') {
    return /^\d+$/.test(value.trim());
  }
  return false;
}

function normalizeMessage(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value.trim() : 'ok';
}

function normalizeAuthToken(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const text = value.trim();
  if (!text) {
    return null;
  }
  return text.replace(/^Bearer\s+/i, '');
}

function readHeader(headers: unknown, key: string): string | null {
  const normalizedKey = key.toLowerCase();
  const record = headers as
    | {
        get?: (name: string) => string | null;
        [k: string]: unknown;
      }
    | undefined;

  if (!record) {
    return null;
  }

  if (typeof record.get === 'function') {
    const value = record.get(key) ?? record.get(normalizedKey);
    const token = normalizeAuthToken(value);
    if (token) {
      return token;
    }
  }

  const direct = record[key] ?? record[normalizedKey];
  if (Array.isArray(direct)) {
    for (const item of direct) {
      const token = normalizeAuthToken(item);
      if (token) {
        return token;
      }
    }
    return null;
  }

  return normalizeAuthToken(direct);
}

function isEnvelopePayload(payload: Record<string, unknown>): boolean {
  const code = payload.code;
  if (isNumericCode(code)) {
    return true;
  }

  const status = payload.status;
  if (!isNumericCode(status)) {
    return false;
  }

  return 'message' in payload || 'data' in payload;
}

let onUnauthorized: (() => void) | null = () => {
  window.location.href = '/home/login';
};

let pendingRequestCount = 0;
const loadingListeners = new Set<(pendingCount: number) => void>();

function notifyLoadingChange() {
  loadingListeners.forEach((listener) => listener(pendingRequestCount));
}

function startRequest() {
  pendingRequestCount += 1;
  notifyLoadingChange();
}

function endRequest() {
  pendingRequestCount = Math.max(0, pendingRequestCount - 1);
  notifyLoadingChange();
}

function shouldRetry(error: AxiosError, config: InternalRequestConfig): boolean {
  const maxRetry = config.retry ?? (config.method?.toUpperCase() === 'GET' ? 1 : 0);
  const currentRetry = config._retryCount ?? 0;
  if (currentRetry >= maxRetry) {
    return false;
  }

  const status = error.response?.status;
  if (!status) {
    return true;
  }

  return status >= 500;
}

const httpClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
});

httpClient.interceptors.request.use((config) => {
  const internalConfig = config as InternalRequestConfig;
  startRequest();

  if (!internalConfig.skipAuth) {
    const token = getToken();
    if (token) {
      if (typeof internalConfig.headers.set === 'function') {
        internalConfig.headers.set('Authorization', `Bearer ${token}`);
      } else {
        internalConfig.headers = {
          ...(internalConfig.headers ?? {}),
          Authorization: `Bearer ${token}`,
        } as InternalRequestConfig['headers'];
      }
    }
  }

  return internalConfig;
});

httpClient.interceptors.response.use(
  (response) => {
    const url = response.config.url ?? '';
    if (url.includes('auth/login')) {
      const headerToken = readHeader(response.headers, 'Authorization');
      if (headerToken) {
        setToken(headerToken);
      }
    }

    endRequest();
    return response;
  },
  async (error: AxiosError) => {
    endRequest();

    const config = (error.config ?? {}) as InternalRequestConfig;

    if (shouldRetry(error, config)) {
      config._retryCount = (config._retryCount ?? 0) + 1;
      return httpClient.request(config);
    }

    if (error.response?.status === 401) {
      setToken(null);
      if (!config.skipAuth) {
        onUnauthorized?.();
      }
      throw new Error((error.response?.data as { message?: string } | undefined)?.message || 'Unauthorized');
    }

    const responseMessage =
      (error.response?.data as { message?: string } | undefined)?.message ??
      error.message ??
      'Request failed';
    throw new Error(responseMessage);
  },
);

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

export function setOnUnauthorized(callback: () => void): void {
  onUnauthorized = callback;
}

export function subscribeRequestLoading(listener: (pendingCount: number) => void): () => void {
  loadingListeners.add(listener);
  listener(pendingRequestCount);
  return () => loadingListeners.delete(listener);
}

export function getPendingRequestCount(): number {
  return pendingRequestCount;
}

function parseBody(body: RequestOptions['body']): unknown {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }
  return body;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const { method = 'GET', headers, body, params, skipAuth, retry } = options;

  const response = await httpClient.request<ApiResponse<T> | T>({
    url: path,
    method,
    headers,
    data: parseBody(body),
    params,
    skipAuth,
    retry,
  } as AxiosRequestConfig);

  const payload = response.data;

  if (payload && typeof payload === 'object') {
    const rawPayload = payload as Record<string, unknown>;
    if (isEnvelopePayload(rawPayload)) {
      const codeValue = ('code' in rawPayload ? rawPayload.code : rawPayload.status) as unknown;
      const message = normalizeMessage(rawPayload.message);
      if (!isSuccessCode(codeValue)) {
        throw new Error(message || 'Request failed');
      }

      const data = ('data' in rawPayload ? rawPayload.data : payload) as T;
      return {
        code: Number(codeValue),
        message,
        data,
      };
    }
  }

  return {
    code: 200,
    message: 'ok',
    data: payload as T,
  };
}

export function get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<ApiResponse<T>> {
  return request<T>(path, { method: 'GET', params });
}

export function post<T>(path: string, body?: object): Promise<ApiResponse<T>> {
  return request<T>(path, { method: 'POST', body });
}

export function put<T>(path: string, body?: object): Promise<ApiResponse<T>> {
  return request<T>(path, { method: 'PUT', body });
}

export function del<T>(path: string): Promise<ApiResponse<T>> {
  return request<T>(path, { method: 'DELETE' });
}
