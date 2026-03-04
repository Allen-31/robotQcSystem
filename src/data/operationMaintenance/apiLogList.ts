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

export const apiLogList: ApiLogRecord[] = [
  {
    id: 'API-001',
    apiName: 'POST /api/v1/robot/reset',
    callResult: 'success',
    failReason: '-',
    responseTime: 196,
    requestInfo: '{"robotCode":"RB-A102"}',
    responseInfo: '{"code":0,"message":"ok"}',
    createdAt: '2026-03-04 10:26:07',
  },
  {
    id: 'API-002',
    apiName: 'POST /api/v1/robot/switch-map',
    callResult: 'failed',
    failReason: '目标地图未发布',
    responseTime: 427,
    requestInfo: '{"robotCode":"RB-C301","map":"仓储B图"}',
    responseInfo: '{"code":409,"message":"map not found"}',
    createdAt: '2026-03-04 10:41:55',
  },
  {
    id: 'API-003',
    apiName: 'POST /api/v1/robot/pause',
    callResult: 'success',
    failReason: '-',
    responseTime: 148,
    requestInfo: '{"robotCode":"RB-A101"}',
    responseInfo: '{"code":0,"message":"paused"}',
    createdAt: '2026-03-04 10:56:33',
  },
  {
    id: 'API-004',
    apiName: 'POST /api/v1/robot/homing',
    callResult: 'success',
    failReason: '-',
    responseTime: 274,
    requestInfo: '{"robotCode":"RB-B201"}',
    responseInfo: '{"code":0,"message":"homing"}',
    createdAt: '2026-03-04 11:05:19',
  },
  {
    id: 'API-005',
    apiName: 'POST /api/v1/robot/dispatch-mode',
    callResult: 'failed',
    failReason: '机器人离线',
    responseTime: 366,
    requestInfo: '{"robotCode":"RB-C301","mode":"manual"}',
    responseInfo: '{"code":409,"message":"robot offline"}',
    createdAt: '2026-03-04 11:12:08',
  },
  {
    id: 'API-006',
    apiName: 'GET /api/v1/robot/logs',
    callResult: 'success',
    failReason: '-',
    responseTime: 103,
    requestInfo: '{"robotCode":"RB-A101","page":1,"size":20}',
    responseInfo: '{"code":0,"total":126}',
    createdAt: '2026-03-04 11:19:47',
  },
  {
    id: 'API-007',
    apiName: 'POST /api/v1/robot/charge/cancel',
    callResult: 'success',
    failReason: '-',
    responseTime: 184,
    requestInfo: '{"robotCode":"RB-A102"}',
    responseInfo: '{"code":0,"message":"cancelled"}',
    createdAt: '2026-03-04 11:31:44',
  },
  {
    id: 'API-008',
    apiName: 'GET /api/v1/notification/exception',
    callResult: 'success',
    failReason: '-',
    responseTime: 79,
    requestInfo: '{"page":1,"size":20}',
    responseInfo: '{"code":0,"total":12}',
    createdAt: '2026-03-04 11:38:31',
  },
];

