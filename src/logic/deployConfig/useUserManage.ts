import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  changePasswordApi,
  createUserApi,
  deleteUserApi,
  getUserListApi,
  updateUserApi,
  updateUserRolesApi,
} from '../../shared/api/userApi';
import { getRoleListApi } from '../../shared/api/roleApi';
import type { UserManageRecord, UserStatus } from '../../shared/types/deployConfig';

export interface UserManageFormValues {
  code: string;
  name: string;
  phone: string;
  email: string;
  status: UserStatus;
  roles: string[];
  password?: string;
}

function mapListItemToRecord(item: {
  code: string;
  name: string;
  phone: string | null;
  email: string | null;
  status: string;
  lastLoginAt: string | null;
  roles: string[];
}): UserManageRecord {
  return {
    code: item.code,
    name: item.name,
    phone: item.phone ?? '',
    email: item.email ?? '',
    status: item.status as UserStatus,
    lastLoginAt: item.lastLoginAt ?? '-',
    roles: item.roles ?? [],
    password: '',
  };
}

export function useUserManage() {
  const [list, setList] = useState<UserManageRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const [roleOptions, setRoleOptions] = useState<{ label: string; value: string }[]>([]);

  /** 角色 code -> 角色名称（用于用户列表「所属角色」列显示角色管理里的名称，并过滤 Keycloak 默认 realm 角色） */
  const roleCodeToName = useMemo(
    () => Object.fromEntries(roleOptions.map((o) => [o.value, o.label])),
    [roleOptions],
  );

  const fetchRoles = useCallback(async () => {
    try {
      const res = await getRoleListApi();
      const roles = res.data ?? [];
      setRoleOptions(roles.map((r) => ({ label: r.name, value: r.code })));
    } catch {
      setRoleOptions([]);
    }
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUserListApi({
        pageNum: page,
        pageSize,
        keyword: keyword.trim() || undefined,
        role: roleFilter,
        status: statusFilter,
      });
      const data = res.data;
      if (data) {
        setList((data.list ?? []).map(mapListItemToRecord));
        setTotal(data.total ?? 0);
      } else {
        setList([]);
        setTotal(0);
      }
    } catch {
      setList([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword, roleFilter, statusFilter]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const createRecord = useCallback(
    async (payload: UserManageFormValues) => {
      if (!payload.password) {
        throw new Error('新建用户需填写密码');
      }
      await createUserApi({
        code: payload.code,
        name: payload.name,
        phone: payload.phone || undefined,
        email: payload.email || undefined,
        status: payload.status,
        roles: payload.roles,
        password: payload.password,
      });
      await fetchList();
      await fetchRoles();
    },
    [fetchList, fetchRoles],
  );

  const updateRecord = useCallback(
    async (payload: UserManageFormValues) => {
      await updateUserApi(payload.code, {
        name: payload.name,
        phone: payload.phone || undefined,
        email: payload.email || undefined,
        status: payload.status,
        roles: payload.roles,
      });
      await fetchList();
    },
    [fetchList],
  );

  const removeRecord = useCallback(
    async (code: string) => {
      await deleteUserApi(code);
      await fetchList();
    },
    [fetchList],
  );

  const updateRoles = useCallback(
    async (code: string, roles: string[]) => {
      await updateUserRolesApi(code, roles);
      await fetchList();
    },
    [fetchList],
  );

  const changePassword = useCallback(async (code: string, oldPassword: string, newPassword: string) => {
    const res = await changePasswordApi(code, oldPassword, newPassword);
    const data = res.data;
    if (data?.success === false) {
      return { success: false as const, error: (data?.error ?? 'unknown') as string };
    }
    return { success: true as const };
  }, []);

  const filteredList = list;
  const records = list;

  return {
    records,
    filteredList,
    total,
    loading,
    keyword,
    setKeyword,
    page,
    setPage,
    pageSize,
    setPageSize,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    roleOptions,
    roleCodeToName,
    createRecord,
    updateRecord,
    removeRecord,
    updateRoles,
    changePassword,
    refreshList: fetchList,
  };
}
