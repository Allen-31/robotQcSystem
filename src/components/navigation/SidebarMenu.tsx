import {
  BarChartOutlined,
  CheckCircleOutlined,
  HomeOutlined,
  SettingOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { Menu } from 'antd';
import type { MenuProps } from 'antd';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import { menuList } from '../../data/menuList';
import { buildOpenKeys, collectRoutes, matchSelectedPath } from '../../logic/menu/menuRoute';
import type { MenuNode } from '../../shared/types/menu';

const iconMap: Record<string, ReactNode> = {
  HomeOutlined: <HomeOutlined />,
  CheckCircleOutlined: <CheckCircleOutlined />,
  SettingOutlined: <SettingOutlined />,
  ToolOutlined: <ToolOutlined />,
  BarChartOutlined: <BarChartOutlined />,
};

function mapToMenuItems(nodes: MenuNode[], translate: (key: string) => string): MenuProps['items'] {
  return nodes.map((node) => {
    const key = node.path ?? node.id;
    const labelText = translate(node.name);
    const label = node.path ? <Link to={node.path}>{labelText}</Link> : labelText;

    if (node.children?.length) {
      return {
        key,
        icon: node.icon ? iconMap[node.icon] : undefined,
        label,
        children: mapToMenuItems(node.children, translate),
      };
    }

    return {
      key,
      icon: node.icon ? iconMap[node.icon] : undefined,
      label,
    };
  });
}

const routes = collectRoutes(menuList);

export function SidebarMenu() {
  const { pathname } = useLocation();
  const { t } = useI18n();

  return (
    <Menu
      mode="inline"
      items={mapToMenuItems(menuList, t)}
      selectedKeys={matchSelectedPath(pathname, routes)}
      openKeys={buildOpenKeys(pathname, menuList)}
      style={{ borderRight: 0 }}
    />
  );
}
