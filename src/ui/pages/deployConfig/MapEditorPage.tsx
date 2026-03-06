import {
  AimOutlined,
  ApartmentOutlined,
  ArrowLeftOutlined,
  BorderOutlined,
  CaretLeftOutlined,
  CaretRightOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  RedoOutlined,
  SaveOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { Button, Input, Select, Space, Tooltip, Typography, message } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMapList } from '../../../data/deployConfig/mapList';
import { useI18n } from '../../../i18n/I18nProvider';

type PointType = 'waypoint' | 'work' | 'charge' | 'idle';
type AreaType = 'forbidden' | 'work' | 'device';
type ToolKey = 'select' | 'point' | 'path' | 'area';

type Node = { id: string; x: number; y: number; type: PointType };
type Edge = { id: string; from: string; to: string };
type Area = { id: string; name: string; type: AreaType; x: number; y: number; width: number; height: number };
type Scene = { nodes: Node[]; edges: Edge[]; areas: Area[] };
type DraftRect = { x1: number; y1: number; x2: number; y2: number };
type SavedMapEditorState = { scene: Scene; updatedAt: string };

const CANVAS_W = 1320;
const CANVAS_H = 800;

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

const areaTypeLabels: Record<AreaType, string> = {
  forbidden: '禁行区',
  work: '工作区',
  device: '设备区',
};

const areaTypeStyles: Record<AreaType, { fill: string; stroke: string }> = {
  forbidden: { fill: 'rgba(245,108,108,0.2)', stroke: '#f56c6c' },
  work: { fill: 'rgba(91,143,249,0.2)', stroke: '#5b8ff9' },
  device: { fill: 'rgba(103,194,58,0.2)', stroke: '#67c23a' },
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const round5 = (v: number) => Math.round(v / 5) * 5;
const edgeKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
const nowText = () => new Date().toISOString().slice(0, 19).replace('T', ' ');
const sceneStorageKey = (code: string) => `map-editor-scene:${code}`;

function loadSavedState(code?: string): SavedMapEditorState | null {
  if (!code) return null;
  try {
    const raw = localStorage.getItem(sceneStorageKey(code));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedMapEditorState;
    if (!parsed?.scene || !Array.isArray(parsed.scene.nodes) || !Array.isArray(parsed.scene.edges) || !Array.isArray(parsed.scene.areas)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveSceneState(code: string | undefined, scene: Scene, updatedAt: string) {
  if (!code) return;
  try {
    localStorage.setItem(sceneStorageKey(code), JSON.stringify({ scene, updatedAt }));
  } catch {
    // ignore local storage errors
  }
}

function createInitialScene(): Scene {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  for (let r = 0; r < 6; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      const id = `n-${r}-${c}`;
      nodes.push({ id, x: 250 + c * 110, y: 170 + r * 95, type: 'waypoint' });
      if (c > 0) edges.push({ id: `eh-${r}-${c}`, from: `n-${r}-${c - 1}`, to: id });
      if (r > 0) edges.push({ id: `ev-${r}-${c}`, from: `n-${r - 1}-${c}`, to: id });
    }
  }
  return { nodes, edges, areas: [] };
}

function pointInRect(rect: DraftRect, x: number, y: number) {
  const minX = Math.min(rect.x1, rect.x2);
  const maxX = Math.max(rect.x1, rect.x2);
  const minY = Math.min(rect.y1, rect.y2);
  const maxY = Math.max(rect.y1, rect.y2);
  return x >= minX && x <= maxX && y >= minY && y <= maxY;
}

function pointInArea(area: Area, x: number, y: number) {
  return x >= area.x && x <= area.x + area.width && y >= area.y && y <= area.y + area.height;
}

export function MapEditorPage() {
  const navigate = useNavigate();
  const { mapCode } = useParams<{ mapCode: string }>();
  const { locale } = useI18n();
  const [messageApi, contextHolder] = message.useMessage();
  const svgRef = useRef<SVGSVGElement | null>(null);

  const map = useMemo(() => getMapList(locale).find((item) => item.code === mapCode), [locale, mapCode]);
  const initialSaved = useMemo(() => loadSavedState(mapCode), [mapCode]);
  const [scene, setScene] = useState<Scene>(() => initialSaved?.scene ?? createInitialScene());
  const [undoStack, setUndoStack] = useState<Scene[]>([]);
  const [redoStack, setRedoStack] = useState<Scene[]>([]);

  const [tool, setTool] = useState<ToolKey>('select');
  const [pointType, setPointType] = useState<PointType>('waypoint');
  const [areaType, setAreaType] = useState<AreaType>('work');
  const [areaNameDraft, setAreaNameDraft] = useState('');

  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [pendingPathFrom, setPendingPathFrom] = useState<string | null>(null);

  const [scale, setScale] = useState(1);
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isCanvasDragging, setIsCanvasDragging] = useState(false);
  const [canvasDragAnchor, setCanvasDragAnchor] = useState<{ x: number; y: number } | null>(null);

  const [areaDraft, setAreaDraft] = useState<DraftRect | null>(null);
  const [selectDraft, setSelectDraft] = useState<DraftRect | null>(null);
  const [dragNodeId, setDragNodeId] = useState<string | null>(null);
  const [dragAreaId, setDragAreaId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ dx: number; dy: number } | null>(null);
  const [propertyCollapsed, setPropertyCollapsed] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(initialSaved?.updatedAt ?? map?.editedAt ?? nowText());

  const mapName = map?.name ?? '未命名地图';
  const mapCodeText = map?.code ?? mapCode ?? '-';
  const nodeMap = useMemo(() => new Map(scene.nodes.map((item) => [item.id, item])), [scene.nodes]);
  const selectedArea = useMemo(() => scene.areas.find((item) => item.id === selectedAreaId) ?? null, [scene.areas, selectedAreaId]);
  const selectedNodes = useMemo(() => scene.nodes.filter((n) => selectedNodeIds.includes(n.id)), [scene.nodes, selectedNodeIds]);

  const pushScene = (updater: (prev: Scene) => Scene) => {
    setScene((prev) => {
      setUndoStack((u) => [...u, prev]);
      setRedoStack([]);
      setUpdatedAt(nowText());
      return updater(prev);
    });
  };

  const toWorld = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const p = svg.createSVGPoint();
    p.x = clientX;
    p.y = clientY;
    const local = p.matrixTransform(ctm.inverse());
    return { x: (local.x - offset.x) / scale, y: (local.y - offset.y) / scale };
  };

  const addNode = (x: number, y: number) => {
    const id = `n-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    pushScene((prev) => ({
      ...prev,
      nodes: [...prev.nodes, { id, x: round5(x), y: round5(y), type: pointType }],
    }));
    setSelectedNodeIds([id]);
    setSelectedAreaId(null);
  };

  const addPath = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    pushScene((prev) => {
      if (prev.edges.some((edge) => edgeKey(edge.from, edge.to) === edgeKey(fromId, toId))) {
        messageApi.warning('路径已存在');
        return prev;
      }
      return { ...prev, edges: [...prev.edges, { id: `e-${Date.now()}`, from: fromId, to: toId }] };
    });
  };

  const deleteSelected = () => {
    if (selectedAreaId) {
      pushScene((prev) => ({ ...prev, areas: prev.areas.filter((a) => a.id !== selectedAreaId) }));
      setSelectedAreaId(null);
      return;
    }
    if (!selectedNodeIds.length) return;
    const selected = new Set(selectedNodeIds);
    pushScene((prev) => ({
      ...prev,
      nodes: prev.nodes.filter((node) => !selected.has(node.id)),
      edges: prev.edges.filter((edge) => !selected.has(edge.from) && !selected.has(edge.to)),
    }));
    setSelectedNodeIds([]);
  };

  const updateSelectedArea = (patch: Partial<Area>) => {
    if (!selectedAreaId) return;
    pushScene((prev) => ({
      ...prev,
      areas: prev.areas.map((area) => (area.id === selectedAreaId ? { ...area, ...patch } : area)),
    }));
  };

  const undo = () => {
    if (!undoStack.length) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((u) => u.slice(0, -1));
    setRedoStack((r) => [...r, scene]);
    setScene(prev);
  };

  const redo = () => {
    if (!redoStack.length) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((r) => r.slice(0, -1));
    setUndoStack((u) => [...u, scene]);
    setScene(next);
  };

  const saveAndExit = () => {
    const savedAt = nowText();
    saveSceneState(mapCode, scene, savedAt);
    setUpdatedAt(savedAt);
    messageApi.success('保存成功');
    navigate('/deployConfig/scene/mapManage');
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete') deleteSelected();
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [scene, undoStack, redoStack, selectedAreaId, selectedNodeIds]);

  useEffect(() => {
    document.body.classList.toggle('map-editor-fullscreen', fullscreen);
    return () => document.body.classList.remove('map-editor-fullscreen');
  }, [fullscreen]);

  useEffect(() => {
    const saved = loadSavedState(mapCode);
    if (saved) {
      setScene(saved.scene);
      setUpdatedAt(saved.updatedAt);
    } else {
      setScene(createInitialScene());
      setUpdatedAt(map?.editedAt ?? nowText());
    }
    setUndoStack([]);
    setRedoStack([]);
    setSelectedNodeIds([]);
    setSelectedAreaId(null);
  }, [mapCode, map?.editedAt]);

  return (
    <div style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {contextHolder}
      {!fullscreen && (
        <div style={{ marginBottom: 10 }}>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/deployConfig/scene/mapManage')}>
              返回列表
            </Button>
            <Typography.Text type="secondary">地图编辑器</Typography.Text>
            <Typography.Text strong>{mapName}</Typography.Text>
            <Button
              icon={<SaveOutlined />}
              type="primary"
              style={{ background: '#2fad62', borderColor: '#2fad62' }}
              onClick={saveAndExit}
            >
              保存并退出
            </Button>
          </Space>
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, display: 'flex', border: '1px solid #d9d9d9', background: '#f3f4f6' }}>
        <div
          style={{
            width: 64,
            borderRight: '1px solid #d9d9d9',
            background: '#f3f4f6',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            paddingTop: 8,
          }}
        >
          <Tooltip title="选择" placement="right">
            <Button type={tool === 'select' ? 'primary' : 'text'} shape="circle" icon={<AimOutlined />} onClick={() => setTool('select')} />
          </Tooltip>
          <Tooltip title="撤销" placement="right">
            <Button type="text" shape="circle" icon={<UndoOutlined />} onClick={undo} />
          </Tooltip>
          <Tooltip title="重做" placement="right">
            <Button type="text" shape="circle" icon={<RedoOutlined />} onClick={redo} />
          </Tooltip>
          <Tooltip title="删除选中" placement="right">
            <Button type="text" shape="circle" icon={<DeleteOutlined />} onClick={deleteSelected} />
          </Tooltip>
          <Tooltip title={fullscreen ? '收缩画布' : '画布全屏'} placement="right">
            <Button
              type="text"
              shape="circle"
              icon={fullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={() => setFullscreen((prev) => !prev)}
            />
          </Tooltip>
          <Tooltip title="新增点位" placement="right">
            <Button type={tool === 'point' ? 'primary' : 'text'} shape="circle" icon={<EnvironmentOutlined />} onClick={() => setTool('point')} />
          </Tooltip>
          <Tooltip title="绘制路径" placement="right">
            <Button type={tool === 'path' ? 'primary' : 'text'} shape="circle" icon={<ApartmentOutlined />} onClick={() => setTool('path')} />
          </Tooltip>
          <Tooltip title="新增区域" placement="right">
            <Button type={tool === 'area' ? 'primary' : 'text'} shape="circle" icon={<BorderOutlined />} onClick={() => setTool('area')} />
          </Tooltip>
        </div>

        <div style={{ flex: 1, minWidth: 0, position: 'relative', overflow: 'hidden' }}>
          {(tool === 'point' || tool === 'area') && (
            <div
              style={{
                position: 'absolute',
                top: 14,
                left: 14,
                zIndex: 6,
                background: '#fff',
                border: '1px solid #d9d9d9',
                borderRadius: 8,
                padding: 10,
              }}
            >
              {tool === 'point' && (
                <Space wrap>
                  {(Object.keys(pointTypeLabels) as PointType[]).map((k) => (
                    <Button key={k} size="small" type={pointType === k ? 'primary' : 'default'} onClick={() => setPointType(k)}>
                      {pointTypeLabels[k]}
                    </Button>
                  ))}
                </Space>
              )}
              {tool === 'area' && (
                <Space wrap>
                  <Select
                    size="small"
                    style={{ width: 120 }}
                    value={areaType}
                    onChange={setAreaType}
                    options={(Object.keys(areaTypeLabels) as AreaType[]).map((k) => ({ value: k, label: areaTypeLabels[k] }))}
                  />
                  <Input
                    size="small"
                    style={{ width: 180 }}
                    placeholder="区域名称(可选)"
                    value={areaNameDraft}
                    onChange={(e) => setAreaNameDraft(e.target.value)}
                  />
                </Space>
              )}
            </div>
          )}

          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
              style={{
                display: 'block',
                cursor: isCanvasDragging ? 'grabbing' : tool === 'point' ? 'crosshair' : 'default',
                transform: `scale(${canvasZoom})`,
                transformOrigin: 'center center',
              }}
              onWheel={(event) => {
                event.preventDefault();
                setScale((prev) => clamp(Number((prev + (event.deltaY < 0 ? 0.1 : -0.1)).toFixed(2)), 0.5, 3));
              }}
              onMouseDown={(event) => {
              const world = toWorld(event.clientX, event.clientY);
              if (!world) return;

              if (event.ctrlKey && event.button === 0) {
                setIsCanvasDragging(true);
                setCanvasDragAnchor({ x: event.clientX, y: event.clientY });
                return;
              }

              if (tool === 'area') {
                setAreaDraft({ x1: world.x, y1: world.y, x2: world.x, y2: world.y });
                setSelectedNodeIds([]);
                setSelectedAreaId(null);
                return;
              }

              if (tool === 'select') {
                const hit = scene.areas.find((a) => pointInArea(a, world.x, world.y));
                if (hit) {
                  setSelectedAreaId(hit.id);
                  setSelectedNodeIds([]);
                  setDragAreaId(hit.id);
                  setDragOffset({ dx: world.x - hit.x, dy: world.y - hit.y });
                  return;
                }
                setSelectedAreaId(null);
                setSelectDraft({ x1: world.x, y1: world.y, x2: world.x, y2: world.y });
                return;
              }

              if (tool === 'point') addNode(world.x, world.y);
            }}
              onMouseMove={(event) => {
              const world = toWorld(event.clientX, event.clientY);
              if (!world) return;

              if (isCanvasDragging && canvasDragAnchor) {
                const dx = event.clientX - canvasDragAnchor.x;
                const dy = event.clientY - canvasDragAnchor.y;
                setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
                setCanvasDragAnchor({ x: event.clientX, y: event.clientY });
              }

              if (areaDraft) setAreaDraft((prev) => (prev ? { ...prev, x2: world.x, y2: world.y } : prev));
              if (selectDraft) setSelectDraft((prev) => (prev ? { ...prev, x2: world.x, y2: world.y } : prev));

              if (dragNodeId && dragOffset) {
                setScene((prev) => ({
                  ...prev,
                  nodes: prev.nodes.map((node) =>
                    node.id === dragNodeId ? { ...node, x: round5(world.x - dragOffset.dx), y: round5(world.y - dragOffset.dy) } : node,
                  ),
                }));
              }

              if (dragAreaId && dragOffset) {
                setScene((prev) => ({
                  ...prev,
                  areas: prev.areas.map((area) =>
                    area.id === dragAreaId ? { ...area, x: round5(world.x - dragOffset.dx), y: round5(world.y - dragOffset.dy) } : area,
                  ),
                }));
              }
            }}
              onMouseUp={() => {
              if (isCanvasDragging) {
                setIsCanvasDragging(false);
                setCanvasDragAnchor(null);
              }

              if (dragNodeId || dragAreaId) {
                setDragNodeId(null);
                setDragAreaId(null);
                setDragOffset(null);
                setUpdatedAt(nowText());
              }

              if (areaDraft) {
                const width = Math.abs(areaDraft.x2 - areaDraft.x1);
                const height = Math.abs(areaDraft.y2 - areaDraft.y1);
                if (width >= 10 && height >= 10) {
                  const areaId = `a-${Date.now()}`;
                  pushScene((prev) => ({
                    ...prev,
                    areas: [
                      ...prev.areas,
                      {
                        id: areaId,
                        name: areaNameDraft.trim() || `区域${prev.areas.length + 1}`,
                        type: areaType,
                        x: Math.min(areaDraft.x1, areaDraft.x2),
                        y: Math.min(areaDraft.y1, areaDraft.y2),
                        width,
                        height,
                      },
                    ],
                  }));
                  setSelectedAreaId(areaId);
                  setAreaNameDraft('');
                }
                setAreaDraft(null);
              }

              if (selectDraft) {
                setSelectedNodeIds(scene.nodes.filter((node) => pointInRect(selectDraft, node.x, node.y)).map((node) => node.id));
                setSelectDraft(null);
              }
            }}
            >
              <g transform={`translate(${offset.x} ${offset.y}) scale(${scale})`}>
              {scene.areas.map((area) => {
                const style = areaTypeStyles[area.type];
                const selected = area.id === selectedAreaId;
                return (
                  <g key={area.id}>
                    <rect
                      x={area.x}
                      y={area.y}
                      width={area.width}
                      height={area.height}
                      fill={style.fill}
                      stroke={selected ? '#2f56d3' : style.stroke}
                      strokeWidth={selected ? 2 : 1}
                      strokeDasharray="6 4"
                    />
                    <text
                      x={area.x + area.width / 2}
                      y={area.y + 20}
                      textAnchor="middle"
                      fontSize={12}
                      fill="#2f3a4a"
                      style={{ userSelect: 'none' }}
                    >
                      {area.name}
                    </text>
                  </g>
                );
              })}

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
                if (!from || !to) return null;
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
                    onMouseDown={(event) => {
                      event.stopPropagation();
                      if (tool !== 'select') return;
                      const world = toWorld(event.clientX, event.clientY);
                      if (!world) return;
                      setSelectedNodeIds(event.shiftKey ? Array.from(new Set([...selectedNodeIds, node.id])) : [node.id]);
                      setSelectedAreaId(null);
                      setDragNodeId(node.id);
                      setDragOffset({ dx: world.x - node.x, dy: world.y - node.y });
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (tool === 'path') {
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
                      setSelectedAreaId(null);
                    }}
                  />
                );
              })}
              </g>
            </svg>
          </div>
        </div>

        <div style={{ width: 28, borderLeft: '1px solid #d9d9d9', background: '#f8f8f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Tooltip title={propertyCollapsed ? '展开属性栏' : '收起属性栏'} placement="left">
            <Button
              type="text"
              shape="circle"
              icon={propertyCollapsed ? <CaretLeftOutlined /> : <CaretRightOutlined />}
              onClick={() => setPropertyCollapsed((prev) => !prev)}
            />
          </Tooltip>
        </div>

        <div
          style={{
            width: propertyCollapsed ? 0 : 320,
            borderLeft: propertyCollapsed ? 'none' : '1px solid #d9d9d9',
            background: '#f8f8f9',
            padding: propertyCollapsed ? 0 : 12,
            overflow: 'hidden',
            transition: 'width 0.2s ease, padding 0.2s ease',
          }}
        >
          {!propertyCollapsed && (
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Typography.Text style={{ display: 'block', marginBottom: 2, fontWeight: 600, color: '#355db8' }}>地图属性</Typography.Text>

              <div>
                <Typography.Text style={{ fontSize: 13 }}>地图编码</Typography.Text>
                <Input value={mapCodeText} readOnly />
              </div>
              <div>
                <Typography.Text style={{ fontSize: 13 }}>地图名称</Typography.Text>
                <Input value={mapName} readOnly />
              </div>
              <div>
                <Typography.Text style={{ fontSize: 13 }}>编辑时间</Typography.Text>
                <Input value={updatedAt} readOnly />
              </div>
              <div>
                <Typography.Text style={{ fontSize: 13 }}>节点 / 路径 / 区域</Typography.Text>
                <Input value={`${scene.nodes.length} / ${scene.edges.length} / ${scene.areas.length}`} readOnly />
              </div>

              <Typography.Text style={{ display: 'block', marginBottom: 2, fontWeight: 600, color: '#355db8' }}>选中节点</Typography.Text>
              <div>
                <Typography.Text style={{ fontSize: 13 }}>数量</Typography.Text>
                <Input value={String(selectedNodes.length)} readOnly />
              </div>
              <div>
                <Typography.Text style={{ fontSize: 13 }}>明细</Typography.Text>
                <Input.TextArea
                  rows={4}
                  value={
                    selectedNodes.length
                      ? selectedNodes.map((node) => `${node.id} (${Math.round(node.x)}, ${Math.round(node.y)})`).join('\n')
                      : '未选中节点'
                  }
                  readOnly
                />
              </div>

              <Typography.Text style={{ display: 'block', marginBottom: 2, fontWeight: 600, color: '#355db8' }}>选中区域</Typography.Text>
              <div>
                <Typography.Text style={{ fontSize: 13 }}>区域ID</Typography.Text>
                <Input value={selectedArea?.id ?? '未选中区域'} readOnly />
              </div>
              {selectedArea && (
                <>
                  <div>
                    <Typography.Text style={{ fontSize: 13 }}>区域名称</Typography.Text>
                    <Input value={selectedArea.name} onChange={(event) => updateSelectedArea({ name: event.target.value })} />
                  </div>
                  <div>
                    <Typography.Text style={{ fontSize: 13 }}>区域类型</Typography.Text>
                    <Select
                      style={{ width: '100%' }}
                      value={selectedArea.type}
                      onChange={(value) => updateSelectedArea({ type: value })}
                      options={(Object.keys(areaTypeLabels) as AreaType[]).map((key) => ({ value: key, label: areaTypeLabels[key] }))}
                    />
                  </div>
                  <div>
                    <Typography.Text style={{ fontSize: 13 }}>坐标</Typography.Text>
                    <Input value={`x:${Math.round(selectedArea.x)} y:${Math.round(selectedArea.y)}`} readOnly />
                  </div>
                  <div>
                    <Typography.Text style={{ fontSize: 13 }}>尺寸</Typography.Text>
                    <Input value={`w:${Math.round(selectedArea.width)} h:${Math.round(selectedArea.height)}`} readOnly />
                  </div>
                </>
              )}
            </Space>
          )}
        </div>
      </div>
    </div>
  );
}
