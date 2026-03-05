import { resolveLocalizedText, type DataLocale, type LocalizedText } from '../localized';
import type { ConfigTemplateRecord } from '../../shared/types/deployConfig';

interface LocalizedConfigTemplateRecord extends Omit<ConfigTemplateRecord, 'name'> {
  name: LocalizedText;
}

const localizedConfigTemplateList: LocalizedConfigTemplateRecord[] = [
  {
    code: 'TPL-001',
    name: { zh: '标准机器人巡检模板', en: 'Standard Robot Inspection Template' },
    createdAt: '2026-02-20 09:12:20',
    createdBy: 'admin',
    updatedAt: '2026-03-02 10:20:33',
    updatedBy: 'admin',
  },
  {
    code: 'TPL-002',
    name: { zh: '产线快检模板', en: 'Production Line Quick Inspection Template' },
    createdAt: '2026-02-22 11:40:05',
    createdBy: 'Li Wei',
    updatedAt: '2026-03-01 16:05:20',
    updatedBy: 'Chen Hao',
  },
];

export function getConfigTemplateList(locale: DataLocale): ConfigTemplateRecord[] {
  return localizedConfigTemplateList.map((item) => ({
    ...item,
    name: resolveLocalizedText(item.name, locale),
  }));
}

export const configTemplateList: ConfigTemplateRecord[] = getConfigTemplateList('zh-CN');
