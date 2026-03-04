import type { WorkstationConfig } from '../../shared/types/qcConfig';

export const workstationConfigList: WorkstationConfig[] = [
  {
    id: 'WS-CFG-001',
    name: '总装一线工作站',
    workshopCode: 'WSH-001',
    wireHarnessType: '主驱线束-A',
    robotGroup: 'RG-01',
    enabled: true,
  },
  {
    id: 'WS-CFG-002',
    name: '总装二线工作站',
    workshopCode: 'WSH-002',
    wireHarnessType: '控制线束-B',
    robotGroup: 'RG-02',
    enabled: true,
  },
  {
    id: 'WS-CFG-003',
    name: '返修工作站',
    workshopCode: 'WSH-003',
    wireHarnessType: '高压线束-C',
    robotGroup: 'RG-03',
    enabled: false,
  },
];
