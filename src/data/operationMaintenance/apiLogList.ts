import { resolveLocalizedText, type DataLocale, type LocalizedText } from '../localized';

export interface ApiLogRecord {
  id: string;
  apiName: string;
  callResult: 'success' | 'failed';
  failReason: string;
  responseTime: number;
  requestInfo: string;
  responseInfo: string;
  createdAt: string;
}

interface LocalizedApiLogRecord extends Omit<ApiLogRecord, 'failReason' | 'requestInfo'> {
  failReason: LocalizedText;
  requestInfo: LocalizedText;
}

const localizedApiLogList: LocalizedApiLogRecord[] = [
  { id: 'API-001', apiName: 'POST /api/v1/robot/reset', callResult: 'success', failReason: { zh: '-', en: '-' }, responseTime: 196, requestInfo: { zh: '{"robotCode":"RB-A102"}', en: '{"robotCode":"RB-A102"}' }, responseInfo: '{"code":0,"message":"ok"}', createdAt: '2026-03-04 10:26:07' },
  { id: 'API-002', apiName: 'POST /api/v1/robot/switch-map', callResult: 'failed', failReason: { zh: '目标地图未发布', en: 'Target map is not published' }, responseTime: 427, requestInfo: { zh: '{"robotCode":"RB-C301","map":"仓储B图"}', en: '{"robotCode":"RB-C301","map":"Warehouse Map B"}' }, responseInfo: '{"code":409,"message":"map not found"}', createdAt: '2026-03-04 10:41:55' },
  { id: 'API-003', apiName: 'POST /api/v1/robot/pause', callResult: 'success', failReason: { zh: '-', en: '-' }, responseTime: 148, requestInfo: { zh: '{"robotCode":"RB-A101"}', en: '{"robotCode":"RB-A101"}' }, responseInfo: '{"code":0,"message":"paused"}', createdAt: '2026-03-04 10:56:33' },
  { id: 'API-004', apiName: 'POST /api/v1/robot/homing', callResult: 'success', failReason: { zh: '-', en: '-' }, responseTime: 274, requestInfo: { zh: '{"robotCode":"RB-B201"}', en: '{"robotCode":"RB-B201"}' }, responseInfo: '{"code":0,"message":"homing"}', createdAt: '2026-03-04 11:05:19' },
  { id: 'API-005', apiName: 'POST /api/v1/robot/dispatch-mode', callResult: 'failed', failReason: { zh: '机器人离线', en: 'Robot is offline' }, responseTime: 366, requestInfo: { zh: '{"robotCode":"RB-C301","mode":"manual"}', en: '{"robotCode":"RB-C301","mode":"manual"}' }, responseInfo: '{"code":409,"message":"robot offline"}', createdAt: '2026-03-04 11:12:08' },
  { id: 'API-006', apiName: 'GET /api/v1/robot/logs', callResult: 'success', failReason: { zh: '-', en: '-' }, responseTime: 103, requestInfo: { zh: '{"robotCode":"RB-A101","page":1,"size":20}', en: '{"robotCode":"RB-A101","page":1,"size":20}' }, responseInfo: '{"code":0,"total":126}', createdAt: '2026-03-04 11:19:47' },
  { id: 'API-007', apiName: 'POST /api/v1/robot/charge/cancel', callResult: 'success', failReason: { zh: '-', en: '-' }, responseTime: 184, requestInfo: { zh: '{"robotCode":"RB-A102"}', en: '{"robotCode":"RB-A102"}' }, responseInfo: '{"code":0,"message":"cancelled"}', createdAt: '2026-03-04 11:31:44' },
  { id: 'API-008', apiName: 'GET /api/v1/notification/exception', callResult: 'success', failReason: { zh: '-', en: '-' }, responseTime: 79, requestInfo: { zh: '{"page":1,"size":20}', en: '{"page":1,"size":20}' }, responseInfo: '{"code":0,"total":12}', createdAt: '2026-03-04 11:38:31' },
];

export function getApiLogList(locale: DataLocale): ApiLogRecord[] {
  return localizedApiLogList.map((item) => ({
    ...item,
    failReason: resolveLocalizedText(item.failReason, locale),
    requestInfo: resolveLocalizedText(item.requestInfo, locale),
  }));
}

export const apiLogList: ApiLogRecord[] = getApiLogList('zh-CN');
