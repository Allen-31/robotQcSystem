export type WorkstationStatus = 'running' | 'maintenance' | 'idle';

export interface Workstation {
  id: string;
  name: string;
  factory: string;
  inspectionStationCount: number;
  location: string;
  stationList: string[];
  status: WorkstationStatus;
}
