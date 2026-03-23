import type { PermissionAction } from '../../shared/types/deployConfig';
import { getRolePermissionConfig, type RolePermissionConfig } from './permissionStore';
import { useCurrentRole } from './useCurrentRole';

function hasPermissionInConfig(
  config: RolePermissionConfig | null,
  menuKey: string,
  action: PermissionAction,
): boolean {
  if (!config) {
    return true;
  }

  const checkedKeys = new Set(config.checkedKeys ?? []);
  const actions = config.permissionMap?.[menuKey] ?? [];

  if (action === 'display') {
    return checkedKeys.has(menuKey) || actions.includes('display');
  }

  if (!checkedKeys.has(menuKey)) {
    return false;
  }

  return actions.includes(action);
}

export function usePermission() {
  const { currentRole } = useCurrentRole();
  const config = getRolePermissionConfig(currentRole);

  const can = (menuKey: string, action: PermissionAction = 'display') => {
    if (!menuKey) {
      return false;
    }
    return hasPermissionInConfig(config, menuKey, action);
  };

  return {
    role: currentRole,
    can,
  };
}
