import { useCallback, useMemo, useState } from 'react';
import type { SceneDeviceItem } from '../../shared/api/deploySceneDeviceApi';

const MOCK_DEVICES: SceneDeviceItem[] = [
  { code: 'DEV-A', name: '呼叫盒A', type: '呼叫盒', onlineStatus: 'online', isAbnormal: false, exceptionDetail: null, ip: '192.168.1.101' },
  { code: 'DEV-B', name: '呼叫盒B', type: '呼叫盒', onlineStatus: 'online', isAbnormal: true, exceptionDetail: '通信超时', ip: '192.168.1.102' },
  { code: 'DEV-C', name: '呼叫盒C', type: '呼叫盒', onlineStatus: 'offline', isAbnormal: false, exceptionDetail: null, ip: '192.168.1.103' },
  { code: 'DEV-D', name: '呼叫盒D', type: '呼叫盒', onlineStatus: 'online', isAbnormal: false, exceptionDetail: null, ip: '192.168.1.104' },
  { code: 'DEV-E', name: '呼叫盒E', type: '呼叫盒', onlineStatus: 'offline', isAbnormal: true, exceptionDetail: '电量低', ip: '192.168.1.105' },
];

export function useSceneDeviceManage() {
  const [list, setList] = useState<SceneDeviceItem[]>(() => [...MOCK_DEVICES]);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize] = useState(20);
  const [keyword, setKeyword] = useState('');

  const filteredList = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    if (!k) return list;
    return list.filter(
      (item) =>
        item.code.toLowerCase().includes(k) ||
        item.name.toLowerCase().includes(k) ||
        item.type.toLowerCase().includes(k) ||
        (item.ip && item.ip.toLowerCase().includes(k)),
    );
  }, [list, keyword]);

  const total = filteredList.length;
  const pagedList = useMemo(() => {
    const start = (pageNum - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, pageNum, pageSize]);

  const createRecord = useCallback(
    async (body: { code: string; name: string; type: string; ip?: string }) => {
      const newItem: SceneDeviceItem = {
        code: body.code,
        name: body.name,
        type: body.type,
        onlineStatus: 'offline',
        isAbnormal: false,
        exceptionDetail: null,
        ip: body.ip ?? null,
      };
      setList((prev) => [newItem, ...prev]);
    },
    [],
  );

  const updateRecord = useCallback(async (code: string, body: { name?: string; type?: string; ip?: string }) => {
    setList((prev) =>
      prev.map((item) =>
        item.code === code
          ? {
              ...item,
              ...(body.name !== undefined && { name: body.name }),
              ...(body.type !== undefined && { type: body.type }),
              ...(body.ip !== undefined && { ip: body.ip || null }),
            }
          : item,
      ),
    );
  }, []);

  const removeRecord = useCallback(async (code: string) => {
    setList((prev) => prev.filter((item) => item.code !== code));
  }, []);

  return {
    list: pagedList,
    total,
    pageNum,
    pageSize,
    setPageNum,
    keyword,
    setKeyword,
    loading: false,
    error: null,
    loadList: async () => {},
    createRecord,
    updateRecord,
    removeRecord,
  };
}
