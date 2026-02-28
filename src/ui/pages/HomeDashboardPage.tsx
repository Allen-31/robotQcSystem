import {
  ApiOutlined,
  BugOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  RadarChartOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Divider, Row, Space, Table, Tabs, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import './HomeDashboardPage.css';

type ExceptionItem = {
  key: string;
  code?: string;
  typeKey: string;
  descriptionKey?: string;
  name?: string;
  status?: 'running' | 'abnormal';
};

type MetricItem = {
  labelKey: string;
  value: string;
  icon: ReactNode;
};

const qualityTotalMetrics: MetricItem[] = [
  { labelKey: 'home.metric.qualityCount', value: '48,620', icon: <DashboardOutlined /> },
  { labelKey: 'home.metric.detectionRate', value: '97.52%', icon: <CheckCircleOutlined /> },
  { labelKey: 'home.metric.reviewRate', value: '91.36%', icon: <RadarChartOutlined /> },
  { labelKey: 'home.metric.duration', value: '12,680h', icon: <ClockCircleOutlined /> },
];

const qualityTodayMetrics: MetricItem[] = [
  { labelKey: 'home.metric.qualityCount', value: '1,286', icon: <DashboardOutlined /> },
  { labelKey: 'home.metric.detectionRate', value: '96.71%', icon: <CheckCircleOutlined /> },
  { labelKey: 'home.metric.reviewRate', value: '89.28%', icon: <RadarChartOutlined /> },
  { labelKey: 'home.metric.duration', value: '326h', icon: <ClockCircleOutlined /> },
];

const deviceTotalMetrics: MetricItem[] = [
  { labelKey: 'home.metric.robotRuntime', value: '22,460h', icon: <ThunderboltOutlined /> },
  { labelKey: 'home.metric.robotWorktime', value: '18,920h', icon: <ToolOutlined /> },
  { labelKey: 'home.metric.robotFailureRate', value: '2.14%', icon: <BugOutlined /> },
];

const deviceTodayMetrics: MetricItem[] = [
  { labelKey: 'home.metric.robotOnline', value: '68 / 61', icon: <RobotOutlined /> },
  { labelKey: 'home.metric.avgRuntime', value: '15.8h', icon: <ThunderboltOutlined /> },
  { labelKey: 'home.metric.avgWorktime', value: '12.6h', icon: <ToolOutlined /> },
  { labelKey: 'home.metric.stationCount', value: '120 / 86 / 120', icon: <ApiOutlined /> },
];

const taskExceptions: ExceptionItem[] = [
  { key: '1', code: 'TASK-20260227-01', typeKey: 'home.type.dispatch', descriptionKey: 'home.desc.taskTimeout' },
  { key: '2', code: 'TASK-20260227-02', typeKey: 'home.type.execution', descriptionKey: 'home.desc.pathPlanningFailed' },
  { key: '3', code: 'TASK-20260227-03', typeKey: 'home.type.review', descriptionKey: 'home.desc.reviewBacklog' },
  { key: '4', code: 'TASK-20260227-04', typeKey: 'home.type.dispatch', descriptionKey: 'home.desc.queueBlocked' },
  { key: '5', code: 'TASK-20260227-05', typeKey: 'home.type.execution', descriptionKey: 'home.desc.grabTimeout' },
  { key: '6', code: 'TASK-20260227-06', typeKey: 'home.type.review', descriptionKey: 'home.desc.uploadFailed' },
];

const deviceExceptions: ExceptionItem[] = [
  { key: '1', code: 'DEV-20260227-01', typeKey: 'home.type.sensor', descriptionKey: 'home.desc.lidarJitter' },
  { key: '2', code: 'DEV-20260227-02', typeKey: 'home.type.power', descriptionKey: 'home.desc.lowBattery' },
  { key: '3', code: 'DEV-20260227-03', typeKey: 'home.type.communication', descriptionKey: 'home.desc.heartbeatLost' },
  { key: '4', code: 'DEV-20260227-04', typeKey: 'home.type.sensor', descriptionKey: 'home.desc.exposureAbnormal' },
  { key: '5', code: 'DEV-20260227-05', typeKey: 'home.type.driver', descriptionKey: 'home.desc.encoderLost' },
  { key: '6', code: 'DEV-20260227-06', typeKey: 'home.type.communication', descriptionKey: 'home.desc.mqttRetryExceeded' },
];

const serviceExceptions: ExceptionItem[] = [
  { key: '1', name: 'qc-task-service', typeKey: 'home.service.task', status: 'abnormal' },
  { key: '2', name: 'qc-device-service', typeKey: 'home.service.device', status: 'running' },
  { key: '3', name: 'qc-report-service', typeKey: 'home.service.report', status: 'abnormal' },
  { key: '4', name: 'qc-auth-service', typeKey: 'home.service.auth', status: 'running' },
  { key: '5', name: 'qc-alert-service', typeKey: 'home.service.alert', status: 'abnormal' },
  { key: '6', name: 'qc-map-service', typeKey: 'home.service.map', status: 'running' },
];

function ServiceStatusTag({ status, t }: { status?: 'running' | 'abnormal'; t: (key: string) => string }) {
  if (status === 'running') {
    return <span style={{ color: '#9ce08f', fontWeight: 600 }}>{t('home.serviceStatus.running')}</span>;
  }
  return <span style={{ color: '#ff9c9c', fontWeight: 600 }}>{t('home.serviceStatus.abnormal')}</span>;
}

function MetricGrid({ data, t }: { data: MetricItem[]; t: (key: string) => string }) {
  return (
    <div className="metric-grid">
      {data.map((item) => (
        <div className="metric-item" key={`${item.labelKey}-${item.value}`}>
          <span className="metric-icon">{item.icon}</span>
          <div>
            <div className="metric-label">{t(item.labelKey)}</div>
            <div className="metric-value">{item.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function HomeDashboardPage() {
  const navigate = useNavigate();
  const { t } = useI18n();

  const taskColumns: ColumnsType<ExceptionItem> = [
    { title: t('home.table.code'), dataIndex: 'code', key: 'code', width: 190, align: 'center' },
    {
      title: t('home.table.type'),
      dataIndex: 'typeKey',
      key: 'typeKey',
      width: 150,
      align: 'center',
      render: (typeKey: string) => t(typeKey),
    },
    {
      title: t('home.table.description'),
      dataIndex: 'descriptionKey',
      key: 'descriptionKey',
      align: 'center',
      render: (descriptionKey?: string) => (descriptionKey ? t(descriptionKey) : '-'),
    },
    {
      title: t('home.table.action'),
      key: 'action',
      width: 130,
      align: 'center',
      render: () => (
        <Button size="small" type="primary" ghost onClick={() => navigate('/operationMaintenance/notification/exceptionNotification')}>
          {t('home.action.handleException')}
        </Button>
      ),
    },
  ];

  const serviceColumns: ColumnsType<ExceptionItem> = [
    { title: t('home.table.name'), dataIndex: 'name', key: 'name', width: 200, align: 'center' },
    {
      title: t('home.table.type'),
      dataIndex: 'typeKey',
      key: 'typeKey',
      width: 160,
      align: 'center',
      render: (typeKey: string) => t(typeKey),
    },
    {
      title: t('home.table.status'),
      dataIndex: 'status',
      key: 'status',
      width: 110,
      align: 'center',
      render: (status: 'running' | 'abnormal') => <ServiceStatusTag status={status} t={t} />,
    },
    {
      title: t('home.table.action'),
      key: 'action',
      width: 220,
      align: 'center',
      render: () => (
        <Space size={8}>
          <Button size="small" type="primary">
            {t('home.action.run')}
          </Button>
          <Button size="small">{t('home.action.restart')}</Button>
          <Button size="small" danger>
            {t('home.action.stop')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="home-dashboard">
      <div className="home-bg-mask" />
      <div className="home-shell">
        <div className="quad-grid">
          <Card className="tech-card quality-card" title={t('home.qualityOverview')} bordered={false}>
            <Typography.Text className="section-sub-title">{t('home.total')}</Typography.Text>
            <MetricGrid data={qualityTotalMetrics} t={t} />
            <Divider className="split-line" />
            <Typography.Text className="section-sub-title">{t('home.today')}</Typography.Text>
            <MetricGrid data={qualityTodayMetrics} t={t} />
          </Card>

          <div className="quad-spacer" />

          <Card className="tech-card device-card" title={t('home.deviceOverview')} bordered={false}>
            <Typography.Text className="section-sub-title">{t('home.total')}</Typography.Text>
            <MetricGrid data={deviceTotalMetrics} t={t} />
            <Divider className="split-line" />
            <Typography.Text className="section-sub-title">{t('home.today')}</Typography.Text>
            <MetricGrid data={deviceTodayMetrics} t={t} />
          </Card>

          <Card className="tech-card operation-card" title={t('home.operationOverview')} bordered={false}>
            <Row gutter={12} className="operation-head">
              <Col span={8}>
                <Card className="mini-stat-card" bordered={false}>
                  <Typography.Text>{t('home.stat.executingTasks')}</Typography.Text>
                  <Typography.Title level={3}>26</Typography.Title>
                </Card>
              </Col>
              <Col span={8}>
                <Card className="mini-stat-card" bordered={false}>
                  <Typography.Text>{t('home.stat.pendingExceptions')}</Typography.Text>
                  <Typography.Title level={3}>18</Typography.Title>
                </Card>
              </Col>
              <Col span={8}>
                <Card className="mini-stat-card" bordered={false}>
                  <Typography.Text>{t('home.stat.completionRate')}</Typography.Text>
                  <Typography.Title level={3}>72%</Typography.Title>
                </Card>
              </Col>
            </Row>

            <Tabs
              items={[
                {
                  key: 'task',
                  label: t('home.tab.taskException'),
                  children: (
                    <Table
                      rowKey="key"
                      size="small"
                      pagination={false}
                      tableLayout="fixed"
                      scroll={{ y: 230 }}
                      columns={taskColumns}
                      dataSource={taskExceptions}
                      className="flat-table"
                    />
                  ),
                },
                {
                  key: 'device',
                  label: t('home.tab.deviceException'),
                  children: (
                    <Table
                      rowKey="key"
                      size="small"
                      pagination={false}
                      tableLayout="fixed"
                      scroll={{ y: 230 }}
                      columns={taskColumns}
                      dataSource={deviceExceptions}
                      className="flat-table"
                    />
                  ),
                },
                {
                  key: 'service',
                  label: t('home.tab.serviceException'),
                  children: (
                    <Table
                      rowKey="key"
                      size="small"
                      pagination={false}
                      tableLayout="fixed"
                      scroll={{ y: 230 }}
                      columns={serviceColumns}
                      dataSource={serviceExceptions}
                      className="flat-table"
                    />
                  ),
                },
              ]}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
