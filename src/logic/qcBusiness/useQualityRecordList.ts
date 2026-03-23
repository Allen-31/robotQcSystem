import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQualityRecordListApi, mapWorkOrderVoToItem } from '../../shared/api/qcBusinessApi';
import { qcBusinessQueryKeys } from '../../shared/api/queryKeys';
import type { WorkOrderItem } from './useWorkOrderManage';

export function useQualityRecordList() {
  const [keyword, setKeyword] = useState('');
  const [onlyNg, setOnlyNg] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const listQuery = useQuery({
    queryKey: qcBusinessQueryKeys.qualityRecords({
      keyword: keyword.trim(),
      onlyNg,
      page,
      pageSize,
    }),
    queryFn: async () => {
      const res = await getQualityRecordListApi({
        keyword: keyword.trim() || undefined,
        onlyNg: onlyNg || undefined,
        pageNum: page,
        pageSize,
      });
      return res.data;
    },
  });

  const list = useMemo<WorkOrderItem[]>(() => {
    const rows = listQuery.data?.list ?? [];
    return rows.map((vo) => mapWorkOrderVoToItem(vo));
  }, [listQuery.data?.list]);

  const fetchList = useCallback(async () => {
    await listQuery.refetch();
  }, [listQuery]);

  return {
    list,
    total: listQuery.data?.total ?? 0,
    loading: listQuery.isLoading || listQuery.isFetching,
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
