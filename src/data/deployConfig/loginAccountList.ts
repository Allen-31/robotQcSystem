import { resolveLocalizedText, type DataLocale, type LocalizedText } from '../localized';

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

const localizedLoginAccountList: LocalizedLoginAccount[] = [
  { username: 'admin', password: '123456', displayName: { zh: '系统管理员', en: 'System Administrator' }, role: { zh: '管理员', en: 'Administrator' } },
  { username: 'qc', password: '123456', displayName: { zh: '一线质检员', en: 'Frontline Quality Inspector' }, role: { zh: '质检员', en: 'Quality Inspector' } },
  { username: 'pe', password: '123456', displayName: { zh: '工艺工程师', en: 'Process Engineer' }, role: { zh: '工艺工程师', en: 'Process Engineer' } },
  { username: 'ops', password: '123456', displayName: { zh: '运维工程师', en: 'Operations Engineer' }, role: { zh: '运维工程师', en: 'Operations Engineer' } },
];

export function getLoginAccountList(locale: DataLocale): LoginAccount[] {
  return localizedLoginAccountList.map((item) => ({
    ...item,
    displayName: resolveLocalizedText(item.displayName, locale),
    role: resolveLocalizedText(item.role, locale),
  }));
}

export const loginAccountList: LoginAccount[] = getLoginAccountList('zh-CN');
