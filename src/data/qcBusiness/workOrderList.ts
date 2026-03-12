export type WorkOrderStatus = 'pending' | 'running' | 'paused' | 'finished' | 'ng' | 'cancelled';

export type QualityResult = 'ok' | 'ng' | 'pending';

export interface WorkOrderItem {
  id: string;
  workOrderNo: string;
  harnessCode: string;
  movingDuration: number;
  harnessType: string;
  stationCode: string;
  status: WorkOrderStatus;
  qualityResult: QualityResult;
  taskIds: string[];
  detectionDuration: number;
  createdAt: string;
  startedAt: string;
  endedAt: string;
  defectType: string;
  defectDescription: string;
}

export const workOrderList: WorkOrderItem[] = [
  {
    id: 'WO-1',
    workOrderNo: 'WO-20260228-201',
    harnessCode: 'HB-20260228-201',
    movingDuration: 12.4,
    harnessType: 'Harness-L2',
    stationCode: 'A1-01',
    status: 'running',
    qualityResult: 'pending',
    taskIds: ['TSK-201', 'TSK-202', 'TSK-203'],
    detectionDuration: 8.3,
    createdAt: '2026-02-28 10:02:15',
    startedAt: '2026-02-28 10:03:40',
    endedAt: '-',
    defectType: '-',
    defectDescription: '-',
  },
  {
    id: 'WO-2',
    workOrderNo: 'WO-20260228-198',
    harnessCode: 'HB-20260228-198',
    movingDuration: 10.8,
    harnessType: 'Harness-L1',
    stationCode: 'A1-02',
    status: 'finished',
    qualityResult: 'ok',
    taskIds: ['TSK-190', 'TSK-191'],
    detectionDuration: 7.5,
    createdAt: '2026-02-28 09:38:20',
    startedAt: '2026-02-28 09:40:00',
    endedAt: '2026-02-28 09:47:32',
    defectType: '-',
    defectDescription: '-',
  },
  {
    id: 'WO-3',
    workOrderNo: 'WO-20260228-193',
    harnessCode: 'HB-20260228-193',
    movingDuration: 14.1,
    harnessType: 'Harness-L3',
    stationCode: 'A1-03',
    status: 'ng',
    qualityResult: 'ng',
    taskIds: ['TSK-176', 'TSK-177', 'TSK-178'],
    detectionDuration: 11.9,
    createdAt: '2026-02-28 09:05:11',
    startedAt: '2026-02-28 09:07:42',
    endedAt: '2026-02-28 09:19:58',
    defectType: '接线错误',
    defectDescription: '端子位序与工艺定义不一致',
  },
  {
    id: 'WO-4',
    workOrderNo: 'WO-20260228-189',
    harnessCode: 'HB-20260228-189',
    movingDuration: 9.9,
    harnessType: 'Harness-L2',
    stationCode: 'A1-04',
    status: 'pending',
    qualityResult: 'pending',
    taskIds: ['TSK-160'],
    detectionDuration: 0,
    createdAt: '2026-02-28 08:42:00',
    startedAt: '-',
    endedAt: '-',
    defectType: '-',
    defectDescription: '-',
  },
  {
    id: 'WO-5',
    workOrderNo: 'WO-20260228-180',
    harnessCode: 'HB-20260228-180',
    movingDuration: 13.2,
    harnessType: 'Harness-L4',
    stationCode: 'B2-01',
    status: 'cancelled',
    qualityResult: 'pending',
    taskIds: ['TSK-141', 'TSK-142'],
    detectionDuration: 0,
    createdAt: '2026-02-28 08:10:14',
    startedAt: '-',
    endedAt: '2026-02-28 08:12:31',
    defectType: '-',
    defectDescription: '-',
  },
  {
    id: 'WO-6',
    workOrderNo: 'WO-20260227-332',
    harnessCode: 'HB-20260227-332',
    movingDuration: 11.6,
    harnessType: 'Harness-L1',
    stationCode: 'B2-03',
    status: 'finished',
    qualityResult: 'ok',
    taskIds: ['TSK-900', 'TSK-901'],
    detectionDuration: 8.1,
    createdAt: '2026-02-27 17:33:45',
    startedAt: '2026-02-27 17:35:19',
    endedAt: '2026-02-27 17:43:25',
    defectType: '-',
    defectDescription: '-',
  },
];
