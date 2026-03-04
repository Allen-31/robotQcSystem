import { DownloadOutlined, FileAddOutlined } from '@ant-design/icons';
import { Button, Card, Col, Row, Select, Space, Statistic, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useMemo, useState } from 'react';
import { qualityStatsMock, type QualityStatRecord } from '../../../data/qcStatistics/qualityStatsMock';
import { useI18n } from '../../../i18n/I18nProvider';
import { getCurrentUser } from '../../../logic/auth/authStore';
import { SimpleBarChart } from '../../components/charts/SimpleCharts';

type ReportType = 'daily' | 'weekly' | 'monthly' | 'custom';
type ReportDimension = 'workshop' | 'workstation' | 'station' | 'inspector' | 'wireHarness';

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
  reinspectionCount: number;
  detectionRate: number;
  reinspectionRate: number;
  avgDurationMin: number;
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

function downloadPdf(
  rows: AggregatedRow[],
  fileName: string,
  options?: {
    title?: string;
    reportRecord?: ReportRecord;
  },
): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const title = options?.title ?? 'Quality Report';

  doc.setFontSize(16);
  doc.text(title, 40, 40);

  let startY = 58;
  if (options?.reportRecord) {
    const record = options.reportRecord;
    doc.setFontSize(10);
    doc.text(`Report No: ${record.reportNo}`, 40, startY);
    doc.text(`Type: ${record.reportType}`, 260, startY);
    doc.text(`Period: ${record.periodLabel}`, 420, startY);
    doc.text(`Dimension: ${record.dimension}`, 40, startY + 16);
    doc.text(`Creator: ${record.creator}`, 260, startY + 16);
    doc.text(`Created At: ${record.createdAt}`, 420, startY + 16);
    startY += 34;
  }

  autoTable(doc, {
    startY,
    head: [['Dimension', 'Inspections', 'Defects', 'Reinspections', 'Detection Rate', 'Reinspection Rate', 'Avg Duration(min)']],
    body: rows.map((row) => [
      row.dimensionValue,
      row.inspectionCount,
      row.defectCount,
      row.reinspectionCount,
      `${row.detectionRate}%`,
      `${row.reinspectionRate}%`,
      row.avgDurationMin,
    ]),
    theme: 'striped',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [22, 119, 255] },
  });

  doc.save(fileName);
}

export function QualityReportPage() {
  const { locale, t } = useI18n();
  const [messageApi, contextHolder] = message.useMessage();
  const [reportType, setReportType] = useState<ReportType>('weekly');
  const [dimension, setDimension] = useState<ReportDimension>('workshop');
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
        totalInspection: 'Inspections',
        totalDefect: 'Defects',
        detectionRate: 'Detection Rate',
        reinspectionRate: 'Reinspection Rate',
        avgDuration: 'Avg Duration',
        avgDurationUnit: 'min',
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
      totalInspection: '检测总数',
      totalDefect: '检出缺陷',
      detectionRate: '检出率',
      reinspectionRate: '复检率',
      avgDuration: '平均检测时长',
      avgDurationUnit: '分钟',
      detailTitle: '报表明细',
      abnormalTitle: '异常明细',
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

  const dimensionTextMap: Record<ReportDimension, string> = useMemo(
    () => ({
      workshop: locale === 'en-US' ? 'Workshop' : '车间',
      workstation: locale === 'en-US' ? 'Inspection Zone' : '质检区',
      station: locale === 'en-US' ? 'Inspection Bench' : '质检台',
      inspector: locale === 'en-US' ? 'Inspector' : '质检员',
      wireHarness: locale === 'en-US' ? 'Harness' : '线束',
    }),
    [locale],
  );

  const filtered = useMemo(() => filterByReportType(qualityStatsMock, reportType), [reportType]);

  const aggregatedRows = useMemo<AggregatedRow[]>(() => {
    const grouped = new Map<string, QualityStatRecord[]>();
    filtered.forEach((item) => {
      grouped.set(item[dimension], [...(grouped.get(item[dimension]) ?? []), item]);
    });
    return Array.from(grouped.entries())
      .map(([key, rows]) => {
        const inspectionCount = rows.reduce((sum, row) => sum + row.inspectionCount, 0);
        const defectCount = rows.reduce((sum, row) => sum + row.defectCount, 0);
        const reinspectionCount = rows.reduce((sum, row) => sum + row.reinspectionCount, 0);
        const avgDurationMin =
          inspectionCount === 0
            ? 0
            : Number((rows.reduce((sum, row) => sum + row.avgDurationMin * row.inspectionCount, 0) / inspectionCount).toFixed(2));
        return {
          key,
          dimensionValue: key,
          inspectionCount,
          defectCount,
          reinspectionCount,
          detectionRate: calcRate(defectCount, inspectionCount),
          reinspectionRate: calcRate(reinspectionCount, inspectionCount),
          avgDurationMin,
        };
      })
      .sort((a, b) => b.inspectionCount - a.inspectionCount);
  }, [dimension, filtered]);

  const summary = useMemo(() => {
    const inspectionCount = aggregatedRows.reduce((sum, row) => sum + row.inspectionCount, 0);
    const defectCount = aggregatedRows.reduce((sum, row) => sum + row.defectCount, 0);
    const reinspectionCount = aggregatedRows.reduce((sum, row) => sum + row.reinspectionCount, 0);
    const avgDurationMin =
      inspectionCount === 0
        ? 0
        : Number((aggregatedRows.reduce((sum, row) => sum + row.avgDurationMin * row.inspectionCount, 0) / inspectionCount).toFixed(2));
    return {
      inspectionCount,
      defectCount,
      detectionRate: calcRate(defectCount, inspectionCount),
      reinspectionRate: calcRate(reinspectionCount, inspectionCount),
      avgDurationMin,
    };
  }, [aggregatedRows]);

  const abnormalRows = useMemo(
    () =>
      aggregatedRows
        .filter((row) => row.detectionRate < 5 || row.reinspectionRate > 10 || row.avgDurationMin > 9)
        .map((row) => ({
          ...row,
          issue:
            row.detectionRate < 5
              ? locale === 'en-US'
                ? 'Low detection rate'
                : '检出率偏低'
              : row.reinspectionRate > 10
                ? locale === 'en-US'
                  ? 'High reinspection rate'
                  : '复检率偏高'
                : locale === 'en-US'
                  ? 'Long detection duration'
                  : '检测时长偏高',
        })),
    [aggregatedRows, locale],
  );

  const detailColumns: ColumnsType<AggregatedRow> = [
    { title: dimensionTextMap[dimension], dataIndex: 'dimensionValue', key: 'dimensionValue', width: 180 },
    { title: label.totalInspection, dataIndex: 'inspectionCount', key: 'inspectionCount', width: 130 },
    { title: label.totalDefect, dataIndex: 'defectCount', key: 'defectCount', width: 120 },
    { title: label.detectionRate, dataIndex: 'detectionRate', key: 'detectionRate', width: 120, render: (value: number) => `${value}%` },
    { title: label.reinspectionRate, dataIndex: 'reinspectionRate', key: 'reinspectionRate', width: 120, render: (value: number) => `${value}%` },
    { title: label.avgDuration, dataIndex: 'avgDurationMin', key: 'avgDurationMin', width: 160, render: (value: number) => `${value} ${label.avgDurationUnit}` },
  ];

  const abnormalColumns: ColumnsType<(typeof abnormalRows)[number]> = [
    { title: dimensionTextMap[dimension], dataIndex: 'dimensionValue', key: 'dimensionValue', width: 180 },
    { title: locale === 'en-US' ? 'Issue' : '异常项', dataIndex: 'issue', key: 'issue', width: 180, render: (value: string) => <Tag color="error">{value}</Tag> },
    { title: label.detectionRate, dataIndex: 'detectionRate', key: 'detectionRate', width: 120, render: (value: number) => `${value}%` },
    { title: label.reinspectionRate, dataIndex: 'reinspectionRate', key: 'reinspectionRate', width: 120, render: (value: number) => `${value}%` },
    { title: label.avgDuration, dataIndex: 'avgDurationMin', key: 'avgDurationMin', width: 150, render: (value: number) => `${value} ${label.avgDurationUnit}` },
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
    {
      title: label.reportDimension,
      dataIndex: 'dimension',
      key: 'dimension',
      width: 130,
      render: (value: ReportDimension) => dimensionTextMap[value],
    },
    { title: locale === 'en-US' ? 'Creator' : '创建人', dataIndex: 'creator', key: 'creator', width: 100 },
    { title: locale === 'en-US' ? 'Created At' : '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
    {
      title: locale === 'en-US' ? 'Status' : '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: () => <Tag color="success">{locale === 'en-US' ? 'Generated' : '已生成'}</Tag>,
    },
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
            downloadPdf(aggregatedRows, `${record.reportNo}.pdf`, {
              title: record.reportNo,
              reportRecord: record,
            });
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
              style={{ width: 170 }}
              options={[
                { label: dimensionTextMap.workshop, value: 'workshop' },
                { label: dimensionTextMap.workstation, value: 'workstation' },
                { label: dimensionTextMap.station, value: 'station' },
                { label: dimensionTextMap.inspector, value: 'inspector' },
                { label: dimensionTextMap.wireHarness, value: 'wireHarness' },
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

      <Card title={label.detailTitle}>
        <SimpleBarChart
          title={label.detailChartTitle}
          data={aggregatedRows.slice(0, 12).map((item) => ({
            name: item.dimensionValue,
            value: item.inspectionCount,
          }))}
        />
        <Table rowKey="key" columns={detailColumns} dataSource={aggregatedRows} pagination={{ pageSize: 8, showSizeChanger: false }} scroll={{ x: 980 }} />
      </Card>

      <Card title={label.abnormalTitle}>
        <Table rowKey="key" columns={abnormalColumns} dataSource={abnormalRows} pagination={{ pageSize: 6, showSizeChanger: false }} scroll={{ x: 900 }} />
      </Card>

      <Card title={label.historyTitle}>
        <Table rowKey="id" columns={historyColumns} dataSource={reportHistory} pagination={{ pageSize: 6, showSizeChanger: false }} scroll={{ x: 1100 }} />
      </Card>
    </Space>
  );
}
