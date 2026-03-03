import { useMemo, useState } from 'react';
import { configTemplateList } from '../../data/deployConfig/configTemplateList';
import type { ConfigTemplateRecord } from '../../shared/types/deployConfig';

export interface ConfigTemplateFormValues {
  code: string;
  name: string;
}

function nowText() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

export function useConfigTemplateManage() {
  const [records, setRecords] = useState<ConfigTemplateRecord[]>(configTemplateList);
  const [keyword, setKeyword] = useState('');

  const filteredList = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) {
      return records;
    }
    return records.filter((item) => `${item.code} ${item.name} ${item.createdBy} ${item.updatedBy}`.toLowerCase().includes(normalized));
  }, [keyword, records]);

  const createRecord = (payload: ConfigTemplateFormValues) => {
    const now = nowText();
    const next: ConfigTemplateRecord = {
      ...payload,
      createdAt: now,
      createdBy: 'admin',
      updatedAt: now,
      updatedBy: 'admin',
    };
    setRecords((prev) => [next, ...prev]);
  };

  const updateRecord = (payload: ConfigTemplateFormValues) => {
    const now = nowText();
    setRecords((prev) =>
      prev.map((item) =>
        item.code === payload.code
          ? {
              ...item,
              name: payload.name,
              updatedAt: now,
              updatedBy: 'admin',
            }
          : item,
      ),
    );
  };

  const copyRecord = (code: string) => {
    const source = records.find((item) => item.code === code);
    if (!source) {
      return null;
    }
    const now = nowText();
    let seq = 1;
    let nextCode = `${source.code}-COPY${seq}`;
    while (records.some((item) => item.code === nextCode)) {
      seq += 1;
      nextCode = `${source.code}-COPY${seq}`;
    }
    const next: ConfigTemplateRecord = {
      ...source,
      code: nextCode,
      name: `${source.name}-副本`,
      createdAt: now,
      createdBy: 'admin',
      updatedAt: now,
      updatedBy: 'admin',
    };
    setRecords((prev) => [next, ...prev]);
    return next;
  };

  const removeRecord = (code: string) => {
    setRecords((prev) => prev.filter((item) => item.code !== code));
  };

  return {
    records,
    filteredList,
    keyword,
    setKeyword,
    createRecord,
    updateRecord,
    copyRecord,
    removeRecord,
  };
}

