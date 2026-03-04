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

export const exceptionNotificationList: ExceptionNotificationRecord[] = [
  { id: 'EX-20260304-001', level: 'P1', type: '通讯异常', sourceSystem: '设备接入网关', issue: '机器人 RB-C301 心跳中断超过 90 秒', status: 'pending', relatedTask: 'TK-20260304-004', robot: 'RB-C301', createdAt: '2026-03-04 08:45:03' },
  { id: 'EX-20260304-002', level: 'P2', type: '电量告警', sourceSystem: '机器人管理服务', issue: '机器人 RB-A102 电量低于 50%', status: 'processing', relatedTask: 'TK-20260304-002', robot: 'RB-A102', createdAt: '2026-03-04 10:18:11' },
  { id: 'EX-20260304-003', level: 'P3', type: '任务超时', sourceSystem: '任务调度服务', issue: '任务 TK-20260304-008 执行超时 5 分钟', status: 'closed', relatedTask: 'TK-20260304-008', robot: 'RB-A101', createdAt: '2026-03-04 09:26:40' },
  { id: 'EX-20260304-004', level: 'P2', type: '导航异常', sourceSystem: '任务调度服务', issue: '机器人 RB-B201 路径规划失败，目标点不可达', status: 'pending', relatedTask: 'TK-20260304-011', robot: 'RB-B201', createdAt: '2026-03-04 09:52:13' },
  { id: 'EX-20260304-005', level: 'P3', type: '视频流异常', sourceSystem: '机器人管理服务', issue: '机器人 RB-A101 视频流短时抖动', status: 'closed', relatedTask: 'TK-20260304-001', robot: 'RB-A101', createdAt: '2026-03-04 10:03:44' },
  { id: 'EX-20260304-006', level: 'P1', type: '驱动故障', sourceSystem: '设备接入网关', issue: '机器人 RB-C301 左驱动器过流保护触发', status: 'processing', relatedTask: 'TK-20260304-014', robot: 'RB-C301', createdAt: '2026-03-04 10:17:28' },
  { id: 'EX-20260304-007', level: 'P2', type: '充电异常', sourceSystem: '充电策略服务', issue: '机器人 RB-A102 进入充电后电流异常波动', status: 'processing', relatedTask: 'TK-20260304-015', robot: 'RB-A102', createdAt: '2026-03-04 10:28:05' },
  { id: 'EX-20260304-008', level: 'P3', type: '配置告警', sourceSystem: '配置中心', issue: '机器人 RB-B202 未匹配最新标注模板', status: 'pending', relatedTask: 'TK-20260304-016', robot: 'RB-B202', createdAt: '2026-03-04 10:39:56' },
  { id: 'EX-20260304-009', level: 'P2', type: '机械臂异常', sourceSystem: '机器人管理服务', issue: '机器人 RB-D101 机械臂回原点超时', status: 'pending', relatedTask: 'TK-20260304-018', robot: 'RB-D101', createdAt: '2026-03-04 10:51:12' },
  { id: 'EX-20260304-010', level: 'P3', type: '任务阻塞', sourceSystem: '任务调度服务', issue: '任务 TK-20260304-020 等待资源超过阈值', status: 'closed', relatedTask: 'TK-20260304-020', robot: 'RB-E201', createdAt: '2026-03-04 11:05:37' },
  { id: 'EX-20260304-011', level: 'P1', type: '安全急停', sourceSystem: '安全控制系统', issue: '机器人 RB-F301 触发安全急停按钮', status: 'processing', relatedTask: 'TK-20260304-022', robot: 'RB-F301', createdAt: '2026-03-04 11:16:09' },
  { id: 'EX-20260304-012', level: 'P2', type: '地图冲突', sourceSystem: '地图管理服务', issue: '机器人 RB-B201 在地图版本切换时点位冲突', status: 'pending', relatedTask: 'TK-20260304-023', robot: 'RB-B201', createdAt: '2026-03-04 11:24:42' },
  { id: 'EX-20260304-013', level: 'P3', type: '传感器告警', sourceSystem: '设备接入网关', issue: '机器人 RB-A103 激光雷达抖动超过阈值', status: 'closed', relatedTask: 'TK-20260304-024', robot: 'RB-A103', createdAt: '2026-03-04 11:33:11' },
  { id: 'EX-20260304-014', level: 'P2', type: '归巢失败', sourceSystem: '归巢策略服务', issue: '机器人 RB-D101 归巢路径被占用，执行失败', status: 'processing', relatedTask: 'TK-20260304-025', robot: 'RB-D101', createdAt: '2026-03-04 11:41:53' },
  { id: 'EX-20260304-015', level: 'P1', type: '系统资源告警', sourceSystem: '运维监控服务', issue: '任务调度节点 CPU 使用率持续超过 95%', status: 'pending', relatedTask: 'TK-20260304-026', robot: '-', createdAt: '2026-03-04 11:48:29' },
  { id: 'EX-20260304-016', level: 'P3', type: '日志上传失败', sourceSystem: '日志服务', issue: '机器人 RB-A101 运行日志上传失败，等待重试', status: 'closed', relatedTask: 'TK-20260304-027', robot: 'RB-A101', createdAt: '2026-03-04 11:55:08' },
];

