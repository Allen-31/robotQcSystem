export interface FileManageRecord {
  id: string;
  name: string;
  type: string;
  size: string;
  tags: string[];
  createdAt: string;
}

export const fileManageList: FileManageRecord[] = [
  {
    id: 'FILE-001',
    name: 'station-a1-inspection-video.mp4',
    type: '视频',
    size: '128.4 MB',
    tags: ['工位', '质检结果', '机器人'],
    createdAt: '2026-03-04 09:12:30',
  },
  {
    id: 'FILE-002',
    name: 'workorder-wo-20260304-021-report.pdf',
    type: '文档',
    size: '2.6 MB',
    tags: ['工单', '质检结果'],
    createdAt: '2026-03-04 09:43:10',
  },
  {
    id: 'FILE-003',
    name: 'robot-rb-a101-log.txt',
    type: '日志',
    size: '768 KB',
    tags: ['机器人'],
    createdAt: '2026-03-04 10:21:56',
  },
  {
    id: 'FILE-004',
    name: 'station-st-003-snapshot.jpg',
    type: '图片',
    size: '4.2 MB',
    tags: ['工位', '质检结果'],
    createdAt: '2026-03-04 11:05:42',
  },
];

