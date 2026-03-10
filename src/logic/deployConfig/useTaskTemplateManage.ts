import { useCallback, useMemo, useState } from 'react';

export interface TaskTemplateRecord {
  code: string;
  name: string;
  enabled: boolean;
  priority: number;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

const MOCK_LIST: TaskTemplateRecord[] = [
  {
    code: 'TASK-T01',
    name: '巡检任务模板A',
    enabled: true,
    priority: 1,
    createdBy: 'admin',
    createdAt: '2025-01-10 09:00:00',
    updatedBy: 'admin',
    updatedAt: '2025-02-01 14:30:00',
  },
  {
    code: 'TASK-T02',
    name: '搬运任务模板B',
    enabled: false,
    priority: 2,
    createdBy: 'operator',
    createdAt: '2025-01-12 10:00:00',
    updatedBy: 'operator',
    updatedAt: '2025-01-20 11:00:00',
  },
  {
    code: 'TASK-T03',
    name: '充电任务模板',
    enabled: true,
    priority: 3,
    createdBy: 'admin',
    createdAt: '2025-01-15 08:00:00',
    updatedBy: 'admin',
    updatedAt: '2025-01-28 16:00:00',
  },
];

export type TaskTemplateFormValues = Pick<TaskTemplateRecord, 'code' | 'name' | 'priority'>;

export function useTaskTemplateManage() {
  const [list, setList] = useState<TaskTemplateRecord[]>(() => [...MOCK_LIST]);
  const [keyword, setKeyword] = useState('');

  const filteredList = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    if (!k) return list;
    return list.filter(
      (item) =>
        item.code.toLowerCase().includes(k) ||
        item.name.toLowerCase().includes(k) ||
        item.createdBy.toLowerCase().includes(k),
    );
  }, [list, keyword]);

  const createRecord = useCallback((values: TaskTemplateFormValues) => {
    const now = new Date().toLocaleString('sv-SE').replace('T', ' ').slice(0, 19);
    setList((prev) => [
      {
        code: values.code,
        name: values.name,
        enabled: true,
        priority: values.priority,
        createdBy: 'currentUser',
        createdAt: now,
        updatedBy: 'currentUser',
        updatedAt: now,
      },
      ...prev,
    ]);
  }, []);

  const updateRecord = useCallback((values: TaskTemplateFormValues) => {
    const now = new Date().toLocaleString('sv-SE').replace('T', ' ').slice(0, 19);
    setList((prev) =>
      prev.map((item) =>
        item.code === values.code
          ? { ...item, name: values.name, priority: values.priority, updatedBy: 'currentUser', updatedAt: now }
          : item,
      ),
    );
  }, []);

  const removeRecord = useCallback((code: string) => {
    setList((prev) => prev.filter((item) => item.code !== code));
  }, []);

  const toggleEnabled = useCallback((code: string) => {
    setList((prev) =>
      prev.map((item) => (item.code === code ? { ...item, enabled: !item.enabled } : item)),
    );
  }, []);

  return {
    records: list,
    filteredList,
    keyword,
    setKeyword,
    createRecord,
    updateRecord,
    removeRecord,
    toggleEnabled,
  };
}
