export type PackageType = 'cloud' | 'robot';

export interface PackagePartItem {
  part: string;
  version: string;
}

export interface PackageManageRecord {
  id: string;
  name: string;
  type: PackageType;
  targetParts: PackagePartItem[];
  description: string;
  size: string;
  md5: string;
  uploader: string;
  uploadedAt: string;
}

export const packageManageList: PackageManageRecord[] = [
  {
    id: 'PKG-001',
    name: 'cloud-release-20260304.zip',
    type: 'cloud',
    targetParts: [
      { part: 'api-gateway', version: 'v3.2.1' },
      { part: 'report-service', version: 'v2.8.0' },
      { part: 'dispatch-engine', version: 'v1.5.3' },
    ],
    description: '云平台补丁包，修复调度拥塞问题并优化报表查询',
    size: '124.6 MB',
    md5: '9f8a2e7d40f11bc7e42a9d8228f8a0a4',
    uploader: 'admin',
    uploadedAt: '2026-03-04 09:35:12',
  },
  {
    id: 'PKG-002',
    name: 'robot-rb-series-v5.1.0.zip',
    type: 'robot',
    targetParts: [
      { part: 'motion-controller', version: 'v5.1.0' },
      { part: 'camera-driver', version: 'v2.4.6' },
      { part: 'arm-firmware', version: 'v5.1.0' },
    ],
    description: '机器人端升级包，提升视觉稳定性和运动控制精度',
    size: '86.2 MB',
    md5: '34ea1cb9f06d45b689d2a6c1ed5f3b21',
    uploader: 'ops',
    uploadedAt: '2026-03-04 10:12:08',
  },
];
