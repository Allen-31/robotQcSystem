import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Menu, Select, Space, Typography } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { menuList } from '../../data/menuList';
import { topMenus } from '../../data/topMenus';
import { useI18n } from '../../i18n/I18nProvider';
import { findFirstLeafPathByCode } from '../../logic/menu/menuRoute';

export function TopNavigation() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t, locale, setLocale } = useI18n();

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
        {t('app.systemTitle')}
      </Typography.Title>

      <Menu
        mode="horizontal"
        theme="dark"
        selectedKeys={selectedKey ? [selectedKey] : []}
        items={topMenus.map((item) => ({ key: item.key, label: t(item.name) }))}
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

      <Space size={12} style={{ color: '#fff', marginLeft: 16, minWidth: 340, justifyContent: 'flex-end' }}>
        <Space size={6}>
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
        <Space size={6}>
          <UserOutlined />
          <Typography.Text style={{ color: '#fff' }}>{t('app.adminUser')}</Typography.Text>
        </Space>
        <Button size="small" icon={<LogoutOutlined />} onClick={() => navigate('/home/login')}>
          {t('app.logout')}
        </Button>
      </Space>
    </div>
  );
}
