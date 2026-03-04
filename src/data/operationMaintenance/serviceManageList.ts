export type ServiceStatus = 'running' | 'stopped' | 'degraded';

export interface ServiceLogRecord {
  id: string;
  logName: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  content: string;
}

export interface ServiceManageRecord {
  id: string;
  name: string;
  type: string;
  version: string;
  ip: string;
  status: ServiceStatus;
  cpuUsage: number;
  memoryUsage: number;
  runtime: string;
  logs: ServiceLogRecord[];
}

export const serviceManageList: ServiceManageRecord[] = [
  {
    id: 'SVC-001',
    name: '任务调度服务',
    type: '业务服务',
    version: 'v2.3.1',
    ip: '10.10.2.11',
    status: 'running',
    cpuUsage: 24.3,
    memoryUsage: 61.5,
    runtime: '6天 12小时',
    logs: [
      {
        id: 'LOG-001-1',
        logName: 'task-scheduler-20260304.log',
        type: '运行日志',
        createdAt: '2026-03-04 08:01:05',
        updatedAt: '2026-03-04 11:45:33',
        content: '[INFO] Scheduler started\n[INFO] queueDepth=18\n[WARN] worker-2 timeout retry',
      },
      {
        id: 'LOG-001-2',
        logName: 'task-scheduler-error-20260304.log',
        type: '错误日志',
        createdAt: '2026-03-04 09:22:18',
        updatedAt: '2026-03-04 10:09:07',
        content: '[ERROR] Dispatch failed: ST-007 unreachable\n[INFO] fallback route applied',
      },
    ],
  },
  {
    id: 'SVC-002',
    name: '设备接入网关',
    type: '网关服务',
    version: 'v1.9.4',
    ip: '10.10.2.12',
    status: 'running',
    cpuUsage: 32.7,
    memoryUsage: 54.1,
    runtime: '13天 3小时',
    logs: [
      {
        id: 'LOG-002-1',
        logName: 'device-gateway-20260304.log',
        type: '运行日志',
        createdAt: '2026-03-04 07:12:16',
        updatedAt: '2026-03-04 11:46:01',
        content: '[INFO] mqtt connected\n[INFO] onlineRobots=28\n[INFO] heartbeat ok',
      },
    ],
  },
  {
    id: 'SVC-003',
    name: '质检报告服务',
    type: '业务服务',
    version: 'v3.0.0',
    ip: '10.10.2.13',
    status: 'degraded',
    cpuUsage: 71.2,
    memoryUsage: 83.9,
    runtime: '2天 7小时',
    logs: [
      {
        id: 'LOG-003-1',
        logName: 'qc-report-20260304.log',
        type: '运行日志',
        createdAt: '2026-03-04 08:30:02',
        updatedAt: '2026-03-04 11:44:40',
        content: '[WARN] report queue delay 5200ms\n[WARN] db pool usage 92%',
      },
      {
        id: 'LOG-003-2',
        logName: 'qc-report-slow-query-20260304.log',
        type: '性能日志',
        createdAt: '2026-03-04 09:44:31',
        updatedAt: '2026-03-04 11:37:10',
        content: '[SLOW] select report by station took 1388ms',
      },
    ],
  },
  {
    id: 'SVC-004',
    name: '文件存储服务',
    type: '基础服务',
    version: 'v1.4.8',
    ip: '10.10.2.21',
    status: 'stopped',
    cpuUsage: 0,
    memoryUsage: 0,
    runtime: '0小时',
    logs: [
      {
        id: 'LOG-004-1',
        logName: 'file-storage-20260303.log',
        type: '运行日志',
        createdAt: '2026-03-03 19:11:43',
        updatedAt: '2026-03-03 23:58:06',
        content: '[INFO] service shutdown by ops\n[INFO] backup completed',
      },
    ],
  },
];
