import { Card, Empty, Typography } from 'antd';

export function OperationMonitoringPage() {
  return (
    <Card>
      <Typography.Title level={4}>运行监控</Typography.Title>
      <Empty description="运行监控子系统占位页，后续按需求补充" />
    </Card>
  );
}
