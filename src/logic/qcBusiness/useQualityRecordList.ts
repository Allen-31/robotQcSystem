import { useCallback, useEffect, useMemo, useState } from 'react';
import { getQualityRecordListApi, mapWorkOrderVoToItem } from '../../shared/api/qcBusinessApi';
import type { WorkOrderItem } from './useWorkOrderManage';

export function useQualityRecordList() {
  const [list, setList] = useState<WorkOrderItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [onlyNg, setOnlyNg] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getQualityRecordListApi({
        keyword: keyword.trim() || undefined,
        onlyNg: onlyNg || undefined,
        pageNum: page,
        pageSize,
      });
      const data = res.data;
      const items = (data?.list ?? []).map((vo) => mapWorkOrderVoToItem(vo));
      setList(items);
      setTotal(data?.total ?? 0);
    } catch {
      setList([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [keyword, onlyNg, page, pageSize]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  return {
    list,
    total,
    loading,
    keyword,
    setKeyword,
    onlyNg,
    setOnlyNg,
    page,
    setPage,
    pageSize,
    setPageSize,
    fetchList,
  };
}
