import { resolveLocalizedText, type DataLocale, type LocalizedText } from '../localized';
import type { HomingStrategyRecord } from '../../shared/types/deployConfig';

interface LocalizedHomingStrategyRecord extends Omit<HomingStrategyRecord, 'name' | 'robotGroup'> {
  name: LocalizedText;
  robotGroup: LocalizedText[];
}

const localizedHomingStrategyList: LocalizedHomingStrategyRecord[] = [
  {
    code: 'HS-001',
    name: { zh: '标准空闲归巢', en: 'Standard Idle Homing' },
    status: 'enabled',
    robotType: ['AMR'],
    robotGroup: [{ zh: '总装一线', en: 'Assembly Line 1' }],
    robot: ['RB-A101-1'],
    triggerRule: {
      idleWaitSeconds: 5,
    },
  },
  {
    code: 'HS-002',
    name: { zh: '夜间批量归巢', en: 'Night Batch Homing' },
    status: 'enabled',
    robotType: ['AMR', 'AGV'],
    robotGroup: [{ zh: '质检二线', en: 'Quality Line 2' }],
    robot: ['RB-B203-2', 'RB-C301-4'],
    triggerRule: {
      idleWaitSeconds: 10,
    },
  },
  {
    code: 'HS-003',
    name: { zh: '高峰避让归巢', en: 'Peak-Hour Avoidance Homing' },
    status: 'disabled',
    robotType: ['AGV'],
    robotGroup: [{ zh: '物流转运', en: 'Logistics Transfer' }],
    robot: ['RB-C301-5'],
    triggerRule: {
      idleWaitSeconds: 8,
    },
  },
];

export function getHomingStrategyList(locale: DataLocale): HomingStrategyRecord[] {
  return localizedHomingStrategyList.map((item) => ({
    ...item,
    name: resolveLocalizedText(item.name, locale),
    robotGroup: item.robotGroup.map((group) => resolveLocalizedText(group, locale)),
  }));
}

export const homingStrategyList: HomingStrategyRecord[] = getHomingStrategyList('zh-CN');
