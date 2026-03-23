import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getStationPositionsApi,
  getWorkstationsApi,
  type QcWorkstationVO,
  type StationPositionVO,
} from '../../shared/api/qcInspectionApi';
import { qcBusinessQueryKeys } from '../../shared/api/queryKeys';
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

function mapWorkstationVoToWorkstation(vo: QcWorkstationVO): Workstation {
  const stationList = vo.stationList ?? [];
  return {
    id: String(vo.id),
    name: vo.name,
    factory: vo.factory ?? '',
    inspectionStationCount: vo.inspectionStationCount ?? stationList.length,
    location: vo.location ?? '',
    stationList: stationList.length > 0 ? stationList : [`ST-${vo.id}`],
    status: vo.status ?? 'idle',
  };
}

function mapPositionToStationRecord(vo: StationPositionVO): StationRecord {
  return {
    id: String(vo.id),
    code: vo.stationCode ?? String(vo.id),
    enabled: vo.enabled ?? true,
    rank: vo.rank ?? 0,
    inspectionCount: vo.inspectionCount ?? vo.todayInspectionCount ?? 0,
  };
}

function buildFallbackStations(workstation: Workstation | undefined): StationRecord[] {
  if (!workstation?.stationList?.length) {
    return [];
  }

  return workstation.stationList.map((code, index) => ({
    id: `${workstation.id}-${code}`,
    code,
    enabled: true,
    rank: index + 1,
    inspectionCount: 0,
  }));
}

function toEnabledStatus(status: WorkstationStatus): boolean {
  return status === 'running';
}

export function useWorkstationManage() {
  const [selectedWorkstationId, setSelectedWorkstationId] = useState<string>('');
  const [stationCacheMap, setStationCacheMap] = useState<Record<string, StationRecord[]>>({});
  const [stationOverrideMap, setStationOverrideMap] = useState<Record<string, StationRecord[]>>({});

  const workstationsQuery = useQuery({
    queryKey: qcBusinessQueryKeys.workstations(1, 200, ''),
    queryFn: async () => {
      const res = await getWorkstationsApi({ pageNum: 1, pageSize: 200 });
      const list = res.data?.list ?? [];
      return list.map(mapWorkstationVoToWorkstation);
    },
  });

  const workstations = useMemo(() => workstationsQuery.data ?? [], [workstationsQuery.data]);

  useEffect(() => {
    if (workstations.length === 0) {
      return;
    }

    if (!selectedWorkstationId || !workstations.some((item) => item.id === selectedWorkstationId)) {
      setSelectedWorkstationId(workstations[0].id);
    }
  }, [selectedWorkstationId, workstations]);

  const selectedWorkstation = useMemo(
    () => workstations.find((item) => item.id === selectedWorkstationId) ?? workstations[0],
    [selectedWorkstationId, workstations],
  );

  const stationPositionsQuery = useQuery({
    queryKey: qcBusinessQueryKeys.stationPositions(selectedWorkstationId, 1, 100),
    enabled: Boolean(selectedWorkstationId),
    queryFn: async () => {
      const res = await getStationPositionsApi({ workstationId: selectedWorkstationId, pageNum: 1, pageSize: 100 });
      return (res.data?.list ?? []).map(mapPositionToStationRecord);
    },
  });

  const queriedStationList = useMemo(() => {
    const list = stationPositionsQuery.data ?? [];
    if (list.length > 0) {
      return list;
    }
    return buildFallbackStations(selectedWorkstation);
  }, [selectedWorkstation, stationPositionsQuery.data]);

  useEffect(() => {
    if (!selectedWorkstationId) {
      return;
    }

    setStationCacheMap((prev) => ({
      ...prev,
      [selectedWorkstationId]: queriedStationList,
    }));
  }, [queriedStationList, selectedWorkstationId]);

  const stationList = useMemo(() => {
    if (!selectedWorkstationId) {
      return [];
    }

    return stationOverrideMap[selectedWorkstationId] ?? stationCacheMap[selectedWorkstationId] ?? queriedStationList;
  }, [queriedStationList, selectedWorkstationId, stationCacheMap, stationOverrideMap]);

  const getStationsByWorkstationId = useCallback(
    (workstationId: string): StationRecord[] => {
      const workstation = workstations.find((item) => item.id === workstationId);
      return (
        stationOverrideMap[workstationId] ??
        stationCacheMap[workstationId] ??
        (workstation ? buildFallbackStations(workstation) : [])
      );
    },
    [stationCacheMap, stationOverrideMap, workstations],
  );

  const workstationSummary = useMemo<WorkstationSummary>(() => {
    if (!selectedWorkstation) {
      return { inspectionTotal: 0, avgInspectionDuration: 0, stationCount: 0 };
    }

    const stations = getStationsByWorkstationId(selectedWorkstation.id);
    const inspectionTotal = stations.reduce((total, item) => total + item.inspectionCount, 0);
    const durationBase =
      selectedWorkstation.status === 'running'
        ? 7.2
        : selectedWorkstation.status === 'maintenance'
          ? 9.1
          : 8.4;

    return {
      inspectionTotal,
      avgInspectionDuration: Number((durationBase + (selectedWorkstation.inspectionStationCount || 0) * 0.35).toFixed(1)),
      stationCount: stations.length,
    };
  }, [getStationsByWorkstationId, selectedWorkstation]);

  const workstationRank = useMemo(() => {
    if (!selectedWorkstation) return 0;

    const ordered = [...workstations].sort((a, b) => {
      const totalA = getStationsByWorkstationId(a.id).reduce((t, item) => t + item.inspectionCount, 0);
      const totalB = getStationsByWorkstationId(b.id).reduce((t, item) => t + item.inspectionCount, 0);
      return totalB - totalA;
    });

    const idx = ordered.findIndex((item) => item.id === selectedWorkstation.id);
    return idx >= 0 ? idx + 1 : 0;
  }, [getStationsByWorkstationId, selectedWorkstation, workstations]);

  const toggleStationEnabled = useCallback(
    (stationId: string) => {
      if (!selectedWorkstationId) return;

      const currentStations = getStationsByWorkstationId(selectedWorkstationId);
      const target = currentStations.find((item) => item.id === stationId);
      const nextEnabled = target ? !target.enabled : true;

      setStationOverrideMap((prev) => ({
        ...prev,
        [selectedWorkstationId]: currentStations.map((item) =>
          item.id === stationId ? { ...item, enabled: nextEnabled } : item,
        ),
      }));
      // Backend currently has no station-positions toggle endpoint; keep local switch for now.
    },
    [getStationsByWorkstationId, selectedWorkstationId],
  );

  return {
    workstations,
    loading: workstationsQuery.isLoading || workstationsQuery.isFetching,
    positionsLoading: stationPositionsQuery.isLoading || stationPositionsQuery.isFetching,
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



