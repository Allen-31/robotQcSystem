import {
  ApiOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  BugOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  RadarChartOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { Card, Col, Descriptions, Progress, Row, Segmented, Space, Statistic, Table, Tabs, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import './HomeDashboardPage.css';

type StatsMode = 'total' | 'today';

type ExceptionItem = {
  key: string;
  code?: string;
  type: string;
  description?: string;
  name?: string;
  status?: string;
};

type KpiItem = { title: string; value: string; suffix?: string; icon: ReactNode; percent: number; trend: number };

const statsMap: Record<StatsMode, KpiItem[]> = {
  total: [
    { title: '质检量', value: '48,620', icon: <DashboardOutlined />, percent: 82, trend: 8.2 },
    { title: '检出率', value: '97.52', suffix: '%', icon: <CheckCircleOutlined />, percent: 98, trend: 1.3 },
    { title: '复核率', value: '91.36', suffix: '%', icon: <RadarChartOutlined />, percent: 91, trend: 0.9 },
    { title: '检测时长', value: '12,680', suffix: 'h', icon: <ClockCircleOutlined />, percent: 75, trend: -3.4 },
  ],
  today: [
    { title: '质检量', value: '1,286', icon: <DashboardOutlined />, percent: 64, trend: 5.1 },
    { title: '检出率', value: '96.71', suffix: '%', icon: <CheckCircleOutlined />, percent: 97, trend: 0.4 },
    { title: '复核率', value: '89.28', suffix: '%', icon: <RadarChartOutlined />, percent: 89, trend: -0.6 },
    { title: '检测时长', value: '326', suffix: 'h', icon: <ClockCircleOutlined />, percent: 58, trend: -2.1 },
  ],
};

const qualityFlows = [
  { name: '视觉检测任务', rate: 86 },
  { name: '工位复核任务', rate: 72 },
  { name: '终端异常任务', rate: 38 },
  { name: '质检回溯任务', rate: 61 },
];

const deviceOverview = {
  total: [
    { label: '机器人运行时长', value: '22,460h', icon: <ThunderboltOutlined /> },
    { label: '机器人工作时长', value: '18,920h', icon: <ToolOutlined /> },
    { label: '机器人故障率', value: '2.14%', icon: <BugOutlined /> },
  ],
  today: [
    { label: '机器人数量 / 在线总数', value: '68 / 61', icon: <RobotOutlined /> },
    { label: '机器人平均运行时长', value: '15.8h', icon: <ThunderboltOutlined /> },
    { label: '机器人平均工作时长', value: '12.6h', icon: <ToolOutlined /> },
    { label: '工位数量 / 运行 / 总数', value: '120 / 86 / 120', icon: <ApiOutlined /> },
  ],
};

const taskExceptions: ExceptionItem[] = [
  { key: '1', code: 'TASK-20260227-01', type: '调度异常', description: '任务下发超时，等待重试' },
  { key: '2', code: 'TASK-20260227-02', type: '执行异常', description: '路径规划失败，目标工位不可达' },
  { key: '3', code: 'TASK-20260227-03', type: '复核异常', description: '复核任务积压，超过阈值' },
  { key: '4', code: 'TASK-20260227-04', type: '调度异常', description: '任务队列阻塞，等待资源释放' },
  { key: '5', code: 'TASK-20260227-05', type: '执行异常', description: '机器人抓取动作超时中断' },
  { key: '6', code: 'TASK-20260227-06', type: '复核异常', description: '复核样本上传失败，待补偿' },
  { key: '7', code: 'TASK-20260227-07', type: '调度异常', description: '任务优先级冲突，回退重排' },
  { key: '8', code: 'TASK-20260227-08', type: '执行异常', description: '目标工位被占用，任务挂起' },
];

const deviceExceptions: ExceptionItem[] = [
  { key: '1', code: 'DEV-20260227-01', type: '传感器异常', description: '激光雷达数据抖动超限' },
  { key: '2', code: 'DEV-20260227-02', type: '电量异常', description: '剩余电量低于安全阈值' },
  { key: '3', code: 'DEV-20260227-03', type: '通讯异常', description: '与工位终端心跳中断' },
  { key: '4', code: 'DEV-20260227-04', type: '传感器异常', description: '视觉模块曝光参数异常' },
  { key: '5', code: 'DEV-20260227-05', type: '驱动异常', description: '轮组编码器反馈丢失' },
  { key: '6', code: 'DEV-20260227-06', type: '通讯异常', description: 'MQTT 连接重试次数超限' },
  { key: '7', code: 'DEV-20260227-07', type: '电量异常', description: '充电电流异常波动' },
  { key: '8', code: 'DEV-20260227-08', type: '驱动异常', description: '机械臂关节温度过高' },
];

const serviceExceptions: ExceptionItem[] = [
  { key: '1', name: 'qc-task-service', type: '任务服务', status: '异常' },
  { key: '2', name: 'qc-device-service', type: '设备服务', status: '运行中' },
  { key: '3', name: 'qc-report-service', type: '报表服务', status: '异常' },
  { key: '4', name: 'qc-auth-service', type: '认证服务', status: '运行中' },
  { key: '5', name: 'qc-alert-service', type: '告警服务', status: '异常' },
  { key: '6', name: 'qc-map-service', type: '地图服务', status: '运行中' },
  { key: '7', name: 'qc-gateway', type: '网关服务', status: '运行中' },
  { key: '8', name: 'qc-cache-service', type: '缓存服务', status: '异常' },
];

function ServiceStatusTag({ status }: { status?: string }) {
  if (status === '运行中') {
    return <Tag color="success">运行中</Tag>;
  }
  return <Tag color="error">异常</Tag>;
}

export function HomeDashboardPage() {
  const [mode, setMode] = useState<StatsMode>('total');
  const [deviceMode, setDeviceMode] = useState<StatsMode>('total');

  const taskColumns: ColumnsType<ExceptionItem> = useMemo(
    () => [
      { title: '编号', dataIndex: 'code', key: 'code', width: 180 },
      { title: '类型', dataIndex: 'type', key: 'type', width: 120 },
      { title: '异常描述', dataIndex: 'description', key: 'description' },
    ],
    [],
  );

  const serviceColumns: ColumnsType<ExceptionItem> = useMemo(
    () => [
      { title: '名称', dataIndex: 'name', key: 'name' },
      { title: '类型', dataIndex: 'type', key: 'type', width: 120 },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 100,
        render: (status: string) => <ServiceStatusTag status={status} />,
      },
      {
        title: '操作',
        key: 'action',
        width: 160,
        render: () => (
          <Space size={12}>
            <a>运行</a>
            <a>重启</a>
            <a>关闭</a>
          </Space>
        ),
      },
    ],
    [],
  );

  return (
    <div className="home-dashboard">
      <div className="home-bg-mask" />
      <div className="bg-orb orb-a" />
      <div className="bg-orb orb-b" />

      <div className="home-shell">
        <div className="top-grid">
          <Card className="tech-card panel-quality" bordered={false}>
            <div className="panel-head">
              <div>
                <Typography.Title level={2} className="home-title">
                  质检概况
                </Typography.Title>
                <Typography.Text className="panel-sub">Quality Inspection Overview</Typography.Text>
              </div>
              <Segmented
                options={[
                  { label: '总统计', value: 'total' },
                  { label: '今日统计', value: 'today' },
                ]}
                value={mode}
                onChange={(value) => setMode(value as StatsMode)}
              />
            </div>

            <Row gutter={[12, 12]}>
              {statsMap[mode].map((item) => (
                <Col xs={12} xl={6} key={item.title}>
                  <Card className="kpi-card" bordered={false}>
                    <div className="kpi-title-row">
                      <span>{item.title}</span>
                      <span className="kpi-title-icon">{item.icon}</span>
                    </div>
                    <Statistic value={item.value} suffix={item.suffix} />
                    <div className="kpi-foot">
                      <Progress percent={item.percent} showInfo={false} size={['100%', 6]} strokeColor="#4c8dff" />
                      <span className={item.trend >= 0 ? 'trend-up' : 'trend-down'}>
                        {item.trend >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                        {Math.abs(item.trend)}%
                      </span>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </div>

        <div className="bottom-grid">
          <Card className="tech-card panel-device" title="设备概况" bordered={false}>
            <div className="panel-head compact">
              <Typography.Text strong>{deviceMode === 'total' ? '总统计' : '今日统计'}</Typography.Text>
              <Segmented
                size="small"
                options={[
                  { label: '总统计', value: 'total' },
                  { label: '今日统计', value: 'today' },
                ]}
                value={deviceMode}
                onChange={(value) => setDeviceMode(value as StatsMode)}
              />
            </div>

            <div className="mini-kpis">
              <div className="mini-kpi">
                <span>在线率</span>
                <strong>90%</strong>
              </div>
              <div className="mini-kpi">
                <span>稼动率</span>
                <strong>98%</strong>
              </div>
              <div className="mini-kpi">
                <span>故障率</span>
                <strong>2.14%</strong>
              </div>
            </div>

            <Descriptions column={1} size="small" className="overview-descriptions">
              {deviceOverview[deviceMode].map((item) => (
                <Descriptions.Item
                  key={item.label}
                  label={
                    <span className="device-label">
                      {item.icon}
                      {item.label}
                    </span>
                  }
                >
                  {item.value}
                </Descriptions.Item>
              ))}
            </Descriptions>
          </Card>

          <Card className="tech-card panel-operation" title="运行概况" bordered={false}>
            <div className="operation-summary">
              <div className="op-stat">
                <span>执行中任务</span>
                <strong>26</strong>
              </div>
              <div className="op-stat">
                <span>待处理异常</span>
                <strong>18</strong>
              </div>
              <div className="op-stat">
                <span>服务告警</span>
                <strong>4</strong>
              </div>
              <Progress type="dashboard" percent={72} size={88} format={() => '72%'} strokeColor="#4c8dff" />
            </div>

            <Tabs
              items={[
                {
                  key: 'task',
                  label: '任务异常',
                  children: (
                    <Table
                      rowKey="key"
                      size="small"
                      pagination={false}
                      scroll={{ y: 250 }}
                      columns={taskColumns}
                      dataSource={taskExceptions}
                      className="flat-table"
                    />
                  ),
                },
                {
                  key: 'device',
                  label: '设备异常',
                  children: (
                    <Table
                      rowKey="key"
                      size="small"
                      pagination={false}
                      scroll={{ y: 250 }}
                      columns={taskColumns}
                      dataSource={deviceExceptions}
                      className="flat-table"
                    />
                  ),
                },
                {
                  key: 'service',
                  label: '系统服务异常',
                  children: (
                    <Table
                      rowKey="key"
                      size="small"
                      pagination={false}
                      scroll={{ y: 250 }}
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
