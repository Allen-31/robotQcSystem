import { Menu } from 'antd';
import type { MenuProps } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import { buildOpenKeys, collectRoutes, matchSelectedPath } from '../../logic/menu/menuRoute';
import type { MenuNode } from '../../shared/types/menu';

function mapToMenuItems(nodes: MenuNode[], translate: (key: string) => string): MenuProps['items'] {
  return nodes.map((node) => {
    const key = node.path ?? node.id;
    const labelText = translate(node.name);
    const label = node.path ? <Link to={node.path}>{labelText}</Link> : labelText;

    if (node.children?.length) {
      return {
        key,
        label,
        children: mapToMenuItems(node.children, translate),
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
  const { t } = useI18n();
  const routes = collectRoutes(nodes);

  return (
    <Menu
      mode="inline"
      items={mapToMenuItems(nodes, t)}
      selectedKeys={matchSelectedPath(pathname, routes)}
      defaultOpenKeys={buildOpenKeys(pathname, nodes)}
      style={{ borderRight: 0 }}
    />
  );
}
