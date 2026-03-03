import { useMemo, useState } from 'react';
import type { DataNode } from 'antd/es/tree';
import { menuList } from '../../data/menuList';
import { topMenus } from '../../data/topMenus';
import type { PermissionAction } from '../../shared/types/deployConfig';
import type { MenuNode } from '../../shared/types/menu';
import { getStoredPermissionConfig } from './permissionStore';
import { getStoredRoles } from './roleStore';

interface PermissionMenuNode {
  key: string;
  titleKey: string;
  children?: PermissionMenuNode[];
}

function mapMenuNode(node: MenuNode, depth: number): PermissionMenuNode {
  const key = node.path ?? node.id;
  if (depth >= 3 || !node.children?.length) {
    return { key, titleKey: node.name };
  }

  return {
    key,
    titleKey: node.name,
    children: node.children.map((item) => mapMenuNode(item, depth + 1)),
  };
}

function toTreeData(nodes: PermissionMenuNode[], resolveTitle: (titleKey: string) => string): DataNode[] {
  return nodes.map((node) => ({
    key: node.key,
    title: resolveTitle(node.titleKey),
    children: node.children ? toTreeData(node.children, resolveTitle) : undefined,
  }));
}

function buildTitleMap(nodes: PermissionMenuNode[]): Record<string, string> {
  const result: Record<string, string> = {};
  const dfs = (items: PermissionMenuNode[]) => {
    items.forEach((item) => {
      result[item.key] = item.titleKey;
      if (item.children?.length) {
        dfs(item.children);
      }
    });
  };
  dfs(nodes);
  return result;
}

function buildParentMap(nodes: PermissionMenuNode[]): Record<string, string | null> {
  const result: Record<string, string | null> = {};
  const dfs = (items: PermissionMenuNode[], parentKey: string | null) => {
    items.forEach((item) => {
      result[item.key] = parentKey;
      if (item.children?.length) {
        dfs(item.children, item.key);
      }
    });
  };
  dfs(nodes, null);
  return result;
}

function buildChildrenMap(nodes: PermissionMenuNode[]): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  const dfs = (items: PermissionMenuNode[]) => {
    items.forEach((item) => {
      result[item.key] = item.children?.map((child) => child.key) ?? [];
      if (item.children?.length) {
        dfs(item.children);
      }
    });
  };
  dfs(nodes);
  return result;
}

function collectAllKeys(nodes: PermissionMenuNode[]): string[] {
  const keys: string[] = [];
  const dfs = (items: PermissionMenuNode[]) => {
    items.forEach((item) => {
      keys.push(item.key);
      if (item.children?.length) {
        dfs(item.children);
      }
    });
  };
  dfs(nodes);
  return keys;
}

export function usePermissionManage() {
  const storedPermissionConfig = useMemo(() => getStoredPermissionConfig(), []);

  const rootNodes = useMemo(() => {
    return topMenus.map((topMenu) => {
      const matchedNode = menuList.find((item) => item.code === topMenu.key);
      if (matchedNode) {
        return mapMenuNode(matchedNode, 1);
      }

      return {
        key: topMenu.basePath,
        titleKey: topMenu.name,
      };
    });
  }, []);

  const titleMap = useMemo(() => buildTitleMap(rootNodes), [rootNodes]);
  const parentMap = useMemo(() => buildParentMap(rootNodes), [rootNodes]);
  const childrenMap = useMemo(() => buildChildrenMap(rootNodes), [rootNodes]);
  const allKeys = useMemo(() => collectAllKeys(rootNodes), [rootNodes]);

  const defaultRoles = useMemo(() => getStoredRoles().map((item) => item.name), []);

  const [roles, setRoles] = useState<string[]>(defaultRoles);
  const roleOptions = useMemo(() => roles.map((role) => ({ label: role, value: role })), [roles]);
  const [selectedRole, setSelectedRole] = useState<string>(roles[0] ?? '管理员');
  const [selectedKey, setSelectedKey] = useState<string | null>(rootNodes[0]?.key ?? null);
  const [checkedKeyByRole, setCheckedKeyByRole] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(Object.entries(storedPermissionConfig).map(([role, config]) => [role, config.checkedKeys])),
  );
  const [permissionMapByRole, setPermissionMapByRole] = useState<Record<string, Record<string, PermissionAction[]>>>(() =>
    Object.fromEntries(Object.entries(storedPermissionConfig).map(([role, config]) => [role, config.permissionMap])),
  );

  const checkedKeys = checkedKeyByRole[selectedRole] ?? [];

  const setCheckedKeys = (keys: string[]) => {
    setCheckedKeyByRole((prev) => ({ ...prev, [selectedRole]: keys }));
  };

  const addCheckedKey = (key: string) => {
    setCheckedKeys(Array.from(new Set([...checkedKeys, key])));
  };

  const setNodePermissions = (key: string, permissions: PermissionAction[]) => {
    setPermissionMapByRole((prev) => ({
      ...prev,
      [selectedRole]: {
        ...(prev[selectedRole] ?? {}),
        [key]: permissions,
      },
    }));
  };

  const patchNodePermissions = (entries: Record<string, PermissionAction[]>) => {
    setPermissionMapByRole((prev) => ({
      ...prev,
      [selectedRole]: {
        ...(prev[selectedRole] ?? {}),
        ...entries,
      },
    }));
  };

  const setPermissionMapForSelectedRole = (permissionMap: Record<string, PermissionAction[]>) => {
    setPermissionMapByRole((prev) => ({
      ...prev,
      [selectedRole]: permissionMap,
    }));
  };

  const getNodePermissions = (key: string | null) => {
    if (!key) {
      return [];
    }
    return permissionMapByRole[selectedRole]?.[key] ?? [];
  };

  const getAncestorKeys = (key: string): string[] => {
    const ancestors: string[] = [];
    let current = parentMap[key];
    while (current) {
      ancestors.push(current);
      current = parentMap[current];
    }
    return ancestors;
  };

  const getDescendantKeys = (key: string): string[] => {
    const descendants: string[] = [];
    const walk = (currentKey: string) => {
      const children = childrenMap[currentKey] ?? [];
      children.forEach((childKey) => {
        descendants.push(childKey);
        walk(childKey);
      });
    };
    walk(key);
    return descendants;
  };

  const setPermissionsForSubtree = (key: string, permissions: PermissionAction[]) => {
    const targetKeys = [key, ...getDescendantKeys(key)];
    setPermissionMapByRole((prev) => {
      const nextRoleMap = { ...(prev[selectedRole] ?? {}) };
      targetKeys.forEach((itemKey) => {
        nextRoleMap[itemKey] = permissions;
      });
      return {
        ...prev,
        [selectedRole]: nextRoleMap,
      };
    });
  };

  const setActionForKeys = (keys: string[], action: PermissionAction, enabled: boolean) => {
    setPermissionMapByRole((prev) => {
      const nextRoleMap = { ...(prev[selectedRole] ?? {}) };
      keys.forEach((key) => {
        const current = new Set(nextRoleMap[key] ?? []);
        if (enabled) {
          current.add(action);
        } else {
          current.delete(action);
        }
        nextRoleMap[key] = Array.from(current);
      });
      return {
        ...prev,
        [selectedRole]: nextRoleMap,
      };
    });
  };

  return {
    rootNodes,
    titleMap,
    parentMap,
    allKeys,
    roles,
    roleOptions,
    selectedRole,
    setSelectedRole,
    checkedKeys,
    setCheckedKeys,
    addCheckedKey,
    selectedKey,
    setSelectedKey,
    permissionMapByRole,
    permissionMapForSelectedRole: permissionMapByRole[selectedRole] ?? {},
    setNodePermissions,
    patchNodePermissions,
    setPermissionMapForSelectedRole,
    setActionForKeys,
    setPermissionsForSubtree,
    getNodePermissions,
    getAncestorKeys,
    getDescendantKeys,
    toTreeData,
  };
}
