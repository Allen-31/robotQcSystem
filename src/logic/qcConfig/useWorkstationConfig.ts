import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createWorkstationConfigApi,
  deleteWorkstationConfigApi,
  getWorkstationConfigListApi,
  updateWorkstationConfigApi,
} from '../../shared/api/qcConfigApi';
import { qcConfigQueryKeys } from '../../shared/api/queryKeys';
import type { WorkstationConfig } from '../../shared/types/qcConfig';

export type WorkstationConfigPayload = WorkstationConfig;

function normalizeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && 'list' in data) return ((data as { list: T[] }).list) ?? [];
  return [];
}

export function useWorkstationConfig() {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState('');

  const listQuery = useQuery({
    queryKey: qcConfigQueryKeys.workstationConfigs(keyword.trim()),
    queryFn: async () => {
      const res = await getWorkstationConfigListApi({
        pageNum: 1,
        pageSize: 500,
        keyword: keyword.trim() || undefined,
      });
      return normalizeList<WorkstationConfig>(res.data);
    },
  });

  const createMutation = useMutation({
    mutationFn: createWorkstationConfigApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qcConfigQueryKeys.all }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: number | string; body: Partial<WorkstationConfig> }) => updateWorkstationConfigApi(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qcConfigQueryKeys.all }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number | string) => deleteWorkstationConfigApi(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qcConfigQueryKeys.all }),
  });

  const records = useMemo(() => listQuery.data ?? [], [listQuery.data]);

  const filteredList = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return records;
    return records.filter((item) =>
      `${item.id} ${item.name} ${item.workshopCode} ${item.wireHarnessType} ${item.robotGroup}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [keyword, records]);

  const fetchList = useCallback(async () => {
    await listQuery.refetch();
  }, [listQuery]);

  const createRecord = useCallback(
    async (payload: WorkstationConfigPayload) => {
      await createMutation.mutateAsync(payload);
      await fetchList();
    },
    [createMutation, fetchList],
  );

  const updateRecord = useCallback(
    async (payload: WorkstationConfigPayload) => {
      await updateMutation.mutateAsync({ id: payload.id, body: payload });
      await fetchList();
    },
    [fetchList, updateMutation],
  );

  const removeRecord = useCallback(
    async (id: number | string) => {
      await deleteMutation.mutateAsync(id);
      await fetchList();
    },
    [deleteMutation, fetchList],
  );

  const toggleEnabled = useCallback(
    async (id: number | string) => {
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

