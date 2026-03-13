/**
 * 部署配置 - 场景 - 设备管理
 * 接口 3.3.2：GET/POST/PUT/DELETE /api/deploy/devices
 * 更新/删除：路径 id 为主键（Snowflake Long），非 code；列表展示用 code 做「编码」。
 */
import { del, get, post, put } from './client';

export interface DeployDeviceVO {
  /** 主键（Snowflake Long），更新/删除时拼入 URL */
  id: number;
  /** 编码，用于列表/详情展示 */
  code: string;
  name: string;
  type: string;
  group?: string;
  mapCode: string;
  status: string;
  ip: string;
}

export interface DeployDeviceListData {
  list: DeployDeviceVO[];
  total: number;
}

/** 设备列表：GET /api/deploy/devices?mapCode=xxx */
export function getDeployDeviceListApi(params?: { mapCode?: string }) {
  return get<DeployDeviceListData>('deploy/devices', params as Record<string, string | number | undefined>);
}

/** 新增设备：POST /api/deploy/devices */
export function createDeployDeviceApi(body: { code: string; name: string; type: string; mapCode: string; ip: string }) {
  return post<DeployDeviceVO>('deploy/devices', body);
}

/** 更新设备：PUT /api/deploy/devices/{id}，id 为主键（number） */
export function updateDeployDeviceApi(id: number, body: Partial<Pick<DeployDeviceVO, 'name' | 'type' | 'mapCode' | 'ip'>>) {
  return put<null>(`deploy/devices/${id}`, body);
}

/** 删除设备：DELETE /api/deploy/devices/{id}，id 为主键（number） */
export function deleteDeployDeviceApi(id: number) {
  return del<null>(`deploy/devices/${id}`);
}
