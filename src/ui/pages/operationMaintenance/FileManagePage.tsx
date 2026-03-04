import { EyeOutlined, ExportOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Col, Input, Modal, Row, Select, Space, Statistic, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { fileManageList, type FileManageRecord } from '../../../data/operationMaintenance/fileManageList';
import { useI18n } from '../../../i18n/I18nProvider';

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadCsv(rows: FileManageRecord[]): void {
  const headers = ['name', 'type', 'size', 'tags', 'createdAt'];
  const content = [
    headers.join(','),
    ...rows.map((row) =>
      [row.name, row.type, row.size, row.tags.join('|'), row.createdAt]
        .map((cell) => escapeCsv(cell))
        .join(','),
    ),
  ].join('\n');

  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `file-manage-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function sizeToMb(text: string): number {
  const value = Number(text.replace(/[^\d.]/g, ''));
  if (Number.isNaN(value)) {
    return 0;
  }
  if (text.toUpperCase().includes('KB')) {
    return value / 1024;
  }
  if (text.toUpperCase().includes('GB')) {
    return value * 1024;
  }
  return value;
}

export function FileManagePage() {
  const { locale, t } = useI18n();
  const [messageApi, contextHolder] = message.useMessage();
  const [previewRecord, setPreviewRecord] = useState<FileManageRecord | null>(null);
  const [keyword, setKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const label = useMemo(() => {
    if (locale === 'en-US') {
      return {
        searchPlaceholder: 'Search by name, type, tag, created time',
        typeAll: 'All Types',
        batchExport: 'Export Selected',
        exportAll: 'Export All',
        totalFiles: 'Total Files',
        selectedFiles: 'Selected',
        totalSize: 'Total Size',
        tableName: 'Name',
        tableType: 'Type',
        tableSize: 'Size',
        tableTag: 'Tags',
        tableCreatedAt: 'Created At',
        tableAction: 'Action',
        actionPreview: 'Preview',
        actionExport: 'Export',
        exportOneDone: 'Exported successfully, 1 record',
        exportNone: 'Please select records to export',
        exportBatchDone: 'Exported successfully, {count} records',
        previewTitle: 'File Preview',
        fieldName: 'Name',
        fieldType: 'Type',
        fieldSize: 'Size',
        fieldTag: 'Tags',
        fieldCreatedAt: 'Created At',
      };
    }
    return {
      searchPlaceholder: '按名称、类型、标签、创建时间搜索',
      typeAll: '全部类型',
      batchExport: '导出勾选',
      exportAll: '导出全部',
      totalFiles: '文件总数',
      selectedFiles: '已选数量',
      totalSize: '文件总容量',
      tableName: '名称',
      tableType: '类型',
      tableSize: '文件大小',
      tableTag: '标签',
      tableCreatedAt: '创建时间',
      tableAction: '操作',
      actionPreview: '预览',
      actionExport: '导出',
      exportOneDone: '导出成功，共 1 条',
      exportNone: '请先勾选要导出的记录',
      exportBatchDone: '导出成功，共 {count} 条',
      previewTitle: '文件预览',
      fieldName: '名称',
      fieldType: '类型',
      fieldSize: '文件大小',
      fieldTag: '标签',
      fieldCreatedAt: '创建时间',
    };
  }, [locale]);

  const typeOptions = useMemo(() => Array.from(new Set(fileManageList.map((item) => item.type))), []);

  const filteredList = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return fileManageList.filter((item) => {
      const matchType = typeFilter === 'all' || item.type === typeFilter;
      if (!matchType) {
        return false;
      }
      if (!normalizedKeyword) {
        return true;
      }
      const text = `${item.name} ${item.type} ${item.tags.join(' ')} ${item.createdAt}`.toLowerCase();
      return text.includes(normalizedKeyword);
    });
  }, [keyword, typeFilter]);

  const selectedRows = useMemo(() => {
    const keySet = new Set(selectedRowKeys.map(String));
    return filteredList.filter((item) => keySet.has(item.id));
  }, [filteredList, selectedRowKeys]);

  const totalSizeMb = useMemo(() => filteredList.reduce((sum, item) => sum + sizeToMb(item.size), 0), [filteredList]);

  const exportSelected = () => {
    if (selectedRows.length === 0) {
      messageApi.warning(label.exportNone);
      return;
    }
    downloadCsv(selectedRows);
    messageApi.success(label.exportBatchDone.replace('{count}', String(selectedRows.length)));
  };

  const columns: ColumnsType<FileManageRecord> = [
    { title: label.tableName, dataIndex: 'name', key: 'name', width: 360 },
    { title: label.tableType, dataIndex: 'type', key: 'type', width: 120 },
    { title: label.tableSize, dataIndex: 'size', key: 'size', width: 140 },
    {
      title: label.tableTag,
      dataIndex: 'tags',
      key: 'tags',
      width: 320,
      render: (tags: string[]) => (
        <Space size={[4, 4]} wrap>
          {tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </Space>
      ),
    },
    { title: label.tableCreatedAt, dataIndex: 'createdAt', key: 'createdAt', width: 180 },
    {
      title: label.tableAction,
      key: 'action',
      width: 190,
      fixed: 'right',
      render: (_, record) => (
        <Space size={8}>
          <Button icon={<EyeOutlined />} onClick={() => setPreviewRecord(record)}>
            {label.actionPreview}
          </Button>
          <Button
            icon={<ExportOutlined />}
            onClick={() => {
              downloadCsv([record]);
              messageApi.success(label.exportOneDone);
            }}
          >
            {label.actionExport}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {contextHolder}
      <Card>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {t('menu.fileManage')}
          </Typography.Title>
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} lg={10}>
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder={label.searchPlaceholder}
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </Col>
            <Col xs={24} lg={6}>
              <Select
                style={{ width: '100%' }}
                value={typeFilter}
                onChange={setTypeFilter}
                options={[
                  { label: label.typeAll, value: 'all' },
                  ...typeOptions.map((type) => ({ label: type, value: type })),
                ]}
              />
            </Col>
            <Col xs={24} lg={8}>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={exportSelected}>{label.batchExport}</Button>
                <Button
                  type="primary"
                  icon={<ExportOutlined />}
                  onClick={() => {
                    downloadCsv(filteredList);
                    messageApi.success(label.exportBatchDone.replace('{count}', String(filteredList.length)));
                  }}
                >
                  {label.exportAll}
                </Button>
              </Space>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col xs={24} md={8}>
              <Card size="small">
                <Statistic title={label.totalFiles} value={filteredList.length} />
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card size="small">
                <Statistic title={label.selectedFiles} value={selectedRows.length} />
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card size="small">
                <Statistic title={label.totalSize} value={Number(totalSizeMb.toFixed(2))} suffix="MB" />
              </Card>
            </Col>
          </Row>
        </Space>
      </Card>

      <Card>
        <Table
          rowKey="id"
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          columns={columns}
          dataSource={filteredList}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          scroll={{ x: 1320 }}
        />
      </Card>

      <Modal title={label.previewTitle} open={Boolean(previewRecord)} onCancel={() => setPreviewRecord(null)} footer={null}>
        {previewRecord ? (
          <Space direction="vertical" size={10}>
            <Typography.Text>
              {label.fieldName}：{previewRecord.name}
            </Typography.Text>
            <Typography.Text>
              {label.fieldType}：{previewRecord.type}
            </Typography.Text>
            <Typography.Text>
              {label.fieldSize}：{previewRecord.size}
            </Typography.Text>
            <Typography.Text>
              {label.fieldTag}：{previewRecord.tags.join(locale === 'en-US' ? ', ' : '、')}
            </Typography.Text>
            <Typography.Text>
              {label.fieldCreatedAt}：{previewRecord.createdAt}
            </Typography.Text>
          </Space>
        ) : null}
      </Modal>
    </Space>
  );
}
