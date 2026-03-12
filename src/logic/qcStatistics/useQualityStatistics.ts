import { useMemo, useState } from 'react';
import { qualityStatsMock, type QualityStatRecord } from '../../data/qcStatistics/qualityStatsMock';

export type PeriodKey = 'day3' | 'day7' | 'month1' | 'custom';
export type MetricKey = 'reinspectionRate' | 'detectionRate' | 'falseDetectionRate' | 'inspectionCount' | 'avgDurationMin' | 'abnormalCount';
export type GroupDimension = 'workshop' | 'workstation' | 'station' | 'project';

export interface AggregatedRow {
  key: string;
  groupValue: string;
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

export interface StatisticsSummary {
  inspectionCount: number;
  detectionRate: number;
  reinspectionRate: number;
  falseDetectionRate: number;
  avgDurationMin: number;
  defectCount: number;
  abnormalCount: number;
  abnormalTypeCounts: Record<string, number>;
  abnormalSummary: string;
}

export interface TrendPoint {
  date: string;
  inspectionCount: number;
  detectionRate: number;
  reinspectionRate: number;
  falseDetectionRate: number;
  avgDurationMin: number;
  abnormalCount: number;
}

export const ALL_VALUE = '__ALL__';

const ABNORMAL_TYPES = ['接线错误', '外观异常', '工艺偏差'] as const;

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

function applyPeriod(records: QualityStatRecord[], period: PeriodKey, customRange: [string, string] | null): QualityStatRecord[] {
  if (period === 'custom') {
    if (!customRange) {
      return records;
    }
    const [start, end] = customRange;
    const startTime = new Date(`${start}T00:00:00`).getTime();
    const endTime = new Date(`${end}T23:59:59`).getTime();
    return records.filter((item) => {
      const time = new Date(`${item.date}T00:00:00`).getTime();
      return time >= startTime && time <= endTime;
    });
  }

  const latest = getLatestDate(records);
  if (!latest) {
    return records;
  }

  const latestDate = new Date(`${latest}T00:00:00`);
  const days = period === 'day3' ? 3 : period === 'day7' ? 7 : 30;

  return records.filter((item) => {
    const date = new Date(`${item.date}T00:00:00`);
    const diff = (latestDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff < days;
  });
}

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

function formatTypeSummary(typeCounts: Record<string, number>): string {
  return Object.entries(typeCounts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => `${type}:${count}`)
    .join('，');
}

export function useQualityStatistics(records: QualityStatRecord[] = qualityStatsMock) {
  const [period, setPeriod] = useState<PeriodKey>('month1');
  const [customRange, setCustomRange] = useState<[string, string] | null>(null);
  const [workshop, setWorkshop] = useState<string>(ALL_VALUE);
  const [workstation, setWorkstation] = useState<string>(ALL_VALUE);
  const [station, setStation] = useState<string>(ALL_VALUE);
  const [wireHarness, setWireHarness] = useState<string>(ALL_VALUE);
  const [project, setProject] = useState<string>(ALL_VALUE);
  const [groupBy, setGroupBy] = useState<GroupDimension>('workshop');
  const [metric, setMetric] = useState<MetricKey>('inspectionCount');

  const periodFiltered = useMemo(() => applyPeriod(records, period, customRange), [records, period, customRange]);

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

  const projectOptions = useMemo(
    () =>
      Array.from(
        new Set(
          periodFiltered
            .filter(
              (item) =>
                (workshop === ALL_VALUE || item.workshop === workshop) &&
                (workstation === ALL_VALUE || item.workstation === workstation) &&
                (station === ALL_VALUE || item.station === station) &&
                (wireHarness === ALL_VALUE || item.wireHarness === wireHarness),
            )
            .map((item) => item.project)
            .filter(Boolean),
        ),
      ) as string[],
    [periodFiltered, workshop, workstation, station, wireHarness],
  );

  const drilledRecords = useMemo(
    () =>
      periodFiltered.filter(
        (item) =>
          (workshop === ALL_VALUE || item.workshop === workshop) &&
          (workstation === ALL_VALUE || item.workstation === workstation) &&
          (station === ALL_VALUE || item.station === station) &&
          (wireHarness === ALL_VALUE || item.wireHarness === wireHarness) &&
          (project === ALL_VALUE || item.project === project),
      ),
    [periodFiltered, workshop, workstation, station, wireHarness, project],
  );

  const groupDimension = groupBy;

  const rows = useMemo<AggregatedRow[]>(() => {
    const grouped = new Map<string, QualityStatRecord[]>();
    drilledRecords.forEach((item) => {
      const key = groupDimension === 'project' ? (item.project ?? '未分类') : item[groupDimension];
      grouped.set(key, [...(grouped.get(key) ?? []), item]);
    });

    return Array.from(grouped.entries())
      .map(([groupValue, items]) => {
        const inspectionCount = items.reduce((sum, row) => sum + row.inspectionCount, 0);
        const defectCount = items.reduce((sum, row) => sum + row.defectCount, 0);
        const reinspectionCount = items.reduce((sum, row) => sum + row.reinspectionCount, 0);
        const falseDetectionCount = Math.max(reinspectionCount - defectCount, 0);
        const avgDurationMin =
          inspectionCount === 0
            ? 0
            : Number((items.reduce((sum, row) => sum + row.avgDurationMin * row.inspectionCount, 0) / inspectionCount).toFixed(2));

        let abnormalTypeCounts: Record<string, number> = {};
        items.forEach((row) => {
          abnormalTypeCounts = mergeTypeCounts(abnormalTypeCounts, buildAbnormalTypeCounts(row.defectCount));
        });

        const abnormalCount = Object.values(abnormalTypeCounts).reduce((sum, count) => sum + count, 0);

        return {
          key: groupValue,
          groupValue,
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
          abnormalSummary: formatTypeSummary(abnormalTypeCounts),
        };
      })
      .sort((a, b) => b.inspectionCount - a.inspectionCount);
  }, [drilledRecords, groupDimension]);

  const summary = useMemo<StatisticsSummary>(() => {
    const inspectionCount = rows.reduce((sum, row) => sum + row.inspectionCount, 0);
    const abnormalCount = rows.reduce((sum, row) => sum + row.abnormalCount, 0);

    const defectCount = rows.reduce(
      (sum, row) =>
        sum +
        (row.abnormalTypeCounts['接线错误'] ?? 0) +
        (row.abnormalTypeCounts['外观异常'] ?? 0) +
        (row.abnormalTypeCounts['工艺偏差'] ?? 0),
      0,
    );

    const reinspectionCount = rows.reduce((sum, row) => sum + (row.reinspectionRate * row.inspectionCount) / 100, 0);
    const falseDetectionCount = rows.reduce((sum, row) => sum + (row.falseDetectionRate * row.inspectionCount) / 100, 0);
    const avgDurationMin =
      inspectionCount === 0 ? 0 : Number((rows.reduce((sum, row) => sum + row.avgDurationMin * row.inspectionCount, 0) / inspectionCount).toFixed(2));

    const abnormalTypeCounts = rows.reduce<Record<string, number>>((acc, row) => mergeTypeCounts(acc, row.abnormalTypeCounts), {});

    return {
      inspectionCount,
      detectionRate: calcRate(defectCount, inspectionCount),
      reinspectionRate: calcRate(reinspectionCount, inspectionCount),
      falseDetectionRate: calcRate(falseDetectionCount, inspectionCount),
      avgDurationMin,
      defectCount,
      abnormalCount,
      abnormalTypeCounts,
      abnormalSummary: formatTypeSummary(abnormalTypeCounts),
    };
  }, [rows]);

  const chartTopCount = 12;
  const chartRows = useMemo(() => rows.slice(0, chartTopCount), [rows]);
  const chartIsLine = metric === 'detectionRate' || metric === 'reinspectionRate' || metric === 'falseDetectionRate';

  const trendPoints = useMemo<TrendPoint[]>(() => {
    const grouped = new Map<string, QualityStatRecord[]>();
    drilledRecords.forEach((item) => {
      grouped.set(item.date, [...(grouped.get(item.date) ?? []), item]);
    });

    return Array.from(grouped.entries())
      .sort((a, b) => (a[0] > b[0] ? 1 : -1))
      .map(([date, items]) => {
        const inspectionCount = items.reduce((sum, row) => sum + row.inspectionCount, 0);
        const defectCount = items.reduce((sum, row) => sum + row.defectCount, 0);
        const reinspectionCount = items.reduce((sum, row) => sum + row.reinspectionCount, 0);
        const falseDetectionCount = Math.max(reinspectionCount - defectCount, 0);
        const avgDurationMin =
          inspectionCount === 0
            ? 0
            : Number((items.reduce((sum, row) => sum + row.avgDurationMin * row.inspectionCount, 0) / inspectionCount).toFixed(2));

        const abnormalCount = items.reduce((sum, row) => {
          const typeCounts = buildAbnormalTypeCounts(row.defectCount);
          return sum + Object.values(typeCounts).reduce((inner, count) => inner + count, 0);
        }, 0);

        return {
          date,
          inspectionCount,
          detectionRate: calcRate(defectCount, inspectionCount),
          reinspectionRate: calcRate(reinspectionCount, inspectionCount),
          falseDetectionRate: calcRate(falseDetectionCount, inspectionCount),
          avgDurationMin,
          abnormalCount,
        };
      });
  }, [drilledRecords]);

  const changeWorkshop = (value: string) => {
    setWorkshop(value);
    setWorkstation(ALL_VALUE);
    setStation(ALL_VALUE);
    setWireHarness(ALL_VALUE);
  };

  const changeWorkstation = (value: string) => {
    setWorkstation(value);
    setStation(ALL_VALUE);
    setWireHarness(ALL_VALUE);
  };

  const changeStation = (value: string) => {
    setStation(value);
    setWireHarness(ALL_VALUE);
  };

  return {
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
  };
}
