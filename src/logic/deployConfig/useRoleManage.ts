import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createRoleApi,
  deleteRoleApi,
  getRoleListApi,
  updateRoleApi,
} from '../../shared/api/roleApi';
import { roleQueryKeys } from '../../shared/api/queryKeys';
import type { RoleManageRecord } from '../../shared/types/deployConfig';

export interface RoleManageFormValues {
  code: string;
  name: string;
  description: string;
  memberCount?: number;
}

function mapToRecord(item: {
  code: string;
  name: string;
  description: string;
  memberCount: number;
  updatedAt: string;
}): RoleManageRecord {
  return {
    code: item.code,
    name: item.name,
    description: item.description ?? '',
    memberCount: item.memberCount ?? 0,
    updatedAt: item.updatedAt ?? '',
  };
}

export function useRoleManage() {
  const [keyword, setKeyword] = useState('');
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: roleQueryKeys.list(keyword.trim()),
    queryFn: async () => {
      const res = await getRoleListApi(keyword.trim() || undefined);
      const data = res.data;
      return Array.isArray(data) ? data.map(mapToRecord) : [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: RoleManageFormValues) =>
      createRoleApi({
        code: payload.code,
        name: payload.name,
        description: payload.description,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: roleQueryKeys.all }),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: RoleManageFormValues) =>
      updateRoleApi(payload.code, {
        name: payload.name,
        description: payload.description,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: roleQueryKeys.all }),
  });

  const removeMutation = useMutation({
    mutationFn: (code: string) => deleteRoleApi(code),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: roleQueryKeys.all }),
  });

  const createRole = async (payload: RoleManageFormValues) => {
    try {
      await createMutation.mutateAsync(payload);
      return { success: true as const };
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      return { success: false as const, error: 'duplicate' as const, message: msg };
    }
  };

  const updateRole = async (payload: RoleManageFormValues) => {
    try {
      await updateMutation.mutateAsync(payload);
      return { success: true as const };
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      return { success: false as const, error: 'duplicate' as const, message: msg };
    }
  };

  const removeRole = async (code: string) => {
    try {
      await removeMutation.mutateAsync(code);
      return { success: true as const };
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('至少') || msg.includes('last') || msg.includes('保留')) {
        return { success: false as const, error: 'last_role' as const, message: msg };
      }
      return { success: false as const, error: 'not_found' as const, message: msg };
    }
  };

  const records = listQuery.data ?? [];

  return {
    records,
    filteredList: records,
    loading: listQuery.isLoading || listQuery.isFetching,
    keyword,
    setKeyword,
    createRole,
    updateRole,
    removeRole,
    refreshList: listQuery.refetch,
  };
}
