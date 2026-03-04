import {
  EditOutlined,
  EyeOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  RedoOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { Button, Card, Descriptions, Input, Modal, Select, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { robotManageList, type RobotControlStatus, type RobotDispatchMode, type RobotExceptionStatus, type RobotManageRecord } from '../../../data/operationMaintenance/robotManageList';
import { useI18n } from '../../../i18n/I18nProvider';

export function RobotManagePage() {
  const { locale, t } = useI18n();
  const [messageApi, contextHolder] = message.useMessage();
  const [list, setList] = useState<RobotManageRecord[]>(robotManageList);
  const [keyword, setKeyword] = useState('');
  const [detailRecord, setDetailRecord] = useState<RobotManageRecord | null>(null);
  const [logRecord, setLogRecord] = useState<RobotManageRecord | null>(null);

  const label = useMemo(() => {
    if (locale === 'en-US') {
      return {
        search: 'Search by code, type, group, map, IP',
        online: 'Online',
        offline: 'Offline',
        running: 'Running',
        paused: 'Paused',
        auto: 'Auto',
        semiAuto: 'Semi Auto',
        manual: 'Manual',
        normal: 'Normal',
        warning: 'Warning',
        critical: 'Critical',
        detail: 'Detail',
        logs: 'Logs',
        switchMap: 'Switch Map',
        switchMode: 'Switch Dispatch',
        pauseResume: 'Pause/Resume',
        reset: 'Reset',
        switched: 'Switched successfully',
        resetDone: 'Reset command sent',
      };
    }
    return {
      search: '按编号、类型、分组、地图、IP搜索',
      online: '在线',
      offline: '离线',
      running: '运行',
      paused: '暂停',
      auto: '自动',
      semiAuto: '半自动',
      manual: '手动',
      normal: '正常',
      warning: '告警',
      critical: '严重',
      detail: '详情',
      logs: '日志',
      switchMap: '切换地图',
      switchMode: '切换调度',
      pauseResume: '暂停/恢复',
      reset: '复位',
      switched: '切换成功',
      resetDone: '已下发复位指令',
    };
  }, [locale]);

  const onlineText = (status: RobotManageRecord['onlineStatus']) => (status === 'online' ? label.online : label.offline);
  const dispatchText = (mode: RobotDispatchMode) => (mode === 'auto' ? label.auto : mode === 'semi-auto' ? label.semiAuto : label.manual);
  const controlText = (status: RobotControlStatus) => (status === 'running' ? label.running : label.paused);
  const exceptionText = (status: RobotExceptionStatus) =>
    status === 'normal' ? label.normal : status === 'warning' ? label.warning : label.critical;

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    if (!k) {
      return list;
    }
    return list.filter((item) => `${item.code} ${item.type} ${item.group} ${item.currentMap} ${item.ip}`.toLowerCase().includes(k));
  }, [keyword, list]);

  const toggleControl = (id: string) => {
    setList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, controlStatus: item.controlStatus === 'running' ? 'paused' : 'running' } : item,
      ),
    );
  };

  const columns: ColumnsType<RobotManageRecord> = [
    { title: '编号', dataIndex: 'code', key: 'code', width: 110 },
    {
      title: '在线状态',
      dataIndex: 'onlineStatus',
      key: 'onlineStatus',
      width: 100,
      render: (_, record) => <Tag color={record.onlineStatus === 'online' ? 'success' : 'default'}>{onlineText(record.onlineStatus)}</Tag>,
    },
    { title: '位置信息', dataIndex: 'location', key: 'location', width: 180 },
    { title: '电量', dataIndex: 'battery', key: 'battery', width: 80, render: (value: number) => `${value}%` },
    { title: '当前地图', dataIndex: 'currentMap', key: 'currentMap', width: 150 },
    { title: '调度模式', dataIndex: 'dispatchMode', key: 'dispatchMode', width: 120, render: (v: RobotDispatchMode) => dispatchText(v) },
    { title: '控制状态', dataIndex: 'controlStatus', key: 'controlStatus', width: 100, render: (v: RobotControlStatus) => controlText(v) },
    {
      title: '异常状态',
      dataIndex: 'exceptionStatus',
      key: 'exceptionStatus',
      width: 100,
      render: (v: RobotExceptionStatus) => <Tag color={v === 'critical' ? 'error' : v === 'warning' ? 'warning' : 'success'}>{exceptionText(v)}</Tag>,
    },
    { title: '类型', dataIndex: 'type', key: 'type', width: 160 },
    { title: '分组', dataIndex: 'group', key: 'group', width: 120 },
    { title: 'IP', dataIndex: 'ip', key: 'ip', width: 130 },
    {
      title: '操作',
      key: 'action',
      width: 410,
      fixed: 'right',
      render: (_, record) => (
        <Space size={2}>
          <Button type="link" icon={<EyeOutlined />} onClick={() => setDetailRecord(record)}>
            {label.detail}
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => setLogRecord(record)}>
            {label.logs}
          </Button>
          <Button type="link" icon={<SwapOutlined />} onClick={() => messageApi.success(label.switched)}>
            {label.switchMap}
          </Button>
          <Button type="link" icon={<SwapOutlined />} onClick={() => messageApi.success(label.switched)}>
            {label.switchMode}
          </Button>
          <Button type="link" icon={record.controlStatus === 'running' ? <PauseCircleOutlined /> : <PlayCircleOutlined />} onClick={() => toggleControl(record.id)}>
            {label.pauseResume}
          </Button>
          <Button type="link" danger icon={<RedoOutlined />} onClick={() => messageApi.warning(label.resetDone)}>
            {label.reset}
          </Button>
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
            {t('menu.robotManage')}
          </Typography.Title>
          <Input allowClear placeholder={label.search} value={keyword} onChange={(event) => setKeyword(event.target.value)} />
        </Space>
      </Card>

      <Card>
        <Table rowKey="id" columns={columns} dataSource={filtered} pagination={{ pageSize: 8, showSizeChanger: false }} scroll={{ x: 1850 }} />
      </Card>

      <Modal title={label.detail} open={Boolean(detailRecord)} onCancel={() => setDetailRecord(null)} footer={null} width={980}>
        {detailRecord ? (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="编号">{detailRecord.code}</Descriptions.Item>
              <Descriptions.Item label="在线状态">{onlineText(detailRecord.onlineStatus)}</Descriptions.Item>
              <Descriptions.Item label="位置信息">{detailRecord.location}</Descriptions.Item>
              <Descriptions.Item label="电量">{detailRecord.battery}%</Descriptions.Item>
              <Descriptions.Item label="当前地图">{detailRecord.currentMap}</Descriptions.Item>
              <Descriptions.Item label="调度模式">{dispatchText(detailRecord.dispatchMode)}</Descriptions.Item>
              <Descriptions.Item label="控制状态">{controlText(detailRecord.controlStatus)}</Descriptions.Item>
              <Descriptions.Item label="异常状态">{exceptionText(detailRecord.exceptionStatus)}</Descriptions.Item>
              <Descriptions.Item label="类型">{detailRecord.type}</Descriptions.Item>
              <Descriptions.Item label="分组">{detailRecord.group}</Descriptions.Item>
              <Descriptions.Item label="IP">{detailRecord.ip}</Descriptions.Item>
              <Descriptions.Item label="实时视频">{detailRecord.videoUrl}</Descriptions.Item>
            </Descriptions>
            <Typography.Text strong>异常日志</Typography.Text>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              {detailRecord.exceptionLogs.map((item) => (
                <Typography.Text key={item}>{item}</Typography.Text>
              ))}
            </Space>
          </Space>
        ) : null}
      </Modal>

      <Modal title={label.logs} open={Boolean(logRecord)} onCancel={() => setLogRecord(null)} footer={null} width={900}>
        {logRecord ? (
          <Table
            rowKey="id"
            size="small"
            dataSource={logRecord.runtimeLogs}
            pagination={false}
            columns={[
              { title: '日志名称', dataIndex: 'name', key: 'name', width: 220 },
              { title: '类型', dataIndex: 'type', key: 'type', width: 120 },
              { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
              { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 170 },
              {
                title: '操作',
                key: 'action',
                render: (_, record) => (
                  <Space size={4}>
                    <Button type="link" onClick={() => Modal.info({ title: '日志预览', width: 760, content: <pre style={{ whiteSpace: 'pre-wrap' }}>{record.content}</pre> })}>
                      预览
                    </Button>
                    <Button
                      type="link"
                      onClick={() => {
                        const blob = new Blob([record.content], { type: 'text/plain;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = record.name;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                      }}
                    >
                      下载
                    </Button>
                  </Space>
                ),
              },
            ]}
          />
        ) : null}
      </Modal>
    </Space>
  );
}

