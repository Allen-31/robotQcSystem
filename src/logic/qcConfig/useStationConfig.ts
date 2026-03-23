import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createStationConfigApi,
  deleteStationConfigApi,
  getStationConfigListApi,
  updateStationConfigApi,
  type StationConfigVO,
} from '../../shared/api/qcConfigApi';
import { qcConfigQueryKeys } from '../../shared/api/queryKeys';
import type { StationConfig } from '../../shared/types/qcConfig';

export type StationConfigPayload = StationConfig;

function normalizeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && 'list' in data) return ((data as { list: T[] }).list) ?? [];
  return [];
}

export function useStationConfig() {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState('');

  const listQuery = useQuery({
    queryKey: qcConfigQueryKeys.stationConfigs,
    queryFn: async () => {
      const res = await getStationConfigListApi({ pageNum: 1, pageSize: 500 });
      return normalizeList<StationConfigVO>(res.data);
    },
  });

  const createMutation = useMutation({
    mutationFn: createStationConfigApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qcConfigQueryKeys.all }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<StationConfig> }) => updateStationConfigApi(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qcConfigQueryKeys.all }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteStationConfigApi(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qcConfigQueryKeys.all }),
  });

  const records = useMemo(() => listQuery.data ?? [], [listQuery.data]);

  const filteredList = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return records;
    return records.filter(
      (item) =>
        `${item.workstationId} ${item.stationId} ${item.mapPoint} ${item.callBoxCode} ${item.wireHarnessType}`
          .toLowerCase()
          .includes(normalized),
    );
  }, [keyword, records]);

  const fetchList = useCallback(async () => {
    await listQuery.refetch();
  }, [listQuery]);

  const createRecord = useCallback(
    async (payload: StationConfigPayload) => {
      await createMutation.mutateAsync(payload);
      await fetchList();
    },
    [createMutation, fetchList],
  );

  const updateRecord = useCallback(
    async (payload: StationConfigVO) => {
      if (payload.id == null) return;
      await updateMutation.mutateAsync({ id: payload.id, body: payload });
      await fetchList();
    },
    [fetchList, updateMutation],
  );

  const removeRecord = useCallback(
    async (id: number) => {
      await deleteMutation.mutateAsync(id);
      await fetchList();
    },
    [deleteMutation, fetchList],
  );

  const toggleEnabled = useCallback(
    async (id: number) => {
      const current = records.find((item) => item.id === id);
      if (!current) return;
      await updateMutation.mutateAsync({ id, body: { enabled: !current.enabled } });
      await fetchList();
    },
    [fetchList, records, updateMutation],
  );

  return {
    records,
    filteredList,
    loading: listQuery.isLoading || listQuery.isFetching,
    keyword,
    setKeyword,
    fetchList,
    createRecord,
    updateRecord,
    removeRecord,
    toggleEnabled,
  };
}

