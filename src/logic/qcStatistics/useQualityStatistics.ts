import { useMemo, useState } from 'react';
import { qualityStatsMock, type QualityStatRecord } from '../../data/qcStatistics/qualityStatsMock';

export type PeriodKey = 'all' | 'day3' | 'day7';
export type MetricKey = 'inspectionCount' | 'defectCount' | 'detectionRate' | 'reinspectionRate' | 'avgDurationMin';
export type GroupDimension = 'workshop' | 'workstation' | 'station';

export interface AggregatedRow {
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

export interface StatisticsSummary {
  inspectionCount: number;
  defectCount: number;
  detectionRate: number;
  reinspectionRate: number;
  avgDurationMin: number;
}

export const ALL_VALUE = '__ALL__';

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

export function useQualityStatistics(records: QualityStatRecord[] = qualityStatsMock) {
  const [period, setPeriod] = useState<PeriodKey>('day7');
  const [workshop, setWorkshop] = useState<string>(ALL_VALUE);
  const [workstation, setWorkstation] = useState<string>(ALL_VALUE);
  const [station, setStation] = useState<string>(ALL_VALUE);
  const [wireHarness, setWireHarness] = useState<string>(ALL_VALUE);
  const [metric, setMetric] = useState<MetricKey>('inspectionCount');

  const periodFiltered = useMemo(() => applyPeriod(records, period), [records, period]);

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

  const groupDimension = useMemo<GroupDimension>(() => {
    if (workshop === ALL_VALUE) {
      return 'workshop';
    }
    if (workstation === ALL_VALUE) {
      return 'workstation';
    }
    return 'station';
  }, [workshop, workstation]);

  const rows = useMemo<AggregatedRow[]>(() => {
    const grouped = new Map<string, QualityStatRecord[]>();
    drilledRecords.forEach((item) => {
      const key = item[groupDimension];
      grouped.set(key, [...(grouped.get(key) ?? []), item]);
    });
    return Array.from(grouped.entries())
      .map(([groupValue, items]) => {
        const inspectionCount = items.reduce((sum, row) => sum + row.inspectionCount, 0);
        const defectCount = items.reduce((sum, row) => sum + row.defectCount, 0);
        const reinspectionCount = items.reduce((sum, row) => sum + row.reinspectionCount, 0);
        const avgDurationMin =
          inspectionCount === 0
            ? 0
            : Number((items.reduce((sum, row) => sum + row.avgDurationMin * row.inspectionCount, 0) / inspectionCount).toFixed(2));
        return {
          key: groupValue,
          groupValue,
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

  const summary = useMemo<StatisticsSummary>(() => {
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

  const chartTopCount = 12;
  const chartRows = useMemo(() => rows.slice(0, chartTopCount), [rows]);
  const chartIsLine = metric === 'detectionRate' || metric === 'reinspectionRate';

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
    workshop,
    workstation,
    station,
    wireHarness,
    metric,
    setPeriod,
    setWireHarness,
    setMetric,
    changeWorkshop,
    changeWorkstation,
    changeStation,
    workshopOptions,
    workstationOptions,
    stationOptions,
    wireHarnessOptions,
    groupDimension,
    rows,
    summary,
    chartTopCount,
    chartRows,
    chartIsLine,
  };
}
