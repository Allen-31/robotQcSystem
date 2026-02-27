import { Button, Card, Checkbox, Form, Input, Typography, message } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

interface LoginFormValues {
  username: string;
  password: string;
  remember: boolean;
}

export function LoginPage() {
  const navigate = useNavigate();

  const onFinish = (values: LoginFormValues) => {
    message.success(`欢迎，${values.username}`);
    navigate('/');
  };

  return (
    <div className="login-page">
      <div className="login-mask" />
      <Card className="login-card" bordered={false}>
        <Typography.Title level={3} className="login-title">
          机器人后台管理系统
        </Typography.Title>
        <Typography.Text className="login-subtitle">请输入账号信息登录系统</Typography.Text>

        <Form<LoginFormValues>
          layout="vertical"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          style={{ marginTop: 20 }}
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
          </Form.Item>

          <Form.Item name="remember" valuePropName="checked">
            <Checkbox>记住我</Checkbox>
          </Form.Item>

          <Button type="primary" htmlType="submit" block size="large">
            登录
          </Button>
        </Form>
      </Card>
    </div>
  );
}
