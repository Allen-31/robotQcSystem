import { resolveLocalizedText, type DataLocale, type LocalizedText } from '../localized';

export interface OperationLogRecord {
  id: string;
  user: string;
  operationType: string;
  result: 'success' | 'failed';
  failReason: string;
  responseTime: number;
  ip: string;
  requestInfo: string;
  responseInfo: string;
  createdAt: string;
}

interface LocalizedOperationLogRecord extends Omit<OperationLogRecord, 'operationType' | 'failReason' | 'requestInfo'> {
  operationType: LocalizedText;
  failReason: LocalizedText;
  requestInfo: LocalizedText;
}

const localizedOperationLogList: LocalizedOperationLogRecord[] = [
  { id: 'OP-001', user: 'ops', operationType: { zh: '机器人复位', en: 'Robot Reset' }, result: 'success', failReason: { zh: '-', en: '-' }, responseTime: 238, ip: '10.10.1.35', requestInfo: { zh: 'POST /robot/reset RB-A102', en: 'POST /robot/reset RB-A102' }, responseInfo: '200 OK', createdAt: '2026-03-04 10:26:07' },
  { id: 'OP-002', user: 'admin', operationType: { zh: '切换地图', en: 'Switch Map' }, result: 'failed', failReason: { zh: '目标地图未发布', en: 'Target map is not published' }, responseTime: 415, ip: '10.10.1.21', requestInfo: { zh: 'POST /robot/switch-map RB-C301 -> 仓储B图', en: 'POST /robot/switch-map RB-C301 -> Warehouse Map B' }, responseInfo: '409 map not found', createdAt: '2026-03-04 10:41:55' },
  { id: 'OP-003', user: 'ops', operationType: { zh: '暂停机器人', en: 'Pause Robot' }, result: 'success', failReason: { zh: '-', en: '-' }, responseTime: 171, ip: '10.10.1.35', requestInfo: { zh: 'POST /robot/pause RB-A101', en: 'POST /robot/pause RB-A101' }, responseInfo: '200 OK', createdAt: '2026-03-04 10:56:33' },
  { id: 'OP-004', user: 'qc', operationType: { zh: '下发归巢', en: 'Issue Homing' }, result: 'success', failReason: { zh: '-', en: '-' }, responseTime: 286, ip: '10.10.1.29', requestInfo: { zh: 'POST /robot/homing RB-B201', en: 'POST /robot/homing RB-B201' }, responseInfo: '200 OK', createdAt: '2026-03-04 11:05:19' },
  { id: 'OP-005', user: 'admin', operationType: { zh: '修改调度模式', en: 'Change Dispatch Mode' }, result: 'failed', failReason: { zh: '机器人离线', en: 'Robot is offline' }, responseTime: 361, ip: '10.10.1.21', requestInfo: { zh: 'POST /robot/dispatch-mode RB-C301 manual', en: 'POST /robot/dispatch-mode RB-C301 manual' }, responseInfo: '409 robot offline', createdAt: '2026-03-04 11:12:08' },
  { id: 'OP-006', user: 'maintainer', operationType: { zh: '切换操作模式', en: 'Switch Operation Mode' }, result: 'success', failReason: { zh: '-', en: '-' }, responseTime: 209, ip: '10.10.1.56', requestInfo: { zh: 'POST /robot/operation-mode RB-D101 remote', en: 'POST /robot/operation-mode RB-D101 remote' }, responseInfo: '200 OK', createdAt: '2026-03-04 11:23:57' },
  { id: 'OP-007', user: 'ops', operationType: { zh: '取消充电', en: 'Cancel Charging' }, result: 'success', failReason: { zh: '-', en: '-' }, responseTime: 195, ip: '10.10.1.35', requestInfo: { zh: 'POST /robot/charge/cancel RB-A102', en: 'POST /robot/charge/cancel RB-A102' }, responseInfo: '200 OK', createdAt: '2026-03-04 11:31:44' },
  { id: 'OP-008', user: 'qc', operationType: { zh: '查看日志', en: 'View Logs' }, result: 'success', failReason: { zh: '-', en: '-' }, responseTime: 92, ip: '10.10.1.29', requestInfo: { zh: 'GET /robot/logs RB-A101', en: 'GET /robot/logs RB-A101' }, responseInfo: '200 OK', createdAt: '2026-03-04 11:40:18' },
];

export function getOperationLogList(locale: DataLocale): OperationLogRecord[] {
  return localizedOperationLogList.map((item) => ({
    ...item,
    operationType: resolveLocalizedText(item.operationType, locale),
    failReason: resolveLocalizedText(item.failReason, locale),
    requestInfo: resolveLocalizedText(item.requestInfo, locale),
  }));
}

export const operationLogList: OperationLogRecord[] = getOperationLogList('zh-CN');
