/**
 * 质检业务 - 2.1 工作站管理（业务侧）、2.2 工位/质检台
 * 严格按后端接口清单 /api/qc
 */
import { get, put } from './client';
import type { PageData } from './client';
import type { WorkstationStatus } from '../types/workstation';

/** 2.1 工作站列表 VO（业务侧 QcWorkstationVO），id 为主键（number） */
export interface QcWorkstationVO {
  id: number;
  name: string;
  factory?: string;
  inspectionStationCount?: number;
  location?: string;
  stationList?: string[];
  status?: WorkstationStatus;
}

/** 2.2 工位列表 VO（QcStationPositionVO），id 为主键（number） */
export interface StationPositionVO {
  id: number;
  workstationId: string;
  stationCode: string;
  name?: string;
  enabled?: boolean;
  todayInspectionCount?: number;
  detectionRate?: number;
  reviewRate?: number;
  rank?: number;
  inspectionCount?: number;
}

/** GET /api/qc/workstations 工作站列表（分页），Query: keyword(可选), pageNum, pageSize */
export function getWorkstationsApi(params?: { keyword?: string; pageNum?: number; pageSize?: number }) {
  return get<PageData<QcWorkstationVO>>('qc/workstations', params as Record<string, string | number | undefined>);
}

/** PUT /api/qc/workstations/{id} 更新工作站（业务侧），id 为主键（number） */
export function updateWorkstationApi(id: number, body: Partial<Pick<QcWorkstationVO, 'name' | 'status'>>) {
  return put<null>(`qc/workstations/${id}`, body);
}

/** GET /api/qc/station-positions 工位列表（分页），Query: workstationId(可选), pageNum, pageSize */
export function getStationPositionsApi(params?: { workstationId?: string; pageNum?: number; pageSize?: number }) {
  return get<PageData<StationPositionVO>>('qc/station-positions', params as Record<string, string | number | undefined>);
}
