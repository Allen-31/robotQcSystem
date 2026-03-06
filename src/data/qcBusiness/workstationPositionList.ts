export type RobotStatus = 'idle' | 'working' | 'fault' | 'offline';

export type WorkOrderStatus = 'pending' | 'running' | 'finished' | 'ng';

export type QualityResult = 'ok' | 'ng' | 'pending';

export interface RobotInfo {
  robotCode: string;
  status: RobotStatus;
  battery: number;
  abnormalInfo: string;
}

export interface WorkOrderInfo {
  workOrderNo: string;
  movingDuration: number;
  fixtureLineType: string;
  stationCode: string;
  status: WorkOrderStatus;
  qualityResult: QualityResult;
  defectType: string;
  defectDescription: string;
  taskIds: string[];
  detectionDuration: number;
  createdAt: string;
  startedAt: string;
  endedAt: string;
}

export interface WorkstationPositionItem {
  id: string;
  name: string;
  stationCode: string;
  enabled: boolean;
  todayInspectionCount: number;
  detectionRate: number;
  reviewRate: number;
  robots: RobotInfo[];
  currentWorkOrder: WorkOrderInfo;
  historyWorkOrders: WorkOrderInfo[];
}

export const workstationPositionList: WorkstationPositionItem[] = [
  {
    id: 'PS-001',
    name: 'Station A1-01',
    stationCode: 'A1-01',
    enabled: true,
    todayInspectionCount: 126,
    detectionRate: 98.4,
    reviewRate: 96.7,
    robots: [
      {
        robotCode: 'RB-A101-1',
        status: 'working',
        battery: 74,
        abnormalInfo: 'None',
      },
      {
        robotCode: 'RB-A101-2',
        status: 'fault',
        battery: 88,
        abnormalInfo: 'Motor overcurrent alarm',
      },
    ],
    currentWorkOrder: {
      workOrderNo: 'WO-20260228-001',
      movingDuration: 12.6,
      fixtureLineType: 'Harness-L2',
      stationCode: 'A1-01',
      status: 'running',
      qualityResult: 'pending',
      defectType: '-',
      defectDescription: '-',
      taskIds: ['TSK-001', 'TSK-002', 'TSK-003'],
      detectionDuration: 8.1,
      createdAt: '2026-02-28 08:10:22',
      startedAt: '2026-02-28 08:12:03',
      endedAt: '-',
    },
    historyWorkOrders: [
      {
        workOrderNo: 'WO-20260228-000',
        movingDuration: 11.2,
        fixtureLineType: 'Harness-L2',
        stationCode: 'A1-01',
        status: 'finished',
        qualityResult: 'ok',
        defectType: '-',
        defectDescription: '-',
        taskIds: ['TSK-996', 'TSK-997'],
        detectionDuration: 7.6,
        createdAt: '2026-02-28 07:44:10',
        startedAt: '2026-02-28 07:45:33',
        endedAt: '2026-02-28 07:53:14',
      },
      {
        workOrderNo: 'WO-20260227-214',
        movingDuration: 13.4,
        fixtureLineType: 'Harness-L1',
        stationCode: 'A1-01',
        status: 'ng',
        qualityResult: 'ng',
        defectType: '外观异常',
        defectDescription: '端子护套边缘有破损',
        taskIds: ['TSK-944', 'TSK-945', 'TSK-946'],
        detectionDuration: 9.3,
        createdAt: '2026-02-27 17:31:44',
        startedAt: '2026-02-27 17:33:12',
        endedAt: '2026-02-27 17:42:30',
      },
      {
        workOrderNo: 'WO-20260227-198',
        movingDuration: 10.7,
        fixtureLineType: 'Harness-L3',
        stationCode: 'A1-01',
        status: 'finished',
        qualityResult: 'ok',
        defectType: '-',
        defectDescription: '-',
        taskIds: ['TSK-900'],
        detectionDuration: 6.8,
        createdAt: '2026-02-27 15:20:09',
        startedAt: '2026-02-27 15:21:35',
        endedAt: '2026-02-27 15:28:16',
      },
    ],
  },
  {
    id: 'PS-002',
    name: 'Station A1-02',
    stationCode: 'A1-02',
    enabled: true,
    todayInspectionCount: 98,
    detectionRate: 97.5,
    reviewRate: 95.8,
    robots: [
      {
        robotCode: 'RB-A102-1',
        status: 'idle',
        battery: 86,
        abnormalInfo: 'None',
      },
      {
        robotCode: 'RB-A102-2',
        status: 'working',
        battery: 67,
        abnormalInfo: 'None',
      },
    ],
    currentWorkOrder: {
      workOrderNo: 'WO-20260228-013',
      movingDuration: 9.4,
      fixtureLineType: 'Harness-L1',
      stationCode: 'A1-02',
      status: 'pending',
      qualityResult: 'pending',
      defectType: '-',
      defectDescription: '-',
      taskIds: ['TSK-031'],
      detectionDuration: 0,
      createdAt: '2026-02-28 09:05:40',
      startedAt: '-',
      endedAt: '-',
    },
    historyWorkOrders: [
      {
        workOrderNo: 'WO-20260228-010',
        movingDuration: 8.8,
        fixtureLineType: 'Harness-L1',
        stationCode: 'A1-02',
        status: 'finished',
        qualityResult: 'ok',
        defectType: '-',
        defectDescription: '-',
        taskIds: ['TSK-022', 'TSK-023'],
        detectionDuration: 6.5,
        createdAt: '2026-02-28 08:25:12',
        startedAt: '2026-02-28 08:27:00',
        endedAt: '2026-02-28 08:33:20',
      },
      {
        workOrderNo: 'WO-20260227-188',
        movingDuration: 10.1,
        fixtureLineType: 'Harness-L2',
        stationCode: 'A1-02',
        status: 'finished',
        qualityResult: 'ok',
        defectType: '-',
        defectDescription: '-',
        taskIds: ['TSK-854', 'TSK-855'],
        detectionDuration: 7.2,
        createdAt: '2026-02-27 14:15:54',
        startedAt: '2026-02-27 14:17:10',
        endedAt: '2026-02-27 14:24:40',
      },
    ],
  },
  {
    id: 'PS-003',
    name: 'Station A1-03',
    stationCode: 'A1-03',
    enabled: false,
    todayInspectionCount: 84,
    detectionRate: 95.2,
    reviewRate: 94.1,
    robots: [
      {
        robotCode: 'RB-A103-1',
        status: 'fault',
        battery: 42,
        abnormalInfo: 'Vision module temperature too high',
      },
      {
        robotCode: 'RB-A103-2',
        status: 'offline',
        battery: 0,
        abnormalInfo: 'Offline',
      },
    ],
    currentWorkOrder: {
      workOrderNo: 'WO-20260228-021',
      movingDuration: 14.8,
      fixtureLineType: 'Harness-L3',
      stationCode: 'A1-03',
      status: 'ng',
      qualityResult: 'ng',
      defectType: '工艺偏差',
      defectDescription: '压接长度不符合工艺阈值',
      taskIds: ['TSK-061', 'TSK-062'],
      detectionDuration: 12.3,
      createdAt: '2026-02-28 09:40:08',
      startedAt: '2026-02-28 09:42:15',
      endedAt: '2026-02-28 09:54:18',
    },
    historyWorkOrders: [
      {
        workOrderNo: 'WO-20260228-018',
        movingDuration: 13.5,
        fixtureLineType: 'Harness-L3',
        stationCode: 'A1-03',
        status: 'finished',
        qualityResult: 'ok',
        defectType: '-',
        defectDescription: '-',
        taskIds: ['TSK-051'],
        detectionDuration: 10.2,
        createdAt: '2026-02-28 09:08:20',
        startedAt: '2026-02-28 09:10:01',
        endedAt: '2026-02-28 09:20:30',
      },
      {
        workOrderNo: 'WO-20260227-163',
        movingDuration: 15.6,
        fixtureLineType: 'Harness-L4',
        stationCode: 'A1-03',
        status: 'ng',
        qualityResult: 'ng',
        defectType: '接线错误',
        defectDescription: '线序与工艺定义不一致',
        taskIds: ['TSK-802', 'TSK-803', 'TSK-804'],
        detectionDuration: 13.8,
        createdAt: '2026-02-27 10:22:41',
        startedAt: '2026-02-27 10:24:08',
        endedAt: '2026-02-27 10:38:06',
      },
    ],
  },
];
