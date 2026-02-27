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
  WarningOutlined,
} from '@ant-design/icons';
import { Card, Col, Descriptions, Divider, Progress, Row, Space, Table, Tabs, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ReactNode } from 'react';
import './HomeDashboardPage.css';

type ExceptionItem = {
  key: string;
  code?: string;
  type: string;
  description?: string;
  name?: string;
  status?: string;
};

type MetricItem = {
  label: string;
  value: string;
  icon: ReactNode;
};

const qualityTotalMetrics: MetricItem[] = [
  { label: '质检量', value: '48,620', icon: <DashboardOutlined /> },
  { label: '检出率', value: '97.52%', icon: <CheckCircleOutlined /> },
  { label: '复核率', value: '91.36%', icon: <RadarChartOutlined /> },
  { label: '检测时长', value: '12,680h', icon: <ClockCircleOutlined /> },
];

const qualityTodayMetrics: MetricItem[] = [
  { label: '质检量', value: '1,286', icon: <DashboardOutlined /> },
  { label: '检出率', value: '96.71%', icon: <CheckCircleOutlined /> },
  { label: '复核率', value: '89.28%', icon: <RadarChartOutlined /> },
  { label: '检测时长', value: '326h', icon: <ClockCircleOutlined /> },
];

const deviceTotalMetrics: MetricItem[] = [
  { label: '机器人运行时长', value: '22,460h', icon: <ThunderboltOutlined /> },
  { label: '机器人工作时长', value: '18,920h', icon: <ToolOutlined /> },
  { label: '机器人故障率', value: '2.14%', icon: <BugOutlined /> },
];

const deviceTodayMetrics: MetricItem[] = [
  { label: '机器人数量 / 在线总数', value: '68 / 61', icon: <RobotOutlined /> },
  { label: '机器人平均运行时长', value: '15.8h', icon: <ThunderboltOutlined /> },
  { label: '机器人平均工作时长', value: '12.6h', icon: <ToolOutlined /> },
  { label: '工位数量 / 运行 / 总数', value: '120 / 86 / 120', icon: <ApiOutlined /> },
];

const taskExceptions: ExceptionItem[] = [
  { key: '1', code: 'TASK-20260227-01', type: '调度异常', description: '任务下发超时，等待重试' },
  { key: '2', code: 'TASK-20260227-02', type: '执行异常', description: '路径规划失败，目标工位不可达' },
  { key: '3', code: 'TASK-20260227-03', type: '复核异常', description: '复核任务积压，超过阈值' },
  { key: '4', code: 'TASK-20260227-04', type: '调度异常', description: '任务队列阻塞，等待资源释放' },
  { key: '5', code: 'TASK-20260227-05', type: '执行异常', description: '机器人抓取动作超时中断' },
  { key: '6', code: 'TASK-20260227-06', type: '复核异常', description: '复核样本上传失败，待补偿' },
];

const deviceExceptions: ExceptionItem[] = [
  { key: '1', code: 'DEV-20260227-01', type: '传感器异常', description: '激光雷达数据抖动超限' },
  { key: '2', code: 'DEV-20260227-02', type: '电量异常', description: '剩余电量低于安全阈值' },
  { key: '3', code: 'DEV-20260227-03', type: '通讯异常', description: '与工位终端心跳中断' },
  { key: '4', code: 'DEV-20260227-04', type: '传感器异常', description: '视觉模块曝光参数异常' },
  { key: '5', code: 'DEV-20260227-05', type: '驱动异常', description: '轮组编码器反馈丢失' },
  { key: '6', code: 'DEV-20260227-06', type: '通讯异常', description: 'MQTT 连接重试次数超限' },
];

const serviceExceptions: ExceptionItem[] = [
  { key: '1', name: 'qc-task-service', type: '任务服务', status: '异常' },
  { key: '2', name: 'qc-device-service', type: '设备服务', status: '运行中' },
  { key: '3', name: 'qc-report-service', type: '报表服务', status: '异常' },
  { key: '4', name: 'qc-auth-service', type: '认证服务', status: '运行中' },
  { key: '5', name: 'qc-alert-service', type: '告警服务', status: '异常' },
  { key: '6', name: 'qc-map-service', type: '地图服务', status: '运行中' },
];

function ServiceStatusTag({ status }: { status?: string }) {
  if (status === '运行中') {
    return <Tag color="success">运行中</Tag>;
  }
  return <Tag color="error">异常</Tag>;
}

function MetricGrid({ data }: { data: MetricItem[] }) {
  return (
    <div className="metric-grid">
      {data.map((item) => (
        <div className="metric-item" key={item.label}>
          <span className="metric-icon">{item.icon}</span>
          <div>
            <div className="metric-label">{item.label}</div>
            <div className="metric-value">{item.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function HomeDashboardPage() {
  const taskColumns: ColumnsType<ExceptionItem> = [
    { title: '编号', dataIndex: 'code', key: 'code', width: 190, align: 'center' },
    { title: '类型', dataIndex: 'type', key: 'type', width: 130, align: 'center' },
    { title: '异常描述', dataIndex: 'description', key: 'description', align: 'center' },
  ];

  const serviceColumns: ColumnsType<ExceptionItem> = [
    { title: '名称', dataIndex: 'name', key: 'name', width: 200, align: 'center' },
    { title: '类型', dataIndex: 'type', key: 'type', width: 130, align: 'center' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      align: 'center',
      render: (status: string) => <ServiceStatusTag status={status} />,
    },
    {
      title: '操作',
      key: 'action',
      width: 170,
      align: 'center',
      render: () => (
        <Space size={12}>
          <a>运行</a>
          <a>重启</a>
          <a>关闭</a>
        </Space>
      ),
    },
  ];

  return (
    <div className="home-dashboard">
      <div className="home-bg-mask" />
      <div className="home-shell">
        <div className="quad-grid">
          <Card className="tech-card quality-card" title="质检概况" bordered={false}>
            <Typography.Text className="section-sub-title">总统计</Typography.Text>
            <MetricGrid data={qualityTotalMetrics} />
            <Divider className="split-line" />
            <Typography.Text className="section-sub-title">日统计</Typography.Text>
            <MetricGrid data={qualityTodayMetrics} />
          </Card>

          <div className="quad-spacer" />

          <Card className="tech-card device-card" title="设备概况" bordered={false}>
            <Typography.Text className="section-sub-title">总统计</Typography.Text>
            <MetricGrid data={deviceTotalMetrics} />
            <Divider className="split-line" />
            <Typography.Text className="section-sub-title">日统计</Typography.Text>
            <MetricGrid data={deviceTodayMetrics} />
          </Card>

          <Card className="tech-card operation-card" title="运行概况" bordered={false}>
            <Row gutter={12} className="operation-head">
              <Col span={8}>
                <Card className="mini-stat-card" bordered={false}>
                  <Typography.Text>执行中任务</Typography.Text>
                  <Typography.Title level={3}>26</Typography.Title>
                </Card>
              </Col>
              <Col span={8}>
                <Card className="mini-stat-card" bordered={false}>
                  <Typography.Text>待处理异常</Typography.Text>
                  <Typography.Title level={3}>18</Typography.Title>
                </Card>
              </Col>
              <Col span={8}>
                <Card className="mini-stat-card" bordered={false}>
                  <Typography.Text>执行达成率</Typography.Text>
                  <Typography.Title level={3}>72%</Typography.Title>
                </Card>
              </Col>
            </Row>

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
                  label: '设备异常',
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
                  label: '系统服务异常',
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
