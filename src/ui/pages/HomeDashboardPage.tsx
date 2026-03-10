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
import { Button, Card, Col, Divider, Grid, Row, Space, Table, Tabs, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHomeDashboard, type HomeDashboardViewModel, type HomeExceptionItem, type HomeMetricItem } from '../../logic/home/useHomeDashboard';
import { useI18n } from '../../i18n/I18nProvider';
import './HomeDashboardPage.css';

const { useBreakpoint } = Grid;

const ICON_MAP: Record<string, ReactNode> = {
  ApiOutlined: <ApiOutlined />,
  BugOutlined: <BugOutlined />,
  CheckCircleOutlined: <CheckCircleOutlined />,
  ClockCircleOutlined: <ClockCircleOutlined />,
  DashboardOutlined: <DashboardOutlined />,
  RadarChartOutlined: <RadarChartOutlined />,
  RobotOutlined: <RobotOutlined />,
  ThunderboltOutlined: <ThunderboltOutlined />,
  ToolOutlined: <ToolOutlined />,
};

function getIcon(iconKey: string): ReactNode {
  return ICON_MAP[iconKey] ?? <DashboardOutlined />;
}

function ServiceStatusTag({ status, t }: { status?: 'running' | 'abnormal'; t: (key: string) => string }) {
  if (status === 'running') {
    return <span style={{ color: '#9ce08f', fontWeight: 600 }}>{t('home.serviceStatus.running')}</span>;
  }
  return <span style={{ color: '#ff9c9c', fontWeight: 600 }}>{t('home.serviceStatus.abnormal')}</span>;
}

function MetricGrid({ data, t }: { data: HomeMetricItem[]; t: (key: string) => string }) {
  return (
    <div className="metric-grid">
      {data.map((item) => (
        <div className="metric-item" key={`${item.labelKey}-${item.value}`}>
          <span className="metric-icon">{getIcon(item.iconKey)}</span>
          <div>
            <div className="metric-label">{t(item.labelKey)}</div>
            <div className="metric-value">{item.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function buildTaskColumns(t: (key: string) => string, navigate: (path: string) => void): ColumnsType<HomeExceptionItem> {
  return [
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
}

function buildServiceColumns(t: (key: string) => string): ColumnsType<HomeExceptionItem> {
  return [
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
}

interface HomeDashboardCommonProps {
  viewModel: HomeDashboardViewModel;
  t: (key: string) => string;
  navigate: (path: string) => void;
}

function HomeDashboardWeb({ viewModel, t, navigate }: HomeDashboardCommonProps) {
  const {
    qualityTotalMetrics,
    qualityTodayMetrics,
    deviceTotalMetrics,
    deviceTodayMetrics,
    taskExceptions,
    deviceExceptions,
    serviceExceptions,
    operationStats,
  } = viewModel;

  const taskColumns = buildTaskColumns(t, navigate);
  const serviceColumns = buildServiceColumns(t);

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
                  <Typography.Title level={3}>{operationStats.executingTasks}</Typography.Title>
                </Card>
              </Col>
              <Col span={8}>
                <Card className="mini-stat-card" bordered={false}>
                  <Typography.Text>{t('home.stat.pendingExceptions')}</Typography.Text>
                  <Typography.Title level={3}>{operationStats.pendingExceptions}</Typography.Title>
                </Card>
              </Col>
              <Col span={8}>
                <Card className="mini-stat-card" bordered={false}>
                  <Typography.Text>{t('home.stat.completionRate')}</Typography.Text>
                  <Typography.Title level={3}>{operationStats.completionRate}</Typography.Title>
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

function HomeDashboardPad({ viewModel, t, navigate }: HomeDashboardCommonProps) {
  const {
    qualityTotalMetrics,
    qualityTodayMetrics,
    deviceTotalMetrics,
    deviceTodayMetrics,
    taskExceptions,
    deviceExceptions,
    serviceExceptions,
    operationStats,
  } = viewModel;

  const taskColumns = buildTaskColumns(t, navigate);
  const serviceColumns = buildServiceColumns(t);

  return (
    <div className="home-dashboard home-dashboard-pad">
      <div className="home-bg-mask" />
      <div className="home-shell">
        <Row gutter={[12, 12]}>
          <Col xs={24}>
            <Card className="tech-card quality-card" title={t('home.qualityOverview')} bordered={false}>
              <Typography.Text className="section-sub-title">{t('home.total')}</Typography.Text>
              <MetricGrid data={qualityTotalMetrics} t={t} />
              <Divider className="split-line" />
              <Typography.Text className="section-sub-title">{t('home.today')}</Typography.Text>
              <MetricGrid data={qualityTodayMetrics} t={t} />
            </Card>
          </Col>
          <Col xs={24}>
            <Card className="tech-card device-card" title={t('home.deviceOverview')} bordered={false}>
              <Typography.Text className="section-sub-title">{t('home.total')}</Typography.Text>
              <MetricGrid data={deviceTotalMetrics} t={t} />
              <Divider className="split-line" />
              <Typography.Text className="section-sub-title">{t('home.today')}</Typography.Text>
              <MetricGrid data={deviceTodayMetrics} t={t} />
            </Card>
          </Col>
          <Col xs={24}>
            <Card className="tech-card operation-card" title={t('home.operationOverview')} bordered={false}>
              <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
                <Col xs={8}>
                  <Card className="mini-stat-card" bordered={false}>
                    <Typography.Text>{t('home.stat.executingTasks')}</Typography.Text>
                    <Typography.Title level={4} style={{ margin: '4px 0 0' }}>{operationStats.executingTasks}</Typography.Title>
                  </Card>
                </Col>
                <Col xs={8}>
                  <Card className="mini-stat-card" bordered={false}>
                    <Typography.Text>{t('home.stat.pendingExceptions')}</Typography.Text>
                    <Typography.Title level={4} style={{ margin: '4px 0 0' }}>{operationStats.pendingExceptions}</Typography.Title>
                  </Card>
                </Col>
                <Col xs={8}>
                  <Card className="mini-stat-card" bordered={false}>
                    <Typography.Text>{t('home.stat.completionRate')}</Typography.Text>
                    <Typography.Title level={4} style={{ margin: '4px 0 0' }}>{operationStats.completionRate}</Typography.Title>
                  </Card>
                </Col>
              </Row>
              <Tabs
                size="small"
                items={[
                  {
                    key: 'task',
                    label: t('home.tab.taskException'),
                    children: (
                      <Table
                        rowKey="key"
                        size="small"
                        pagination={false}
                        scroll={{ y: 200 }}
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
                        scroll={{ y: 200 }}
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
                        scroll={{ y: 200 }}
                        columns={serviceColumns}
                        dataSource={serviceExceptions}
                        className="flat-table"
                      />
                    ),
                  },
                ]}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}

export function HomeDashboardPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isPad = !screens.lg;

  const viewModel = useHomeDashboard();

  if (isPad) {
    return <HomeDashboardPad viewModel={viewModel} t={t} navigate={navigate} />;
  }

  return <HomeDashboardWeb viewModel={viewModel} t={t} navigate={navigate} />;
}
