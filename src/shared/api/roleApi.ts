import { del, get, post, put } from './client';

export interface RoleListItem {
  code: string;
  name: string;
  description: string;
  memberCount: number;
  updatedAt: string;
}

/** 角色列表（支持 keyword 查询） */
export function getRoleListApi(keyword?: string) {
  return get<RoleListItem[]>('deploy/roles', keyword ? { keyword } : undefined);
}

export interface RoleCreateBody {
  code: string;
  name: string;
  description?: string;
}

/** 新增角色 */
export function createRoleApi(body: RoleCreateBody) {
  return post<null>('deploy/roles', body);
}

export interface RoleUpdateBody {
  name: string;
  description?: string;
}

/** 更新角色 */
export function updateRoleApi(code: string, body: RoleUpdateBody) {
  return put<null>(`deploy/roles/${encodeURIComponent(code)}`, body);
}

/** 删除角色 */
export function deleteRoleApi(code: string) {
  return del<null>(`deploy/roles/${encodeURIComponent(code)}`);
}

export interface RolePermissionItem {
  menuKey: string;
  actions: string[];
}

/** 获取角色权限配置 */
export function getRolePermissionsApi(code: string) {
  return get<RolePermissionItem[]>(`deploy/roles/${encodeURIComponent(code)}/permissions`);
}

/** 保存角色权限配置 */
export function saveRolePermissionsApi(code: string, permissions: RolePermissionItem[]) {
  return put<null>(`deploy/roles/${encodeURIComponent(code)}/permissions`, { permissions });
}
