/**
 * 质检业务 - 严格按后端接口清单 /api/qc
 * 工单、质检记录、复检记录
 */
import { del, get, post, put } from './client';
import type { PageData } from './client';

export type WorkOrderStatus = 'pending' | 'running' | 'paused' | 'finished' | 'ng' | 'cancelled';
export type QualityResult = 'ok' | 'ng' | 'pending';

export interface WorkOrderVO {
  /** 主键（Snowflake Long），路径操作用 */
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

/** GET /api/qc/work-orders 工单列表 */
export function getWorkOrderListApi(params?: WorkOrderListParams) {
  return get<PageData<WorkOrderVO>>('qc/work-orders', params as Record<string, string | number | undefined>);
}

/** GET /api/qc/work-orders/{id} 工单详情，id 为主键（number） */
export function getWorkOrderDetailApi(id: number) {
  return get<WorkOrderVO>(`qc/work-orders/${id}`);
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

/** PUT /api/qc/work-orders/{id} 更新工单，id 为主键（number） */
export function updateWorkOrderApi(id: number, body: WorkOrderUpdateBody) {
  return put<null>(`qc/work-orders/${id}`, body);
}

export interface WorkOrderReviewBody {
  qualityResult: QualityResult;
  defectType?: string;
  defectDescription?: string;
}

/** POST /api/qc/work-orders/{id}/review 工单复检，id 为主键（number） */
export function reviewWorkOrderApi(id: number, body: WorkOrderReviewBody) {
  return post<null>(`qc/work-orders/${id}/review`, body);
}

/** POST /api/qc/work-orders/{id}/pause 暂停工单 */
export function pauseWorkOrderApi(id: number) {
  return post<null>(`qc/work-orders/${id}/pause`);
}

/** POST /api/qc/work-orders/{id}/resume 恢复工单 */
export function resumeWorkOrderApi(id: number) {
  return post<null>(`qc/work-orders/${id}/resume`);
}

/** POST /api/qc/work-orders/{id}/cancel 取消工单 */
export function cancelWorkOrderApi(id: number) {
  return post<null>(`qc/work-orders/${id}/cancel`);
}

/** DELETE /api/qc/work-orders/{id} 删除工单 */
export function deleteWorkOrderApi(id: number) {
  return del<null>(`qc/work-orders/${id}`);
}

// ---------- 2.4 质检记录 /api/qc/quality-records ----------

export interface QualityRecordVO extends WorkOrderVO {}

export interface QualityRecordListParams {
  keyword?: string;
  onlyNg?: boolean;
  pageNum?: number;
  pageSize?: number;
}

/** GET /api/qc/quality-records 质检记录列表 */
export function getQualityRecordListApi(params?: QualityRecordListParams) {
  return get<PageData<QualityRecordVO>>('qc/quality-records', params as Record<string, string | number | undefined>);
}

/** GET /api/qc/quality-records/{id} 详情，id 为主键（number） */
export function getQualityRecordDetailApi(id: number) {
  return get<QualityRecordVO>(`qc/quality-records/${id}`);
}

/** 将工单/质检记录 VO 转为前端展示用（含默认 '-'），id 保持 number 供路径操作使用 */
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

// ---------- 2.5 复检记录 /api/qc/reinspection-records ----------

export type ReinspectionResult = 'ok' | 'ng' | 'pending';

export interface ReinspectionRecordVO {
  /** 主键（Snowflake Long） */
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

/** GET /api/qc/reinspection-records 复检记录列表 */
export function getReinspectionListApi(params?: ReinspectionListParams) {
  return get<PageData<ReinspectionRecordVO>>('qc/reinspection-records', params as Record<string, string | number | undefined>);
}
