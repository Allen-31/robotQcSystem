import { Layout } from 'antd';
import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { TopNavigation } from '../../components/navigation/TopNavigation';
import { getToken } from '../../shared/api/client';
import { refreshCurrentUser } from '../../logic/auth/authStore';
import { useAuthUser } from '../../logic/auth/useAuthUser';

export function TopLevelLayout() {
  const user = useAuthUser();

  useEffect(() => {
    if (getToken()) {
      refreshCurrentUser();
    }
  }, []);

  if (!user) {
    return <Navigate to="/home/login" replace />;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <TopNavigation />
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </div>
    </Layout>
  );
}

