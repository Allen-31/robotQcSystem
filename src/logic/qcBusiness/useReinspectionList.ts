import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getReinspectionListApi, type ReinspectionRecordVO } from '../../shared/api/qcBusinessApi';
import { qcBusinessQueryKeys } from '../../shared/api/queryKeys';

export type ReinspectionResult = 'ok' | 'ng' | 'pending';

export interface ReinspectionRecordItem {
  id: number;
  reinspectionNo: string;
  workOrderNo: string;
  harnessCode: string;
  harnessType: string;
  stationCode: string;
  qualityResult: ReinspectionResult;
  reinspectionResult: ReinspectionResult;
  defectType: string;
  reinspectionTime: string;
  reviewer: string;
  videoUrl: string;
  imageUrl: string;
}

function mapVoToItem(vo: ReinspectionRecordVO): ReinspectionRecordItem {
  return {
    id: vo.id,
    reinspectionNo: vo.reinspectionNo ?? '-',
    workOrderNo: vo.workOrderNo ?? '-',
    harnessCode: vo.harnessCode ?? '-',
    harnessType: vo.harnessType ?? '-',
    stationCode: vo.stationCode ?? '-',
    qualityResult: vo.qualityResult,
    reinspectionResult: vo.reinspectionResult,
    defectType: vo.defectType ?? '-',
    reinspectionTime: vo.reinspectionTime ?? '-',
    reviewer: vo.reviewer ?? '-',
    videoUrl: vo.videoUrl ?? '',
    imageUrl: vo.imageUrl ?? '',
  };
}

export function useReinspectionList() {
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const listQuery = useQuery({
    queryKey: qcBusinessQueryKeys.reinspections({
      keyword: keyword.trim(),
      page,
      pageSize,
    }),
    queryFn: async () => {
      const res = await getReinspectionListApi({
        keyword: keyword.trim() || undefined,
        pageNum: page,
        pageSize,
      });
      return res.data;
    },
  });

  const list = useMemo(() => {
    const rows = listQuery.data?.list ?? [];
    return rows.map(mapVoToItem);
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
    page,
    setPage,
    pageSize,
    setPageSize,
    fetchList,
  };
}
