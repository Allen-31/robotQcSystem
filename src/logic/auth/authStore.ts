import { setCurrentRole, setRolePermissionConfigFromApi } from '../deployConfig/permissionStore';
import { getToken, setToken } from '../../shared/api/client';
import { getMeApi, loginApi, logoutApi } from '../../shared/api/authApi';
import { getRolePermissionsApi } from '../../shared/api/roleApi';
import { useUserStore, type AuthUser } from '../../store/userStore';

export const AUTH_CHANGED_EVENT = 'robot-qc-auth-changed';

function emitAuthChanged() {
  window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT));
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  return value as Record<string, unknown>;
}

function toStringSafe(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return null;
}

function sanitizeToken(value: string): string {
  return value.replace(/^Bearer\s+/i, '').trim();
}

function toRoles(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => toStringSafe(item))
      .filter((item): item is string => Boolean(item));
  }
  const str = toStringSafe(value);
  if (!str) {
    return [];
  }
  return str
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function hasUserIdentity(record: Record<string, unknown>): boolean {
  return Boolean(
    toStringSafe(record.code) ??
      toStringSafe(record.username) ??
      toStringSafe(record.userCode) ??
      toStringSafe(record.loginName),
  );
}

function findTokenDeep(value: unknown, depth = 0): string | null {
  if (depth > 4 || value == null) {
    return null;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const token = findTokenDeep(item, depth + 1);
      if (token) {
        return token;
      }
    }
    return null;
  }

  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const directToken =
    toStringSafe(record.accessToken) ??
    toStringSafe(record.access_token) ??
    toStringSafe(record.token) ??
    toStringSafe(record.idToken) ??
    toStringSafe(record.id_token) ??
    toStringSafe(record.jwt) ??
    toStringSafe(record.authorization) ??
    toStringSafe(record.authToken);
  if (directToken) {
    return sanitizeToken(directToken);
  }

  for (const [key, nested] of Object.entries(record)) {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('refresh')) {
      continue;
    }
    if (lowerKey.includes('token')) {
      const tokenLike = toStringSafe(nested);
      if (tokenLike) {
        return sanitizeToken(tokenLike);
      }
    }
  }

  for (const nested of Object.values(record)) {
    const token = findTokenDeep(nested, depth + 1);
    if (token) {
      return token;
    }
  }

  return null;
}

function findUserRecordDeep(value: unknown, depth = 0): Record<string, unknown> | null {
  if (depth > 4 || value == null) {
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findUserRecordDeep(item, depth + 1);
      if (found) {
        return found;
      }
    }
    return null;
  }

  const record = asRecord(value);
  if (!record) {
    return null;
  }

  if (hasUserIdentity(record)) {
    return record;
  }

  const preferredKeys = ['user', 'userInfo', 'currentUser', 'account', 'principal', 'profile'];
  for (const key of preferredKeys) {
    const nested = record[key];
    const found = findUserRecordDeep(nested, depth + 1);
    if (found) {
      return found;
    }
  }

  for (const nested of Object.values(record)) {
    const found = findUserRecordDeep(nested, depth + 1);
    if (found) {
      return found;
    }
  }

  return null;
}

function mapAuthUser(value: unknown, fallbackUsername?: string): AuthUser | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const roles = toRoles(record.roles ?? record.roleCodes ?? record.authorities);
  const username =
    toStringSafe(record.code) ??
    toStringSafe(record.username) ??
    toStringSafe(record.userCode) ??
    fallbackUsername ??
    '';

  if (!username) {
    return null;
  }

  const displayName =
    toStringSafe(record.displayName) ??
    toStringSafe(record.name) ??
    toStringSafe(record.nickname) ??
    username;

  const role = roles[0] ?? toStringSafe(record.role) ?? username;

  return {
    username,
    displayName,
    role,
    roles,
  };
}

export function getCurrentUser(): AuthUser | null {
  const current = useUserStore.getState().user;
  if (current) {
    return current;
  }
  return useUserStore.getState().hydrateFromStorage();
}

export async function login(
  username: string,
  password: string,
  remember?: boolean,
): Promise<{ success: true; user: AuthUser } | { success: false; message?: string }> {
  try {
    const res = await loginApi({ username, password, remember });
    const token = findTokenDeep(res.data) ?? getToken();
    const userRecord = findUserRecordDeep(res.data) ?? asRecord(res.data);
    const user =
      mapAuthUser(userRecord, username) ??
      (token
        ? {
            username,
            displayName: username,
            role: username,
            roles: [username],
          }
        : null);

    if (!token) {
      return { success: false, message: 'Login succeeded but token is missing in response' };
    }

    if (!user) {
      return { success: false, message: 'Login succeeded but user info is missing in response' };
    }

    setToken(sanitizeToken(token));
    useUserStore.getState().setUser(user);
    setCurrentRole(user.role);

    try {
      const permRes = await getRolePermissionsApi(user.role);
      if (permRes?.data && Array.isArray(permRes.data)) {
        setRolePermissionConfigFromApi(user.role, permRes.data);
      }
    } catch {
      // Permission loading failure should not block login.
    }

    emitAuthChanged();
    return { success: true, user };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Login failed';
    const fallback = 'Username or password is incorrect';
    const displayMsg = msg && msg !== 'Unauthorized' && msg !== 'Request failed' ? msg : fallback;
    return { success: false, message: displayMsg };
  }
}

export async function logout(): Promise<void> {
  if (getToken()) {
    try {
      await logoutApi();
    } catch {
      // Ignore network errors and still clear local auth state.
    }
  }

  setToken(null);
  useUserStore.getState().clearUser();
  emitAuthChanged();
}

export async function refreshCurrentUser(): Promise<AuthUser | null> {
  if (!getToken()) return getCurrentUser();
  try {
    const res = await getMeApi();
    const user = mapAuthUser(res.data);
    if (!user) return getCurrentUser();

    useUserStore.getState().setUser(user);
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
