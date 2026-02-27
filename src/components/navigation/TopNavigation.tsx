import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Menu, Space, Typography } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { menuList } from '../../data/menuList';
import { topMenus } from '../../data/topMenus';
import { findFirstLeafPathByCode } from '../../logic/menu/menuRoute';

export function TopNavigation() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const selectedKey =
    pathname === '/'
      ? 'home'
      : topMenus
          .filter((item) => item.key !== 'home')
          .find((item) => pathname === item.basePath || pathname.startsWith(`${item.basePath}/`))?.key;

  return (
    <div
      style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        background: '#0B1F52',
      }}
    >
      <Typography.Title
        level={4}
        style={{ color: '#fff', margin: 0, cursor: 'pointer', minWidth: 220 }}
        onClick={() => navigate('/')}
      >
        机器人后台管理系统
      </Typography.Title>

      <Menu
        mode="horizontal"
        theme="dark"
        selectedKeys={selectedKey ? [selectedKey] : []}
        items={topMenus.map((item) => ({ key: item.key, label: item.name }))}
        onClick={({ key }) => {
          const target = topMenus.find((item) => item.key === key);
          if (!target) {
            return;
          }

          if (key === 'home') {
            navigate('/');
            return;
          }

          if (key === 'operationMonitoring') {
            navigate('/operationMonitoring');
            return;
          }

          const firstLeafPath = findFirstLeafPathByCode(menuList, String(key));
          navigate(firstLeafPath === '/' ? target.basePath : firstLeafPath);
        }}
        style={{ minWidth: 620, background: 'transparent', flex: 1, justifyContent: 'center' }}
      />

      <Space size={12} style={{ color: '#fff', marginLeft: 16, minWidth: 180, justifyContent: 'flex-end' }}>
        <Space size={6}>
          <UserOutlined />
          <Typography.Text style={{ color: '#fff' }}>管理员</Typography.Text>
        </Space>
        <Button size="small" icon={<LogoutOutlined />} onClick={() => navigate('/')}>
          退出登录
        </Button>
      </Space>
    </div>
  );
}
