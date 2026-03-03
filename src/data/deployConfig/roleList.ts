import type { RoleManageRecord } from '../../shared/types/deployConfig';

export const roleList: RoleManageRecord[] = [
  {
    code: 'ROLE-001',
    name: '管理员',
    description: '系统全局管理权限',
    memberCount: 1,
    updatedAt: '2026-03-02 09:20:10',
  },
  {
    code: 'ROLE-002',
    name: '质检员',
    description: '执行质检任务和结果处理',
    memberCount: 1,
    updatedAt: '2026-03-02 09:21:40',
  },
  {
    code: 'ROLE-003',
    name: '工艺工程师',
    description: '维护工艺规则和质检流程配置',
    memberCount: 1,
    updatedAt: '2026-03-02 09:23:18',
  },
  {
    code: 'ROLE-004',
    name: '运维工程师',
    description: '系统运维、告警处理与设备巡检',
    memberCount: 1,
    updatedAt: '2026-03-02 09:24:52',
  },
];
