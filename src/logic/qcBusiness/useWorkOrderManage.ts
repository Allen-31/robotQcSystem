import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelWorkOrderApi,
  createWorkOrderApi,
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
import { qcBusinessQueryKeys } from '../../shared/api/queryKeys';
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
  startedAt?: string;
  endedAt?: string;
  defectType?: string;
  defectDescription?: string;
}

export function useWorkOrderManage() {
  const queryClient = useQueryClient();
  const harnessTypeOptions = useMemo(() => getHarnessTypeOptions(), []);
  const stationCodeOptions = useMemo(() => getStationCodeOptions(), []);
  const defectTypeOptions = useMemo(() => ['接线错误', '外观异常', '工艺偏差', '尺寸偏差', '压接不良'], []);

  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [viewingWorkOrder, setViewingWorkOrder] = useState<WorkOrderItem | null>(null);
  const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrderItem | null>(null);

  const listQuery = useQuery({
    queryKey: qcBusinessQueryKeys.workOrders({ keyword: keyword.trim(), page, pageSize }),
    queryFn: async () => {
      const res = await getWorkOrderListApi({
        keyword: keyword.trim() || undefined,
        pageNum: page,
        pageSize,
      });
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: createWorkOrderApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qcBusinessQueryKeys.all }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Parameters<typeof updateWorkOrderApi>[1] }) => updateWorkOrderApi(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qcBusinessQueryKeys.all }),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: WorkOrderReviewPayload }) => reviewWorkOrderApi(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qcBusinessQueryKeys.all }),
  });

  const pauseMutation = useMutation({
    mutationFn: (id: number) => pauseWorkOrderApi(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qcBusinessQueryKeys.all }),
  });

  const resumeMutation = useMutation({
    mutationFn: (id: number) => resumeWorkOrderApi(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qcBusinessQueryKeys.all }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => cancelWorkOrderApi(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qcBusinessQueryKeys.all }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteWorkOrderApi(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qcBusinessQueryKeys.all }),
  });

  const list = useMemo(() => (listQuery.data?.list ?? []).map((vo) => mapWorkOrderVoToItem(vo)), [listQuery.data?.list]);
  const total = listQuery.data?.total ?? 0;

  const operationWorkOrders = useMemo(
    () => list.filter((item) => ['pending', 'running', 'paused'].includes(item.status)),
    [list],
  );

  const rawWorkOrders = list;

  const fetchList = useCallback(async () => {
    await listQuery.refetch();
  }, [listQuery]);

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

  const refreshDetail = useCallback(
    async (id: number) => {
      try {
        const res = await getWorkOrderDetailApi(id);
        const item = mapWorkOrderVoToItem(res.data);
        setViewingWorkOrder((prev) => (prev?.id === id ? item : prev));
        setEditingWorkOrder((prev) => (prev?.id === id ? item : prev));
      } catch {
        // ignore
      }
    },
    [],
  );

  const reviewWorkOrder = useCallback(
    async (id: number, payload: WorkOrderReviewPayload) => {
      await reviewMutation.mutateAsync({ id, payload });
      await refreshDetail(id);
      await fetchList();
    },
    [fetchList, refreshDetail, reviewMutation],
  );

  const pauseWorkOrder = useCallback(
    async (id: number) => {
      await pauseMutation.mutateAsync(id);
      await refreshDetail(id);
      await fetchList();
    },
    [fetchList, pauseMutation, refreshDetail],
  );

  const resumeWorkOrder = useCallback(
    async (id: number) => {
      await resumeMutation.mutateAsync(id);
      await refreshDetail(id);
      await fetchList();
    },
    [fetchList, refreshDetail, resumeMutation],
  );

  const cancelWorkOrder = useCallback(
    async (id: number) => {
      await cancelMutation.mutateAsync(id);
      await refreshDetail(id);
      await fetchList();
    },
    [cancelMutation, fetchList, refreshDetail],
  );

  const removeWorkOrder = useCallback(
    async (id: number) => {
      await deleteMutation.mutateAsync(id);
      setViewingWorkOrder((prev) => (prev?.id === id ? null : prev));
      setEditingWorkOrder((prev) => (prev?.id === id ? null : prev));
      await fetchList();
    },
    [deleteMutation, fetchList],
  );

  const saveEdit = useCallback(
    async (payload: WorkOrderEditPayload) => {
      const taskIds = payload.taskIdsRaw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await updateMutation.mutateAsync({
        id: payload.id,
        body: {
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
        },
      });

      setEditingWorkOrder(null);
      await refreshDetail(payload.id);
      await fetchList();
    },
    [fetchList, refreshDetail, updateMutation],
  );

  const createWorkOrder = useCallback(
    async (payload: WorkOrderCreatePayload) => {
      const taskIds = payload.taskIdsRaw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await createMutation.mutateAsync({
        workOrderNo: payload.workOrderNo,
        harnessCode: payload.harnessCode,
        harnessType: payload.harnessType,
        stationCode: payload.stationCode,
        status: payload.status,
        qualityResult: payload.qualityResult,
        taskIds,
        movingDuration: payload.movingDuration,
        detectionDuration: payload.detectionDuration,
        startedAt: payload.startedAt?.trim() || undefined,
        endedAt: payload.endedAt?.trim() || undefined,
        defectType: payload.defectType?.trim() || undefined,
        defectDescription: payload.defectDescription?.trim() || undefined,
      });

      await fetchList();
    },
    [createMutation, fetchList],
  );

  const importWorkOrders = useCallback(
    async (rows: Omit<WorkOrderItem, 'id'>[]) => {
      if (rows.length === 0) return 0;

      let imported = 0;
      for (const [index, row] of rows.entries()) {
        try {
          await createMutation.mutateAsync({
            workOrderNo: row.workOrderNo,
            harnessCode: row.harnessCode,
            harnessType: normalizeHarnessType(row.harnessType, index),
            stationCode: normalizeStationCode(row.stationCode, index),
            status: row.status,
            qualityResult: row.qualityResult,
            taskIds: row.taskIds,
            movingDuration: row.movingDuration,
            detectionDuration: row.detectionDuration,
            startedAt: row.startedAt && row.startedAt !== '-' ? row.startedAt : undefined,
            endedAt: row.endedAt && row.endedAt !== '-' ? row.endedAt : undefined,
            defectType: row.defectType && row.defectType !== '-' ? row.defectType : undefined,
            defectDescription: row.defectDescription && row.defectDescription !== '-' ? row.defectDescription : undefined,
          });
          imported += 1;
        } catch {
          // ignore failed rows; continue importing others
        }
      }

      if (imported > 0) {
        await fetchList();
      }
      return imported;
    },
    [createMutation, fetchList],
  );

  return {
    workOrders: operationWorkOrders,
    operationWorkOrders,
    rawWorkOrders,
    total,
    loading: listQuery.isLoading || listQuery.isFetching,
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
    createWorkOrder,
    importWorkOrders,
  };
}
