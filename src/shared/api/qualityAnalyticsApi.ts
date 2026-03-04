export type QualityDimension = 'factory' | 'workshop' | 'workstation' | 'station' | 'inspector' | 'wireHarness';
export type QualityPeriod = 'day' | 'week' | 'month' | 'custom';

export interface QualityAnalyticsQuery {
  period: QualityPeriod;
  startDate?: string;
  endDate?: string;
  dimension: QualityDimension;
  factoryIds?: string[];
  workshopIds?: string[];
  workstationIds?: string[];
  stationIds?: string[];
  inspectorIds?: string[];
  wireHarnessIds?: string[];
}

export interface QualityKpiSummary {
  inspectionCount: number;
  defectCount: number;
  reinspectionCount: number;
  detectionRate: number;
  reinspectionRate: number;
  avgDurationMin: number;
}

export interface QualityDimensionItem {
  dimensionValue: string;
  inspectionCount: number;
  defectCount: number;
  reinspectionCount: number;
  detectionRate: number;
  reinspectionRate: number;
  avgDurationMin: number;
}

export interface QualityTrendItem {
  date: string;
  detectionRate: number;
  reinspectionRate: number;
  avgDurationMin: number;
}

export interface QualityAnomalyItem extends QualityDimensionItem {
  issueCode: 'LOW_DETECTION_RATE' | 'HIGH_REINSPECTION_RATE' | 'HIGH_DURATION';
  issueMessage: string;
}

export interface QualityStatisticsResponse {
  summary: QualityKpiSummary;
  compare: QualityDimensionItem[];
  trend: QualityTrendItem[];
  anomalies: QualityAnomalyItem[];
}

export type QualityReportType = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface QualityReportGenerateCommand {
  reportType: QualityReportType;
  periodLabel: string;
  query: QualityAnalyticsQuery;
}

export interface QualityReportRecord {
  id: string;
  reportNo: string;
  reportType: QualityReportType;
  periodLabel: string;
  dimension: QualityDimension;
  creator: string;
  createdAt: string;
  status: 'generated' | 'failed';
}

export interface QualityReportDetailResponse {
  record: QualityReportRecord;
  summary: QualityKpiSummary;
  detailRows: QualityDimensionItem[];
  anomalies: QualityAnomalyItem[];
}
