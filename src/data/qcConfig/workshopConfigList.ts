export interface WorkshopConfigItem {
  code: string;
  name: string;
  location: string;
}

export const workshopConfigList: WorkshopConfigItem[] = [
  {
    code: 'WSH-001',
    name: '总装一车间',
    location: 'A栋 1F',
  },
  {
    code: 'WSH-002',
    name: '总装二车间',
    location: 'A栋 2F',
  },
  {
    code: 'WSH-003',
    name: '线束预装车间',
    location: 'B栋 1F',
  },
];

