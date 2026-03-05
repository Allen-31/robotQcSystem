import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Card, Col, Drawer, Input, Row, Select, Space, Statistic, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { useI18n } from '../../../i18n/I18nProvider';
import { SimpleBarChart, SimpleLineChart } from '../../components/charts/SimpleCharts';

type PeriodKey = 'day1' | 'day7' | 'month1';
type Level = 'P1' | 'P2' | 'P3';
type Status = 'pending' | 'processing' | 'closed';

interface ExceptionRecord {
  id: string;
  level: Level;
  type: string;
  source: string;
  workshop: string;
  workstation: string;
  station: string;
  robot: string;
  status: Status;
  createdAt: string;
  firstResponseAt: string;
  closedAt: string;
  owner: string;
  relatedTask: string;
  description: string;
  responseMinutes: number;
  closeMinutes: number;
}

const levelList: Level[] = ['P1', 'P2', 'P3'];
const typeList = ['路径规划异常', '视觉识别异常', '网络通信异常', '电量异常', '任务超时'];
const sourceList = ['机器人管理服务', '任务编排服务', '视觉算法服务', '调度服务'];
const statusList: Status[] = ['pending', 'processing', 'closed'];
const workshopList = ['总装一车间', '总装二车间', '总装三车间'];
const workstationList = ['质检区A', '质检区B', '质检区C', '质检区D'];
const stationList = ['ST-A01', 'ST-A02', 'ST-B01', 'ST-B02', 'ST-C01', 'ST-D01'];

const exceptionData: ExceptionRecord[] = Array.from({ length: 72 }, (_, index) => {
  const status = statusList[index % statusList.length];
  const createdDay = 5 - (index % 18);
  const createdHour = 8 + (index % 12);
  const createdAt = `2026-03-${String(createdDay).padStart(2, '0')} ${String(createdHour).padStart(2, '0')}:${String((index * 7) % 60).padStart(2, '0')}:00`;
  const responseMinutes = 5 + (index % 36);
  const closeMinutes = status === 'closed' ? 20 + (index % 180) : 0;
  return {
    id: `EX-202603-${String(index + 1).padStart(3, '0')}`,
    level: levelList[index % levelList.length],
    type: typeList[index % typeList.length],
    source: sourceList[index % sourceList.length],
    workshop: workshopList[index % workshopList.length],
    workstation: workstationList[index % workstationList.length],
    station: stationList[index % stationList.length],
    robot: `RB-${String((index % 36) + 1).padStart(3, '0')}`,
    status,
    createdAt,
    firstResponseAt: `2026-03-${String(createdDay).padStart(2, '0')} ${String(createdHour).padStart(2, '0')}:${String((index * 7 + responseMinutes) % 60).padStart(2, '0')}:00`,
    closedAt:
      status === 'closed'
        ? `2026-03-${String(createdDay).padStart(2, '0')} ${String((createdHour + Math.floor(closeMinutes / 60)) % 24).padStart(2, '0')}:${String((index * 7 + closeMinutes) % 60).padStart(2, '0')}:00`
        : '-',
    owner: ['admin', 'ops', 'qc', 'pe'][index % 4],
    relatedTask: `TK-202603-${String((index % 140) + 1).padStart(3, '0')}`,
    description: `异常描述-${index + 1}`,
    responseMinutes,
    closeMinutes,
  };
});

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function ExceptionStatisticsPage() {
  const { locale, t } = useI18n();
  const [messageApi, contextHolder] = message.useMessage();
  const [period, setPeriod] = useState<PeriodKey>('day7');
  const [level, setLevel] = useState<string>('all');
  const [type, setType] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [source, setSource] = useState<string>('all');
  const [workshop, setWorkshop] = useState<string>('all');
  const [workstation, setWorkstation] = useState<string>('all');
  const [station, setStation] = useState<string>('all');
  const [robot, setRobot] = useState<string>('all');
  const [keyword, setKeyword] = useState('');
  const [detail, setDetail] = useState<ExceptionRecord | null>(null);

  const label = useMemo(
    () =>
      locale === 'en-US'
        ? {
            keyword: 'Search by id/robot/task',
            all: 'All',
            pending: 'Pending',
            processing: 'Processing',
            closed: 'Closed',
            refresh: 'Refresh',
            export: 'Export',
            total: 'Total Exceptions',
            pendingCount: 'Pending',
            processingCount: 'Processing',
            closedCount: 'Closed',
            closeRate: 'Close Rate',
            avgResponse: 'Avg Response',
            avgClose: 'Avg Close',
            highLevel: 'High Level',
            trendTitle: 'Exception Trend',
            levelDistTitle: 'Level Distribution',
            typeTopTitle: 'Type Top',
            sourceDistTitle: 'Source Distribution',
            recurrenceTitle: 'Recurrence Top',
            listTitle: 'Exception List',
            detailTitle: 'Exception Detail',
            exportDone: 'Exported successfully',
            noData: 'No data to export',
          }
        : {
            keyword: '按编号/机器人/任务搜索',
            all: '全部',
            pending: '待处理',
            processing: '处理中',
            closed: '已关闭',
            refresh: '刷新',
            export: '导出',
            total: '异常总数',
            pendingCount: '待处理',
            processingCount: '处理中',
            closedCount: '已关闭',
            closeRate: '关闭率',
            avgResponse: '平均响应',
            avgClose: '平均关闭',
            highLevel: '高等级异常',
            trendTitle: '异常趋势',
            levelDistTitle: '等级分布',
            typeTopTitle: '异常类型Top',
            sourceDistTitle: '来源分布',
            recurrenceTitle: '复发Top',
            listTitle: '异常统计列表',
            detailTitle: '异常详情',
            exportDone: '导出成功',
            noData: '暂无可导出数据',
          },
    [locale],
  );

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return exceptionData.filter((item) => {
      if (level !== 'all' && item.level !== level) return false;
      if (type !== 'all' && item.type !== type) return false;
      if (status !== 'all' && item.status !== status) return false;
      if (source !== 'all' && item.source !== source) return false;
      if (workshop !== 'all' && item.workshop !== workshop) return false;
      if (workstation !== 'all' && item.workstation !== workstation) return false;
      if (station !== 'all' && item.station !== station) return false;
      if (robot !== 'all' && item.robot !== robot) return false;
      if (!kw) return true;
      return `${item.id} ${item.robot} ${item.relatedTask}`.toLowerCase().includes(kw);
    });
  }, [keyword, level, robot, source, station, status, type, workstation, workshop]);

  const summary = useMemo(() => {
    const total = filtered.length;
    const pendingCount = filtered.filter((item) => item.status === 'pending').length;
    const processingCount = filtered.filter((item) => item.status === 'processing').length;
    const closedCount = filtered.filter((item) => item.status === 'closed').length;
    const highLevel = filtered.filter((item) => item.level === 'P1').length;
    const avgResponse = total === 0 ? 0 : Number((filtered.reduce((sum, item) => sum + item.responseMinutes, 0) / total).toFixed(1));
    const closedRows = filtered.filter((item) => item.status === 'closed');
    const avgClose = closedRows.length === 0 ? 0 : Number((closedRows.reduce((sum, item) => sum + item.closeMinutes, 0) / closedRows.length).toFixed(1));
    return {
      total,
      pendingCount,
      processingCount,
      closedCount,
      closeRate: total === 0 ? 0 : Number(((closedCount / total) * 100).toFixed(1)),
      avgResponse,
      avgClose,
      highLevel,
    };
  }, [filtered]);

  const trend = useMemo(() => {
    const days = period === 'day1' ? 1 : period === 'day7' ? 7 : 30;
    const categories = Array.from({ length: days }, (_, index) => {
      const day = new Date(2026, 2, 6 - (days - 1 - index));
      return day.toISOString().slice(0, 10);
    });
    const values = categories.map((day) => filtered.filter((item) => item.createdAt.startsWith(day)).length);
    return { categories, values };
  }, [filtered, period]);

  const levelDistribution = useMemo(() => levelList.map((lv) => ({ name: lv, value: filtered.filter((item) => item.level === lv).length })), [filtered]);
  const typeTop = useMemo(
    () =>
      typeList
        .map((tp) => ({ name: tp, value: filtered.filter((item) => item.type === tp).length }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8),
    [filtered],
  );
  const sourceDistribution = useMemo(() => sourceList.map((src) => ({ name: src, value: filtered.filter((item) => item.source === src).length })), [filtered]);
  const recurrenceTop = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((item) => map.set(item.robot, (map.get(item.robot) ?? 0) + 1));
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filtered]);

  const exportRows = () => {
    if (filtered.length === 0) {
      messageApi.warning(label.noData);
      return;
    }
    const headers = ['id', 'level', 'type', 'source', 'workshop', 'workstation', 'station', 'robot', 'status', 'createdAt', 'firstResponseAt', 'closedAt', 'owner', 'relatedTask', 'responseMinutes', 'closeMinutes'];
    const csv = [
      headers.join(','),
      ...filtered.map((item) =>
        [
          item.id,
          item.level,
          item.type,
          item.source,
          item.workshop,
          item.workstation,
          item.station,
          item.robot,
          item.status,
          item.createdAt,
          item.firstResponseAt,
          item.closedAt,
          item.owner,
          item.relatedTask,
          String(item.responseMinutes),
          String(item.closeMinutes),
        ]
          .map((v) => escapeCsv(v))
          .join(','),
      ),
    ].join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `exception-statistics-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    messageApi.success(label.exportDone);
  };

  const columns: ColumnsType<ExceptionRecord> = [
    { title: locale === 'en-US' ? 'ID' : '异常编号', dataIndex: 'id', key: 'id', width: 150 },
    { title: locale === 'en-US' ? 'Level' : '等级', dataIndex: 'level', key: 'level', width: 90, sorter: (a, b) => a.level.localeCompare(b.level), render: (value: Level) => <Tag color={value === 'P1' ? 'red' : value === 'P2' ? 'orange' : 'gold'}>{value}</Tag> },
    { title: locale === 'en-US' ? 'Type' : '类型', dataIndex: 'type', key: 'type', width: 160 },
    { title: locale === 'en-US' ? 'Source' : '来源系统', dataIndex: 'source', key: 'source', width: 150 },
    { title: locale === 'en-US' ? 'Robot' : '机器人', dataIndex: 'robot', key: 'robot', width: 110 },
    {
      title: locale === 'en-US' ? 'Status' : '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (value: Status) => <Tag color={value === 'closed' ? 'success' : value === 'processing' ? 'processing' : 'default'}>{value === 'closed' ? label.closed : value === 'processing' ? label.processing : label.pending}</Tag>,
    },
    { title: locale === 'en-US' ? 'Created At' : '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
    { title: locale === 'en-US' ? 'First Response' : '首次响应', dataIndex: 'firstResponseAt', key: 'firstResponseAt', width: 170 },
    { title: locale === 'en-US' ? 'Closed At' : '关闭时间', dataIndex: 'closedAt', key: 'closedAt', width: 170 },
    { title: locale === 'en-US' ? 'Response(min)' : '响应时长(分钟)', dataIndex: 'responseMinutes', key: 'responseMinutes', width: 130, sorter: (a, b) => a.responseMinutes - b.responseMinutes },
    { title: locale === 'en-US' ? 'Close(min)' : '关闭时长(分钟)', dataIndex: 'closeMinutes', key: 'closeMinutes', width: 130, sorter: (a, b) => a.closeMinutes - b.closeMinutes },
    { title: locale === 'en-US' ? 'Owner' : '责任人', dataIndex: 'owner', key: 'owner', width: 100 },
    { title: locale === 'en-US' ? 'Task' : '关联任务', dataIndex: 'relatedTask', key: 'relatedTask', width: 130 },
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
            {t('menu.exceptionStatistics')}
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
            <Select value={level} onChange={setLevel} style={{ width: 110 }} options={[{ label: label.all, value: 'all' }, ...levelList.map((item) => ({ label: item, value: item }))]} />
            <Select value={type} onChange={setType} style={{ width: 150 }} options={[{ label: label.all, value: 'all' }, ...typeList.map((item) => ({ label: item, value: item }))]} />
            <Select
              value={status}
              onChange={setStatus}
              style={{ width: 120 }}
              options={[
                { label: label.all, value: 'all' },
                { label: label.pending, value: 'pending' },
                { label: label.processing, value: 'processing' },
                { label: label.closed, value: 'closed' },
              ]}
            />
            <Select value={source} onChange={setSource} style={{ width: 150 }} options={[{ label: label.all, value: 'all' }, ...sourceList.map((item) => ({ label: item, value: item }))]} />
            <Select value={workshop} onChange={setWorkshop} style={{ width: 140 }} options={[{ label: label.all, value: 'all' }, ...workshopList.map((item) => ({ label: item, value: item }))]} />
            <Select value={workstation} onChange={setWorkstation} style={{ width: 130 }} options={[{ label: label.all, value: 'all' }, ...workstationList.map((item) => ({ label: item, value: item }))]} />
            <Select value={station} onChange={setStation} style={{ width: 120 }} options={[{ label: label.all, value: 'all' }, ...stationList.map((item) => ({ label: item, value: item }))]} />
            <Select value={robot} onChange={setRobot} style={{ width: 120 }} options={[{ label: label.all, value: 'all' }, ...Array.from(new Set(exceptionData.map((item) => item.robot))).map((item) => ({ label: item, value: item }))]} />
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
            <Statistic title={label.pendingCount} value={summary.pendingCount} />
          </Card>
        </Col>
        <Col xs={24} md={8} xl={3}>
          <Card>
            <Statistic title={label.processingCount} value={summary.processingCount} />
          </Card>
        </Col>
        <Col xs={24} md={8} xl={3}>
          <Card>
            <Statistic title={label.closedCount} value={summary.closedCount} />
          </Card>
        </Col>
        <Col xs={24} md={8} xl={3}>
          <Card>
            <Statistic title={label.closeRate} value={summary.closeRate} suffix="%" />
          </Card>
        </Col>
        <Col xs={24} md={8} xl={4}>
          <Card>
            <Statistic title={label.avgResponse} value={summary.avgResponse} suffix={locale === 'en-US' ? ' min' : ' 分钟'} />
          </Card>
        </Col>
        <Col xs={24} md={8} xl={4}>
          <Card>
            <Statistic title={label.avgClose} value={summary.avgClose} suffix={locale === 'en-US' ? ' min' : ' 分钟'} />
          </Card>
        </Col>
        <Col xs={24} md={8} xl={1}>
          <Card>
            <Statistic title={label.highLevel} value={summary.highLevel} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[12, 12]}>
        <Col xs={24} xl={12}>
          <Card title={label.trendTitle}>
            <SimpleLineChart categories={trend.categories} series={[{ name: label.total, color: '#fa541c', values: trend.values }]} yAxisLabel={label.total} />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title={label.levelDistTitle}>
            <SimpleBarChart data={levelDistribution} />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title={label.typeTopTitle}>
            <SimpleBarChart data={typeTop} />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title={label.sourceDistTitle}>
            <SimpleBarChart data={sourceDistribution} />
          </Card>
        </Col>
        <Col xs={24}>
          <Card title={label.recurrenceTitle}>
            <SimpleBarChart data={recurrenceTop} />
          </Card>
        </Col>
      </Row>

      <Card title={label.listTitle}>
        <Table rowKey="id" columns={columns} dataSource={filtered} pagination={{ pageSize: 8, showSizeChanger: false }} scroll={{ x: 2200 }} />
      </Card>

      <Drawer title={label.detailTitle} open={Boolean(detail)} onClose={() => setDetail(null)} width={560}>
        {detail ? (
          <Space direction="vertical" size={10} style={{ width: '100%' }}>
            <Typography.Text>{`${locale === 'en-US' ? 'ID' : '编号'}: ${detail.id}`}</Typography.Text>
            <Typography.Text>{`${locale === 'en-US' ? 'Level' : '等级'}: ${detail.level}`}</Typography.Text>
            <Typography.Text>{`${locale === 'en-US' ? 'Type' : '类型'}: ${detail.type}`}</Typography.Text>
            <Typography.Text>{`${locale === 'en-US' ? 'Source' : '来源'}: ${detail.source}`}</Typography.Text>
            <Typography.Text>{`${locale === 'en-US' ? 'Location' : '位置'}: ${detail.workshop} / ${detail.workstation} / ${detail.station}`}</Typography.Text>
            <Typography.Text>{`${locale === 'en-US' ? 'Robot' : '机器人'}: ${detail.robot}`}</Typography.Text>
            <Typography.Text>{`${locale === 'en-US' ? 'Status' : '状态'}: ${detail.status}`}</Typography.Text>
            <Typography.Text>{`${locale === 'en-US' ? 'Created At' : '创建时间'}: ${detail.createdAt}`}</Typography.Text>
            <Typography.Text>{`${locale === 'en-US' ? 'First Response' : '首次响应'}: ${detail.firstResponseAt}`}</Typography.Text>
            <Typography.Text>{`${locale === 'en-US' ? 'Closed At' : '关闭时间'}: ${detail.closedAt}`}</Typography.Text>
            <Typography.Text>{`${locale === 'en-US' ? 'Response' : '响应'}: ${detail.responseMinutes}${locale === 'en-US' ? ' min' : ' 分钟'}`}</Typography.Text>
            <Typography.Text>{`${locale === 'en-US' ? 'Close' : '关闭'}: ${detail.closeMinutes}${locale === 'en-US' ? ' min' : ' 分钟'}`}</Typography.Text>
            <Typography.Text>{`${locale === 'en-US' ? 'Owner' : '责任人'}: ${detail.owner}`}</Typography.Text>
            <Typography.Text>{`${locale === 'en-US' ? 'Task' : '关联任务'}: ${detail.relatedTask}`}</Typography.Text>
            <Typography.Paragraph>{`${locale === 'en-US' ? 'Description' : '异常描述'}: ${detail.description}`}</Typography.Paragraph>
          </Space>
        ) : null}
      </Drawer>
    </Space>
  );
}
