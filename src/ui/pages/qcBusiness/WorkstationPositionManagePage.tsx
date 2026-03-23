import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  ShopOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { Badge, Button, Card, Col, Descriptions, Form, Image, Input, Modal, Popconfirm, Row, Segmented, Select, Space, Spin, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { wireHarnessTypeList } from '../../../data/qcConfig/wireHarnessTypeList';
import type { RobotStatus, WorkOrderInfo, WorkOrderStatus } from '../../../data/qcBusiness/workstationPositionList';
import { useI18n } from '../../../i18n/I18nProvider';
import { useWorkstationPositionManage } from '../../../logic/qcBusiness/useWorkstationPositionManage';
import { loadQcWireHarnessAnnotations } from '../../../shared/qcWireHarnessAnnotation';
import './WorkstationManagePage.css';

const robotStatusColorMap: Record<RobotStatus, string> = {
  idle: 'default',
  working: 'processing',
  fault: 'error',
  offline: 'warning',
};

const workOrderStatusColorMap: Record<WorkOrderStatus, string> = {
  pending: 'default',
  running: 'processing',
  finished: 'success',
  ng: 'error',
};

function qualityTagColor(value: WorkOrderInfo['qualityResult']): string {
  if (value === 'ok') {
    return 'success';
  }
  if (value === 'ng') {
    return 'error';
  }
  return 'default';
}

type InspectionPointStatus = 'ok' | 'ng';
type InspectionPointMediaType = 'image' | 'video';

interface InspectionPointItem {
  id: string;
  pointCode: string;
  status: InspectionPointStatus;
  robot: string;
  result: string;
  mediaType: InspectionPointMediaType;
  mediaUrl: string;
  duration: number;
  startedAt: string;
  endedAt: string;
  x: number;
  y: number;
  labelX: number;
  labelY: number;
}

function buildMockPointImage(pointCode: string, status: InspectionPointStatus): string {
  const color = status === 'ok' ? '#16a34a' : '#dc2626';
  const resultText = status === 'ok' ? 'OK' : 'NG';
  const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' width='960' height='540'>
      <defs>
        <linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stop-color='#f8fafc'/>
          <stop offset='100%' stop-color='#e2e8f0'/>
        </linearGradient>
      </defs>
      <rect width='100%' height='100%' fill='url(#bg)'/>
      <rect x='32' y='32' width='896' height='476' rx='12' fill='none' stroke='#94a3b8' stroke-width='2'/>
      <text x='56' y='86' font-size='30' fill='#0f172a' font-family='Arial'>Inspection Sample</text>
      <text x='56' y='132' font-size='24' fill='#334155' font-family='Arial'>Point: ${pointCode}</text>
      <circle cx='480' cy='290' r='58' fill='white' stroke='${color}' stroke-width='8'/>
      <text x='480' y='303' font-size='36' text-anchor='middle' fill='${color}' font-family='Arial' font-weight='700'>${resultText}</text>
    </svg>
  `.trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function buildInspectionPoints(workOrder: WorkOrderInfo): InspectionPointItem[] {
  const layout = [
    { code: 'BD01', x: 3, y: 50.6, labelX: 7, labelY: 60 },
    { code: 'BD10', x: 32, y: 50.6, labelX: 35, labelY: 60 },
    { code: 'BD90', x: 56, y: 16.7, labelX: 53, labelY: 11 },
    { code: 'BD24A', x: 59, y: 50.6, labelX: 61, labelY: 60 },
    { code: 'BD24', x: 59, y: 21.7, labelX: 61, labelY: 17 },
    { code: 'BD12', x: 76, y: 50.6, labelX: 78, labelY: 60 },
    { code: 'BD78', x: 82, y: 86.7, labelX: 85, labelY: 92 },
  ];

  return layout.map((item, index) => {
    const status: InspectionPointStatus = (workOrder.qualityResult === 'ng' && index >= 4) || index === 1 ? 'ng' : 'ok';
    const mediaType: InspectionPointMediaType = index % 2 === 0 ? 'image' : 'video';
    const duration = Number((workOrder.detectionDuration / layout.length + index * 0.3).toFixed(1));
    return {
      id: `${workOrder.workOrderNo}-${item.code}`,
      pointCode: item.code,
      status,
      robot: `RB-${workOrder.stationCode}-${(index % 2) + 1}`,
      result: status === 'ok' ? 'OK' : 'NG',
      mediaType,
      mediaUrl:
        mediaType === 'image'
          ? buildMockPointImage(item.code, status)
          : `https://example.com/workorder/${workOrder.workOrderNo}/${item.code}.mp4`,
      duration,
      startedAt: workOrder.startedAt === '-' ? '-' : workOrder.startedAt,
      endedAt: workOrder.endedAt === '-' ? '-' : workOrder.endedAt,
      x: item.x,
      y: item.y,
      labelX: item.labelX,
      labelY: item.labelY,
    };
  });
}

function resolveWireHarnessId(harnessType: string): string | null {
  const normalized = harnessType.trim();
  const typedList = wireHarnessTypeList.map((item) => ({
    id: String(item.id),
    name: item.name,
  }));

  const explicitId = normalized.match(/WH-\d{3}/i)?.[0]?.toUpperCase();
  if (explicitId && typedList.some((item) => item.id.toUpperCase() === explicitId)) {
    return explicitId;
  }

  const suffix = normalized.match(/-([ABC])$/i)?.[1]?.toUpperCase();
  if (suffix === 'A') {
    return typedList.find((item) => item.id === 'WH-001')?.id ?? null;
  }
  if (suffix === 'B') {
    return typedList.find((item) => item.id === 'WH-002')?.id ?? null;
  }
  if (suffix === 'C') {
    return typedList.find((item) => item.id === 'WH-003')?.id ?? null;
  }

  const exact = typedList.find((item) => item.id === normalized || item.name === normalized);
  if (exact) {
    return exact.id;
  }

  const levelMatch = /L(\d+)/i.exec(normalized);
  if (levelMatch) {
    const level = Number(levelMatch[1]);
    if (level > 0 && level <= typedList.length) {
      return typedList[level - 1]?.id ?? null;
    }
  }

  return null;
}

const mockNgCountByPositionId: Record<string, number> = { 'PS-CFG-1': 1, 'PS-CFG-2': 2 };

export function WorkstationPositionManagePage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [reviewForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [viewingHistoryWorkOrder, setViewingHistoryWorkOrder] = useState<WorkOrderInfo | null>(null);
  const [previewPoint, setPreviewPoint] = useState<InspectionPointItem | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [summaryPeriod, setSummaryPeriod] = useState<'day' | 'week'>('day');
  const {
    positionList,
    loading: positionListLoading,
    selectedPositionId,
    setSelectedPositionId,
    selectedPosition,
    positionRank,
    historyWorkOrders,
    defectTypeOptions,
    emergencyStopRobot,
    resetRobot,
    reviewCurrentWorkOrder,
  } = useWorkstationPositionManage();

  const historyColumns: ColumnsType<WorkOrderInfo> = [
    { title: t('workstationPosition.history.workOrderNo'), dataIndex: 'workOrderNo', key: 'workOrderNo', width: 170 },
    {
      title: t('workstationPosition.history.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: WorkOrderStatus) => <Tag color={workOrderStatusColorMap[status]}>{t(`workstationPosition.workOrder.status.${status}`)}</Tag>,
    },
    {
      title: t('workstationPosition.history.qualityResult'),
      dataIndex: 'qualityResult',
      key: 'qualityResult',
      width: 120,
      render: (value: WorkOrderInfo['qualityResult']) => (
        <Tag color={qualityTagColor(value)}>{t(`workstationPosition.workOrder.qualityResult.${value}`)}</Tag>
      ),
    },
    {
      title: t('workstationPosition.history.taskIds'),
      dataIndex: 'taskIds',
      key: 'taskIds',
      width: 220,
      render: (taskIds: string[]) => taskIds.join(' / '),
    },
    { title: t('workstationPosition.history.movingDuration'), dataIndex: 'movingDuration', key: 'movingDuration', width: 130 },
    { title: t('workstationPosition.history.detectionDuration'), dataIndex: 'detectionDuration', key: 'detectionDuration', width: 130 },
    { title: t('workstationPosition.history.createdAt'), dataIndex: 'createdAt', key: 'createdAt', width: 170 },
    { title: t('workstationPosition.history.startedAt'), dataIndex: 'startedAt', key: 'startedAt', width: 170 },
    { title: t('workstationPosition.history.endedAt'), dataIndex: 'endedAt', key: 'endedAt', width: 170 },
    {
      title: t('workstationPosition.history.action'),
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Button type="link" onClick={() => setViewingHistoryWorkOrder(record)}>
          {t('workstationPosition.history.view')}
        </Button>
      ),
    },
  ];

  const inspectionPoints = useMemo(() => {
    if (!viewingHistoryWorkOrder) {
      return [];
    }
    return buildInspectionPoints(viewingHistoryWorkOrder);
  }, [viewingHistoryWorkOrder]);

  const summaryMetrics = useMemo(() => {
    const todayCount = selectedPosition?.todayInspectionCount ?? 0;
    const todayDetectionRate = selectedPosition?.detectionRate ?? 0;
    const todayReviewRate = selectedPosition?.reviewRate ?? 0;

    if (summaryPeriod === 'day') {
      return {
        inspectionCount: todayCount,
        detectionRate: todayDetectionRate,
        reviewRate: todayReviewRate,
      };
    }

    const weekCount = todayCount * 7 + positionRank * 9;
    const weekDetectionRate = Number(Math.min(todayDetectionRate + 0.7, 99.9).toFixed(1));
    const weekReviewRate = Number(Math.min(todayReviewRate + 0.5, 99.9).toFixed(1));
    return {
      inspectionCount: weekCount,
      detectionRate: weekDetectionRate,
      reviewRate: weekReviewRate,
    };
  }, [positionRank, selectedPosition, summaryPeriod]);

  const currentOrderHarness2DImage = useMemo(() => {
    const harnessType = selectedPosition?.currentWorkOrder.fixtureLineType;
    if (!harnessType) {
      return null;
    }
    const wireHarnessId = resolveWireHarnessId(harnessType);
    if (!wireHarnessId) {
      return null;
    }
    const annotations = loadQcWireHarnessAnnotations();
    return annotations.imageByHarnessId[wireHarnessId] ?? null;
  }, [selectedPosition]);

  const currentOrderInspectionPoints = useMemo(() => {
    if (!selectedPosition) {
      return [];
    }
    return buildInspectionPoints(selectedPosition.currentWorkOrder);
  }, [selectedPosition]);

  const currentOrderOverlayPoints = useMemo(() => {
    const harnessType = selectedPosition?.currentWorkOrder.fixtureLineType;
    if (!harnessType) {
      return currentOrderInspectionPoints.map((point) => ({
        x: point.x,
        y: point.y,
        label: point.pointCode,
      }));
    }
    const wireHarnessId = resolveWireHarnessId(harnessType);
    if (!wireHarnessId) {
      return currentOrderInspectionPoints.map((point) => ({
        x: point.x,
        y: point.y,
        label: point.pointCode,
      }));
    }
    const annotations = loadQcWireHarnessAnnotations();
    const annotationPoints = annotations.pointsByHarnessId[wireHarnessId] ?? [];
    if (annotationPoints.length === 0) {
      return currentOrderInspectionPoints.map((point) => ({
        x: point.x,
        y: point.y,
        label: point.pointCode,
      }));
    }
    return annotationPoints.map((point, index) => ({
      x: point.x,
      y: point.y,
      label: point.description?.trim() || `P${index + 1}`,
    }));
  }, [selectedPosition, currentOrderInspectionPoints]);

  const historyOrderHarness2DImage = useMemo(() => {
    const harnessType = viewingHistoryWorkOrder?.fixtureLineType;
    if (!harnessType) {
      return null;
    }
    const wireHarnessId = resolveWireHarnessId(harnessType);
    if (!wireHarnessId) {
      return null;
    }
    const annotations = loadQcWireHarnessAnnotations();
    return annotations.imageByHarnessId[wireHarnessId] ?? null;
  }, [viewingHistoryWorkOrder]);

  const historyOrderOverlayPoints = useMemo(() => {
    const harnessType = viewingHistoryWorkOrder?.fixtureLineType;
    if (!harnessType) {
      return inspectionPoints.map((point) => ({
        x: point.x,
        y: point.y,
        label: point.pointCode,
      }));
    }
    const wireHarnessId = resolveWireHarnessId(harnessType);
    if (!wireHarnessId) {
      return inspectionPoints.map((point) => ({
        x: point.x,
        y: point.y,
        label: point.pointCode,
      }));
    }
    const annotations = loadQcWireHarnessAnnotations();
    const annotationPoints = annotations.pointsByHarnessId[wireHarnessId] ?? [];
    if (annotationPoints.length === 0) {
      return inspectionPoints.map((point) => ({
        x: point.x,
        y: point.y,
        label: point.pointCode,
      }));
    }
    return annotationPoints.map((point, index) => ({
      x: point.x,
      y: point.y,
      label: point.description?.trim() || `P${index + 1}`,
    }));
  }, [viewingHistoryWorkOrder, inspectionPoints]);

  const pointColumns: ColumnsType<InspectionPointItem> = [
    { title: t('workOrder.detail.pointCode'), dataIndex: 'pointCode', key: 'pointCode', width: 100 },
    {
      title: t('workOrder.detail.pointStatus'),
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (value: InspectionPointStatus) => <Tag color={value === 'ok' ? 'success' : 'error'}>{value === 'ok' ? t('workOrder.detail.ok') : t('workOrder.detail.ng')}</Tag>,
    },
    { title: t('workOrder.detail.pointRobot'), dataIndex: 'robot', key: 'robot', width: 140 },
    { title: t('workOrder.detail.pointResult'), dataIndex: 'result', key: 'result', width: 110 },
    {
      title: t('workOrder.detail.pointMedia'),
      dataIndex: 'mediaType',
      key: 'mediaType',
      width: 140,
      render: (_, record) => (
        <Button type="link" onClick={() => setPreviewPoint(record)}>
          {record.mediaType === 'video' ? t('workOrder.detail.viewVideo') : t('workOrder.detail.viewImage')}
        </Button>
      ),
    },
    { title: t('workOrder.detail.pointDuration'), dataIndex: 'duration', key: 'duration', width: 110, render: (value: number) => `${value}${t('workstationPosition.timeUnit')}` },
    { title: t('workOrder.detail.pointStartedAt'), dataIndex: 'startedAt', key: 'startedAt', width: 170 },
    { title: t('workOrder.detail.pointEndedAt'), dataIndex: 'endedAt', key: 'endedAt', width: 170 },
  ];

  return (
    <Spin spinning={positionListLoading}>
      <div className="workstation-manage-page">
        {contextHolder}
        <Card className="workstation-manage-current-card">
          <section className="workstation-manage-zones">
            <div className="workstation-manage-zones-grid">
              {positionList.map((pos) => {
                const ngCount = mockNgCountByPositionId[pos.id] ?? 0;
                const selected = selectedPositionId === pos.id;
                return (
                  <Badge key={pos.id} count={ngCount} size="small" offset={[-4, 4]} title={ngCount ? t('workstation.ngBadge') : undefined}>
                    <Card
                      size="small"
                      hoverable
                      onClick={() => setSelectedPositionId(pos.id)}
                      className={`workstation-manage-zone-card ${selected ? 'workstation-manage-zone-card--selected' : ''}`}
                    >
                      <span
                        className={`workstation-manage-zone-status-dot ${pos.enabled ? 'workstation-manage-zone-status-dot--enabled' : 'workstation-manage-zone-status-dot--disabled'}`}
                        title={pos.enabled ? t('workstationPosition.enabled') : t('workstationPosition.disabled')}
                      />
                      <div className="workstation-manage-zone-card-inner">
                        <div className="workstation-manage-zone-icon-wrap">
                          <ShopOutlined className="workstation-manage-zone-icon" />
                        </div>
                        <div className="workstation-manage-zone-body">
                          <Typography.Text strong className="workstation-manage-zone-name">
                            {pos.name}
                          </Typography.Text>
                          <span className="workstation-manage-zone-id">{pos.stationCode}</span>
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
                  <Typography.Text type="secondary">{t('workstationPosition.rank')}</Typography.Text>
                  <Typography.Text strong className="workstation-manage-meta-value">{positionRank > 0 ? `#${positionRank}` : '-'}</Typography.Text>
                </Space>
                <Space size={8} align="center">
                  <Typography.Text type="secondary">{t('workstationPosition.enabledStatus')}</Typography.Text>
                  {selectedPosition?.enabled ? (
                    <span className="workstation-manage-status-pill workstation-manage-status-pill--enabled">
                      <CheckCircleOutlined /> {t('workstationPosition.enabled')}
                    </span>
                  ) : (
                    <span className="workstation-manage-status-pill workstation-manage-status-pill--disabled">
                      <CloseCircleOutlined /> {t('workstationPosition.disabled')}
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
                { label: t('workstationPosition.summary.periodDay'), value: 'day' },
                { label: t('workstationPosition.summary.periodWeek'), value: 'week' },
              ]}
              className="workstation-manage-segmented"
            />
          </div>
          <Row gutter={[16, 16]} className="workstation-manage-stats-row">
            <Col xs={24} sm={12} lg={6}>
              <div className="workstation-manage-stat-card">
                <span className="workstation-manage-stat-title">
                  <UnorderedListOutlined className="workstation-manage-stat-icon" />
                  {t('workstationPosition.summary.rank')}
                </span>
                <span className="workstation-manage-stat-value">{positionRank > 0 ? `#${positionRank}` : '-'}</span>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="workstation-manage-stat-card">
                <span className="workstation-manage-stat-title">
                  <UnorderedListOutlined className="workstation-manage-stat-icon" />
                  {summaryPeriod === 'day' ? t('workstationPosition.summary.todayInspection') : t('workstationPosition.summary.weekInspection')}
                </span>
                <span className="workstation-manage-stat-value">{summaryMetrics.inspectionCount}</span>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="workstation-manage-stat-card">
                <span className="workstation-manage-stat-title">
                  <CheckCircleOutlined className="workstation-manage-stat-icon" />
                  {t('workstationPosition.summary.detectionRate')}
                </span>
                <span className="workstation-manage-stat-value">
                  {summaryMetrics.detectionRate}
                  <span className="workstation-manage-stat-unit">%</span>
                </span>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="workstation-manage-stat-card">
                <span className="workstation-manage-stat-title">
                  <CheckCircleOutlined className="workstation-manage-stat-icon" />
                  {t('workstationPosition.summary.reviewRate')}
                </span>
                <span className="workstation-manage-stat-value">
                  {summaryMetrics.reviewRate}
                  <span className="workstation-manage-stat-unit">%</span>
                </span>
              </div>
            </Col>
          </Row>
        </Card>

      <Card title={t('workstationPosition.robot.title')} className="workstation-manage-table-card">
        <Row gutter={[16, 16]}>
          {(selectedPosition?.robots ?? []).map((robot) => (
            <Col xs={24} md={12} key={robot.robotCode}>
              <Card size="small">
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <Descriptions size="small" column={1}>
                    <Descriptions.Item label={t('workstationPosition.robot.code')}>{robot.robotCode}</Descriptions.Item>
                    <Descriptions.Item label={t('workstationPosition.robot.status')}>
                      <Tag color={robotStatusColorMap[robot.status]}>{t(`workstationPosition.robot.status.${robot.status}`)}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label={t('workstationPosition.robot.battery')}>{robot.battery}%</Descriptions.Item>
                    <Descriptions.Item label={t('workstationPosition.robot.abnormalInfo')}>
                      <Space size={6}>
                        <ExclamationCircleOutlined />
                        <Typography.Text>{robot.abnormalInfo}</Typography.Text>
                      </Space>
                    </Descriptions.Item>
                  </Descriptions>
                  <Space size={8}>
                    <Popconfirm
                      title={t('workstationPosition.robot.confirmEmergencyStopTitle')}
                      description={t('workstationPosition.robot.confirmEmergencyStopContent', { robotCode: robot.robotCode })}
                      okText={t('workstationPosition.robot.emergencyStop')}
                      cancelText={t('workstationPosition.robot.confirmCancel')}
                      okButtonProps={{ danger: true }}
                      onConfirm={() => {
                        emergencyStopRobot(robot.robotCode);
                        messageApi.warning(t('workstationPosition.robot.emergencyStopDone'));
                      }}
                    >
                      <Button danger size="small" icon={<PauseCircleOutlined />}>
                        {t('workstationPosition.robot.emergencyStop')}
                      </Button>
                    </Popconfirm>
                    <Popconfirm
                      title={t('workstationPosition.robot.confirmResetTitle')}
                      description={t('workstationPosition.robot.confirmResetContent', { robotCode: robot.robotCode })}
                      okText={t('workstationPosition.robot.reset')}
                      cancelText={t('workstationPosition.robot.confirmCancel')}
                      onConfirm={() => {
                        resetRobot(robot.robotCode);
                        messageApi.success(t('workstationPosition.robot.resetDone'));
                      }}
                    >
                      <Button size="small" icon={<ReloadOutlined />}>
                        {t('workstationPosition.robot.reset')}
                      </Button>
                    </Popconfirm>
                  </Space>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Card title={t('workstationPosition.currentOrder.title')} className="workstation-manage-table-card">
        <Descriptions size="small" bordered column={3}>
          <Descriptions.Item label={t('workstationPosition.currentOrder.workOrderNo')}>{selectedPosition?.currentWorkOrder.workOrderNo ?? '-'}</Descriptions.Item>
          <Descriptions.Item label={t('workstationPosition.currentOrder.movingDuration')}>
            {selectedPosition ? `${selectedPosition.currentWorkOrder.movingDuration}${t('workstationPosition.timeUnit')}` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('workstationPosition.currentOrder.fixtureLineType')}>
            {selectedPosition?.currentWorkOrder.fixtureLineType ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('workstationPosition.currentOrder.stationCode')}>{selectedPosition?.currentWorkOrder.stationCode ?? '-'}</Descriptions.Item>
          <Descriptions.Item label={t('workstationPosition.currentOrder.status')}>
            {selectedPosition?.currentWorkOrder ? (
              (() => {
                const s = selectedPosition.currentWorkOrder.status ?? 'pending';
                const safe = s in workOrderStatusColorMap ? s : 'pending';
                return (
                  <Tag color={workOrderStatusColorMap[safe]}>
                    {t(`workstationPosition.workOrder.status.${safe}`)}
                  </Tag>
                );
              })()
            ) : (
              '-'
            )}
          </Descriptions.Item>
          <Descriptions.Item label={t('workstationPosition.currentOrder.qualityResult')}>
            {selectedPosition ? (
              <Tag color={qualityTagColor(selectedPosition.currentWorkOrder.qualityResult)}>
                {t(`workstationPosition.workOrder.qualityResult.${selectedPosition.currentWorkOrder.qualityResult}`)}
              </Tag>
            ) : (
              '-'
            )}
          </Descriptions.Item>
          <Descriptions.Item label={t('workstationPosition.currentOrder.taskIds')} span={2}>
            {selectedPosition?.currentWorkOrder.taskIds.join(' / ') ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('workstationPosition.currentOrder.detectionDuration')}>
            {selectedPosition ? `${selectedPosition.currentWorkOrder.detectionDuration}${t('workstationPosition.timeUnit')}` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('workstationPosition.currentOrder.createdAt')}>{selectedPosition?.currentWorkOrder.createdAt ?? '-'}</Descriptions.Item>
          <Descriptions.Item label={t('workstationPosition.currentOrder.startedAt')}>{selectedPosition?.currentWorkOrder.startedAt ?? '-'}</Descriptions.Item>
          <Descriptions.Item label={t('workstationPosition.currentOrder.endedAt')}>{selectedPosition?.currentWorkOrder.endedAt ?? '-'}</Descriptions.Item>
          <Descriptions.Item label={t('workOrder.detail.defectType')}>{selectedPosition?.currentWorkOrder.defectType ?? '-'}</Descriptions.Item>
          <Descriptions.Item label={t('workOrder.detail.defectDescription')} span={2}>
            {selectedPosition?.currentWorkOrder.defectDescription ?? '-'}
          </Descriptions.Item>
        </Descriptions>
        <Card size="small" title={t('workOrder.detail.harness2dTitle')} style={{ marginTop: 12 }}>
          {currentOrderHarness2DImage ? (
            <div
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: 760,
                margin: '0 auto',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                background: '#fff',
                overflow: 'hidden',
              }}
            >
              <img
                src={currentOrderHarness2DImage}
                alt="current-workorder-harness-2d"
                style={{ width: '100%', display: 'block' }}
              />
              {currentOrderOverlayPoints.map((point, index) => (
                <div key={`current-order-overlay-${point.x}-${point.y}-${index}`}>
                  <button
                    type="button"
                    onClick={() => setPreviewPoint(currentOrderInspectionPoints[index] ?? null)}
                    title={point.label}
                    style={{
                      position: 'absolute',
                      left: `${point.x}%`,
                      top: `${point.y}%`,
                      transform: 'translate(-50%, -50%)',
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      border: '2px solid #ffffff',
                      background: currentOrderInspectionPoints[index]?.status === 'ng' ? '#ff4d4f' : '#1677ff',
                      boxShadow: '0 1px 6px rgba(0, 0, 0, 0.35)',
                      cursor: currentOrderInspectionPoints[index] ? 'pointer' : 'default',
                      padding: 0,
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 700,
                      lineHeight: '18px',
                      textAlign: 'center',
                    }}
                  >
                    {index + 1}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                height: 220,
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6b7280',
                background: '#f8fafc',
              }}
            >
              2D harness image is not configured yet
            </div>
          )}
        </Card>
        <div style={{ marginTop: 12 }}>
          <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
            {t('workstationPosition.currentOrder.reviewHintAlways')}
          </Typography.Text>
          {selectedPosition?.currentWorkOrder.qualityResult === 'ng' ? (
            <Typography.Text type="warning" style={{ display: 'block', marginBottom: 8 }}>
              {t('workstationPosition.currentOrder.reviewHint')}
            </Typography.Text>
          ) : null}
          <Button
            type="primary"
            onClick={() => {
              const currentOrder = selectedPosition?.currentWorkOrder;
              if (!currentOrder) {
                return;
              }
              reviewForm.setFieldsValue({
                reviewResult: currentOrder.qualityResult === 'pending' ? 'ok' : currentOrder.qualityResult,
                defectType:
                  currentOrder.defectType === '-' || !currentOrder.defectType
                    ? []
                    : currentOrder.defectType.split(',').map((item) => item.trim()).filter(Boolean),
                defectDescription: currentOrder.defectDescription === '-' ? '' : currentOrder.defectDescription,
              });
              setReviewOpen(true);
            }}
          >
            {t('workstationPosition.currentOrder.review')}
          </Button>
        </div>
      </Card>

      <Modal
        title={t('workstationPosition.currentOrder.reviewModalTitle')}
        open={reviewOpen}
        onCancel={() => {
          setReviewOpen(false);
          reviewForm.resetFields();
        }}
        onOk={() => reviewForm.submit()}
        okText={t('workstationPosition.currentOrder.review')}
        cancelText={t('workstationPosition.robot.confirmCancel')}
      >
        <Form
          form={reviewForm}
          layout="vertical"
          onFinish={(values) => {
            reviewCurrentWorkOrder({
              qualityResult: values.reviewResult,
              defectType: Array.isArray(values.defectType) ? values.defectType.join(', ') : values.defectType,
              defectDescription: values.defectDescription,
            });
            messageApi.success(t('workstationPosition.currentOrder.reviewDone'));
            setReviewOpen(false);
            reviewForm.resetFields();
          }}
        >
          <Form.Item label={t('workstationPosition.currentOrder.qualityResult')} name="reviewResult" rules={[{ required: true }]}>
            <Select
              options={[
                { label: t('workOrder.detail.ok'), value: 'ok' },
                { label: t('workOrder.detail.ng'), value: 'ng' },
              ]}
            />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.reviewResult !== curr.reviewResult}>
            {({ getFieldValue }) => (
              <Form.Item
                label={t('workOrder.detail.defectType')}
                name="defectType"
                rules={getFieldValue('reviewResult') === 'ng' ? [{ required: true, message: t('workOrder.detail.defectTypeRequired') }] : []}
              >
                <Select mode="multiple" allowClear options={defectTypeOptions.map((item) => ({ label: item, value: item }))} />
              </Form.Item>
            )}
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.reviewResult !== curr.reviewResult}>
            {({ getFieldValue }) => (
              <Form.Item
                label={t('workOrder.detail.defectDescription')}
                name="defectDescription"
                rules={
                  getFieldValue('reviewResult') === 'ng'
                    ? [{ required: true, message: t('workstationPosition.currentOrder.defectDescriptionRequired') }]
                    : []
                }
              >
                <Input.TextArea rows={3} placeholder={t('workOrder.detail.defectDescription')} />
              </Form.Item>
            )}
          </Form.Item>
        </Form>
      </Modal>

      <Card title={t('workstationPosition.history.title')} className="workstation-manage-table-card">
        <Table
          rowKey="workOrderNo"
          columns={historyColumns}
          dataSource={historyWorkOrders}
          pagination={{ pageSize: 5, showSizeChanger: false }}
          scroll={{ x: 1450 }}
          className="workstation-manage-table"
        />
      </Card>

      <Modal title={t('workstationPosition.history.detailTitle')} open={Boolean(viewingHistoryWorkOrder)} onCancel={() => setViewingHistoryWorkOrder(null)} footer={null} width={1280}>
        {viewingHistoryWorkOrder ? (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Descriptions size="small" column={3}>
              <Descriptions.Item label={t('workstationPosition.history.workOrderNo')}>{viewingHistoryWorkOrder.workOrderNo}</Descriptions.Item>
              <Descriptions.Item label={t('workstationPosition.currentOrder.fixtureLineType')}>{viewingHistoryWorkOrder.fixtureLineType}</Descriptions.Item>
              <Descriptions.Item label={t('workstationPosition.currentOrder.stationCode')}>{viewingHistoryWorkOrder.stationCode}</Descriptions.Item>
            </Descriptions>

            <Card size="small" title={t('workOrder.detail.harness2dTitle')}>
              {historyOrderHarness2DImage ? (
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: 620,
                    margin: '0 auto',
                    overflow: 'hidden',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    background: '#fff',
                  }}
                >
                  <img src={historyOrderHarness2DImage} alt="history-workorder-harness-2d" style={{ width: '100%', display: 'block' }} />
                  {historyOrderOverlayPoints.map((point, index) => (
                    <div key={`history-order-overlay-${point.x}-${point.y}-${index}`}>
                      <button
                        type="button"
                        onClick={() => setPreviewPoint(inspectionPoints[index] ?? null)}
                        title={point.label}
                        style={{
                          position: 'absolute',
                          left: `${point.x}%`,
                          top: `${point.y}%`,
                          transform: 'translate(-50%, -50%)',
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          border: '2px solid #ffffff',
                          background: inspectionPoints[index]?.status === 'ng' ? '#ff4d4f' : '#1677ff',
                          boxShadow: '0 1px 6px rgba(0, 0, 0, 0.35)',
                          cursor: inspectionPoints[index] ? 'pointer' : 'default',
                          padding: 0,
                          color: '#fff',
                          fontSize: 12,
                          fontWeight: 700,
                          lineHeight: '18px',
                          textAlign: 'center',
                        }}
                      >
                        {index + 1}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    height: 220,
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6b7280',
                    background: '#f8fafc',
                  }}
                >
                  2D harness image is not configured yet
                </div>
              )}
            </Card>

            <Card size="small" title={t('workOrder.detail.pointListTitle')}>
              <Table rowKey="id" columns={pointColumns} dataSource={inspectionPoints} pagination={false} size="small" scroll={{ x: 1100 }} />
            </Card>
          </Space>
        ) : null}
      </Modal>

      <Modal
        title={previewPoint?.mediaType === 'video' ? t('workOrder.detail.mediaVideoTitle') : t('workOrder.detail.mediaImageTitle')}
        open={Boolean(previewPoint)}
        onCancel={() => setPreviewPoint(null)}
        footer={null}
      >
        {previewPoint ? (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Typography.Text>
              {t('workOrder.detail.pointCode')}: {previewPoint.pointCode}
            </Typography.Text>
            {previewPoint.mediaType === 'video' ? (
              <div
                style={{
                  height: 220,
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
                  <div>{t('workOrder.detail.videoPlaceholder')}</div>
                  <div style={{ marginTop: 8, fontSize: 12 }}>{previewPoint.mediaUrl}</div>
                </div>
              </div>
            ) : (
              <Image
                src={previewPoint.mediaUrl}
                alt={previewPoint.pointCode}
                fallback="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='960' height='540'><rect width='100%' height='100%' fill='%23e5e7eb'/><text x='50%' y='50%' font-size='22' text-anchor='middle' fill='%236b7280'>Inspection Point Image Placeholder</text></svg>"
              />
            )}
          </Space>
        ) : null}
      </Modal>
      </div>
    </Spin>
  );
}
