import { resolveLocalizedText, type DataLocale, type LocalizedText } from '../localized';

export type RobotOnlineStatus = 'online' | 'offline';
export type RobotDispatchMode = 'auto' | 'semi-auto' | 'manual';
export type RobotControlStatus = 'running' | 'paused';
export type RobotExceptionStatus = 'normal' | 'warning' | 'critical';

export interface RobotRuntimeLogRecord {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  content: string;
}

export interface RobotManageRecord {
  id: string;
  code: string;
  onlineStatus: RobotOnlineStatus;
  location: string;
  battery: number;
  currentMap: string;
  dispatchMode: RobotDispatchMode;
  controlStatus: RobotControlStatus;
  exceptionStatus: RobotExceptionStatus;
  type: string;
  group: string;
  ip: string;
  videoUrl: string;
  exceptionLogs: string[];
  runtimeLogs: RobotRuntimeLogRecord[];
}

interface LocalizedRobotRuntimeLogRecord extends Omit<RobotRuntimeLogRecord, 'type'> {
  type: LocalizedText;
}

interface LocalizedRobotManageRecord extends Omit<RobotManageRecord, 'location' | 'currentMap' | 'type' | 'group' | 'exceptionLogs' | 'runtimeLogs'> {
  location: LocalizedText;
  currentMap: LocalizedText;
  type: LocalizedText;
  group: LocalizedText;
  exceptionLogs: LocalizedText[];
  runtimeLogs: LocalizedRobotRuntimeLogRecord[];
}

const localizedRobotManageList: LocalizedRobotManageRecord[] = [
  {
    id: 'RB-001',
    code: 'RB-A101',
    onlineStatus: 'online',
    location: { zh: '总装一线 / 工位 A-03', en: 'Assembly Line 1 / Station A-03' },
    battery: 82,
    currentMap: { zh: '总装一线地图', en: 'Assembly Line 1 Map' },
    dispatchMode: 'auto',
    controlStatus: 'running',
    exceptionStatus: 'normal',
    type: { zh: '巡检机器人标准型', en: 'Inspection Robot Standard' },
    group: { zh: '总装一线', en: 'Assembly Line 1' },
    ip: '10.10.3.101',
    videoUrl: 'rtsp://10.10.3.101/live/main',
    exceptionLogs: [{ zh: '2026-03-04 09:10:24 电机温升告警已恢复', en: '2026-03-04 09:10:24 Motor temperature alert recovered' }],
    runtimeLogs: [
      { id: 'RB-001-LOG-1', name: 'rb-a101-20260304.log', type: { zh: '运行日志', en: 'Runtime Log' }, createdAt: '2026-03-04 08:00:03', updatedAt: '2026-03-04 11:45:52', content: '[INFO] navigation start\n[INFO] station=A-03\n[WARN] wheel slip recovered' },
    ],
  },
  {
    id: 'RB-002',
    code: 'RB-A102',
    onlineStatus: 'online',
    location: { zh: '质检二线 / 工位 B-08', en: 'Quality Line 2 / Station B-08' },
    battery: 47,
    currentMap: { zh: '质检二线地图', en: 'Quality Line 2 Map' },
    dispatchMode: 'semi-auto',
    controlStatus: 'paused',
    exceptionStatus: 'warning',
    type: { zh: '巡检机器人增强型', en: 'Inspection Robot Advanced' },
    group: { zh: '质检二线', en: 'Quality Line 2' },
    ip: '10.10.3.102',
    videoUrl: 'rtsp://10.10.3.102/live/main',
    exceptionLogs: [
      { zh: '2026-03-04 10:18:11 电量低于 50%', en: '2026-03-04 10:18:11 Battery lower than 50%' },
      { zh: '2026-03-04 10:20:01 已下发充电指令', en: '2026-03-04 10:20:01 Charging command issued' },
    ],
    runtimeLogs: [
      { id: 'RB-002-LOG-1', name: 'rb-a102-20260304.log', type: { zh: '运行日志', en: 'Runtime Log' }, createdAt: '2026-03-04 08:03:10', updatedAt: '2026-03-04 11:42:01', content: '[INFO] pause by operator\n[INFO] waiting for resume' },
    ],
  },
  {
    id: 'RB-003',
    code: 'RB-C301',
    onlineStatus: 'offline',
    location: { zh: '仓储区 / 充电桩 C-02', en: 'Warehouse Zone / Charging Pile C-02' },
    battery: 16,
    currentMap: { zh: '仓储区地图', en: 'Warehouse Zone Map' },
    dispatchMode: 'manual',
    controlStatus: 'paused',
    exceptionStatus: 'critical',
    type: { zh: '仓储机器人导航型', en: 'Warehouse Navigation Robot' },
    group: { zh: '仓储区', en: 'Warehouse Zone' },
    ip: '10.10.3.131',
    videoUrl: 'rtsp://10.10.3.131/live/main',
    exceptionLogs: [
      { zh: '2026-03-04 08:44:20 通讯中断', en: '2026-03-04 08:44:20 Communication interrupted' },
      { zh: '2026-03-04 08:45:03 机器人离线', en: '2026-03-04 08:45:03 Robot offline' },
    ],
    runtimeLogs: [
      { id: 'RB-003-LOG-1', name: 'rb-c301-error-20260304.log', type: { zh: '错误日志', en: 'Error Log' }, createdAt: '2026-03-04 08:40:11', updatedAt: '2026-03-04 08:45:20', content: '[ERROR] heartbeat timeout\n[ERROR] mqtt disconnected' },
    ],
  },
];

export function getRobotManageList(locale: DataLocale): RobotManageRecord[] {
  return localizedRobotManageList.map((item) => ({
    ...item,
    location: resolveLocalizedText(item.location, locale),
    currentMap: resolveLocalizedText(item.currentMap, locale),
    type: resolveLocalizedText(item.type, locale),
    group: resolveLocalizedText(item.group, locale),
    exceptionLogs: item.exceptionLogs.map((log) => resolveLocalizedText(log, locale)),
    runtimeLogs: item.runtimeLogs.map((log) => ({ ...log, type: resolveLocalizedText(log.type, locale) })),
  }));
}

export const robotManageList: RobotManageRecord[] = getRobotManageList('zh-CN');
