import { setCurrentRole, setRolePermissionConfigFromApi } from '../deployConfig/permissionStore';
import { getToken, setToken } from '../../shared/api/client';
import { getMeApi, loginApi, logoutApi } from '../../shared/api/authApi';
import { getRolePermissionsApi } from '../../shared/api/roleApi';

const AUTH_STORAGE_KEY = 'robot-qc-auth-user';
export const AUTH_CHANGED_EVENT = 'robot-qc-auth-changed';

export interface AuthUser {
  username: string;
  displayName: string;
  role: string;
  roles?: string[];
}

function emitAuthChanged() {
  window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT));
}

export function getCurrentUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed || typeof parsed.username !== 'string' || typeof parsed.role !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * 登录：表单提交到后端 POST /api/auth/login，后端用 Keycloak 换 token 后返回；前端存 token 与用户信息。
 */
export async function login(
  username: string,
  password: string,
  remember?: boolean,
): Promise<{ success: true; user: AuthUser } | { success: false; message?: string }> {
  try {
    const res = await loginApi({ username, password, remember });
    const data = res.data;
    if (!data?.token || !data?.user) {
      return { success: false, message: res.message || '登录响应异常' };
    }
    setToken(data.token);
    const user: AuthUser = {
      username: data.user.code,
      displayName: data.user.displayName,
      role: data.user.roles?.[0] ?? data.user.code,
      roles: data.user.roles,
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    setCurrentRole(user.role);
    try {
      const permRes = await getRolePermissionsApi(user.role);
      if (permRes?.data && Array.isArray(permRes.data)) {
        setRolePermissionConfigFromApi(user.role, permRes.data);
      }
    } catch {
      // 权限接口失败仅不更新本地权限，不影响登录
    }
    emitAuthChanged();
    return { success: true, user };
  } catch (e) {
    const msg = e instanceof Error ? e.message : '登录失败';
    const fallback = '用户名或密码错误';
    const displayMsg =
      msg && msg !== '未授权' && msg !== '请求失败' ? msg : fallback;
    return { success: false, message: displayMsg };
  }
}

/**
 * 登出：清空本地 token 与用户状态；可选调用 POST /api/auth/logout。
 */
export async function logout(): Promise<void> {
  if (getToken()) {
    try {
      await logoutApi();
    } catch {
      // 忽略网络错误，仍清除本地
    }
  }
  setToken(null);
  localStorage.removeItem(AUTH_STORAGE_KEY);
  emitAuthChanged();
}

/**
 * 从后端刷新当前用户信息（需已登录），仍调用 GET /api/auth/me，带 Authorization: Bearer <token>。
 */
export async function refreshCurrentUser(): Promise<AuthUser | null> {
  if (!getToken()) return getCurrentUser();
  try {
    const res = await getMeApi();
    const data = res.data;
    if (!data) return getCurrentUser();
    const user: AuthUser = {
      username: data.code,
      displayName: data.displayName,
      role: data.roles?.[0] ?? data.code,
      roles: data.roles,
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    setCurrentRole(user.role);
    try {
      const permRes = await getRolePermissionsApi(user.role);
      if (permRes?.data && Array.isArray(permRes.data)) {
        setRolePermissionConfigFromApi(user.role, permRes.data);
      }
    } catch {
      // ignore
    }
    emitAuthChanged();
    return user;
  } catch {
    return getCurrentUser();
  }
}
