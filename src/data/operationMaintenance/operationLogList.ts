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

export const operationLogList: OperationLogRecord[] = [
  {
    id: 'OP-001',
    user: 'ops',
    operationType: '机器人复位',
    result: 'success',
    failReason: '-',
    responseTime: 238,
    ip: '10.10.1.35',
    requestInfo: 'POST /robot/reset RB-A102',
    responseInfo: '200 OK',
    createdAt: '2026-03-04 10:26:07',
  },
  {
    id: 'OP-002',
    user: 'admin',
    operationType: '切换地图',
    result: 'failed',
    failReason: '目标地图未发布',
    responseTime: 415,
    ip: '10.10.1.21',
    requestInfo: 'POST /robot/switch-map RB-C301 -> 仓储B图',
    responseInfo: '409 map not found',
    createdAt: '2026-03-04 10:41:55',
  },
  {
    id: 'OP-003',
    user: 'ops',
    operationType: '暂停机器人',
    result: 'success',
    failReason: '-',
    responseTime: 171,
    ip: '10.10.1.35',
    requestInfo: 'POST /robot/pause RB-A101',
    responseInfo: '200 OK',
    createdAt: '2026-03-04 10:56:33',
  },
  {
    id: 'OP-004',
    user: 'qc',
    operationType: '下发归巢',
    result: 'success',
    failReason: '-',
    responseTime: 286,
    ip: '10.10.1.29',
    requestInfo: 'POST /robot/homing RB-B201',
    responseInfo: '200 OK',
    createdAt: '2026-03-04 11:05:19',
  },
  {
    id: 'OP-005',
    user: 'admin',
    operationType: '修改调度模式',
    result: 'failed',
    failReason: '机器人离线',
    responseTime: 361,
    ip: '10.10.1.21',
    requestInfo: 'POST /robot/dispatch-mode RB-C301 manual',
    responseInfo: '409 robot offline',
    createdAt: '2026-03-04 11:12:08',
  },
  {
    id: 'OP-006',
    user: 'maintainer',
    operationType: '切换操作模式',
    result: 'success',
    failReason: '-',
    responseTime: 209,
    ip: '10.10.1.56',
    requestInfo: 'POST /robot/operation-mode RB-D101 remote',
    responseInfo: '200 OK',
    createdAt: '2026-03-04 11:23:57',
  },
  {
    id: 'OP-007',
    user: 'ops',
    operationType: '取消充电',
    result: 'success',
    failReason: '-',
    responseTime: 195,
    ip: '10.10.1.35',
    requestInfo: 'POST /robot/charge/cancel RB-A102',
    responseInfo: '200 OK',
    createdAt: '2026-03-04 11:31:44',
  },
  {
    id: 'OP-008',
    user: 'qc',
    operationType: '查看日志',
    result: 'success',
    failReason: '-',
    responseTime: 92,
    ip: '10.10.1.29',
    requestInfo: 'GET /robot/logs RB-A101',
    responseInfo: '200 OK',
    createdAt: '2026-03-04 11:40:18',
  },
];

