import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createRoleApi,
  deleteRoleApi,
  getRoleListApi,
  updateRoleApi,
} from '../../shared/api/roleApi';
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
  const [list, setList] = useState<RoleManageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getRoleListApi(keyword.trim() || undefined);
      const data = res.data;
      setList(Array.isArray(data) ? data.map(mapToRecord) : []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const filteredList = useMemo(() => list, [list]);

  const createRole = useCallback(
    async (payload: RoleManageFormValues) => {
      try {
        await createRoleApi({
          code: payload.code,
          name: payload.name,
          description: payload.description,
        });
        await fetchList();
        return { success: true as const };
      } catch (e) {
        const msg = e instanceof Error ? e.message : '';
        return { success: false as const, error: 'duplicate' as const, message: msg };
      }
    },
    [fetchList],
  );

  const updateRole = useCallback(
    async (payload: RoleManageFormValues) => {
      try {
        await updateRoleApi(payload.code, {
          name: payload.name,
          description: payload.description,
        });
        await fetchList();
        return { success: true as const };
      } catch (e) {
        const msg = e instanceof Error ? e.message : '';
        return { success: false as const, error: 'duplicate' as const, message: msg };
      }
    },
    [fetchList],
  );

  const removeRole = useCallback(
    async (code: string) => {
      try {
        await deleteRoleApi(code);
        await fetchList();
        return { success: true as const };
      } catch (e) {
        const msg = e instanceof Error ? e.message : '';
        if (msg.includes('至少') || msg.includes('last') || msg.includes('保留')) {
          return { success: false as const, error: 'last_role' as const, message: msg };
        }
        return { success: false as const, error: 'not_found' as const, message: msg };
      }
    },
    [fetchList],
  );

  return {
    records: list,
    filteredList,
    loading,
    keyword,
    setKeyword,
    createRole,
    updateRole,
    removeRole,
    refreshList: fetchList,
  };
}
