import { useMemo, useState } from 'react';
import { getStationCodeOptions, normalizeHarnessType, normalizeStationCode } from '../../data/qcBusiness/qcConfigReference';
import { workstationPositionList, type WorkOrderInfo, type WorkstationPositionItem } from '../../data/qcBusiness/workstationPositionList';

function parseTime(value: string): number {
  if (value === '-') {
    return 0;
  }
  return new Date(value.replace(' ', 'T')).getTime();
}

export function useWorkstationPositionManage() {
  const [positionList, setPositionList] = useState<WorkstationPositionItem[]>(() => {
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
        historyWorkOrders: item.historyWorkOrders.map((workOrder, historyIndex) => ({
          ...workOrder,
          fixtureLineType: normalizeHarnessType(workOrder.fixtureLineType, index + historyIndex),
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
        },
      }));

    return [...normalized, ...appended];
  });
  const [selectedPositionId, setSelectedPositionId] = useState<string>(positionList[0]?.id ?? '');

  const selectedPosition = useMemo(
    () => positionList.find((item) => item.id === selectedPositionId) ?? positionList[0],
    [positionList, selectedPositionId],
  );

  const positionRank = useMemo(() => {
    if (!selectedPosition) {
      return 0;
    }
    const sorted = [...positionList].sort((a, b) => b.todayInspectionCount - a.todayInspectionCount);
    const rankIndex = sorted.findIndex((item) => item.id === selectedPosition.id);
    return rankIndex >= 0 ? rankIndex + 1 : 0;
  }, [positionList, selectedPosition]);

  const historyWorkOrders = useMemo<WorkOrderInfo[]>(() => {
    if (!selectedPosition) {
      return [];
    }
    return [...selectedPosition.historyWorkOrders].sort((a, b) => parseTime(b.createdAt) - parseTime(a.createdAt));
  }, [selectedPosition]);

  const emergencyStopRobot = (robotCode: string) => {
    if (!selectedPosition) {
      return;
    }

    setPositionList((prev) =>
      prev.map((item) =>
        item.id === selectedPosition.id
          ? {
              ...item,
              robots: item.robots.map((robot) =>
                robot.robotCode === robotCode
                  ? {
                      ...robot,
                      status: 'fault',
                      abnormalInfo: 'Emergency stop triggered, manual reset required',
                      battery: Math.max(robot.battery - 2, 0),
                    }
                  : robot,
              ),
            }
          : item,
      ),
    );
  };

  const resetRobot = (robotCode: string) => {
    if (!selectedPosition) {
      return;
    }

    setPositionList((prev) =>
      prev.map((item) =>
        item.id === selectedPosition.id
          ? {
              ...item,
              robots: item.robots.map((robot) =>
                robot.robotCode === robotCode
                  ? {
                      ...robot,
                      status: item.enabled ? 'idle' : 'offline',
                      abnormalInfo: 'None',
                    }
                  : robot,
              ),
            }
          : item,
      ),
    );
  };

  const reviewCurrentWorkOrder = () => {
    if (!selectedPosition) {
      return;
    }

    setPositionList((prev) =>
      prev.map((item) =>
        item.id === selectedPosition.id
          ? {
              ...item,
              currentWorkOrder: {
                ...item.currentWorkOrder,
                status: 'finished',
                qualityResult: 'ok',
                endedAt: item.currentWorkOrder.endedAt === '-' ? '2026-02-28 10:12:00' : item.currentWorkOrder.endedAt,
              },
            }
          : item,
      ),
    );
  };

  return {
    positionList,
    selectedPositionId,
    setSelectedPositionId,
    selectedPosition,
    positionRank,
    historyWorkOrders,
    emergencyStopRobot,
    resetRobot,
    reviewCurrentWorkOrder,
  };
}
