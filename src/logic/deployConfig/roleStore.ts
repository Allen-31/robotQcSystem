import type { RoleManageRecord } from '../../shared/types/deployConfig';

const STORAGE_KEY = 'robot-qc-role-list';

export function getStoredRoles(): RoleManageRecord[] {
  const defaults: RoleManageRecord[] = [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaults;
    }

    const parsed = JSON.parse(raw) as RoleManageRecord[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return defaults;
    }

    const validParsed = parsed.filter((item) => item && typeof item.name === 'string' && item.name.trim().length > 0);
    if (validParsed.length === 0) {
      return defaults;
    }

    return validParsed;
  } catch {
    return defaults;
  }
}

export function setStoredRoles(roles: RoleManageRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(roles));
}
