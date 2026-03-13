import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createWorkstationConfigApi,
  deleteWorkstationConfigApi,
  getWorkstationConfigListApi,
  updateWorkstationConfigApi,
} from '../../shared/api/qcConfigApi';
import type { WorkstationConfig } from '../../shared/types/qcConfig';

export type WorkstationConfigPayload = WorkstationConfig;

function normalizeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && 'list' in data) return ((data as { list: T[] }).list) ?? [];
  return [];
}

export function useWorkstationConfig() {
  const [records, setRecords] = useState<WorkstationConfig[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getWorkstationConfigListApi({ pageNum: 1, pageSize: 500, keyword: keyword.trim() || undefined });
      const list = normalizeList<WorkstationConfig>(res.data);
      setRecords(list);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const filteredList = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return records;
    return records.filter((item) =>
      `${item.id} ${item.name} ${item.workshopCode} ${item.wireHarnessType} ${item.robotGroup}`.toLowerCase().includes(normalized),
    );
  }, [keyword, records]);

  const createRecord = useCallback(async (payload: WorkstationConfigPayload) => {
    await createWorkstationConfigApi(payload);
    await fetchList();
  }, [fetchList]);

  const updateRecord = useCallback(async (payload: WorkstationConfigPayload) => {
    await updateWorkstationConfigApi(payload.id, payload);
    setRecords((prev) => prev.map((item) => (item.id === payload.id ? payload : item)));
  }, []);

  const removeRecord = useCallback(async (id: number) => {
    await deleteWorkstationConfigApi(id);
    setRecords((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const toggleEnabled = useCallback(async (id: number) => {
    const current = records.find((item) => item.id === id);
    if (!current) return;
    const nextEnabled = !current.enabled;
    await updateWorkstationConfigApi(id, { enabled: nextEnabled });
    setRecords((prev) => prev.map((item) => (item.id === id ? { ...item, enabled: nextEnabled } : item)));
  }, [records]);

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
    toggleEnabled,
  };
}
