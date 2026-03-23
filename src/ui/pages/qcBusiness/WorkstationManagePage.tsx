import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  ShopOutlined,
  StopOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { Badge, Button, Card, Col, Descriptions, Empty, Modal, Popconfirm, Row, Segmented, Space, Spin, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LongIdText } from '../../components/LongIdText';
import { useI18n } from '../../../i18n/I18nProvider';
import type { StationRecord } from '../../../logic/qcBusiness/useWorkstationManage';
import { useWorkstationManage } from '../../../logic/qcBusiness/useWorkstationManage';
import './WorkstationManagePage.css';

export function WorkstationManagePage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [viewingStation, setViewingStation] = useState<StationRecord | null>(null);
  const [summaryPeriod, setSummaryPeriod] = useState<'day' | 'week'>('day');
  const {
    workstations,
    positionsLoading,
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
      width: 200,
      render: (code: string) => <LongIdText value={code} maxChars={14} />,
      showSorterTooltip: false,
    },
    {
      title: t('workstation.station.enabled'),
      dataIndex: 'enabled',
      key: 'enabled',
      width: 120,
      render: (enabled: boolean) =>
        enabled ? (
          <Tag color="success" className="workstation-manage-tag workstation-manage-tag--enabled">
            <CheckCircleOutlined /> {t('workstation.enabled')}
          </Tag>
        ) : (
          <Tag color="default" className="workstation-manage-tag workstation-manage-tag--disabled">
            <CloseCircleOutlined /> {t('workstation.disabled')}
          </Tag>
        ),
    },
    {
      title: t('workstation.station.rank'),
      dataIndex: 'rank',
      key: 'rank',
      width: 100,
      sorter: (a, b) => a.rank - b.rank,
      showSorterTooltip: false,
    },
    {
      title: t('workstation.station.inspectionCount'),
      dataIndex: 'inspectionCount',
      key: 'inspectionCount',
      width: 140,
      sorter: (a, b) => a.inspectionCount - b.inspectionCount,
      showSorterTooltip: false,
    },
    {
      title: t('workstation.station.action'),
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size={12} className="workstation-manage-actions">
          <Button type="link" icon={<EyeOutlined />} onClick={() => setViewingStation(record)} className="workstation-manage-action-btn workstation-manage-action-btn--view">
            {t('workstation.station.view')}
          </Button>
          {record.enabled ? (
            <Popconfirm
              title={t('workstation.station.disableConfirm')}
              onConfirm={() => toggleStationEnabled(record.id)}
              okText={t('workstation.station.disable')}
              cancelText={t('qcConfig.common.cancel')}
            >
              <Button
                type="link"
                danger
                icon={<StopOutlined />}
                className="workstation-manage-action-btn workstation-manage-action-btn--disable"
              >
                {t('workstation.station.disable')}
              </Button>
            </Popconfirm>
          ) : (
            <Button
              type="link"
              icon={<PlayCircleOutlined />}
              onClick={() => toggleStationEnabled(record.id)}
              className="workstation-manage-action-btn workstation-manage-action-btn--enable"
            >
              {t('workstation.station.enable')}
            </Button>
          )}
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
      inspectionTotal: workstationSummary.inspectionTotal * 7,
      avgInspectionDuration: Number((workstationSummary.avgInspectionDuration + 0.6).toFixed(1)),
    };
  }, [summaryPeriod, workstationSummary]);

  const effectiveSelectedWorkstationId = selectedWorkstationId || selectedWorkstation?.id || '';

  return (
    <div className="workstation-manage-page">
      <Card className="workstation-manage-current-card">
        <section className="workstation-manage-zones">
          <div className="workstation-manage-zones-grid">
            {workstations.map((ws) => {
              const ngCount = 0;
              const selected = effectiveSelectedWorkstationId === ws.id;
              const isEnabled = ws.status === 'running';
              return (
                <Badge key={ws.id} count={ngCount} size="small" offset={[-4, 4]} title={ngCount ? t('workstation.ngBadge') : undefined}>
                  <Card
                    size="small"
                    hoverable
                    onClick={() => setSelectedWorkstationId(ws.id)}
                    className={`workstation-manage-zone-card ${selected ? 'workstation-manage-zone-card--selected' : ''}`}
                  >
                    <span className={`workstation-manage-zone-status-dot ${isEnabled ? 'workstation-manage-zone-status-dot--enabled' : 'workstation-manage-zone-status-dot--disabled'}`} title={isEnabled ? t('workstation.enabled') : t('workstation.disabled')} />
                    <div className="workstation-manage-zone-card-inner">
                      <div className="workstation-manage-zone-icon-wrap">
                        <ShopOutlined className="workstation-manage-zone-icon" />
                      </div>
                      <div className="workstation-manage-zone-body">
                        <Typography.Text strong className="workstation-manage-zone-name">
                          {ws.name}
                        </Typography.Text>
                        <span className="workstation-manage-zone-id">
                          <LongIdText value={ws.id} maxChars={12} />
                        </span>
                        {ngCount > 0 && (
                          <Button
                            type="link"
                            size="small"
                            className="workstation-manage-zone-ng-link"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/qualityInspection/workOrderManage', { state: { openNgModal: true } });
                            }}
                          >
                            {t('workstation.viewNgList')}
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </Badge>
              );
            })}
          </div>
          <div className="workstation-manage-meta">
            <Space size={24} wrap align="center">
              <Space size={8}>
                <Typography.Text type="secondary">{t('workstation.rank')}</Typography.Text>
                <Typography.Text strong className="workstation-manage-meta-value">{workstationRank > 0 ? `#${workstationRank}` : '–'}</Typography.Text>
              </Space>
              <Space size={8} align="center">
                <Typography.Text type="secondary">{t('workstation.enabledStatus')}</Typography.Text>
                {workstationEnabled ? (
                  <span className="workstation-manage-status-pill workstation-manage-status-pill--enabled">
                    <CheckCircleOutlined /> {t('workstation.enabled')}
                  </span>
                ) : (
                  <span className="workstation-manage-status-pill workstation-manage-status-pill--disabled">
                    <CloseCircleOutlined /> {t('workstation.disabled')}
                  </span>
                )}
              </Space>
            </Space>
          </div>
        </section>
      </Card>

      <Card className="workstation-manage-stats-card">
        <div className="workstation-manage-stats-toolbar">
          <Segmented
            block
            value={summaryPeriod}
            onChange={(value) => setSummaryPeriod(value as 'day' | 'week')}
            options={[
              { label: t('workstation.summary.periodDay'), value: 'day' },
              { label: t('workstation.summary.periodWeek'), value: 'week' },
            ]}
            className="workstation-manage-segmented"
          />
        </div>
        <Row gutter={[16, 16]} className="workstation-manage-stats-row">
          <Col xs={24} sm={12} lg={8}>
            <div className="workstation-manage-stat-card">
              <span className="workstation-manage-stat-title">
                <UnorderedListOutlined className="workstation-manage-stat-icon" />
                {summaryPeriod === 'day' ? t('workstation.summary.totalInspectionDay') : t('workstation.summary.totalInspectionWeek')}
              </span>
              <span className="workstation-manage-stat-value">{summaryMetrics.inspectionTotal}</span>
            </div>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <div className="workstation-manage-stat-card">
              <span className="workstation-manage-stat-title">
                <ClockCircleOutlined className="workstation-manage-stat-icon" />
                {t('workstation.summary.avgDuration')}
              </span>
              <span className="workstation-manage-stat-value">
                {summaryMetrics.avgInspectionDuration}
                <span className="workstation-manage-stat-unit">{t('workstation.summary.avgDurationUnit')}</span>
              </span>
            </div>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <div className="workstation-manage-stat-card">
              <span className="workstation-manage-stat-title">
                <CheckCircleOutlined className="workstation-manage-stat-icon" />
                {t('workstation.summary.stationCount')}
              </span>
              <span className="workstation-manage-stat-value">{workstationSummary.stationCount}</span>
            </div>
          </Col>
        </Row>
      </Card>

      <section className="workstation-manage-table-section">
        <Card className="workstation-manage-table-card" title={selectedWorkstation ? `${selectedWorkstation.name} · ${t('workstation.station.listTitle')}` : t('workstation.station.listTitle')}>
          {positionsLoading ? (
            <div className="workstation-manage-table-loading">
              <Spin />
            </div>
          ) : stationList.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t('workstation.station.empty')}
              className="workstation-manage-table-empty"
            />
          ) : (
            <Table
              rowKey="id"
              columns={columns}
              dataSource={stationList}
              pagination={{ pageSize: 6, showSizeChanger: false }}
              className="workstation-manage-table"
            />
          )}
        </Card>
      </section>

      <Modal
        title={t('workstation.station.viewTitle')}
        open={Boolean(viewingStation)}
        onCancel={() => setViewingStation(null)}
        footer={null}
        width={420}
        className="workstation-manage-modal"
      >
        {viewingStation && (
          <Descriptions size="small" column={1} className="workstation-manage-descriptions">
            <Descriptions.Item label={t('workstation.station.code')}>{viewingStation.code}</Descriptions.Item>
            <Descriptions.Item label={t('workstation.station.enabled')}>
              {viewingStation.enabled ? t('workstation.enabled') : t('workstation.disabled')}
            </Descriptions.Item>
            <Descriptions.Item label={t('workstation.station.rank')}>#{viewingStation.rank}</Descriptions.Item>
            <Descriptions.Item label={t('workstation.station.inspectionCount')}>{viewingStation.inspectionCount}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
