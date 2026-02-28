import { Card, Empty, Typography } from 'antd';
import { useI18n } from '../../i18n/I18nProvider';

export function OperationMonitoringPage() {
  const { t } = useI18n();

  return (
    <Card>
      <Typography.Title level={4}>{t('operationMonitoring.title')}</Typography.Title>
      <Empty description={t('operationMonitoring.placeholder')} />
    </Card>
  );
}
