import { resolveLocalizedText, type DataLocale, type LocalizedText } from '../localized';
import type { ChargeStrategyRecord } from '../../shared/types/deployConfig';

interface LocalizedChargeStrategyRecord extends Omit<ChargeStrategyRecord, 'name' | 'robotGroup'> {
  name: LocalizedText;
  robotGroup: LocalizedText[];
}

const localizedChargeStrategyList: LocalizedChargeStrategyRecord[] = [
  {
    code: 'CS-001',
    name: { zh: '低电量优先回充', en: 'Low Battery Priority Charging' },
    status: 'enabled',
    robotType: ['AMR'],
    robotGroup: [{ zh: '总装一线', en: 'Assembly Line 1' }],
    robot: ['RB-A101-1'],
    triggerRule: {
      lowBatteryThreshold: 20,
      minChargeMinutes: 10,
      chargeMethod: 'auto',
    },
  },
  {
    code: 'CS-002',
    name: { zh: '夜间窗口补电', en: 'Night Window Charging' },
    status: 'enabled',
    robotType: ['AMR', 'AGV'],
    robotGroup: [{ zh: '质检二线', en: 'Quality Line 2' }],
    robot: ['RB-B203-2'],
    triggerRule: {
      lowBatteryThreshold: 60,
      minChargeMinutes: 15,
      chargeMethod: 'chargingPile',
    },
  },
  {
    code: 'CS-003',
    name: { zh: '峰谷调度充电', en: 'Peak-Valley Scheduled Charging' },
    status: 'disabled',
    robotType: ['AGV'],
    robotGroup: [{ zh: '物流转运', en: 'Logistics Transfer' }],
    robot: ['RB-C301-4', 'RB-C301-5'],
    triggerRule: {
      lowBatteryThreshold: 35,
      minChargeMinutes: 20,
      chargeMethod: 'manualBatterySwap',
    },
  },
];

export function getChargeStrategyList(locale: DataLocale): ChargeStrategyRecord[] {
  return localizedChargeStrategyList.map((item) => ({
    ...item,
    name: resolveLocalizedText(item.name, locale),
    robotGroup: item.robotGroup.map((group) => resolveLocalizedText(group, locale)),
  }));
}

export const chargeStrategyList: ChargeStrategyRecord[] = getChargeStrategyList('zh-CN');
