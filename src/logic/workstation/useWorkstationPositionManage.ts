import { useMemo, useState } from 'react';
import { workstationPositionList, type WorkOrderInfo, type WorkstationPositionItem } from '../../data/workstationPositionList';

function parseTime(value: string): number {
  if (value === '-') {
    return 0;
  }
  return new Date(value.replace(' ', 'T')).getTime();
}

export function useWorkstationPositionManage() {
  const [positionList, setPositionList] = useState<WorkstationPositionItem[]>(workstationPositionList);
  const [selectedPositionId, setSelectedPositionId] = useState<string>(workstationPositionList[0]?.id ?? '');

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
