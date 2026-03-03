import { roleList } from '../../data/deployConfig/roleList';
import type { RoleManageRecord } from '../../shared/types/deployConfig';

const STORAGE_KEY = 'robot-qc-role-list';

function cloneDefaultRoles(): RoleManageRecord[] {
  return roleList.map((item) => ({ ...item }));
}

export function getStoredRoles(): RoleManageRecord[] {
  const defaults = cloneDefaultRoles();
  const defaultNames = new Set(defaults.map((item) => item.name));

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

    const hasAnyDefaultRole = validParsed.some((item) => defaultNames.has(item.name));
    if (!hasAnyDefaultRole) {
      // Compatibility fallback: old mojibake/local cache without current role names.
      return defaults;
    }

    const byName = new Map<string, RoleManageRecord>();
    validParsed.forEach((item) => byName.set(item.name, item));
    defaults.forEach((item) => {
      if (!byName.has(item.name)) {
        byName.set(item.name, item);
      }
    });

    return Array.from(byName.values());
  } catch {
    return defaults;
  }
}

export function setStoredRoles(roles: RoleManageRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(roles));
}
