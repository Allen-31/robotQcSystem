import { useMemo, useState } from 'react';
import { workstationList } from '../../data/workstationList';
import type { Workstation, WorkstationStatus } from '../../shared/types/workstation';

export interface WorkstationEditPayload {
  id: string;
  name: string;
  factory: string;
  location: string;
  status: WorkstationStatus;
  stationListRaw: string;
}

export function useWorkstationManage() {
  const [workstations, setWorkstations] = useState<Workstation[]>(workstationList);
  const [editingRecord, setEditingRecord] = useState<Workstation | null>(null);
  const [keyword, setKeyword] = useState('');

  const filteredList = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) {
      return workstations;
    }

    return workstations.filter((item) => {
      const source = `${item.id} ${item.name} ${item.factory} ${item.location} ${item.stationList.join(' ')}`.toLowerCase();
      return source.includes(normalized);
    });
  }, [keyword, workstations]);

  const removeWorkstation = (id: string) => {
    setWorkstations((prev) => prev.filter((item) => item.id !== id));
  };

  const openEdit = (record: Workstation) => {
    setEditingRecord(record);
  };

  const closeEdit = () => {
    setEditingRecord(null);
  };

  const saveEdit = (payload: WorkstationEditPayload) => {
    const stationList = payload.stationListRaw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    setWorkstations((prev) =>
      prev.map((item) =>
        item.id === payload.id
          ? {
              ...item,
              name: payload.name,
              factory: payload.factory,
              location: payload.location,
              status: payload.status,
              stationList,
              inspectionStationCount: stationList.length,
            }
          : item,
      ),
    );
    setEditingRecord(null);
  };

  return {
    keyword,
    setKeyword,
    filteredList,
    editingRecord,
    openEdit,
    closeEdit,
    saveEdit,
    removeWorkstation,
  };
}
