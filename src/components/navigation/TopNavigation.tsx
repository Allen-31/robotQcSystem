import { Menu, Typography } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { menuList } from '../../data/menuList';
import { topMenus } from '../../data/topMenus';
import { findFirstLeafPathByCode } from '../../logic/menu/menuRoute';

export function TopNavigation() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const selectedKey = topMenus.find((item) => pathname === item.basePath || pathname.startsWith(`${item.basePath}/`))?.key;

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
      <Typography.Title level={4} style={{ color: '#fff', margin: 0 }}>
        机器人质检管理后台
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

          if (key === 'operationMonitoring') {
            navigate('/operationMonitoring');
            return;
          }

          const firstLeafPath = findFirstLeafPathByCode(menuList, String(key));
          navigate(firstLeafPath === '/' ? target.basePath : firstLeafPath);
        }}
        style={{ minWidth: 520, background: 'transparent' }}
      />
    </div>
  );
}
