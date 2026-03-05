import { resolveLocalizedText, type DataLocale, type LocalizedText } from '../localized';

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

interface LocalizedUpgradeDeviceTemplate extends Omit<UpgradeDeviceTemplate, 'robotGroup' | 'robotType'> {
  robotGroup: LocalizedText;
  robotType: LocalizedText;
}

interface LocalizedPublishManageRecord extends Omit<PublishManageRecord, 'name' | 'targetRobotGroups' | 'targetRobotTypes'> {
  name: LocalizedText;
  targetRobotGroups: LocalizedText[];
  targetRobotTypes: LocalizedText[];
}

const localizedRobotGroupOptions: LocalizedText[] = [
  { zh: '总装一线', en: 'Assembly Line 1' },
  { zh: '总装二线', en: 'Assembly Line 2' },
  { zh: '质检一线', en: 'Quality Line 1' },
  { zh: '物流转运', en: 'Logistics Transfer' },
];

const localizedRobotTypeOptions: LocalizedText[] = [
  { zh: 'AMR', en: 'AMR' },
  { zh: 'AGV', en: 'AGV' },
  { zh: '机械臂', en: 'Robot Arm' },
];

const localizedUpgradeDeviceCatalog: LocalizedUpgradeDeviceTemplate[] = [
  {
    id: 'DEV-001',
    deviceName: 'robot-rb-a101',
    ip: '10.10.11.101',
    robot: 'RB-A101',
    robotGroup: { zh: '总装一线', en: 'Assembly Line 1' },
    robotType: { zh: 'AMR', en: 'AMR' },
    currentVersion: 'v5.0.1',
  },
  {
    id: 'DEV-002',
    deviceName: 'robot-rb-a102',
    ip: '10.10.11.102',
    robot: 'RB-A102',
    robotGroup: { zh: '总装一线', en: 'Assembly Line 1' },
    robotType: { zh: 'AMR', en: 'AMR' },
    currentVersion: 'v5.0.1',
  },
  {
    id: 'DEV-003',
    deviceName: 'robot-rb-b201',
    ip: '10.10.12.201',
    robot: 'RB-B201',
    robotGroup: { zh: '质检一线', en: 'Quality Line 1' },
    robotType: { zh: 'AGV', en: 'AGV' },
    currentVersion: 'v3.2.4',
  },
  {
    id: 'DEV-004',
    deviceName: 'robot-rb-c301',
    ip: '10.10.13.44',
    robot: 'RB-C301',
    robotGroup: { zh: '总装二线', en: 'Assembly Line 2' },
    robotType: { zh: '机械臂', en: 'Robot Arm' },
    currentVersion: 'v2.1.7',
  },
  {
    id: 'DEV-005',
    deviceName: 'robot-rb-d401',
    ip: '10.10.14.11',
    robot: 'RB-D401',
    robotGroup: { zh: '物流转运', en: 'Logistics Transfer' },
    robotType: { zh: 'AGV', en: 'AGV' },
    currentVersion: 'v3.2.3',
  },
  {
    id: 'DEV-006',
    deviceName: 'cloud-upgrade-gateway',
    ip: '10.10.2.12',
    robot: '-',
    robotGroup: { zh: '云平台', en: 'Cloud Platform' },
    robotType: { zh: 'SERVER', en: 'SERVER' },
    currentVersion: 'v2.9.0',
  },
];

const localizedPublishManageList: LocalizedPublishManageRecord[] = [
  {
    id: 'PUB-001',
    name: { zh: '总装一线机器人夜间升级', en: 'Night Upgrade for Assembly Line 1 Robots' },
    packageName: 'robot-rb-series-v5.1.0.zip',
    targetRobots: ['RB-A101', 'RB-A102'],
    targetRobotGroups: [{ zh: '总装一线', en: 'Assembly Line 1' }],
    targetRobotTypes: [{ zh: 'AMR', en: 'AMR' }],
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
    name: { zh: '云平台补丁全量发布', en: 'Full Patch Release for Cloud Platform' },
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

export const robotOptions = ['RB-A101', 'RB-A102', 'RB-B201', 'RB-C301', 'RB-D401'];

export function getRobotGroupOptions(locale: DataLocale): string[] {
  return localizedRobotGroupOptions.map((item) => resolveLocalizedText(item, locale));
}

export function getRobotTypeOptions(locale: DataLocale): string[] {
  return localizedRobotTypeOptions.map((item) => resolveLocalizedText(item, locale));
}

export function getUpgradeDeviceCatalog(locale: DataLocale): UpgradeDeviceTemplate[] {
  return localizedUpgradeDeviceCatalog.map((item) => ({
    ...item,
    robotGroup: resolveLocalizedText(item.robotGroup, locale),
    robotType: resolveLocalizedText(item.robotType, locale),
  }));
}

export function getPublishManageList(locale: DataLocale): PublishManageRecord[] {
  return localizedPublishManageList.map((item) => ({
    ...item,
    name: resolveLocalizedText(item.name, locale),
    targetRobotGroups: item.targetRobotGroups.map((group) => resolveLocalizedText(group, locale)),
    targetRobotTypes: item.targetRobotTypes.map((type) => resolveLocalizedText(type, locale)),
  }));
}

export const robotGroupOptions = getRobotGroupOptions('zh-CN');
export const robotTypeOptions = getRobotTypeOptions('zh-CN');
export const upgradeDeviceCatalog: UpgradeDeviceTemplate[] = getUpgradeDeviceCatalog('zh-CN');
export const publishManageList: PublishManageRecord[] = getPublishManageList('zh-CN');
