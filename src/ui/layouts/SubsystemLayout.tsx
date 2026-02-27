import { Layout } from 'antd';
import { Outlet, useLocation } from 'react-router-dom';
import { SubsystemMenu } from '../../components/navigation/SubsystemMenu';
import { menuList } from '../../data/menuList';
import { getTopMenuNodeByPath } from '../../logic/menu/menuRoute';

const { Sider, Content } = Layout;

export function SubsystemLayout() {
  const { pathname } = useLocation();
  const topNode = getTopMenuNodeByPath(menuList, pathname);
  const menuNodes = topNode?.children ?? [];

  if (menuNodes.length === 0) {
    return (
      <Content style={{ padding: 16 }}>
        <Outlet />
      </Content>
    );
  }

  return (
    <Layout>
      <Sider width={260} theme="light">
        <SubsystemMenu nodes={menuNodes} />
      </Sider>
      <Content style={{ margin: 16 }}>
        <Outlet />
      </Content>
    </Layout>
  );
}
