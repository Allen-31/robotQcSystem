import { resolveLocalizedText, type DataLocale, type LocalizedText } from '../localized';

export interface LoginLogRecord {
  id: string;
  user: string;
  type: string;
  ip: string;
  time: string;
}

interface LocalizedLoginLogRecord extends Omit<LoginLogRecord, 'type'> {
  type: LocalizedText;
}

const localizedLoginLogList: LocalizedLoginLogRecord[] = [
  { id: 'LG-001', user: 'admin', type: { zh: '登录', en: 'Login' }, ip: '10.10.1.21', time: '2026-03-04 08:00:22' },
  { id: 'LG-002', user: 'ops', type: { zh: '登录', en: 'Login' }, ip: '10.10.1.35', time: '2026-03-04 08:12:11' },
  { id: 'LG-003', user: 'qc', type: { zh: '退出', en: 'Logout' }, ip: '10.10.1.29', time: '2026-03-04 08:45:43' },
  { id: 'LG-004', user: 'pe', type: { zh: '登录', en: 'Login' }, ip: '10.10.1.42', time: '2026-03-04 09:03:17' },
  { id: 'LG-005', user: 'admin', type: { zh: '退出', en: 'Logout' }, ip: '10.10.1.21', time: '2026-03-04 09:26:50' },
  { id: 'LG-006', user: 'ops', type: { zh: '退出', en: 'Logout' }, ip: '10.10.1.35', time: '2026-03-04 10:11:09' },
  { id: 'LG-007', user: 'maintainer', type: { zh: '登录', en: 'Login' }, ip: '10.10.1.56', time: '2026-03-04 10:28:44' },
  { id: 'LG-008', user: 'qc', type: { zh: '登录', en: 'Login' }, ip: '10.10.1.29', time: '2026-03-04 11:03:30' },
  { id: 'LG-009', user: 'pe', type: { zh: '退出', en: 'Logout' }, ip: '10.10.1.42', time: '2026-03-04 11:22:12' },
  { id: 'LG-010', user: 'maintainer', type: { zh: '退出', en: 'Logout' }, ip: '10.10.1.56', time: '2026-03-04 11:38:01' },
];

export function getLoginLogList(locale: DataLocale): LoginLogRecord[] {
  return localizedLoginLogList.map((item) => ({
    ...item,
    type: resolveLocalizedText(item.type, locale),
  }));
}

export const loginLogList: LoginLogRecord[] = getLoginLogList('zh-CN');
