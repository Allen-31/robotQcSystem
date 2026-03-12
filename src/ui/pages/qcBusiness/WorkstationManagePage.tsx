import { EyeOutlined, PauseCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { Badge, Button, Card, Col, Descriptions, Modal, Row, Segmented, Space, Statistic, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../../i18n/I18nProvider';
import type { StationRecord } from '../../../logic/qcBusiness/useWorkstationManage';
import { useWorkstationManage } from '../../../logic/qcBusiness/useWorkstationManage';

const mockNgCountByWorkstationId: Record<string, number> = { 'WS-A': 2, 'WS-B': 1 };

export function WorkstationManagePage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [viewingStation, setViewingStation] = useState<StationRecord | null>(null);
  const [summaryPeriod, setSummaryPeriod] = useState<'day' | 'week'>('day');
  const {
    workstations,
    selectedWorkstation,
    selectedWorkstationId,
    setSelectedWorkstationId,
    workstationEnabled,
    workstationRank,
    workstationSummary,
    stationList,
    toggleStationEnabled,
  } = useWorkstationManage();

  const columns: ColumnsType<StationRecord> = [
    {
      title: t('workstation.station.code'),
      dataIndex: 'code',
      key: 'code',
      width: 180,
    },
    {
      title: t('workstation.station.enabled'),
      dataIndex: 'enabled',
      key: 'enabled',
      width: 120,
      render: (enabled: boolean) =>
        enabled ? <Tag color="success">{t('workstation.enabled')}</Tag> : <Tag color="default">{t('workstation.disabled')}</Tag>,
    },
    {
      title: t('workstation.station.rank'),
      dataIndex: 'rank',
      key: 'rank',
      width: 100,
      sorter: (a, b) => a.rank - b.rank,
    },
    {
      title: t('workstation.station.inspectionCount'),
      dataIndex: 'inspectionCount',
      key: 'inspectionCount',
      width: 160,
      sorter: (a, b) => a.inspectionCount - b.inspectionCount,
    },
    {
      title: t('workstation.station.action'),
      key: 'actions',
      width: 220,
      render: (_, record) => (
        <Space size={4}>
          <Button type="link" icon={<EyeOutlined />} onClick={() => setViewingStation(record)}>
            {t('workstation.station.view')}
          </Button>
          <Button type="link" icon={record.enabled ? <PauseCircleOutlined /> : <PlayCircleOutlined />} onClick={() => toggleStationEnabled(record.id)}>
            {record.enabled ? t('workstation.station.disable') : t('workstation.station.enable')}
          </Button>
        </Space>
      ),
    },
  ];

  const summaryMetrics = useMemo(() => {
    if (summaryPeriod === 'day') {
      return {
        inspectionTotal: workstationSummary.inspectionTotal,
        avgInspectionDuration: workstationSummary.avgInspectionDuration,
      };
    }

    return {
      inspectionTotal: workstationSummary.inspectionTotal * 7 + workstationRank * 12,
      avgInspectionDuration: Number((workstationSummary.avgInspectionDuration + 0.6).toFixed(1)),
    };
  }, [summaryPeriod, workstationSummary, workstationRank]);

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {t('workstation.pageTitle')}
          </Typography.Title>
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Typography.Text strong>{t('workstation.current')}</Typography.Text>
            <Row gutter={[12, 12]}>
              {workstations.map((ws) => {
                const ngCount = mockNgCountByWorkstationId[ws.id] ?? 0;
                const selected = selectedWorkstationId === ws.id;
                return (
                  <Col key={ws.id} xs={24} sm={12} md={8} lg={6}>
                    <Badge count={ngCount} size="small" offset={[8, 0]} title={ngCount ? t('workstation.ngBadge') : undefined}>
                      <Card
                        size="small"
                        hoverable
                        onClick={() => setSelectedWorkstationId(ws.id)}
                        style={{
                          borderColor: selected ? '#1677ff' : undefined,
                          borderWidth: selected ? 2 : 1,
                          cursor: 'pointer',
                        }}
                      >
                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                          <Typography.Text strong>{ws.name}</Typography.Text>
                          <Typography.Text type="secondary">{ws.id}</Typography.Text>
                          {ngCount > 0 ? (
                            <Button
                              type="link"
                              size="small"
                              style={{ padding: 0, height: 'auto' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate('/qualityInspection/workOrderManage', { state: { openNgModal: true } });
                              }}
                            >
                              {t('workstation.viewNgList')}
                            </Button>
                          ) : null}
                        </Space>
                      </Card>
                    </Badge>
                  </Col>
                );
              })}
            </Row>
            <Row gutter={[16, 16]} align="middle" style={{ marginTop: 8 }}>
              <Col xs={24} lg={8}>
                <Space size={6}>
                  <Typography.Text type="secondary">{t('workstation.rank')}:</Typography.Text>
                  <Typography.Text strong>{workstationRank > 0 ? `#${workstationRank}` : '-'}</Typography.Text>
                </Space>
              </Col>
              <Col xs={24} lg={8}>
                <Space size={6} align="center">
                  <Typography.Text type="secondary">{t('workstation.enabledStatus')}:</Typography.Text>
                  {workstationEnabled ? <Tag color="success">{t('workstation.enabled')}</Tag> : <Tag color="default">{t('workstation.disabled')}</Tag>}
                </Space>
              </Col>
            </Row>
          </Space>
        </Space>
      </Card>

      <Card>
        <Row justify="end" style={{ marginBottom: 12 }}>
          <Segmented
            value={summaryPeriod}
            onChange={(value) => setSummaryPeriod(value as 'day' | 'week')}
            options={[
              { label: t('workstation.summary.periodDay'), value: 'day' },
              { label: t('workstation.summary.periodWeek'), value: 'week' },
            ]}
          />
        </Row>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Statistic
              title={summaryPeriod === 'day' ? t('workstation.summary.totalInspectionDay') : t('workstation.summary.totalInspectionWeek')}
              value={summaryMetrics.inspectionTotal}
            />
          </Col>
          <Col xs={24} md={8}>
            <Statistic
              title={t('workstation.summary.avgDuration')}
              value={summaryMetrics.avgInspectionDuration}
              suffix={t('workstation.summary.avgDurationUnit')}
            />
          </Col>
          <Col xs={24} md={8}>
            <Statistic title={t('workstation.summary.stationCount')} value={workstationSummary.stationCount} />
          </Col>
        </Row>
      </Card>

      <Card title={selectedWorkstation ? `${selectedWorkstation.name} - ${t('workstation.station.listTitle')}` : t('workstation.station.listTitle')}>
        <Table rowKey="id" columns={columns} dataSource={stationList} pagination={{ pageSize: 6, showSizeChanger: false }} />
      </Card>

      <Modal title={t('workstation.station.viewTitle')} open={Boolean(viewingStation)} onCancel={() => setViewingStation(null)} footer={null}>
        {viewingStation ? (
          <Descriptions size="small" column={1}>
            <Descriptions.Item label={t('workstation.station.code')}>{viewingStation.code}</Descriptions.Item>
            <Descriptions.Item label={t('workstation.station.enabled')}>
              {viewingStation.enabled ? t('workstation.enabled') : t('workstation.disabled')}
            </Descriptions.Item>
            <Descriptions.Item label={t('workstation.station.rank')}>#{viewingStation.rank}</Descriptions.Item>
            <Descriptions.Item label={t('workstation.station.inspectionCount')}>{viewingStation.inspectionCount}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Modal>
    </Space>
  );
}
