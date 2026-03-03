import { menuList } from '../../data/menuList';
import type { TopMenuItem } from '../../data/topMenus';
import { getRolePermissionConfig } from '../deployConfig/permissionStore';
import type { MenuNode } from '../../shared/types/menu';

function collectNodeKeys(node: MenuNode): string[] {
  const keys = [node.path ?? node.id];
  (node.children ?? []).forEach((child) => {
    keys.push(...collectNodeKeys(child));
  });
  return keys;
}

export function filterMenuTreeByRole(nodes: MenuNode[], role: string): MenuNode[] {
  const config = getRolePermissionConfig(role);
  if (!config) {
    return nodes;
  }

  const checkedKeys = new Set(config.checkedKeys ?? []);

  const walk = (node: MenuNode): MenuNode | null => {
    const key = node.path ?? node.id;
    const visibleChildren = (node.children ?? []).map(walk).filter((item): item is MenuNode => Boolean(item));
    const selfVisible = checkedKeys.has(key);

    if (visibleChildren.length > 0 || selfVisible) {
      return {
        ...node,
        children: visibleChildren.length ? visibleChildren : undefined,
      };
    }
    return null;
  };

  return nodes.map(walk).filter((item): item is MenuNode => Boolean(item));
}

export function filterTopMenusByRole(items: TopMenuItem[], role: string): TopMenuItem[] {
  const config = getRolePermissionConfig(role);
  if (!config) {
    return items;
  }

  const checkedKeys = new Set(config.checkedKeys ?? []);
  return items.filter((item) => {
    if (checkedKeys.has(item.basePath)) {
      return true;
    }

    const rootNode = menuList.find((node) => node.code === item.key);
    if (!rootNode) {
      return checkedKeys.has(item.basePath);
    }

    return collectNodeKeys(rootNode).some((key) => checkedKeys.has(key));
  });
}

