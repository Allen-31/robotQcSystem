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

export const robotManageList: RobotManageRecord[] = [
  {
    id: 'RB-001',
    code: 'RB-A101',
    onlineStatus: 'online',
    location: '总装一线 / 工位 A-03',
    battery: 82,
    currentMap: '总装一线地图',
    dispatchMode: 'auto',
    controlStatus: 'running',
    exceptionStatus: 'normal',
    type: '巡检机器人标准型',
    group: '总装一线',
    ip: '10.10.3.101',
    videoUrl: 'rtsp://10.10.3.101/live/main',
    exceptionLogs: ['2026-03-04 09:10:24 电机温升告警已恢复'],
    runtimeLogs: [
      {
        id: 'RB-001-LOG-1',
        name: 'rb-a101-20260304.log',
        type: '运行日志',
        createdAt: '2026-03-04 08:00:03',
        updatedAt: '2026-03-04 11:45:52',
        content: '[INFO] navigation start\n[INFO] station=A-03\n[WARN] wheel slip recovered',
      },
    ],
  },
  {
    id: 'RB-002',
    code: 'RB-A102',
    onlineStatus: 'online',
    location: '质检二线 / 工位 B-08',
    battery: 47,
    currentMap: '质检二线地图',
    dispatchMode: 'semi-auto',
    controlStatus: 'paused',
    exceptionStatus: 'warning',
    type: '巡检机器人增强型',
    group: '质检二线',
    ip: '10.10.3.102',
    videoUrl: 'rtsp://10.10.3.102/live/main',
    exceptionLogs: ['2026-03-04 10:18:11 电量低于 50%', '2026-03-04 10:20:01 已下发充电指令'],
    runtimeLogs: [
      {
        id: 'RB-002-LOG-1',
        name: 'rb-a102-20260304.log',
        type: '运行日志',
        createdAt: '2026-03-04 08:03:10',
        updatedAt: '2026-03-04 11:42:01',
        content: '[INFO] pause by operator\n[INFO] waiting for resume',
      },
    ],
  },
  {
    id: 'RB-003',
    code: 'RB-C301',
    onlineStatus: 'offline',
    location: '仓储区 / 充电桩 C-02',
    battery: 16,
    currentMap: '仓储区地图',
    dispatchMode: 'manual',
    controlStatus: 'paused',
    exceptionStatus: 'critical',
    type: '仓储机器人导航型',
    group: '仓储区',
    ip: '10.10.3.131',
    videoUrl: 'rtsp://10.10.3.131/live/main',
    exceptionLogs: ['2026-03-04 08:44:20 通讯中断', '2026-03-04 08:45:03 机器人离线'],
    runtimeLogs: [
      {
        id: 'RB-003-LOG-1',
        name: 'rb-c301-error-20260304.log',
        type: '错误日志',
        createdAt: '2026-03-04 08:40:11',
        updatedAt: '2026-03-04 08:45:20',
        content: '[ERROR] heartbeat timeout\n[ERROR] mqtt disconnected',
      },
    ],
  },
];

