export type UpgradeStrategy = 'immediate' | 'idle' | 'homing';
export type PublishStatus = 'pending' | 'running' | 'completed' | 'cancelled';
export type DeviceUpgradeStatus = 'pending' | 'upgrading' | 'completed' | 'cancelled';

export interface DeviceUpgradeRecord {
  id: string;
  deviceName: string;
  ip: string;
  status: DeviceUpgradeStatus;
  packageName: string;
  version: string;
  updatedAt: string;
  completedAt: string;
}

export interface PublishManageRecord {
  id: string;
  name: string;
  packageName: string;
  targetRobots: string[];
  targetRobotGroups: string[];
  targetRobotTypes: string[];
  strategy: UpgradeStrategy;
  restartAfterUpgrade: boolean;
  status: PublishStatus;
  creator: string;
  createdAt: string;
  completedAt: string;
  devices: DeviceUpgradeRecord[];
}

export interface UpgradeDeviceTemplate {
  id: string;
  deviceName: string;
  ip: string;
  robot: string;
  robotGroup: string;
  robotType: string;
  currentVersion: string;
}

export const robotOptions = ['RB-A101', 'RB-A102', 'RB-B201', 'RB-C301', 'RB-D401'];
export const robotGroupOptions = ['总装一线', '总装二线', '质检一线', '物流转运'];
export const robotTypeOptions = ['AMR', 'AGV', '机械臂'];

export const upgradeDeviceCatalog: UpgradeDeviceTemplate[] = [
  {
    id: 'DEV-001',
    deviceName: 'robot-rb-a101',
    ip: '10.10.11.101',
    robot: 'RB-A101',
    robotGroup: '总装一线',
    robotType: 'AMR',
    currentVersion: 'v5.0.1',
  },
  {
    id: 'DEV-002',
    deviceName: 'robot-rb-a102',
    ip: '10.10.11.102',
    robot: 'RB-A102',
    robotGroup: '总装一线',
    robotType: 'AMR',
    currentVersion: 'v5.0.1',
  },
  {
    id: 'DEV-003',
    deviceName: 'robot-rb-b201',
    ip: '10.10.12.201',
    robot: 'RB-B201',
    robotGroup: '质检一线',
    robotType: 'AGV',
    currentVersion: 'v3.2.4',
  },
  {
    id: 'DEV-004',
    deviceName: 'robot-rb-c301',
    ip: '10.10.13.44',
    robot: 'RB-C301',
    robotGroup: '总装二线',
    robotType: '机械臂',
    currentVersion: 'v2.1.7',
  },
  {
    id: 'DEV-005',
    deviceName: 'robot-rb-d401',
    ip: '10.10.14.11',
    robot: 'RB-D401',
    robotGroup: '物流转运',
    robotType: 'AGV',
    currentVersion: 'v3.2.3',
  },
  {
    id: 'DEV-006',
    deviceName: 'cloud-upgrade-gateway',
    ip: '10.10.2.12',
    robot: '-',
    robotGroup: '云平台',
    robotType: 'SERVER',
    currentVersion: 'v2.9.0',
  },
];

export const publishManageList: PublishManageRecord[] = [
  {
    id: 'PUB-001',
    name: '总装一线机器人夜间升级',
    packageName: 'robot-rb-series-v5.1.0.zip',
    targetRobots: ['RB-A101', 'RB-A102'],
    targetRobotGroups: ['总装一线'],
    targetRobotTypes: ['AMR'],
    strategy: 'idle',
    restartAfterUpgrade: true,
    status: 'running',
    creator: 'ops',
    createdAt: '2026-03-04 09:18:31',
    completedAt: '-',
    devices: [
      {
        id: 'PUB-001-DEV-1',
        deviceName: 'robot-rb-a101',
        ip: '10.10.11.101',
        status: 'completed',
        packageName: 'robot-rb-series-v5.1.0.zip',
        version: 'v5.1.0',
        updatedAt: '2026-03-04 09:42:10',
        completedAt: '2026-03-04 09:45:12',
      },
      {
        id: 'PUB-001-DEV-2',
        deviceName: 'robot-rb-a102',
        ip: '10.10.11.102',
        status: 'upgrading',
        packageName: 'robot-rb-series-v5.1.0.zip',
        version: 'v5.1.0',
        updatedAt: '2026-03-04 10:01:06',
        completedAt: '-',
      },
    ],
  },
  {
    id: 'PUB-002',
    name: '云平台补丁全量发布',
    packageName: 'cloud-release-20260304.zip',
    targetRobots: [],
    targetRobotGroups: [],
    targetRobotTypes: [],
    strategy: 'immediate',
    restartAfterUpgrade: false,
    status: 'completed',
    creator: 'admin',
    createdAt: '2026-03-04 07:45:19',
    completedAt: '2026-03-04 08:03:55',
    devices: [
      {
        id: 'PUB-002-DEV-1',
        deviceName: 'cloud-upgrade-gateway',
        ip: '10.10.2.12',
        status: 'completed',
        packageName: 'cloud-release-20260304.zip',
        version: 'v3.2.1',
        updatedAt: '2026-03-04 08:02:10',
        completedAt: '2026-03-04 08:03:55',
      },
    ],
  },
];
