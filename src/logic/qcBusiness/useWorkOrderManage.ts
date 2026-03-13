import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  cancelWorkOrderApi,
  deleteWorkOrderApi,
  getWorkOrderDetailApi,
  getWorkOrderListApi,
  mapWorkOrderVoToItem,
  pauseWorkOrderApi,
  resumeWorkOrderApi,
  reviewWorkOrderApi,
  updateWorkOrderApi,
} from '../../shared/api/qcBusinessApi';
import { getHarnessTypeOptions, getStationCodeOptions, normalizeHarnessType, normalizeStationCode } from '../../data/qcBusiness/qcConfigReference';
import type { QualityResult, WorkOrderStatus } from '../../data/qcBusiness/workOrderList';

export interface WorkOrderItem {
  id: number;
  workOrderNo: string;
  harnessCode: string;
  harnessType: string;
  stationCode: string;
  status: WorkOrderStatus;
  qualityResult: QualityResult;
  taskIds: string[];
  movingDuration: number;
  detectionDuration: number;
  createdAt: string;
  startedAt: string;
  endedAt: string;
  defectType: string;
  defectDescription: string;
}

export interface WorkOrderEditPayload {
  id: number;
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

export function useWorkOrderManage() {
  const harnessTypeOptions = useMemo(() => getHarnessTypeOptions(), []);
  const stationCodeOptions = useMemo(() => getStationCodeOptions(), []);
  const defectTypeOptions = useMemo(() => ['接线错误', '外观异常', '工艺偏差', '尺寸偏差', '压接不良'], []);

  const [list, setList] = useState<WorkOrderItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [viewingWorkOrder, setViewingWorkOrder] = useState<WorkOrderItem | null>(null);
  const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrderItem | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getWorkOrderListApi({
        keyword: keyword.trim() || undefined,
        pageNum: page,
        pageSize,
      });
      const data = res.data;
      const items = (data?.list ?? []).map((vo) => mapWorkOrderVoToItem(vo));
      setList(items);
      setTotal(data?.total ?? 0);
    } catch {
      setList([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [keyword, page, pageSize]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  /** 工单管理-仅显示未执行、执行中、已暂停的工单（不含已完成/已取消等） */
  const operationWorkOrders = useMemo(
    () => list.filter((item) => ['pending', 'running', 'paused'].includes(item.status)),
    [list],
  );

  const rawWorkOrders = list;

  const openDetail = useCallback((record: WorkOrderItem) => {
    setViewingWorkOrder(record);
  }, []);

  const closeDetail = useCallback(() => {
    setViewingWorkOrder(null);
  }, []);

  const openEdit = useCallback((record: WorkOrderItem) => {
    setEditingWorkOrder(record);
  }, []);

  const closeEdit = useCallback(() => {
    setEditingWorkOrder(null);
  }, []);

  const refreshDetail = useCallback(async (id: number) => {
    try {
      const res = await getWorkOrderDetailApi(id);
      const item = mapWorkOrderVoToItem(res.data);
      setViewingWorkOrder((prev) => (prev?.id === id ? item : prev));
      setList((prev) => prev.map((x) => (x.id === id ? item : x)));
    } catch {
      // ignore
    }
  }, []);

  const reviewWorkOrder = useCallback(
    async (id: number, payload: WorkOrderReviewPayload) => {
      await reviewWorkOrderApi(id, payload);
      await refreshDetail(id);
      await fetchList();
    },
    [fetchList, refreshDetail],
  );

  const pauseWorkOrder = useCallback(
    async (id: number) => {
      await pauseWorkOrderApi(id);
      await refreshDetail(id);
      await fetchList();
    },
    [fetchList, refreshDetail],
  );

  const resumeWorkOrder = useCallback(
    async (id: number) => {
      await resumeWorkOrderApi(id);
      await refreshDetail(id);
      await fetchList();
    },
    [fetchList, refreshDetail],
  );

  const cancelWorkOrder = useCallback(
    async (id: number) => {
      await cancelWorkOrderApi(id);
      await refreshDetail(id);
      await fetchList();
    },
    [fetchList, refreshDetail],
  );

  const removeWorkOrder = useCallback(
    async (id: number) => {
      await deleteWorkOrderApi(id);
      setViewingWorkOrder((prev) => (prev?.id === id ? null : prev));
      setEditingWorkOrder((prev) => (prev?.id === id ? null : prev));
      await fetchList();
    },
    [fetchList],
  );

  const saveEdit = useCallback(
    async (payload: WorkOrderEditPayload) => {
      const taskIds = payload.taskIdsRaw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      await updateWorkOrderApi(payload.id, {
        harnessCode: payload.harnessCode,
        harnessType: payload.harnessType,
        stationCode: payload.stationCode,
        status: payload.status,
        qualityResult: payload.qualityResult,
        taskIds,
        movingDuration: payload.movingDuration,
        detectionDuration: payload.detectionDuration,
        startedAt: payload.startedAt || undefined,
        endedAt: payload.endedAt || undefined,
        defectType: payload.defectType || undefined,
        defectDescription: payload.defectDescription || undefined,
      });
      setEditingWorkOrder(null);
      await refreshDetail(payload.id);
      await fetchList();
    },
    [fetchList, refreshDetail],
  );

  return {
    workOrders: operationWorkOrders,
    operationWorkOrders,
    rawWorkOrders,
    total,
    loading,
    page,
    setPage,
    pageSize,
    setPageSize,
    fetchList,
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
  };
}
