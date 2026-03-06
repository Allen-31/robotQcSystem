import { HomeOutlined } from '@ant-design/icons';
import { Menu } from 'antd';
import type { MenuProps } from 'antd';
import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import { menuList } from '../../data/menuList';
import { useCurrentRole } from '../../logic/deployConfig/useCurrentRole';
import { filterMenuTreeByRole } from '../../logic/menu/menuPermission';
import { buildOpenKeys, collectRoutes, matchSelectedPath } from '../../logic/menu/menuRoute';
import type { MenuNode } from '../../shared/types/menu';
import { resolveMenuNodeIcon } from './menuIcon';

function mapToMenuItems(nodes: MenuNode[], translate: (key: string) => string): MenuProps['items'] {
  return nodes.map((node) => {
    const key = node.path ?? node.id;
    const labelText = translate(node.name);
    const label = node.path ? <Link to={node.path}>{labelText}</Link> : labelText;

    if (node.children?.length) {
      return {
        key,
        icon: resolveMenuNodeIcon(node),
        label,
        children: mapToMenuItems(node.children, translate),
      };
    }

    return {
      key,
      icon: resolveMenuNodeIcon(node),
      label,
    };
  });
}

export function SidebarMenu() {
  const { pathname } = useLocation();
  const { t } = useI18n();
  const { currentRole, permissionVersion } = useCurrentRole();
  const visibleMenuTree = useMemo(() => filterMenuTreeByRole(menuList, currentRole), [currentRole, permissionVersion]);
  const routes = useMemo(() => collectRoutes(visibleMenuTree), [visibleMenuTree]);

  return (
    <Menu
      mode="inline"
      items={mapToMenuItems(visibleMenuTree, t)}
      selectedKeys={matchSelectedPath(pathname, routes)}
      openKeys={buildOpenKeys(pathname, visibleMenuTree)}
      style={{ borderRight: 0 }}
    />
  );
}
