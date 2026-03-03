export const ROBOT_PART_STORAGE_KEY = 'robot-qc-robot-parts';
export const ROBOT_PARTS_CHANGED_EVENT = 'robot-qc-robot-parts-changed';

export interface TechnicalParam {
  name: string;
  value: string;
  unit: string;
  range: string;
}

export interface RobotPartRecord {
  id: string;
  partNo: string;
  name: string;
  position: string;
  type: string;
  model: string;
  vendor: string;
  supplier: string;
  lifecycle: string;
  status: '启用' | '停用';
  remark?: string;
  technicalParams: TechnicalParam[];
}

export interface RobotTypeSelectablePart {
  id: string;
  name: string;
  position: string;
  model: string;
  type: string;
}

const defaultRobotParts: RobotPartRecord[] = [
  {
    id: 'part-1',
    partNo: 'RP-001',
    name: '左手腕电机',
    position: '手部',
    type: '电机',
    model: 'MTR-LW-02',
    vendor: '星辰机电',
    supplier: '华北供应链',
    lifecycle: '5年',
    status: '启用',
    remark: '关键部件',
    technicalParams: [
      { name: '额定电压', value: '24', unit: 'V', range: '18~30' },
      { name: '最大扭矩', value: '12', unit: 'N.m', range: '0~20' },
      { name: '编码器精度', value: '0.1', unit: 'deg', range: '0~1' },
      { name: '通讯方式', value: 'CAN', unit: '-', range: 'CAN/RS485' },
    ],
  },
  {
    id: 'part-2',
    partNo: 'RP-002',
    name: '雷达模组',
    position: '头部',
    type: '传感器',
    model: 'LIDAR-X5',
    vendor: '智控科技',
    supplier: '华东供应链',
    lifecycle: '3年',
    status: '启用',
    technicalParams: [
      { name: '探测距离', value: '30', unit: 'm', range: '0~50' },
      { name: '刷新频率', value: '20', unit: 'Hz', range: '5~30' },
    ],
  },
  {
    id: 'part-3',
    partNo: 'RP-003',
    name: '主控板',
    position: '躯干',
    type: '控制板',
    model: 'CTRL-A9',
    vendor: '海蓝电子',
    supplier: '华南供应链',
    lifecycle: '4年',
    status: '启用',
    technicalParams: [
      { name: 'CPU主频', value: '1.8', unit: 'GHz', range: '1.0~2.5' },
      { name: '内存', value: '8', unit: 'GB', range: '4~16' },
    ],
  },
  {
    id: 'part-4',
    partNo: 'RP-004',
    name: '驱动轮',
    position: '腿部',
    type: '执行件',
    model: 'WHEEL-34',
    vendor: '普航自动化',
    supplier: '华中供应链',
    lifecycle: '2年',
    status: '启用',
    technicalParams: [
      { name: '直径', value: '340', unit: 'mm', range: '300~400' },
      { name: '承重', value: '120', unit: 'kg', range: '80~180' },
    ],
  },
];

function emitRobotPartsChanged() {
  window.dispatchEvent(new CustomEvent(ROBOT_PARTS_CHANGED_EVENT));
}

function cloneDefaultRobotParts() {
  return defaultRobotParts.map((item) => ({
    ...item,
    technicalParams: item.technicalParams.map((param) => ({ ...param })),
  }));
}

export function getStoredRobotParts(): RobotPartRecord[] {
  const defaults = cloneDefaultRobotParts();
  const defaultByPartNo = new Map(defaults.map((item) => [item.partNo, item]));
  try {
    const raw = localStorage.getItem(ROBOT_PART_STORAGE_KEY);
    if (!raw) {
      return defaults;
    }
    const parsed = JSON.parse(raw) as RobotPartRecord[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return defaults;
    }
    const valid = parsed.filter(
      (item) =>
        item &&
        typeof item.id === 'string' &&
        typeof item.partNo === 'string' &&
        typeof item.name === 'string' &&
        typeof item.type === 'string' &&
        typeof item.model === 'string',
    );
    if (!valid.length) {
      return defaults;
    }
    const mergedByPartNo = new Map<string, RobotPartRecord>();
    defaults.forEach((item) => mergedByPartNo.set(item.partNo, item));
    valid.forEach((item) =>
      mergedByPartNo.set(item.partNo, {
        ...item,
        position: typeof item.position === 'string' && item.position.trim().length > 0 ? item.position : '其他',
      }),
    );

    // Compatibility: if cached data lacks current default set, fall back to defaults.
    const hasAnyDefault = valid.some((item) => defaultByPartNo.has(item.partNo));
    if (!hasAnyDefault) {
      return defaults;
    }
    return Array.from(mergedByPartNo.values());
  } catch {
    return defaults;
  }
}

export function setStoredRobotParts(parts: RobotPartRecord[]) {
  localStorage.setItem(ROBOT_PART_STORAGE_KEY, JSON.stringify(parts));
  emitRobotPartsChanged();
}

export function getRobotTypeSelectableParts(): RobotTypeSelectablePart[] {
  return getStoredRobotParts()
    .filter((item) => item.status === '启用')
    .map((item) => ({
      id: item.id,
      name: item.name,
      position: item.position,
      model: item.model,
      type: item.type,
    }));
}
