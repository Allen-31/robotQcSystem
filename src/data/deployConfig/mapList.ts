import type { MapManageRecord } from '../../shared/types/deployConfig';

export const mapList: MapManageRecord[] = [
  {
    code: 'MAP-001',
    name: '总装车间-A',
    type: '2D',
    editStatus: 'completed',
    publishStatus: 'published',
    editedAt: '2026-03-01 14:20:33',
    editedBy: 'Li Wei',
    publishedAt: '2026-03-01 16:00:00',
    publishedBy: 'Zhang Peng',
  },
  {
    code: 'MAP-002',
    name: '质检线-B',
    type: '2D',
    editStatus: 'editing',
    publishStatus: 'unpublished',
    editedAt: '2026-03-02 10:42:11',
    editedBy: 'Chen Hao',
    publishedAt: '-',
    publishedBy: '-',
  },
  {
    code: 'MAP-003',
    name: '电测工位区',
    type: '3D',
    editStatus: 'completed',
    publishStatus: 'published',
    editedAt: '2026-02-28 19:05:27',
    editedBy: 'Wang Min',
    publishedAt: '2026-03-01 09:15:08',
    publishedBy: 'Wang Min',
  },
];

