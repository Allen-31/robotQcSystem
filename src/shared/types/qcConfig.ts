export interface WorkstationConfig {
  /** Primary key (Snowflake Long), used by update/delete APIs */
  id: number | string;
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
  /** Primary key (Snowflake Long), local mock can use string */
  id: number | string;
  name: string;
  project?: string;
  taskType: string;
  planarStructureFile: string;
  threeDStructureFile: string;
}

export interface TerminalConfig {
  /** Primary key (Snowflake Long), backend should return string to avoid JS precision loss */
  id: number | string;
  /** Business code */
  code: string;
  /** Device SN */
  sn: string;
  terminalType: string;
  terminalIp: string;
  workstationId: string;
  boundStationIds: string[];
  online: boolean;
  currentUser: string;
}
