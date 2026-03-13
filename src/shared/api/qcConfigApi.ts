/**
 * 质检配置 - 严格按后端接口清单 /api/qc/config
 * Base URL 已含 /api，路径为 qc/config/...
 */
import { del, get, post, put } from './client';
import type { PageData } from './client';
import type { WorkstationConfig, StationConfig, WireHarnessTypeConfig, TerminalConfig } from '../types/qcConfig';

/** 车间 VO（后端 QcWorkshopVO） */
export interface QcWorkshopVO {
  code: string;
  name: string;
  location?: string;
}

// ---------- 1.1 车间配置 /api/qc/config/workshops ----------

/** 车间列表，无参，返回 List<QcWorkshopVO> */
export function getWorkshopConfigListApi() {
  return get<QcWorkshopVO[]>('qc/config/workshops');
}

export function createWorkshopConfigApi(body: { code: string; name: string; location?: string }) {
  return post<null>('qc/config/workshops', body);
}

export function updateWorkshopConfigApi(code: string, body: Partial<QcWorkshopVO>) {
  return put<null>(`qc/config/workshops/${encodeURIComponent(code)}`, body);
}

export function deleteWorkshopConfigApi(code: string) {
  return del<null>(`qc/config/workshops/${encodeURIComponent(code)}`);
}

// ---------- 1.2 工作站配置 /api/qc/config/workstations ----------

/** 工作站列表，Query: keyword(可选), workshopCode(可选)。若后端返回分页则用 PageData，否则用 list 包装 */
export function getWorkstationConfigListApi(params?: { keyword?: string; workshopCode?: string; pageNum?: number; pageSize?: number }) {
  return get<PageData<WorkstationConfig>>('qc/config/workstations', params as Record<string, string | number | undefined>);
}

export function createWorkstationConfigApi(body: Omit<WorkstationConfig, 'id'> & { id?: number }) {
  return post<{ id: number }>('qc/config/workstations', body);
}

/** PUT/DELETE 路径 id 为主键（number） */
export function updateWorkstationConfigApi(id: number, body: Partial<WorkstationConfig>) {
  return put<null>(`qc/config/workstations/${id}`, body);
}

export function deleteWorkstationConfigApi(id: number) {
  return del<null>(`qc/config/workstations/${id}`);
}

// ---------- 1.3 工位配置 /api/qc/config/stations ----------

/** 工位列表，Query: workstationId(可选)。后端返回带 id(Long) 用于 PUT/DELETE */
export interface StationConfigVO extends StationConfig {
  id?: number;
}

export function getStationConfigListApi(params?: { workstationId?: string; pageNum?: number; pageSize?: number }) {
  return get<PageData<StationConfigVO>>('qc/config/stations', params as Record<string, string | number | undefined>);
}

export function createStationConfigApi(body: StationConfig) {
  return post<{ id: number }>('qc/config/stations', body);
}

/** PUT/DELETE 路径 id 为主键（number） */
export function updateStationConfigApi(id: number, body: Partial<StationConfig>) {
  return put<null>(`qc/config/stations/${id}`, body);
}

export function deleteStationConfigApi(id: number) {
  return del<null>(`qc/config/stations/${id}`);
}

// ---------- 1.4 线束类型 /api/qc/config/wire-harness-types ----------

/** 线束类型列表，无参 */
export function getWireHarnessTypeConfigListApi() {
  return get<PageData<WireHarnessTypeConfig> | WireHarnessTypeConfig[]>('qc/config/wire-harness-types');
}

export function createWireHarnessTypeConfigApi(body: Omit<WireHarnessTypeConfig, 'id'> & { id?: number }) {
  return post<{ id: number }>('qc/config/wire-harness-types', body);
}

/** PUT/DELETE 路径 id 为主键（number），兼容 number | string */
export function updateWireHarnessTypeConfigApi(id: number | string, body: Partial<WireHarnessTypeConfig>) {
  return put<null>(`qc/config/wire-harness-types/${id}`, body);
}

export function deleteWireHarnessTypeConfigApi(id: number | string) {
  return del<null>(`qc/config/wire-harness-types/${id}`);
}

// ---------- 1.5 终端配置 /api/qc/config/terminals ----------

export function getTerminalConfigListApi(params?: { workstationId?: string; pageNum?: number; pageSize?: number }) {
  return get<PageData<TerminalConfig>>('qc/config/terminals', params as Record<string, string | number | undefined>);
}

/** 新增时无需传 id，后端按规则自动生成；列表/详情返回的 id 建议为 string 以免大数精度丢失 */
export function createTerminalConfigApi(body: Omit<TerminalConfig, 'id'> & { id?: number | string }) {
  return post<{ id: number | string }>('qc/config/terminals', body);
}

/** PUT/DELETE 路径 id 为主键，用 string 传参避免 Snowflake 大数精度丢失 */
export function updateTerminalConfigApi(id: number | string, body: Partial<TerminalConfig>) {
  return put<null>(`qc/config/terminals/${String(id)}`, body);
}

export function deleteTerminalConfigApi(id: number | string) {
  return del<null>(`qc/config/terminals/${String(id)}`);
}
