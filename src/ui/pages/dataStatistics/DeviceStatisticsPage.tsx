import { DownloadOutlined, ReloadOutlined, RightOutlined } from '@ant-design/icons';
import { Button, Card, Col, Collapse, Descriptions, Drawer, Grid, Input, Row, Select, Space, Statistic, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatLastUpdated, getMockRecentExceptions, getMockRecentTasks } from '../../../data/dataStatistics/deviceStatisticsData';
import type { DeviceRecord, ExceptionLevel } from '../../../data/dataStatistics/deviceStatisticsData';
import { useI18n } from '../../../i18n/I18nProvider';
import { useDeviceStatistics } from '../../../logic/dataStatistics/useDeviceStatistics';
import { escapeCsv } from '../../../utils/csv';
import { SimpleBarChart, SimpleLineChart, SimplePieChart } from '../../components/charts/SimpleCharts';
import './DeviceStatisticsPage.css';

const levelTagMap: Record<ExceptionLevel, { color: string }> = {
  none: { color: 'default' },
  low: { color: 'gold' },
  medium: { color: 'orange' },
  high: { color: 'red' },
};

function buildColumns(
  t: (key: string) => string,
  setDetail: (r: DeviceRecord | null) => void,
): ColumnsType<DeviceRecord> {
  return [
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
}

function DetailDrawer({
  detail,
  onClose,
  t,
  navigate,
}: {
  detail: DeviceRecord;
  onClose: () => void;
  t: (key: string) => string;
  navigate: (path: string) => void;
}) {
  return (
    <Drawer title={t('deviceStatistics.detailTitle')} open onClose={onClose} width={520}>
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
          {getMockRecentExceptions(detail.id).map((ex) => (
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
    </Drawer>
  );
}

interface DeviceStatisticsWebProps {
  vm: ReturnType<typeof useDeviceStatistics>;
  t: (key: string) => string;
  contextHolder: React.ReactNode;
  onRefresh: () => void;
  onExport: () => void;
  columns: ColumnsType<DeviceRecord>;
  levelDistributionForChart: { name: string; value: number }[];
  navigate: (path: string) => void;
}

function DeviceStatisticsWeb({ vm, t, contextHolder, onRefresh, onExport, columns, levelDistributionForChart, navigate }: DeviceStatisticsWebProps) {
  const periodOptions = useMemo(
    () => [
      { label: t('deviceStatistics.period.today'), value: 'day1' as const },
      { label: t('deviceStatistics.period.last7'), value: 'day7' as const },
      { label: t('deviceStatistics.period.lastMonth'), value: 'month1' as const },
    ],
    [t],
  );

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {contextHolder}
      <Card>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {t('menu.deviceStatistics')}
          </Typography.Title>
          <Space wrap align="center">
            <Select value={vm.period} onChange={vm.setPeriod} style={{ width: 130 }} options={periodOptions} />
            <Input
              value={vm.keyword}
              onChange={(e) => vm.setKeyword(e.target.value)}
              style={{ width: 220 }}
              placeholder={t('deviceStatistics.keyword')}
              allowClear
            />
            <Button icon={<ReloadOutlined />} onClick={onRefresh}>
              {t('deviceStatistics.refresh')}
            </Button>
            <Button icon={<DownloadOutlined />} onClick={onExport}>
              {t('deviceStatistics.export')}
            </Button>
            <Typography.Text type="secondary" style={{ marginLeft: 8 }}>
              {t('deviceStatistics.lastUpdated')}: {formatLastUpdated(vm.lastUpdated)}
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
                      value={vm.workshop}
                      onChange={vm.setWorkshop}
                      style={{ width: 150 }}
                      options={[{ label: t('deviceStatistics.allWorkshop'), value: 'all' }, ...vm.workshops.map((item) => ({ label: item, value: item }))]}
                    />
                    <Select
                      value={vm.workstation}
                      onChange={vm.setWorkstation}
                      style={{ width: 130 }}
                      options={[{ label: t('deviceStatistics.allWorkstation'), value: 'all' }, ...vm.workstations.map((item) => ({ label: item, value: item }))]}
                    />
                    <Select
                      value={vm.station}
                      onChange={vm.setStation}
                      style={{ width: 120 }}
                      options={[{ label: t('deviceStatistics.allStation'), value: 'all' }, ...vm.stations.map((item) => ({ label: item, value: item }))]}
                    />
                    <Select
                      value={vm.robotType}
                      onChange={vm.setRobotType}
                      style={{ width: 130 }}
                      options={[{ label: t('deviceStatistics.allRobotType'), value: 'all' }, ...vm.robotTypes.map((item) => ({ label: item, value: item }))]}
                    />
                    <Select
                      value={vm.robotGroup}
                      onChange={vm.setRobotGroup}
                      style={{ width: 130 }}
                      options={[{ label: t('deviceStatistics.allRobotGroup'), value: 'all' }, ...vm.robotGroups.map((item) => ({ label: item, value: item }))]}
                    />
                    <Select
                      value={vm.onlineStatus}
                      onChange={vm.setOnlineStatus}
                      style={{ width: 120 }}
                      options={[
                        { label: t('deviceStatistics.allOnlineStatus'), value: 'all' },
                        { label: t('deviceStatistics.onlineOnly'), value: 'online' },
                        { label: t('deviceStatistics.offlineOnly'), value: 'offline' },
                      ]}
                    />
                    <Select
                      value={vm.exceptionStatus}
                      onChange={vm.setExceptionStatus}
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
          {vm.period !== 'day1' && (
            <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
              {t('deviceStatistics.summaryNote')}
            </Typography.Text>
          )}
        </Space>
      </Card>

      <Row gutter={[12, 12]}>
        <Col xs={24} sm={12} md={8} xl={4}>
          <Card>
            <Statistic title={t('deviceStatistics.total')} value={vm.summary.total} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} xl={4}>
          <Card>
            <Statistic title={t('deviceStatistics.onlineCount')} value={vm.summary.onlineCount} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} xl={4}>
          <Card>
            <Statistic title={t('deviceStatistics.onlineRate')} value={vm.summary.onlineRate} suffix="%" />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} xl={4}>
          <Card>
            <Statistic title={t('deviceStatistics.exceptionDeviceCount')} value={vm.summary.exceptionDeviceCount} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} xl={4}>
          <Card>
            <Statistic title={t('deviceStatistics.avgBattery')} value={vm.summary.avgBattery} suffix="%" />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} xl={4}>
          <Card>
            <Statistic title={t('deviceStatistics.runtime')} value={vm.summary.runtime} suffix={t('deviceStatistics.hour')} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} xl={4}>
          <Card>
            <Statistic title={t('deviceStatistics.tasks')} value={vm.summary.tasks} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} xl={4}>
          <Card>
            <Statistic title={t('deviceStatistics.taskCompleteRate')} value={vm.summary.taskCompleteRate} suffix="%" />
          </Card>
        </Col>
      </Row>

      <Row gutter={[12, 12]}>
        <Col xs={24} xl={12}>
          <Card title={t('deviceStatistics.trendTitle')}>
            <SimpleLineChart
              categories={vm.onlineTrend.categories}
              series={[{ name: t('deviceStatistics.onlineCount'), color: '#1677ff', values: vm.onlineTrend.values }]}
              yAxisLabel={t('deviceStatistics.onlineCount')}
            />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title={t('deviceStatistics.typeDistTitle')}>
            <SimplePieChart data={vm.typeDistribution} />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title={t('deviceStatistics.levelDistTitle')}>
            <SimplePieChart data={levelDistributionForChart} />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title={t('deviceStatistics.batteryDistTitle')}>
            <SimpleBarChart data={vm.batteryDistribution} />
          </Card>
        </Col>
      </Row>

      <Card title={t('deviceStatistics.listTitle')}>
        <Table rowKey="id" columns={columns} dataSource={vm.filtered} pagination={{ pageSize: 8, showSizeChanger: false }} scroll={{ x: 1900 }} />
      </Card>

      {vm.detail ? <DetailDrawer detail={vm.detail} onClose={() => vm.setDetail(null)} t={t} navigate={navigate} /> : null}
    </Space>
  );
}

interface DeviceStatisticsPadProps {
  vm: ReturnType<typeof useDeviceStatistics>;
  t: (key: string) => string;
  contextHolder: React.ReactNode;
  onRefresh: () => void;
  onExport: () => void;
  columns: ColumnsType<DeviceRecord>;
  levelDistributionForChart: { name: string; value: number }[];
  navigate: (path: string) => void;
}

function DeviceStatisticsPad({ vm, t, contextHolder, onRefresh, onExport, columns, levelDistributionForChart, navigate }: DeviceStatisticsPadProps) {
  const periodOptions = useMemo(
    () => [
      { label: t('deviceStatistics.period.today'), value: 'day1' as const },
      { label: t('deviceStatistics.period.last7'), value: 'day7' as const },
      { label: t('deviceStatistics.period.lastMonth'), value: 'month1' as const },
    ],
    [t],
  );

  return (
    <div className="device-statistics-pad">
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        {contextHolder}
        <Card size="small">
          <div className="filter-block">
            <Typography.Title level={5} style={{ margin: '0 0 4px', fontSize: 16 }}>
              {t('menu.deviceStatistics')}
            </Typography.Title>
            <Select value={vm.period} onChange={vm.setPeriod} size="small" options={periodOptions} />
            <Input
              value={vm.keyword}
              onChange={(e) => vm.setKeyword(e.target.value)}
              size="small"
              placeholder={t('deviceStatistics.keyword')}
              allowClear
            />
            <div className="filter-actions">
              <Button size="small" icon={<ReloadOutlined />} onClick={onRefresh}>
                {t('deviceStatistics.refresh')}
              </Button>
              <Button size="small" icon={<DownloadOutlined />} onClick={onExport}>
                {t('deviceStatistics.export')}
              </Button>
            </div>
            <Collapse
              ghost
              size="small"
              items={[
                {
                  key: 'filters',
                  label: t('deviceStatistics.moreFilters'),
                  children: (
                    <Row gutter={[8, 8]} className="more-filters-grid">
                      <Col span={24}>
                        <Select
                          value={vm.workshop}
                          onChange={vm.setWorkshop}
                          size="small"
                          options={[{ label: t('deviceStatistics.allWorkshop'), value: 'all' }, ...vm.workshops.map((item) => ({ label: item, value: item }))]}
                        />
                      </Col>
                      <Col span={24}>
                        <Select
                          value={vm.workstation}
                          onChange={vm.setWorkstation}
                          size="small"
                          options={[{ label: t('deviceStatistics.allWorkstation'), value: 'all' }, ...vm.workstations.map((item) => ({ label: item, value: item }))]}
                        />
                      </Col>
                      <Col span={24}>
                        <Select
                          value={vm.station}
                          onChange={vm.setStation}
                          size="small"
                          options={[{ label: t('deviceStatistics.allStation'), value: 'all' }, ...vm.stations.map((item) => ({ label: item, value: item }))]}
                        />
                      </Col>
                      <Col span={24}>
                        <Select
                          value={vm.robotType}
                          onChange={vm.setRobotType}
                          size="small"
                          options={[{ label: t('deviceStatistics.allRobotType'), value: 'all' }, ...vm.robotTypes.map((item) => ({ label: item, value: item }))]}
                        />
                      </Col>
                      <Col span={24}>
                        <Select
                          value={vm.robotGroup}
                          onChange={vm.setRobotGroup}
                          size="small"
                          options={[{ label: t('deviceStatistics.allRobotGroup'), value: 'all' }, ...vm.robotGroups.map((item) => ({ label: item, value: item }))]}
                        />
                      </Col>
                      <Col span={24}>
                        <Select
                          value={vm.onlineStatus}
                          onChange={vm.setOnlineStatus}
                          size="small"
                          options={[
                            { label: t('deviceStatistics.allOnlineStatus'), value: 'all' },
                            { label: t('deviceStatistics.onlineOnly'), value: 'online' },
                            { label: t('deviceStatistics.offlineOnly'), value: 'offline' },
                          ]}
                        />
                      </Col>
                      <Col span={24}>
                        <Select
                          value={vm.exceptionStatus}
                          onChange={vm.setExceptionStatus}
                          size="small"
                          options={[
                            { label: t('deviceStatistics.allExceptionStatus'), value: 'all' },
                            { label: t('deviceStatistics.exceptionOnly'), value: 'exception' },
                            { label: t('deviceStatistics.normalOnly'), value: 'normal' },
                          ]}
                        />
                      </Col>
                    </Row>
                  ),
                },
              ]}
            />
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              {t('deviceStatistics.lastUpdated')}: {formatLastUpdated(vm.lastUpdated)}
            </Typography.Text>
          </div>
        </Card>

        <Row gutter={[8, 8]}>
          <Col span={24}>
            <Card size="small" className="stat-card-mini">
              <Statistic title={t('deviceStatistics.total')} value={vm.summary.total} />
            </Card>
          </Col>
          <Col span={24}>
            <Card size="small" className="stat-card-mini">
              <Statistic title={t('deviceStatistics.onlineCount')} value={vm.summary.onlineCount} />
            </Card>
          </Col>
          <Col span={24}>
            <Card size="small" className="stat-card-mini">
              <Statistic title={t('deviceStatistics.onlineRate')} value={vm.summary.onlineRate} suffix="%" />
            </Card>
          </Col>
          <Col span={24}>
            <Card size="small" className="stat-card-mini">
              <Statistic title={t('deviceStatistics.exceptionDeviceCount')} value={vm.summary.exceptionDeviceCount} />
            </Card>
          </Col>
          <Col span={24}>
            <Card size="small" className="stat-card-mini">
              <Statistic title={t('deviceStatistics.avgBattery')} value={vm.summary.avgBattery} suffix="%" />
            </Card>
          </Col>
          <Col span={24}>
            <Card size="small" className="stat-card-mini">
              <Statistic title={t('deviceStatistics.runtime')} value={vm.summary.runtime} suffix={t('deviceStatistics.hour')} />
            </Card>
          </Col>
          <Col span={24}>
            <Card size="small" className="stat-card-mini">
              <Statistic title={t('deviceStatistics.tasks')} value={vm.summary.tasks} />
            </Card>
          </Col>
          <Col span={24}>
            <Card size="small" className="stat-card-mini">
              <Statistic title={t('deviceStatistics.taskCompleteRate')} value={vm.summary.taskCompleteRate} suffix="%" />
            </Card>
          </Col>
        </Row>

      <Card size="small" title={t('deviceStatistics.trendTitle')}>
        <SimpleLineChart
          categories={vm.onlineTrend.categories}
          series={[{ name: t('deviceStatistics.onlineCount'), color: '#1677ff', values: vm.onlineTrend.values }]}
          yAxisLabel={t('deviceStatistics.onlineCount')}
        />
      </Card>
      <Card size="small" title={t('deviceStatistics.typeDistTitle')}>
        <SimplePieChart data={vm.typeDistribution} />
      </Card>
      <Card size="small" title={t('deviceStatistics.levelDistTitle')}>
        <SimplePieChart data={levelDistributionForChart} />
      </Card>
      <Card size="small" title={t('deviceStatistics.batteryDistTitle')}>
        <SimpleBarChart data={vm.batteryDistribution} />
      </Card>

      <Card size="small" title={t('deviceStatistics.listTitle')}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={vm.filtered}
          pagination={{ pageSize: 6, showSizeChanger: false }}
          scroll={{ x: 1600, y: 360 }}
          size="small"
        />
      </Card>

      {vm.detail ? <DetailDrawer detail={vm.detail} onClose={() => vm.setDetail(null)} t={t} navigate={navigate} /> : null}
      </Space>
    </div>
  );
}

export function DeviceStatisticsPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const screens = Grid.useBreakpoint();
  const isPad = !screens.lg;

  const vm = useDeviceStatistics();

  const columns = useMemo(() => buildColumns(t, vm.setDetail), [t, vm.setDetail]);
  const levelDistributionForChart = useMemo(
    () => vm.levelDistribution.map((d) => ({ name: t(`deviceStatistics.level.${d.name}`), value: d.value })),
    [vm.levelDistribution, t],
  );

  const onRefresh = () => {
    vm.setLastUpdated(new Date());
    messageApi.success(t('deviceStatistics.refreshed'));
  };

  const onExport = () => {
    if (vm.filtered.length === 0) {
      messageApi.warning(t('deviceStatistics.noData'));
      return;
    }
    const headers = [
      'id',
      'type',
      'group',
      'workshop',
      'workstation',
      'station',
      'online',
      'battery',
      'runtimeHourToday',
      'tasksToday',
      'currentTask',
      'lastHeartbeat',
      'exceptionLevel',
      'exceptionCount',
    ];
    const csv = [
      headers.join(','),
      ...vm.filtered.map((item) =>
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

  if (isPad) {
    return (
      <DeviceStatisticsPad
        vm={vm}
        t={t}
        contextHolder={contextHolder}
        onRefresh={onRefresh}
        onExport={onExport}
        columns={columns}
        levelDistributionForChart={levelDistributionForChart}
        navigate={navigate}
      />
    );
  }

  return (
    <DeviceStatisticsWeb
      vm={vm}
      t={t}
      contextHolder={contextHolder}
      onRefresh={onRefresh}
      onExport={onExport}
      columns={columns}
      levelDistributionForChart={levelDistributionForChart}
      navigate={navigate}
    />
  );
}
