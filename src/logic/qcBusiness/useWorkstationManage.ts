import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getStationPositionsApi,
  getWorkstationsApi,
  type QcWorkstationVO,
  type StationPositionVO,
} from '../../shared/api/qcInspectionApi';
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
    status: vo.status,
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

function toEnabledStatus(status: WorkstationStatus): boolean {
  return status === 'running';
}

export function useWorkstationManage() {
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [stationMap, setStationMap] = useState<Record<string, StationRecord[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedWorkstationId, setSelectedWorkstationId] = useState<string>('');
  const [positionsLoading, setPositionsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getWorkstationsApi({ pageNum: 1, pageSize: 200 })
      .then((res) => {
        if (cancelled) return;
        const list = res.data?.list ?? [];
        const mapped = list.map(mapWorkstationVoToWorkstation);
        setWorkstations(mapped);
        if (mapped.length > 0 && !mapped.some((w) => w.id === selectedWorkstationId)) {
          setSelectedWorkstationId(mapped[0]?.id ?? '');
        } else if (mapped.length > 0 && !selectedWorkstationId) {
          setSelectedWorkstationId(mapped[0].id);
        }
      })
      .catch(() => {
        if (!cancelled) setWorkstations([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedWorkstation = useMemo(
    () => workstations.find((item) => item.id === selectedWorkstationId) ?? workstations[0],
    [selectedWorkstationId, workstations],
  );

  useEffect(() => {
    if (!selectedWorkstationId) return;
    let cancelled = false;
    setPositionsLoading(true);
    getStationPositionsApi({ workstationId: selectedWorkstationId, pageNum: 1, pageSize: 100 })
      .then((res) => {
        if (cancelled) return;
        const list = res.data?.list ?? [];
        if (list.length > 0) {
          const records = list.map(mapPositionToStationRecord);
          setStationMap((prev) => ({ ...prev, [selectedWorkstationId]: records }));
        } else {
          const ws = workstations.find((w) => w.id === selectedWorkstationId);
          if (ws?.stationList?.length) {
            const fallback = ws.stationList.map((code, index) => ({
              id: `${ws.id}-${code}`,
              code,
              enabled: true,
              rank: index + 1,
              inspectionCount: 0,
            }));
            setStationMap((prev) => ({ ...prev, [selectedWorkstationId]: fallback }));
          }
        }
      })
      .catch(() => {
        if (!cancelled && selectedWorkstation) {
          const fallback = (selectedWorkstation.stationList ?? []).map((code, index) => ({
            id: `${selectedWorkstation.id}-${code}`,
            code,
            enabled: true,
            rank: index + 1,
            inspectionCount: 0,
          }));
          setStationMap((prev) => ({ ...prev, [selectedWorkstationId]: fallback }));
        }
      })
      .finally(() => {
        if (!cancelled) setPositionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedWorkstationId, workstations, selectedWorkstation]);

  const workstationSummary = useMemo<WorkstationSummary>(() => {
    if (!selectedWorkstation) {
      return { inspectionTotal: 0, avgInspectionDuration: 0, stationCount: 0 };
    }
    const stations = stationMap[selectedWorkstation.id] ?? [];
    const inspectionTotal = stations.reduce((total, item) => total + item.inspectionCount, 0);
    const durationBase = selectedWorkstation.status === 'running' ? 7.2 : selectedWorkstation.status === 'maintenance' ? 9.1 : 8.4;
    return {
      inspectionTotal,
      avgInspectionDuration: Number((durationBase + (selectedWorkstation.inspectionStationCount || 0) * 0.35).toFixed(1)),
      stationCount: stations.length,
    };
  }, [selectedWorkstation, stationMap]);

  const workstationRank = useMemo(() => {
    if (!selectedWorkstation) return 0;
    const ordered = [...workstations].sort((a, b) => {
      const totalA = (stationMap[a.id] ?? []).reduce((t, item) => t + item.inspectionCount, 0);
      const totalB = (stationMap[b.id] ?? []).reduce((t, item) => t + item.inspectionCount, 0);
      return totalB - totalA;
    });
    const idx = ordered.findIndex((item) => item.id === selectedWorkstation.id);
    return idx >= 0 ? idx + 1 : 0;
  }, [selectedWorkstation, stationMap, workstations]);

  const stationList = useMemo(
    () => (selectedWorkstation ? stationMap[selectedWorkstation.id] ?? [] : []),
    [selectedWorkstation, stationMap],
  );

  const toggleStationEnabled = useCallback(
    (stationId: string) => {
      if (!selectedWorkstation) return;
      const current = stationMap[selectedWorkstation.id] ?? [];
      const record = current.find((r) => r.id === stationId);
      const nextEnabled = record ? !record.enabled : true;
      setStationMap((prev) => ({
        ...prev,
        [selectedWorkstation.id]: current.map((item) =>
          item.id === stationId ? { ...item, enabled: nextEnabled } : item,
        ),
      }));
      // 后端无 station-positions 的 PUT 接口，仅本地状态切换
    },
    [selectedWorkstation, stationMap],
  );

  return {
    workstations,
    loading,
    positionsLoading,
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
