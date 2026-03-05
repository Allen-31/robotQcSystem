import { ExportOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Input, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { getApiLogList, type ApiLogRecord } from '../../../data/operationMaintenance/apiLogList';
import { useI18n } from '../../../i18n/I18nProvider';

function exportCsv(rows: ApiLogRecord[]) {
  const headers = ['apiName', 'callResult', 'failReason', 'responseTime', 'requestInfo', 'responseInfo', 'createdAt'];
  const body = rows.map((row) => [row.apiName, row.callResult, row.failReason, row.responseTime, row.requestInfo, row.responseInfo, row.createdAt].join(','));
  const blob = new Blob([`\uFEFF${headers.join(',')}\n${body.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `api-log-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function ApiLogPage() {
  const { locale, t } = useI18n();
  const [messageApi, contextHolder] = message.useMessage();
  const [keyword, setKeyword] = useState('');
  const apiLogList = useMemo(() => getApiLogList(locale), [locale]);

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    if (!k) {
      return apiLogList;
    }
    return apiLogList.filter((item) => `${item.apiName} ${item.callResult} ${item.requestInfo} ${item.responseInfo}`.toLowerCase().includes(k));
  }, [keyword]);

  const columns: ColumnsType<ApiLogRecord> = [
    { title: t('op.api.table.apiName'), dataIndex: 'apiName', key: 'apiName', width: 240 },
    {
      title: t('op.api.table.callResult'),
      dataIndex: 'callResult',
      key: 'callResult',
      width: 100,
      render: (value) => <Tag color={value === 'success' ? 'success' : 'error'}>{value === 'success' ? t('op.common.success') : t('op.common.failed')}</Tag>,
    },
    { title: t('op.api.table.failReason'), dataIndex: 'failReason', key: 'failReason', width: 180 },
    { title: t('op.api.table.responseTime'), dataIndex: 'responseTime', key: 'responseTime', width: 130 },
    { title: t('op.api.table.requestInfo'), dataIndex: 'requestInfo', key: 'requestInfo', width: 260 },
    { title: t('op.api.table.responseInfo'), dataIndex: 'responseInfo', key: 'responseInfo', width: 260 },
    { title: t('op.api.table.createdAt'), dataIndex: 'createdAt', key: 'createdAt', width: 170 },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {contextHolder}
      <Card>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {t('menu.apiLog')}
          </Typography.Title>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Input allowClear prefix={<SearchOutlined />} placeholder={t('op.api.searchPlaceholder')} value={keyword} onChange={(event) => setKeyword(event.target.value)} style={{ maxWidth: 460 }} />
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
