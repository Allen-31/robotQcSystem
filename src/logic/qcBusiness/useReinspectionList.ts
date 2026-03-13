import { useCallback, useEffect, useState } from 'react';
import { getReinspectionListApi, type ReinspectionRecordVO } from '../../shared/api/qcBusinessApi';

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
  const [list, setList] = useState<ReinspectionRecordItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getReinspectionListApi({
        keyword: keyword.trim() || undefined,
        pageNum: page,
        pageSize,
      });
      const data = res.data;
      const items = (data?.list ?? []).map(mapVoToItem);
      setList(items);
      setTotal(data?.total ?? 0);
    } catch {
      setList([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [keyword, page, pageSize]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  return {
    list,
    total,
    loading,
    keyword,
    setKeyword,
    page,
    setPage,
    pageSize,
    setPageSize,
    fetchList,
  };
}
