import { useMemo, useState } from 'react';
import type { RoleManageRecord } from '../../shared/types/deployConfig';
import { getStoredRoles, setStoredRoles } from './roleStore';

export interface RoleManageFormValues {
  code: string;
  name: string;
  description: string;
  memberCount: number;
}

function nowString() {
  const date = new Date();
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function useRoleManage() {
  const [records, setRecords] = useState<RoleManageRecord[]>(getStoredRoles);
  const [keyword, setKeyword] = useState('');

  const persist = (next: RoleManageRecord[]) => {
    setRecords(next);
    setStoredRoles(next);
  };

  const filteredList = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) {
      return records;
    }
    return records.filter((item) => `${item.code} ${item.name} ${item.description}`.toLowerCase().includes(normalized));
  }, [keyword, records]);

  const createRole = (payload: RoleManageFormValues) => {
    const exists = records.some((item) => item.code === payload.code || item.name === payload.name);
    if (exists) {
      return { success: false as const, error: 'duplicate' as const };
    }
    const next: RoleManageRecord = {
      ...payload,
      updatedAt: nowString(),
    };
    persist([next, ...records]);
    return { success: true as const };
  };

  const updateRole = (payload: RoleManageFormValues) => {
    const duplicate = records.some((item) => item.code !== payload.code && item.name === payload.name);
    if (duplicate) {
      return { success: false as const, error: 'duplicate' as const };
    }
    const next = records.map((item) =>
      item.code === payload.code
        ? {
            ...item,
            ...payload,
            updatedAt: nowString(),
          }
        : item,
    );
    persist(next);
    return { success: true as const };
  };

  const removeRole = (code: string) => {
    const next = records.filter((item) => item.code !== code);
    if (next.length === records.length) {
      return { success: false as const, error: 'not_found' as const };
    }
    if (next.length === 0) {
      return { success: false as const, error: 'last_role' as const };
    }
    persist(next);
    return { success: true as const };
  };

  return {
    records,
    filteredList,
    keyword,
    setKeyword,
    createRole,
    updateRole,
    removeRole,
  };
}

