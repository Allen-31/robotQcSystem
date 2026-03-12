import { useMemo, useState } from 'react';
import { wireHarnessTypeList } from '../../data/qcConfig/wireHarnessTypeList';
import type { WireHarnessTypeConfig } from '../../shared/types/qcConfig';

export type WireHarnessTypePayload = WireHarnessTypeConfig;

export function useWireHarnessType() {
  const [records, setRecords] = useState<WireHarnessTypeConfig[]>(wireHarnessTypeList);
  const [keyword, setKeyword] = useState('');

  const filteredList = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) {
      return records;
    }

    return records.filter((item) =>
      `${item.id} ${item.name} ${item.project ?? ''} ${item.taskType} ${item.planarStructureFile} ${item.threeDStructureFile}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [keyword, records]);

  const createRecord = (payload: WireHarnessTypePayload) => {
    setRecords((prev) => [payload, ...prev]);
  };

  const updateRecord = (payload: WireHarnessTypePayload) => {
    setRecords((prev) => prev.map((item) => (item.id === payload.id ? payload : item)));
  };

  const removeRecord = (id: string) => {
    setRecords((prev) => prev.filter((item) => item.id !== id));
  };

  return {
    records,
    filteredList,
    keyword,
    setKeyword,
    createRecord,
    updateRecord,
    removeRecord,
  };
}
