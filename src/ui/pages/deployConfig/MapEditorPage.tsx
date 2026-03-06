import {
  AimOutlined,
  ApartmentOutlined,
  ArrowLeftOutlined,
  BorderOutlined,
  CaretLeftOutlined,
  CaretRightOutlined,
  EnvironmentOutlined,
  MenuOutlined,
  RedoOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { Button, Input, Space, Tooltip, Typography, message } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMapList } from '../../../data/deployConfig/mapList';
import { useI18n } from '../../../i18n/I18nProvider';

type PointType = 'waypoint' | 'work' | 'charge' | 'idle';
type ToolKey = 'select' | 'point' | 'path' | 'area' | 'align';
type AlignAction = 'left' | 'right' | 'top' | 'bottom' | 'vcenter' | 'hcenter';

type NodeItem = {
  id: string;
  x: number;
  y: number;
  type: PointType;
};

type EdgeItem = {
  id: string;
  from: string;
  to: string;
};

type AreaItem = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type SceneState = {
  nodes: NodeItem[];
  edges: EdgeItem[];
  areas: AreaItem[];
};

type RectDraft = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

const CANVAS_WIDTH = 1320;
const CANVAS_HEIGHT = 800;

const pointTypeLabels: Record<PointType, string> = {
  waypoint: '路径点',
  work: '工作点',
  charge: '充电点',
  idle: '空闲点',
};

const pointTypeColors: Record<PointType, string> = {
  waypoint: '#cbcbcb',
  work: '#4f8ee3',
  charge: '#f1b54c',
  idle: '#86c677',
};

function nowText() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function edgeKey(a: string, b: string) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function buildGrid(rows: number, cols: number, startX: number, startY: number, gapX: number, gapY: number): SceneState {
  const nodes: NodeItem[] = [];
  const edges: EdgeItem[] = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const id = `n-${r}-${c}`;
      nodes.push({
        id,
        x: startX + c * gapX,
        y: startY + r * gapY,
        type: 'waypoint',
      });
      if (c > 0) {
        edges.push({ id: `e-h-${r}-${c}`, from: `n-${r}-${c - 1}`, to: id });
      }
      if (r > 0) {
        edges.push({ id: `e-v-${r}-${c}`, from: `n-${r - 1}-${c}`, to: id });
      }
    }
  }
  return { nodes, edges, areas: [] };
}

function rectContains(rect: { x1: number; y1: number; x2: number; y2: number }, x: number, y: number) {
  const minX = Math.min(rect.x1, rect.x2);
  const maxX = Math.max(rect.x1, rect.x2);
  const minY = Math.min(rect.y1, rect.y2);
  const maxY = Math.max(rect.y1, rect.y2);
  return x >= minX && x <= maxX && y >= minY && y <= maxY;
}

export function MapEditorPage() {
  const navigate = useNavigate();
  const { mapCode } = useParams<{ mapCode: string }>();
  const { locale } = useI18n();
  const [messageApi, contextHolder] = message.useMessage();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragHistoryCommittedRef = useRef(false);

  const mapList = useMemo(() => getMapList(locale), [locale]);
  const mapRecord = useMemo(() => mapList.find((item) => item.code === mapCode), [mapCode, mapList]);

  const [scene, setScene] = useState<SceneState>(() => buildGrid(6, 8, 250, 170, 110, 95));
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [recentAddedNodeIds, setRecentAddedNodeIds] = useState<string[]>([]);
  const [activeTool, setActiveTool] = useState<ToolKey>('select');
  const [activePointType, setActivePointType] = useState<PointType>('waypoint');
  const [pendingPathFrom, setPendingPathFrom] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isRotated, setIsRotated] = useState(false);
  const [propertyCollapsed, setPropertyCollapsed] = useState(false);
  const [recording, setRecording] = useState(false);
  const [lastRecordedNodeId, setLastRecordedNodeId] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState(mapRecord?.editedAt ?? nowText());

  const [areaDraft, setAreaDraft] = useState<RectDraft | null>(null);
  const [selectDraft, setSelectDraft] = useState<RectDraft | null>(null);
  const [draggingCanvas, setDraggingCanvas] = useState(false);
  const [dragAnchor, setDragAnchor] = useState<{ x: number; y: number } | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [nodeDragOffset, setNodeDragOffset] = useState<{ dx: number; dy: number } | null>(null);

  const [undoStack, setUndoStack] = useState<SceneState[]>([]);
  const [redoStack, setRedoStack] = useState<SceneState[]>([]);

  useEffect(() => {
    const onFullChange = () => {
      const full = Boolean(document.fullscreenElement);
      setIsFullscreen(full);
      document.body.classList.toggle('map-editor-fullscreen', full);
    };
    document.addEventListener('fullscreenchange', onFullChange);
    onFullChange();
    return () => {
      document.removeEventListener('fullscreenchange', onFullChange);
      document.body.classList.remove('map-editor-fullscreen');
    };
  }, []);

  const mapCodeText = mapRecord?.code ?? mapCode ?? '-';
  const mapNameText = mapRecord?.name ?? '未命名地图';
  const publishedAtText = mapRecord?.publishedAt ?? '-';

  const nodeMap = useMemo(() => new Map(scene.nodes.map((item) => [item.id, item])), [scene.nodes]);

  const applyScene = (updater: (prev: SceneState) => SceneState) => {
    setScene((prev) => {
      setUndoStack((history) => [...history, prev]);
      setRedoStack([]);
      const next = updater(prev);
      setUpdatedAt(nowText());
      return next;
    });
  };

  const undo = () => {
    if (!undoStack.length) {
      messageApi.info('没有可撤销操作');
      return;
    }
    setUndoStack((history) => {
      if (!history.length) {
        return history;
      }
      const previous = history[history.length - 1];
      setRedoStack((redo) => [...redo, scene]);
      setScene(previous);
      setUpdatedAt(nowText());
      return history.slice(0, -1);
    });
  };

  const redo = () => {
    if (!redoStack.length) {
      messageApi.info('没有可重做操作');
      return;
    }
    setRedoStack((history) => {
      if (!history.length) {
        return history;
      }
      const next = history[history.length - 1];
      setUndoStack((undoHistory) => [...undoHistory, scene]);
      setScene(next);
      setUpdatedAt(nowText());
      return history.slice(0, -1);
    });
  };

  const applyView = (x: number, y: number) => {
    let px = x;
    let py = y;
    if (isFlipped) {
      px = CANVAS_WIDTH - px;
    }
    if (isRotated) {
      const cx = CANVAS_WIDTH / 2;
      const cy = CANVAS_HEIGHT / 2;
      const rx = px - cx;
      const ry = py - cy;
      px = cx - ry;
      py = cy + rx;
    }
    return { x: px, y: py };
  };

  const invertView = (x: number, y: number) => {
    let px = x;
    let py = y;
    if (isRotated) {
      const cx = CANVAS_WIDTH / 2;
      const cy = CANVAS_HEIGHT / 2;
      const rx = px - cx;
      const ry = py - cy;
      px = cx + ry;
      py = cy - rx;
    }
    if (isFlipped) {
      px = CANVAS_WIDTH - px;
    }
    return { x: px, y: py };
  };

  const toWorld = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) {
      return null;
    }
    const ctm = svg.getScreenCTM();
    if (!ctm) {
      return null;
    }
    const p = svg.createSVGPoint();
    p.x = clientX;
    p.y = clientY;
    const local = p.matrixTransform(ctm.inverse());
    const viewX = (local.x - offset.x) / scale;
    const viewY = (local.y - offset.y) / scale;
    return invertView(viewX, viewY);
  };

  const addNodeAt = (x: number, y: number, type: PointType) => {
    const id = `n-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    applyScene((prev) => ({
      ...prev,
      nodes: [...prev.nodes, { id, x: Math.round(x / 5) * 5, y: Math.round(y / 5) * 5, type }],
    }));
    setRecentAddedNodeIds((prev) => [...prev, id].slice(-30));
    return id;
  };

  const addPath = (fromId: string, toId: string) => {
    if (fromId === toId) {
      return;
    }
    applyScene((prev) => {
      const exists = prev.edges.some((edge) => edgeKey(edge.from, edge.to) === edgeKey(fromId, toId));
      if (exists) {
        messageApi.warning('路径已存在');
        return prev;
      }
      return { ...prev, edges: [...prev.edges, { id: `e-${Date.now()}-${Math.floor(Math.random() * 1000)}`, from: fromId, to: toId }] };
    });
  };

  const deleteSelected = () => {
    if (!selectedNodeIds.length) {
      messageApi.warning('请先选中节点');
      return;
    }
    const selectedSet = new Set(selectedNodeIds);
    applyScene((prev) => ({
      ...prev,
      nodes: prev.nodes.filter((node) => !selectedSet.has(node.id)),
      edges: prev.edges.filter((edge) => !selectedSet.has(edge.from) && !selectedSet.has(edge.to)),
    }));
    setSelectedNodeIds([]);
    setPendingPathFrom(null);
  };

  const applyAlign = (action: AlignAction) => {
    const existingIds = new Set(scene.nodes.map((node) => node.id));
    const selectedTargets = selectedNodeIds.filter((id) => existingIds.has(id));
    const recentTargets = recentAddedNodeIds.filter((id) => existingIds.has(id));
    const targetIds = selectedTargets.length >= 2 ? selectedTargets : recentTargets;

    if (targetIds.length < 2) {
      messageApi.warning('至少选择两个节点');
      return;
    }

    if (selectedTargets.length < 2) {
      setSelectedNodeIds(targetIds);
      messageApi.info('已对齐最近新增点');
    }

    applyScene((prev) => {
      const selectedSet = new Set(targetIds);
      const selected = prev.nodes.filter((node) => selectedSet.has(node.id));
      const xs = selected.map((node) => node.x);
      const ys = selected.map((node) => node.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      return {
        ...prev,
        nodes: prev.nodes.map((node) => {
          if (!selectedSet.has(node.id)) {
            return node;
          }
          if (action === 'left') return { ...node, x: minX };
          if (action === 'right') return { ...node, x: maxX };
          if (action === 'top') return { ...node, y: minY };
          if (action === 'bottom') return { ...node, y: maxY };
          if (action === 'vcenter') return { ...node, x: centerX };
          return { ...node, y: centerY };
        }),
      };
    });
  };

  const straightenSelectedPath = () => {
    if (selectedNodeIds.length < 3) {
      messageApi.warning('至少选择三个节点再拉直');
      return;
    }
    applyScene((prev) => {
      const selectedSet = new Set(selectedNodeIds);
      const selected = prev.nodes.filter((node) => selectedSet.has(node.id)).sort((a, b) => a.x - b.x);
      const first = selected[0];
      const last = selected[selected.length - 1];
      const dx = (last.x - first.x) / Math.max(1, selected.length - 1);
      const dy = (last.y - first.y) / Math.max(1, selected.length - 1);
      const target = new Map<string, { x: number; y: number }>();
      selected.forEach((node, index) => {
        target.set(node.id, { x: Math.round((first.x + dx * index) / 5) * 5, y: Math.round((first.y + dy * index) / 5) * 5 });
      });
      return {
        ...prev,
        nodes: prev.nodes.map((node) => {
          const next = target.get(node.id);
          return next ? { ...node, ...next } : node;
        }),
      };
    });
  };

  const resetCanvas = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setIsFlipped(false);
    setIsRotated(false);
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      messageApi.error('全屏切换失败');
    }
  };

  const exportJson = () => {
    const payload = {
      code: mapCodeText,
      name: mapNameText,
      updatedAt,
      scene,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${mapCodeText || 'map'}-scene.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    messageApi.success('地图已导出');
  };

  const saveLocal = () => {
    localStorage.setItem(`map-editor:${mapCodeText}`, JSON.stringify({ scene, updatedAt: nowText() }));
    messageApi.success('地图已保存');
  };

  const toolbarButtons: Array<{ key: ToolKey | 'undo' | 'redo'; title: string; icon: React.ReactNode; onClick: () => void; active?: boolean }> = [
    { key: 'undo', title: '撤销', icon: <UndoOutlined />, onClick: undo },
    { key: 'redo', title: '重做', icon: <RedoOutlined />, onClick: redo },
    { key: 'select', title: '选中工具', icon: <AimOutlined />, onClick: () => setActiveTool('select'), active: activeTool === 'select' },
    { key: 'point', title: '点位工具', icon: <EnvironmentOutlined />, onClick: () => setActiveTool('point'), active: activeTool === 'point' },
    { key: 'path', title: '路径工具', icon: <ApartmentOutlined />, onClick: () => setActiveTool('path'), active: activeTool === 'path' },
    { key: 'area', title: '区域工具', icon: <BorderOutlined />, onClick: () => setActiveTool('area'), active: activeTool === 'area' },
    { key: 'align', title: '对齐工具', icon: <MenuOutlined />, onClick: () => setActiveTool('align'), active: activeTool === 'align' },
  ];

  const quickActionItems = [
    { key: 'add-node', label: '新增点位', onClick: () => setActiveTool('point') },
    { key: 'add-edge', label: '新增路径', onClick: () => setActiveTool('path') },
    { key: 'add-area', label: '新增区域', onClick: () => setActiveTool('area') },
    { key: 'delete', label: '删除选中', onClick: deleteSelected },
    {
      key: 'record',
      label: recording ? '停止录制' : '录制点位',
      onClick: () => {
        const next = !recording;
        setRecording(next);
        if (!next) {
          setLastRecordedNodeId(null);
        }
      },
    },
    { key: 'straight', label: '拉直路径', onClick: straightenSelectedPath },
    { key: 'reset-canvas', label: '画布重置', onClick: resetCanvas },
    { key: 'flip-canvas', label: isFlipped ? '恢复画布' : '画布翻转', onClick: () => setIsFlipped((prev) => !prev) },
    { key: 'rotate-canvas', label: isRotated ? '恢复旋转' : '画布旋转', onClick: () => setIsRotated((prev) => !prev) },
    { key: 'fullscreen', label: isFullscreen ? '收缩画布' : '画布全屏', onClick: toggleFullscreen },
  ];

  const selectedNodeInfo = selectedNodeIds.map((id) => nodeMap.get(id)).filter(Boolean) as NodeItem[];

  return (
    <div style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {contextHolder}
      <div style={{ marginBottom: 10 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/deployConfig/scene/mapManage')}>
            返回列表
          </Button>
          <Typography.Text type="secondary">地图编辑器</Typography.Text>
          <Typography.Text strong>{mapNameText}</Typography.Text>
          <Button onClick={saveLocal}>保存</Button>
          <Button onClick={exportJson}>导出</Button>
        </Space>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', border: '1px solid #d9d9d9', background: '#f3f4f6' }}>
        <div style={{ width: 64, borderRight: '1px solid #d9d9d9', background: '#eceff3', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 8, gap: 8 }}>
          {toolbarButtons.map((item) => (
            <Tooltip key={item.key} title={item.title} placement="right">
              <Button type={item.active ? 'primary' : 'text'} shape="circle" icon={item.icon} onClick={item.onClick} style={{ width: 38, height: 38 }} />
            </Tooltip>
          ))}
        </div>

        <div style={{ flex: 1, minWidth: 0, position: 'relative', overflow: 'hidden' }}>
          {(activeTool === 'point' || activeTool === 'align') && (
            <div style={{ position: 'absolute', left: 16, top: 16, zIndex: 5, background: '#fff', border: '1px solid #d9d9d9', padding: 8, borderRadius: 8 }}>
              {activeTool === 'point' && (
                <Space>
                  {(Object.keys(pointTypeLabels) as PointType[]).map((type) => (
                    <Button key={type} type={activePointType === type ? 'primary' : 'default'} size="small" onClick={() => setActivePointType(type)}>
                      {pointTypeLabels[type]}
                    </Button>
                  ))}
                </Space>
              )}
              {activeTool === 'align' && (
                <Space wrap>
                  <Button size="small" onClick={() => applyAlign('left')}>
                    左对齐
                  </Button>
                  <Button size="small" onClick={() => applyAlign('right')}>
                    右对齐
                  </Button>
                  <Button size="small" onClick={() => applyAlign('top')}>
                    上对齐
                  </Button>
                  <Button size="small" onClick={() => applyAlign('bottom')}>
                    下对齐
                  </Button>
                  <Button size="small" onClick={() => applyAlign('vcenter')}>
                    垂直居中
                  </Button>
                  <Button size="small" onClick={() => applyAlign('hcenter')}>
                    横向居中
                  </Button>
                </Space>
              )}
            </div>
          )}

          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
            style={{ display: 'block', cursor: draggingCanvas ? 'grabbing' : activeTool === 'point' ? 'crosshair' : 'default' }}
            onWheel={(event) => {
              event.preventDefault();
              setScale((prev) => clamp(Number((prev + (event.deltaY < 0 ? 0.1 : -0.1)).toFixed(2)), 0.5, 3));
            }}
            onMouseDown={(event) => {
              const world = toWorld(event.clientX, event.clientY);
              if (!world) {
                return;
              }
              if (event.ctrlKey && event.button === 0) {
                setDraggingCanvas(true);
                setDragAnchor({ x: event.clientX, y: event.clientY });
                return;
              }
              if (activeTool === 'area') {
                setAreaDraft({ x1: world.x, y1: world.y, x2: world.x, y2: world.y });
                return;
              }
              if (activeTool === 'select') {
                setSelectDraft({ x1: world.x, y1: world.y, x2: world.x, y2: world.y });
                return;
              }
              if (activeTool === 'point') {
                const newId = addNodeAt(world.x, world.y, activePointType);
                setSelectedNodeIds([newId]);
                if (recording) {
                  if (lastRecordedNodeId) {
                    addPath(lastRecordedNodeId, newId);
                  }
                  setLastRecordedNodeId(newId);
                }
              }
            }}
            onMouseMove={(event) => {
              const world = toWorld(event.clientX, event.clientY);
              if (!world) {
                return;
              }
              if (draggingCanvas && dragAnchor) {
                const dx = event.clientX - dragAnchor.x;
                const dy = event.clientY - dragAnchor.y;
                setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
                setDragAnchor({ x: event.clientX, y: event.clientY });
              }
              if (areaDraft) {
                setAreaDraft((prev) => (prev ? { ...prev, x2: world.x, y2: world.y } : prev));
              }
              if (selectDraft) {
                setSelectDraft((prev) => (prev ? { ...prev, x2: world.x, y2: world.y } : prev));
              }
              if (draggingNodeId && nodeDragOffset) {
                const targetX = Math.round((world.x - nodeDragOffset.dx) / 5) * 5;
                const targetY = Math.round((world.y - nodeDragOffset.dy) / 5) * 5;
                setScene((prev) => ({
                  ...prev,
                  nodes: prev.nodes.map((node) => (node.id === draggingNodeId ? { ...node, x: targetX, y: targetY } : node)),
                }));
              }
            }}
            onMouseUp={() => {
              if (draggingCanvas) {
                setDraggingCanvas(false);
                setDragAnchor(null);
              }
              if (draggingNodeId) {
                setDraggingNodeId(null);
                setNodeDragOffset(null);
                dragHistoryCommittedRef.current = false;
                setUpdatedAt(nowText());
              }
              if (areaDraft) {
                const width = Math.abs(areaDraft.x2 - areaDraft.x1);
                const height = Math.abs(areaDraft.y2 - areaDraft.y1);
                if (width >= 10 && height >= 10) {
                  applyScene((prev) => ({
                    ...prev,
                    areas: [
                      ...prev.areas,
                      {
                        id: `a-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                        x: Math.min(areaDraft.x1, areaDraft.x2),
                        y: Math.min(areaDraft.y1, areaDraft.y2),
                        width,
                        height,
                      },
                    ],
                  }));
                }
                setAreaDraft(null);
              }
              if (selectDraft) {
                const selected = scene.nodes.filter((node) => rectContains(selectDraft, node.x, node.y)).map((node) => node.id);
                setSelectedNodeIds(selected);
                setSelectDraft(null);
              }
            }}
          >
            <g transform={`translate(${offset.x} ${offset.y}) scale(${scale})`}>
              <g transform={`translate(${CANVAS_WIDTH / 2} ${CANVAS_HEIGHT / 2}) rotate(${isRotated ? 90 : 0}) scale(${isFlipped ? -1 : 1} 1) translate(${-CANVAS_WIDTH / 2} ${-CANVAS_HEIGHT / 2})`}>
                <rect x={190} y={70} width={270} height={54} fill="#d8e9fb" />
                <text x={325} y={102} textAnchor="middle" fontSize={16} fill="#2f3a4a">
                  质监站1
                </text>
                <rect x={640} y={70} width={270} height={54} fill="#d8e9fb" />
                <text x={775} y={102} textAnchor="middle" fontSize={16} fill="#2f3a4a">
                  质监站2
                </text>
                <rect x={1060} y={150} width={100} height={380} fill="#f6957f" />
                <text x={1110} y={345} textAnchor="middle" fontSize={16} fill="#3a3a3a">
                  虚拟墙
                </text>

                {scene.areas.map((area) => (
                  <rect key={area.id} x={area.x} y={area.y} width={area.width} height={area.height} fill="rgba(91,143,249,0.18)" stroke="#5b8ff9" strokeDasharray="6 4" />
                ))}
                {areaDraft && (
                  <rect
                    x={Math.min(areaDraft.x1, areaDraft.x2)}
                    y={Math.min(areaDraft.y1, areaDraft.y2)}
                    width={Math.abs(areaDraft.x2 - areaDraft.x1)}
                    height={Math.abs(areaDraft.y2 - areaDraft.y1)}
                    fill="rgba(91,143,249,0.12)"
                    stroke="#5b8ff9"
                    strokeDasharray="6 4"
                  />
                )}
                {selectDraft && (
                  <rect
                    x={Math.min(selectDraft.x1, selectDraft.x2)}
                    y={Math.min(selectDraft.y1, selectDraft.y2)}
                    width={Math.abs(selectDraft.x2 - selectDraft.x1)}
                    height={Math.abs(selectDraft.y2 - selectDraft.y1)}
                    fill="rgba(36,130,255,0.08)"
                    stroke="#2482ff"
                    strokeDasharray="4 4"
                  />
                )}

                {scene.edges.map((edge) => {
                  const from = nodeMap.get(edge.from);
                  const to = nodeMap.get(edge.to);
                  if (!from || !to) {
                    return null;
                  }
                  return <line key={edge.id} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#76797e" strokeWidth={2} />;
                })}

                {scene.nodes.map((node) => {
                  const selected = selectedNodeIds.includes(node.id);
                  return (
                    <rect
                      key={node.id}
                      x={node.x - 11}
                      y={node.y - 11}
                      width={22}
                      height={22}
                      fill={selected ? '#5b8ff9' : pointTypeColors[node.type]}
                      stroke={selected ? '#2f56d3' : '#b8b8b8'}
                      strokeWidth={selected ? 2 : 1}
                      style={{ cursor: activeTool === 'select' ? 'move' : 'pointer' }}
                      onMouseDown={(event) => {
                        event.stopPropagation();
                        if (activeTool === 'select') {
                          const world = toWorld(event.clientX, event.clientY);
                          if (!world) {
                            return;
                          }
                          if (!dragHistoryCommittedRef.current) {
                            setUndoStack((history) => [...history, scene]);
                            setRedoStack([]);
                            dragHistoryCommittedRef.current = true;
                          }
                          if (!event.shiftKey) {
                            setSelectedNodeIds([node.id]);
                          }
                          setDraggingNodeId(node.id);
                          setNodeDragOffset({ dx: world.x - node.x, dy: world.y - node.y });
                        }
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (activeTool === 'path') {
                          if (!pendingPathFrom) {
                            setPendingPathFrom(node.id);
                            setSelectedNodeIds([node.id]);
                            return;
                          }
                          addPath(pendingPathFrom, node.id);
                          setPendingPathFrom(null);
                          setSelectedNodeIds([node.id]);
                          return;
                        }
                        if (event.shiftKey) {
                          setSelectedNodeIds((prev) => (prev.includes(node.id) ? prev.filter((id) => id !== node.id) : [...prev, node.id]));
                        } else {
                          setSelectedNodeIds([node.id]);
                        }
                      }}
                    />
                  );
                })}
              </g>
            </g>
          </svg>

          <div style={{ position: 'absolute', left: 84, top: 220, width: 120 }}>
            {quickActionItems.map((item) => (
              <Button key={item.key} block style={{ marginBottom: 2, height: 34, borderRadius: 0, borderColor: '#444', background: '#2f3237', color: '#fff' }} onClick={item.onClick}>
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        <div style={{ width: 28, borderLeft: '1px solid #d9d9d9', background: '#f8f8f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Tooltip title={propertyCollapsed ? '展开属性栏' : '收起属性栏'} placement="left">
            <Button type="text" shape="circle" icon={propertyCollapsed ? <CaretLeftOutlined /> : <CaretRightOutlined />} onClick={() => setPropertyCollapsed((prev) => !prev)} />
          </Tooltip>
        </div>

        <div style={{ width: propertyCollapsed ? 0 : 300, borderLeft: propertyCollapsed ? 'none' : '1px solid #d9d9d9', background: '#f8f8f9', padding: propertyCollapsed ? 0 : 12, overflow: 'hidden', transition: 'width 0.2s ease, padding 0.2s ease' }}>
          {!propertyCollapsed && (
            <>
              <Typography.Text style={{ display: 'block', marginBottom: 10, fontWeight: 600, color: '#355db8' }}>地图属性</Typography.Text>
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <div>
                  <Typography.Text style={{ fontSize: 13 }}>地图编码</Typography.Text>
                  <Input value={mapCodeText} readOnly />
                </div>
                <div>
                  <Typography.Text style={{ fontSize: 13 }}>地图名称</Typography.Text>
                  <Input value={mapNameText} readOnly />
                </div>
                <div>
                  <Typography.Text style={{ fontSize: 13 }}>编辑时间</Typography.Text>
                  <Input value={updatedAt} readOnly />
                </div>
                <div>
                  <Typography.Text style={{ fontSize: 13 }}>发布时间</Typography.Text>
                  <Input value={publishedAtText} readOnly />
                </div>
                <div>
                  <Typography.Text style={{ fontSize: 13 }}>缩放</Typography.Text>
                  <Input value={`${Math.round(scale * 100)}%`} readOnly />
                </div>
                <div>
                  <Typography.Text style={{ fontSize: 13 }}>节点数 / 路径数 / 区域数</Typography.Text>
                  <Input value={`${scene.nodes.length} / ${scene.edges.length} / ${scene.areas.length}`} readOnly />
                </div>
                <div>
                  <Typography.Text style={{ fontSize: 13 }}>当前工具</Typography.Text>
                  <Input value={activeTool} readOnly />
                </div>
                <div>
                  <Typography.Text style={{ fontSize: 13 }}>已选节点</Typography.Text>
                  <Input value={selectedNodeIds.join(', ') || '-'} readOnly />
                </div>
                <div>
                  <Typography.Text style={{ fontSize: 13 }}>已选节点坐标</Typography.Text>
                  <Input value={selectedNodeInfo.map((item) => `(${item.x},${item.y})`).join(' ') || '-'} readOnly />
                </div>
                <div>
                  <Typography.Text style={{ fontSize: 13 }}>画布状态</Typography.Text>
                  <Input value={`${isFlipped ? '翻转' : '正常'} / ${isRotated ? '已旋转' : '未旋转'}`} readOnly />
                </div>
              </Space>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
