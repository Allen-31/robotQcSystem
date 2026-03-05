import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Card, Col, Drawer, Input, Row, Select, Space, Statistic, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { useI18n } from '../../../i18n/I18nProvider';
import { SimpleBarChart, SimpleLineChart } from '../../components/charts/SimpleCharts';

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

export function DeviceStatisticsPage() {
  const { locale, t } = useI18n();
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

  const label = useMemo(
    () =>
      locale === 'en-US'
        ? {
            period: 'Time',
            workshop: 'Workshop',
            workstation: 'Zone',
            station: 'Bench',
            robotType: 'Robot Type',
            robotGroup: 'Robot Group',
            online: 'Online',
            exception: 'Exception',
            keyword: 'Search by robot/task/station',
            refresh: 'Refresh',
            export: 'Export',
            allWorkshop: 'All Workshops',
            allWorkstation: 'All Zones',
            allStation: 'All Benches',
            allRobotType: 'All Robot Types',
            allRobotGroup: 'All Robot Groups',
            allOnlineStatus: 'All Online Status',
            allExceptionStatus: 'All Exception Status',
            total: 'Total Devices',
            onlineCount: 'Online Devices',
            onlineRate: 'Online Rate',
            faultCount: 'Fault Devices',
            avgBattery: 'Avg Battery',
            runtime: 'Runtime Today',
            tasks: 'Tasks Today',
            listTitle: 'Device Statistics List',
            trendTitle: 'Online Trend',
            typeDistTitle: 'Type Distribution',
            levelDistTitle: 'Exception Level Distribution',
            batteryDistTitle: 'Battery Distribution',
            detailTitle: 'Device Detail',
            noData: 'No data to export',
            exportDone: 'Exported successfully',
            all: 'All',
            onlineOnly: 'Online',
            offlineOnly: 'Offline',
            exceptionOnly: 'Has Exception',
            normalOnly: 'Normal',
          }
        : {
            period: '时间',
            workshop: '车间',
            workstation: '质检区',
            station: '质检台',
            robotType: '机器人类型',
            robotGroup: '机器人组',
            online: '在线状态',
            exception: '异常状态',
            keyword: '按机器人/任务/工位搜索',
            refresh: '刷新',
            export: '导出',
            allWorkshop: '全部车间',
            allWorkstation: '全部质检区',
            allStation: '全部质检台',
            allRobotType: '全部机器人类型',
            allRobotGroup: '全部机器人组',
            allOnlineStatus: '全部在线状态',
            allExceptionStatus: '全部异常状态',
            total: '设备总数',
            onlineCount: '在线设备数',
            onlineRate: '在线率',
            faultCount: '故障设备数',
            avgBattery: '平均电量',
            runtime: '今日运行时长',
            tasks: '今日任务量',
            listTitle: '设备统计列表',
            trendTitle: '在线趋势',
            typeDistTitle: '设备类型分布',
            levelDistTitle: '异常等级分布',
            batteryDistTitle: '电量分布',
            detailTitle: '设备详情',
            noData: '暂无可导出数据',
            exportDone: '导出成功',
            all: '全部',
            onlineOnly: '在线',
            offlineOnly: '离线',
            exceptionOnly: '有异常',
            normalOnly: '正常',
          },
    [locale],
  );

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
    const faultCount = filtered.filter((item) => item.exceptionLevel !== 'none').length;
    const avgBattery = total === 0 ? 0 : Number((filtered.reduce((sum, item) => sum + item.battery, 0) / total).toFixed(1));
    const runtime = Number(filtered.reduce((sum, item) => sum + item.runtimeHourToday, 0).toFixed(1));
    const tasks = filtered.reduce((sum, item) => sum + item.tasksToday, 0);
    return {
      total,
      onlineCount,
      onlineRate: total === 0 ? 0 : Number(((onlineCount / total) * 100).toFixed(1)),
      faultCount,
      avgBattery,
      runtime,
      tasks,
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

  const levelDistribution = useMemo(() => {
    const levelText: Record<ExceptionLevel, string> = {
      none: locale === 'en-US' ? 'Normal' : '正常',
      low: locale === 'en-US' ? 'Low' : '低',
      medium: locale === 'en-US' ? 'Medium' : '中',
      high: locale === 'en-US' ? 'High' : '高',
    };
    return (['none', 'low', 'medium', 'high'] as ExceptionLevel[]).map((level) => ({
      name: levelText[level],
      value: filtered.filter((item) => item.exceptionLevel === level).length,
    }));
  }, [filtered, locale]);

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

  const exportRows = () => {
    if (filtered.length === 0) {
      messageApi.warning(label.noData);
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
          .map((v) => escapeCsv(v))
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
    messageApi.success(label.exportDone);
  };

  const columns: ColumnsType<DeviceRecord> = [
    { title: locale === 'en-US' ? 'Device ID' : '设备编号', dataIndex: 'id', key: 'id', width: 120 },
    { title: label.robotType, dataIndex: 'type', key: 'type', width: 120 },
    { title: label.robotGroup, dataIndex: 'group', key: 'group', width: 120 },
    { title: label.workshop, dataIndex: 'workshop', key: 'workshop', width: 140 },
    { title: label.workstation, dataIndex: 'workstation', key: 'workstation', width: 130 },
    { title: label.station, dataIndex: 'station', key: 'station', width: 110 },
    {
      title: label.online,
      dataIndex: 'online',
      key: 'online',
      width: 100,
      render: (value: boolean) => <Tag color={value ? 'success' : 'default'}>{value ? (locale === 'en-US' ? 'Online' : '在线') : locale === 'en-US' ? 'Offline' : '离线'}</Tag>,
    },
    { title: locale === 'en-US' ? 'Battery' : '电量', dataIndex: 'battery', key: 'battery', width: 100, sorter: (a, b) => a.battery - b.battery, render: (value: number) => `${value}%` },
    { title: label.runtime, dataIndex: 'runtimeHourToday', key: 'runtimeHourToday', width: 130, sorter: (a, b) => a.runtimeHourToday - b.runtimeHourToday, render: (value: number) => `${value}${locale === 'en-US' ? ' h' : ' 小时'}` },
    { title: label.tasks, dataIndex: 'tasksToday', key: 'tasksToday', width: 110, sorter: (a, b) => a.tasksToday - b.tasksToday },
    { title: locale === 'en-US' ? 'Current Task' : '当前任务', dataIndex: 'currentTask', key: 'currentTask', width: 140 },
    { title: locale === 'en-US' ? 'Last Heartbeat' : '最近心跳', dataIndex: 'lastHeartbeat', key: 'lastHeartbeat', width: 160 },
    {
      title: locale === 'en-US' ? 'Exception Level' : '异常等级',
      dataIndex: 'exceptionLevel',
      key: 'exceptionLevel',
      width: 120,
      render: (value: ExceptionLevel) => {
        const map: Record<ExceptionLevel, { color: string; text: string }> = {
          none: { color: 'default', text: locale === 'en-US' ? 'Normal' : '正常' },
          low: { color: 'gold', text: locale === 'en-US' ? 'Low' : '低' },
          medium: { color: 'orange', text: locale === 'en-US' ? 'Medium' : '中' },
          high: { color: 'red', text: locale === 'en-US' ? 'High' : '高' },
        };
        return <Tag color={map[value].color}>{map[value].text}</Tag>;
      },
    },
    { title: locale === 'en-US' ? 'Exception Count' : '异常次数', dataIndex: 'exceptionCount', key: 'exceptionCount', width: 110, sorter: (a, b) => a.exceptionCount - b.exceptionCount },
    {
      title: locale === 'en-US' ? 'Action' : '操作',
      key: 'action',
      width: 90,
      fixed: 'right',
      render: (_, record) => (
        <Button type="link" onClick={() => setDetail(record)}>
          {locale === 'en-US' ? 'Detail' : '详情'}
        </Button>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {contextHolder}
      <Card>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {t('menu.deviceStatistics')}
          </Typography.Title>
          <Space wrap>
            <Select
              value={period}
              onChange={setPeriod}
              style={{ width: 130 }}
              options={[
                { label: locale === 'en-US' ? 'Today' : '今日', value: 'day1' },
                { label: locale === 'en-US' ? 'Last 7 Days' : '近7天', value: 'day7' },
                { label: locale === 'en-US' ? 'Last 1 Month' : '近1个月', value: 'month1' },
              ]}
            />
            <Select value={workshop} onChange={setWorkshop} style={{ width: 150 }} options={[{ label: label.allWorkshop, value: 'all' }, ...workshops.map((item) => ({ label: item, value: item }))]} />
            <Select value={workstation} onChange={setWorkstation} style={{ width: 130 }} options={[{ label: label.allWorkstation, value: 'all' }, ...workstations.map((item) => ({ label: item, value: item }))]} />
            <Select value={station} onChange={setStation} style={{ width: 120 }} options={[{ label: label.allStation, value: 'all' }, ...stations.map((item) => ({ label: item, value: item }))]} />
            <Select value={robotType} onChange={setRobotType} style={{ width: 130 }} options={[{ label: label.allRobotType, value: 'all' }, ...robotTypes.map((item) => ({ label: item, value: item }))]} />
            <Select value={robotGroup} onChange={setRobotGroup} style={{ width: 130 }} options={[{ label: label.allRobotGroup, value: 'all' }, ...robotGroups.map((item) => ({ label: item, value: item }))]} />
            <Select
              value={onlineStatus}
              onChange={setOnlineStatus}
              style={{ width: 120 }}
              options={[
                { label: label.allOnlineStatus, value: 'all' },
                { label: label.onlineOnly, value: 'online' },
                { label: label.offlineOnly, value: 'offline' },
              ]}
            />
            <Select
              value={exceptionStatus}
              onChange={setExceptionStatus}
              style={{ width: 120 }}
              options={[
                { label: label.allExceptionStatus, value: 'all' },
                { label: label.exceptionOnly, value: 'exception' },
                { label: label.normalOnly, value: 'normal' },
              ]}
            />
            <Input value={keyword} onChange={(event) => setKeyword(event.target.value)} style={{ width: 220 }} placeholder={label.keyword} allowClear />
            <Button icon={<ReloadOutlined />} onClick={() => messageApi.success(locale === 'en-US' ? 'Refreshed' : '已刷新')}>
              {label.refresh}
            </Button>
            <Button icon={<DownloadOutlined />} onClick={exportRows}>
              {label.export}
            </Button>
          </Space>
        </Space>
      </Card>

      <Row gutter={[12, 12]}>
        <Col xs={24} md={8} xl={3}>
          <Card>
            <Statistic title={label.total} value={summary.total} />
          </Card>
        </Col>
        <Col xs={24} md={8} xl={3}>
          <Card>
            <Statistic title={label.onlineCount} value={summary.onlineCount} />
          </Card>
        </Col>
        <Col xs={24} md={8} xl={3}>
          <Card>
            <Statistic title={label.onlineRate} value={summary.onlineRate} suffix="%" />
          </Card>
        </Col>
        <Col xs={24} md={8} xl={3}>
          <Card>
            <Statistic title={label.faultCount} value={summary.faultCount} />
          </Card>
        </Col>
        <Col xs={24} md={8} xl={3}>
          <Card>
            <Statistic title={label.avgBattery} value={summary.avgBattery} suffix="%" />
          </Card>
        </Col>
        <Col xs={24} md={8} xl={4}>
          <Card>
            <Statistic title={label.runtime} value={summary.runtime} suffix={locale === 'en-US' ? ' h' : ' 小时'} />
          </Card>
        </Col>
        <Col xs={24} md={8} xl={5}>
          <Card>
            <Statistic title={label.tasks} value={summary.tasks} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[12, 12]}>
        <Col xs={24} xl={12}>
          <Card title={label.trendTitle}>
            <SimpleLineChart
              categories={onlineTrend.categories}
              series={[{ name: label.onlineCount, color: '#1677ff', values: onlineTrend.values }]}
              yAxisLabel={label.onlineCount}
            />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title={label.typeDistTitle}>
            <SimpleBarChart data={typeDistribution} />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title={label.levelDistTitle}>
            <SimpleBarChart data={levelDistribution} />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title={label.batteryDistTitle}>
            <SimpleBarChart data={batteryDistribution} />
          </Card>
        </Col>
      </Row>

      <Card title={label.listTitle}>
        <Table rowKey="id" columns={columns} dataSource={filtered} pagination={{ pageSize: 8, showSizeChanger: false }} scroll={{ x: 1900 }} />
      </Card>

      <Drawer title={label.detailTitle} open={Boolean(detail)} onClose={() => setDetail(null)} width={520}>
        {detail ? (
          <Space direction="vertical" size={10} style={{ width: '100%' }}>
            <Typography.Text>{`ID: ${detail.id}`}</Typography.Text>
            <Typography.Text>{`${label.robotType}: ${detail.type}`}</Typography.Text>
            <Typography.Text>{`${label.robotGroup}: ${detail.group}`}</Typography.Text>
            <Typography.Text>{`${label.workshop}/${label.workstation}/${label.station}: ${detail.workshop} / ${detail.workstation} / ${detail.station}`}</Typography.Text>
            <Typography.Text>{`${locale === 'en-US' ? 'Battery' : '电量'}: ${detail.battery}%`}</Typography.Text>
            <Typography.Text>{`${label.runtime}: ${detail.runtimeHourToday}${locale === 'en-US' ? ' h' : ' 小时'}`}</Typography.Text>
            <Typography.Text>{`${label.tasks}: ${detail.tasksToday}`}</Typography.Text>
            <Typography.Text>{`${locale === 'en-US' ? 'Current Task' : '当前任务'}: ${detail.currentTask}`}</Typography.Text>
            <Typography.Text>{`${locale === 'en-US' ? 'Last Heartbeat' : '最近心跳'}: ${detail.lastHeartbeat}`}</Typography.Text>
          </Space>
        ) : null}
      </Drawer>
    </Space>
  );
}
