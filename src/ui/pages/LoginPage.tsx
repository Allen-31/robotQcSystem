import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Card, Checkbox, Form, Input, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import './LoginPage.css';

interface LoginFormValues {
  username: string;
  password: string;
  remember: boolean;
}

export function LoginPage() {
  const navigate = useNavigate();
  const { t } = useI18n();

  const onFinish = (values: LoginFormValues) => {
    message.success(t('login.welcome', { username: values.username }));
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
