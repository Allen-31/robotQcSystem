import type { MenuNode, RouteMeta } from '../../shared/types/menu';

function walkMenu(nodes: MenuNode[], visitor: (node: MenuNode, parentPath: string[]) => void, parentPath: string[] = []): void {
  for (const node of nodes) {
    visitor(node, parentPath);
    if (node.children?.length) {
      walkMenu(node.children, visitor, [...parentPath, node.path ?? node.id]);
    }
  }
}

export function collectRoutes(nodes: MenuNode[]): RouteMeta[] {
  const routes: RouteMeta[] = [];
  walkMenu(nodes, (node) => {
    if (!node.path) {
      return;
    }
    routes.push({
      id: node.id,
      name: node.name,
      code: node.code,
      path: node.path,
      permission: node.permission,
    });
  });
  return routes;
}

export function findFirstLeafPath(nodes: MenuNode[]): string {
  for (const node of nodes) {
    if (node.children?.length) {
      const childPath = findFirstLeafPath(node.children);
      if (childPath) {
        return childPath;
      }
    }
    if (node.path) {
      return node.path;
    }
  }
  return '/';
}

export function findFirstLeafPathByCode(nodes: MenuNode[], code: string): string {
  const target = nodes.find((node) => node.code === code);
  if (!target) {
    return '/';
  }
  return target.children?.length ? findFirstLeafPath(target.children) : (target.path ?? '/');
}

export function getTopMenuNodeByPath(nodes: MenuNode[], pathname: string): MenuNode | undefined {
  const sorted = [...nodes]
    .filter((node) => Boolean(node.path))
    .sort((a, b) => (b.path?.length ?? 0) - (a.path?.length ?? 0));

  return sorted.find((node) => {
    if (!node.path) {
      return false;
    }
    return pathname === node.path || pathname.startsWith(`${node.path}/`);
  });
}

export function matchSelectedPath(pathname: string, routes: RouteMeta[]): string[] {
  const candidates = routes
    .map((item) => item.path)
    .sort((a, b) => b.length - a.length);

  const matched = candidates.find((path) => pathname === path || pathname.startsWith(`${path}/`));
  return matched ? [matched] : [];
}

export function buildOpenKeys(pathname: string, nodes: MenuNode[]): string[] {
  let result: string[] = [];

  const dfs = (items: MenuNode[], parents: string[]): boolean => {
    for (const node of items) {
      const key = node.path ?? node.id;
      const currentParents = [...parents, key];

      if (node.path && (pathname === node.path || pathname.startsWith(`${node.path}/`))) {
        result = parents;
        return true;
      }

      if (node.children?.length && dfs(node.children, currentParents)) {
        if (result.length === 0) {
          result = currentParents;
        }
        return true;
      }
    }
    return false;
  };

  dfs(nodes, []);
  return result;
}
