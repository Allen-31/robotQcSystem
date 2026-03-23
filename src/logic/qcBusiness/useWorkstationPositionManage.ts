import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getStationCodeOptions, normalizeHarnessType, normalizeStationCode } from '../../data/qcBusiness/qcConfigReference';
import { workstationPositionList, type RobotStatus, type WorkOrderInfo, type WorkstationPositionItem } from '../../data/qcBusiness/workstationPositionList';
import { getStationPositionsApi, type StationPositionVO } from '../../shared/api/qcInspectionApi';
import { qcBusinessQueryKeys } from '../../shared/api/queryKeys';
import { useRealtimeStore } from '../../store/realtimeStore';

export interface CurrentWorkOrderReviewPayload {
  qualityResult: 'ok' | 'ng';
  defectType?: string;
  defectDescription?: string;
}

const placeholderWorkOrder: WorkOrderInfo = {
  workOrderNo: '-',
  movingDuration: 0,
  fixtureLineType: '-',
  stationCode: '-',
  status: 'pending',
  qualityResult: 'pending',
  defectType: '-',
  defectDescription: '-',
  taskIds: [],
  detectionDuration: 0,
  createdAt: '-',
  startedAt: '-',
  endedAt: '-',
};

function mapPositionVoToItem(vo: StationPositionVO, index: number): WorkstationPositionItem {
  const stationCode = vo.stationCode ?? `ST-${index + 1}`;
  return {
    id: String(vo.id),
    name: vo.name ?? `Station ${stationCode}`,
    stationCode,
    enabled: vo.enabled ?? true,
    todayInspectionCount: vo.todayInspectionCount ?? 0,
    detectionRate: vo.detectionRate ?? 0,
    reviewRate: vo.reviewRate ?? 0,
    robots: [],
    currentWorkOrder: { ...placeholderWorkOrder, stationCode },
    historyWorkOrders: [],
  };
}

function parseTime(value: string): number {
  if (value === '-') return 0;
  return new Date(value.replace(' ', 'T')).getTime();
}

function buildMockList(): WorkstationPositionItem[] {
  const stationOptions = getStationCodeOptions();
  const normalized = workstationPositionList.map((item, index) => {
    const stationCode = normalizeStationCode(item.stationCode, index);
    return {
      ...item,
      stationCode,
      name: `Station ${stationCode}`,
      currentWorkOrder: {
        ...item.currentWorkOrder,
        fixtureLineType: normalizeHarnessType(item.currentWorkOrder.fixtureLineType, index),
        stationCode,
      },
      historyWorkOrders: item.historyWorkOrders.map((wo, hi) => ({
        ...wo,
        fixtureLineType: normalizeHarnessType(wo.fixtureLineType, index + hi),
        stationCode,
      })),
    };
  });

  const existingStationCodes = new Set(normalized.map((item) => item.stationCode));
  const template = normalized[0];
  const appended = stationOptions
    .filter((stationCode) => !existingStationCodes.has(stationCode))
    .map((stationCode, index) => ({
      ...(template ?? workstationPositionList[0]),
      id: `PS-CFG-${index + 1}`,
      name: `Station ${stationCode}`,
      stationCode,
      enabled: true,
      todayInspectionCount: 60 + index * 11,
      detectionRate: 95 + (index % 4),
      reviewRate: 93 + (index % 5),
      currentWorkOrder: {
        ...(template?.currentWorkOrder ?? workstationPositionList[0].currentWorkOrder),
        workOrderNo: `WO-CFG-${String(index + 1).padStart(3, '0')}`,
        stationCode,
        fixtureLineType: normalizeHarnessType((template?.currentWorkOrder ?? workstationPositionList[0].currentWorkOrder).fixtureLineType, index),
        defectType: '-',
        defectDescription: '-',
      },
    }));

  return [...normalized, ...appended];
}

type RobotStatusEvent = {
  robotCode: string;
  stationCode?: string;
  status?: RobotStatus;
  battery?: number;
  abnormalInfo?: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function getString(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function getNumber(record: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return undefined;
}

function normalizeRobotStatus(value: unknown): RobotStatus | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const text = value.trim().toLowerCase();
  if (!text) {
    return undefined;
  }
  if (text.includes('offline') || text.includes('disconnect')) {
    return 'offline';
  }
  if (text.includes('fault') || text.includes('error') || text.includes('alarm') || text.includes('abnormal')) {
    return 'fault';
  }
  if (text.includes('work') || text.includes('run') || text.includes('busy') || text.includes('processing')) {
    return 'working';
  }
  if (text.includes('idle') || text.includes('ready') || text.includes('standby') || text.includes('charge')) {
    return 'idle';
  }

  return undefined;
}

function clampBattery(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

function toStationKey(value: string): string {
  return value.trim().toUpperCase();
}

function extractRobotStatusEvents(payload: unknown): RobotStatusEvent[] {
  const candidates: Record<string, unknown>[] = [];

  const appendCandidate = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        const record = asRecord(item);
        if (record) {
          candidates.push(record);
        }
      });
      return;
    }

    const record = asRecord(value);
    if (record) {
      candidates.push(record);
    }
  };

  appendCandidate(payload);

  const root = asRecord(payload);
  if (root) {
    ['data', 'payload', 'list', 'items', 'events'].forEach((key) => appendCandidate(root[key]));
  }

  const updates: RobotStatusEvent[] = [];
  candidates.forEach((record) => {
    const robotCode = getString(record, ['robotCode', 'robot_code', 'robotId', 'robot_id', 'code']);
    if (!robotCode) {
      return;
    }

    const stationCode = getString(record, ['stationCode', 'station_code', 'positionCode', 'position_code', 'workstationCode', 'workstation_code']);
    const status = normalizeRobotStatus(record.status ?? record.robotStatus ?? record.robot_status ?? record.state);
    const battery = getNumber(record, ['battery', 'batteryPct', 'batteryLevel', 'battery_level', 'battery_percent']);
    const abnormalInfo = getString(record, ['abnormalInfo', 'abnormal_info', 'abnormal', 'faultInfo', 'fault_info', 'errorMessage', 'error_message', 'message', 'alarm']);

    updates.push({
      robotCode,
      stationCode,
      status,
      battery,
      abnormalInfo,
    });
  });

  return updates;
}

function applyRobotStatusEvents(positionList: WorkstationPositionItem[], updates: RobotStatusEvent[]): WorkstationPositionItem[] {
  if (updates.length === 0 || positionList.length === 0) {
    return positionList;
  }

  const next = [...positionList];

  const ensureMutablePosition = (index: number): WorkstationPositionItem => {
    const current = next[index];
    if (current === positionList[index]) {
      next[index] = {
        ...current,
        robots: [...current.robots],
      };
    }
    return next[index];
  };

  updates.forEach((update) => {
    const stationKey = update.stationCode ? toStationKey(update.stationCode) : '';

    let positionIndex = -1;
    if (stationKey) {
      positionIndex = next.findIndex((position) => toStationKey(position.stationCode) === stationKey);
    }

    if (positionIndex < 0) {
      positionIndex = next.findIndex((position) => position.robots.some((robot) => robot.robotCode === update.robotCode));
    }

    if (positionIndex < 0) {
      return;
    }

    const position = ensureMutablePosition(positionIndex);
    const robotIndex = position.robots.findIndex((robot) => robot.robotCode === update.robotCode);

    if (robotIndex >= 0) {
      const currentRobot = position.robots[robotIndex];
      const nextStatus = update.status ?? currentRobot.status;
      const nextBattery = update.battery != null ? clampBattery(update.battery) : currentRobot.battery;
      const nextAbnormalInfo = update.abnormalInfo ?? (nextStatus === 'fault' ? 'Realtime fault detected' : currentRobot.abnormalInfo || 'None');

      if (currentRobot.status === nextStatus && currentRobot.battery === nextBattery && currentRobot.abnormalInfo === nextAbnormalInfo) {
        return;
      }

      position.robots[robotIndex] = {
        ...currentRobot,
        status: nextStatus,
        battery: nextBattery,
        abnormalInfo: nextAbnormalInfo,
      };
      return;
    }

    position.robots.push({
      robotCode: update.robotCode,
      status: update.status ?? (position.enabled ? 'idle' : 'offline'),
      battery: clampBattery(update.battery ?? 0),
      abnormalInfo: update.abnormalInfo ?? 'None',
    });
  });

  return next;
}

export function useWorkstationPositionManage() {
  const defectTypeOptions = useMemo(() => ['\u63A5\u7EBF\u9519\u8BEF', '\u5916\u89C2\u5F02\u5E38', '\u5DE5\u827A\u504F\u5DEE', '\u5C3A\u5BF8\u504F\u5DEE', '\u538B\u63A5\u4E0D\u826F'], []);
  const mockFallback = useMemo(() => buildMockList(), []);

  const [positionList, setPositionList] = useState<WorkstationPositionItem[]>(mockFallback);
  const [selectedPositionId, setSelectedPositionId] = useState<string>(mockFallback[0]?.id ?? '');
  const latestRobotStatusEvent = useRealtimeStore((state) => state.latestEvents.robot_status);

  const positionsQuery = useQuery({
    queryKey: qcBusinessQueryKeys.stationPositions('all', 1, 200),
    queryFn: async () => {
      const res = await getStationPositionsApi({ pageNum: 1, pageSize: 200 });
      return (res.data?.list ?? []).map((vo, index) => mapPositionVoToItem(vo, index));
    },
  });

  useEffect(() => {
    const apiList = positionsQuery.data ?? [];
    if (apiList.length > 0) {
      setPositionList(apiList);
      if (!apiList.some((item) => item.id === selectedPositionId)) {
        setSelectedPositionId(apiList[0]?.id ?? '');
      }
      return;
    }

    if (!positionsQuery.isLoading && !positionsQuery.isFetching) {
      setPositionList(mockFallback);
      if (!mockFallback.some((item) => item.id === selectedPositionId)) {
        setSelectedPositionId(mockFallback[0]?.id ?? '');
      }
    }
  }, [mockFallback, positionsQuery.data, positionsQuery.isFetching, positionsQuery.isLoading, selectedPositionId]);

  useEffect(() => {
    if (!latestRobotStatusEvent) {
      return;
    }

    const updates = extractRobotStatusEvents(latestRobotStatusEvent.payload);
    if (updates.length === 0) {
      return;
    }

    setPositionList((prev) => applyRobotStatusEvents(prev, updates));
  }, [latestRobotStatusEvent]);

  const selectedPosition = useMemo(
    () => positionList.find((item) => item.id === selectedPositionId) ?? positionList[0],
    [positionList, selectedPositionId],
  );

  const positionRank = useMemo(() => {
    if (!selectedPosition) return 0;
    const sorted = [...positionList].sort((a, b) => b.todayInspectionCount - a.todayInspectionCount);
    const rankIndex = sorted.findIndex((item) => item.id === selectedPosition.id);
    return rankIndex >= 0 ? rankIndex + 1 : 0;
  }, [positionList, selectedPosition]);

  const historyWorkOrders = useMemo<WorkOrderInfo[]>(() => {
    if (!selectedPosition) return [];
    return [...selectedPosition.historyWorkOrders].sort((a, b) => parseTime(b.createdAt) - parseTime(a.createdAt));
  }, [selectedPosition]);

  const emergencyStopRobot = useCallback(
    (robotCode: string) => {
      if (!selectedPosition) return;
      setPositionList((prev) =>
        prev.map((item) =>
          item.id === selectedPosition.id
            ? {
                ...item,
                robots: item.robots.map((robot) =>
                  robot.robotCode === robotCode
                    ? {
                        ...robot,
                        status: 'fault' as const,
                        abnormalInfo: 'Emergency stop triggered, manual reset required',
                        battery: Math.max(robot.battery - 2, 0),
                      }
                    : robot,
                ),
              }
            : item,
        ),
      );
    },
    [selectedPosition],
  );

  const resetRobot = useCallback(
    (robotCode: string) => {
      if (!selectedPosition) return;
      setPositionList((prev) =>
        prev.map((item) =>
          item.id === selectedPosition.id
            ? {
                ...item,
                robots: item.robots.map((robot) =>
                  robot.robotCode === robotCode
                    ? {
                        ...robot,
                        status: item.enabled ? ('idle' as const) : ('offline' as const),
                        abnormalInfo: 'None',
                      }
                    : robot,
                ),
              }
            : item,
        ),
      );
    },
    [selectedPosition],
  );

  const reviewCurrentWorkOrder = useCallback(
    (payload: CurrentWorkOrderReviewPayload) => {
      if (!selectedPosition) return;
      setPositionList((prev) =>
        prev.map((item) =>
          item.id === selectedPosition.id
            ? {
                ...item,
                currentWorkOrder: {
                  ...item.currentWorkOrder,
                  status: payload.qualityResult === 'ng' ? 'ng' : 'finished',
                  qualityResult: payload.qualityResult,
                  defectType: payload.qualityResult === 'ng' ? payload.defectType || '-' : '-',
                  defectDescription: payload.qualityResult === 'ng' ? payload.defectDescription || '-' : '-',
                  endedAt: item.currentWorkOrder.endedAt === '-' ? '2026-02-28 10:12:00' : item.currentWorkOrder.endedAt,
                },
              }
            : item,
        ),
      );
    },
    [selectedPosition],
  );

  return {
    positionList,
    loading: positionsQuery.isLoading || positionsQuery.isFetching,
    selectedPositionId,
    setSelectedPositionId,
    selectedPosition,
    positionRank,
    historyWorkOrders,
    defectTypeOptions,
    emergencyStopRobot,
    resetRobot,
    reviewCurrentWorkOrder,
  };
}
