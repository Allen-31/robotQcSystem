import { DownloadOutlined, FileImageOutlined, SearchOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { Button, Card, Col, Image, Input, Modal, Row, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { reinspectionRecordList, type ReinspectionRecordItem, type ReinspectionResult, type ReinspectionStatus } from '../../data/reinspectionRecordList';

const statusColorMap: Record<ReinspectionStatus, string> = {
  pending: 'default',
  completed: 'success',
  cancelled: 'warning',
};

const resultColorMap: Record<ReinspectionResult, string> = {
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

function buildCsv(rows: ReinspectionRecordItem[]): string {
  const headers = ['workOrderNo', 'harnessCode', 'harnessType', 'stationCode', 'status', 'reinspectionResult', 'reinspectionTime', 'reviewer'];
  const lines = rows.map((row) =>
    [
      row.workOrderNo,
      row.harnessCode,
      row.harnessType,
      row.stationCode,
      row.status,
      row.reinspectionResult,
      row.reinspectionTime,
      row.reviewer,
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

export function ReinspectionRecordPage() {
  const { t } = useI18n();
  const [messageApi, contextHolder] = message.useMessage();
  const [videoRecord, setVideoRecord] = useState<ReinspectionRecordItem | null>(null);
  const [imageRecord, setImageRecord] = useState<ReinspectionRecordItem | null>(null);
  const [keyword, setKeyword] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const dataSource = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) {
      return reinspectionRecordList;
    }
    return reinspectionRecordList.filter((item) => {
      const text =
        `${item.workOrderNo} ${item.harnessCode} ${item.harnessType} ${item.stationCode} ${item.status} ${item.reinspectionResult} ${item.reinspectionTime} ${item.reviewer}`.toLowerCase();
      return text.includes(normalized);
    });
  }, [keyword]);

  const selectedRows = useMemo(() => {
    const keySet = new Set(selectedRowKeys.map(String));
    return dataSource.filter((item) => keySet.has(item.id));
  }, [dataSource, selectedRowKeys]);

  const exportCsv = () => {
    if (selectedRows.length === 0) {
      messageApi.warning(t('reinspection.exportSelectRequired'));
      return;
    }
    const csv = buildCsv(selectedRows);
    downloadCsv(csv, `reinspection-records-${new Date().toISOString().slice(0, 10)}.csv`);
    messageApi.success(t('reinspection.exportDone', { count: selectedRows.length }));
  };

  const columns: ColumnsType<ReinspectionRecordItem> = [
    { title: t('reinspection.table.workOrderNo'), dataIndex: 'workOrderNo', key: 'workOrderNo', width: 170 },
    { title: t('reinspection.table.harnessCode'), dataIndex: 'harnessCode', key: 'harnessCode', width: 170 },
    { title: t('reinspection.table.harnessType'), dataIndex: 'harnessType', key: 'harnessType', width: 150 },
    { title: t('reinspection.table.stationCode'), dataIndex: 'stationCode', key: 'stationCode', width: 120 },
    {
      title: t('reinspection.table.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: ReinspectionStatus) => <Tag color={statusColorMap[status]}>{t(`reinspection.status.${status}`)}</Tag>,
    },
    {
      title: t('reinspection.table.result'),
      dataIndex: 'reinspectionResult',
      key: 'reinspectionResult',
      width: 120,
      render: (result: ReinspectionResult) => <Tag color={resultColorMap[result]}>{t(`reinspection.result.${result}`)}</Tag>,
    },
    { title: t('reinspection.table.time'), dataIndex: 'reinspectionTime', key: 'reinspectionTime', width: 170 },
    { title: t('reinspection.table.reviewer'), dataIndex: 'reviewer', key: 'reviewer', width: 150 },
    {
      title: t('reinspection.table.action'),
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Button type="link" icon={<VideoCameraOutlined />} onClick={() => setVideoRecord(record)}>
            {t('reinspection.action.video')}
          </Button>
          <Button type="link" icon={<FileImageOutlined />} onClick={() => setImageRecord(record)}>
            {t('reinspection.action.image')}
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
            {t('reinspection.pageTitle')}
          </Typography.Title>
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} lg={10}>
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder={t('reinspection.searchPlaceholder')}
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </Col>
            <Col xs={24} lg={14}>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button icon={<DownloadOutlined />} onClick={exportCsv}>
                  {t('reinspection.export')}
                </Button>
              </Space>
            </Col>
          </Row>
        </Space>
      </Card>

      <Card>
        <Table
          rowKey="id"
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          columns={columns}
          dataSource={dataSource}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          scroll={{ x: 1450 }}
        />
      </Card>

      <Modal title={t('reinspection.videoTitle')} open={Boolean(videoRecord)} onCancel={() => setVideoRecord(null)} footer={null}>
        {videoRecord ? (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Typography.Text>{videoRecord.workOrderNo}</Typography.Text>
            <div
              style={{
                height: 240,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
                color: '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: 12,
              }}
            >
              <div>
                <div>{t('reinspection.videoPlaceholder')}</div>
                <div style={{ marginTop: 8, fontSize: 12 }}>{videoRecord.videoUrl}</div>
              </div>
            </div>
          </Space>
        ) : null}
      </Modal>

      <Modal title={t('reinspection.imageTitle')} open={Boolean(imageRecord)} onCancel={() => setImageRecord(null)} footer={null}>
        {imageRecord ? (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Typography.Text>{imageRecord.workOrderNo}</Typography.Text>
            <Image
              src={imageRecord.imageUrl}
              alt={imageRecord.workOrderNo}
              fallback="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='960' height='540'><rect width='100%' height='100%' fill='%23e5e7eb'/><text x='50%' y='50%' font-size='22' text-anchor='middle' fill='%236b7280'>Image Preview Placeholder</text></svg>"
            />
          </Space>
        ) : null}
      </Modal>
    </Space>
  );
}
