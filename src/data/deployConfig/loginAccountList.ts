import { resolveLocalizedText, type DataLocale, type LocalizedText } from '../localized';
import { roleList } from './roleList';

export interface LoginAccount {
  username: string;
  password: string;
  displayName: string;
  role: string;
}

interface LocalizedLoginAccount extends Omit<LoginAccount, 'displayName' | 'role'> {
  displayName: LocalizedText;
  role: LocalizedText;
}

function getRoleNameByCode(code: string, fallback: string): string {
  return roleList.find((item) => item.code === code)?.name ?? fallback;
}

const localizedLoginAccountList: LocalizedLoginAccount[] = [
  {
    username: 'admin',
    password: '123456',
    displayName: { zh: '系统管理员', en: 'System Administrator' },
    role: { zh: getRoleNameByCode('ROLE-001', '管理员'), en: 'Administrator' },
  },
  {
    username: 'qc',
    password: '123456',
    displayName: { zh: '一线质检员', en: 'Frontline Quality Inspector' },
    role: { zh: getRoleNameByCode('ROLE-002', '质检员'), en: 'Quality Inspector' },
  },
  {
    username: 'pe',
    password: '123456',
    displayName: { zh: '工艺工程师', en: 'Process Engineer' },
    role: { zh: getRoleNameByCode('ROLE-003', '工艺工程师'), en: 'Process Engineer' },
  },
  {
    username: 'ops',
    password: '123456',
    displayName: { zh: '运维工程师', en: 'Operations Engineer' },
    role: { zh: getRoleNameByCode('ROLE-004', '运维工程师'), en: 'Operations Engineer' },
  },
  {
    username: 'pad',
    password: '123456',
    displayName: { zh: 'PAD 用户', en: 'PAD User' },
    role: { zh: 'PAD', en: 'PAD' },
  },
];

export function getLoginAccountList(locale: DataLocale): LoginAccount[] {
  return localizedLoginAccountList.map((item) => ({
    ...item,
    displayName: resolveLocalizedText(item.displayName, locale),
    role: resolveLocalizedText(item.role, locale),
  }));
}

export const loginAccountList: LoginAccount[] = getLoginAccountList('zh-CN');
