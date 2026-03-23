import { DeleteOutlined, ExclamationCircleFilled, EyeOutlined, PauseCircleOutlined, PlayCircleOutlined, PlusOutlined, SearchOutlined, StopOutlined, UploadOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Grid,
  Image,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { wireHarnessTypeList } from '../../../data/qcConfig/wireHarnessTypeList';
import type { QualityResult, WorkOrderStatus } from '../../../data/qcBusiness/workOrderList';
import { useI18n } from '../../../i18n/I18nProvider';
import { Permission } from '../../../components/auth/Permission';
import { useWorkOrderManage, type WorkOrderItem } from '../../../logic/qcBusiness/useWorkOrderManage';
import { loadQcWireHarnessAnnotations, type QcPoint } from '../../../shared/qcWireHarnessAnnotation';

const statusColorMap: Record<WorkOrderStatus, string> = {
  pending: 'default',
  running: 'processing',
  paused: 'warning',
  finished: 'success',
  ng: 'error',
  cancelled: 'warning',
};

const qualityColorMap: Record<QualityResult, string> = {
  ok: 'success',
  ng: 'error',
  pending: 'default',
};

const statusOptions: WorkOrderStatus[] = ['pending', 'running', 'paused', 'finished', 'ng', 'cancelled'];
const qualityOptions: QualityResult[] = ['ok', 'ng', 'pending'];
const WORK_ORDER_MENU_KEY = '/qualityInspection/workOrderManage';

const normalizeStatus = (value?: string): WorkOrderStatus =>
  value && statusOptions.includes(value as WorkOrderStatus) ? (value as WorkOrderStatus) : 'pending';

const normalizeQualityResult = (value?: string): QualityResult =>
  value && qualityOptions.includes(value as QualityResult) ? (value as QualityResult) : 'pending';

function escapeCsv(value: string | number): string {
  const text = String(value ?? '');
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  result.push(current);
  return result.map((item) => item.trim());
}

function buildCsv(rows: WorkOrderItem[]): string {
  const headers = [
    'workOrderNo',
    'harnessCode',
    'harnessType',
    'stationCode',
    'status',
    'qualityResult',
    'taskIds',
    'detectionDuration',
    'movingDuration',
    'createdAt',
    'startedAt',
    'endedAt',
    'defectType',
    'defectDescription',
  ];

  const lines = rows.map((row) =>
    [
      row.workOrderNo,
      row.harnessCode,
      row.harnessType,
      row.stationCode,
      row.status,
      row.qualityResult,
      row.taskIds.join(' / '),
      row.detectionDuration,
      row.movingDuration,
      row.createdAt,
      row.startedAt,
      row.endedAt,
      row.defectType,
      row.defectDescription,
    ]
      .map((item) => escapeCsv(item))
      .join(','),
  );

  return `${headers.join(',')}\n${lines.join('\n')}`;
}

function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function parseImportedCsv(content: string): Omit<WorkOrderItem, 'id'>[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) {
    return [];
  }

  const records = lines.slice(1).map((line) => parseCsvLine(line));
  return records
    .filter((cols) => cols.length >= 12)
    .map((cols) => ({
      workOrderNo: cols[0],
      harnessCode: cols[1],
      harnessType: cols[2],
      stationCode: cols[3],
      status: normalizeStatus(cols[4]),
      qualityResult: normalizeQualityResult(cols[5]),
      taskIds: cols[6]
        .split('/')
        .map((item) => item.trim())
        .filter(Boolean),
      detectionDuration: Number(cols[7]) || 0,
      movingDuration: Number(cols[8]) || 0,
      createdAt: cols[9] || '-',
      startedAt: cols[10] || '-',
      endedAt: cols[11] || '-',
      defectType: cols[12] || '-',
      defectDescription: cols[13] || '-',
    }))
    .filter((item) => item.workOrderNo && item.harnessCode && item.harnessType && item.stationCode);
}

type InspectionPointStatus = 'ok' | 'ng';
type InspectionPointMediaType = 'image' | 'video';

interface InspectionPointItem {
  id: string;
  pointCode: string;
  status: InspectionPointStatus;
  robot: string;
  result: string;
  mediaType: InspectionPointMediaType;
  mediaUrl: string;
  duration: number;
  startedAt: string;
  endedAt: string;
  x: number;
  y: number;
  labelX: number;
  labelY: number;
}

function buildMockPointImage(pointCode: string, status: InspectionPointStatus): string {
  const color = status === 'ok' ? '#16a34a' : '#dc2626';
  const resultText = status === 'ok' ? 'OK' : 'NG';
  const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' width='960' height='540'>
      <defs>
        <linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stop-color='#f8fafc'/>
          <stop offset='100%' stop-color='#e2e8f0'/>
        </linearGradient>
      </defs>
      <rect width='100%' height='100%' fill='url(#bg)'/>
      <rect x='32' y='32' width='896' height='476' rx='12' fill='none' stroke='#94a3b8' stroke-width='2'/>
      <text x='56' y='86' font-size='30' fill='#0f172a' font-family='Arial'>Inspection Sample</text>
      <text x='56' y='132' font-size='24' fill='#334155' font-family='Arial'>Point: ${pointCode}</text>
      <circle cx='480' cy='290' r='58' fill='white' stroke='${color}' stroke-width='8'/>
      <text x='480' y='303' font-size='36' text-anchor='middle' fill='${color}' font-family='Arial' font-weight='700'>${resultText}</text>
    </svg>
  `.trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function buildInspectionPoints(workOrder: WorkOrderItem): InspectionPointItem[] {
  const layout = [
    // Points are pinned to harness endpoints or polyline bends in the 2D drawing.
    { code: 'BD01', x: 3, y: 50.6, labelX: 7, labelY: 60 },    // left endpoint
    { code: 'BD10', x: 32, y: 50.6, labelX: 35, labelY: 60 },  // center branch bend
    { code: 'BD90', x: 56, y: 16.7, labelX: 53, labelY: 11 },  // upper branch endpoint
    { code: 'BD24A', x: 59, y: 50.6, labelX: 61, labelY: 60 }, // vertical branch bend on main trunk
    { code: 'BD24', x: 59, y: 21.7, labelX: 61, labelY: 17 },  // vertical branch endpoint
    { code: 'BD12', x: 76, y: 50.6, labelX: 78, labelY: 60 },  // right trunk endpoint
    { code: 'BD78', x: 82, y: 86.7, labelX: 85, labelY: 92 },  // lower branch endpoint
  ];

  return layout.map((item, index) => {
    const status: InspectionPointStatus = (workOrder.qualityResult === 'ng' && index >= 4) || index === 1 ? 'ng' : 'ok';
    const mediaType: InspectionPointMediaType = index % 2 === 0 ? 'image' : 'video';
    const duration = Number((workOrder.detectionDuration / layout.length + index * 0.3).toFixed(1));
    return {
      id: `${workOrder.id}-${item.code}`,
      pointCode: item.code,
      status,
      robot: `RB-${workOrder.stationCode}-${(index % 2) + 1}`,
      result: status === 'ok' ? 'OK' : 'NG',
      mediaType,
      mediaUrl:
        mediaType === 'image'
          ? buildMockPointImage(item.code, status)
          : `https://example.com/workorder/${workOrder.workOrderNo}/${item.code}.mp4`,
      duration,
      startedAt: workOrder.startedAt === '-' ? '-' : workOrder.startedAt,
      endedAt: workOrder.endedAt === '-' ? '-' : workOrder.endedAt,
      x: item.x,
      y: item.y,
      labelX: item.labelX,
      labelY: item.labelY,
    };
  });
}

function resolveWireHarnessId(harnessType: string): string | null {
  const normalized = harnessType.trim();
  const explicitId = normalized.match(/WH-\d{3}/i)?.[0]?.toUpperCase();
  if (explicitId && wireHarnessTypeList.some((item) => String(item.id).toUpperCase() === explicitId)) {
    return explicitId;
  }
  const suffix = normalized.match(/[-\uFF0D]([ABC])$/i)?.[1]?.toUpperCase();
  if (suffix === 'A') {
    const found = wireHarnessTypeList.find((item) => String(item.id) === 'WH-001');
    return found != null ? String(found.id) : null;
  }
  if (suffix === 'B') {
    const found = wireHarnessTypeList.find((item) => String(item.id) === 'WH-002');
    return found != null ? String(found.id) : null;
  }
  if (suffix === 'C') {
    const found = wireHarnessTypeList.find((item) => String(item.id) === 'WH-003');
    return found != null ? String(found.id) : null;
  }
  const exact = wireHarnessTypeList.find((item) => String(item.id) === harnessType || item.name === harnessType);
  if (exact) {
    return String(exact.id);
  }
  if (harnessType.includes('\u4E3B\u9A71') || harnessType.includes('-A')) {
    const found = wireHarnessTypeList.find((item) => String(item.id) === 'WH-001');
    return found != null ? String(found.id) : null;
  }
  if (harnessType.includes('\u63A7\u5236') || harnessType.includes('-B')) {
    const found = wireHarnessTypeList.find((item) => String(item.id) === 'WH-002');
    return found != null ? String(found.id) : null;
  }
  if (harnessType.includes('\u9AD8\u538B') || harnessType.includes('-C')) {
    const found = wireHarnessTypeList.find((item) => String(item.id) === 'WH-003');
    return found != null ? String(found.id) : null;
  }
  const levelMatch = /L(\d+)/i.exec(harnessType);
  if (levelMatch) {
    const level = Number(levelMatch[1]);
    if (level > 0 && level <= wireHarnessTypeList.length) {
      const found = wireHarnessTypeList[level - 1];
      return found != null ? String(found.id) : null;
    }
  }
  return null;
}

function buildInspectionPointsFromAnnotation(workOrder: WorkOrderItem, points: QcPoint[]): InspectionPointItem[] {
  return points.map((point, index) => {
    const status: InspectionPointStatus = (workOrder.qualityResult === 'ng' && index % 3 === 1) || index === 1 ? 'ng' : 'ok';
    const mediaType: InspectionPointMediaType = index % 2 === 0 ? 'image' : 'video';
    const duration = Number((Math.max(workOrder.detectionDuration, 1) / Math.max(points.length, 1) + index * 0.2).toFixed(1));
    return {
      id: `${workOrder.id}-ANNO-${index + 1}`,
      pointCode: point.description?.trim() || `P${index + 1}`,
      status,
      robot: `RB-${workOrder.stationCode}-${(index % 2) + 1}`,
      result: status === 'ok' ? 'OK' : 'NG',
      mediaType,
      mediaUrl:
        mediaType === 'image'
          ? buildMockPointImage(point.description?.trim() || `P${index + 1}`, status)
          : `https://example.com/workorder/${workOrder.workOrderNo}/P${index + 1}.mp4`,
      duration,
      startedAt: workOrder.startedAt === '-' ? '-' : workOrder.startedAt,
      endedAt: workOrder.endedAt === '-' ? '-' : workOrder.endedAt,
      x: point.x,
      y: point.y,
      labelX: Math.min(95, point.x + 2.2),
      labelY: Math.min(95, point.y + 3.2),
    };
  });
}

export function WorkOrderManagePage() {
  const { t } = useI18n();
  const screens = Grid.useBreakpoint();
  const isLaptop = !screens.xxl;
  const [form] = Form.useForm();
  const [createForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [previewPoint, setPreviewPoint] = useState<InspectionPointItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const {
    operationWorkOrders,
    rawWorkOrders,
    total,
    loading,
    page,
    setPage,
    pageSize,
    setPageSize,
    harnessTypeOptions,
    stationCodeOptions,
    defectTypeOptions,
    keyword,
    setKeyword,
    viewingWorkOrder,
    editingWorkOrder,
    openDetail,
    closeDetail,
    closeEdit,
    pauseWorkOrder,
    resumeWorkOrder,
    cancelWorkOrder,
    removeWorkOrder,
    saveEdit,
    createWorkOrder,
    importWorkOrders,
  } = useWorkOrderManage();

  useEffect(() => {
    if (!editingWorkOrder) {
      form.resetFields();
      return;
    }
    form.setFieldsValue({
      id: editingWorkOrder.id,
      harnessCode: editingWorkOrder.harnessCode,
      harnessType: editingWorkOrder.harnessType,
      stationCode: editingWorkOrder.stationCode,
      status: editingWorkOrder.status,
      qualityResult: editingWorkOrder.qualityResult,
      taskIdsRaw: editingWorkOrder.taskIds.join(', '),
      movingDuration: editingWorkOrder.movingDuration,
      detectionDuration: editingWorkOrder.detectionDuration,
      startedAt: editingWorkOrder.startedAt,
      endedAt: editingWorkOrder.endedAt,
      defectType: editingWorkOrder.defectType,
      defectDescription: editingWorkOrder.defectDescription,
    });
  }, [editingWorkOrder, form]);

  const selectedWorkOrders = useMemo(() => {
    const keySet = new Set(selectedRowKeys.map(String));
    return rawWorkOrders.filter((item) => keySet.has(String(item.id)));
  }, [rawWorkOrders, selectedRowKeys]);

  const harnessCodeOptionsByType = useMemo(() => {
    const grouped = new Map<string, string[]>();
    rawWorkOrders.forEach((item) => {
      const type = item.harnessType?.trim();
      const code = item.harnessCode?.trim();
      if (!type || !code) return;
      const list = grouped.get(type) ?? [];
      if (!list.includes(code)) list.push(code);
      grouped.set(type, list);
    });
    return grouped;
  }, [rawWorkOrders]);

  const createHarnessType = Form.useWatch('harnessType', createForm) as string | undefined;
  const buildAutoHarnessCode = (harnessType?: string) => {
    if (!harnessType) return '';
    const matched = harnessCodeOptionsByType.get(harnessType)?.[0];
    if (matched) return matched;
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const seq = String(rawWorkOrders.length + 1).padStart(3, '0');
    return `HB-${datePart}-${seq}`;
  };
  const createAutoHarnessCode = buildAutoHarnessCode(createHarnessType);

  const exportSelected = () => {
    if (selectedWorkOrders.length === 0) {
      messageApi.warning(t('workOrder.exportSelectRequired'));
      return;
    }
    const csv = buildCsv(selectedWorkOrders);
    downloadCsv(csv, `work-orders-${new Date().toISOString().slice(0, 10)}.csv`);
    messageApi.success(t('workOrder.exportDone', { count: selectedWorkOrders.length }));
  };

  const parseImportedExcel = (buffer: ArrayBuffer): Omit<WorkOrderItem, 'id'>[] => {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    if (!sheet) return [];
    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false });
    if (rows.length <= 1) return [];
    return rows
      .slice(1)
      .filter((cols) => Array.isArray(cols) && cols.length >= 12)
      .map((cols) => ({
        workOrderNo: String(cols[0] ?? '').trim(),
        harnessCode: String(cols[1] ?? '').trim(),
        harnessType: String(cols[2] ?? '').trim(),
        stationCode: String(cols[3] ?? '').trim(),
        status: normalizeStatus(String(cols[4] ?? '').trim()),
        qualityResult: normalizeQualityResult(String(cols[5] ?? '').trim()),
        taskIds: String(cols[6] ?? '')
          .split('/')
          .map((item) => item.trim())
          .filter(Boolean),
        detectionDuration: Number(cols[7]) || 0,
        movingDuration: Number(cols[8]) || 0,
        createdAt: String(cols[9] ?? '-').trim() || '-',
        startedAt: String(cols[10] ?? '-').trim() || '-',
        endedAt: String(cols[11] ?? '-').trim() || '-',
        defectType: String(cols[12] ?? '-').trim() || '-',
        defectDescription: String(cols[13] ?? '-').trim() || '-',
      }))
      .filter((item) => item.workOrderNo && item.harnessCode && item.harnessType && item.stationCode);
  };

  const handleImport = async (file?: File) => {
    if (!file) return;
    try {
      const lowerName = file.name.toLowerCase();
      let rows: Omit<WorkOrderItem, 'id'>[] = [];
      if (lowerName.endsWith('.csv')) {
        rows = parseImportedCsv(await file.text());
      } else if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
        rows = parseImportedExcel(await file.arrayBuffer());
      } else {
        messageApi.warning(t('workOrder.importTip'));
        return;
      }
      if (rows.length === 0) {
        messageApi.warning(t('workOrder.importEmpty'));
        return;
      }
      const count = await importWorkOrders(rows);
      messageApi.success(t('workOrder.importDone', { count }));
      setSelectedRowKeys([]);
    } catch {
      messageApi.error(t('workOrder.importFailed'));
    }
  };

  const inspectionPoints = useMemo(() => {
    if (!viewingWorkOrder) {
      return [];
    }
    const wireHarnessId = resolveWireHarnessId(viewingWorkOrder.harnessType);
    const annotations = loadQcWireHarnessAnnotations();
    const annotationPoints = wireHarnessId ? annotations.pointsByHarnessId[wireHarnessId] ?? [] : [];
    if (annotationPoints.length > 0) {
      return buildInspectionPointsFromAnnotation(viewingWorkOrder, annotationPoints);
    }
    return buildInspectionPoints(viewingWorkOrder);
  }, [viewingWorkOrder]);

  const annotationPoints = useMemo(() => {
    if (!viewingWorkOrder) {
      return [];
    }
    const wireHarnessId = resolveWireHarnessId(viewingWorkOrder.harnessType);
    const annotations = loadQcWireHarnessAnnotations();
    return wireHarnessId ? annotations.pointsByHarnessId[wireHarnessId] ?? [] : [];
  }, [viewingWorkOrder]);

  const overlayPoints = useMemo(
    () =>
      annotationPoints.length > 0
        ? annotationPoints.map((point) => ({ x: point.x, y: point.y, description: point.description }))
        : inspectionPoints.map((point) => ({ x: point.x, y: point.y, description: point.pointCode })),
    [annotationPoints, inspectionPoints],
  );

  const harness2DImage = useMemo(() => {
    if (!viewingWorkOrder) {
      return null;
    }
    const wireHarnessId = resolveWireHarnessId(viewingWorkOrder.harnessType);
    if (!wireHarnessId) {
      return null;
    }
    const annotations = loadQcWireHarnessAnnotations();
    return annotations.imageByHarnessId[wireHarnessId] ?? null;
  }, [viewingWorkOrder]);

  const pointColumns: ColumnsType<InspectionPointItem> = [
    { title: t('workOrder.detail.pointCode'), dataIndex: 'pointCode', key: 'pointCode', width: 100 },
    {
      title: t('workOrder.detail.pointStatus'),
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (value: InspectionPointStatus) => <Tag color={value === 'ok' ? 'success' : 'error'}>{value === 'ok' ? t('workOrder.detail.ok') : t('workOrder.detail.ng')}</Tag>,
    },
    { title: t('workOrder.detail.pointRobot'), dataIndex: 'robot', key: 'robot', width: 140 },
    { title: t('workOrder.detail.pointResult'), dataIndex: 'result', key: 'result', width: 110 },
    {
      title: t('workOrder.detail.pointMedia'),
      dataIndex: 'mediaType',
      key: 'mediaType',
      width: 140,
      render: (_, record) => (
        <Button type="link" onClick={() => setPreviewPoint(record)}>
          {record.mediaType === 'video' ? t('workOrder.detail.viewVideo') : t('workOrder.detail.viewImage')}
        </Button>
      ),
    },
    { title: t('workOrder.detail.pointDuration'), dataIndex: 'duration', key: 'duration', width: 110, render: (value: number) => `${value}${t('workOrder.timeUnit')}` },
    { title: t('workOrder.detail.pointStartedAt'), dataIndex: 'startedAt', key: 'startedAt', width: 170 },
    { title: t('workOrder.detail.pointEndedAt'), dataIndex: 'endedAt', key: 'endedAt', width: 170 },
  ];

  const columns: ColumnsType<WorkOrderItem> = [
    { title: t('workOrder.table.workOrderNo'), dataIndex: 'workOrderNo', key: 'workOrderNo', width: 180 },
    { title: t('workOrder.table.harnessCode'), dataIndex: 'harnessCode', key: 'harnessCode', width: 170 },
    { title: t('workOrder.table.harnessType'), dataIndex: 'harnessType', key: 'harnessType', width: 150 },
    { title: t('workOrder.table.stationCode'), dataIndex: 'stationCode', key: 'stationCode', width: 120 },
    {
      title: t('workOrder.table.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: WorkOrderStatus) => <Tag color={statusColorMap[status]}>{t(`workOrder.status.${status}`)}</Tag>,
    },
    {
      title: t('workOrder.table.qualityResult'),
      dataIndex: 'qualityResult',
      key: 'qualityResult',
      width: 120,
      render: (value: QualityResult) => <Tag color={qualityColorMap[value]}>{t(`workOrder.qualityResult.${value}`)}</Tag>,
    },
    {
      title: t('workOrder.table.taskIds'),
      dataIndex: 'taskIds',
      key: 'taskIds',
      width: 220,
      render: (taskIds: string[]) => taskIds.join(' / '),
    },
    { title: t('workOrder.table.detectionDuration'), dataIndex: 'detectionDuration', key: 'detectionDuration', width: 130 },
    { title: t('workOrder.table.movingDuration'), dataIndex: 'movingDuration', key: 'movingDuration', width: 130 },
    { title: t('workOrder.table.createdAt'), dataIndex: 'createdAt', key: 'createdAt', width: 170 },
    { title: t('workOrder.table.startedAt'), dataIndex: 'startedAt', key: 'startedAt', width: 170 },
    { title: t('workOrder.table.endedAt'), dataIndex: 'endedAt', key: 'endedAt', width: 170 },
    {
      title: t('workOrder.table.action'),
      key: 'action',
      width: 320,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4} wrap>
          <Permission menuKey={WORK_ORDER_MENU_KEY} action="detail">
            <Button type="link" icon={<EyeOutlined />} onClick={() => openDetail(record)}>
              {t('workOrder.action.review')}
            </Button>
          </Permission>
          <Permission menuKey={WORK_ORDER_MENU_KEY} action="review">
            <Button
              type="link"
              icon={<PauseCircleOutlined />}
              onClick={() => pauseWorkOrder(record.id).catch(() => messageApi.error(t('workOrder.actionFailed')))}
              disabled={record.status !== 'running'}
            >
              {t('workOrder.action.pause')}
            </Button>
          </Permission>
          <Permission menuKey={WORK_ORDER_MENU_KEY} action="review">
            <Button
              type="link"
              icon={<PlayCircleOutlined />}
              onClick={() => resumeWorkOrder(record.id).catch(() => messageApi.error(t('workOrder.actionFailed')))}
              disabled={record.status !== 'paused'}
            >
              {t('workOrder.action.resume')}
            </Button>
          </Permission>
          <Permission menuKey={WORK_ORDER_MENU_KEY} action="cancel">
            <Button
              type="link"
              icon={<StopOutlined />}
              onClick={() => {
                cancelWorkOrder(record.id)
                  .then(() => messageApi.success(t('workOrder.action.cancelDone')))
                  .catch(() => messageApi.error(t('workOrder.actionFailed')));
              }}
              disabled={record.status === 'finished' || record.status === 'cancelled'}
            >
              {t('workOrder.action.cancel')}
            </Button>
          </Permission>
          <Permission menuKey={WORK_ORDER_MENU_KEY} action="delete">
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                Modal.confirm({
                  title: t('workOrder.deleteConfirmTitle'),
                  icon: <ExclamationCircleFilled />,
                  content: record.workOrderNo,
                  okText: t('workOrder.action.delete'),
                  cancelText: t('workOrder.modal.cancel'),
                  okButtonProps: { danger: true },
                  onOk: () =>
                    removeWorkOrder(record.id).catch(() => {
                      messageApi.error(t('workOrder.actionFailed'));
                    }),
                });
              }}
            >
              {t('workOrder.action.delete')}
            </Button>
          </Permission>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {contextHolder}
      <Card>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {t('workOrder.pageTitle')}
          </Typography.Title>
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Row gutter={[12, 12]} align="middle">
              <Col xs={24} lg={10}>
                <Input
                  allowClear
                  prefix={<SearchOutlined />}
                  placeholder={t('workOrder.searchPlaceholder')}
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                />
              </Col>
              <Col xs={24} lg={14}>
                <Space wrap style={{ width: '100%', justifyContent: 'flex-end' }}>
                  <Permission menuKey={WORK_ORDER_MENU_KEY} action="create">
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        createForm.resetFields();
                        createForm.setFieldsValue({
                          status: 'pending',
                          qualityResult: 'pending',
                          harnessCode: '',
                        });
                        setCreateOpen(true);
                      }}
                    >
                      {t('workOrder.toolbar.create')}
                    </Button>
                  </Permission>
                  <Permission menuKey={WORK_ORDER_MENU_KEY} action="import">
                    <Button
                      icon={<UploadOutlined />}
                      onClick={() => importInputRef.current?.click()}
                    >
                      {t('workOrder.toolbar.import')}
                    </Button>
                  </Permission>
                  <Permission menuKey={WORK_ORDER_MENU_KEY} action="export">
                    <Button onClick={exportSelected}>{t('workOrder.toolbar.export')}</Button>
                  </Permission>
                </Space>
              </Col>
            </Row>
            <input
              ref={importInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              style={{ display: 'none' }}
              onChange={async (event) => {
                const file = event.target.files?.[0];
                await handleImport(file);
                event.currentTarget.value = '';
              }}
            />
            <Table
              rowKey="id"
              loading={loading}
              rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
              columns={columns}
              dataSource={operationWorkOrders}
              pagination={{
                current: page,
                pageSize,
                total,
                showSizeChanger: true,
                showTotal: (n) => t('workOrder.paginationTotal', { total: n }),
                onChange: (p, ps) => {
                  setPage(p);
                  if (ps != null) setPageSize(ps);
                },
              }}
              scroll={{ x: 'max-content' }}
            />
          </Space>
        </Space>
      </Card>

      <Modal title={t('workOrder.detailTitle')} open={Boolean(viewingWorkOrder)} onCancel={closeDetail} footer={null} width={isLaptop ? 'calc(100vw - 48px)' : 1280}>
        {viewingWorkOrder ? (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Descriptions size="small" column={3}>
              <Descriptions.Item label={t('workOrder.table.workOrderNo')}>{viewingWorkOrder.workOrderNo}</Descriptions.Item>
              <Descriptions.Item label={t('workOrder.table.harnessCode')}>{viewingWorkOrder.harnessCode}</Descriptions.Item>
              <Descriptions.Item label={t('workOrder.table.harnessType')}>{viewingWorkOrder.harnessType}</Descriptions.Item>
              <Descriptions.Item label={t('workOrder.table.stationCode')}>{viewingWorkOrder.stationCode}</Descriptions.Item>
              <Descriptions.Item label={t('workOrder.detail.defectType')}>{viewingWorkOrder.defectType || '-'}</Descriptions.Item>
              <Descriptions.Item label={t('workOrder.detail.defectDescription')} span={2}>
                {viewingWorkOrder.defectDescription || '-'}
              </Descriptions.Item>
            </Descriptions>

            <Card size="small" title={t('workOrder.detail.harness2dTitle')}>
              <div
                style={{
                  borderRadius: 8,
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e5e7eb',
                  minHeight: 360,
                }}
              >
                {harness2DImage ? (
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      maxWidth: 620,
                      margin: '0 auto',
                      overflow: 'hidden',
                    }}
                  >
                    <img src={harness2DImage} alt="wire-harness-2d" style={{ width: '100%', display: 'block', background: '#fff' }} />
                    {overlayPoints.map((point, index) => (
                      <div key={inspectionPoints[index]?.id ?? `annotation-${point.x}-${point.y}-${index}`}>
                        <button
                          type="button"
                          onClick={() => setPreviewPoint(inspectionPoints[index] ?? null)}
                          style={{
                            position: 'absolute',
                            left: `${point.x}%`,
                            top: `${point.y}%`,
                            transform: 'translate(-50%, -50%)',
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            border: '2px solid #ffffff',
                            background: inspectionPoints[index]?.status === 'ng' ? '#ff4d4f' : '#1677ff',
                            color: '#ffffff',
                            fontSize: 12,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 600,
                            boxShadow: '0 1px 6px rgba(0, 0, 0, 0.35)',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        >
                          {index + 1}
                        </button>
                        {point.description ? (
                          <div
                            style={{
                              position: 'absolute',
                              left: `${point.x}%`,
                              top: `${point.y}%`,
                              transform: 'translate(14px, -50%)',
                              background: 'rgba(0, 0, 0, 0.7)',
                              color: '#fff',
                              borderRadius: 4,
                              padding: '2px 6px',
                              fontSize: 12,
                              maxWidth: 180,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {point.description}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: 360,
                      backgroundImage:
                        'linear-gradient(to right, rgba(148,163,184,0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.18) 1px, transparent 1px)',
                      backgroundSize: '24px 24px',
                    }}
                  />
                )}
              </div>
            </Card>

            <Card size="small" title={t('workOrder.detail.pointListTitle')}>
              <Table rowKey="id" columns={pointColumns} dataSource={inspectionPoints} pagination={false} size="small" scroll={{ x: 'max-content' }} />
            </Card>

          </Space>
        ) : null}
      </Modal>

      <Modal
        title={previewPoint?.mediaType === 'video' ? t('workOrder.detail.mediaVideoTitle') : t('workOrder.detail.mediaImageTitle')}
        open={Boolean(previewPoint)}
        onCancel={() => setPreviewPoint(null)}
        footer={null}
      >
        {previewPoint ? (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Typography.Text>
              {t('workOrder.detail.pointCode')}: {previewPoint.pointCode}
            </Typography.Text>
            {previewPoint.mediaType === 'video' ? (
              <div
                style={{
                  height: 220,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
                  color: '#e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  padding: 12,
                }}
              >
                <div>
                  <div>{t('workOrder.detail.videoPlaceholder')}</div>
                  <div style={{ marginTop: 8, fontSize: 12 }}>{previewPoint.mediaUrl}</div>
                </div>
              </div>
            ) : (
              <Image
                src={previewPoint.mediaUrl}
                alt={previewPoint.pointCode}
                fallback="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='960' height='540'><rect width='100%' height='100%' fill='%23e5e7eb'/><text x='50%' y='50%' font-size='22' text-anchor='middle' fill='%236b7280'>Inspection Point Image Placeholder</text></svg>"
              />
            )}
          </Space>
        ) : null}
      </Modal>

      <Modal
        title={t('workOrder.createTitle')}
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => createForm.submit()}
        okText={t('workOrder.modal.save')}
        cancelText={t('workOrder.modal.cancel')}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={(values) =>
            createWorkOrder({
              workOrderNo: values.workOrderNo,
              harnessCode: values.harnessCode || buildAutoHarnessCode(values.harnessType),
              harnessType: values.harnessType,
              stationCode: values.stationCode,
              status: values.status,
              qualityResult: values.qualityResult,
              taskIdsRaw: values.taskIdsRaw,
              movingDuration: Number(values.movingDuration),
              detectionDuration: Number(values.detectionDuration),
              startedAt: values.startedAt,
              endedAt: values.endedAt,
              defectType: values.defectType,
              defectDescription: values.defectDescription,
            })
              .then(() => {
                messageApi.success(t('workOrder.createDone'));
                setCreateOpen(false);
              })
              .catch(() => messageApi.error(t('workOrder.actionFailed')))
          }
        >
          <Form.Item label={t('workOrder.table.workOrderNo')} name="workOrderNo" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label={t('workOrder.table.harnessType')} name="harnessType" rules={[{ required: true }]}>
            <Select
              options={harnessTypeOptions.map((item) => ({ label: item, value: item }))}
              onChange={(value) => createForm.setFieldValue('harnessCode', buildAutoHarnessCode(value))}
            />
          </Form.Item>
          <Form.Item name="harnessCode" hidden>
            <Input />
          </Form.Item>
          <Form.Item label={t('workOrder.table.harnessCode')}>
            <Typography.Text>{createAutoHarnessCode || '-'}</Typography.Text>
          </Form.Item>
          <Form.Item label={t('workOrder.table.stationCode')} name="stationCode" rules={[{ required: true }]}>
            <Select options={stationCodeOptions.map((item) => ({ label: item, value: item }))} />
          </Form.Item>
          <Form.Item label={t('workOrder.table.status')} name="status" rules={[{ required: true }]}>
            <Select options={statusOptions.map((item) => ({ label: t(`workOrder.status.${item}`), value: item }))} />
          </Form.Item>
          <Form.Item label={t('workOrder.table.qualityResult')} name="qualityResult" rules={[{ required: true }]}>
            <Select options={qualityOptions.map((item) => ({ label: t(`workOrder.qualityResult.${item}`), value: item }))} />
          </Form.Item>
          <Form.Item label={t('workOrder.table.taskIds')} name="taskIdsRaw" rules={[{ required: true }]}>
            <Input placeholder="TASK-001, TASK-002" />
          </Form.Item>
          <Form.Item label={t('workOrder.table.movingDuration')} name="movingDuration" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label={t('workOrder.table.detectionDuration')} name="detectionDuration" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label={t('workOrder.table.startedAt')} name="startedAt">
            <Input />
          </Form.Item>
          <Form.Item label={t('workOrder.table.endedAt')} name="endedAt">
            <Input />
          </Form.Item>
          <Form.Item label={t('workOrder.detail.defectType')} name="defectType">
            <Select allowClear options={defectTypeOptions.map((item) => ({ label: item, value: item }))} />
          </Form.Item>
          <Form.Item label={t('workOrder.detail.defectDescription')} name="defectDescription">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('workOrder.editTitle')}
        open={Boolean(editingWorkOrder)}
        onCancel={closeEdit}
        onOk={() => form.submit()}
        okText={t('workOrder.modal.save')}
        cancelText={t('workOrder.modal.cancel')}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) =>
            saveEdit({
              id: Number(values.id),
              harnessCode: values.harnessCode,
              harnessType: values.harnessType,
              stationCode: values.stationCode,
              status: values.status,
              qualityResult: values.qualityResult,
              taskIdsRaw: values.taskIdsRaw,
              movingDuration: Number(values.movingDuration),
              detectionDuration: Number(values.detectionDuration),
              startedAt: values.startedAt,
              endedAt: values.endedAt,
              defectType: values.defectType,
              defectDescription: values.defectDescription,
            }).then(() => messageApi.success(t('workOrder.editDone'))).catch(() => messageApi.error(t('workOrder.actionFailed')))
          }
        >
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
          <Form.Item label={t('workOrder.table.harnessCode')} name="harnessCode" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label={t('workOrder.table.harnessType')} name="harnessType" rules={[{ required: true }]}>
            <Select options={harnessTypeOptions.map((item) => ({ label: item, value: item }))} />
          </Form.Item>
          <Form.Item label={t('workOrder.table.stationCode')} name="stationCode" rules={[{ required: true }]}>
            <Select options={stationCodeOptions.map((item) => ({ label: item, value: item }))} />
          </Form.Item>
          <Form.Item label={t('workOrder.table.status')} name="status" rules={[{ required: true }]}>
            <Select options={statusOptions.map((item) => ({ label: t(`workOrder.status.${item}`), value: item }))} />
          </Form.Item>
          <Form.Item label={t('workOrder.table.qualityResult')} name="qualityResult" rules={[{ required: true }]}>
            <Select options={qualityOptions.map((item) => ({ label: t(`workOrder.qualityResult.${item}`), value: item }))} />
          </Form.Item>
          <Form.Item label={t('workOrder.table.taskIds')} name="taskIdsRaw" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label={t('workOrder.table.movingDuration')} name="movingDuration" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label={t('workOrder.table.detectionDuration')} name="detectionDuration" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label={t('workOrder.table.startedAt')} name="startedAt">
            <Input />
          </Form.Item>
          <Form.Item label={t('workOrder.table.endedAt')} name="endedAt">
            <Input />
          </Form.Item>
          <Form.Item label={t('workOrder.detail.defectType')} name="defectType">
            <Select allowClear options={defectTypeOptions.map((item) => ({ label: item, value: item }))} />
          </Form.Item>
          <Form.Item label={t('workOrder.detail.defectDescription')} name="defectDescription">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}


