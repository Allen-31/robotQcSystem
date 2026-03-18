import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { App, Button, Card, Checkbox, Form, Input, Space, Typography } from 'antd';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import { login } from '../../logic/auth/authStore';
import './LoginPage.css';

interface LoginFormValues {
  username: string;
  password: string;
  remember: boolean;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const { message: messageApi } = App.useApp();

  useEffect(() => {
    if ((location.state as { sessionExpired?: boolean })?.sessionExpired) {
      messageApi.warning(t('login.sessionExpired'));
      navigate('/home/login', { replace: true, state: {} });
    }
  }, [location.state, messageApi, navigate, t]);

  const onFinish = async (values: LoginFormValues) => {
    const result = await login(values.username, values.password, values.remember);
    if (!result.success) {
      messageApi.error(result.message || t('login.invalid'));
      return;
    }
    messageApi.success(t('login.welcome', { username: result.user.displayName }));
    navigate('/');
  };

  return (
    <div className="login-page">
      <div className="login-mask" />
      <Card className="login-card" bordered={false}>
        <Typography.Title level={3} className="login-title">
          {t('login.title')}
        </Typography.Title>
        <Typography.Text className="login-subtitle">{t('login.subtitle')}</Typography.Text>
        <Space direction="vertical" size={2} style={{ marginTop: 8 }}>
          <Typography.Text type="secondary">{t('login.mockAccounts')}</Typography.Text>
          <Typography.Text type="secondary">{t('login.mockAdmin')}</Typography.Text>
          <Typography.Text type="secondary">{t('login.mockQc')}</Typography.Text>
          <Typography.Text type="secondary">{t('login.mockPe')}</Typography.Text>
          <Typography.Text type="secondary">{t('login.mockOps')}</Typography.Text>
          <Typography.Text type="secondary">{t('login.mockPad')}</Typography.Text>
        </Space>

        <Form<LoginFormValues>
          layout="vertical"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          style={{ marginTop: 20 }}
        >
          <Form.Item
            label={t('login.username')}
            name="username"
            rules={[{ required: true, message: t('login.usernameRequired') }]}
          >
            <Input prefix={<UserOutlined />} placeholder={t('login.usernamePlaceholder')} />
          </Form.Item>

          <Form.Item
            label={t('login.password')}
            name="password"
            rules={[{ required: true, message: t('login.passwordRequired') }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder={t('login.passwordPlaceholder')} />
          </Form.Item>

          <Form.Item name="remember" valuePropName="checked">
            <Checkbox>{t('login.remember')}</Checkbox>
          </Form.Item>

          <Button type="primary" htmlType="submit" block size="large">
            {t('login.submit')}
          </Button>
        </Form>
      </Card>
    </div>
  );
}
