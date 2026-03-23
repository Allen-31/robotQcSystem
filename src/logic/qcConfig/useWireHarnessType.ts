import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createWireHarnessTypeConfigApi,
  deleteWireHarnessTypeConfigApi,
  getWireHarnessTypeConfigListApi,
  updateWireHarnessTypeConfigApi,
} from '../../shared/api/qcConfigApi';
import { qcConfigQueryKeys } from '../../shared/api/queryKeys';
import type { WireHarnessTypeConfig } from '../../shared/types/qcConfig';

export type WireHarnessTypePayload = WireHarnessTypeConfig;

function normalizeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && 'list' in data) return ((data as { list: T[] }).list) ?? [];
  return [];
}

export function useWireHarnessType() {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState('');

  const listQuery = useQuery({
    queryKey: qcConfigQueryKeys.wireHarnessTypes,
    queryFn: async () => {
      const res = await getWireHarnessTypeConfigListApi();
      return normalizeList<WireHarnessTypeConfig>(res.data);
    },
  });

  const createMutation = useMutation({
    mutationFn: createWireHarnessTypeConfigApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qcConfigQueryKeys.all }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: number | string; body: Partial<WireHarnessTypeConfig> }) =>
      updateWireHarnessTypeConfigApi(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qcConfigQueryKeys.all }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number | string) => deleteWireHarnessTypeConfigApi(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qcConfigQueryKeys.all }),
  });

  const records = useMemo(() => listQuery.data ?? [], [listQuery.data]);

  const filteredList = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return records;
    return records.filter((item) =>
      `${item.id} ${item.name} ${item.project ?? ''} ${item.taskType} ${item.planarStructureFile} ${item.threeDStructureFile}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [keyword, records]);

  const fetchList = useCallback(async () => {
    await listQuery.refetch();
  }, [listQuery]);

  const createRecord = useCallback(
    async (payload: WireHarnessTypePayload) => {
      await createMutation.mutateAsync(payload);
      await fetchList();
    },
    [createMutation, fetchList],
  );

  const updateRecord = useCallback(
    async (payload: WireHarnessTypePayload) => {
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
  };
}

