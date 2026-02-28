import { useMemo, useState } from 'react';
import { stationConfigList } from '../../data/qcConfig/stationConfigList';
import { terminalConfigList } from '../../data/qcConfig/terminalConfigList';
import { workstationConfigList } from '../../data/qcConfig/workstationConfigList';
import type { TerminalConfig } from '../../shared/types/qcConfig';

export type TerminalConfigPayload = TerminalConfig;

export function useTerminalConfig() {
  const [records, setRecords] = useState<TerminalConfig[]>(terminalConfigList);
  const [keyword, setKeyword] = useState('');

  const workstationOptions = workstationConfigList.map((item) => ({
    label: `${item.name} (${item.id})`,
    value: item.id,
  }));

  const stationOptions = stationConfigList.map((item) => ({
    label: `${item.stationId} (${item.workstationId})`,
    value: item.stationId,
  }));

  const filteredList = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) {
      return records;
    }

    return records.filter((item) =>
      `${item.terminalId} ${item.workstationId} ${item.boundStationIds.join(' ')} ${item.currentUser}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [keyword, records]);

  const createRecord = (payload: TerminalConfigPayload) => {
    setRecords((prev) => [payload, ...prev]);
  };

  const updateRecord = (payload: TerminalConfigPayload) => {
    setRecords((prev) => prev.map((item) => (item.terminalId === payload.terminalId ? payload : item)));
  };

  const removeRecord = (terminalId: string) => {
    setRecords((prev) => prev.filter((item) => item.terminalId !== terminalId));
  };

  const toggleOnline = (terminalId: string) => {
    setRecords((prev) =>
      prev.map((item) =>
        item.terminalId === terminalId
          ? { ...item, online: !item.online, currentUser: item.online ? '-' : item.currentUser || 'operator' }
          : item,
      ),
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
    toggleOnline,
    workstationOptions,
    stationOptions,
  };
}
