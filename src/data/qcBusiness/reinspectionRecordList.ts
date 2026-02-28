export type ReinspectionStatus = 'pending' | 'completed' | 'cancelled';

export type ReinspectionResult = 'ok' | 'ng' | 'pending';

export interface ReinspectionRecordItem {
  id: string;
  workOrderNo: string;
  harnessCode: string;
  harnessType: string;
  stationCode: string;
  status: ReinspectionStatus;
  reinspectionResult: ReinspectionResult;
  reinspectionTime: string;
  reviewer: string;
  videoUrl: string;
  imageUrl: string;
}

export const reinspectionRecordList: ReinspectionRecordItem[] = [
  {
    id: 'RI-001',
    workOrderNo: 'WO-20260228-193',
    harnessCode: 'HB-20260228-001',
    harnessType: 'Harness-L3',
    stationCode: 'A1-03',
    status: 'completed',
    reinspectionResult: 'ok',
    reinspectionTime: '2026-02-28 10:25:14',
    reviewer: 'Zhang Wei',
    videoUrl: 'https://example.com/reinspection/video/ri-001',
    imageUrl: 'https://example.com/reinspection/image/ri-001.jpg',
  },
  {
    id: 'RI-002',
    workOrderNo: 'WO-20260228-187',
    harnessCode: 'HB-20260228-007',
    harnessType: 'Harness-L1',
    stationCode: 'A1-02',
    status: 'completed',
    reinspectionResult: 'ng',
    reinspectionTime: '2026-02-28 09:58:43',
    reviewer: 'Li Na',
    videoUrl: 'https://example.com/reinspection/video/ri-002',
    imageUrl: 'https://example.com/reinspection/image/ri-002.jpg',
  },
  {
    id: 'RI-003',
    workOrderNo: 'WO-20260228-180',
    harnessCode: 'HB-20260228-012',
    harnessType: 'Harness-L4',
    stationCode: 'B2-01',
    status: 'pending',
    reinspectionResult: 'pending',
    reinspectionTime: '2026-02-28 09:31:10',
    reviewer: 'Wang Hao',
    videoUrl: 'https://example.com/reinspection/video/ri-003',
    imageUrl: 'https://example.com/reinspection/image/ri-003.jpg',
  },
  {
    id: 'RI-004',
    workOrderNo: 'WO-20260227-332',
    harnessCode: 'HB-20260227-102',
    harnessType: 'Harness-L2',
    stationCode: 'B2-03',
    status: 'cancelled',
    reinspectionResult: 'pending',
    reinspectionTime: '2026-02-27 17:55:26',
    reviewer: 'Chen Yu',
    videoUrl: 'https://example.com/reinspection/video/ri-004',
    imageUrl: 'https://example.com/reinspection/image/ri-004.jpg',
  },
];
