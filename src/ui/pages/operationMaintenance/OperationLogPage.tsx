import { ExportOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Input, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { operationLogList, type OperationLogRecord } from '../../../data/operationMaintenance/operationLogList';
import { useI18n } from '../../../i18n/I18nProvider';

function exportCsv(rows: OperationLogRecord[]) {
  const headers = ['user', 'operationType', 'result', 'failReason', 'responseTime', 'ip', 'requestInfo', 'responseInfo', 'createdAt'];
  const body = rows.map((row) => [row.user, row.operationType, row.result, row.failReason, row.responseTime, row.ip, row.requestInfo, row.responseInfo, row.createdAt].join(','));
  const blob = new Blob([`\uFEFF${headers.join(',')}\n${body.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `operation-log-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function OperationLogPage() {
  const { locale, t } = useI18n();
  const [messageApi, contextHolder] = message.useMessage();
  const [keyword, setKeyword] = useState('');

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    if (!k) {
      return operationLogList;
    }
    return operationLogList.filter((item) =>
      `${item.user} ${item.operationType} ${item.result} ${item.ip} ${item.requestInfo} ${item.responseInfo}`.toLowerCase().includes(k),
    );
  }, [keyword]);

  const columns: ColumnsType<OperationLogRecord> = [
    { title: '用户', dataIndex: 'user', key: 'user', width: 120 },
    { title: '操作类型', dataIndex: 'operationType', key: 'operationType', width: 140 },
    {
      title: '操作结果',
      dataIndex: 'result',
      key: 'result',
      width: 100,
      render: (value) => <Tag color={value === 'success' ? 'success' : 'error'}>{value === 'success' ? (locale === 'en-US' ? 'Success' : '成功') : locale === 'en-US' ? 'Failed' : '失败'}</Tag>,
    },
    { title: '失败原因', dataIndex: 'failReason', key: 'failReason', width: 180 },
    { title: '响应时长(ms)', dataIndex: 'responseTime', key: 'responseTime', width: 120 },
    { title: 'IP地址', dataIndex: 'ip', key: 'ip', width: 140 },
    { title: '请求信息', dataIndex: 'requestInfo', key: 'requestInfo', width: 240 },
    { title: '返回信息', dataIndex: 'responseInfo', key: 'responseInfo', width: 220 },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {contextHolder}
      <Card>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {t('menu.operationLog')}
          </Typography.Title>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder={locale === 'en-US' ? 'Search by user, type, ip, request' : '按用户、类型、IP、请求信息搜索'}
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              style={{ maxWidth: 460 }}
            />
            <Button
              icon={<ExportOutlined />}
              onClick={() => {
                exportCsv(filtered);
                messageApi.success(locale === 'en-US' ? `Exported ${filtered.length} records` : `已导出 ${filtered.length} 条记录`);
              }}
            >
              {locale === 'en-US' ? 'Export' : '导出'}
            </Button>
          </Space>
        </Space>
      </Card>
      <Card>
        <Table rowKey="id" columns={columns} dataSource={filtered} pagination={{ pageSize: 8, showSizeChanger: false }} scroll={{ x: 1680 }} />
      </Card>
    </Space>
  );
}

