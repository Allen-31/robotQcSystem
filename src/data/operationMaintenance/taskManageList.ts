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

export const taskManageList: TaskManageRecord[] = [
  {
    id: 'TASK-001',
    code: 'TK-20260304-001',
    externalCode: 'MES-WO-778201',
    status: 'running',
    robot: 'RB-A101',
    priority: 1,
    createdAt: '2026-03-04 08:12:13',
    endedAt: '-',
    description: '总装一线线束质检任务',
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
    description: '空闲升级等待中的巡检任务',
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
    description: '质检二线日常抽检任务',
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
    description: '机器人机械臂校准前置任务',
  },
];
