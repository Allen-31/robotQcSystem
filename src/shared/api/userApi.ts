import { del, get, post, put } from './client';
import type { PageData } from './client';

export interface UserListItem {
  code: string;
  name: string;
  phone: string | null;
  email: string | null;
  status: 'enabled' | 'disabled';
  lastLoginAt: string | null;
  roles: string[];
}

export interface UserListParams {
  pageNum?: number;
  pageSize?: number;
  keyword?: string;
  role?: string;
  status?: string;
}

/** 用户分页列表 */
export function getUserListApi(params?: UserListParams) {
  return get<PageData<UserListItem>>('deploy/users', params as Record<string, string | number | undefined>);
}

export interface UserCreateBody {
  code: string;
  name: string;
  phone?: string;
  email?: string;
  status?: string;
  roles?: string[];
  password: string;
}

/** 新增用户 */
export function createUserApi(body: UserCreateBody) {
  return post<null>('deploy/users', body);
}

export interface UserUpdateBody {
  name: string;
  phone?: string;
  email?: string;
  status?: string;
  roles?: string[];
}

/** 更新用户 */
export function updateUserApi(code: string, body: UserUpdateBody) {
  return put<null>(`deploy/users/${encodeURIComponent(code)}`, body);
}

/** 删除用户 */
export function deleteUserApi(code: string) {
  return del<null>(`deploy/users/${encodeURIComponent(code)}`);
}

/** 更新用户角色 */
export function updateUserRolesApi(code: string, roles: string[]) {
  return put<null>(`deploy/users/${encodeURIComponent(code)}/roles`, { roles });
}

/** 修改密码 */
export function changePasswordApi(code: string, oldPassword: string, newPassword: string) {
  return put<{ success: boolean; error?: string }>(`deploy/users/${encodeURIComponent(code)}/password`, {
    oldPassword,
    newPassword,
  });
}
