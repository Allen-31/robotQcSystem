import { ExportOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Input, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { exceptionNotificationList, type ExceptionNotificationRecord } from '../../../data/operationMaintenance/exceptionNotificationList';
import { useI18n } from '../../../i18n/I18nProvider';

function exportCsv(rows: ExceptionNotificationRecord[]) {
  const headers = ['id', 'level', 'type', 'sourceSystem', 'issue', 'status', 'relatedTask', 'robot', 'createdAt'];
  const body = rows.map((row) => [row.id, row.level, row.type, row.sourceSystem, row.issue, row.status, row.relatedTask, row.robot, row.createdAt].join(','));
  const content = `${headers.join(',')}\n${body.join('\n')}`;
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `exception-notification-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function ExceptionNotificationPage() {
  const { t } = useI18n();
  const [messageApi, contextHolder] = message.useMessage();
  const [keyword, setKeyword] = useState('');

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    if (!k) {
      return exceptionNotificationList;
    }
    return exceptionNotificationList.filter((item) =>
      `${item.id} ${item.type} ${item.sourceSystem} ${item.issue} ${item.robot}`.toLowerCase().includes(k),
    );
  }, [keyword]);

  const columns: ColumnsType<ExceptionNotificationRecord> = [
    { title: t('op.exception.table.id'), dataIndex: 'id', key: 'id', width: 170 },
    { title: t('op.exception.table.level'), dataIndex: 'level', key: 'level', width: 80, render: (value) => <Tag color={value === 'P1' ? 'error' : value === 'P2' ? 'warning' : 'default'}>{value}</Tag> },
    { title: t('op.exception.table.type'), dataIndex: 'type', key: 'type', width: 120 },
    { title: t('op.exception.table.sourceSystem'), dataIndex: 'sourceSystem', key: 'sourceSystem', width: 170 },
    { title: t('op.exception.table.issue'), dataIndex: 'issue', key: 'issue', width: 280 },
    {
      title: t('op.exception.table.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (value) => <Tag color={value === 'pending' ? 'error' : value === 'processing' ? 'warning' : 'success'}>{t(`op.exception.status.${value}`)}</Tag>,
    },
    { title: t('op.exception.table.relatedTask'), dataIndex: 'relatedTask', key: 'relatedTask', width: 160 },
    { title: t('op.exception.table.robot'), dataIndex: 'robot', key: 'robot', width: 120 },
    { title: t('op.exception.table.createdAt'), dataIndex: 'createdAt', key: 'createdAt', width: 170 },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {contextHolder}
      <Card>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {t('menu.exceptionNotification')}
          </Typography.Title>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Input allowClear prefix={<SearchOutlined />} placeholder={t('op.exception.searchPlaceholder')} value={keyword} onChange={(event) => setKeyword(event.target.value)} style={{ maxWidth: 420 }} />
            <Button
              icon={<ExportOutlined />}
              onClick={() => {
                exportCsv(filtered);
                messageApi.success(t('op.common.exportedCount', { count: filtered.length }));
              }}
            >
              {t('op.common.export')}
            </Button>
          </Space>
        </Space>
      </Card>
      <Card>
        <Table rowKey="id" columns={columns} dataSource={filtered} pagination={{ pageSize: 8, showSizeChanger: false }} scroll={{ x: 1500 }} />
      </Card>
    </Space>
  );
}

