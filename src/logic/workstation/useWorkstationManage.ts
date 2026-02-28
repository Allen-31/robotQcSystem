import { useMemo, useState } from 'react';
import { workstationList } from '../../data/workstationList';
import type { Workstation, WorkstationStatus } from '../../shared/types/workstation';

export interface StationRecord {
  id: string;
  code: string;
  enabled: boolean;
  rank: number;
  inspectionCount: number;
}

interface WorkstationSummary {
  inspectionTotal: number;
  avgInspectionDuration: number;
  stationCount: number;
}

function computeStationInspectionCount(workstation: Workstation, stationCode: string, index: number): number {
  const workstationNumber = Number.parseInt(workstation.id.replace(/\D/g, ''), 10) || index + 1;
  return workstationNumber * 320 + (index + 1) * 57;
}

function buildStationMap(workstations: Workstation[]): Record<string, StationRecord[]> {
  const map: Record<string, StationRecord[]> = {};

  for (const workstation of workstations) {
    const sorted = workstation.stationList
      .map((code, index) => ({
        id: `${workstation.id}-${code}`,
        code,
        enabled: workstation.status === 'running' ? true : index % 2 === 0,
        inspectionCount: computeStationInspectionCount(workstation, code, index),
      }))
      .sort((a, b) => b.inspectionCount - a.inspectionCount)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));

    map[workstation.id] = sorted;
  }

  return map;
}

function toEnabledStatus(status: WorkstationStatus): boolean {
  return status === 'running';
}

export function useWorkstationManage() {
  const workstations = workstationList;
  const [selectedWorkstationId, setSelectedWorkstationId] = useState<string>(workstations[0]?.id ?? '');
  const [stationMap, setStationMap] = useState<Record<string, StationRecord[]>>(() => buildStationMap(workstations));

  const selectedWorkstation = useMemo(
    () => workstations.find((item) => item.id === selectedWorkstationId) ?? workstations[0],
    [selectedWorkstationId, workstations],
  );

  const workstationSummary = useMemo<WorkstationSummary>(() => {
    if (!selectedWorkstation) {
      return {
        inspectionTotal: 0,
        avgInspectionDuration: 0,
        stationCount: 0,
      };
    }

    const stations = stationMap[selectedWorkstation.id] ?? [];
    const inspectionTotal = stations.reduce((total, item) => total + item.inspectionCount, 0);
    const durationBase = selectedWorkstation.status === 'running' ? 7.2 : selectedWorkstation.status === 'maintenance' ? 9.1 : 8.4;

    return {
      inspectionTotal,
      avgInspectionDuration: Number((durationBase + selectedWorkstation.inspectionStationCount * 0.35).toFixed(1)),
      stationCount: stations.length,
    };
  }, [selectedWorkstation, stationMap]);

  const workstationRank = useMemo<number>(() => {
    if (!selectedWorkstation) {
      return 0;
    }

    const ordered = [...workstations].sort((a, b) => {
      const totalA = (stationMap[a.id] ?? []).reduce((total, item) => total + item.inspectionCount, 0);
      const totalB = (stationMap[b.id] ?? []).reduce((total, item) => total + item.inspectionCount, 0);
      return totalB - totalA;
    });

    const rank = ordered.findIndex((item) => item.id === selectedWorkstation.id);
    return rank >= 0 ? rank + 1 : 0;
  }, [selectedWorkstation, stationMap, workstations]);

  const stationList = useMemo<StationRecord[]>(
    () => (selectedWorkstation ? stationMap[selectedWorkstation.id] ?? [] : []),
    [selectedWorkstation, stationMap],
  );

  const toggleStationEnabled = (stationId: string) => {
    if (!selectedWorkstation) {
      return;
    }

    setStationMap((prev) => {
      const current = prev[selectedWorkstation.id] ?? [];
      return {
        ...prev,
        [selectedWorkstation.id]: current.map((item) => (item.id === stationId ? { ...item, enabled: !item.enabled } : item)),
      };
    });
  };

  return {
    workstations,
    selectedWorkstation,
    selectedWorkstationId,
    setSelectedWorkstationId,
    workstationEnabled: selectedWorkstation ? toEnabledStatus(selectedWorkstation.status) : false,
    workstationRank,
    workstationSummary,
    stationList,
    toggleStationEnabled,
  };
}
