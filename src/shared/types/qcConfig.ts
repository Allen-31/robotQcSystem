export interface WorkstationConfig {
  /** 主键（Snowflake Long），更新/删除时用 */
  id: number;
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
  /** 主键（Snowflake Long），更新/删除时用；本地 mock 可为 string */
  id: number | string;
  name: string;
  project?: string;
  taskType: string;
  planarStructureFile: string;
  threeDStructureFile: string;
}

export interface TerminalConfig {
  /** 主键（Snowflake Long），后端自动生成；建议后端以 string 返回避免 JS 大数精度丢失，更新/删除时用 */
  id: number | string;
  /** 编码，对应数据库 code，用户填写 */
  code: string;
  /** SN 号 */
  sn: string;
  terminalType: string;
  terminalIp: string;
  workstationId: string;
  boundStationIds: string[];
  online: boolean;
  currentUser: string;
}
