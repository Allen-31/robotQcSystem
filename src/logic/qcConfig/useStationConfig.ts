import { useMemo, useState } from 'react';
import { stationConfigList } from '../../data/qcConfig/stationConfigList';
import type { StationConfig } from '../../shared/types/qcConfig';

export type StationConfigPayload = StationConfig;

export function useStationConfig() {
  const [records, setRecords] = useState<StationConfig[]>(stationConfigList);
  const [keyword, setKeyword] = useState('');

  const filteredList = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) {
      return records;
    }

    return records.filter((item) =>
      `${item.workstationId} ${item.stationId} ${item.mapPoint}`.toLowerCase().includes(normalized),
    );
  }, [keyword, records]);

  const createRecord = (payload: StationConfigPayload) => {
    setRecords((prev) => [payload, ...prev]);
  };

  const updateRecord = (payload: StationConfigPayload) => {
    setRecords((prev) => prev.map((item) => (item.stationId === payload.stationId ? payload : item)));
  };

  const removeRecord = (stationId: string) => {
    setRecords((prev) => prev.filter((item) => item.stationId !== stationId));
  };

  const toggleEnabled = (stationId: string) => {
    setRecords((prev) =>
      prev.map((item) => (item.stationId === stationId ? { ...item, enabled: !item.enabled } : item)),
    );
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
