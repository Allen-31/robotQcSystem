import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Grid, Menu, Select, Space, Typography } from 'antd';
import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { menuList } from '../../data/menuList';
import { topMenus } from '../../data/topMenus';
import { useI18n } from '../../i18n/I18nProvider';
import { logout } from '../../logic/auth/authStore';
import { useAuthUser } from '../../logic/auth/useAuthUser';
import { useCurrentRole } from '../../logic/deployConfig/useCurrentRole';
import { filterMenuTreeByRole, filterTopMenusByRole } from '../../logic/menu/menuPermission';
import { findFirstLeafPathByCode } from '../../logic/menu/menuRoute';

export function TopNavigation() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t, locale, setLocale } = useI18n();
  const currentUser = useAuthUser();
  const { currentRole, permissionVersion } = useCurrentRole();
  const screens = Grid.useBreakpoint();
  const isLaptop = !screens.xxl;
  const isTight = !screens.xl;
  const visibleMenuTree = useMemo(() => filterMenuTreeByRole(menuList, currentRole), [currentRole, permissionVersion]);
  const visibleTopMenus = useMemo(() => filterTopMenusByRole(topMenus, currentRole), [currentRole, permissionVersion]);

  const selectedKey = visibleTopMenus.find((item) => pathname === item.basePath || pathname.startsWith(`${item.basePath}/`))?.key;

  return (
    <div
      className="app-top-nav"
      style={{
        height: isLaptop ? 56 : 64,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isLaptop ? '0 12px' : '0 20px',
        background: '#0B1F52',
      }}
    >
      <Typography.Title
        level={4}
        style={{ color: '#fff', margin: 0, cursor: 'pointer', minWidth: isLaptop ? 170 : 220, fontSize: isLaptop ? 18 : undefined }}
        onClick={() => navigate('/')}
      >
        {t('app.systemTitle')}
      </Typography.Title>

      <div
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          justifyContent: 'center',
          width: 'fit-content',
          maxWidth: isTight ? '48vw' : '60vw',
        }}
      >
        <Menu
          mode="horizontal"
          theme="dark"
          selectedKeys={selectedKey ? [selectedKey] : []}
          items={visibleTopMenus.map((item) => ({ key: item.key, label: t(item.name) }))}
          onClick={({ key }) => {
            const target = visibleTopMenus.find((item) => item.key === key);
            if (!target) {
              return;
            }

            if (key === 'operationMonitoring') {
              navigate('/operationMonitoring');
              return;
            }

            const firstLeafPath = findFirstLeafPathByCode(visibleMenuTree, String(key));
            navigate(firstLeafPath === '/' ? target.basePath : firstLeafPath);
          }}
          style={{ background: 'transparent', borderBottom: 0, justifyContent: 'center' }}
        />
      </div>

      <Space size={isLaptop ? 8 : 12} style={{ color: '#fff', marginLeft: 8, minWidth: isTight ? 240 : 420, justifyContent: 'flex-end' }}>
        <Space size={6} style={{ display: isTight ? 'none' : 'inline-flex' }}>
          <Typography.Text style={{ color: '#fff' }}>{t('app.language')}</Typography.Text>
          <Select
            size="small"
            value={locale}
            style={{ width: 100 }}
            onChange={(value) => setLocale(value)}
            options={[
              { value: 'zh-CN', label: t('app.locale.zhCN') },
              { value: 'en-US', label: t('app.locale.enUS') },
            ]}
          />
        </Space>
        <Space size={6} style={{ display: isTight ? 'none' : 'inline-flex' }}>
          <Typography.Text style={{ color: '#fff' }}>{t('app.role')}：{currentRole}</Typography.Text>
        </Space>
        <Space size={6}>
          <UserOutlined />
          <Typography.Text style={{ color: '#fff', display: isTight ? 'none' : 'inline' }}>{currentUser?.displayName ?? t('app.adminUser')}</Typography.Text>
        </Space>
        <Button
          size="small"
          icon={<LogoutOutlined />}
          onClick={() => {
            logout();
            navigate('/home/login');
          }}
        >
          {t('app.logout')}
        </Button>
      </Space>
    </div>
  );
}
