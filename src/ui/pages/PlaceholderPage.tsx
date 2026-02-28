import { Card, Descriptions, Empty, Space, Typography } from 'antd';
import { useI18n } from '../../i18n/I18nProvider';
import type { RouteMeta } from '../../shared/types/menu';

interface PlaceholderPageProps {
  route: RouteMeta;
}

export function PlaceholderPage({ route }: PlaceholderPageProps) {
  const { t } = useI18n();

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card>
        <Typography.Title level={4} style={{ marginTop: 0 }}>
          {t(route.name)}
        </Typography.Title>
        <Descriptions size="small" column={1}>
          <Descriptions.Item label={t('placeholder.path')}>{route.path}</Descriptions.Item>
          <Descriptions.Item label={t('placeholder.code')}>{route.code}</Descriptions.Item>
          <Descriptions.Item label={t('placeholder.permission')}>{route.permission ?? '-'}</Descriptions.Item>
        </Descriptions>
      </Card>
      <Card>
        <Empty description={t('placeholder.empty')} />
      </Card>
    </Space>
  );
}
