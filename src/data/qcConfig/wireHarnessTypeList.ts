import type { WireHarnessTypeConfig } from '../../shared/types/qcConfig';

export const wireHarnessTypeList: WireHarnessTypeConfig[] = [
  {
    id: 'WH-001',
    name: '主驱线束-A',
    project: '项目A',
    taskType: '插接检测',
    planarStructureFile: 'main-drive-a-2d.png',
    threeDStructureFile: 'main-drive-a-3d.glb',
  },
  {
    id: 'WH-002',
    name: '控制线束-B',
    project: '项目A',
    taskType: '针脚检测',
    planarStructureFile: 'control-b-2d.png',
    threeDStructureFile: 'control-b-3d.stl',
  },
  {
    id: 'WH-003',
    name: '高压线束-C',
    project: '项目B',
    taskType: '绝缘检测',
    planarStructureFile: 'high-voltage-c-2d.png',
    threeDStructureFile: 'high-voltage-c-3d.obj',
  },
];
