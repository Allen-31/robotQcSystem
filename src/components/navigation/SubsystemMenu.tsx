import { Menu } from 'antd';
import type { MenuProps } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { buildOpenKeys, collectRoutes, matchSelectedPath } from '../../logic/menu/menuRoute';
import type { MenuNode } from '../../shared/types/menu';

function mapToMenuItems(nodes: MenuNode[]): MenuProps['items'] {
  return nodes.map((node) => {
    const key = node.path ?? node.id;
    const label = node.path ? <Link to={node.path}>{node.name}</Link> : node.name;

    if (node.children?.length) {
      return {
        key,
        label,
        children: mapToMenuItems(node.children),
      };
    }

    return {
      key,
      label,
    };
  });
}

interface SubsystemMenuProps {
  nodes: MenuNode[];
}

export function SubsystemMenu({ nodes }: SubsystemMenuProps) {
  const { pathname } = useLocation();
  const routes = collectRoutes(nodes);

  return (
    <Menu
      mode="inline"
      items={mapToMenuItems(nodes)}
      selectedKeys={matchSelectedPath(pathname, routes)}
      defaultOpenKeys={buildOpenKeys(pathname, nodes)}
      style={{ borderRight: 0 }}
    />
  );
}
