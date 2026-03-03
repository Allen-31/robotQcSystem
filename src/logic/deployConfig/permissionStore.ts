import type { PermissionAction } from '../../shared/types/deployConfig';
import { menuList } from '../../data/menuList';
import { getStoredRoles } from './roleStore';

export interface RolePermissionConfig {
  checkedKeys: string[];
  permissionMap: Record<string, PermissionAction[]>;
}

type PermissionConfigByRole = Record<string, RolePermissionConfig>;

const PERMISSION_CONFIG_STORAGE_KEY = 'robot-qc-permission-config';
const CURRENT_ROLE_STORAGE_KEY = 'robot-qc-current-role';

export const PERMISSION_UPDATED_EVENT = 'robot-qc-permission-updated';
export const CURRENT_ROLE_CHANGED_EVENT = 'robot-qc-current-role-changed';

function emit(eventName: string) {
  window.dispatchEvent(new CustomEvent(eventName));
}

function normalizeConfig(config: RolePermissionConfig): RolePermissionConfig {
  return {
    checkedKeys: Array.from(new Set(config.checkedKeys)),
    permissionMap: Object.fromEntries(
      Object.entries(config.permissionMap ?? {}).map(([key, actions]) => [key, Array.from(new Set(actions ?? []))]),
    ),
  };
}

function collectKeysByNode(nodes: typeof menuList): string[] {
  const keys: string[] = [];
  const walk = (items: typeof menuList) => {
    items.forEach((node) => {
      keys.push(node.path ?? node.id);
      if (node.children?.length) {
        walk(node.children as typeof menuList);
      }
    });
  };
  walk(nodes);
  return keys;
}

function findNodeByCode(code: string) {
  return menuList.find((item) => item.code === code);
}

function collectSubtreeKeys(code: string): string[] {
  const root = findNodeByCode(code);
  if (!root) {
    return [];
  }
  const keys: string[] = [];
  const walk = (node: typeof root) => {
    keys.push(node.path ?? node.id);
    (node.children ?? []).forEach((child) => walk(child as typeof root));
  };
  walk(root);
  return keys;
}

function buildDefaultCheckedKeys(role: string): string[] {
  if (role === '管理员') {
    return [...collectKeysByNode(menuList), '/operationMonitoring'];
  }
  if (role === '质检员') {
    return collectSubtreeKeys('qualityInspection');
  }
  if (role === '工艺工程师') {
    const quality = collectSubtreeKeys('qualityInspection');
    const deploy = collectSubtreeKeys('deployConfig').filter(
      (key) => String(key).includes('/deployConfig/scene') || String(key).includes('/deployConfig/robot') || String(key) === '/deployConfig',
    );
    return Array.from(new Set([...quality, ...deploy]));
  }
  if (role === '运维工程师') {
    return [...collectSubtreeKeys('operationMaintenance'), '/operationMonitoring', ...collectSubtreeKeys('dataStatistics')];
  }
  return [];
}

function buildDefaultPermissionConfig(): PermissionConfigByRole {
  const byRole: PermissionConfigByRole = {};
  getStoredRoles().forEach((role) => {
    const checkedKeys = buildDefaultCheckedKeys(role.name);
    const permissionMap: Record<string, PermissionAction[]> = {};
    checkedKeys.forEach((key) => {
      permissionMap[key] = ['display'];
    });
    byRole[role.name] = { checkedKeys, permissionMap };
  });
  return byRole;
}

export function getStoredPermissionConfig(): PermissionConfigByRole {
  const defaults = buildDefaultPermissionConfig();
  try {
    const raw = localStorage.getItem(PERMISSION_CONFIG_STORAGE_KEY);
    if (!raw) {
      return defaults;
    }
    const parsed = JSON.parse(raw) as PermissionConfigByRole;
    if (!parsed || typeof parsed !== 'object') {
      return defaults;
    }
    const normalized: PermissionConfigByRole = { ...defaults };
    Object.entries(parsed).forEach(([role, config]) => {
      if (!config || !Array.isArray(config.checkedKeys)) {
        return;
      }
      normalized[role] = normalizeConfig(config);
    });
    return normalized;
  } catch {
    return defaults;
  }
}

export function getRolePermissionConfig(role: string): RolePermissionConfig | null {
  const all = getStoredPermissionConfig();
  return all[role] ?? null;
}

export function setRolePermissionConfig(role: string, config: RolePermissionConfig) {
  const all = getStoredPermissionConfig();
  all[role] = normalizeConfig(config);
  localStorage.setItem(PERMISSION_CONFIG_STORAGE_KEY, JSON.stringify(all));
  emit(PERMISSION_UPDATED_EVENT);
}

export function getCurrentRole(): string {
  const roleNames = getStoredRoles().map((item) => item.name);
  if (!roleNames.length) {
    return '管理员';
  }
  const raw = localStorage.getItem(CURRENT_ROLE_STORAGE_KEY);
  if (raw && roleNames.includes(raw)) {
    return raw;
  }
  return roleNames[0];
}

export function setCurrentRole(role: string) {
  localStorage.setItem(CURRENT_ROLE_STORAGE_KEY, role);
  emit(CURRENT_ROLE_CHANGED_EVENT);
}
