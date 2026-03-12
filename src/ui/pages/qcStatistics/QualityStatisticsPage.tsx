import { DownloadOutlined } from '@ant-design/icons';
import { Button, Card, Col, DatePicker, Row, Select, Space, Statistic, Table, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import { useMemo, useState } from 'react';
import { ALL_VALUE, type AggregatedRow, type MetricKey, useQualityStatistics } from '../../../logic/qcStatistics/useQualityStatistics';
import { useI18n } from '../../../i18n/I18nProvider';
import { SimpleBarChart, SimpleLineChart } from '../../components/charts/SimpleCharts';

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function QualityStatisticsPage() {
  const { locale, t } = useI18n();
  const [messageApi, contextHolder] = message.useMessage();
  const {
    period,
    customRange,
    workshop,
    workstation,
    station,
    wireHarness,
    project,
    metric,
    setPeriod,
    setCustomRange,
    setWireHarness,
    setProject,
    setMetric,
    setGroupBy,
    changeWorkshop,
    changeWorkstation,
    changeStation,
    workshopOptions,
    workstationOptions,
    stationOptions,
    wireHarnessOptions,
    projectOptions,
    groupDimension,
    rows,
    summary,
    chartTopCount,
    chartRows,
    chartIsLine,
    trendPoints,
  } = useQualityStatistics();
  const [trendMetric, setTrendMetric] = useState<MetricKey>('inspectionCount');

  const label = useMemo(() => {
    if (locale === 'en-US') {
      return {
        period3: 'Latest 3 Days',
        period7: 'Latest 7 Days',
        periodMonth: 'Latest 1 Month',
        periodCustom: 'Custom',
        workshop: 'Workshop',
        workstation: 'Inspection Zone',
        station: 'Inspection Bench',
        allWorkshop: 'All Workshops',
        allWorkstation: 'All Zones',
        allStation: 'All Benches',
        inspectionCount: 'Inspection Count',
        detectionRate: 'Detection Rate',
        reinspectionRate: 'Reinspection Rate',
        falseDetectionRate: 'False Detection Rate',
        avgDuration: 'Avg Duration',
        defectCount: 'Defect Count',
        avgDurationUnit: 'min',
        abnormalSummary: 'Defect Type/Count',
        tableTitle: 'Inspection Statistics List',
        chartTitle: 'Metric Chart',
        trendTitle: 'Metric Trend',
        trendChartTitle: 'Trend within Selected Time Range',
        chartTopHint: 'Chart shows top {count} items; full data is in the table',
        wireHarness: 'Wire Harness',
        allWireHarness: 'All Harness Types',
        project: 'Project',
        allProject: 'All Projects',
        groupBy: 'Group By',
        export: 'Export',
        exportDone: 'Exported successfully',
        exportEmpty: 'No data to export',
      };
    }

    return {
      period3: '近3天',
      period7: '近7天',
      periodMonth: '近1个月',
      periodCustom: '自定义',
      workshop: '车间',
      workstation: '质检区',
      station: '质检台',
      allWorkshop: '全部车间',
      allWorkstation: '全部质检区',
      allStation: '全部质检台',
      inspectionCount: '质检数量',
      detectionRate: '检出率',
      reinspectionRate: '复检率',
      falseDetectionRate: '误检率',
      avgDuration: '平均用时',
      avgDurationUnit: '分钟',
      abnormalSummary: '缺陷类型/次数',
      tableTitle: '质检统计列表',
      chartTitle: '指标图表',
      trendTitle: '指标趋势',
      trendChartTitle: '所选时间范围内指标变化趋势',
      chartTopHint: '图表仅展示前 {count} 项，完整数据请查看上方列表',
      wireHarness: '线束类型',
      allWireHarness: '全部线束类型',
      project: '项目',
      allProject: '全部项目',
      groupBy: '分组维度',
      export: '导出',
      exportDone: '导出成功',
      exportEmpty: '暂无可导出数据',
    };
  }, [locale]);

  const groupLabel = useMemo(() => {
    if (groupDimension === 'workshop') {
      return label.workshop;
    }
    if (groupDimension === 'workstation') {
      return label.workstation;
    }
    if (groupDimension === 'project') {
      return label.project;
    }
    return label.station;
  }, [groupDimension, label.station, label.workshop, label.workstation, label.project]);

  const columns = useMemo<ColumnsType<AggregatedRow>>(() => {
    const baseColumns: ColumnsType<AggregatedRow> = [
      { title: groupLabel, dataIndex: 'groupValue', key: 'groupValue', width: 170 },
      {
        title: label.inspectionCount,
        dataIndex: 'inspectionCount',
        key: 'inspectionCount',
        width: 130,
        sorter: (a, b) => a.inspectionCount - b.inspectionCount,
      },
      {
        title: label.detectionRate,
        dataIndex: 'detectionRate',
        key: 'detectionRate',
        width: 120,
        sorter: (a, b) => a.detectionRate - b.detectionRate,
        render: (value: number) => `${value}%`,
      },
      {
        title: label.reinspectionRate,
        dataIndex: 'reinspectionRate',
        key: 'reinspectionRate',
        width: 120,
        sorter: (a, b) => a.reinspectionRate - b.reinspectionRate,
        render: (value: number) => `${value}%`,
      },
      {
        title: label.falseDetectionRate,
        dataIndex: 'falseDetectionRate',
        key: 'falseDetectionRate',
        width: 120,
        sorter: (a, b) => a.falseDetectionRate - b.falseDetectionRate,
        render: (value: number) => `${value}%`,
      },
      {
        title: label.avgDuration,
        dataIndex: 'avgDurationMin',
        key: 'avgDurationMin',
        width: 130,
        sorter: (a, b) => a.avgDurationMin - b.avgDurationMin,
        render: (value: number) => `${value} ${label.avgDurationUnit}`,
      },
      {
        title: label.abnormalSummary,
        dataIndex: 'abnormalSummary',
        key: 'abnormalSummary',
        width: 260,
        sorter: (a, b) => a.abnormalCount - b.abnormalCount,
      },
    ];
    if (wireHarness !== ALL_VALUE) {
      baseColumns.splice(1, 0, {
        title: label.wireHarness,
        dataIndex: 'groupValue',
        key: 'wireHarnessHint',
        width: 160,
        render: () => wireHarness,
      });
    }
    return baseColumns;
  }, [groupLabel, label, wireHarness]);

  const metricLabelMap: Record<MetricKey, string> = {
    inspectionCount: label.inspectionCount,
    detectionRate: label.detectionRate,
    reinspectionRate: label.reinspectionRate,
    falseDetectionRate: label.falseDetectionRate,
    avgDurationMin: label.avgDuration,
    abnormalCount: label.abnormalSummary,
  };

  const customRangeValue: [Dayjs, Dayjs] | null = customRange ? [dayjs(customRange[0], 'YYYY-MM-DD'), dayjs(customRange[1], 'YYYY-MM-DD')] : null;

  const trendSeries = [
    {
      name: metricLabelMap[trendMetric],
      color:
        trendMetric === 'detectionRate'
          ? '#52c41a'
          : trendMetric === 'reinspectionRate'
            ? '#722ed1'
            : trendMetric === 'falseDetectionRate'
              ? '#fa541c'
              : trendMetric === 'avgDurationMin'
                ? '#13c2c2'
                : trendMetric === 'abnormalCount'
                  ? '#fa8c16'
                  : '#1677ff',
      values: trendPoints.map((item) => Number(item[trendMetric])),
    },
  ];

  const exportRows = () => {
    if (rows.length === 0) {
      messageApi.warning(label.exportEmpty);
      return;
    }
    const headers = [
      groupLabel,
      ...(wireHarness !== ALL_VALUE ? [label.wireHarness] : []),
      label.inspectionCount,
      label.detectionRate,
      label.reinspectionRate,
      label.falseDetectionRate,
      label.avgDuration,
      label.abnormalSummary,
    ];
    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        [
          row.groupValue,
          ...(wireHarness !== ALL_VALUE ? [wireHarness] : []),
          String(row.inspectionCount),
          `${row.detectionRate}%`,
          `${row.reinspectionRate}%`,
          `${row.falseDetectionRate}%`,
          `${row.avgDurationMin}`,
          row.abnormalSummary,
        ]
          .map((item) => escapeCsv(item))
          .join(','),
      ),
    ].join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quality-analysis-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    messageApi.success(label.exportDone);
  };

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {contextHolder}
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
                { label: label.period3, value: 'day3' },
                { label: label.period7, value: 'day7' },
                { label: label.periodMonth, value: 'month1' },
                { label: label.periodCustom, value: 'custom' },
              ]}
              style={{ width: 160 }}
            />
            {period === 'custom' ? (
              <DatePicker.RangePicker
                value={customRangeValue}
                onChange={(value) => {
                  if (!value || !value[0] || !value[1]) {
                    setCustomRange(null);
                    return;
                  }
                  setCustomRange([value[0].format('YYYY-MM-DD'), value[1].format('YYYY-MM-DD')]);
                }}
                style={{ width: 280 }}
                placeholder={locale === 'en-US' ? ['Start Date', 'End Date'] : ['开始日期', '结束日期']}
              />
            ) : null}
            <Select
              value={workshop}
              onChange={changeWorkshop}
              options={[
                { label: label.allWorkshop, value: ALL_VALUE },
                ...workshopOptions.map((item) => ({ label: item, value: item })),
              ]}
              style={{ width: 160 }}
            />
            {workshop !== ALL_VALUE ? (
              <Select
                value={workstation}
                onChange={changeWorkstation}
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
                onChange={changeStation}
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
            <Select
              value={project}
              onChange={setProject}
              options={[
                { label: label.allProject, value: ALL_VALUE },
                ...projectOptions.map((item) => ({ label: item, value: item })),
              ]}
              style={{ width: 140 }}
            />
            <Select
              value={groupDimension}
              onChange={setGroupBy}
              options={[
                { label: label.workshop, value: 'workshop' },
                { label: label.workstation, value: 'workstation' },
                { label: label.station, value: 'station' },
                { label: label.project, value: 'project' },
              ]}
              style={{ width: 120 }}
              placeholder={label.groupBy}
            />
            <Button icon={<DownloadOutlined />} onClick={exportRows}>
              {label.export}
            </Button>
          </Space>
        </Space>
      </Card>

      <Row gutter={[12, 12]}>
        <Col xs={24} md={8} xl={4}>
          <Card>
            <Statistic title={label.reinspectionRate} value={summary.reinspectionRate} suffix="%" />
          </Card>
        </Col>
        <Col xs={24} md={8} xl={4}>
          <Card>
            <Statistic title={label.detectionRate} value={summary.detectionRate} suffix="%" />
          </Card>
        </Col>
        <Col xs={24} md={8} xl={4}>
          <Card>
            <Statistic title={label.falseDetectionRate} value={summary.falseDetectionRate} suffix="%" />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={4}>
          <Card>
            <Statistic title={label.inspectionCount} value={summary.inspectionCount} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={4}>
          <Card>
            <Statistic title={label.avgDuration} value={summary.avgDurationMin} suffix={label.avgDurationUnit} />
          </Card>
        </Col>
        <Col xs={24} md={24} xl={4}>
          <Card>
            <Typography.Text type="secondary">{label.abnormalSummary}</Typography.Text>
            <Typography.Paragraph style={{ marginTop: 8, marginBottom: 0 }}>{summary.abnormalSummary || '-'}</Typography.Paragraph>
          </Card>
        </Col>
      </Row>

      <Card title={label.tableTitle}>
        <Table rowKey="key" columns={columns} dataSource={rows} pagination={{ pageSize: 8, showSizeChanger: false }} scroll={{ x: 1200 }} />
      </Card>

      <Card title={label.chartTitle}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Select
            value={metric}
            onChange={setMetric}
            options={[
              { label: label.reinspectionRate, value: 'reinspectionRate' },
              { label: label.detectionRate, value: 'detectionRate' },
              { label: label.falseDetectionRate, value: 'falseDetectionRate' },
              { label: label.inspectionCount, value: 'inspectionCount' },
              { label: label.avgDuration, value: 'avgDurationMin' },
              { label: label.abnormalSummary, value: 'abnormalCount' },
            ]}
            style={{ width: 260 }}
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
                  color: metric === 'falseDetectionRate' ? '#fa541c' : metric === 'reinspectionRate' ? '#722ed1' : '#1677ff',
                  values: chartRows.map((row) => Number(row[metric])),
                },
              ]}
              yAxisLabel={metricLabelMap[metric]}
              valueSuffix="%"
            />
          ) : (
            <SimpleBarChart
              title={metricLabelMap[metric]}
              data={chartRows.map((row) => ({
                name: row.groupValue,
                value: Number(row[metric]),
              }))}
              unit={metric === 'avgDurationMin' ? (locale === 'en-US' ? ' min' : ' 鍒嗛挓') : undefined}
            />
          )}
        </Space>
      </Card>

      <Card title={label.trendTitle}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Select
            value={trendMetric}
            onChange={setTrendMetric}
            options={[
              { label: label.reinspectionRate, value: 'reinspectionRate' },
              { label: label.detectionRate, value: 'detectionRate' },
              { label: label.falseDetectionRate, value: 'falseDetectionRate' },
              { label: label.inspectionCount, value: 'inspectionCount' },
              { label: label.avgDuration, value: 'avgDurationMin' },
              { label: label.abnormalSummary, value: 'abnormalCount' },
            ]}
            style={{ width: 260 }}
          />
          <SimpleLineChart
            title={label.trendChartTitle}
            categories={trendPoints.map((item) => item.date)}
            series={trendSeries}
            yAxisLabel={metricLabelMap[trendMetric]}
            valueSuffix={
              trendMetric === 'avgDurationMin'
                ? locale === 'en-US'
                  ? ' min'
                  : ' 鍒嗛挓'
                : trendMetric === 'inspectionCount' || trendMetric === 'abnormalCount'
                  ? ''
                  : '%'
            }
          />
        </Space>
      </Card>
    </Space>
  );
}


