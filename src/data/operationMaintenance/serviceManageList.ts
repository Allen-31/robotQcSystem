import { resolveLocalizedText, type DataLocale, type LocalizedText } from '../localized';

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

interface LocalizedServiceLogRecord extends Omit<ServiceLogRecord, 'type'> {
  type: LocalizedText;
}

interface LocalizedServiceManageRecord extends Omit<ServiceManageRecord, 'name' | 'type' | 'runtime' | 'logs'> {
  name: LocalizedText;
  type: LocalizedText;
  runtime: LocalizedText;
  logs: LocalizedServiceLogRecord[];
}

const localizedServiceManageList: LocalizedServiceManageRecord[] = [
  {
    id: 'SVC-001',
    name: { zh: '任务调度服务', en: 'Task Scheduling Service' },
    type: { zh: '业务服务', en: 'Business Service' },
    version: 'v2.3.1',
    ip: '10.10.2.11',
    status: 'running',
    cpuUsage: 24.3,
    memoryUsage: 61.5,
    runtime: { zh: '6天 12小时', en: '6 days 12 hours' },
    logs: [
      { id: 'LOG-001-1', logName: 'task-scheduler-20260304.log', type: { zh: '运行日志', en: 'Runtime Log' }, createdAt: '2026-03-04 08:01:05', updatedAt: '2026-03-04 11:45:33', content: '[INFO] Scheduler started\n[INFO] queueDepth=18\n[WARN] worker-2 timeout retry' },
      { id: 'LOG-001-2', logName: 'task-scheduler-error-20260304.log', type: { zh: '错误日志', en: 'Error Log' }, createdAt: '2026-03-04 09:22:18', updatedAt: '2026-03-04 10:09:07', content: '[ERROR] Dispatch failed: ST-007 unreachable\n[INFO] fallback route applied' },
    ],
  },
  {
    id: 'SVC-002',
    name: { zh: '设备接入网关', en: 'Device Access Gateway' },
    type: { zh: '网关服务', en: 'Gateway Service' },
    version: 'v1.9.4',
    ip: '10.10.2.12',
    status: 'running',
    cpuUsage: 32.7,
    memoryUsage: 54.1,
    runtime: { zh: '13天 3小时', en: '13 days 3 hours' },
    logs: [
      { id: 'LOG-002-1', logName: 'device-gateway-20260304.log', type: { zh: '运行日志', en: 'Runtime Log' }, createdAt: '2026-03-04 07:12:16', updatedAt: '2026-03-04 11:46:01', content: '[INFO] mqtt connected\n[INFO] onlineRobots=28\n[INFO] heartbeat ok' },
    ],
  },
  {
    id: 'SVC-003',
    name: { zh: '质检报告服务', en: 'QC Report Service' },
    type: { zh: '业务服务', en: 'Business Service' },
    version: 'v3.0.0',
    ip: '10.10.2.13',
    status: 'degraded',
    cpuUsage: 71.2,
    memoryUsage: 83.9,
    runtime: { zh: '2天 7小时', en: '2 days 7 hours' },
    logs: [
      { id: 'LOG-003-1', logName: 'qc-report-20260304.log', type: { zh: '运行日志', en: 'Runtime Log' }, createdAt: '2026-03-04 08:30:02', updatedAt: '2026-03-04 11:44:40', content: '[WARN] report queue delay 5200ms\n[WARN] db pool usage 92%' },
      { id: 'LOG-003-2', logName: 'qc-report-slow-query-20260304.log', type: { zh: '性能日志', en: 'Performance Log' }, createdAt: '2026-03-04 09:44:31', updatedAt: '2026-03-04 11:37:10', content: '[SLOW] select report by station took 1388ms' },
    ],
  },
  {
    id: 'SVC-004',
    name: { zh: '文件存储服务', en: 'File Storage Service' },
    type: { zh: '基础服务', en: 'Infrastructure Service' },
    version: 'v1.4.8',
    ip: '10.10.2.21',
    status: 'stopped',
    cpuUsage: 0,
    memoryUsage: 0,
    runtime: { zh: '0小时', en: '0 hours' },
    logs: [
      { id: 'LOG-004-1', logName: 'file-storage-20260303.log', type: { zh: '运行日志', en: 'Runtime Log' }, createdAt: '2026-03-03 19:11:43', updatedAt: '2026-03-03 23:58:06', content: '[INFO] service shutdown by ops\n[INFO] backup completed' },
    ],
  },
];

export function getServiceManageList(locale: DataLocale): ServiceManageRecord[] {
  return localizedServiceManageList.map((item) => ({
    ...item,
    name: resolveLocalizedText(item.name, locale),
    type: resolveLocalizedText(item.type, locale),
    runtime: resolveLocalizedText(item.runtime, locale),
    logs: item.logs.map((log) => ({ ...log, type: resolveLocalizedText(log.type, locale) })),
  }));
}

export const serviceManageList: ServiceManageRecord[] = getServiceManageList('zh-CN');
