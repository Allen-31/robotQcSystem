import { useEffect, useMemo, useState } from 'react';
import { getChargeStrategyList } from '../../data/deployConfig/chargeStrategyList';
import type { ChargeMethod, ChargeStrategyRecord, ChargeStrategyStatus } from '../../shared/types/deployConfig';
import type { DataLocale } from '../../data/localized';

export interface ChargeStrategyFormValues {
  code: string;
  name: string;
  status: ChargeStrategyStatus;
  robotType: string[];
  robotGroup: string[];
  robot: string[];
  triggerRule: {
    lowBatteryThreshold: number;
    minChargeMinutes: number;
    chargeMethod: ChargeMethod;
  };
}

export function useChargeStrategyManage(locale: DataLocale) {
  const [records, setRecords] = useState<ChargeStrategyRecord[]>(() => getChargeStrategyList(locale));
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    setRecords(getChargeStrategyList(locale));
  }, [locale]);

  const filteredList = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) {
      return records;
    }
    return records.filter((item) =>
      `${item.code} ${item.name} ${item.robotType.join(' ')} ${item.robotGroup.join(' ')} ${item.robot.join(' ')} ${item.triggerRule.lowBatteryThreshold} ${item.triggerRule.minChargeMinutes} ${item.triggerRule.chargeMethod}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [keyword, records]);

  const createRecord = (payload: ChargeStrategyFormValues) => {
    setRecords((prev) => [payload, ...prev]);
  };

  const updateRecord = (payload: ChargeStrategyFormValues) => {
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
