import { useMemo, useState } from 'react';
import { homingStrategyList } from '../../data/deployConfig/homingStrategyList';
import type { HomingStrategyRecord, HomingStrategyStatus } from '../../shared/types/deployConfig';

export interface HomingStrategyFormValues {
  code: string;
  name: string;
  status: HomingStrategyStatus;
  robotType: string[];
  robotGroup: string[];
  robot: string[];
  triggerRule: {
    idleWaitSeconds: number;
  };
}

export function useHomingStrategyManage() {
  const [records, setRecords] = useState<HomingStrategyRecord[]>(homingStrategyList);
  const [keyword, setKeyword] = useState('');

  const filteredList = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) {
      return records;
    }
    return records.filter((item) =>
      `${item.code} ${item.name} ${item.robotType.join(' ')} ${item.robotGroup.join(' ')} ${item.robot.join(' ')} ${item.triggerRule.idleWaitSeconds}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [keyword, records]);

  const createRecord = (payload: HomingStrategyFormValues) => {
    setRecords((prev) => [payload, ...prev]);
  };

  const updateRecord = (payload: HomingStrategyFormValues) => {
    setRecords((prev) => prev.map((item) => (item.code === payload.code ? payload : item)));
  };

  const removeRecord = (code: string) => {
    setRecords((prev) => prev.filter((item) => item.code !== code));
  };

  const toggleStatus = (code: string) => {
    setRecords((prev) =>
      prev.map((item) =>
        item.code === code
          ? {
              ...item,
              status: item.status === 'enabled' ? 'disabled' : 'enabled',
            }
          : item,
      ),
    );
  };

  return {
    records,
    filteredList,
    keyword,
    setKeyword,
    createRecord,
    updateRecord,
    removeRecord,
    toggleStatus,
  };
}

