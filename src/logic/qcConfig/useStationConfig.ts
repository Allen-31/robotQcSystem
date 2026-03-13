import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createStationConfigApi,
  deleteStationConfigApi,
  getStationConfigListApi,
  updateStationConfigApi,
  type StationConfigVO,
} from '../../shared/api/qcConfigApi';
import type { StationConfig } from '../../shared/types/qcConfig';

export type StationConfigPayload = StationConfig;

function normalizeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && 'list' in data) return ((data as { list: T[] }).list) ?? [];
  return [];
}

export function useStationConfig() {
  const [records, setRecords] = useState<StationConfigVO[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStationConfigListApi({ pageNum: 1, pageSize: 500 });
      const list = normalizeList<StationConfigVO>(res.data);
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
    return records.filter(
      (item) =>
        `${item.workstationId} ${item.stationId} ${item.mapPoint} ${item.callBoxCode} ${item.wireHarnessType}`.toLowerCase().includes(normalized),
    );
  }, [keyword, records]);

  const createRecord = useCallback(async (payload: StationConfigPayload) => {
    await createStationConfigApi(payload);
    await fetchList();
  }, [fetchList]);

  const updateRecord = useCallback(async (payload: StationConfigVO) => {
    if (payload.id == null) return;
    await updateStationConfigApi(payload.id, payload);
    setRecords((prev) => prev.map((item) => (item.id === payload.id ? payload : item)));
  }, []);

  const removeRecord = useCallback(async (id: number) => {
    await deleteStationConfigApi(id);
    setRecords((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const toggleEnabled = useCallback(async (id: number) => {
    const current = records.find((item) => item.id === id);
    if (!current) return;
    const nextEnabled = !current.enabled;
    await updateStationConfigApi(id, { enabled: nextEnabled });
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
