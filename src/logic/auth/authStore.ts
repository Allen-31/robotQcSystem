import { loginAccountList } from '../../data/deployConfig/loginAccountList';
import { setCurrentRole } from '../deployConfig/permissionStore';

const AUTH_STORAGE_KEY = 'robot-qc-auth-user';
export const AUTH_CHANGED_EVENT = 'robot-qc-auth-changed';

export interface AuthUser {
  username: string;
  displayName: string;
  role: string;
}

function emitAuthChanged() {
  window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT));
}

export function getCurrentUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed || typeof parsed.username !== 'string' || typeof parsed.role !== 'string') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function login(username: string, password: string): { success: true; user: AuthUser } | { success: false } {
  const matched = loginAccountList.find((item) => item.username === username && item.password === password);
  if (!matched) {
    return { success: false };
  }
  const user: AuthUser = {
    username: matched.username,
    displayName: matched.displayName,
    role: matched.role,
  };
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  setCurrentRole(user.role);
  emitAuthChanged();
  return { success: true, user };
}

export function logout() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  emitAuthChanged();
}

