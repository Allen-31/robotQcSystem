import { useMemo, useState } from 'react';
import { userList } from '../../data/deployConfig/userList';
import type { UserManageRecord, UserStatus } from '../../shared/types/deployConfig';

export interface UserManageFormValues {
  code: string;
  name: string;
  phone: string;
  email: string;
  status: UserStatus;
  roles: string[];
}

export function useUserManage() {
  const [records, setRecords] = useState<UserManageRecord[]>(userList);
  const [keyword, setKeyword] = useState('');

  const filteredList = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) {
      return records;
    }
    return records.filter((item) =>
      `${item.code} ${item.name} ${item.phone} ${item.email} ${item.roles.join(' ')}`.toLowerCase().includes(normalized),
    );
  }, [keyword, records]);

  const roleOptions = useMemo(() => {
    const roleSet = new Set<string>();
    records.forEach((item) => item.roles.forEach((role) => roleSet.add(role)));
    ['管理员', '质检主管', '质检员', '维护人员', '产品经理'].forEach((item) => roleSet.add(item));
    return Array.from(roleSet).map((role) => ({ label: role, value: role }));
  }, [records]);

  const createRecord = (payload: UserManageFormValues) => {
    const next: UserManageRecord = {
      ...payload,
      lastLoginAt: '-',
      password: '123456',
    };
    setRecords((prev) => [next, ...prev]);
  };

  const updateRecord = (payload: UserManageFormValues) => {
    setRecords((prev) => prev.map((item) => (item.code === payload.code ? { ...item, ...payload } : item)));
  };

  const removeRecord = (code: string) => {
    setRecords((prev) => prev.filter((item) => item.code !== code));
  };

  const updateRoles = (code: string, roles: string[]) => {
    setRecords((prev) => prev.map((item) => (item.code === code ? { ...item, roles } : item)));
  };

  const changePassword = (code: string, oldPassword: string, newPassword: string) => {
    let oldPasswordValid = false;

    setRecords((prev) =>
      prev.map((item) => {
        if (item.code !== code) {
          return item;
        }
        oldPasswordValid = item.password === oldPassword;
        if (!oldPasswordValid) {
          return item;
        }
        return { ...item, password: newPassword };
      }),
    );

    if (!oldPasswordValid) {
      return { success: false as const, error: 'old_password_invalid' as const };
    }
    return { success: true as const };
  };

  return {
    records,
    filteredList,
    keyword,
    setKeyword,
    roleOptions,
    createRecord,
    updateRecord,
    removeRecord,
    updateRoles,
    changePassword,
  };
}
