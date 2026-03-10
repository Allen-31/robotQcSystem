import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Card, Col, Collapse, Drawer, Grid, Input, Row, Select, Space, Statistic, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import {
  exceptionData,
  levelList,
  typeList,
  sourceList,
  workshopList,
  workstationList,
  stationList,
  RESPONSE_OVERDUE_MINUTES,
  type ExceptionRecord,
  type Level,
  type Status,
} from '../../../data/dataStatistics/exceptionStatisticsData';
import { useI18n } from '../../../i18n/I18nProvider';
import { escapeCsv } from '../../../utils/csv';
import { SimpleBarChart, SimpleLineChart } from '../../components/charts/SimpleCharts';
import './ExceptionStatisticsPage.css';

type PeriodKey = 'day1' | 'day7' | 'month1';

/** Reference "today" for period range (align with mock data base date). */
const periodEndDate = new Date(2026, 2, 6);

function isInPeriod(createdAt: string, period: PeriodKey): boolean {
  const dateStr = createdAt.slice(0, 10);
  const created = new Date(dateStr);
  const end = new Date(periodEndDate);
  end.setHours(23, 59, 59, 999);
  if (period === 'day1') {
    const start = new Date(periodEndDate);
    start.setHours(0, 0, 0, 0);
    return created >= start && created <= end;
  }
  if (period === 'day7') {
    const start = new Date(periodEndDate);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return created >= start && created <= end;
  }
  const start = new Date(periodEndDate);
  start.setDate(start.getDate() - 29);
  start.setHours(0, 0, 0, 0);
  return created >= start && created <= end;
}

function statusLabel(t: (key: string) => string, value: Status): string {
  return value === 'closed' ? t('exceptionStatistics.closed') : value === 'processing' ? t('exceptionStatistics.processing') : t('exceptionStatistics.pending');
}

function buildColumns(
  t: (key: string) => string,
  setDetail: (r: ExceptionRecord | null) => void,
): ColumnsType<ExceptionRecord> {
  return [
    { title: t('exceptionStatistics.table.id'), dataIndex: 'id', key: 'id', width: 150 },
    { title: t('exceptionStatistics.table.level'), dataIndex: 'level', key: 'level', width: 90, sorter: (a, b) => a.level.localeCompare(b.level), render: (value: Level) => <Tag color={value === 'P1' ? 'red' : value === 'P2' ? 'orange' : 'gold'}>{value}</Tag> },
    { title: t('exceptionStatistics.table.type'), dataIndex: 'type', key: 'type', width: 160 },
    { title: t('exceptionStatistics.table.source'), dataIndex: 'source', key: 'source', width: 150 },
    { title: t('exceptionStatistics.table.robot'), dataIndex: 'robot', key: 'robot', width: 110 },
    {
      title: t('exceptionStatistics.table.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (value: Status) => <Tag color={value === 'closed' ? 'success' : value === 'processing' ? 'processing' : 'default'}>{statusLabel(t, value)}</Tag>,
    },
    { title: t('exceptionStatistics.table.createdAt'), dataIndex: 'createdAt', key: 'createdAt', width: 170 },
    { title: t('exceptionStatistics.table.firstResponse'), dataIndex: 'firstResponseAt', key: 'firstResponseAt', width: 170 },
    { title: t('exceptionStatistics.table.closedAt'), dataIndex: 'closedAt', key: 'closedAt', width: 170 },
    { title: t('exceptionStatistics.table.responseMin'), dataIndex: 'responseMinutes', key: 'responseMinutes', width: 130, sorter: (a, b) => a.responseMinutes - b.responseMinutes },
    { title: t('exceptionStatistics.table.closeMin'), dataIndex: 'closeMinutes', key: 'closeMinutes', width: 130, sorter: (a, b) => a.closeMinutes - b.closeMinutes },
    { title: t('exceptionStatistics.table.owner'), dataIndex: 'owner', key: 'owner', width: 100 },
    { title: t('exceptionStatistics.table.task'), dataIndex: 'relatedTask', key: 'relatedTask', width: 130 },
    {
      title: t('exceptionStatistics.table.action'),
      key: 'action',
      width: 90,
      fixed: 'right',
      render: (_, record) => (
        <Button type="link" onClick={() => setDetail(record)}>
          {t('exceptionStatistics.table.detail')}
        </Button>
      ),
    },
  ];
}

interface ExceptionStatisticsWebProps {
  period: PeriodKey;
  setPeriod: (v: PeriodKey) => void;
  level: string;
  setLevel: (v: string) => void;
  type: string;
  setType: (v: string) => void;
  status: string;
  setStatus: (v: string) => void;
  source: string;
  setSource: (v: string) => void;
  workshop: string;
  setWorkshop: (v: string) => void;
  workstation: string;
  setWorkstation: (v: string) => void;
  station: string;
  setStation: (v: string) => void;
  robot: string;
  setRobot: (v: string) => void;
  keyword: string;
  setKeyword: (v: string) => void;
  detail: ExceptionRecord | null;
  setDetail: (r: ExceptionRecord | null) => void;
  filtered: ExceptionRecord[];
  summary: { total: number; pendingCount: number; processingCount: number; closedCount: number; closeRate: number; avgResponse: number; avgClose: number; highLevel: number; overdueResponse: number };
  trend: { categories: string[]; values: number[] };
  levelDistribution: { name: string; value: number }[];
  typeTop: { name: string; value: number }[];
  sourceDistribution: { name: string; value: number }[];
  recurrenceTop: { name: string; value: number }[];
  columns: ColumnsType<ExceptionRecord>;
  onRefresh: () => void;
  onExport: () => void;
  t: (key: string) => string;
  contextHolder: React.ReactNode;
}

function ExceptionStatisticsWeb({
  period,
  setPeriod,
  level,
  setLevel,
  type,
  setType,
  status,
  setStatus,
  source,
  setSource,
  workshop,
  setWorkshop,
  workstation,
  setWorkstation,
  station,
  setStation,
  robot,
  setRobot,
  keyword,
  setKeyword,
  detail,
  setDetail,
  filtered,
  summary,
  trend,
  levelDistribution,
  typeTop,
  sourceDistribution,
  recurrenceTop,
  columns,
  onRefresh,
  onExport,
  t,
  contextHolder,
}: ExceptionStatisticsWebProps) {
  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {contextHolder}
      <Card>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {t('menu.exceptionStatistics')}
          </Typography.Title>
          <Space wrap align="center">
            <Select
              value={period}
              onChange={setPeriod}
              style={{ width: 130 }}
              options={[
                { label: t('exceptionStatistics.period.today'), value: 'day1' },
                { label: t('exceptionStatistics.period.last7'), value: 'day7' },
                { label: t('exceptionStatistics.period.lastMonth'), value: 'month1' },
              ]}
            />
            <Select value={level} onChange={setLevel} style={{ width: 110 }} options={[{ label: t('exceptionStatistics.selectLevel'), value: 'all' }, ...levelList.map((item) => ({ label: item, value: item }))]} />
            <Select value={type} onChange={setType} style={{ width: 150 }} options={[{ label: t('exceptionStatistics.selectType'), value: 'all' }, ...typeList.map((item) => ({ label: item, value: item }))]} />
            <Select
              value={status}
              onChange={setStatus}
              style={{ width: 120 }}
              options={[
                { label: t('exceptionStatistics.selectStatus'), value: 'all' },
                { label: t('exceptionStatistics.pending'), value: 'pending' },
                { label: t('exceptionStatistics.processing'), value: 'processing' },
                { label: t('exceptionStatistics.closed'), value: 'closed' },
              ]}
            />
            <Select value={source} onChange={setSource} style={{ width: 150 }} options={[{ label: t('exceptionStatistics.selectSource'), value: 'all' }, ...sourceList.map((item) => ({ label: item, value: item }))]} />
            <Input value={keyword} onChange={(event) => setKeyword(event.target.value)} style={{ width: 220 }} placeholder={t('exceptionStatistics.keyword')} allowClear />
            <Button icon={<ReloadOutlined />} onClick={onRefresh}>
              {t('exceptionStatistics.refresh')}
            </Button>
            <Button icon={<DownloadOutlined />} onClick={onExport}>
              {t('exceptionStatistics.export')}
            </Button>
          </Space>
          <Collapse
            ghost
            items={[
              {
                key: 'filters',
                label: t('exceptionStatistics.moreFilters'),
                children: (
                  <Space wrap>
                    <Select
                      value={workshop}
                      onChange={setWorkshop}
                      style={{ width: 140 }}
                      options={[{ label: '请选择车间', value: 'all' }, ...workshopList.map((item) => ({ label: item, value: item }))]}
                    />
                    <Select
                      value={workstation}
                      onChange={setWorkstation}
                      style={{ width: 130 }}
                      options={[{ label: '请选择质检区', value: 'all' }, ...workstationList.map((item) => ({ label: item, value: item }))]}
                    />
                    <Select
                      value={station}
                      onChange={setStation}
                      style={{ width: 120 }}
                      options={[{ label: '请选择质检台', value: 'all' }, ...stationList.map((item) => ({ label: item, value: item }))]}
                    />
                    <Select
                      value={robot}
                      onChange={setRobot}
                      style={{ width: 120 }}
                      options={[{ label: '请选择机器人', value: 'all' }, ...Array.from(new Set(exceptionData.map((item) => item.robot))).map((item) => ({ label: item, value: item }))]}
                    />
                  </Space>
                ),
              },
            ]}
          />
        </Space>
      </Card>

      <Row gutter={[12, 12]}>
        <Col xs={24} md={8} xl={3}>
          <Card>
            <Statistic title={t('exceptionStatistics.total')} value={summary.total} />
          </Card>
        </Col>
        <Col xs={24} md={8} xl={3}>
          <Card>
            <Statistic title={t('exceptionStatistics.pendingCount')} value={summary.pendingCount} />
          </Card>
        </Col>
        <Col xs={24} md={8} xl={3}>
          <Card>
            <Statistic title={t('exceptionStatistics.processingCount')} value={summary.processingCount} />
          </Card>
        </Col>
        <Col xs={24} md={8} xl={3}>
          <Card>
            <Statistic title={t('exceptionStatistics.closedCount')} value={summary.closedCount} />
          </Card>
        </Col>
        <Col xs={24} md={8} xl={3}>
          <Card>
            <Statistic title={t('exceptionStatistics.closeRate')} value={summary.closeRate} suffix="%" />
          </Card>
        </Col>
        <Col xs={24} md={8} xl={3}>
          <Card>
            <Statistic title={t('exceptionStatistics.avgResponse')} value={summary.avgResponse} suffix={t('exceptionStatistics.minUnit')} />
          </Card>
        </Col>
        <Col xs={24} md={8} xl={3}>
          <Card>
            <Statistic title={t('exceptionStatistics.avgClose')} value={summary.avgClose} suffix={t('exceptionStatistics.minUnit')} />
          </Card>
        </Col>
        <Col xs={24} md={8} xl={3}>
          <Card>
            <Statistic title={t('exceptionStatistics.highLevel')} value={summary.highLevel} />
          </Card>
        </Col>
        <Col xs={24} md={8} xl={3}>
          <Card>
            <Statistic title={t('exceptionStatistics.overdueResponse')} value={summary.overdueResponse} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[12, 12]}>
        <Col xs={24} xl={12}>
          <Card title={t('exceptionStatistics.trendTitle')}>
            <SimpleLineChart categories={trend.categories} series={[{ name: t('exceptionStatistics.total'), color: '#fa541c', values: trend.values }]} yAxisLabel={t('exceptionStatistics.total')} />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title={t('exceptionStatistics.levelDistTitle')}>
            <SimpleBarChart data={levelDistribution} />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title={t('exceptionStatistics.typeTopTitle')}>
            <SimpleBarChart data={typeTop} />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title={t('exceptionStatistics.sourceDistTitle')}>
            <SimpleBarChart data={sourceDistribution} />
          </Card>
        </Col>
        <Col xs={24}>
          <Card title={t('exceptionStatistics.recurrenceTitle')}>
            <SimpleBarChart data={recurrenceTop} />
          </Card>
        </Col>
      </Row>

      <Card title={t('exceptionStatistics.listTitle')}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          pagination={{ pageSize: 8, showSizeChanger: true, pageSizeOptions: ['8', '20', '50'] }}
          scroll={{ x: 2200 }}
        />
      </Card>

      <Drawer title={t('exceptionStatistics.detailTitle')} open={Boolean(detail)} onClose={() => setDetail(null)} width={560}>
        {detail ? (
          <Space direction="vertical" size={10} style={{ width: '100%' }}>
            <Typography.Text>{`${t('exceptionStatistics.detail.id')}: ${detail.id}`}</Typography.Text>
            <Typography.Text>{`${t('exceptionStatistics.detail.level')}: ${detail.level}`}</Typography.Text>
            <Typography.Text>{`${t('exceptionStatistics.detail.type')}: ${detail.type}`}</Typography.Text>
            <Typography.Text>{`${t('exceptionStatistics.detail.source')}: ${detail.source}`}</Typography.Text>
            <Typography.Text>{`${t('exceptionStatistics.detail.location')}: ${detail.workshop} / ${detail.workstation} / ${detail.station}`}</Typography.Text>
            <Typography.Text>{`${t('exceptionStatistics.detail.robot')}: ${detail.robot}`}</Typography.Text>
            <Typography.Text>{`${t('exceptionStatistics.detail.status')}: ${statusLabel(t, detail.status)}`}</Typography.Text>
            <Typography.Text>{`${t('exceptionStatistics.detail.createdAt')}: ${detail.createdAt}`}</Typography.Text>
            <Typography.Text>{`${t('exceptionStatistics.detail.firstResponse')}: ${detail.firstResponseAt}`}</Typography.Text>
            <Typography.Text>{`${t('exceptionStatistics.detail.closedAt')}: ${detail.closedAt}`}</Typography.Text>
            <Typography.Text>{`${t('exceptionStatistics.detail.response')}: ${detail.responseMinutes}${t('exceptionStatistics.minUnit')}`}</Typography.Text>
            <Typography.Text>{`${t('exceptionStatistics.detail.close')}: ${detail.closeMinutes}${t('exceptionStatistics.minUnit')}`}</Typography.Text>
            <Typography.Text>{`${t('exceptionStatistics.detail.owner')}: ${detail.owner}`}</Typography.Text>
            <Typography.Text>{`${t('exceptionStatistics.detail.task')}: ${detail.relatedTask}`}</Typography.Text>
            <Typography.Paragraph>{`${t('exceptionStatistics.detail.description')}: ${detail.description}`}</Typography.Paragraph>
          </Space>
        ) : null}
      </Drawer>
    </Space>
  );
}

type ExceptionStatisticsVm = ExceptionStatisticsWebProps;

function ExceptionStatisticsPad(props: ExceptionStatisticsVm) {
  const {
    period,
    setPeriod,
    level,
    setLevel,
    type,
    setType,
    status,
    setStatus,
    source,
    setSource,
    workshop,
    setWorkshop,
    workstation,
    setWorkstation,
    station,
    setStation,
    robot,
    setRobot,
    keyword,
    setKeyword,
    detail,
    setDetail,
    filtered,
    summary,
    trend,
    levelDistribution,
    typeTop,
    sourceDistribution,
    recurrenceTop,
    columns,
    onRefresh,
    onExport,
    t,
    contextHolder,
  } = props;

  const periodOptions = useMemo(
    () => [
      { label: t('exceptionStatistics.period.today'), value: 'day1' as const },
      { label: t('exceptionStatistics.period.last7'), value: 'day7' as const },
      { label: t('exceptionStatistics.period.lastMonth'), value: 'month1' as const },
    ],
    [t],
  );
  const robotOptions = useMemo(() => Array.from(new Set(exceptionData.map((item) => item.robot))).map((item) => ({ label: item, value: item })), []);

  return (
    <div className="exception-statistics-pad">
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        {contextHolder}
        <Card size="small">
          <div className="filter-block">
            <Typography.Title level={5} style={{ margin: '0 0 4px', fontSize: 16 }}>
              {t('menu.exceptionStatistics')}
            </Typography.Title>
            <Select value={period} onChange={setPeriod} size="small" options={periodOptions} />
            <Select value={level} onChange={setLevel} size="small" options={[{ label: t('exceptionStatistics.selectLevel'), value: 'all' }, ...levelList.map((item) => ({ label: item, value: item }))]} />
            <Select value={type} onChange={setType} size="small" options={[{ label: t('exceptionStatistics.selectType'), value: 'all' }, ...typeList.map((item) => ({ label: item, value: item }))]} />
            <Select
              value={status}
              onChange={setStatus}
              size="small"
              options={[
                { label: t('exceptionStatistics.selectStatus'), value: 'all' },
                { label: t('exceptionStatistics.pending'), value: 'pending' },
                { label: t('exceptionStatistics.processing'), value: 'processing' },
                { label: t('exceptionStatistics.closed'), value: 'closed' },
              ]}
            />
            <Select value={source} onChange={setSource} size="small" options={[{ label: t('exceptionStatistics.selectSource'), value: 'all' }, ...sourceList.map((item) => ({ label: item, value: item }))]} />
            <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} size="small" placeholder={t('exceptionStatistics.keyword')} allowClear />
            <div className="filter-actions">
              <Button size="small" icon={<ReloadOutlined />} onClick={onRefresh}>
                {t('exceptionStatistics.refresh')}
              </Button>
              <Button size="small" icon={<DownloadOutlined />} onClick={onExport}>
                {t('exceptionStatistics.export')}
              </Button>
            </div>
            <Collapse
              ghost
              size="small"
              items={[
                {
                  key: 'filters',
                  label: t('exceptionStatistics.moreFilters'),
                  children: (
                    <Row gutter={[8, 8]} className="more-filters-grid">
                      <Col span={24}>
                        <Select value={workshop} onChange={setWorkshop} size="small" options={[{ label: '请选择车间', value: 'all' }, ...workshopList.map((item) => ({ label: item, value: item }))]} />
                      </Col>
                      <Col span={24}>
                        <Select value={workstation} onChange={setWorkstation} size="small" options={[{ label: '请选择质检区', value: 'all' }, ...workstationList.map((item) => ({ label: item, value: item }))]} />
                      </Col>
                      <Col span={24}>
                        <Select value={station} onChange={setStation} size="small" options={[{ label: '请选择质检台', value: 'all' }, ...stationList.map((item) => ({ label: item, value: item }))]} />
                      </Col>
                      <Col span={24}>
                        <Select value={robot} onChange={setRobot} size="small" options={[{ label: '请选择机器人', value: 'all' }, ...robotOptions]} />
                      </Col>
                    </Row>
                  ),
                },
              ]}
            />
          </div>
        </Card>

        <Row gutter={[8, 8]}>
          <Col span={24}>
            <Card size="small" className="stat-card-mini">
              <Statistic title={t('exceptionStatistics.total')} value={summary.total} />
            </Card>
          </Col>
          <Col span={24}>
            <Card size="small" className="stat-card-mini">
              <Statistic title={t('exceptionStatistics.pendingCount')} value={summary.pendingCount} />
            </Card>
          </Col>
          <Col span={24}>
            <Card size="small" className="stat-card-mini">
              <Statistic title={t('exceptionStatistics.processingCount')} value={summary.processingCount} />
            </Card>
          </Col>
          <Col span={24}>
            <Card size="small" className="stat-card-mini">
              <Statistic title={t('exceptionStatistics.closedCount')} value={summary.closedCount} />
            </Card>
          </Col>
          <Col span={24}>
            <Card size="small" className="stat-card-mini">
              <Statistic title={t('exceptionStatistics.closeRate')} value={summary.closeRate} suffix="%" />
            </Card>
          </Col>
          <Col span={24}>
            <Card size="small" className="stat-card-mini">
              <Statistic title={t('exceptionStatistics.avgResponse')} value={summary.avgResponse} suffix={t('exceptionStatistics.minUnit')} />
            </Card>
          </Col>
          <Col span={24}>
            <Card size="small" className="stat-card-mini">
              <Statistic title={t('exceptionStatistics.avgClose')} value={summary.avgClose} suffix={t('exceptionStatistics.minUnit')} />
            </Card>
          </Col>
          <Col span={24}>
            <Card size="small" className="stat-card-mini">
              <Statistic title={t('exceptionStatistics.highLevel')} value={summary.highLevel} />
            </Card>
          </Col>
          <Col span={24}>
            <Card size="small" className="stat-card-mini">
              <Statistic title={t('exceptionStatistics.overdueResponse')} value={summary.overdueResponse} />
            </Card>
          </Col>
        </Row>

        <Card size="small" title={t('exceptionStatistics.trendTitle')}>
          <SimpleLineChart categories={trend.categories} series={[{ name: t('exceptionStatistics.total'), color: '#fa541c', values: trend.values }]} yAxisLabel={t('exceptionStatistics.total')} />
        </Card>
        <Card size="small" title={t('exceptionStatistics.levelDistTitle')}>
          <SimpleBarChart data={levelDistribution} />
        </Card>
        <Card size="small" title={t('exceptionStatistics.typeTopTitle')}>
          <SimpleBarChart data={typeTop} />
        </Card>
        <Card size="small" title={t('exceptionStatistics.sourceDistTitle')}>
          <SimpleBarChart data={sourceDistribution} />
        </Card>
        <Card size="small" title={t('exceptionStatistics.recurrenceTitle')}>
          <SimpleBarChart data={recurrenceTop} />
        </Card>

        <Card size="small" title={t('exceptionStatistics.listTitle')}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={filtered}
            pagination={{ pageSize: 6, showSizeChanger: false }}
            scroll={{ x: 1800, y: 360 }}
            size="small"
          />
        </Card>

        {detail ? (
          <Drawer title={t('exceptionStatistics.detailTitle')} open onClose={() => setDetail(null)} width={560}>
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              <Typography.Text>{`${t('exceptionStatistics.detail.id')}: ${detail.id}`}</Typography.Text>
              <Typography.Text>{`${t('exceptionStatistics.detail.level')}: ${detail.level}`}</Typography.Text>
              <Typography.Text>{`${t('exceptionStatistics.detail.type')}: ${detail.type}`}</Typography.Text>
              <Typography.Text>{`${t('exceptionStatistics.detail.source')}: ${detail.source}`}</Typography.Text>
              <Typography.Text>{`${t('exceptionStatistics.detail.location')}: ${detail.workshop} / ${detail.workstation} / ${detail.station}`}</Typography.Text>
              <Typography.Text>{`${t('exceptionStatistics.detail.robot')}: ${detail.robot}`}</Typography.Text>
              <Typography.Text>{`${t('exceptionStatistics.detail.status')}: ${statusLabel(t, detail.status)}`}</Typography.Text>
              <Typography.Text>{`${t('exceptionStatistics.detail.createdAt')}: ${detail.createdAt}`}</Typography.Text>
              <Typography.Text>{`${t('exceptionStatistics.detail.firstResponse')}: ${detail.firstResponseAt}`}</Typography.Text>
              <Typography.Text>{`${t('exceptionStatistics.detail.closedAt')}: ${detail.closedAt}`}</Typography.Text>
              <Typography.Text>{`${t('exceptionStatistics.detail.response')}: ${detail.responseMinutes}${t('exceptionStatistics.minUnit')}`}</Typography.Text>
              <Typography.Text>{`${t('exceptionStatistics.detail.close')}: ${detail.closeMinutes}${t('exceptionStatistics.minUnit')}`}</Typography.Text>
              <Typography.Text>{`${t('exceptionStatistics.detail.owner')}: ${detail.owner}`}</Typography.Text>
              <Typography.Text>{`${t('exceptionStatistics.detail.task')}: ${detail.relatedTask}`}</Typography.Text>
              <Typography.Paragraph>{`${t('exceptionStatistics.detail.description')}: ${detail.description}`}</Typography.Paragraph>
            </Space>
          </Drawer>
        ) : null}
      </Space>
    </div>
  );
}

export function ExceptionStatisticsPage() {
  const { t } = useI18n();
  const [messageApi, contextHolder] = message.useMessage();
  const screens = Grid.useBreakpoint();
  const isPad = !screens.lg;

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

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return exceptionData.filter((item) => {
      if (!isInPeriod(item.createdAt, period)) return false;
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
  }, [keyword, level, period, robot, source, station, status, type, workstation, workshop]);

  const summary = useMemo(() => {
    const total = filtered.length;
    const pendingCount = filtered.filter((item) => item.status === 'pending').length;
    const processingCount = filtered.filter((item) => item.status === 'processing').length;
    const closedCount = filtered.filter((item) => item.status === 'closed').length;
    const highLevel = filtered.filter((item) => item.level === 'P1').length;
    const overdueResponse = filtered.filter(
      (item) => item.status !== 'closed' && item.responseMinutes > RESPONSE_OVERDUE_MINUTES,
    ).length;
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
      overdueResponse,
    };
  }, [filtered]);

  const trend = useMemo(() => {
    const days = period === 'day1' ? 1 : period === 'day7' ? 7 : 30;
    const categories = Array.from({ length: days }, (_, index) => {
      const d = new Date(periodEndDate);
      d.setDate(d.getDate() - (days - 1 - index));
      return d.toISOString().slice(0, 10);
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

  const onExport = () => {
    if (filtered.length === 0) {
      messageApi.warning(t('exceptionStatistics.noData'));
      return;
    }
    const headers = ['id', 'level', 'type', 'source', 'workshop', 'workstation', 'station', 'robot', 'status', 'createdAt', 'firstResponseAt', 'closedAt', 'owner', 'relatedTask', 'description', 'responseMinutes', 'closeMinutes'];
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
          item.description,
          item.responseMinutes,
          item.closeMinutes,
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
    messageApi.success(t('exceptionStatistics.exportDone'));
  };

  const onRefresh = () => messageApi.success(t('exceptionStatistics.refreshed'));

  const columns = useMemo(() => buildColumns(t, setDetail), [t, setDetail]);

  const webPadProps: ExceptionStatisticsVm = {
    period,
    setPeriod,
    level,
    setLevel,
    type,
    setType,
    status,
    setStatus,
    source,
    setSource,
    workshop,
    setWorkshop,
    workstation,
    setWorkstation,
    station,
    setStation,
    robot,
    setRobot,
    keyword,
    setKeyword,
    detail,
    setDetail,
    filtered,
    summary,
    trend,
    levelDistribution,
    typeTop,
    sourceDistribution,
    recurrenceTop,
    columns,
    onRefresh,
    onExport,
    t,
    contextHolder,
  };

  if (isPad) {
    return <ExceptionStatisticsPad {...webPadProps} />;
  }
  return <ExceptionStatisticsWeb {...webPadProps} />;
}
