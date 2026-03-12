import {
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  PlusOutlined,
  SearchOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Checkbox,
  Col,
  Descriptions,
  Input,
  Modal,
  Row,
  Space,
  Table,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';
import type { UploadProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { workOrderList, type QualityResult, type WorkOrderItem, type WorkOrderStatus } from '../../../data/qcBusiness/workOrderList';
import { normalizeHarnessType, normalizeStationCode } from '../../../data/qcBusiness/qcConfigReference';
import { useI18n } from '../../../i18n/I18nProvider';

const statusColorMap: Record<WorkOrderStatus, string> = {
  pending: 'default',
  running: 'processing',
  paused: 'warning',
  finished: 'success',
  ng: 'error',
  cancelled: 'default',
};

const qualityColorMap: Record<QualityResult, string> = {
  ok: 'success',
  ng: 'error',
  pending: 'default',
};

function escapeCsv(value: string | number): string {
  const text = String(value ?? '');
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function buildCsv(rows: WorkOrderItem[]): string {
  const headers = [
    'workOrderNo',
    'harnessCode',
    'harnessType',
    'stationCode',
    'status',
    'qualityResult',
    'taskIds',
    'movingDuration',
    'detectionDuration',
    'createdAt',
    'startedAt',
    'endedAt',
  ];
  const lines = rows.map((row) =>
    [
      row.workOrderNo,
      row.harnessCode,
      row.harnessType,
      row.stationCode,
      row.status,
      row.qualityResult,
      row.taskIds.join(' / '),
      row.movingDuration,
      row.detectionDuration,
      row.createdAt,
      row.startedAt,
      row.endedAt,
    ]
      .map((item) => escapeCsv(item))
      .join(','),
  );
  return `${headers.join(',')}\n${lines.join('\n')}`;
}

function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

const displayDispatchCode = (record: WorkOrderItem): string =>
  record.taskIds?.length ? record.taskIds[0] : '-';

export function QualityRecordPage() {
  const { t } = useI18n();
  const [messageApi, contextHolder] = message.useMessage();
  const [keyword, setKeyword] = useState('');
  const [onlyNg, setOnlyNg] = useState(true);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [viewingRecord, setViewingRecord] = useState<WorkOrderItem | null>(null);

  const linkedList = useMemo(
    () =>
      workOrderList.map((item, index) => ({
        ...item,
        harnessType: normalizeHarnessType(item.harnessType, index),
        stationCode: normalizeStationCode(item.stationCode, index),
      })),
    [],
  );

  const dataSource = useMemo(() => {
    let list = linkedList;
    if (onlyNg) {
      list = list.filter((item) => item.qualityResult === 'ng');
    }
    const normalized = keyword.trim().toLowerCase();
    if (normalized) {
      list = list.filter((item) => {
        const text = `${item.workOrderNo} ${item.harnessCode} ${item.harnessType} ${item.stationCode} ${item.taskIds?.join(' ')}`.toLowerCase();
        return text.includes(normalized);
      });
    }
    return list;
  }, [keyword, onlyNg, linkedList]);

  const selectedRows = useMemo(() => {
    const keySet = new Set(selectedRowKeys.map(String));
    return dataSource.filter((item) => keySet.has(item.id));
  }, [dataSource, selectedRowKeys]);

  const exportCsv = () => {
    if (selectedRows.length === 0) {
      messageApi.warning(t('qualityRecord.exportSelectRequired'));
      return;
    }
    const csv = buildCsv(selectedRows);
    downloadCsv(csv, `quality-record-${new Date().toISOString().slice(0, 10)}.csv`);
    messageApi.success(t('qualityRecord.exportDone', { count: selectedRows.length }));
  };

  const columns: ColumnsType<WorkOrderItem> = [
    { title: t('qualityRecord.table.workOrderNo'), dataIndex: 'workOrderNo', key: 'workOrderNo', width: 170 },
    { title: t('qualityRecord.table.harnessCode'), dataIndex: 'harnessCode', key: 'harnessCode', width: 160 },
    { title: t('qualityRecord.table.harnessType'), dataIndex: 'harnessType', key: 'harnessType', width: 130 },
    { title: t('qualityRecord.table.stationCode'), dataIndex: 'stationCode', key: 'stationCode', width: 110 },
    {
      title: t('qualityRecord.table.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: WorkOrderStatus) => <Tag color={statusColorMap[status]}>{t(`workOrder.status.${status}`)}</Tag>,
    },
    {
      title: t('qualityRecord.table.qualityResult'),
      dataIndex: 'qualityResult',
      key: 'qualityResult',
      width: 100,
      render: (value: QualityResult) => <Tag color={qualityColorMap[value]}>{t(`workOrder.qualityResult.${value}`)}</Tag>,
    },
    {
      title: t('qualityRecord.table.dispatchCode'),
      key: 'dispatchCode',
      width: 120,
      render: (_, record) => displayDispatchCode(record),
    },
    { title: t('qualityRecord.table.movingDuration'), dataIndex: 'movingDuration', key: 'movingDuration', width: 100 },
    { title: t('qualityRecord.table.detectionDuration'), dataIndex: 'detectionDuration', key: 'detectionDuration', width: 100 },
    { title: t('qualityRecord.table.createdAt'), dataIndex: 'createdAt', key: 'createdAt', width: 160 },
    { title: t('qualityRecord.table.startedAt'), dataIndex: 'startedAt', key: 'startedAt', width: 160 },
    { title: t('qualityRecord.table.endedAt'), dataIndex: 'endedAt', key: 'endedAt', width: 160 },
    {
      title: t('qualityRecord.table.action'),
      key: 'action',
      width: 90,
      fixed: 'right',
      render: (_, record) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setViewingRecord(record)}>
          {t('qualityRecord.action.detail')}
        </Button>
      ),
    },
  ];

  const uploadProps: UploadProps = {
    accept: '.csv',
    showUploadList: false,
    beforeUpload: () => {
      messageApi.info(t('qualityRecord.importPlaceholder'));
      return Upload.LIST_IGNORE;
    },
  };

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {contextHolder}
      <Card>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {t('qualityRecord.pageTitle')}
          </Typography.Title>
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} md={14}>
              <Space wrap>
                <Input
                  allowClear
                  prefix={<SearchOutlined />}
                  placeholder={t('qualityRecord.searchPlaceholder')}
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  style={{ width: 260 }}
                />
                <Checkbox checked={onlyNg} onChange={(e) => setOnlyNg(e.target.checked)}>
                  {t('qualityRecord.onlyNg')}
                </Checkbox>
              </Space>
            </Col>
            <Col xs={24} md={10}>
              <Space wrap style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button type="primary" icon={<SearchOutlined />}>
                  {t('qualityRecord.toolbar.query')}
                </Button>
                <Button icon={<PlusOutlined />}>{t('qualityRecord.toolbar.create')}</Button>
                <Upload {...uploadProps}>
                  <Button icon={<UploadOutlined />}>{t('qualityRecord.toolbar.import')}</Button>
                </Upload>
                <Button icon={<DownloadOutlined />} onClick={exportCsv}>
                  {t('qualityRecord.toolbar.export')}
                </Button>
              </Space>
            </Col>
          </Row>
          <Table
            rowKey="id"
            rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
            columns={columns}
            dataSource={dataSource}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            scroll={{ x: 'max-content' }}
          />
        </Space>
      </Card>

      <Modal
        title={t('qualityRecord.detailTitle')}
        open={Boolean(viewingRecord)}
        onCancel={() => setViewingRecord(null)}
        footer={null}
        width={640}
      >
        {viewingRecord ? (
          <Descriptions column={2} size="small">
            <Descriptions.Item label={t('qualityRecord.table.workOrderNo')}>{viewingRecord.workOrderNo}</Descriptions.Item>
            <Descriptions.Item label={t('qualityRecord.table.harnessCode')}>{viewingRecord.harnessCode}</Descriptions.Item>
            <Descriptions.Item label={t('qualityRecord.table.harnessType')}>{viewingRecord.harnessType}</Descriptions.Item>
            <Descriptions.Item label={t('qualityRecord.table.stationCode')}>{viewingRecord.stationCode}</Descriptions.Item>
            <Descriptions.Item label={t('qualityRecord.table.status')}>
              <Tag color={statusColorMap[viewingRecord.status]}>{t(`workOrder.status.${viewingRecord.status}`)}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t('qualityRecord.table.qualityResult')}>
              <Tag color={qualityColorMap[viewingRecord.qualityResult]}>{t(`workOrder.qualityResult.${viewingRecord.qualityResult}`)}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t('qualityRecord.table.dispatchCode')}>{displayDispatchCode(viewingRecord)}</Descriptions.Item>
            <Descriptions.Item label={t('qualityRecord.table.movingDuration')}>{viewingRecord.movingDuration}</Descriptions.Item>
            <Descriptions.Item label={t('qualityRecord.table.detectionDuration')}>{viewingRecord.detectionDuration}</Descriptions.Item>
            <Descriptions.Item label={t('qualityRecord.table.createdAt')}>{viewingRecord.createdAt}</Descriptions.Item>
            <Descriptions.Item label={t('qualityRecord.table.startedAt')}>{viewingRecord.startedAt}</Descriptions.Item>
            <Descriptions.Item label={t('qualityRecord.table.endedAt')}>{viewingRecord.endedAt}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Modal>
    </Space>
  );
}
