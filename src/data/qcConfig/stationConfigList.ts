import type { StationConfig } from '../../shared/types/qcConfig';

export const stationConfigList: StationConfig[] = [
  {
    workstationId: 'WS-CFG-001',
    stationId: 'ST-001',
    mapPoint: 'X:12,Y:35',
    detectionEnabled: true,
    enabled: true,
  },
  {
    workstationId: 'WS-CFG-001',
    stationId: 'ST-002',
    mapPoint: 'X:18,Y:35',
    detectionEnabled: true,
    enabled: true,
  },
  {
    workstationId: 'WS-CFG-002',
    stationId: 'ST-003',
    mapPoint: 'X:28,Y:40',
    detectionEnabled: false,
    enabled: true,
  },
  {
    workstationId: 'WS-CFG-003',
    stationId: 'ST-004',
    mapPoint: 'X:32,Y:52',
    detectionEnabled: true,
    enabled: false,
  },
];
