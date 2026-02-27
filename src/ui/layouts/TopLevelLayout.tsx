import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import { TopNavigation } from '../../components/navigation/TopNavigation';

export function TopLevelLayout() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <TopNavigation />
      <Outlet />
    </Layout>
  );
}
