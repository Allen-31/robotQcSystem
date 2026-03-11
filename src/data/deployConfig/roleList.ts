import { resolveLocalizedText, type DataLocale, type LocalizedText } from '../localized';
import type { RoleManageRecord } from '../../shared/types/deployConfig';

interface LocalizedRoleManageRecord extends Omit<RoleManageRecord, 'name' | 'description'> {
  name: LocalizedText;
  description: LocalizedText;
}

const localizedRoleList: LocalizedRoleManageRecord[] = [
  {
    code: 'ROLE-001',
    name: { zh: '管理员', en: 'Administrator' },
    description: { zh: '系统全局管理权限', en: 'System-wide administrative permissions' },
    memberCount: 1,
    updatedAt: '2026-03-02 09:20:10',
  },
  {
    code: 'ROLE-002',
    name: { zh: '质检员', en: 'Quality Inspector' },
    description: { zh: '执行质检任务和结果处理', en: 'Execute quality inspection tasks and handle results' },
    memberCount: 1,
    updatedAt: '2026-03-02 09:21:40',
  },
  {
    code: 'ROLE-003',
    name: { zh: '工艺工程师', en: 'Process Engineer' },
    description: { zh: '维护工艺规则和质检流程配置', en: 'Maintain process rules and quality flow configuration' },
    memberCount: 1,
    updatedAt: '2026-03-02 09:23:18',
  },
  {
    code: 'ROLE-004',
    name: { zh: '运维工程师', en: 'Operations Engineer' },
    description: { zh: '系统运维、告警处理与设备巡检', en: 'System operations, alert handling and equipment inspection' },
    memberCount: 1,
    updatedAt: '2026-03-02 09:24:52',
  },
  {
    code: 'ROLE-005',
    name: { zh: 'PAD', en: 'PAD' },
    description: { zh: 'PAD 终端用户', en: 'PAD terminal user' },
    memberCount: 0,
    updatedAt: '2026-03-02 09:25:00',
  },
];

export function getRoleList(locale: DataLocale): RoleManageRecord[] {
  return localizedRoleList.map((item) => ({
    ...item,
    name: resolveLocalizedText(item.name, locale),
    description: resolveLocalizedText(item.description, locale),
  }));
}

export const roleList: RoleManageRecord[] = getRoleList('zh-CN');
