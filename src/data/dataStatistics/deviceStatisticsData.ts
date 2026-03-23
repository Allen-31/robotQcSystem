export type PeriodKey = 'day1' | 'day7' | 'month1';
export type ExceptionLevel = 'none' | 'low' | 'medium' | 'high';

export interface DeviceRecord {
  id: string;
  type: string;
  group: string;
  workshop: string;
  workstation: string;
  station: string;
  online: boolean;
  battery: number;
  runtimeHourToday: number;
  tasksToday: number;
  currentTask: string;
  lastHeartbeat: string;
  exceptionLevel: ExceptionLevel;
  exceptionCount: number;
}

export const workshops = ['\u603B\u88C5\u4E00\u8F66\u95F4', '\u603B\u88C5\u4E8C\u8F66\u95F4', '\u603B\u88C5\u4E09\u8F66\u95F4'];
export const workstations = ['\u8D28\u68C0\u533AA', '\u8D28\u68C0\u533AB', '\u8D28\u68C0\u533AC', '\u8D28\u68C0\u533AD'];
export const stations = ['ST-A01', 'ST-A02', 'ST-B01', 'ST-B02', 'ST-C01', 'ST-D01'];
export const robotTypes = ['AMR', 'AGV', '\u673A\u68B0\u81C2'];
export const robotGroups = ['RG-\u88C5\u914D', 'RG-\u642C\u8FD0', 'RG-\u590D\u68C0'];

export const deviceData: DeviceRecord[] = Array.from({ length: 36 }, (_, index) => {
  const online = index % 7 !== 0;
  const exceptionLevel: ExceptionLevel = !online ? 'high' : index % 6 === 0 ? 'medium' : index % 4 === 0 ? 'low' : 'none';
  return {
    id: `RB-${String(index + 1).padStart(3, '0')}`,
    type: robotTypes[index % robotTypes.length],
    group: robotGroups[index % robotGroups.length],
    workshop: workshops[index % workshops.length],
    workstation: workstations[index % workstations.length],
    station: stations[index % stations.length],
    online,
    battery: 18 + ((index * 7) % 82),
    runtimeHourToday: Number((2.2 + (index % 8) * 0.9).toFixed(1)),
    tasksToday: 3 + (index % 18),
    currentTask: index % 3 === 0 ? '-' : `TK-${20260300 + (index % 28)}`,
    lastHeartbeat: `2026-03-05 ${String(8 + (index % 12)).padStart(2, '0')}:${String((index * 7) % 60).padStart(2, '0')}:00`,
    exceptionLevel,
    exceptionCount: exceptionLevel === 'none' ? 0 : 1 + (index % 5),
  };
});

export function formatLastUpdated(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const sec = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}:${sec}`;
}

export function getMockRecentExceptions(_deviceId: string): { id: string; level: string; type: string; time: string }[] {
  void _deviceId;
  return [
    { id: 'EX-001', level: 'P2', type: '\u8DEF\u5F84\u89C4\u5212\u5F02\u5E38', time: '2026-03-05 14:32' },
    { id: 'EX-002', level: 'P3', type: '\u7535\u91CF\u4F4E\u544A\u8B66', time: '2026-03-05 11:20' },
  ];
}

export function getMockRecentTasks(_deviceId: string): { id: string; status: string; createdAt: string }[] {
  void _deviceId;
  return [
    { id: 'TK-20260301', status: 'finished', createdAt: '2026-03-05 15:10' },
    { id: 'TK-20260302', status: 'running', createdAt: '2026-03-05 14:55' },
    { id: 'TK-20260300', status: 'finished', createdAt: '2026-03-05 13:20' },
  ];
}
