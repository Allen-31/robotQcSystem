import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createWireHarnessTypeConfigApi,
  deleteWireHarnessTypeConfigApi,
  getWireHarnessTypeConfigListApi,
  updateWireHarnessTypeConfigApi,
} from '../../shared/api/qcConfigApi';
import type { WireHarnessTypeConfig } from '../../shared/types/qcConfig';

export type WireHarnessTypePayload = WireHarnessTypeConfig;

function normalizeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && 'list' in data) return ((data as { list: T[] }).list) ?? [];
  return [];
}

export function useWireHarnessType() {
  const [records, setRecords] = useState<WireHarnessTypeConfig[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getWireHarnessTypeConfigListApi();
      const list = normalizeList<WireHarnessTypeConfig>(res.data);
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

  const filteredList = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return records;
    return records.filter((item) =>
      `${item.id} ${item.name} ${item.project ?? ''} ${item.taskType} ${item.planarStructureFile} ${item.threeDStructureFile}`.toLowerCase().includes(normalized),
    );
  }, [keyword, records]);

  const createRecord = useCallback(async (payload: WireHarnessTypePayload) => {
    await createWireHarnessTypeConfigApi(payload);
    await fetchList();
  }, [fetchList]);

  const updateRecord = useCallback(async (payload: WireHarnessTypePayload) => {
    await updateWireHarnessTypeConfigApi(payload.id, payload);
    setRecords((prev) => prev.map((item) => (String(item.id) === String(payload.id) ? payload : item)));
  }, []);

  const removeRecord = useCallback(async (id: number | string) => {
    await deleteWireHarnessTypeConfigApi(id);
    setRecords((prev) => prev.filter((item) => String(item.id) !== String(id)));
  }, []);

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
  };
}
