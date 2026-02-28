import { useMemo, useState } from 'react';
import { workstationConfigList } from '../../data/qcConfig/workstationConfigList';
import type { WorkstationConfig } from '../../shared/types/qcConfig';

export type WorkstationConfigPayload = WorkstationConfig;

export function useWorkstationConfig() {
  const [records, setRecords] = useState<WorkstationConfig[]>(workstationConfigList);
  const [keyword, setKeyword] = useState('');

  const filteredList = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) {
      return records;
    }

    return records.filter((item) =>
      `${item.id} ${item.name} ${item.wireHarnessType} ${item.robotGroup}`.toLowerCase().includes(normalized),
    );
  }, [keyword, records]);

  const createRecord = (payload: WorkstationConfigPayload) => {
    setRecords((prev) => [payload, ...prev]);
  };

  const updateRecord = (payload: WorkstationConfigPayload) => {
    setRecords((prev) => prev.map((item) => (item.id === payload.id ? payload : item)));
  };

  const removeRecord = (id: string) => {
    setRecords((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleEnabled = (id: string) => {
    setRecords((prev) => prev.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item)));
  };

  return {
    records,
    filteredList,
    keyword,
    setKeyword,
    createRecord,
    updateRecord,
    removeRecord,
    toggleEnabled,
  };
}
