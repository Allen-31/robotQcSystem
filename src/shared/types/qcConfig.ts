export interface WorkstationConfig {
  id: string;
  name: string;
  workshopCode: string;
  wireHarnessType: string;
  robotGroup: string;
  enabled: boolean;
}

export interface StationConfig {
  workstationId: string;
  stationId: string;
  mapPoint: string;
  callBoxCode: string;
  wireHarnessType: string;
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
  id: string;
  sn: string;
  terminalType: string;
  terminalIp: string;
  workstationId: string;
  boundStationIds: string[];
  online: boolean;
  currentUser: string;
}
