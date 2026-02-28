import { Layout, Typography } from 'antd';
import { Outlet } from 'react-router-dom';
import { SidebarMenu } from '../../components/navigation/SidebarMenu';
import { useI18n } from '../../i18n/I18nProvider';

const { Header, Sider, Content } = Layout;

export function AdminLayout() {
  const { t } = useI18n();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={260} theme="light">
        <div style={{ height: 56, display: 'flex', alignItems: 'center', padding: '0 16px' }}>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {t('app.adminLayoutTitle')}
          </Typography.Title>
        </div>
        <SidebarMenu />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 16px' }}>
          <Typography.Text strong>{t('app.adminLayoutHeader')}</Typography.Text>
        </Header>
        <Content style={{ margin: 16 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
