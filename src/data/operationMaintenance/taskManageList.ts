import { resolveLocalizedText, type DataLocale, type LocalizedText } from '../localized';

export type TaskStatus = 'pending' | 'running' | 'paused' | 'completed' | 'stopped';

export interface TaskManageRecord {
  id: string;
  code: string;
  externalCode: string;
  status: TaskStatus;
  robot: string;
  priority: number;
  createdAt: string;
  endedAt: string;
  description: string;
}

interface LocalizedTaskManageRecord extends Omit<TaskManageRecord, 'description'> {
  description: LocalizedText;
}

const localizedTaskManageList: LocalizedTaskManageRecord[] = [
  {
    id: 'TASK-001',
    code: 'TK-20260304-001',
    externalCode: 'MES-WO-778201',
    status: 'running',
    robot: 'RB-A101',
    priority: 1,
    createdAt: '2026-03-04 08:12:13',
    endedAt: '-',
    description: { zh: '总装一线线束质检任务', en: 'Assembly line harness quality inspection task' },
  },
  {
    id: 'TASK-002',
    code: 'TK-20260304-002',
    externalCode: 'MES-WO-778205',
    status: 'paused',
    robot: 'RB-A102',
    priority: 2,
    createdAt: '2026-03-04 08:32:26',
    endedAt: '-',
    description: { zh: '空闲升级等待中的巡检任务', en: 'Inspection task waiting for idle upgrade window' },
  },
  {
    id: 'TASK-003',
    code: 'TK-20260304-003',
    externalCode: 'MES-WO-778219',
    status: 'completed',
    robot: 'RB-B201',
    priority: 3,
    createdAt: '2026-03-04 07:05:44',
    endedAt: '2026-03-04 07:58:03',
    description: { zh: '质检二线日常抽检任务', en: 'Daily sampling task for quality line 2' },
  },
  {
    id: 'TASK-004',
    code: 'TK-20260304-004',
    externalCode: 'MES-WO-778225',
    status: 'pending',
    robot: 'RB-C301',
    priority: 1,
    createdAt: '2026-03-04 09:45:17',
    endedAt: '-',
    description: { zh: '机器人机械臂校准前置任务', en: 'Pre-calibration task for robot arm' },
  },
];

export function getTaskManageList(locale: DataLocale): TaskManageRecord[] {
  return localizedTaskManageList.map((item) => ({
    ...item,
    description: resolveLocalizedText(item.description, locale),
  }));
}

export const taskManageList: TaskManageRecord[] = getTaskManageList('zh-CN');
