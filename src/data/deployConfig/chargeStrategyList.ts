import type { ChargeStrategyRecord } from '../../shared/types/deployConfig';

export const chargeStrategyList: ChargeStrategyRecord[] = [
  {
    code: 'CS-001',
    name: '低电量优先回充',
    status: 'enabled',
    robotType: ['AMR'],
    robotGroup: ['总装一线'],
    robot: ['RB-A101-1'],
    triggerRule: {
      lowBatteryThreshold: 20,
      minChargeMinutes: 10,
      chargeMethod: 'auto',
    },
  },
  {
    code: 'CS-002',
    name: '夜间窗口补电',
    status: 'enabled',
    robotType: ['AMR', 'AGV'],
    robotGroup: ['质检二线'],
    robot: ['RB-B203-2'],
    triggerRule: {
      lowBatteryThreshold: 60,
      minChargeMinutes: 15,
      chargeMethod: 'chargingPile',
    },
  },
  {
    code: 'CS-003',
    name: '峰谷调度充电',
    status: 'disabled',
    robotType: ['AGV'],
    robotGroup: ['物流转运'],
    robot: ['RB-C301-4', 'RB-C301-5'],
    triggerRule: {
      lowBatteryThreshold: 35,
      minChargeMinutes: 20,
      chargeMethod: 'manualBatterySwap',
    },
  },
];
