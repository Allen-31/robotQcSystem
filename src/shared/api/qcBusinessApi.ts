/**
 * QC Business APIs
 * Backend prefix: /api/qc
 * Covers work orders, quality records and reinspection records.
 */
import { del, get, post, put } from './client';
import type { PageData } from './client';

export type WorkOrderStatus = 'pending' | 'running' | 'paused' | 'finished' | 'ng' | 'cancelled';
export type QualityResult = 'ok' | 'ng' | 'pending';

export interface WorkOrderVO {
  /** Primary key (Snowflake Long), used in path operations */
  id: number;
  workOrderNo: string;
  harnessCode: string;
  harnessType: string;
  stationCode: string;
  status: WorkOrderStatus;
  qualityResult: QualityResult;
  taskIds: string[];
  movingDuration: number;
  detectionDuration: number;
  createdAt: string;
  startedAt: string;
  endedAt: string;
  defectType?: string;
  defectDescription?: string;
}

export interface WorkOrderListParams {
  keyword?: string;
  status?: string;
  qualityResult?: string;
  stationCode?: string;
  harnessType?: string;
  dateFrom?: string;
  dateTo?: string;
  orderBy?: string;
  pageNum?: number;
  pageSize?: number;
}

/** GET /api/qc/work-orders */
export function getWorkOrderListApi(params?: WorkOrderListParams) {
  return get<PageData<WorkOrderVO>>('qc/work-orders', params as Record<string, string | number | undefined>);
}

/** GET /api/qc/work-orders/{id} */
export function getWorkOrderDetailApi(id: number) {
  return get<WorkOrderVO>(`qc/work-orders/${id}`);
}

export interface WorkOrderCreateBody {
  workOrderNo: string;
  harnessCode: string;
  harnessType: string;
  stationCode: string;
  status: WorkOrderStatus;
  qualityResult: QualityResult;
  taskIds: string[];
  movingDuration: number;
  detectionDuration: number;
  startedAt?: string;
  endedAt?: string;
  defectType?: string;
  defectDescription?: string;
}

/** POST /api/qc/work-orders */
export function createWorkOrderApi(body: WorkOrderCreateBody) {
  return post<WorkOrderVO | { id: number } | null>('qc/work-orders', body);
}

export interface WorkOrderUpdateBody {
  harnessCode?: string;
  harnessType?: string;
  stationCode?: string;
  status?: WorkOrderStatus;
  qualityResult?: QualityResult;
  taskIds?: string[];
  movingDuration?: number;
  detectionDuration?: number;
  startedAt?: string;
  endedAt?: string;
  defectType?: string;
  defectDescription?: string;
}

/** PUT /api/qc/work-orders/{id} */
export function updateWorkOrderApi(id: number, body: WorkOrderUpdateBody) {
  return put<null>(`qc/work-orders/${id}`, body);
}

export interface WorkOrderReviewBody {
  qualityResult: QualityResult;
  defectType?: string;
  defectDescription?: string;
}

/** POST /api/qc/work-orders/{id}/review */
export function reviewWorkOrderApi(id: number, body: WorkOrderReviewBody) {
  return post<null>(`qc/work-orders/${id}/review`, body);
}

/** POST /api/qc/work-orders/{id}/pause */
export function pauseWorkOrderApi(id: number) {
  return post<null>(`qc/work-orders/${id}/pause`);
}

/** POST /api/qc/work-orders/{id}/resume */
export function resumeWorkOrderApi(id: number) {
  return post<null>(`qc/work-orders/${id}/resume`);
}

/** POST /api/qc/work-orders/{id}/cancel */
export function cancelWorkOrderApi(id: number) {
  return post<null>(`qc/work-orders/${id}/cancel`);
}

/** DELETE /api/qc/work-orders/{id} */
export function deleteWorkOrderApi(id: number) {
  return del<null>(`qc/work-orders/${id}`);
}

// ---------- quality-records /api/qc/quality-records ----------

export type QualityRecordVO = WorkOrderVO;

export interface QualityRecordListParams {
  keyword?: string;
  onlyNg?: boolean;
  pageNum?: number;
  pageSize?: number;
}

/** GET /api/qc/quality-records */
export function getQualityRecordListApi(params?: QualityRecordListParams) {
  return get<PageData<QualityRecordVO>>('qc/quality-records', params as Record<string, string | number | undefined>);
}

/** GET /api/qc/quality-records/{id} */
export function getQualityRecordDetailApi(id: number) {
  return get<QualityRecordVO>(`qc/quality-records/${id}`);
}

/**
 * Map work-order/quality-record VO to page item with safe fallbacks.
 * Keep numeric id unchanged for route operations.
 */
export function mapWorkOrderVoToItem(vo: WorkOrderVO): {
  id: number;
  workOrderNo: string;
  harnessCode: string;
  harnessType: string;
  stationCode: string;
  status: WorkOrderStatus;
  qualityResult: QualityResult;
  taskIds: string[];
  movingDuration: number;
  detectionDuration: number;
  createdAt: string;
  startedAt: string;
  endedAt: string;
  defectType: string;
  defectDescription: string;
} {
  return {
    id: vo.id,
    workOrderNo: vo.workOrderNo ?? '-',
    harnessCode: vo.harnessCode ?? '-',
    harnessType: vo.harnessType ?? '-',
    stationCode: vo.stationCode ?? '-',
    status: vo.status,
    qualityResult: vo.qualityResult,
    taskIds: Array.isArray(vo.taskIds) ? vo.taskIds : [],
    movingDuration: vo.movingDuration ?? 0,
    detectionDuration: vo.detectionDuration ?? 0,
    createdAt: vo.createdAt ?? '-',
    startedAt: vo.startedAt ?? '-',
    endedAt: vo.endedAt ?? '-',
    defectType: vo.defectType ?? '-',
    defectDescription: vo.defectDescription ?? '-',
  };
}

// ---------- reinspection-records /api/qc/reinspection-records ----------

export type ReinspectionResult = 'ok' | 'ng' | 'pending';

export interface ReinspectionRecordVO {
  /** Primary key (Snowflake Long) */
  id: number;
  reinspectionNo: string;
  workOrderNo: string;
  harnessCode: string;
  harnessType: string;
  stationCode: string;
  qualityResult: ReinspectionResult;
  reinspectionResult: ReinspectionResult;
  defectType?: string;
  reinspectionTime?: string;
  reviewer?: string;
  videoUrl?: string;
  imageUrl?: string;
}

export interface ReinspectionListParams {
  keyword?: string;
  status?: string;
  reinspectionResult?: string;
  dateFrom?: string;
  dateTo?: string;
  pageNum?: number;
  pageSize?: number;
}

/** GET /api/qc/reinspection-records */
export function getReinspectionListApi(params?: ReinspectionListParams) {
  return get<PageData<ReinspectionRecordVO>>('qc/reinspection-records', params as Record<string, string | number | undefined>);
}
