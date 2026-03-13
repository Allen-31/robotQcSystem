import { Layout, Spin } from 'antd';
import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { TopNavigation } from '../../components/navigation/TopNavigation';
import { getToken } from '../../shared/api/client';
import { refreshCurrentUser } from '../../logic/auth/authStore';
import { useAuthUser } from '../../logic/auth/useAuthUser';

export function TopLevelLayout() {
  const user = useAuthUser();
  const [userLoaded, setUserLoaded] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setUserLoaded(true);
      return;
    }
    let cancelled = false;
    refreshCurrentUser().then(() => {
      if (!cancelled) setUserLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!getToken()) {
    return <Navigate to="/home/login" replace />;
  }

  if (!userLoaded || !user) {
    return (
      <Layout style={{ minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </Layout>
    );
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

