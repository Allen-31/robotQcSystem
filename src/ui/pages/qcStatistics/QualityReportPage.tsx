import { DownloadOutlined, FileAddOutlined } from '@ant-design/icons';
import { Button, Card, Col, Row, Select, Space, Statistic, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { qualityStatsMock, type QualityStatRecord } from '../../../data/qcStatistics/qualityStatsMock';
import { useI18n } from '../../../i18n/I18nProvider';
import { getCurrentUser } from '../../../logic/auth/authStore';
import { SimpleBarChart } from '../../components/charts/SimpleCharts';

type ReportType = 'daily' | 'weekly' | 'monthly' | 'custom';
type ReportDimension = 'workshop' | 'workstation' | 'station' | 'wireHarness' | 'workOrder' | 'inspector';
type ReportMetric = 'inspectionCount' | 'detectionRate' | 'reinspectionRate' | 'falseDetectionRate' | 'avgDurationMin' | 'abnormalCount';

interface ReportRecord {
  id: string;
  reportNo: string;
  reportType: ReportType;
  periodLabel: string;
  dimension: ReportDimension;
  creator: string;
  createdAt: string;
  status: 'generated';
}

interface AggregatedRow {
  key: string;
  dimensionValue: string;
  inspectionCount: number;
  defectCount: number;
  detectionRate: number;
  reinspectionRate: number;
  falseDetectionRate: number;
  avgDurationMin: number;
  abnormalCount: number;
  abnormalTypeCounts: Record<string, number>;
  topDefectType: string;
  abnormalSummary: string;
}

function nowText(): string {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function calcRate(numerator: number, denominator: number): number {
  if (denominator === 0) {
    return 0;
  }
  return Number(((numerator / denominator) * 100).toFixed(2));
}

function filterByReportType(records: QualityStatRecord[], reportType: ReportType): QualityStatRecord[] {
  if (reportType === 'custom') {
    return records;
  }
  const sortedDates = Array.from(new Set(records.map((item) => item.date))).sort();
  const latestDate = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : undefined;
  if (!latestDate) {
    return records;
  }
  const latest = new Date(`${latestDate}T00:00:00`);
  const days = reportType === 'daily' ? 1 : reportType === 'weekly' ? 7 : 30;
  return records.filter((item) => {
    const date = new Date(`${item.date}T00:00:00`);
    const diff = (latest.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff < days;
  });
}

const ABNORMAL_TYPES = ['接线错误', '外观异常', '工艺偏差'] as const;

function buildAbnormalTypeCounts(defectCount: number): Record<string, number> {
  const first = Math.round(defectCount * 0.45);
  const second = Math.round(defectCount * 0.35);
  const third = Math.max(defectCount - first - second, 0);
  return {
    [ABNORMAL_TYPES[0]]: first,
    [ABNORMAL_TYPES[1]]: second,
    [ABNORMAL_TYPES[2]]: third,
  };
}

function mergeTypeCounts(target: Record<string, number>, source: Record<string, number>): Record<string, number> {
  const merged = { ...target };
  Object.entries(source).forEach(([type, count]) => {
    merged[type] = (merged[type] ?? 0) + count;
  });
  return merged;
}

function formatTypeSummary(typeCounts: Record<string, number>, locale: string): string {
  return Object.entries(typeCounts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => `${type}:${count}`)
    .join(locale === 'en-US' ? ', ' : '、');
}

function getDimensionValue(record: QualityStatRecord, dimension: ReportDimension): string {
  if (dimension === 'workOrder') {
    return `WO-${record.date.replace(/-/g, '')}-${record.station}`;
  }
  return record[dimension];
}

function downloadPdf(
  rows: AggregatedRow[],
  fileName: string,
  options?: {
    title?: string;
    reportRecord?: ReportRecord;
  },
): void {
  const title = options?.title ?? 'Quality Report';
  const meta = options?.reportRecord
    ? [
        `Report No,${options.reportRecord.reportNo}`,
        `Type,${options.reportRecord.reportType}`,
        `Period,${options.reportRecord.periodLabel}`,
        `Dimension,${options.reportRecord.dimension}`,
        `Creator,${options.reportRecord.creator}`,
        `Created At,${options.reportRecord.createdAt}`,
        '',
      ]
    : [];
  const header = 'Dimension,Inspections,Detection Rate,Reinspection Rate,False Detection Rate,Avg Duration(min),Abnormal Summary';
  const body = rows.map(
    (row) =>
      `${row.dimensionValue},${row.inspectionCount},${row.detectionRate}%,${row.reinspectionRate}%,${row.falseDetectionRate}%,${row.avgDurationMin},${row.abnormalSummary}`,
  );
  const csv = [title, ...meta, header, ...body].join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function QualityReportPage() {
  const { locale, t } = useI18n();
  const [messageApi, contextHolder] = message.useMessage();
  const [reportType, setReportType] = useState<ReportType>('weekly');
  const [dimension, setDimension] = useState<ReportDimension>('workshop');
  const [reportMetric, setReportMetric] = useState<ReportMetric>('inspectionCount');
  const [reportHistory, setReportHistory] = useState<ReportRecord[]>([
    {
      id: 'RPT-001',
      reportNo: 'QCR-20260304-001',
      reportType: 'daily',
      periodLabel: '2026-03-04',
      dimension: 'workshop',
      creator: 'admin',
      createdAt: '2026-03-04 09:30:15',
      status: 'generated',
    },
  ]);

  const label = useMemo(() => {
    if (locale === 'en-US') {
      return {
        reportType: 'Report Type',
        reportDimension: 'Dimension',
        daily: 'Daily',
        weekly: 'Weekly',
        monthly: 'Monthly',
        custom: 'Custom',
        workshop: 'Workshop',
        workstation: 'Inspection Zone',
        station: 'Inspection Bench',
        wireHarness: 'Wire Harness',
        workOrder: 'Work Order',
        inspector: 'Inspector',
        inspectionCount: 'Inspection Count',
        detectionRate: 'Detection Rate',
        reinspectionRate: 'Reinspection Rate',
        falseDetectionRate: 'False Detection Rate',
        avgDuration: 'Avg Duration',
        avgDurationUnit: 'min',
        abnormalSummary: 'Abnormal Type/Count',
        detailTitle: 'Report Detail',
        abnormalTitle: 'Abnormal Detail',
        historyTitle: 'Report History',
        createReport: 'Generate Report',
        exportReport: 'Export PDF',
        detailChartTitle: 'Report Overview by Dimension',
        actionDownload: 'Download PDF',
        reportDownloaded: 'Report downloaded',
        reportExported: 'Report detail exported',
        reportGenerated: 'Report generated',
      };
    }

    return {
      reportType: '报表类型',
      reportDimension: '统计维度',
      daily: '日报',
      weekly: '周报',
      monthly: '月报',
      custom: '自定义',
      workshop: '车间',
      workstation: '质检区',
      station: '质检台',
      wireHarness: '线束',
      workOrder: '工单',
      inspector: '质检员',
      inspectionCount: '质检数量',
      detectionRate: '检出率',
      reinspectionRate: '复检率',
      falseDetectionRate: '误检率',
      avgDuration: '平均用时',
      avgDurationUnit: '分钟',
      abnormalSummary: '缺陷类型/次数',
      detailTitle: '报表明细',
      abnormalTitle: '缺陷分析',
      historyTitle: '报表记录',
      createReport: '生成报表',
      exportReport: '导出 PDF',
      detailChartTitle: '报表维度总览',
      actionDownload: '下载 PDF',
      reportDownloaded: '报表下载成功',
      reportExported: '报表明细导出成功',
      reportGenerated: '报表生成成功',
    };
  }, [locale]);

  const dimensionTextMap: Record<ReportDimension, string> = {
    workshop: label.workshop,
    workstation: label.workstation,
    station: label.station,
    wireHarness: label.wireHarness,
    workOrder: label.workOrder,
    inspector: label.inspector,
  };

  const filtered = useMemo(() => filterByReportType(qualityStatsMock, reportType), [reportType]);

  const aggregatedRows = useMemo<AggregatedRow[]>(() => {
    const grouped = new Map<string, QualityStatRecord[]>();
    filtered.forEach((item) => {
      const key = getDimensionValue(item, dimension);
      grouped.set(key, [...(grouped.get(key) ?? []), item]);
    });
    return Array.from(grouped.entries())
      .map(([key, rows]) => {
        const inspectionCount = rows.reduce((sum, row) => sum + row.inspectionCount, 0);
        const defectCount = rows.reduce((sum, row) => sum + row.defectCount, 0);
        const reinspectionCount = rows.reduce((sum, row) => sum + row.reinspectionCount, 0);
        const falseDetectionCount = Math.max(reinspectionCount - defectCount, 0);
        const avgDurationMin =
          inspectionCount === 0
            ? 0
            : Number((rows.reduce((sum, row) => sum + row.avgDurationMin * row.inspectionCount, 0) / inspectionCount).toFixed(2));
        let abnormalTypeCounts: Record<string, number> = {};
        rows.forEach((row) => {
          abnormalTypeCounts = mergeTypeCounts(abnormalTypeCounts, buildAbnormalTypeCounts(row.defectCount));
        });
        const abnormalCount = Object.values(abnormalTypeCounts).reduce((sum, count) => sum + count, 0);
        return {
          key,
          dimensionValue: key,
          inspectionCount,
          defectCount,
          detectionRate: calcRate(defectCount, inspectionCount),
          reinspectionRate: calcRate(reinspectionCount, inspectionCount),
          falseDetectionRate: calcRate(falseDetectionCount, inspectionCount),
          avgDurationMin,
          abnormalCount,
          abnormalTypeCounts,
          topDefectType:
            Object.entries(abnormalTypeCounts)
              .sort((a, b) => b[1] - a[1])[0]?.[0] ?? '-',
          abnormalSummary: formatTypeSummary(abnormalTypeCounts, locale),
        };
      })
      .sort((a, b) => b.inspectionCount - a.inspectionCount);
  }, [dimension, filtered, locale]);

  const summary = useMemo(() => {
    const inspectionCount = aggregatedRows.reduce((sum, row) => sum + row.inspectionCount, 0);
    const abnormalCount = aggregatedRows.reduce((sum, row) => sum + row.abnormalCount, 0);
    const detectionRate = calcRate(abnormalCount, inspectionCount);
    const reinspectionRate = calcRate(
      aggregatedRows.reduce((sum, row) => sum + (row.reinspectionRate * row.inspectionCount) / 100, 0),
      inspectionCount,
    );
    const falseDetectionRate = calcRate(
      aggregatedRows.reduce((sum, row) => sum + (row.falseDetectionRate * row.inspectionCount) / 100, 0),
      inspectionCount,
    );
    const avgDurationMin =
      inspectionCount === 0
        ? 0
        : Number((aggregatedRows.reduce((sum, row) => sum + row.avgDurationMin * row.inspectionCount, 0) / inspectionCount).toFixed(2));
    const abnormalTypeCounts = aggregatedRows.reduce<Record<string, number>>((acc, row) => mergeTypeCounts(acc, row.abnormalTypeCounts), {});
    return {
      inspectionCount,
      detectionRate,
      reinspectionRate,
      falseDetectionRate,
      avgDurationMin,
      abnormalSummary: formatTypeSummary(abnormalTypeCounts, locale),
    };
  }, [aggregatedRows, locale]);

  const chartRows = useMemo(() => aggregatedRows.slice(0, 12), [aggregatedRows]);

  const detailColumns: ColumnsType<AggregatedRow> = [
    { title: dimensionTextMap[dimension], dataIndex: 'dimensionValue', key: 'dimensionValue', width: 220 },
    { title: label.inspectionCount, dataIndex: 'inspectionCount', key: 'inspectionCount', width: 130, sorter: (a, b) => a.inspectionCount - b.inspectionCount },
    { title: label.detectionRate, dataIndex: 'detectionRate', key: 'detectionRate', width: 120, sorter: (a, b) => a.detectionRate - b.detectionRate, render: (value: number) => `${value}%` },
    { title: label.reinspectionRate, dataIndex: 'reinspectionRate', key: 'reinspectionRate', width: 120, sorter: (a, b) => a.reinspectionRate - b.reinspectionRate, render: (value: number) => `${value}%` },
    { title: label.falseDetectionRate, dataIndex: 'falseDetectionRate', key: 'falseDetectionRate', width: 120, sorter: (a, b) => a.falseDetectionRate - b.falseDetectionRate, render: (value: number) => `${value}%` },
    { title: label.avgDuration, dataIndex: 'avgDurationMin', key: 'avgDurationMin', width: 140, sorter: (a, b) => a.avgDurationMin - b.avgDurationMin, render: (value: number) => `${value} ${label.avgDurationUnit}` },
    { title: label.abnormalSummary, dataIndex: 'abnormalSummary', key: 'abnormalSummary', width: 280, sorter: (a, b) => a.abnormalCount - b.abnormalCount },
  ];

  const abnormalColumns: ColumnsType<AggregatedRow> = [
    { title: dimensionTextMap[dimension], dataIndex: 'dimensionValue', key: 'dimensionValue', width: 220 },
    {
      title: locale === 'en-US' ? 'Defect Count' : '缺陷数量',
      dataIndex: 'defectCount',
      key: 'defectCount',
      width: 130,
      sorter: (a, b) => a.defectCount - b.defectCount,
    },
    {
      title: locale === 'en-US' ? 'Defect Rate' : '缺陷率',
      dataIndex: 'detectionRate',
      key: 'detectionRate',
      width: 130,
      sorter: (a, b) => a.detectionRate - b.detectionRate,
      render: (value: number) => `${value}%`,
    },
    {
      title: locale === 'en-US' ? 'Top Defect Type' : '主要缺陷类型',
      dataIndex: 'topDefectType',
      key: 'topDefectType',
      width: 170,
      sorter: (a, b) => a.topDefectType.localeCompare(b.topDefectType),
      render: (value: string) => <Tag color="error">{value}</Tag>,
    },
    {
      title: locale === 'en-US' ? 'Defect Distribution' : '缺陷类型分布',
      dataIndex: 'abnormalSummary',
      key: 'abnormalSummary',
      width: 320,
      sorter: (a, b) => a.abnormalCount - b.abnormalCount,
    },
  ];

  const historyColumns: ColumnsType<ReportRecord> = [
    { title: locale === 'en-US' ? 'Report No' : '报表编号', dataIndex: 'reportNo', key: 'reportNo', width: 170 },
    {
      title: label.reportType,
      dataIndex: 'reportType',
      key: 'reportType',
      width: 120,
      render: (value: ReportType) => ({ daily: label.daily, weekly: label.weekly, monthly: label.monthly, custom: label.custom })[value],
    },
    { title: locale === 'en-US' ? 'Period' : '周期', dataIndex: 'periodLabel', key: 'periodLabel', width: 130 },
    { title: label.reportDimension, dataIndex: 'dimension', key: 'dimension', width: 130, render: (value: ReportDimension) => dimensionTextMap[value] },
    { title: locale === 'en-US' ? 'Creator' : '创建人', dataIndex: 'creator', key: 'creator', width: 100 },
    { title: locale === 'en-US' ? 'Created At' : '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
    { title: locale === 'en-US' ? 'Status' : '状态', dataIndex: 'status', key: 'status', width: 100, render: () => <Tag color="success">{locale === 'en-US' ? 'Generated' : '已生成'}</Tag> },
    {
      title: locale === 'en-US' ? 'Action' : '操作',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          icon={<DownloadOutlined />}
          onClick={() => {
            downloadPdf(aggregatedRows, `${record.reportNo}.pdf`, { title: record.reportNo, reportRecord: record });
            messageApi.success(label.reportDownloaded);
          }}
        >
          {label.actionDownload}
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
            {t('menu.qualityReport')}
          </Typography.Title>
          <Space wrap>
            <Select
              value={reportType}
              onChange={setReportType}
              style={{ width: 150 }}
              options={[
                { label: label.daily, value: 'daily' },
                { label: label.weekly, value: 'weekly' },
                { label: label.monthly, value: 'monthly' },
                { label: label.custom, value: 'custom' },
              ]}
            />
            <Select
              value={dimension}
              onChange={setDimension}
              style={{ width: 180 }}
              options={[
                { label: label.workshop, value: 'workshop' },
                { label: label.workstation, value: 'workstation' },
                { label: label.station, value: 'station' },
                { label: label.wireHarness, value: 'wireHarness' },
                { label: label.workOrder, value: 'workOrder' },
                { label: label.inspector, value: 'inspector' },
              ]}
            />
            <Button
              icon={<FileAddOutlined />}
              onClick={() => {
                const creator = getCurrentUser()?.username ?? 'admin';
                const next: ReportRecord = {
                  id: `RPT-${Date.now()}`,
                  reportNo: `QCR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`,
                  reportType,
                  periodLabel: reportType === 'daily' ? 'D-1' : reportType === 'weekly' ? 'W-1' : reportType === 'monthly' ? 'M-1' : 'custom',
                  dimension,
                  creator,
                  createdAt: nowText(),
                  status: 'generated',
                };
                setReportHistory((current) => [next, ...current]);
                messageApi.success(label.reportGenerated);
              }}
            >
              {label.createReport}
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => {
                downloadPdf(aggregatedRows, `quality-report-${new Date().toISOString().slice(0, 10)}.pdf`, {
                  title: locale === 'en-US' ? 'Quality Report Detail' : '质检报表明细',
                });
                messageApi.success(label.reportExported);
              }}
            >
              {label.exportReport}
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

      <Card title={label.detailTitle}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Select
            value={reportMetric}
            onChange={setReportMetric}
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
          <SimpleBarChart
            title={label.detailChartTitle}
            data={chartRows.map((item) => ({ name: item.dimensionValue, value: Number(item[reportMetric]) }))}
            unit={reportMetric === 'avgDurationMin' ? (locale === 'en-US' ? ' min' : ' 分钟') : undefined}
          />
          <Table rowKey="key" columns={detailColumns} dataSource={aggregatedRows} pagination={{ pageSize: 8, showSizeChanger: false }} scroll={{ x: 1300 }} />
        </Space>
      </Card>

      <Card title={label.abnormalTitle}>
        <Table rowKey="key" columns={abnormalColumns} dataSource={aggregatedRows} pagination={{ pageSize: 6, showSizeChanger: false }} scroll={{ x: 1050 }} />
      </Card>

      <Card title={label.historyTitle}>
        <Table rowKey="id" columns={historyColumns} dataSource={reportHistory} pagination={{ pageSize: 6, showSizeChanger: false }} scroll={{ x: 1100 }} />
      </Card>
    </Space>
  );
}
