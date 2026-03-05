import factorySceneImage from '../../assets/factory-scene.png';
import { resolveLocalizedText, type DataLocale, type LocalizedText } from '../localized';

export interface FileManageRecord {
  id: string;
  name: string;
  type: string;
  size: string;
  tags: string[];
  createdAt: string;
  previewUrl?: string;
  previewContent?: string;
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
    previewUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 'FILE-002',
    name: 'workorder-wo-20260304-021-report.pdf',
    type: { zh: '文档', en: 'Document' },
    size: '2.6 MB',
    tags: [{ zh: '工单', en: 'Work Order' }, { zh: '质检结果', en: 'QC Result' }],
    createdAt: '2026-03-04 09:43:10',
    previewUrl: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
  },
  {
    id: 'FILE-003',
    name: 'robot-rb-a101-log.txt',
    type: { zh: '日志', en: 'Log' },
    size: '768 KB',
    tags: [{ zh: '机器人', en: 'Robot' }],
    createdAt: '2026-03-04 10:21:56',
    previewContent: `[2026-03-04 10:21:53] INFO  [RB-A101] Inspection task started
[2026-03-04 10:21:54] INFO  [RB-A101] Camera stream online
[2026-03-04 10:21:55] WARN  [RB-A101] Minor vibration detected
[2026-03-04 10:21:56] INFO  [RB-A101] Upload result completed`,
  },
  {
    id: 'FILE-004',
    name: 'station-st-003-snapshot.jpg',
    type: { zh: '图片', en: 'Image' },
    size: '4.2 MB',
    tags: [{ zh: '工位', en: 'Station' }, { zh: '质检结果', en: 'QC Result' }],
    createdAt: '2026-03-04 11:05:42',
    previewUrl: factorySceneImage,
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
