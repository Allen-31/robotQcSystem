import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  changePasswordApi,
  createUserApi,
  deleteUserApi,
  getUserListApi,
  updateUserApi,
  updateUserRolesApi,
} from '../../shared/api/userApi';
import { getRoleListApi } from '../../shared/api/roleApi';
import { roleQueryKeys, userQueryKeys } from '../../shared/api/queryKeys';
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
  const queryClient = useQueryClient();

  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const rolesQuery = useQuery({
    queryKey: roleQueryKeys.list(''),
    queryFn: async () => {
      const res = await getRoleListApi();
      const roles = res.data ?? [];
      return roles.map((r) => ({ label: r.name, value: r.code }));
    },
  });

  const usersQuery = useQuery({
    queryKey: userQueryKeys.list({
      page,
      pageSize,
      keyword: keyword.trim(),
      role: roleFilter,
      status: statusFilter,
    }),
    queryFn: async () => {
      const res = await getUserListApi({
        pageNum: page,
        pageSize,
        keyword: keyword.trim() || undefined,
        role: roleFilter,
        status: statusFilter,
      });
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: UserManageFormValues) => {
      if (!payload.password) {
        throw new Error('新建用户需填写密码');
      }
      return createUserApi({
        code: payload.code,
        name: payload.name,
        phone: payload.phone || undefined,
        email: payload.email || undefined,
        status: payload.status,
        roles: payload.roles,
        password: payload.password,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.all });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: UserManageFormValues) =>
      updateUserApi(payload.code, {
        name: payload.name,
        phone: payload.phone || undefined,
        email: payload.email || undefined,
        status: payload.status,
        roles: payload.roles,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userQueryKeys.all }),
  });

  const removeMutation = useMutation({
    mutationFn: (code: string) => deleteUserApi(code),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userQueryKeys.all }),
  });

  const updateRolesMutation = useMutation({
    mutationFn: ({ code, roles }: { code: string; roles: string[] }) => updateUserRolesApi(code, roles),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userQueryKeys.all }),
  });

  const createRecord = async (payload: UserManageFormValues) => {
    await createMutation.mutateAsync(payload);
  };

  const updateRecord = async (payload: UserManageFormValues) => {
    await updateMutation.mutateAsync(payload);
  };

  const removeRecord = async (code: string) => {
    await removeMutation.mutateAsync(code);
  };

  const updateRoles = async (code: string, roles: string[]) => {
    await updateRolesMutation.mutateAsync({ code, roles });
  };

  const changePassword = async (code: string, oldPassword: string, newPassword: string) => {
    const res = await changePasswordApi(code, oldPassword, newPassword);
    const data = res.data;
    if (data?.success === false) {
      return { success: false as const, error: (data?.error ?? 'unknown') as string };
    }
    return { success: true as const };
  };

  const records = (usersQuery.data?.list ?? []).map(mapListItemToRecord);
  const total = usersQuery.data?.total ?? 0;
  const roleOptions = useMemo(() => rolesQuery.data ?? [], [rolesQuery.data]);

  const roleCodeToName = useMemo(
    () => Object.fromEntries(roleOptions.map((o) => [o.value, o.label])),
    [roleOptions],
  );

  return {
    records,
    filteredList: records,
    total,
    loading: usersQuery.isLoading || usersQuery.isFetching,
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
    refreshList: usersQuery.refetch,
  };
}
