import { MenuOutlined } from '@ant-design/icons';
import { Button, Drawer, Grid, Layout } from 'antd';
import { useEffect, useMemo, useState } from 'react';
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
  const isPad = !screens.lg;

  const [drawerOpen, setDrawerOpen] = useState(false);

  const visibleMenuTree = useMemo(() => filterMenuTreeByRole(menuList, currentRole), [currentRole, permissionVersion]);
  const topNode = getTopMenuNodeByPath(visibleMenuTree, pathname);
  const menuNodes = topNode?.children ?? [];
  const isOperationMonitoring = pathname === '/operationMonitoring';

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  if (menuNodes.length === 0) {
    return (
      <Content
        className="app-subsystem-content"
        style={{
          padding: isOperationMonitoring ? 0 : isLaptop ? 12 : 16,
          minWidth: 0,
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ flex: 1, minHeight: 0 }}>
          <Outlet />
        </div>
      </Content>
    );
  }

  const contentMargin = isOperationMonitoring ? 0 : isLaptop ? 12 : 16;

  if (isPad) {
    return (
      <>
        <Content
          className="app-subsystem-content"
          style={{
            margin: contentMargin,
            minWidth: 0,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ marginBottom: 8, flexShrink: 0 }}>
            <Button type="text" icon={<MenuOutlined />} onClick={() => setDrawerOpen(true)} style={{ fontSize: 20, color: '#0B1F52' }} aria-label="打开菜单" />
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <Outlet />
          </div>
        </Content>
        <Drawer
          title={null}
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          width={280}
          styles={{ body: { padding: 0 } }}
        >
          <div className="app-sub-sider" style={{ padding: '12px 0' }}>
            <SubsystemMenu nodes={menuNodes} />
          </div>
        </Drawer>
      </>
    );
  }

  return (
    <Layout style={{ flex: 1, minHeight: 0 }}>
      <Sider className="app-sub-sider" width={isLaptop ? 220 : 260} theme="light">
        <SubsystemMenu nodes={menuNodes} />
      </Sider>
      <Content
        className="app-subsystem-content"
        style={{
          margin: isOperationMonitoring ? 0 : isLaptop ? 12 : 16,
          minWidth: 0,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ flex: 1, minHeight: 0 }}>
          <Outlet />
        </div>
      </Content>
    </Layout>
  );
}

