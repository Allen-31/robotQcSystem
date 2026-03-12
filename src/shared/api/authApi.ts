import { get, post, request } from './client';

export interface LoginRequest {
  username: string;
  password: string;
  remember?: boolean;
}

export interface AuthUserInfo {
  code: string;
  displayName: string;
  roles: string[];
}

export interface LoginData {
  token: string;
  user: AuthUserInfo;
}

/** 登录 */
export function loginApi(body: LoginRequest) {
  return request<LoginData>('auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
    skipAuth: true,
  });
}

/** 登出 */
export function logoutApi() {
  return post<{ success: boolean }>('auth/logout');
}

/** 获取当前用户信息 */
export function getMeApi() {
  return get<AuthUserInfo>('auth/me');
}
