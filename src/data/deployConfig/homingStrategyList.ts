import type { HomingStrategyRecord } from '../../shared/types/deployConfig';

export const homingStrategyList: HomingStrategyRecord[] = [
  {
    code: 'HS-001',
    name: '标准空闲归巢',
    status: 'enabled',
    robotType: ['AMR'],
    robotGroup: ['总装一线'],
    robot: ['RB-A101-1'],
    triggerRule: {
      idleWaitSeconds: 5,
    },
  },
  {
    code: 'HS-002',
    name: '夜间批量归巢',
    status: 'enabled',
    robotType: ['AMR', 'AGV'],
    robotGroup: ['质检二线'],
    robot: ['RB-B203-2', 'RB-C301-4'],
    triggerRule: {
      idleWaitSeconds: 10,
    },
  },
  {
    code: 'HS-003',
    name: '峰值避让归巢',
    status: 'disabled',
    robotType: ['AGV'],
    robotGroup: ['物流转运'],
    robot: ['RB-C301-5'],
    triggerRule: {
      idleWaitSeconds: 8,
    },
  },
];

