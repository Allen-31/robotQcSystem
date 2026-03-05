import { useEffect, useMemo, useState } from 'react';
import { getMapList } from '../../data/deployConfig/mapList';
import type { DataLocale } from '../../data/localized';
import type { MapEditStatus, MapManageRecord, MapPublishStatus } from '../../shared/types/deployConfig';

export interface MapManageFormValues {
  code: string;
  name: string;
  type: string;
  editStatus: MapEditStatus;
  publishStatus: MapPublishStatus;
}

function getNowString() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

export function useMapManage(locale: DataLocale) {
  const [records, setRecords] = useState<MapManageRecord[]>(() => getMapList(locale));
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    setRecords(getMapList(locale));
  }, [locale]);

  const filteredList = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) {
      return records;
    }
    return records.filter((item) =>
      `${item.code} ${item.name} ${item.type} ${item.editedBy} ${item.publishedBy}`.toLowerCase().includes(normalized),
    );
  }, [keyword, records]);

  const createRecord = (payload: MapManageFormValues) => {
    const now = getNowString();
    const next: MapManageRecord = {
      ...payload,
      editedAt: now,
      editedBy: 'admin',
      publishedAt: payload.publishStatus === 'published' ? now : '-',
      publishedBy: payload.publishStatus === 'published' ? 'admin' : '-',
    };
    setRecords((prev) => [next, ...prev]);
  };

  const updateRecord = (payload: MapManageFormValues) => {
    const now = getNowString();
    setRecords((prev) =>
      prev.map((item) => {
        if (item.code !== payload.code) {
          return item;
        }
        return {
          ...item,
          ...payload,
          editedAt: now,
          editedBy: 'admin',
          publishedAt: payload.publishStatus === 'published' ? now : '-',
          publishedBy: payload.publishStatus === 'published' ? 'admin' : '-',
        };
      }),
    );
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
    removeRecord,
  };
}
