import { Layout, Typography } from 'antd';
import { Outlet } from 'react-router-dom';
import { SidebarMenu } from '../../components/navigation/SidebarMenu';

const { Header, Sider, Content } = Layout;

export function AdminLayout() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={260} theme="light">
        <div style={{ height: 56, display: 'flex', alignItems: 'center', padding: '0 16px' }}>
          <Typography.Title level={5} style={{ margin: 0 }}>
            机器人质检管理后台
          </Typography.Title>
        </div>
        <SidebarMenu />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 16px' }}>
          <Typography.Text strong>后台管理</Typography.Text>
        </Header>
        <Content style={{ margin: 16 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
