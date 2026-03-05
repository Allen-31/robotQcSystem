import { resolveLocalizedText, type DataLocale, type LocalizedText } from '../localized';

export interface FileManageRecord {
  id: string;
  name: string;
  type: string;
  size: string;
  tags: string[];
  createdAt: string;
}

interface LocalizedFileManageRecord extends Omit<FileManageRecord, 'type' | 'tags'> {
  type: LocalizedText;
  tags: LocalizedText[];
}

const localizedFileManageList: LocalizedFileManageRecord[] = [
  {
    id: 'FILE-001',
    name: 'station-a1-inspection-video.mp4',
    type: { zh: '视频', en: 'Video' },
    size: '128.4 MB',
    tags: [{ zh: '工位', en: 'Station' }, { zh: '质检结果', en: 'QC Result' }, { zh: '机器人', en: 'Robot' }],
    createdAt: '2026-03-04 09:12:30',
  },
  {
    id: 'FILE-002',
    name: 'workorder-wo-20260304-021-report.pdf',
    type: { zh: '文档', en: 'Document' },
    size: '2.6 MB',
    tags: [{ zh: '工单', en: 'Work Order' }, { zh: '质检结果', en: 'QC Result' }],
    createdAt: '2026-03-04 09:43:10',
  },
  {
    id: 'FILE-003',
    name: 'robot-rb-a101-log.txt',
    type: { zh: '日志', en: 'Log' },
    size: '768 KB',
    tags: [{ zh: '机器人', en: 'Robot' }],
    createdAt: '2026-03-04 10:21:56',
  },
  {
    id: 'FILE-004',
    name: 'station-st-003-snapshot.jpg',
    type: { zh: '图片', en: 'Image' },
    size: '4.2 MB',
    tags: [{ zh: '工位', en: 'Station' }, { zh: '质检结果', en: 'QC Result' }],
    createdAt: '2026-03-04 11:05:42',
  },
];

export function getFileManageList(locale: DataLocale): FileManageRecord[] {
  return localizedFileManageList.map((item) => ({
    ...item,
    type: resolveLocalizedText(item.type, locale),
    tags: item.tags.map((tag) => resolveLocalizedText(tag, locale)),
  }));
}

export const fileManageList: FileManageRecord[] = getFileManageList('zh-CN');
