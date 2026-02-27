import { Card, Descriptions, Empty, Space, Typography } from 'antd';
import type { RouteMeta } from '../../shared/types/menu';

interface PlaceholderPageProps {
  route: RouteMeta;
}

export function PlaceholderPage({ route }: PlaceholderPageProps) {
  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card>
        <Typography.Title level={4} style={{ marginTop: 0 }}>
          {route.name}
        </Typography.Title>
        <Descriptions size="small" column={1}>
          <Descriptions.Item label="路径">{route.path}</Descriptions.Item>
          <Descriptions.Item label="编码">{route.code}</Descriptions.Item>
          <Descriptions.Item label="权限">{route.permission ?? '-'}</Descriptions.Item>
        </Descriptions>
      </Card>
      <Card>
        <Empty description="页面占位，等待需求说明书补充后开发" />
      </Card>
    </Space>
  );
}
