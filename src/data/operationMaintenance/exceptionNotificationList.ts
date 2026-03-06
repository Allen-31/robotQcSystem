import { resolveLocalizedText, type DataLocale, type LocalizedText } from '../localized';

export interface ExceptionNotificationRecord {
  id: string;
  level: 'P1' | 'P2' | 'P3';
  type: string;
  sourceSystem: string;
  issue: string;
  status: 'pending' | 'processing' | 'closed';
  relatedTask: string;
  robot: string;
  createdAt: string;
}

interface LocalizedExceptionNotificationRecord extends Omit<ExceptionNotificationRecord, 'type' | 'sourceSystem' | 'issue'> {
  type: LocalizedText;
  sourceSystem: LocalizedText;
  issue: LocalizedText;
}

const localizedExceptionNotificationList: LocalizedExceptionNotificationRecord[] = [
  {
    id: 'EX-20260304-001',
    level: 'P1',
    type: { zh: '通讯异常', en: 'Communication Exception' },
    sourceSystem: { zh: '设备接入网关', en: 'Device Access Gateway' },
    issue: { zh: '机器人 RB-C301 心跳中断超过 90 秒', en: 'Robot RB-C301 heartbeat interrupted for over 90 seconds' },
    status: 'pending',
    relatedTask: 'TK-20260304-004',
    robot: 'RB-C301',
    createdAt: '2026-03-04 08:45:03',
  },
  {
    id: 'EX-20260304-002',
    level: 'P2',
    type: { zh: '电量告警', en: 'Battery Alert' },
    sourceSystem: { zh: '机器人管理服务', en: 'Robot Management Service' },
    issue: { zh: '机器人 RB-A102 电量低于 50%', en: 'Robot RB-A102 battery below 50%' },
    status: 'processing',
    relatedTask: 'TK-20260304-002',
    robot: 'RB-A102',
    createdAt: '2026-03-04 10:18:11',
  },
  {
    id: 'EX-20260304-003',
    level: 'P3',
    type: { zh: '任务超时', en: 'Task Timeout' },
    sourceSystem: { zh: '任务调度服务', en: 'Task Scheduling Service' },
    issue: { zh: '任务 TK-20260304-008 执行超时 5 分钟', en: 'Task TK-20260304-008 execution timed out for 5 minutes' },
    status: 'closed',
    relatedTask: 'TK-20260304-008',
    robot: 'RB-A101',
    createdAt: '2026-03-04 09:26:40',
  },
  {
    id: 'EX-20260304-004',
    level: 'P2',
    type: { zh: '导航异常', en: 'Navigation Exception' },
    sourceSystem: { zh: '任务调度服务', en: 'Task Scheduling Service' },
    issue: { zh: '机器人 RB-B201 路径规划失败，目标点不可达', en: 'Robot RB-B201 path planning failed, target point unreachable' },
    status: 'pending',
    relatedTask: 'TK-20260304-011',
    robot: 'RB-B201',
    createdAt: '2026-03-04 09:52:13',
  },
  {
    id: 'EX-20260304-005',
    level: 'P1',
    type: { zh: '驱动故障', en: 'Drive Fault' },
    sourceSystem: { zh: '设备接入网关', en: 'Device Access Gateway' },
    issue: { zh: '机器人 RB-C301 左驱动器过流保护触发', en: 'Robot RB-C301 left drive overcurrent protection triggered' },
    status: 'processing',
    relatedTask: 'TK-20260304-014',
    robot: 'RB-C301',
    createdAt: '2026-03-04 10:17:28',
  },
  {
    id: 'EX-20260304-006',
    level: 'P2',
    type: { zh: '充电异常', en: 'Charging Exception' },
    sourceSystem: { zh: '充电策略服务', en: 'Charging Strategy Service' },
    issue: { zh: '机器人 RB-A102 进入充电后电流波动异常', en: 'Robot RB-A102 charging current fluctuated abnormally' },
    status: 'processing',
    relatedTask: 'TK-20260304-015',
    robot: 'RB-A102',
    createdAt: '2026-03-04 10:28:05',
  },
  {
    id: 'EX-20260304-007',
    level: 'P1',
    type: { zh: '安全急停', en: 'Emergency Stop' },
    sourceSystem: { zh: '安全控制系统', en: 'Safety Control System' },
    issue: { zh: '机器人 RB-F301 触发安全急停按钮', en: 'Robot RB-F301 emergency stop button was triggered' },
    status: 'processing',
    relatedTask: 'TK-20260304-022',
    robot: 'RB-F301',
    createdAt: '2026-03-04 11:16:09',
  },
  {
    id: 'EX-20260304-008',
    level: 'P2',
    type: { zh: '归巢失败', en: 'Homing Failed' },
    sourceSystem: { zh: '归巢策略服务', en: 'Homing Strategy Service' },
    issue: { zh: '机器人 RB-D101 归巢路径被占用，执行失败', en: 'Robot RB-D101 homing path occupied, execution failed' },
    status: 'processing',
    relatedTask: 'TK-20260304-025',
    robot: 'RB-D101',
    createdAt: '2026-03-04 11:41:53',
  },
];

export function getExceptionNotificationList(locale: DataLocale): ExceptionNotificationRecord[] {
  return localizedExceptionNotificationList.map((item) => ({
    ...item,
    type: resolveLocalizedText(item.type, locale),
    sourceSystem: resolveLocalizedText(item.sourceSystem, locale),
    issue: resolveLocalizedText(item.issue, locale),
  }));
}

export const exceptionNotificationList: ExceptionNotificationRecord[] = getExceptionNotificationList('zh-CN');
