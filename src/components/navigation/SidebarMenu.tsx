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

function mapToMenuItems(nodes: MenuNode[]): MenuProps['items'] {
  return nodes.map((node) => {
    const key = node.path ?? node.id;
    const label = node.path ? <Link to={node.path}>{node.name}</Link> : node.name;

    if (node.children?.length) {
      return {
        key,
        icon: node.icon ? iconMap[node.icon] : undefined,
        label,
        children: mapToMenuItems(node.children),
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
const items = mapToMenuItems(menuList);

export function SidebarMenu() {
  const { pathname } = useLocation();

  return (
    <Menu
      mode="inline"
      items={items}
      selectedKeys={matchSelectedPath(pathname, routes)}
      openKeys={buildOpenKeys(pathname, menuList)}
      style={{ borderRight: 0 }}
    />
  );
}
