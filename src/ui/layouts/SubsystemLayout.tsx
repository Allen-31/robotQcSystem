import { Grid, Layout } from 'antd';
import { useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SubsystemMenu } from '../../components/navigation/SubsystemMenu';
import { menuList } from '../../data/menuList';
import { useCurrentRole } from '../../logic/deployConfig/useCurrentRole';
import { filterMenuTreeByRole } from '../../logic/menu/menuPermission';
import { getTopMenuNodeByPath } from '../../logic/menu/menuRoute';

const { Sider, Content } = Layout;

export function SubsystemLayout() {
  const { pathname } = useLocation();
  const { currentRole, permissionVersion } = useCurrentRole();
  const screens = Grid.useBreakpoint();
  const isLaptop = !screens.xxl;

  const visibleMenuTree = useMemo(() => filterMenuTreeByRole(menuList, currentRole), [currentRole, permissionVersion]);
  const topNode = getTopMenuNodeByPath(visibleMenuTree, pathname);
  const menuNodes = topNode?.children ?? [];

  if (menuNodes.length === 0) {
    return (
      <Content style={{ padding: isLaptop ? 12 : 16, minWidth: 0 }}>
        <Outlet />
      </Content>
    );
  }

  return (
    <Layout>
      <Sider width={isLaptop ? 220 : 260} theme="light">
        <SubsystemMenu nodes={menuNodes} />
      </Sider>
      <Content style={{ margin: isLaptop ? 12 : 16, minWidth: 0 }}>
        <Outlet />
      </Content>
    </Layout>
  );
}

