import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createTerminalConfigApi,
  deleteTerminalConfigApi,
  getStationConfigListApi,
  getTerminalConfigListApi,
  getWorkstationConfigListApi,
  updateTerminalConfigApi,
} from '../../shared/api/qcConfigApi';
import { qcConfigQueryKeys } from '../../shared/api/queryKeys';
import type { TerminalConfig, WorkstationConfig } from '../../shared/types/qcConfig';

export type TerminalConfigPayload = TerminalConfig;

function normalizeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && 'list' in data) return ((data as { list: T[] }).list) ?? [];
  return [];
}

export function useTerminalConfig() {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState('');

  const listQuery = useQuery({
    queryKey: qcConfigQueryKeys.terminalConfigs,
    queryFn: async () => {
      const res = await getTerminalConfigListApi({ pageNum: 1, pageSize: 500 });
      return normalizeList<TerminalConfig>(res.data);
    },
  });

  const workstationOptionsQuery = useQuery({
    queryKey: qcConfigQueryKeys.workstationOptions,
    queryFn: async () => {
      const res = await getWorkstationConfigListApi({ pageNum: 1, pageSize: 500 });
      const list = normalizeList<WorkstationConfig>(res.data);
      return list.map((item) => ({ label: `${item.name} (${item.id})`, value: String(item.id) }));
    },
  });

  const stationOptionsQuery = useQuery({
    queryKey: qcConfigQueryKeys.stationOptions,
    queryFn: async () => {
      const res = await getStationConfigListApi({ pageNum: 1, pageSize: 500 });
      const list = normalizeList<{ workstationId: string; stationId: string }>(res.data);
      return list.map((item) => ({
        label: `${item.stationId} (${item.workstationId})`,
        value: item.stationId,
      }));
    },
  });

  const createMutation = useMutation({
    mutationFn: createTerminalConfigApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qcConfigQueryKeys.all }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: number | string; body: Partial<TerminalConfig> }) => updateTerminalConfigApi(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qcConfigQueryKeys.all }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number | string) => deleteTerminalConfigApi(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qcConfigQueryKeys.all }),
  });

  const records = useMemo(() => listQuery.data ?? [], [listQuery.data]);

  const filteredList = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return records;
    return records.filter((item) =>
      `${item.code ?? ''} ${item.sn} ${item.terminalType} ${item.terminalIp} ${item.workstationId} ${item.boundStationIds?.join(' ') ?? ''} ${item.currentUser}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [keyword, records]);

  const fetchList = useCallback(async () => {
    await listQuery.refetch();
  }, [listQuery]);

  const createRecord = useCallback(
    async (payload: TerminalConfigPayload) => {
      await createMutation.mutateAsync(payload);
      await fetchList();
    },
    [createMutation, fetchList],
  );

  const updateRecord = useCallback(
    async (payload: TerminalConfigPayload) => {
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
    workstationOptions: workstationOptionsQuery.data ?? [],
    stationOptions: stationOptionsQuery.data ?? [],
  };
}

