import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createWorkshopConfigApi,
  deleteWorkshopConfigApi,
  getWorkshopConfigListApi,
  updateWorkshopConfigApi,
  type QcWorkshopVO,
} from '../../shared/api/qcConfigApi';
import { qcConfigQueryKeys } from '../../shared/api/queryKeys';

function normalizeList(data: unknown): QcWorkshopVO[] {
  let list: QcWorkshopVO[] = [];
  if (Array.isArray(data)) list = data as QcWorkshopVO[];
  else if (data && typeof data === 'object' && 'list' in data) list = ((data as { list: QcWorkshopVO[] }).list) ?? [];

  return list.map((item) => ({
    code: item.code ?? '',
    name: item.name ?? '',
    location: item.location != null && item.location !== '' ? item.location : undefined,
  }));
}

export function useWorkshopConfig() {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState('');

  const listQuery = useQuery({
    queryKey: qcConfigQueryKeys.workshops,
    queryFn: async () => {
      const res = await getWorkshopConfigListApi();
      return normalizeList(res.data);
    },
  });

  const createMutation = useMutation({
    mutationFn: createWorkshopConfigApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qcConfigQueryKeys.all }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ code, body }: { code: string; body: Partial<QcWorkshopVO> }) => updateWorkshopConfigApi(code, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qcConfigQueryKeys.all }),
  });

  const deleteMutation = useMutation({
    mutationFn: (code: string) => deleteWorkshopConfigApi(code),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qcConfigQueryKeys.all }),
  });

  const records = useMemo(() => listQuery.data ?? [], [listQuery.data]);

  const filteredList = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return records;
    return records.filter((item) => `${item.code} ${item.name} ${item.location ?? ''}`.toLowerCase().includes(normalized));
  }, [keyword, records]);

  const fetchList = useCallback(async () => {
    await listQuery.refetch();
  }, [listQuery]);

  const createRecord = useCallback(
    async (payload: QcWorkshopVO) => {
      await createMutation.mutateAsync(payload);
      await fetchList();
    },
    [createMutation, fetchList],
  );

  const updateRecord = useCallback(
    async (code: string, payload: QcWorkshopVO) => {
      await updateMutation.mutateAsync({ code, body: payload });
      await fetchList();
    },
    [fetchList, updateMutation],
  );

  const removeRecord = useCallback(
    async (code: string) => {
      await deleteMutation.mutateAsync(code);
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

