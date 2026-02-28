import type { TerminalConfig } from '../../shared/types/qcConfig';

export const terminalConfigList: TerminalConfig[] = [
  {
    terminalId: '192.168.10.21',
    workstationId: 'WS-CFG-001',
    boundStationIds: ['ST-001', 'ST-002'],
    online: true,
    currentUser: 'qc.operator',
  },
  {
    terminalId: '192.168.10.31',
    workstationId: 'WS-CFG-002',
    boundStationIds: ['ST-003'],
    online: true,
    currentUser: 'robot.admin',
  },
  {
    terminalId: '192.168.10.41',
    workstationId: 'WS-CFG-003',
    boundStationIds: ['ST-004'],
    online: false,
    currentUser: '-',
  },
];
