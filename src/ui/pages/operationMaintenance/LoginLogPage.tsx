import { ExportOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Input, Space, Table, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { getLoginLogList, type LoginLogRecord } from '../../../data/operationMaintenance/loginLogList';
import { useI18n } from '../../../i18n/I18nProvider';

function exportCsv(rows: LoginLogRecord[]) {
  const headers = ['user', 'type', 'ip', 'time'];
  const body = rows.map((row) => [row.user, row.type, row.ip, row.time].join(','));
  const blob = new Blob([`\uFEFF${headers.join(',')}\n${body.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `login-log-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function LoginLogPage() {
  const { locale, t } = useI18n();
  const [messageApi, contextHolder] = message.useMessage();
  const [keyword, setKeyword] = useState('');
  const loginLogList = useMemo(() => getLoginLogList(locale), [locale]);

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    if (!k) {
      return loginLogList;
    }
    return loginLogList.filter((item) => `${item.user} ${item.type} ${item.ip} ${item.time}`.toLowerCase().includes(k));
  }, [keyword, loginLogList]);

  const columns: ColumnsType<LoginLogRecord> = [
    { title: t('op.login.table.user'), dataIndex: 'user', key: 'user', width: 180 },
    { title: t('op.login.table.type'), dataIndex: 'type', key: 'type', width: 130 },
    { title: t('op.login.table.ip'), dataIndex: 'ip', key: 'ip', width: 180 },
    { title: t('op.login.table.time'), dataIndex: 'time', key: 'time', width: 220 },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {contextHolder}
      <Card>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {t('menu.loginLog')}
          </Typography.Title>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Input allowClear prefix={<SearchOutlined />} placeholder={t('op.login.searchPlaceholder')} value={keyword} onChange={(event) => setKeyword(event.target.value)} style={{ maxWidth: 420 }} />
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
        <Table rowKey="id" columns={columns} dataSource={filtered} pagination={{ pageSize: 10, showSizeChanger: false }} />
      </Card>
    </Space>
  );
}

