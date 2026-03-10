import { useMemo, useState } from 'react';
import {
  deviceData,
  workshops,
  workstations,
  stations,
  robotTypes,
  robotGroups,
  type DeviceRecord,
  type ExceptionLevel,
  type PeriodKey,
} from '../../data/dataStatistics/deviceStatisticsData';

export interface DeviceStatisticsSummary {
  total: number;
  onlineCount: number;
  onlineRate: number;
  exceptionDeviceCount: number;
  avgBattery: number;
  runtime: number;
  tasks: number;
  taskCompleteRate: number;
}

export interface DeviceStatisticsViewModel {
  period: PeriodKey;
  setPeriod: (v: PeriodKey) => void;
  workshop: string;
  setWorkshop: (v: string) => void;
  workstation: string;
  setWorkstation: (v: string) => void;
  station: string;
  setStation: (v: string) => void;
  robotType: string;
  setRobotType: (v: string) => void;
  robotGroup: string;
  setRobotGroup: (v: string) => void;
  onlineStatus: string;
  setOnlineStatus: (v: string) => void;
  exceptionStatus: string;
  setExceptionStatus: (v: string) => void;
  keyword: string;
  setKeyword: (v: string) => void;
  detail: DeviceRecord | null;
  setDetail: (r: DeviceRecord | null) => void;
  lastUpdated: Date;
  setLastUpdated: (d: Date) => void;
  filtered: DeviceRecord[];
  summary: DeviceStatisticsSummary;
  onlineTrend: { categories: string[]; values: number[] };
  typeDistribution: { name: string; value: number }[];
  levelDistribution: { name: ExceptionLevel; value: number }[];
  batteryDistribution: { name: string; value: number }[];
  workshops: readonly string[];
  workstations: readonly string[];
  stations: readonly string[];
  robotTypes: readonly string[];
  robotGroups: readonly string[];
}

export function useDeviceStatistics(): DeviceStatisticsViewModel {
  const [period, setPeriod] = useState<PeriodKey>('day7');
  const [workshop, setWorkshop] = useState<string>('all');
  const [workstation, setWorkstation] = useState<string>('all');
  const [station, setStation] = useState<string>('all');
  const [robotType, setRobotType] = useState<string>('all');
  const [robotGroup, setRobotGroup] = useState<string>('all');
  const [onlineStatus, setOnlineStatus] = useState<string>('all');
  const [exceptionStatus, setExceptionStatus] = useState<string>('all');
  const [keyword, setKeyword] = useState('');
  const [detail, setDetail] = useState<DeviceRecord | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(() => new Date());

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return deviceData.filter((item) => {
      if (workshop !== 'all' && item.workshop !== workshop) return false;
      if (workstation !== 'all' && item.workstation !== workstation) return false;
      if (station !== 'all' && item.station !== station) return false;
      if (robotType !== 'all' && item.type !== robotType) return false;
      if (robotGroup !== 'all' && item.group !== robotGroup) return false;
      if (onlineStatus === 'online' && !item.online) return false;
      if (onlineStatus === 'offline' && item.online) return false;
      if (exceptionStatus === 'exception' && item.exceptionLevel === 'none') return false;
      if (exceptionStatus === 'normal' && item.exceptionLevel !== 'none') return false;
      if (!kw) return true;
      return `${item.id} ${item.station} ${item.currentTask}`.toLowerCase().includes(kw);
    });
  }, [exceptionStatus, keyword, onlineStatus, robotGroup, robotType, station, workstation, workshop]);

  const summary = useMemo<DeviceStatisticsSummary>(() => {
    const total = filtered.length;
    const onlineCount = filtered.filter((item) => item.online).length;
    const exceptionDeviceCount = filtered.filter((item) => item.exceptionLevel !== 'none').length;
    const avgBattery = total === 0 ? 0 : Number((filtered.reduce((sum, item) => sum + item.battery, 0) / total).toFixed(1));
    const runtime = Number(filtered.reduce((sum, item) => sum + item.runtimeHourToday, 0).toFixed(1));
    const tasks = filtered.reduce((sum, item) => sum + item.tasksToday, 0);
    const taskCompleteRate = total === 0 ? 0 : 95;
    return {
      total,
      onlineCount,
      onlineRate: total === 0 ? 0 : Number(((onlineCount / total) * 100).toFixed(1)),
      exceptionDeviceCount,
      avgBattery,
      runtime,
      tasks,
      taskCompleteRate,
    };
  }, [filtered]);

  const onlineTrend = useMemo(() => {
    const days = period === 'day1' ? 1 : period === 'day7' ? 7 : 30;
    const categories = Array.from({ length: days }, (_, index) => {
      const day = new Date(2026, 2, 6 - (days - 1 - index));
      return day.toISOString().slice(0, 10);
    });
    const base = summary.onlineCount;
    const values = categories.map((_, index) => Math.max(0, base - ((index % 4) - 1)));
    return { categories, values };
  }, [period, summary.onlineCount]);

  const typeDistribution = useMemo(
    () =>
      robotTypes.map((type) => ({
        name: type,
        value: filtered.filter((item) => item.type === type).length,
      })),
    [filtered],
  );

  const levelDistribution = useMemo(
    () =>
      (['none', 'low', 'medium', 'high'] as ExceptionLevel[]).map((level) => ({
        name: level,
        value: filtered.filter((item) => item.exceptionLevel === level).length,
      })),
    [filtered],
  );

  const batteryDistribution = useMemo(() => {
    const bins = [
      { name: '0-20%', min: 0, max: 20 },
      { name: '21-40%', min: 21, max: 40 },
      { name: '41-60%', min: 41, max: 60 },
      { name: '61-80%', min: 61, max: 80 },
      { name: '81-100%', min: 81, max: 100 },
    ];
    return bins.map((bin) => ({
      name: bin.name,
      value: filtered.filter((item) => item.battery >= bin.min && item.battery <= bin.max).length,
    }));
  }, [filtered]);

  return {
    period,
    setPeriod,
    workshop,
    setWorkshop,
    workstation,
    setWorkstation,
    station,
    setStation,
    robotType,
    setRobotType,
    robotGroup,
    setRobotGroup,
    onlineStatus,
    setOnlineStatus,
    exceptionStatus,
    setExceptionStatus,
    keyword,
    setKeyword,
    detail,
    setDetail,
    lastUpdated,
    setLastUpdated,
    filtered,
    summary,
    onlineTrend,
    typeDistribution,
    levelDistribution,
    batteryDistribution,
    workshops,
    workstations,
    stations,
    robotTypes,
    robotGroups,
  };
}
