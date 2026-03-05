import { resolveLocalizedText, type DataLocale, type LocalizedText } from '../localized';
import type { MapManageRecord } from '../../shared/types/deployConfig';

interface LocalizedMapManageRecord extends Omit<MapManageRecord, 'name'> {
  name: LocalizedText;
}

const localizedMapList: LocalizedMapManageRecord[] = [
  {
    code: 'MAP-001',
    name: { zh: '总装车间-A', en: 'Assembly Workshop A' },
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
    name: { zh: '质检线-B', en: 'Quality Line B' },
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
    name: { zh: '电测工位区', en: 'Electrical Test Station Area' },
    type: '3D',
    editStatus: 'completed',
    publishStatus: 'published',
    editedAt: '2026-02-28 19:05:27',
    editedBy: 'Wang Min',
    publishedAt: '2026-03-01 09:15:08',
    publishedBy: 'Wang Min',
  },
];

export function getMapList(locale: DataLocale): MapManageRecord[] {
  return localizedMapList.map((item) => ({
    ...item,
    name: resolveLocalizedText(item.name, locale),
  }));
}

export const mapList: MapManageRecord[] = getMapList('zh-CN');
