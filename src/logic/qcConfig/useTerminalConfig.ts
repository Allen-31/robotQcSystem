import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createTerminalConfigApi,
  deleteTerminalConfigApi,
  getStationConfigListApi,
  getTerminalConfigListApi,
  getWorkstationConfigListApi,
  updateTerminalConfigApi,
} from '../../shared/api/qcConfigApi';
import type { TerminalConfig } from '../../shared/types/qcConfig';
import type { WorkstationConfig } from '../../shared/types/qcConfig';

export type TerminalConfigPayload = TerminalConfig;

function normalizeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && 'list' in data) return ((data as { list: T[] }).list) ?? [];
  return [];
}

export function useTerminalConfig() {
  const [records, setRecords] = useState<TerminalConfig[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [workstationOptions, setWorkstationOptions] = useState<{ label: string; value: string }[]>([]);
  const [stationOptions, setStationOptions] = useState<{ label: string; value: string }[]>([]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getTerminalConfigListApi({ pageNum: 1, pageSize: 500 });
      const list = normalizeList<TerminalConfig>(res.data);
      setRecords(list);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    getWorkstationConfigListApi({ pageNum: 1, pageSize: 500 })
      .then((res) => {
        const list = normalizeList<WorkstationConfig>(res.data);
        setWorkstationOptions(list.map((item) => ({ label: `${item.name} (${item.id})`, value: String(item.id) })));
      })
      .catch(() => setWorkstationOptions([]));
  }, []);

  useEffect(() => {
    getStationConfigListApi({ pageNum: 1, pageSize: 500 })
      .then((res) => {
        const list = normalizeList<{ workstationId: string; stationId: string }>(res.data);
        setStationOptions(list.map((item) => ({ label: `${item.stationId} (${item.workstationId})`, value: item.stationId })));
      })
      .catch(() => setStationOptions([]));
  }, []);

  const filteredList = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return records;
    return records.filter((item) =>
      `${item.code ?? ''} ${item.sn} ${item.terminalType} ${item.terminalIp} ${item.workstationId} ${item.boundStationIds?.join(' ') ?? ''} ${item.currentUser}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [keyword, records]);

  const createRecord = useCallback(async (payload: TerminalConfigPayload) => {
    await createTerminalConfigApi(payload);
    await fetchList();
  }, [fetchList]);

  const updateRecord = useCallback(async (payload: TerminalConfigPayload) => {
    await updateTerminalConfigApi(payload.id, payload);
    setRecords((prev) => prev.map((item) => (String(item.id) === String(payload.id) ? payload : item)));
  }, []);

  const removeRecord = useCallback(
    async (id: number | string) => {
      await deleteTerminalConfigApi(id);
      await fetchList();
    },
    [fetchList],
  );

  return {
    records,
    filteredList,
    loading,
    keyword,
    setKeyword,
    fetchList,
    createRecord,
    updateRecord,
    removeRecord,
    workstationOptions,
    stationOptions,
  };
}
