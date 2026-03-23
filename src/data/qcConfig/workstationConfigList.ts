import type { WorkstationConfig } from '../../shared/types/qcConfig';

export const workstationConfigList: WorkstationConfig[] = [
  {
    id: 'WS-CFG-001',
    name: 'Assembly Workstation 1',
    workshopCode: 'WSH-001',
    wireHarnessType: 'Main Harness A',
    robotGroup: 'RG-01',
    enabled: true,
  },
  {
    id: 'WS-CFG-002',
    name: 'Assembly Workstation 2',
    workshopCode: 'WSH-002',
    wireHarnessType: 'Control Harness B',
    robotGroup: 'RG-02',
    enabled: true,
  },
  {
    id: 'WS-CFG-003',
    name: 'Repair Workstation',
    workshopCode: 'WSH-003',
    wireHarnessType: 'High Voltage Harness C',
    robotGroup: 'RG-03',
    enabled: false,
  },
];