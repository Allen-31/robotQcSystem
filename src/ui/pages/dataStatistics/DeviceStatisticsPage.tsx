import { DownloadOutlined, ReloadOutlined, RightOutlined } from '@ant-design/icons';
import { Button, Card, Col, Collapse, Descriptions, Drawer, Input, Row, Select, Space, Statistic, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../../i18n/I18nProvider';
import { SimpleBarChart, SimpleLineChart, SimplePieChart } from '../../components/charts/SimpleCharts';

type PeriodKey = 'day1' | 'day7' | 'month1';
type ExceptionLevel = 'none' | 'low' | 'medium' | 'high';

interface DeviceRecord {
  id: string;
  type: string;
  group: string;
  workshop: string;
  workstation: string;
  station: string;
  online: boolean;
  battery: number;
  runtimeHourToday: number;
  tasksToday: number;
  currentTask: string;
  lastHeartbeat: string;
  exceptionLevel: ExceptionLevel;
  exceptionCount: number;
}

const workshops = ['总装一车间', '总装二车间', '总装三车间'];
const workstations = ['质检区A', '质检区B', '质检区C', '质检区D'];
const stations = ['ST-A01', 'ST-A02', 'ST-B01', 'ST-B02', 'ST-C01', 'ST-D01'];
const robotTypes = ['AMR', 'AGV', '机械臂'];
const robotGroups = ['RG-装配', 'RG-搬运', 'RG-复检'];

const deviceData: DeviceRecord[] = Array.from({ length: 36 }, (_, index) => {
  const online = index % 7 !== 0;
  const exceptionLevel: ExceptionLevel = !online ? 'high' : index % 6 === 0 ? 'medium' : index % 4 === 0 ? 'low' : 'none';
  return {
    id: `RB-${String(index + 1).padStart(3, '0')}`,
    type: robotTypes[index % robotTypes.length],
    group: robotGroups[index % robotGroups.length],
    workshop: workshops[index % workshops.length],
    workstation: workstations[index % workstations.length],
    station: stations[index % stations.length],
    online,
    battery: 18 + ((index * 7) % 82),
    runtimeHourToday: Number((2.2 + (index % 8) * 0.9).toFixed(1)),
    tasksToday: 3 + (index % 18),
    currentTask: index % 3 === 0 ? '-' : `TK-${20260300 + (index % 28)}`,
    lastHeartbeat: `2026-03-05 ${String(8 + (index % 12)).padStart(2, '0')}:${String((index * 7) % 60).padStart(2, '0')}:00`,
    exceptionLevel,
    exceptionCount: exceptionLevel === 'none' ? 0 : 1 + (index % 5),
  };
});

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatLastUpdated(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const sec = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}:${sec}`;
}

/** Mock recent exceptions for detail drawer */
function getMockRecentExceptions(deviceId: string, _locale: string): { id: string; level: string; type: string; time: string }[] {
  return [
    { id: 'EX-001', level: 'P2', type: '路径规划异常', time: '2026-03-05 14:32' },
    { id: 'EX-002', level: 'P3', type: '电量低告警', time: '2026-03-05 11:20' },
  ];
}

/** Mock recent tasks for detail drawer */
function getMockRecentTasks(deviceId: string): { id: string; status: string; createdAt: string }[] {
  return [
    { id: 'TK-20260301', status: 'finished', createdAt: '2026-03-05 15:10' },
    { id: 'TK-20260302', status: 'running', createdAt: '2026-03-05 14:55' },
    { id: 'TK-20260300', status: 'finished', createdAt: '2026-03-05 13:20' },
  ];
}

export function DeviceStatisticsPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [period, setPeriod] = useState<PeriodKey>('day7');
  const [workshop, setWorkshop] = useState<string>('all');
  const [workstation, setWorkstation] = useState<string>('all');
  const [station, setStation] = useState<string>('all');
  const [robotType, setRobotType] = useState<string>('all');
  const [robotGroup, setRobotGroup] = useState<string>('all');
  const [onlineStatus, setOnlineStatus] = useState<string>('all');
  const [exceptionStatus, setExceptionStatus] = useState<string>('all');
  const [keyword, setKeyword] = useState('');
  const [detail, setDetail] = useState<DeviceRecord | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(() => new Date());

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return deviceData.filter((item) => {
      if (workshop !== 'all' && item.workshop !== workshop) return false;
      if (workstation !== 'all' && item.workstation !== workstation) return false;
      if (station !== 'all' && item.station !== station) return false;
      if (robotType !== 'all' && item.type !== robotType) return false;
      if (robotGroup !== 'all' && item.group !== robotGroup) return false;
      if (onlineStatus === 'online' && !item.online) return false;
      if (onlineStatus === 'offline' && item.online) return false;
      if (exceptionStatus === 'exception' && item.exceptionLevel === 'none') return false;
      if (exceptionStatus === 'normal' && item.exceptionLevel !== 'none') return false;
      if (!kw) return true;
      return `${item.id} ${item.station} ${item.currentTask}`.toLowerCase().includes(kw);
    });
  }, [exceptionStatus, keyword, onlineStatus, robotGroup, robotType, station, workstation, workshop]);

  const summary = useMemo(() => {
    const total = filtered.length;
    const onlineCount = filtered.filter((item) => item.online).length;
    const exceptionDeviceCount = filtered.filter((item) => item.exceptionLevel !== 'none').length;
    const avgBattery = total === 0 ? 0 : Number((filtered.reduce((sum, item) => sum + item.battery, 0) / total).toFixed(1));
    const runtime = Number(filtered.reduce((sum, item) => sum + item.runtimeHourToday, 0).toFixed(1));
    const tasks = filtered.reduce((sum, item) => sum + item.tasksToday, 0);
    const taskCompleteRate = total === 0 ? 0 : 95; // mock: 任务完成率
    return {
      total,
      onlineCount,
      onlineRate: total === 0 ? 0 : Number(((onlineCount / total) * 100).toFixed(1)),
      exceptionDeviceCount,
      avgBattery,
      runtime,
      tasks,
      taskCompleteRate,
    };
  }, [filtered]);

  const onlineTrend = useMemo(() => {
    const days = period === 'day1' ? 1 : period === 'day7' ? 7 : 30;
    const categories = Array.from({ length: days }, (_, index) => {
      const day = new Date(2026, 2, 6 - (days - 1 - index));
      return day.toISOString().slice(0, 10);
    });
    const base = summary.onlineCount;
    const values = categories.map((_, index) => Math.max(0, base - ((index % 4) - 1)));
    return { categories, values };
  }, [period, summary.onlineCount]);

  const typeDistribution = useMemo(
    () =>
      robotTypes.map((type) => ({
        name: type,
        value: filtered.filter((item) => item.type === type).length,
      })),
    [filtered],
  );

  const levelDistribution = useMemo(
    () =>
      (['none', 'low', 'medium', 'high'] as ExceptionLevel[]).map((level) => ({
        name: t(`deviceStatistics.level.${level}`),
        value: filtered.filter((item) => item.exceptionLevel === level).length,
      })),
    [filtered, t],
  );

  const batteryDistribution = useMemo(() => {
    const bins = [
      { name: '0-20%', min: 0, max: 20 },
      { name: '21-40%', min: 21, max: 40 },
      { name: '41-60%', min: 41, max: 60 },
      { name: '61-80%', min: 61, max: 80 },
      { name: '81-100%', min: 81, max: 100 },
    ];
    return bins.map((bin) => ({
      name: bin.name,
      value: filtered.filter((item) => item.battery >= bin.min && item.battery <= bin.max).length,
    }));
  }, [filtered]);

  const handleRefresh = () => {
    setLastUpdated(new Date());
    messageApi.success(t('deviceStatistics.refreshed'));
  };

  const exportRows = () => {
    if (filtered.length === 0) {
      messageApi.warning(t('deviceStatistics.noData'));
      return;
    }
    const headers = ['id', 'type', 'group', 'workshop', 'workstation', 'station', 'online', 'battery', 'runtimeHourToday', 'tasksToday', 'currentTask', 'lastHeartbeat', 'exceptionLevel', 'exceptionCount'];
    const csv = [
      headers.join(','),
      ...filtered.map((item) =>
        [
          item.id,
          item.type,
          item.group,
          item.workshop,
          item.workstation,
          item.station,
          item.online ? 'online' : 'offline',
          String(item.battery),
          String(item.runtimeHourToday),
          String(item.tasksToday),
          item.currentTask,
          item.lastHeartbeat,
          item.exceptionLevel,
          String(item.exceptionCount),
        ]
          .map((v) => escapeCsv(String(v)))
          .join(','),
      ),
    ].join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `device-statistics-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    messageApi.success(t('deviceStatistics.exportDone'));
  };

  const levelTagMap: Record<ExceptionLevel, { color: string }> = {
    none: { color: 'default' },
    low: { color: 'gold' },
    medium: { color: 'orange' },
    high: { color: 'red' },
  };

  const columns: ColumnsType<DeviceRecord> = [
    { title: t('deviceStatistics.deviceId'), dataIndex: 'id', key: 'id', width: 120 },
    { title: t('deviceStatistics.robotType'), dataIndex: 'type', key: 'type', width: 120 },
    { title: t('deviceStatistics.robotGroup'), dataIndex: 'group', key: 'group', width: 120 },
    { title: t('deviceStatistics.workshop'), dataIndex: 'workshop', key: 'workshop', width: 140 },
    { title: t('deviceStatistics.workstation'), dataIndex: 'workstation', key: 'workstation', width: 130 },
    { title: t('deviceStatistics.station'), dataIndex: 'station', key: 'station', width: 110 },
    {
      title: t('deviceStatistics.online'),
      dataIndex: 'online',
      key: 'online',
      width: 100,
      render: (value: boolean) => (
        <Tag color={value ? 'success' : 'default'}>{value ? t('deviceStatistics.onlineOnly') : t('deviceStatistics.offlineOnly')}</Tag>
      ),
    },
    {
      title: t('deviceStatistics.battery'),
      dataIndex: 'battery',
      key: 'battery',
      width: 100,
      sorter: (a, b) => a.battery - b.battery,
      render: (value: number) => `${value}%`,
    },
    {
      title: t('deviceStatistics.runtime'),
      dataIndex: 'runtimeHourToday',
      key: 'runtimeHourToday',
      width: 130,
      sorter: (a, b) => a.runtimeHourToday - b.runtimeHourToday,
      render: (value: number) => `${value} ${t('deviceStatistics.hour')}`,
    },
    { title: t('deviceStatistics.tasks'), dataIndex: 'tasksToday', key: 'tasksToday', width: 110, sorter: (a, b) => a.tasksToday - b.tasksToday },
    { title: t('deviceStatistics.currentTask'), dataIndex: 'currentTask', key: 'currentTask', width: 140 },
    { title: t('deviceStatistics.lastHeartbeat'), dataIndex: 'lastHeartbeat', key: 'lastHeartbeat', width: 160 },
    {
      title: t('deviceStatistics.exceptionLevel'),
      dataIndex: 'exceptionLevel',
      key: 'exceptionLevel',
      width: 120,
      render: (value: ExceptionLevel) => <Tag color={levelTagMap[value].color}>{t(`deviceStatistics.level.${value}`)}</Tag>,
    },
    {
      title: t('deviceStatistics.exceptionCount24h'),
      dataIndex: 'exceptionCount',
      key: 'exceptionCount',
      width: 110,
      sorter: (a, b) => a.exceptionCount - b.exceptionCount,
    },
    {
      title: t('deviceStatistics.action'),
      key: 'action',
      width: 90,
      fixed: 'right',
      render: (_, record) => (
        <Button type="link" onClick={() => setDetail(record)}>
          {t('deviceStatistics.detail')}
        </Button>
      ),
    },
  ];

  const periodOptions = [
    { label: t('deviceStatistics.period.today'), value: 'day1' },
    { label: t('deviceStatistics.period.last7'), value: 'day7' },
    { label: t('deviceStatistics.period.lastMonth'), value: 'month1' },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {contextHolder}
      <Card>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {t('menu.deviceStatistics')}
          </Typography.Title>
          <Space wrap align="center">
            <Select value={period} onChange={setPeriod} style={{ width: 130 }} options={periodOptions} />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ width: 220 }}
              placeholder={t('deviceStatistics.keyword')}
              allowClear
            />
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              {t('deviceStatistics.refresh')}
            </Button>
            <Button icon={<DownloadOutlined />} onClick={exportRows}>
              {t('deviceStatistics.export')}
            </Button>
            <Typography.Text type="secondary" style={{ marginLeft: 8 }}>
              {t('deviceStatistics.lastUpdated')}: {formatLastUpdated(lastUpdated)}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {t('deviceStatistics.mockDataHint')}
            </Typography.Text>
          </Space>
          <Collapse
            ghost
            items={[
              {
                key: 'filters',
                label: t('deviceStatistics.moreFilters'),
                children: (
                  <Space wrap>
                    <Select
                      value={workshop}
                      onChange={setWorkshop}
                      style={{ width: 150 }}
                      options={[{ label: t('deviceStatistics.allWorkshop'), value: 'all' }, ...workshops.map((item) => ({ label: item, value: item }))]}
                    />
                    <Select
                      value={workstation}
                      onChange={setWorkstation}
                      style={{ width: 130 }}
                      options={[{ label: t('deviceStatistics.allWorkstation'), value: 'all' }, ...workstations.map((item) => ({ label: item, value: item }))]}
                    />
                    <Select
                      value={station}
                      onChange={setStation}
                      style={{ width: 120 }}
                      options={[{ label: t('deviceStatistics.allStation'), value: 'all' }, ...stations.map((item) => ({ label: item, value: item }))]}
                    />
                    <Select
                      value={robotType}
                      onChange={setRobotType}
                      style={{ width: 130 }}
                      options={[{ label: t('deviceStatistics.allRobotType'), value: 'all' }, ...robotTypes.map((item) => ({ label: item, value: item }))]}
                    />
                    <Select
                      value={robotGroup}
                      onChange={setRobotGroup}
                      style={{ width: 130 }}
                      options={[{ label: t('deviceStatistics.allRobotGroup'), value: 'all' }, ...robotGroups.map((item) => ({ label: item, value: item }))]}
                    />
                    <Select
                      value={onlineStatus}
                      onChange={setOnlineStatus}
                      style={{ width: 120 }}
                      options={[
                        { label: t('deviceStatistics.allOnlineStatus'), value: 'all' },
                        { label: t('deviceStatistics.onlineOnly'), value: 'online' },
                        { label: t('deviceStatistics.offlineOnly'), value: 'offline' },
                      ]}
                    />
                    <Select
                      value={exceptionStatus}
                      onChange={setExceptionStatus}
                      style={{ width: 120 }}
                      options={[
                        { label: t('deviceStatistics.allExceptionStatus'), value: 'all' },
                        { label: t('deviceStatistics.exceptionOnly'), value: 'exception' },
                        { label: t('deviceStatistics.normalOnly'), value: 'normal' },
                      ]}
                    />
                  </Space>
                ),
              },
            ]}
          />
          {period !== 'day1' && (
            <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
              {t('deviceStatistics.summaryNote')}
            </Typography.Text>
          )}
        </Space>
      </Card>

      <Row gutter={[12, 12]}>
        <Col xs={24} sm={12} md={8} xl={4}>
          <Card>
            <Statistic title={t('deviceStatistics.total')} value={summary.total} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} xl={4}>
          <Card>
            <Statistic title={t('deviceStatistics.onlineCount')} value={summary.onlineCount} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} xl={4}>
          <Card>
            <Statistic title={t('deviceStatistics.onlineRate')} value={summary.onlineRate} suffix="%" />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} xl={4}>
          <Card>
            <Statistic title={t('deviceStatistics.exceptionDeviceCount')} value={summary.exceptionDeviceCount} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} xl={4}>
          <Card>
            <Statistic title={t('deviceStatistics.avgBattery')} value={summary.avgBattery} suffix="%" />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} xl={4}>
          <Card>
            <Statistic title={t('deviceStatistics.runtime')} value={summary.runtime} suffix={t('deviceStatistics.hour')} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} xl={4}>
          <Card>
            <Statistic title={t('deviceStatistics.tasks')} value={summary.tasks} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} xl={4}>
          <Card>
            <Statistic title={t('deviceStatistics.taskCompleteRate')} value={summary.taskCompleteRate} suffix="%" />
          </Card>
        </Col>
      </Row>

      <Row gutter={[12, 12]}>
        <Col xs={24} xl={12}>
          <Card title={t('deviceStatistics.trendTitle')}>
            <SimpleLineChart
              categories={onlineTrend.categories}
              series={[{ name: t('deviceStatistics.onlineCount'), color: '#1677ff', values: onlineTrend.values }]}
              yAxisLabel={t('deviceStatistics.onlineCount')}
            />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title={t('deviceStatistics.typeDistTitle')}>
            <SimplePieChart data={typeDistribution} />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title={t('deviceStatistics.levelDistTitle')}>
            <SimplePieChart data={levelDistribution} />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title={t('deviceStatistics.batteryDistTitle')}>
            <SimpleBarChart data={batteryDistribution} />
          </Card>
        </Col>
      </Row>

      <Card title={t('deviceStatistics.listTitle')}>
        <Table rowKey="id" columns={columns} dataSource={filtered} pagination={{ pageSize: 8, showSizeChanger: false }} scroll={{ x: 1900 }} />
      </Card>

      <Drawer title={t('deviceStatistics.detailTitle')} open={Boolean(detail)} onClose={() => setDetail(null)} width={520}>
        {detail ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label={t('deviceStatistics.deviceId')}>{detail.id}</Descriptions.Item>
              <Descriptions.Item label={t('deviceStatistics.robotType')}>{detail.type}</Descriptions.Item>
              <Descriptions.Item label={t('deviceStatistics.robotGroup')}>{detail.group}</Descriptions.Item>
              <Descriptions.Item label={`${t('deviceStatistics.workshop')} / ${t('deviceStatistics.workstation')} / ${t('deviceStatistics.station')}`}>
                {detail.workshop} / {detail.workstation} / {detail.station}
              </Descriptions.Item>
              <Descriptions.Item label={t('deviceStatistics.battery')}>{detail.battery}%</Descriptions.Item>
              <Descriptions.Item label={t('deviceStatistics.runtime')}>
                {detail.runtimeHourToday} {t('deviceStatistics.hour')}
              </Descriptions.Item>
              <Descriptions.Item label={t('deviceStatistics.tasks')}>{detail.tasksToday}</Descriptions.Item>
              <Descriptions.Item label={t('deviceStatistics.currentTask')}>{detail.currentTask}</Descriptions.Item>
              <Descriptions.Item label={t('deviceStatistics.lastHeartbeat')}>{detail.lastHeartbeat}</Descriptions.Item>
              <Descriptions.Item label={t('deviceStatistics.exceptionLevel')}>
                <Tag color={levelTagMap[detail.exceptionLevel].color}>{t(`deviceStatistics.level.${detail.exceptionLevel}`)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t('deviceStatistics.exceptionCount24h')}>{detail.exceptionCount}</Descriptions.Item>
            </Descriptions>
            <Typography.Text strong>{t('deviceStatistics.recentExceptions')}</Typography.Text>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {getMockRecentExceptions(detail.id, '').map((ex) => (
                <li key={ex.id}>
                  <Typography.Text type="secondary">{ex.id}</Typography.Text> {ex.type} · {ex.time}
                </li>
              ))}
            </ul>
            <Typography.Text strong>{t('deviceStatistics.recentTasks')}</Typography.Text>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {getMockRecentTasks(detail.id).map((task) => (
                <li key={task.id}>
                  <Typography.Text type="secondary">{task.id}</Typography.Text> {task.status} · {task.createdAt}
                </li>
              ))}
            </ul>
            <Button type="primary" icon={<RightOutlined />} onClick={() => navigate(`/operationMaintenance/robot/robotManage/${detail.id}/detail`)}>
              {t('deviceStatistics.goToRobotDetail')}
            </Button>
          </Space>
        ) : null}
      </Drawer>
    </Space>
  );
}
