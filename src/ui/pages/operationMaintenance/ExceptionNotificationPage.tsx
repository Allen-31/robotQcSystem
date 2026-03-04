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
  const { locale, t } = useI18n();
  const [messageApi, contextHolder] = message.useMessage();
  const [keyword, setKeyword] = useState('');

  const label = useMemo(
    () =>
      locale === 'en-US'
        ? { search: 'Search by id, type, source, issue, robot', export: 'Export', pending: 'Pending', processing: 'Processing', closed: 'Closed' }
        : { search: '按编号、类型、来源、问题、机器人搜索', export: '导出', pending: '待处理', processing: '处理中', closed: '已关闭' },
    [locale],
  );

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
    { title: '编号', dataIndex: 'id', key: 'id', width: 170 },
    { title: '等级', dataIndex: 'level', key: 'level', width: 80, render: (value) => <Tag color={value === 'P1' ? 'error' : value === 'P2' ? 'warning' : 'default'}>{value}</Tag> },
    { title: '类型', dataIndex: 'type', key: 'type', width: 120 },
    { title: '来源系统', dataIndex: 'sourceSystem', key: 'sourceSystem', width: 170 },
    { title: '问题描述', dataIndex: 'issue', key: 'issue', width: 280 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (value) => <Tag color={value === 'pending' ? 'error' : value === 'processing' ? 'warning' : 'success'}>{value === 'pending' ? label.pending : value === 'processing' ? label.processing : label.closed}</Tag>,
    },
    { title: '关联任务', dataIndex: 'relatedTask', key: 'relatedTask', width: 160 },
    { title: '机器人', dataIndex: 'robot', key: 'robot', width: 120 },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
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
            <Input allowClear prefix={<SearchOutlined />} placeholder={label.search} value={keyword} onChange={(event) => setKeyword(event.target.value)} style={{ maxWidth: 420 }} />
            <Button
              icon={<ExportOutlined />}
              onClick={() => {
                exportCsv(filtered);
                messageApi.success(locale === 'en-US' ? `Exported ${filtered.length} records` : `已导出 ${filtered.length} 条记录`);
              }}
            >
              {label.export}
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

