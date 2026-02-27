export type WorkstationStatus = '运行中' | '维护中' | '空闲';

export interface Workstation {
  id: string;
  name: string;
  factory: string;
  inspectionStationCount: number;
  location: string;
  stationList: string[];
  status: WorkstationStatus;
}
