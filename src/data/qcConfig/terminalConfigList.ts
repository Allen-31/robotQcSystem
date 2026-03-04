import type { TerminalConfig } from '../../shared/types/qcConfig';

export const terminalConfigList: TerminalConfig[] = [
  {
    id: 'TM-001',
    sn: 'SN-QC-2026001',
    terminalType: '工控终端',
    terminalIp: '192.168.10.21',
    workstationId: 'WS-CFG-001',
    boundStationIds: ['ST-001', 'ST-002'],
    online: true,
    currentUser: 'qc.operator',
  },
  {
    id: 'TM-002',
    sn: 'SN-QC-2026002',
    terminalType: '平板终端',
    terminalIp: '192.168.10.31',
    workstationId: 'WS-CFG-002',
    boundStationIds: ['ST-003'],
    online: true,
    currentUser: 'robot.admin',
  },
  {
    id: 'TM-003',
    sn: 'SN-QC-2026003',
    terminalType: '工控终端',
    terminalIp: '192.168.10.41',
    workstationId: 'WS-CFG-003',
    boundStationIds: ['ST-004'],
    online: false,
    currentUser: '-',
  },
];
