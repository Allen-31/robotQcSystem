import { useCallback, useEffect, useMemo, useState } from 'react';
import { getStationCodeOptions, normalizeHarnessType, normalizeStationCode } from '../../data/qcBusiness/qcConfigReference';
import { workstationPositionList, type WorkOrderInfo, type WorkstationPositionItem } from '../../data/qcBusiness/workstationPositionList';
import { getStationPositionsApi, type StationPositionVO } from '../../shared/api/qcInspectionApi';

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

export function useWorkstationPositionManage() {
  const defectTypeOptions = useMemo(() => ['接线错误', '外观异常', '工艺偏差', '尺寸偏差', '压接不良'], []);
  const mockFallback = useMemo(() => buildMockList(), []);
  const [positionList, setPositionList] = useState<WorkstationPositionItem[]>(mockFallback);
  const [loading, setLoading] = useState(true);
  const [selectedPositionId, setSelectedPositionId] = useState<string>(mockFallback[0]?.id ?? '');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getStationPositionsApi({ pageNum: 1, pageSize: 200 })
      .then((res) => {
        if (cancelled) return;
        const list = res.data?.list ?? [];
        if (list.length > 0) {
          const mapped = list.map((vo, index) => mapPositionVoToItem(vo, index));
          setPositionList(mapped);
          const firstId = mapped[0]?.id ?? '';
          if (!mapped.some((p) => p.id === selectedPositionId)) {
            setSelectedPositionId(firstId);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setPositionList(mockFallback);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  const emergencyStopRobot = useCallback((robotCode: string) => {
    if (!selectedPosition) return;
    setPositionList((prev) =>
      prev.map((item) =>
        item.id === selectedPosition.id
          ? {
              ...item,
              robots: item.robots.map((robot) =>
                robot.robotCode === robotCode
                  ? { ...robot, status: 'fault' as const, abnormalInfo: 'Emergency stop triggered, manual reset required', battery: Math.max(robot.battery - 2, 0) }
                  : robot,
              ),
            }
          : item,
      ),
    );
  }, [selectedPosition]);

  const resetRobot = useCallback((robotCode: string) => {
    if (!selectedPosition) return;
    setPositionList((prev) =>
      prev.map((item) =>
        item.id === selectedPosition.id
          ? {
              ...item,
              robots: item.robots.map((robot) =>
                robot.robotCode === robotCode ? { ...robot, status: item.enabled ? ('idle' as const) : ('offline' as const), abnormalInfo: 'None' } : robot,
              ),
            }
          : item,
      ),
    );
  }, [selectedPosition]);

  const reviewCurrentWorkOrder = useCallback((payload: CurrentWorkOrderReviewPayload) => {
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
  }, [selectedPosition]);

  return {
    positionList,
    loading,
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
