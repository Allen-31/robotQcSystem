import { useCallback, useMemo, useState } from 'react';

export interface ActionTemplateRecord {
  code: string;
  name: string;
  enabled: boolean;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

const MOCK_LIST: ActionTemplateRecord[] = [
  {
    code: 'ACT-A01',
    name: '移动动作模板',
    enabled: true,
    createdBy: 'admin',
    createdAt: '2025-01-10 09:00:00',
    updatedBy: 'admin',
    updatedAt: '2025-02-01 14:30:00',
  },
  {
    code: 'ACT-A02',
    name: '抓取动作模板',
    enabled: false,
    createdBy: 'operator',
    createdAt: '2025-01-12 10:00:00',
    updatedBy: 'operator',
    updatedAt: '2025-01-20 11:00:00',
  },
  {
    code: 'ACT-A03',
    name: '等待动作模板',
    enabled: true,
    createdBy: 'admin',
    createdAt: '2025-01-15 08:00:00',
    updatedBy: 'admin',
    updatedAt: '2025-01-28 16:00:00',
  },
];

export type ActionTemplateFormValues = Pick<ActionTemplateRecord, 'code' | 'name'>;

export function useActionTemplateManage() {
  const [list, setList] = useState<ActionTemplateRecord[]>(() => [...MOCK_LIST]);
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

  const createRecord = useCallback((values: ActionTemplateFormValues) => {
    const now = new Date().toLocaleString('sv-SE').replace('T', ' ').slice(0, 19);
    setList((prev) => [
      {
        code: values.code,
        name: values.name,
        enabled: true,
        createdBy: 'currentUser',
        createdAt: now,
        updatedBy: 'currentUser',
        updatedAt: now,
      },
      ...prev,
    ]);
  }, []);

  const updateRecord = useCallback((values: ActionTemplateFormValues) => {
    const now = new Date().toLocaleString('sv-SE').replace('T', ' ').slice(0, 19);
    setList((prev) =>
      prev.map((item) =>
        item.code === values.code
          ? { ...item, name: values.name, updatedBy: 'currentUser', updatedAt: now }
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
