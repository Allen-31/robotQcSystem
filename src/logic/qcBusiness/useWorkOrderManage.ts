import { useMemo, useState } from 'react';
import { getHarnessTypeOptions, getStationCodeOptions, normalizeHarnessType, normalizeStationCode } from '../../data/qcBusiness/qcConfigReference';
import { workOrderList, type QualityResult, type WorkOrderItem, type WorkOrderStatus } from '../../data/qcBusiness/workOrderList';

export interface WorkOrderEditPayload {
  id: string;
  harnessCode: string;
  harnessType: string;
  stationCode: string;
  status: WorkOrderStatus;
  qualityResult: QualityResult;
  taskIdsRaw: string;
  movingDuration: number;
  detectionDuration: number;
  startedAt: string;
  endedAt: string;
  defectType: string;
  defectDescription: string;
}

export interface WorkOrderCreatePayload {
  workOrderNo: string;
  harnessCode: string;
  harnessType: string;
  stationCode: string;
  status: WorkOrderStatus;
  qualityResult: QualityResult;
  taskIdsRaw: string;
  movingDuration: number;
  detectionDuration: number;
  startedAt: string;
  endedAt: string;
  defectType: string;
  defectDescription: string;
}

export interface WorkOrderReviewPayload {
  qualityResult: QualityResult;
  defectType?: string;
  defectDescription?: string;
}

function parseTime(value: string): number {
  if (value === '-') {
    return 0;
  }
  return new Date(value.replace(' ', 'T')).getTime();
}

export function useWorkOrderManage() {
  const harnessTypeOptions = useMemo(() => getHarnessTypeOptions(), []);
  const stationCodeOptions = useMemo(() => getStationCodeOptions(), []);
  const defectTypeOptions = useMemo(() => ['接线错误', '外观异常', '工艺偏差', '尺寸偏差', '压接不良'], []);
  const [workOrders, setWorkOrders] = useState<WorkOrderItem[]>(() =>
    workOrderList.map((item, index) => ({
      ...item,
      harnessType: normalizeHarnessType(item.harnessType, index),
      stationCode: normalizeStationCode(item.stationCode, index),
    })),
  );
  const [viewingWorkOrder, setViewingWorkOrder] = useState<WorkOrderItem | null>(null);
  const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrderItem | null>(null);
  const [keyword, setKeyword] = useState('');

  const filteredAndSortedWorkOrders = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    const source = normalized
      ? workOrders.filter((item) => {
          const text =
            `${item.workOrderNo} ${item.harnessCode} ${item.harnessType} ${item.stationCode} ${item.status} ${item.qualityResult} ${item.taskIds.join(' ')} ${item.createdAt} ${item.defectType} ${item.defectDescription}`.toLowerCase();
          return text.includes(normalized);
        })
      : workOrders;

    return [...source].sort((a, b) => parseTime(b.createdAt) - parseTime(a.createdAt));
  }, [keyword, workOrders]);

  /** 工单管理-仅显示未执行、执行中、已暂停的工单（不含已完成/已取消等） */
  const operationWorkOrders = useMemo(
    () =>
      filteredAndSortedWorkOrders.filter((item) =>
        ['pending', 'running', 'paused'].includes(item.status),
      ),
    [filteredAndSortedWorkOrders],
  );

  const appendWorkOrders = (items: WorkOrderItem[]) => {
    setWorkOrders((prev) => {
      const map = new Map<string, WorkOrderItem>();
      for (const item of prev) {
        map.set(item.id, item);
      }
      for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        map.set(item.id, {
          ...item,
          harnessType: normalizeHarnessType(item.harnessType, index),
          stationCode: normalizeStationCode(item.stationCode, index),
          defectType: item.defectType || '-',
          defectDescription: item.defectDescription || '-',
        });
      }
      return Array.from(map.values());
    });
  };

  const openDetail = (record: WorkOrderItem) => {
    setViewingWorkOrder(record);
  };

  const closeDetail = () => {
    setViewingWorkOrder(null);
  };

  const openEdit = (record: WorkOrderItem) => {
    setEditingWorkOrder(record);
  };

  const closeEdit = () => {
    setEditingWorkOrder(null);
  };

  const reviewWorkOrder = (id: string, payload: WorkOrderReviewPayload) => {
    setWorkOrders((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: payload.qualityResult === 'ng' ? 'ng' : 'finished',
              qualityResult: payload.qualityResult,
              defectType: payload.qualityResult === 'ng' ? payload.defectType || '-' : '-',
              defectDescription: payload.qualityResult === 'ng' ? payload.defectDescription || '-' : '-',
            }
          : item,
      ),
    );
    setViewingWorkOrder((prev) =>
      prev && prev.id === id
        ? {
            ...prev,
            status: payload.qualityResult === 'ng' ? 'ng' : 'finished',
            qualityResult: payload.qualityResult,
            defectType: payload.qualityResult === 'ng' ? payload.defectType || '-' : '-',
            defectDescription: payload.qualityResult === 'ng' ? payload.defectDescription || '-' : '-',
          }
        : prev,
    );
  };

  const cancelWorkOrder = (id: string) => {
    setWorkOrders((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'cancelled',
              endedAt: item.endedAt === '-' ? '2026-02-28 11:20:00' : item.endedAt,
            }
          : item,
      ),
    );
  };

  const removeWorkOrder = (id: string) => {
    setWorkOrders((prev) => prev.filter((item) => item.id !== id));
  };

  const pauseWorkOrder = (id: string) => {
    setWorkOrders((prev) =>
      prev.map((item) => (item.id === id && item.status === 'running' ? { ...item, status: 'paused' as const } : item)),
    );
    setViewingWorkOrder((prev) =>
      prev && prev.id === id && prev.status === 'running' ? { ...prev, status: 'paused' as const } : prev,
    );
  };

  const resumeWorkOrder = (id: string) => {
    setWorkOrders((prev) =>
      prev.map((item) => (item.id === id && item.status === 'paused' ? { ...item, status: 'running' as const } : item)),
    );
    setViewingWorkOrder((prev) =>
      prev && prev.id === id && prev.status === 'paused' ? { ...prev, status: 'running' as const } : prev,
    );
  };

  const saveEdit = (payload: WorkOrderEditPayload) => {
    const taskIds = payload.taskIdsRaw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    setWorkOrders((prev) =>
      prev.map((item) =>
        item.id === payload.id
          ? {
              ...item,
              harnessCode: payload.harnessCode,
              harnessType: normalizeHarnessType(payload.harnessType),
              stationCode: normalizeStationCode(payload.stationCode),
              status: payload.status,
              qualityResult: payload.qualityResult,
              taskIds,
              movingDuration: payload.movingDuration,
              detectionDuration: payload.detectionDuration,
              startedAt: payload.startedAt || '-',
              endedAt: payload.endedAt || '-',
              defectType: payload.defectType || '-',
              defectDescription: payload.defectDescription || '-',
            }
          : item,
      ),
    );
    setEditingWorkOrder(null);
    setViewingWorkOrder((prev) =>
      prev && prev.id === payload.id
        ? {
            ...prev,
            harnessCode: payload.harnessCode,
            harnessType: normalizeHarnessType(payload.harnessType),
            stationCode: normalizeStationCode(payload.stationCode),
            status: payload.status,
            qualityResult: payload.qualityResult,
            taskIds,
            movingDuration: payload.movingDuration,
            detectionDuration: payload.detectionDuration,
            startedAt: payload.startedAt || '-',
            endedAt: payload.endedAt || '-',
            defectType: payload.defectType || '-',
            defectDescription: payload.defectDescription || '-',
          }
        : prev,
    );
  };

  const createWorkOrder = (payload: WorkOrderCreatePayload) => {
    const taskIds = payload.taskIdsRaw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    const record: WorkOrderItem = {
      id: `WO-${Date.now()}`,
      workOrderNo: payload.workOrderNo,
      harnessCode: payload.harnessCode,
      harnessType: normalizeHarnessType(payload.harnessType),
      stationCode: normalizeStationCode(payload.stationCode),
      status: payload.status,
      qualityResult: payload.qualityResult,
      taskIds,
      movingDuration: payload.movingDuration,
      detectionDuration: payload.detectionDuration,
      createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      startedAt: payload.startedAt || '-',
      endedAt: payload.endedAt || '-',
      defectType: payload.defectType || '-',
      defectDescription: payload.defectDescription || '-',
    };
    setWorkOrders((prev) => [record, ...prev]);
  };

  return {
    workOrders: filteredAndSortedWorkOrders,
    operationWorkOrders,
    rawWorkOrders: workOrders,
    harnessTypeOptions,
    stationCodeOptions,
    defectTypeOptions,
    keyword,
    setKeyword,
    viewingWorkOrder,
    editingWorkOrder,
    openDetail,
    closeDetail,
    openEdit,
    closeEdit,
    reviewWorkOrder,
    pauseWorkOrder,
    resumeWorkOrder,
    cancelWorkOrder,
    removeWorkOrder,
    saveEdit,
    createWorkOrder,
    appendWorkOrders,
  };
}
