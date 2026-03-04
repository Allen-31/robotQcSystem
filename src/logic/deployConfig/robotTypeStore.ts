import robotDefaultImage from '../../assets/gpt_robot_image.png';

export interface AnnotationPoint {
  id: string;
  partName: string;
  partPosition?: string;
  x: number;
  y: number;
  rotation: number;
  remark: string;
}

export type RobotTypeStatus = '启用' | '停用';

export interface RobotTypeRecord {
  id: string;
  typeNo: string;
  typeName: string;
  image2d: string;
  image2dData?: string;
  partsCount: number;
  createdAt: string;
  status: RobotTypeStatus;
  points: AnnotationPoint[];
}

const ROBOT_TYPE_STORAGE_KEY = 'deploy-config-robot-types';
export const DEFAULT_ROBOT_TYPE_IMAGE_NAME = 'pt_robot_image.png';
export const DEFAULT_ROBOT_TYPE_IMAGE_URL = robotDefaultImage;

const defaultRobotTypeList: RobotTypeRecord[] = [
  {
    id: 'type-1',
    typeNo: 'RT-001',
    typeName: '巡检机器人标准型',
    image2d: DEFAULT_ROBOT_TYPE_IMAGE_NAME,
    image2dData: DEFAULT_ROBOT_TYPE_IMAGE_URL,
    partsCount: 18,
    createdAt: '2026-02-18 10:20',
    status: '启用',
    points: [],
  },
  {
    id: 'type-2',
    typeNo: 'RT-002',
    typeName: '巡检机器人增强型',
    image2d: DEFAULT_ROBOT_TYPE_IMAGE_NAME,
    image2dData: DEFAULT_ROBOT_TYPE_IMAGE_URL,
    partsCount: 20,
    createdAt: '2026-02-19 11:35',
    status: '启用',
    points: [],
  },
  {
    id: 'type-3',
    typeNo: 'RT-003',
    typeName: '运输机器人轻载型',
    image2d: DEFAULT_ROBOT_TYPE_IMAGE_NAME,
    image2dData: DEFAULT_ROBOT_TYPE_IMAGE_URL,
    partsCount: 16,
    createdAt: '2026-02-20 14:10',
    status: '启用',
    points: [],
  },
  {
    id: 'type-4',
    typeNo: 'RT-004',
    typeName: '运输机器人重载型',
    image2d: DEFAULT_ROBOT_TYPE_IMAGE_NAME,
    image2dData: DEFAULT_ROBOT_TYPE_IMAGE_URL,
    partsCount: 22,
    createdAt: '2026-02-21 09:05',
    status: '启用',
    points: [],
  },
  {
    id: 'type-5',
    typeNo: 'RT-005',
    typeName: '协作机器人装配型',
    image2d: DEFAULT_ROBOT_TYPE_IMAGE_NAME,
    image2dData: DEFAULT_ROBOT_TYPE_IMAGE_URL,
    partsCount: 25,
    createdAt: '2026-02-22 16:45',
    status: '停用',
    points: [],
  },
  {
    id: 'type-6',
    typeNo: 'RT-006',
    typeName: '仓储机器人导航型',
    image2d: DEFAULT_ROBOT_TYPE_IMAGE_NAME,
    image2dData: DEFAULT_ROBOT_TYPE_IMAGE_URL,
    partsCount: 19,
    createdAt: '2026-02-23 08:30',
    status: '启用',
    points: [],
  },
];

function mergeWithDefaults(list: RobotTypeRecord[]) {
  const existed = new Set(list.map((item) => item.typeNo));
  const missing = defaultRobotTypeList.filter((item) => !existed.has(item.typeNo));
  if (!missing.length) {
    return list;
  }
  return [...list, ...missing];
}

function migratePresetImageToPng(list: RobotTypeRecord[]) {
  const presetByTypeNo = new Map(defaultRobotTypeList.map((item) => [item.typeNo, item]));
  return list.map((item) => {
    const preset = presetByTypeNo.get(item.typeNo);
    if (!preset) {
      return item;
    }
    const imageName = String(item.image2d ?? '').toLowerCase();
    const imageData = String(item.image2dData ?? '');
    const needMigrate = !imageData || imageName.endsWith('.svg') || imageData.startsWith('data:image/svg');
    if (!needMigrate) {
      return item;
    }
    return {
      ...item,
      image2d: DEFAULT_ROBOT_TYPE_IMAGE_NAME,
      image2dData: DEFAULT_ROBOT_TYPE_IMAGE_URL,
    };
  });
}

function normalizeList(value: unknown): RobotTypeRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((item): item is Partial<RobotTypeRecord> => Boolean(item) && typeof item === 'object')
    .map((item, index) => ({
      id: String(item.id ?? `type-${Date.now()}-${index}`),
      typeNo: String(item.typeNo ?? ''),
      typeName: String(item.typeName ?? ''),
      image2d: String(item.image2d ?? DEFAULT_ROBOT_TYPE_IMAGE_NAME),
      image2dData: item.image2dData ? String(item.image2dData) : DEFAULT_ROBOT_TYPE_IMAGE_URL,
      partsCount: Number.isFinite(item.partsCount) ? Number(item.partsCount) : 0,
      createdAt: String(item.createdAt ?? ''),
      status: item.status === '停用' ? '停用' : '启用',
      points: (Array.isArray(item.points) ? (item.points as unknown[]) : [])
        .filter((point): point is Record<string, unknown> => Boolean(point) && typeof point === 'object')
        .map((point, pointIndex) => ({
          id: String(point.id ?? `point-${Date.now()}-${pointIndex}`),
          partName: String(point.partName ?? ''),
          partPosition: point.partPosition ? String(point.partPosition) : undefined,
          x: Number.isFinite(point.x) ? Number(point.x) : 0,
          y: Number.isFinite(point.y) ? Number(point.y) : 0,
          rotation: Number.isFinite(point.rotation) ? Number(point.rotation) : 0,
          remark: String(point.remark ?? ''),
        })),
    }));
}

export function getStoredRobotTypes(): RobotTypeRecord[] {
  if (typeof window === 'undefined') {
    return defaultRobotTypeList;
  }
  const raw = window.localStorage.getItem(ROBOT_TYPE_STORAGE_KEY);
  if (!raw) {
    return defaultRobotTypeList;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    const list = normalizeList(parsed);
    const merged = list.length ? mergeWithDefaults(list) : defaultRobotTypeList;
    const migrated = migratePresetImageToPng(merged);
    if (JSON.stringify(migrated) !== JSON.stringify(list)) {
      setStoredRobotTypes(migrated);
    }
    return migrated;
  } catch {
    return defaultRobotTypeList;
  }
}

export function setStoredRobotTypes(list: RobotTypeRecord[]) {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(ROBOT_TYPE_STORAGE_KEY, JSON.stringify(list));
}
