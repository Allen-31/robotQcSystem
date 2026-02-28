export interface WorkstationConfig {
  id: string;
  name: string;
  wireHarnessType: string;
  robotGroup: string;
  enabled: boolean;
}

export interface StationConfig {
  workstationId: string;
  stationId: string;
  mapPoint: string;
  detectionEnabled: boolean;
  enabled: boolean;
}

export interface WireHarnessTypeConfig {
  id: string;
  name: string;
  taskType: string;
  planarStructureFile: string;
  threeDStructureFile: string;
}

export interface TerminalConfig {
  terminalId: string;
  workstationId: string;
  boundStationIds: string[];
  online: boolean;
  currentUser: string;
}
