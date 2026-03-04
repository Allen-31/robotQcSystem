import { Card, Col, Row, Select, Space, Statistic, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { qualityStatsMock, type QualityStatRecord } from '../../../data/qcStatistics/qualityStatsMock';
import { useI18n } from '../../../i18n/I18nProvider';
import { SimpleBarChart, SimpleLineChart } from '../../components/charts/SimpleCharts';

type PeriodKey = 'all' | 'day3' | 'day7';
type MetricKey = 'inspectionCount' | 'defectCount' | 'detectionRate' | 'reinspectionRate' | 'avgDurationMin';

const ALL_VALUE = '__ALL__';

interface AggregatedRow {
  key: string;
  groupValue: string;
  wireHarnesses: string[];
  inspectionCount: number;
  defectCount: number;
  reinspectionCount: number;
  detectionRate: number;
  reinspectionRate: number;
  avgDurationMin: number;
}

function calcRate(numerator: number, denominator: number): number {
  if (denominator === 0) {
    return 0;
  }
  return Number(((numerator / denominator) * 100).toFixed(2));
}

function getLatestDate(records: QualityStatRecord[]): string {
  const sorted = records.map((item) => item.date).sort();
  return sorted.length > 0 ? sorted[sorted.length - 1] : '';
}

function applyPeriod(records: QualityStatRecord[], period: PeriodKey): QualityStatRecord[] {
  if (period === 'all') {
    return records;
  }
  const latest = getLatestDate(records);
  if (!latest) {
    return records;
  }
  const latestDate = new Date(`${latest}T00:00:00`);
  const days = period === 'day3' ? 3 : 7;
  return records.filter((item) => {
    const date = new Date(`${item.date}T00:00:00`);
    const diff = (latestDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff < days;
  });
}

export function QualityStatisticsPage() {
  const { locale, t } = useI18n();
  const [period, setPeriod] = useState<PeriodKey>('day7');
  const [workshop, setWorkshop] = useState<string>(ALL_VALUE);
  const [workstation, setWorkstation] = useState<string>(ALL_VALUE);
  const [station, setStation] = useState<string>(ALL_VALUE);
  const [wireHarness, setWireHarness] = useState<string>(ALL_VALUE);
  const [metric, setMetric] = useState<MetricKey>('inspectionCount');

  const label = useMemo(() => {
    if (locale === 'en-US') {
      return {
        periodAll: 'All',
        period3: 'Latest 3 Days',
        period7: 'Latest 7 Days',
        workshop: 'Workshop',
        workstation: 'Inspection Zone',
        station: 'Inspection Bench',
        allWorkshop: 'All Workshops',
        allWorkstation: 'All Zones',
        allStation: 'All Benches',
        totalInspection: 'Inspections',
        totalDefect: 'Defects',
        detectionRate: 'Detection Rate',
        reinspectionRate: 'Reinspection Rate',
        avgDuration: 'Avg Duration',
        avgDurationUnit: 'min',
        metric: 'Metric',
        tableTitle: 'Inspection Statistics List',
        chartTitle: 'Metric Chart',
        chartTopHint: 'Chart shows top {count} items; full data is in the table',
        wireHarness: 'Wire Harness',
        allWireHarness: 'All Harness Types',
      };
    }
    return {
      periodAll: '全部',
      period3: '近3天',
      period7: '近7天',
      workshop: '车间',
      workstation: '质检区',
      station: '质检台',
      allWorkshop: '全部车间',
      allWorkstation: '全部质检区',
      allStation: '全部质检台',
      totalInspection: '质检总数',
      totalDefect: '检出缺陷',
      detectionRate: '检出率',
      reinspectionRate: '复检率',
      avgDuration: '平均检测时长',
      avgDurationUnit: '分钟',
      metric: '指标切换',
      tableTitle: '质检统计列表',
      chartTitle: '指标图表',
      chartTopHint: '图表仅展示前 {count} 条，完整数据请查看上方列表',
      wireHarness: '线束类型',
      allWireHarness: '全部线束类型',
    };
  }, [locale]);

  const periodFiltered = useMemo(() => applyPeriod(qualityStatsMock, period), [period]);

  const workshopOptions = useMemo(() => Array.from(new Set(periodFiltered.map((item) => item.workshop))), [periodFiltered]);

  const workstationOptions = useMemo(
    () =>
      Array.from(
        new Set(
          periodFiltered
            .filter((item) => workshop === ALL_VALUE || item.workshop === workshop)
            .map((item) => item.workstation),
        ),
      ),
    [periodFiltered, workshop],
  );

  const stationOptions = useMemo(
    () =>
      Array.from(
        new Set(
          periodFiltered
            .filter((item) => (workshop === ALL_VALUE || item.workshop === workshop) && (workstation === ALL_VALUE || item.workstation === workstation))
            .map((item) => item.station),
        ),
      ),
    [periodFiltered, workshop, workstation],
  );
  const wireHarnessOptions = useMemo(
    () =>
      Array.from(
        new Set(
          periodFiltered
            .filter(
              (item) =>
                (workshop === ALL_VALUE || item.workshop === workshop) &&
                (workstation === ALL_VALUE || item.workstation === workstation) &&
                (station === ALL_VALUE || item.station === station),
            )
            .map((item) => item.wireHarness),
        ),
      ),
    [periodFiltered, workshop, workstation, station],
  );

  const drilledRecords = useMemo(
    () =>
      periodFiltered.filter(
        (item) =>
          (workshop === ALL_VALUE || item.workshop === workshop) &&
          (workstation === ALL_VALUE || item.workstation === workstation) &&
          (station === ALL_VALUE || item.station === station) &&
          (wireHarness === ALL_VALUE || item.wireHarness === wireHarness),
      ),
    [periodFiltered, workshop, workstation, station, wireHarness],
  );

  const groupDimension = useMemo<'workshop' | 'workstation' | 'station'>(() => {
    if (workshop === ALL_VALUE) {
      return 'workshop';
    }
    if (workstation === ALL_VALUE) {
      return 'workstation';
    }
    return 'station';
  }, [workshop, workstation]);

  const groupLabel = useMemo(() => {
    if (groupDimension === 'workshop') {
      return label.workshop;
    }
    if (groupDimension === 'workstation') {
      return label.workstation;
    }
    return label.station;
  }, [groupDimension, label.station, label.workshop, label.workstation]);

  const rows = useMemo<AggregatedRow[]>(() => {
    const grouped = new Map<string, QualityStatRecord[]>();
    drilledRecords.forEach((item) => {
      const key = item[groupDimension];
      grouped.set(key, [...(grouped.get(key) ?? []), item]);
    });
    return Array.from(grouped.entries())
      .map(([stationKey, items]) => {
        const inspectionCount = items.reduce((sum, row) => sum + row.inspectionCount, 0);
        const defectCount = items.reduce((sum, row) => sum + row.defectCount, 0);
        const reinspectionCount = items.reduce((sum, row) => sum + row.reinspectionCount, 0);
        const avgDurationMin =
          inspectionCount === 0
            ? 0
            : Number((items.reduce((sum, row) => sum + row.avgDurationMin * row.inspectionCount, 0) / inspectionCount).toFixed(2));
        return {
          key: stationKey,
          groupValue: stationKey,
          wireHarnesses: Array.from(new Set(items.map((row) => row.wireHarness))),
          inspectionCount,
          defectCount,
          reinspectionCount,
          detectionRate: calcRate(defectCount, inspectionCount),
          reinspectionRate: calcRate(reinspectionCount, inspectionCount),
          avgDurationMin,
        };
      })
      .sort((a, b) => b.inspectionCount - a.inspectionCount);
  }, [drilledRecords, groupDimension]);

  const summary = useMemo(() => {
    const inspectionCount = rows.reduce((sum, row) => sum + row.inspectionCount, 0);
    const defectCount = rows.reduce((sum, row) => sum + row.defectCount, 0);
    const reinspectionCount = rows.reduce((sum, row) => sum + row.reinspectionCount, 0);
    const avgDurationMin =
      inspectionCount === 0 ? 0 : Number((rows.reduce((sum, row) => sum + row.avgDurationMin * row.inspectionCount, 0) / inspectionCount).toFixed(2));
    return {
      inspectionCount,
      defectCount,
      detectionRate: calcRate(defectCount, inspectionCount),
      reinspectionRate: calcRate(reinspectionCount, inspectionCount),
      avgDurationMin,
    };
  }, [rows]);

  const columns: ColumnsType<AggregatedRow> = [
    { title: groupLabel, dataIndex: 'groupValue', key: 'groupValue', width: 180 },
    { title: label.wireHarness, dataIndex: 'wireHarnesses', key: 'wireHarnesses', width: 220, render: (value: string[]) => value.join(' / ') },
    { title: label.totalInspection, dataIndex: 'inspectionCount', key: 'inspectionCount', width: 130 },
    { title: label.totalDefect, dataIndex: 'defectCount', key: 'defectCount', width: 120 },
    { title: label.detectionRate, dataIndex: 'detectionRate', key: 'detectionRate', width: 120, render: (value: number) => `${value}%` },
    { title: label.reinspectionRate, dataIndex: 'reinspectionRate', key: 'reinspectionRate', width: 120, render: (value: number) => `${value}%` },
    { title: label.avgDuration, dataIndex: 'avgDurationMin', key: 'avgDurationMin', width: 170, render: (value: number) => `${value} ${label.avgDurationUnit}` },
  ];

  const metricLabelMap: Record<MetricKey, string> = {
    inspectionCount: label.totalInspection,
    defectCount: label.totalDefect,
    detectionRate: label.detectionRate,
    reinspectionRate: label.reinspectionRate,
    avgDurationMin: label.avgDuration,
  };

  const metricValues = rows.map((row) => row[metric]);
  const chartIsLine = metric === 'detectionRate' || metric === 'reinspectionRate';
  const chartTopCount = 12;
  const chartRows = rows.slice(0, chartTopCount);

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {t('menu.qualityStatistics')}
          </Typography.Title>
          <Space wrap>
            <Select
              value={period}
              onChange={setPeriod}
              options={[
                { label: label.periodAll, value: 'all' },
                { label: label.period3, value: 'day3' },
                { label: label.period7, value: 'day7' },
              ]}
              style={{ width: 140 }}
            />
            <Select
              value={workshop}
              onChange={(value) => {
                setWorkshop(value);
                setWorkstation(ALL_VALUE);
                setStation(ALL_VALUE);
              }}
              options={[
                { label: label.allWorkshop, value: ALL_VALUE },
                ...workshopOptions.map((item) => ({ label: item, value: item })),
              ]}
              style={{ width: 160 }}
            />
            {workshop !== ALL_VALUE ? (
              <Select
                value={workstation}
                onChange={(value) => {
                  setWorkstation(value);
                  setStation(ALL_VALUE);
                }}
                options={[
                  { label: label.allWorkstation, value: ALL_VALUE },
                  ...workstationOptions.map((item) => ({ label: item, value: item })),
                ]}
                style={{ width: 160 }}
              />
            ) : null}
            {workshop !== ALL_VALUE && workstation !== ALL_VALUE ? (
              <Select
                value={station}
                onChange={setStation}
                options={[
                  { label: label.allStation, value: ALL_VALUE },
                  ...stationOptions.map((item) => ({ label: item, value: item })),
                ]}
                style={{ width: 160 }}
              />
            ) : null}
            <Select
              value={wireHarness}
              onChange={setWireHarness}
              options={[
                { label: label.allWireHarness, value: ALL_VALUE },
                ...wireHarnessOptions.map((item) => ({ label: item, value: item })),
              ]}
              style={{ width: 180 }}
            />
          </Space>
        </Space>
      </Card>

      <Row gutter={[12, 12]}>
        <Col xs={24} md={8} xl={4}>
          <Card>
            <Statistic title={label.totalInspection} value={summary.inspectionCount} />
          </Card>
        </Col>
        <Col xs={24} md={8} xl={4}>
          <Card>
            <Statistic title={label.totalDefect} value={summary.defectCount} />
          </Card>
        </Col>
        <Col xs={24} md={8} xl={5}>
          <Card>
            <Statistic title={label.detectionRate} value={summary.detectionRate} suffix="%" />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={5}>
          <Card>
            <Statistic title={label.reinspectionRate} value={summary.reinspectionRate} suffix="%" />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card>
            <Statistic title={label.avgDuration} value={summary.avgDurationMin} suffix={label.avgDurationUnit} />
          </Card>
        </Col>
      </Row>

      <Card title={label.tableTitle}>
        <Table rowKey="key" columns={columns} dataSource={rows} pagination={{ pageSize: 8, showSizeChanger: false }} scroll={{ x: 980 }} />
      </Card>

      <Card title={label.chartTitle}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Select
            value={metric}
            onChange={setMetric}
            options={[
              { label: label.totalInspection, value: 'inspectionCount' },
              { label: label.totalDefect, value: 'defectCount' },
              { label: label.detectionRate, value: 'detectionRate' },
              { label: label.reinspectionRate, value: 'reinspectionRate' },
              { label: label.avgDuration, value: 'avgDurationMin' },
            ]}
            style={{ width: 240 }}
          />
          {rows.length > chartTopCount ? (
            <Typography.Text type="secondary">{label.chartTopHint.replace('{count}', String(chartTopCount))}</Typography.Text>
          ) : null}
          {chartIsLine ? (
            <SimpleLineChart
              title={metricLabelMap[metric]}
              categories={chartRows.map((row) => row.groupValue)}
              series={[
                {
                  name: metricLabelMap[metric],
                  color: metric === 'detectionRate' ? '#1677ff' : '#fa8c16',
                  values: chartRows.map((row) => Number(row[metric])),
                },
              ]}
            />
          ) : (
            <SimpleBarChart
              title={metricLabelMap[metric]}
              data={chartRows.map((row) => ({
                name: row.groupValue,
                value: Number(row[metric]),
              }))}
              unit={metric === 'avgDurationMin' ? (locale === 'en-US' ? ' min' : ' 分钟') : undefined}
            />
          )}
        </Space>
      </Card>
    </Space>
  );
}
