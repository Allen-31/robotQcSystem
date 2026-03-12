import { ClockCircleOutlined, EyeOutlined, PauseCircleOutlined, SearchOutlined, ThunderboltOutlined, UnorderedListOutlined, WalletOutlined } from '@ant-design/icons';
import { Button, Card, Input, Select, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';

type LinkStatus = 'online' | 'unconnected' | 'offline';
type WorkStatus = 'idle' | 'working';
type ExceptionStatus = 'normal' | 'abnormal';
type LocateStatus = 'located' | 'unlocated';
type ControlMode = 'manual' | 'auto';

interface MonitorRobot {
  id: string;
  code: string;
  link: LinkStatus;
  work: WorkStatus;
  exception: ExceptionStatus;
  locate: LocateStatus;
  control: ControlMode;
  battery: number;
  x: number;
  y: number;
  angle: number;
  speed: number;
  ip: string;
  point: string;
  task: string;
  alarms: string[];
}

const mapOptions = ['Map01', 'Map02', 'Map03'];

const robotIdsForDetail = ['RB-001', 'RB-002', 'RB-003'];
const robots: MonitorRobot[] = Array.from({ length: 30 }).map((_, idx) => {
  const n = idx + 1;
  const code = `RB-${String(n).padStart(3, '0')}`;
  const id = idx < robotIdsForDetail.length ? robotIdsForDetail[idx] : String(n);
  const link: LinkStatus = n % 9 === 0 ? 'offline' : n % 4 === 0 ? 'unconnected' : 'online';
  const exception: ExceptionStatus = n % 5 === 0 ? 'abnormal' : 'normal';
  return {
    id,
    code,
    link,
    work: n % 3 === 0 ? 'working' : 'idle',
    exception,
    locate: n % 6 === 0 ? 'unlocated' : 'located',
    control: n % 2 === 0 ? 'manual' : 'auto',
    battery: n % 7 === 0 ? 18 : 60 + (n % 6) * 6,
    x: 140 + (idx % 10) * 90,
    y: 120 + Math.floor(idx / 10) * 150,
    angle: 120 + (n % 20),
    speed: Number((0.8 + (n % 5) * 0.25).toFixed(2)),
    ip: `192.168.10.${100 + n}`,
    point: `mapname_p_${12 + n}`,
    task: n % 2 === 0 ? 'Robot Picking Task' : 'Robot Inspection Task',
    alarms: exception === 'abnormal' ? [`10002${n % 10} QR code docking failed`, `10003${n % 10} emergency stop`] : [],
  };
});

export function OperationMonitoringPage() {
  const navigate = useNavigate();
  const { locale, t } = useI18n();
  const [selectedMap, setSelectedMap] = useState(mapOptions[0]);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unconnected' | 'offline' | 'abnormal' | 'lowBattery'>('all');
  const [selectedRobotId, setSelectedRobotId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; robotId: string } | null>(null);
  const [activeLeftMenu, setActiveLeftMenu] = useState<'list' | 'task' | 'history'>('list');
  const [listOpen, setListOpen] = useState(true);
  const [viewportHeight, setViewportHeight] = useState<number>(window.innerHeight);
  const [viewportWidth, setViewportWidth] = useState<number>(window.innerWidth);
  const [listContainerHeight, setListContainerHeight] = useState<number>(0);
  const [mapScale, setMapScale] = useState(1);
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  const [isMapPanning, setIsMapPanning] = useState(false);
  const [mapPanStart, setMapPanStart] = useState<{ x: number; y: number } | null>(null);
  const [mapDidPan, setMapDidPan] = useState(false);
  const mapPanelRef = useRef<HTMLDivElement | null>(null);
  const listContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onResize = () => {
      setViewportHeight(window.innerHeight);
      setViewportWidth(window.innerWidth);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!listOpen || !listContainerRef.current) {
      return;
    }
    const el = listContainerRef.current;
    const update = () => setListContainerHeight(el.clientHeight);
    update();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }
    const observer = new ResizeObserver(() => update());
    observer.observe(el);
    return () => observer.disconnect();
  }, [listOpen]);

  const onLeftMenuClick = (menu: 'list' | 'task' | 'history') => {
    if (menu === 'list') {
      if (activeLeftMenu === 'list') {
        setListOpen((prev) => !prev);
      } else {
        setActiveLeftMenu('list');
        setListOpen(true);
      }
      return;
    }
    setActiveLeftMenu(menu);
    setListOpen(false);
  };

  const label = useMemo(() => {
    if (locale === 'en-US') {
      return {
        all: 'All',
        unconnected: 'Unconnected',
        offline: 'Offline',
        abnormal: 'Abnormal',
        lowBattery: 'Low Battery',
        map: 'Map',
        search: 'Search...',
        pause: 'Pause',
        code: 'Code',
        link: 'Link',
        work: 'Work',
        exception: 'Exception',
        locate: 'Locate',
        control: 'Control',
        battery: 'Battery',
        online: 'Online',
        disconnected: 'Unconnected',
        idle: 'Idle',
        working: 'Working',
        normal: 'Normal',
        abnormalText: 'Abnormal',
        located: 'Located',
        unlocated: 'Unlocated',
        manual: 'Manual',
        auto: 'Auto',
        detail: 'Detail',
        executeTask: 'Execute Task',
        relocate: 'Relocate',
        switchMap: 'Switch Map',
        manualDispatch: 'Manual Dispatch',
        manualControl: 'Manual Control',
        startCharge: 'Start Charge',
        startHoming: 'Start Homing',
        stop: 'Stop',
        reset: 'Reset',
        qualityDesk: 'Quality Desk',
        point: 'Point',
        coord: 'Coord',
        angle: 'Angle',
        speed: 'Speed',
        type: 'Type',
        group: 'Group',
        ip: 'IP',
        alarmContent: 'Alarm Logs',
        task: 'Task',
        cancel: 'Cancel',
        taskDetail: 'Detail',
        robotStats: 'Robots',
        onlineStats: 'Online',
        offlineStats: 'Offline',
        abnormalStats: 'Abnormal',
        lowBatteryStats: 'Low Battery',
        taskStats: 'Tasks',
        runningStats: 'Running',
        exceptionStats: 'Exception',
      };
    }
    return {
      all: '全部',
      unconnected: '未连接',
      offline: '离线',
      abnormal: '异常',
      lowBattery: '低电量',
      map: '地图',
      search: '搜索...',
      pause: '暂停',
      code: '编码',
      link: '连接',
      work: '工作',
      exception: '异常',
      locate: '定位',
      control: '控制',
      battery: '电量',
      online: '在线',
      disconnected: '未连接',
      idle: '空闲',
      working: '工作中',
      normal: '正常',
      abnormalText: '异常',
      located: '已定位',
      unlocated: '未定位',
      manual: '手动控制',
      auto: '自动调度',
      detail: '详情',
      executeTask: '执行任务',
      relocate: '重定位',
      switchMap: '切换地图',
      manualDispatch: '手动调度',
      manualControl: '手动控制',
      startCharge: '开启充电',
      startHoming: '开启泊车',
      stop: '暂停',
      reset: '复位',
      qualityDesk: '质检台',
      point: '点位',
      coord: '坐标',
      angle: '角度',
      speed: '速度',
      type: '类型',
      group: '分组',
      ip: 'IP',
      alarmContent: '异常日志内容',
      task: '任务',
      cancel: '取消',
      taskDetail: '详情',
      robotStats: '机器人',
      onlineStats: '在线',
      offlineStats: '离线',
      abnormalStats: '异常',
      lowBatteryStats: '低电量',
      taskStats: '任务',
      runningStats: '执行中',
      exceptionStats: '异常',
    };
  }, [locale]);

  const baseFiltered = useMemo(() => {
    const key = keyword.trim().toLowerCase();
    return robots.filter((r) => {
      if (key && !`${r.code} ${r.ip} ${r.point}`.toLowerCase().includes(key)) {
        return false;
      }
      return true;
    });
  }, [keyword]);

  const filtered = useMemo(() => {
    return baseFiltered.filter((r) => {
      if (activeFilter === 'unconnected') {
        return r.link === 'unconnected';
      }
      if (activeFilter === 'offline') {
        return r.link === 'offline';
      }
      if (activeFilter === 'abnormal') {
        return r.exception === 'abnormal';
      }
      if (activeFilter === 'lowBattery') {
        return r.battery < 30;
      }
      return true;
    });
  }, [activeFilter, baseFiltered]);

  const selectedRobot = useMemo(() => robots.find((item) => item.id === selectedRobotId) ?? null, [selectedRobotId]);
  const mapPointToScreen = (x: number, y: number) => ({
    x: x * mapScale + mapOffset.x,
    y: y * mapScale + mapOffset.y,
  });

  const selectedRobotPopupPosition = useMemo(() => {
    if (!selectedRobot) {
      return null;
    }
    const panelWidth = mapPanelRef.current?.clientWidth ?? 1200;
    const panelHeight = mapPanelRef.current?.clientHeight ?? 700;
    const popupWidth = 420;
    const popupHeight = 290;
    const robotScreenPoint = mapPointToScreen(selectedRobot.x, selectedRobot.y);

    let left = robotScreenPoint.x + 56;
    let top = robotScreenPoint.y - 10;

    if (left + popupWidth > panelWidth - 12) {
      left = robotScreenPoint.x - popupWidth - 18;
    }
    if (left < 12) {
      left = 12;
    }
    if (top + popupHeight > panelHeight - 12) {
      top = panelHeight - popupHeight - 12;
    }
    if (top < 12) {
      top = 12;
    }

    return { left, top };
  }, [mapOffset.x, mapOffset.y, mapScale, selectedRobot]);

  const summary = useMemo(() => {
    return {
      all: baseFiltered.length,
      unconnected: baseFiltered.filter((r) => r.link === 'unconnected').length,
      offline: baseFiltered.filter((r) => r.link === 'offline').length,
      abnormal: baseFiltered.filter((r) => r.exception === 'abnormal').length,
      lowBattery: baseFiltered.filter((r) => r.battery < 30).length,
      runningTask: filtered.filter((r) => r.work === 'working').length,
    };
  }, [baseFiltered, filtered]);

  const columns: ColumnsType<MonitorRobot> = [
    { title: label.code, dataIndex: 'id', key: 'id', width: 64 },
    { title: label.link, dataIndex: 'link', key: 'link', width: 90, render: (v: LinkStatus) => (v === 'online' ? label.online : label.disconnected) },
    { title: label.work, dataIndex: 'work', key: 'work', width: 84, render: (v: WorkStatus) => (v === 'working' ? label.working : label.idle) },
    { title: label.exception, dataIndex: 'exception', key: 'exception', width: 80, render: (v: ExceptionStatus) => <span style={{ color: v === 'abnormal' ? '#ef4444' : '#16a34a' }}>{v === 'abnormal' ? label.abnormalText : label.normal}</span> },
    { title: label.locate, dataIndex: 'locate', key: 'locate', width: 88, render: (v: LocateStatus) => (v === 'located' ? label.located : label.unlocated) },
    { title: label.control, dataIndex: 'control', key: 'control', width: 100, render: (v: ControlMode) => (v === 'manual' ? label.manual : label.auto) },
    { title: label.battery, dataIndex: 'battery', key: 'battery', width: 70, render: (v: number) => `${v}%` },
  ];
  const robotActionItems = [
    label.executeTask,
    label.relocate,
    label.switchMap,
    label.manualDispatch,
    label.manualControl,
    label.startCharge,
    label.startHoming,
  ];
  const primaryActionItems = new Set([label.executeTask, label.startCharge, label.startHoming]);
  const dangerActionItems = new Set<string>();

  const topNavHeight = viewportWidth >= 1600 ? 64 : 56;
  const pageHeight = Math.max(520, viewportHeight - topNavHeight);
  const listScrollY = Math.max(260, (listContainerHeight || pageHeight - 190) - 56);
  const onMapMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !event.ctrlKey || mapScale <= 1) {
      return;
    }
    event.preventDefault();
    setIsMapPanning(true);
    setMapPanStart({ x: event.clientX, y: event.clientY });
  };
  const onMapMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isMapPanning || !mapPanStart) {
      return;
    }
    const dx = event.clientX - mapPanStart.x;
    const dy = event.clientY - mapPanStart.y;
    if (!mapDidPan && (dx !== 0 || dy !== 0)) {
      setMapDidPan(true);
    }
    setMapPanStart({ x: event.clientX, y: event.clientY });
    setMapOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  };
  const onMapMouseUp = () => {
    setIsMapPanning(false);
    setMapPanStart(null);
  };
  const zoomInMap = () => setMapScale((prev) => Number(Math.min(2.5, prev + 0.2).toFixed(2)));
  const zoomOutMap = () => setMapScale((prev) => Number(Math.max(1, prev - 0.2).toFixed(2)));
  const resetMapZoom = () => {
    setMapScale(1);
    setMapOffset({ x: 0, y: 0 });
  };

  const filterItem = (key: 'all' | 'unconnected' | 'offline' | 'abnormal' | 'lowBattery', text: string, color: string, count: number) => (
    <Button
      key={key}
      type="text"
      size="small"
      onClick={() => setActiveFilter(key)}
      style={{ color, fontWeight: activeFilter === key ? 700 : 400, paddingInline: 4 }}
    >
      {text} {count}
    </Button>
  );

  return (
    <div
      onClick={() => setContextMenu(null)}
      style={{ height: pageHeight, display: 'grid', gridTemplateRows: 'auto minmax(0,1fr) auto', gap: 0, overflow: 'hidden' }}
    >
      <Card bodyStyle={{ padding: 10 }} style={{ borderRadius: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <Space size={12}>
            {filterItem('all', label.all, '#1677ff', summary.all)}
            {filterItem('unconnected', label.unconnected, '#f97316', summary.unconnected)}
            {filterItem('offline', label.offline, '#6b7280', summary.offline)}
            {filterItem('abnormal', label.abnormal, '#ef4444', summary.abnormal)}
            {filterItem('lowBattery', label.lowBattery, '#d97706', summary.lowBattery)}
          </Space>
          <Space wrap>
            <Typography.Text>{label.map}</Typography.Text>
            <Select value={selectedMap} options={mapOptions.map((v) => ({ label: v, value: v }))} onChange={setSelectedMap} style={{ width: 120 }} />
            <Select value={pageSize} options={[10, 20, 30].map((v) => ({ label: v, value: v }))} onChange={setPageSize} style={{ width: 90 }} />
            <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder={label.search} prefix={<SearchOutlined />} style={{ width: 280 }} />
            <Button icon={<PauseCircleOutlined />}>{label.pause}</Button>
          </Space>
        </div>
      </Card>

      <div
        style={{
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: listOpen ? '56px 430px 1fr' : '56px 1fr',
          gap: 0,
          overflow: 'hidden',
        }}
      >
        <Card bodyStyle={{ padding: 8, height: '100%' }} style={{ borderRadius: 0 }}>
          <Space direction="vertical" size={12} style={{ width: '100%', alignItems: 'center' }}>
            <Button
              type={activeLeftMenu === 'list' ? 'primary' : 'text'}
              icon={<UnorderedListOutlined />}
              onClick={() => onLeftMenuClick('list')}
              title={locale === 'en-US' ? 'Robot List' : '机器人列表'}
            />
            <Button
              type={activeLeftMenu === 'task' ? 'primary' : 'text'}
              icon={<WalletOutlined />}
              onClick={() => onLeftMenuClick('task')}
              title={locale === 'en-US' ? 'Task Panel' : '任务面板'}
            />
            <Button
              type={activeLeftMenu === 'history' ? 'primary' : 'text'}
              icon={<ClockCircleOutlined />}
              onClick={() => onLeftMenuClick('history')}
              title={locale === 'en-US' ? 'History Panel' : '历史面板'}
            />
          </Space>
        </Card>

        {listOpen ? (
          <Card bodyStyle={{ padding: 0, height: '100%', overflow: 'hidden' }} style={{ borderRadius: 0 }}>
            <div ref={listContainerRef} style={{ height: '100%' }}>
              <Table
                rowKey="id"
                size="middle"
                columns={columns}
                dataSource={filtered}
                pagination={false}
                onRow={(record) => ({ onClick: () => setSelectedRobotId(record.id) })}
                scroll={{ y: listScrollY }}
                style={{ height: '100%' }}
                rowClassName={() => 'operation-monitor-row'}
                className="operation-monitor-list-table"
              />
            </div>
          </Card>
        ) : null}

        <Card
          bodyStyle={{ padding: 0, height: '100%', overflow: 'hidden' }}
          style={{ borderRadius: 0, height: '100%' }}
        >
          <div
            ref={mapPanelRef}
            style={{ position: 'relative', height: '100%', background: '#c8ced8', overflow: 'hidden' }}
            onClick={() => {
              if (mapDidPan) {
                setMapDidPan(false);
                return;
              }
              setContextMenu(null);
              setSelectedRobotId(null);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu(null);
            }}
            onMouseDown={onMapMouseDown}
            onMouseMove={onMapMouseMove}
            onMouseUp={onMapMouseUp}
            onMouseLeave={onMapMouseUp}
          >
            <div style={{ position: 'absolute', right: 12, top: 12, zIndex: 20 }}>
              <Space size={6}>
                <Button size="small" onClick={zoomOutMap} disabled={mapScale <= 1}>
                  -
                </Button>
                <Button size="small" onClick={zoomInMap} disabled={mapScale >= 2.5}>
                  +
                </Button>
                <Button size="small" onClick={resetMapZoom} disabled={mapScale === 1 && mapOffset.x === 0 && mapOffset.y === 0}>
                  {label.reset}
                </Button>
                <Typography.Text style={{ color: '#1f2937', background: 'rgba(255,255,255,.8)', padding: '0 6px', borderRadius: 4 }}>
                  {Math.round(mapScale * 100)}%
                </Typography.Text>
              </Space>
            </div>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                transform: `translate(${mapOffset.x}px, ${mapOffset.y}px) scale(${mapScale})`,
                transformOrigin: 'left top',
                cursor: mapScale > 1 ? (isMapPanning ? 'grabbing' : 'grab') : 'default',
              }}
            >
              <div style={{ position: 'absolute', left: 220, top: 90, width: 500, height: 120, borderRadius: 10, background: '#d7dde5', display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <span key={`s1-${i}`} style={{ width: 18, height: 18, background: '#78879a', display: 'inline-block' }} />
                ))}
              </div>
              <div style={{ position: 'absolute', left: 380, top: 300, width: 230, height: 58, background: '#aeb8c4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1f2937' }}>
                {label.qualityDesk}
              </div>
              <div style={{ position: 'absolute', left: 500, top: 560, width: 660, height: 180, borderRadius: 10, background: '#d7dde5', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-around', paddingTop: 12 }}>
                {Array.from({ length: 9 }).map((_, i) => (
                  <span key={`s2-${i}`} style={{ width: 18, height: 18, background: '#78879a', display: 'inline-block' }} />
                ))}
              </div>

              {filtered.map((robot) => {
                const bg = robot.exception === 'abnormal' ? '#ef4444' : robot.link === 'unconnected' || robot.link === 'offline' ? '#fb923c' : '#22c55e';
                return (
                  <div
                    key={robot.id}
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRobotId(robot.id);
                      setContextMenu(null);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const panelWidth = mapPanelRef.current?.clientWidth ?? 1200;
                      const panelHeight = mapPanelRef.current?.clientHeight ?? 700;
                      const menuWidth = 180;
                      const menuHeight = 410;
                      const robotScreenPoint = mapPointToScreen(robot.x, robot.y);
                      let x = robotScreenPoint.x + 52;
                      let y = robotScreenPoint.y + 6;
                      if (x + menuWidth > panelWidth - 8) {
                        x = robotScreenPoint.x - menuWidth - 10;
                      }
                      if (x < 8) {
                        x = 8;
                      }
                      if (y + menuHeight > panelHeight - 8) {
                        y = panelHeight - menuHeight - 8;
                      }
                      if (y < 8) {
                        y = 8;
                      }
                      setSelectedRobotId(null);
                      setContextMenu({ x, y, robotId: robot.id });
                    }}
                    style={{
                      position: 'absolute',
                      left: robot.x,
                      top: robot.y,
                      width: 42,
                      height: 42,
                      borderRadius: 10,
                      background: bg,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: selectedRobotId === robot.id ? '0 0 0 4px rgba(37,99,235,.2)' : 'none',
                    }}
                  >
                    {robot.id}
                  </div>
                );
              })}
            </div>

            {contextMenu ? (
              <div
                style={{
                  position: 'absolute',
                  left: contextMenu.x,
                  top: contextMenu.y,
                  width: 180,
                  borderRadius: 10,
                  background: '#162338',
                  color: '#cbd5e1',
                  overflow: 'hidden',
                  boxShadow: '0 10px 24px rgba(2,6,23,.3)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ padding: '8px 12px', color: '#f59e0b', fontWeight: 600 }}>{locale === 'en-US' ? 'Context Menu' : '右键菜单'}</div>
                {robotActionItems.map((item) => (
                  <div key={item} style={{ padding: '10px 14px', borderTop: '1px solid rgba(148,163,184,.15)', cursor: 'pointer' }}>
                    {item}
                  </div>
                ))}
              </div>
            ) : null}

            {selectedRobot && selectedRobotPopupPosition && !contextMenu ? (
              <Card
                size="small"
                bodyStyle={{ padding: 12 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  left: selectedRobotPopupPosition.left,
                  top: selectedRobotPopupPosition.top,
                  width: 420,
                  background: 'rgba(255,255,255,.95)',
                  border: '1px solid #d1d5db',
                }}
              >
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                      <Typography.Text strong>{`机器人${selectedRobot.id}`}</Typography.Text>
                      <Tag color={selectedRobot.battery < 30 ? 'error' : 'success'}>{`🔋 ${selectedRobot.battery}%`}</Tag>
                    </Space>
                    <Space size={4}>
                      <Tag color={selectedRobot.link === 'online' ? 'success' : 'orange'}>{selectedRobot.link === 'online' ? label.online : label.disconnected}</Tag>
                      <Tag color={selectedRobot.work === 'working' ? 'processing' : 'default'}>{selectedRobot.work === 'working' ? label.working : label.idle}</Tag>
                    </Space>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 4, columnGap: 8 }}>
                    <Typography.Text type="secondary">{`${label.point}: ${selectedRobot.point}`}</Typography.Text>
                    <Typography.Text type="secondary">{`${label.coord}: ${selectedRobot.x}, ${selectedRobot.y}`}</Typography.Text>
                    <Typography.Text type="secondary">{`${label.angle}: ${selectedRobot.angle}`}</Typography.Text>
                    <Typography.Text type="secondary">{`${label.speed}: ${selectedRobot.speed} m/s`}</Typography.Text>
                    <Typography.Text type="secondary">{`${label.type}: AMR`}</Typography.Text>
                    <Typography.Text type="secondary">{`${label.group}: A`}</Typography.Text>
                    <Typography.Text type="secondary">{`${label.ip}: ${selectedRobot.ip}`}</Typography.Text>
                  </div>
                  {selectedRobot.alarms.length > 0 ? (
                    <div style={{ color: '#ef4444', borderTop: '1px solid #e5e7eb', paddingTop: 8 }}>
                      <Typography.Text style={{ color: '#ef4444' }}>{label.alarmContent}</Typography.Text>
                      {selectedRobot.alarms.map((alarm) => (
                        <div key={alarm}>{alarm}</div>
                      ))}
                    </div>
                  ) : null}
                  <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 8 }}>
                    <Button
                      type="link"
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => navigate(`/operationMaintenance/robot/robotManage/${selectedRobot.id}/detail`)}
                    >
                      {locale === 'en-US' ? 'View detail' : '查看详情'}
                    </Button>
                    {selectedRobot.work === 'working' ? <Typography.Text>{`${label.task}: ${selectedRobot.task}`}</Typography.Text> : null}
                    {selectedRobot.link === 'online' && selectedRobot.exception === 'normal' && selectedRobot.work === 'idle' ? (
                      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                        {robotActionItems.map((item) => (
                          <Button
                            key={item}
                            size="small"
                            type={primaryActionItems.has(item) ? 'primary' : 'default'}
                            danger={dangerActionItems.has(item)}
                            icon={primaryActionItems.has(item) ? <ThunderboltOutlined /> : undefined}
                            style={{
                              borderRadius: 999,
                              height: 32,
                              paddingInline: 14,
                              fontWeight: 500,
                              letterSpacing: '.2px',
                              boxShadow: primaryActionItems.has(item) ? '0 6px 14px rgba(37,99,235,.28)' : '0 2px 8px rgba(15,23,42,.08)',
                              borderColor: dangerActionItems.has(item) ? '#fca5a5' : '#d1d5db',
                              background: primaryActionItems.has(item) ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : '#f8fafc',
                              color: primaryActionItems.has(item) ? '#fff' : '#334155',
                            }}
                          >
                            {item}
                          </Button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </Space>
              </Card>
            ) : null}
          </div>
        </Card>
      </div>

      <div
        style={{
          flexShrink: 0,
          height: 40,
          background: '#fff',
          borderTop: '1px solid #d9d9d9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          paddingInline: 12,
          overflowX: 'auto',
          whiteSpace: 'nowrap',
        }}
      >
        <Space split={<span style={{ color: '#9ca3af' }}>|</span>} size={12}>
          <Typography.Text style={{ fontSize: 22, lineHeight: 1 }}>{label.robotStats}</Typography.Text>
          <Typography.Text style={{ fontSize: 22, lineHeight: 1, color: '#16a34a' }}>{`${label.onlineStats}${filtered.filter((r) => r.link === 'online').length}`}</Typography.Text>
          <Typography.Text style={{ fontSize: 22, lineHeight: 1, color: '#6b7280' }}>{`${label.offlineStats}${filtered.filter((r) => r.link === 'offline').length}`}</Typography.Text>
          <Typography.Text style={{ fontSize: 22, lineHeight: 1, color: '#ef4444' }}>{`${label.abnormalStats}${filtered.filter((r) => r.exception === 'abnormal').length}`}</Typography.Text>
          <Typography.Text style={{ fontSize: 22, lineHeight: 1, color: '#d97706' }}>{`${label.lowBatteryStats}${filtered.filter((r) => r.battery < 30).length}`}</Typography.Text>
        </Space>
        <span style={{ color: '#9ca3af' }}>|</span>
        <Space split={<span style={{ color: '#9ca3af' }}>|</span>} size={12}>
          <Typography.Text style={{ fontSize: 22, lineHeight: 1 }}>{label.taskStats}</Typography.Text>
          <Typography.Text style={{ fontSize: 22, lineHeight: 1 }}>{`${label.runningStats}${summary.runningTask}`}</Typography.Text>
          <Typography.Text style={{ fontSize: 22, lineHeight: 1, color: '#ef4444' }}>{`${label.exceptionStats}${filtered.filter((r) => r.exception === 'abnormal').length}`}</Typography.Text>
        </Space>
      </div>
      <style>
        {`
          .operation-monitor-row > td {
            padding-top: 14px !important;
            padding-bottom: 14px !important;
            font-size: 14px;
          }
          .operation-monitor-list-table,
          .operation-monitor-list-table .ant-spin-nested-loading,
          .operation-monitor-list-table .ant-spin-container,
          .operation-monitor-list-table .ant-table {
            height: 100%;
          }
        `}
      </style>
      <div style={{ display: 'none' }}>{t('operationMonitoring.title')}</div>
    </div>
  );
}
