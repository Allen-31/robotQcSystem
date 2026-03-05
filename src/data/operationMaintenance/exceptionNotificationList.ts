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
  { id: 'EX-20260304-001', level: 'P1', type: { zh: '通讯异常', en: 'Communication Exception' }, sourceSystem: { zh: '设备接入网关', en: 'Device Access Gateway' }, issue: { zh: '机器人 RB-C301 心跳中断超过 90 秒', en: 'Robot RB-C301 heartbeat interrupted for over 90 seconds' }, status: 'pending', relatedTask: 'TK-20260304-004', robot: 'RB-C301', createdAt: '2026-03-04 08:45:03' },
  { id: 'EX-20260304-002', level: 'P2', type: { zh: '电量告警', en: 'Battery Alert' }, sourceSystem: { zh: '机器人管理服务', en: 'Robot Management Service' }, issue: { zh: '机器人 RB-A102 电量低于 50%', en: 'Robot RB-A102 battery below 50%' }, status: 'processing', relatedTask: 'TK-20260304-002', robot: 'RB-A102', createdAt: '2026-03-04 10:18:11' },
  { id: 'EX-20260304-003', level: 'P3', type: { zh: '任务超时', en: 'Task Timeout' }, sourceSystem: { zh: '任务调度服务', en: 'Task Scheduling Service' }, issue: { zh: '任务 TK-20260304-008 执行超时 5 分钟', en: 'Task TK-20260304-008 execution timed out for 5 minutes' }, status: 'closed', relatedTask: 'TK-20260304-008', robot: 'RB-A101', createdAt: '2026-03-04 09:26:40' },
  { id: 'EX-20260304-004', level: 'P2', type: { zh: '导航异常', en: 'Navigation Exception' }, sourceSystem: { zh: '任务调度服务', en: 'Task Scheduling Service' }, issue: { zh: '机器人 RB-B201 路径规划失败，目标点不可达', en: 'Robot RB-B201 path planning failed, target point unreachable' }, status: 'pending', relatedTask: 'TK-20260304-011', robot: 'RB-B201', createdAt: '2026-03-04 09:52:13' },
  { id: 'EX-20260304-005', level: 'P3', type: { zh: '视频流异常', en: 'Video Stream Exception' }, sourceSystem: { zh: '机器人管理服务', en: 'Robot Management Service' }, issue: { zh: '机器人 RB-A101 视频流短时抖动', en: 'Robot RB-A101 video stream jitter detected' }, status: 'closed', relatedTask: 'TK-20260304-001', robot: 'RB-A101', createdAt: '2026-03-04 10:03:44' },
  { id: 'EX-20260304-006', level: 'P1', type: { zh: '驱动故障', en: 'Drive Fault' }, sourceSystem: { zh: '设备接入网关', en: 'Device Access Gateway' }, issue: { zh: '机器人 RB-C301 左驱动器过流保护触发', en: 'Robot RB-C301 left drive overcurrent protection triggered' }, status: 'processing', relatedTask: 'TK-20260304-014', robot: 'RB-C301', createdAt: '2026-03-04 10:17:28' },
  { id: 'EX-20260304-007', level: 'P2', type: { zh: '充电异常', en: 'Charging Exception' }, sourceSystem: { zh: '充电策略服务', en: 'Charging Strategy Service' }, issue: { zh: '机器人 RB-A102 进入充电后电流异常波动', en: 'Robot RB-A102 charging current fluctuated abnormally' }, status: 'processing', relatedTask: 'TK-20260304-015', robot: 'RB-A102', createdAt: '2026-03-04 10:28:05' },
  { id: 'EX-20260304-008', level: 'P3', type: { zh: '配置告警', en: 'Configuration Alert' }, sourceSystem: { zh: '配置中心', en: 'Configuration Center' }, issue: { zh: '机器人 RB-B202 未匹配最新标注模板', en: 'Robot RB-B202 does not match latest annotation template' }, status: 'pending', relatedTask: 'TK-20260304-016', robot: 'RB-B202', createdAt: '2026-03-04 10:39:56' },
  { id: 'EX-20260304-009', level: 'P2', type: { zh: '机械臂异常', en: 'Robot Arm Exception' }, sourceSystem: { zh: '机器人管理服务', en: 'Robot Management Service' }, issue: { zh: '机器人 RB-D101 机械臂回原点超时', en: 'Robot RB-D101 arm return-to-origin timed out' }, status: 'pending', relatedTask: 'TK-20260304-018', robot: 'RB-D101', createdAt: '2026-03-04 10:51:12' },
  { id: 'EX-20260304-010', level: 'P3', type: { zh: '任务阻塞', en: 'Task Blocking' }, sourceSystem: { zh: '任务调度服务', en: 'Task Scheduling Service' }, issue: { zh: '任务 TK-20260304-020 等待资源超过阈值', en: 'Task TK-20260304-020 waiting for resources exceeded threshold' }, status: 'closed', relatedTask: 'TK-20260304-020', robot: 'RB-E201', createdAt: '2026-03-04 11:05:37' },
  { id: 'EX-20260304-011', level: 'P1', type: { zh: '安全急停', en: 'Emergency Stop' }, sourceSystem: { zh: '安全控制系统', en: 'Safety Control System' }, issue: { zh: '机器人 RB-F301 触发安全急停按钮', en: 'Robot RB-F301 emergency stop button was triggered' }, status: 'processing', relatedTask: 'TK-20260304-022', robot: 'RB-F301', createdAt: '2026-03-04 11:16:09' },
  { id: 'EX-20260304-012', level: 'P2', type: { zh: '地图冲突', en: 'Map Conflict' }, sourceSystem: { zh: '地图管理服务', en: 'Map Management Service' }, issue: { zh: '机器人 RB-B201 在地图版本切换时点位冲突', en: 'Robot RB-B201 waypoint conflict during map version switch' }, status: 'pending', relatedTask: 'TK-20260304-023', robot: 'RB-B201', createdAt: '2026-03-04 11:24:42' },
  { id: 'EX-20260304-013', level: 'P3', type: { zh: '传感器告警', en: 'Sensor Alert' }, sourceSystem: { zh: '设备接入网关', en: 'Device Access Gateway' }, issue: { zh: '机器人 RB-A103 激光雷达抖动超过阈值', en: 'Robot RB-A103 LiDAR jitter exceeded threshold' }, status: 'closed', relatedTask: 'TK-20260304-024', robot: 'RB-A103', createdAt: '2026-03-04 11:33:11' },
  { id: 'EX-20260304-014', level: 'P2', type: { zh: '归巢失败', en: 'Homing Failed' }, sourceSystem: { zh: '归巢策略服务', en: 'Homing Strategy Service' }, issue: { zh: '机器人 RB-D101 归巢路径被占用，执行失败', en: 'Robot RB-D101 homing path occupied, execution failed' }, status: 'processing', relatedTask: 'TK-20260304-025', robot: 'RB-D101', createdAt: '2026-03-04 11:41:53' },
  { id: 'EX-20260304-015', level: 'P1', type: { zh: '系统资源告警', en: 'System Resource Alert' }, sourceSystem: { zh: '运维监控服务', en: 'Operations Monitoring Service' }, issue: { zh: '任务调度节点 CPU 使用率持续超过 95%', en: 'Task scheduling node CPU usage stayed above 95%' }, status: 'pending', relatedTask: 'TK-20260304-026', robot: '-', createdAt: '2026-03-04 11:48:29' },
  { id: 'EX-20260304-016', level: 'P3', type: { zh: '日志上传失败', en: 'Log Upload Failed' }, sourceSystem: { zh: '日志服务', en: 'Log Service' }, issue: { zh: '机器人 RB-A101 运行日志上传失败，等待重试', en: 'Robot RB-A101 runtime log upload failed, waiting for retry' }, status: 'closed', relatedTask: 'TK-20260304-027', robot: 'RB-A101', createdAt: '2026-03-04 11:55:08' },
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
