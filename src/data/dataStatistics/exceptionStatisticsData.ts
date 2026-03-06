export type Level = 'P1' | 'P2' | 'P3';
export type Status = 'pending' | 'processing' | 'closed';

export interface ExceptionRecord {
  id: string;
  level: Level;
  type: string;
  source: string;
  workshop: string;
  workstation: string;
  station: string;
  robot: string;
  status: Status;
  createdAt: string;
  firstResponseAt: string;
  closedAt: string;
  owner: string;
  relatedTask: string;
  description: string;
  responseMinutes: number;
  closeMinutes: number;
}

export const levelList: Level[] = ['P1', 'P2', 'P3'];
export const typeList = ['路径规划异常', '视觉识别异常', '网络通信异常', '电量异常', '任务超时'];
export const sourceList = ['机器人管理服务', '任务编排服务', '视觉算法服务', '调度服务'];
export const statusList: Status[] = ['pending', 'processing', 'closed'];
export const workshopList = ['总装一车间', '总装二车间', '总装三车间'];
export const workstationList = ['质检区A', '质检区B', '质检区C', '质检区D'];
export const stationList = ['ST-A01', 'ST-A02', 'ST-B01', 'ST-B02', 'ST-C01', 'ST-D01'];

/** Base date for mock data: last day of the range (e.g. today). */
const baseDate = new Date(2026, 2, 6); // 2026-03-06

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const sec = String(d.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${day} ${h}:${min}:${sec}`;
}

export const exceptionData: ExceptionRecord[] = Array.from({ length: 72 }, (_, index) => {
  const status = statusList[index % statusList.length];
  const daysAgo = index % 30;
  const created = new Date(baseDate);
  created.setDate(created.getDate() - daysAgo);
  created.setHours(8 + (index % 12), (index * 7) % 60, 0);
  const createdAt = formatDate(created);
  const responseMinutes = 5 + (index % 36);
  const closeMinutes = status === 'closed' ? 20 + (index % 180) : 0;
  const firstResponse = new Date(created.getTime() + responseMinutes * 60 * 1000);
  const closedAtTime =
    status === 'closed' ? new Date(created.getTime() + (responseMinutes + closeMinutes) * 60 * 1000) : null;
  return {
    id: `EX-202603-${String(index + 1).padStart(3, '0')}`,
    level: levelList[index % levelList.length],
    type: typeList[index % typeList.length],
    source: sourceList[index % sourceList.length],
    workshop: workshopList[index % workshopList.length],
    workstation: workstationList[index % workstationList.length],
    station: stationList[index % stationList.length],
    robot: `RB-${String((index % 36) + 1).padStart(3, '0')}`,
    status,
    createdAt,
    firstResponseAt: formatDate(firstResponse),
    closedAt: closedAtTime ? formatDate(closedAtTime) : '-',
    owner: ['admin', 'ops', 'qc', 'pe'][index % 4],
    relatedTask: `TK-202603-${String((index % 140) + 1).padStart(3, '0')}`,
    description: `异常描述-${index + 1}`,
    responseMinutes,
    closeMinutes,
  };
});

/** Response overdue threshold in minutes (e.g. SLA: first response within 15 min). */
export const RESPONSE_OVERDUE_MINUTES = 15;
