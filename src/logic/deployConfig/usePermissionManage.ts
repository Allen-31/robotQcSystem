import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DataNode } from 'antd/es/tree';
import { menuList } from '../../data/menuList';
import { topMenus } from '../../data/topMenus';
import {
  getRoleListApi,
  getRolePermissionsApi,
  saveRolePermissionsApi,
  type RoleListItem,
} from '../../shared/api/roleApi';
import type { PermissionAction } from '../../shared/types/deployConfig';
import type { MenuNode } from '../../shared/types/menu';
import { setRolePermissionConfig } from './permissionStore';

interface PermissionMenuNode {
  key: string;
  titleKey: string;
  children?: PermissionMenuNode[];
}

function mapMenuNode(node: MenuNode, depth: number): PermissionMenuNode {
  const key = String(node.path ?? node.id ?? '');
  const titleKey = node.name ?? '';
  if (depth >= 3 || !node.children?.length) {
    return { key, titleKey };
  }

  return {
    key,
    titleKey,
    children: node.children.map((item) => mapMenuNode(item, depth + 1)),
  };
}

function toTreeData(nodes: PermissionMenuNode[], resolveTitle: (titleKey: string) => string): DataNode[] {
  return nodes.map((node) => {
    const key = node.key ?? '';
    return {
      key,
      title: resolveTitle(node.titleKey ?? ''),
      children: node.children?.length ? toTreeData(node.children, resolveTitle) : undefined,
    };
  });
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

export interface UsePermissionManageOptions {
  fixedRole?: string;
}

type CheckedKeyByRole = Record<string, string[]>;
type PermissionMapByRole = Record<string, Record<string, PermissionAction[]>>;

function apiPermissionsToState(apiList: { menuKey: string; actions: string[] }[]): {
  checkedKeys: string[];
  permissionMap: Record<string, PermissionAction[]>;
} {
  const checkedKeys = apiList.map((p) => p.menuKey);
  const permissionMap: Record<string, PermissionAction[]> = {};
  apiList.forEach((p) => {
    permissionMap[p.menuKey] = (p.actions ?? []) as PermissionAction[];
  });
  return { checkedKeys, permissionMap };
}

function stateToApiPermissions(checkedKeys: string[], permissionMap: Record<string, PermissionAction[]>): { menuKey: string; actions: string[] }[] {
  return checkedKeys.map((menuKey) => ({
    menuKey,
    actions: permissionMap[menuKey] ?? [],
  }));
}

export function usePermissionManage(options: UsePermissionManageOptions = {}) {
  const { fixedRole } = options;

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

  const [roleList, setRoleList] = useState<RoleListItem[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const roleOptions = useMemo(() => roleList.map((r) => ({ label: r.name, value: r.code })), [roleList]);
  const [selectedRole, setSelectedRole] = useState<string>(() => fixedRole ?? '');
  const [selectedKey, setSelectedKey] = useState<string | null>(rootNodes[0]?.key ?? null);
  const [checkedKeyByRole, setCheckedKeyByRole] = useState<CheckedKeyByRole>({});
  const [permissionMapByRole, setPermissionMapByRole] = useState<PermissionMapByRole>({});

  const fetchRoles = useCallback(async () => {
    setRolesLoading(true);
    try {
      const res = await getRoleListApi();
      const list = Array.isArray(res.data) ? res.data : [];
      setRoleList(list);
      if (list.length > 0 && !selectedRole) {
        setSelectedRole(fixedRole ?? list[0].code);
      }
      if (fixedRole && list.some((r) => r.code === fixedRole)) {
        setSelectedRole(fixedRole);
      }
    } catch {
      setRoleList([]);
    } finally {
      setRolesLoading(false);
    }
  }, [fixedRole]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    if (fixedRole) {
      setSelectedRole(fixedRole);
    }
  }, [fixedRole]);

  const fetchPermissions = useCallback(
    async (roleCode: string) => {
      setPermissionsLoading(true);
      try {
        const res = await getRolePermissionsApi(roleCode);
        const list = Array.isArray(res.data) ? res.data : [];
        let keys: string[];
        let map: Record<string, PermissionAction[]>;
        if (list.length === 0 && (roleCode === 'admin' || roleCode === 'ROLE-001')) {
          keys = [...allKeys];
          map = {};
          keys.forEach((k) => {
            map[k] = ['display'];
          });
        } else {
          const next = apiPermissionsToState(list);
          keys = next.checkedKeys;
          map = next.permissionMap;
        }
        setCheckedKeyByRole((prev) => ({ ...prev, [roleCode]: keys }));
        setPermissionMapByRole((prev) => ({ ...prev, [roleCode]: map }));
      } catch {
        setCheckedKeyByRole((prev) => ({ ...prev, [roleCode]: [] }));
        setPermissionMapByRole((prev) => ({ ...prev, [roleCode]: {} }));
      } finally {
        setPermissionsLoading(false);
      }
    },
    [allKeys],
  );

  useEffect(() => {
    if (selectedRole) {
      fetchPermissions(selectedRole);
    }
  }, [selectedRole, fetchPermissions]);

  useEffect(() => {
    if (fixedRole && roleList.length > 0 && !roleList.some((r) => r.code === selectedRole)) {
      setSelectedRole(fixedRole);
    }
  }, [fixedRole, roleList, selectedRole]);

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

  const savePermissionsToBackend = useCallback(async () => {
    if (!selectedRole) return;
    const keys = checkedKeyByRole[selectedRole] ?? [];
    const map = permissionMapByRole[selectedRole] ?? {};
    const payload = stateToApiPermissions(keys, map);
    await saveRolePermissionsApi(selectedRole, payload);
    setRolePermissionConfig(selectedRole, { checkedKeys: keys, permissionMap: map });
  }, [selectedRole, checkedKeyByRole, permissionMapByRole]);

  const memberCount = useMemo(
    () => roleList.find((r) => r.code === selectedRole)?.memberCount ?? 0,
    [roleList, selectedRole],
  );

  return {
    rootNodes,
    titleMap,
    parentMap,
    allKeys,
    roleList,
    rolesLoading,
    permissionsLoading,
    roleOptions,
    selectedRole,
    setSelectedRole,
    memberCount,
    savePermissionsToBackend,
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
