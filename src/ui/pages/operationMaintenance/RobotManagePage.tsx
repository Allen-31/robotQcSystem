import { EditOutlined, EyeOutlined, PauseCircleOutlined, PlayCircleOutlined, RedoOutlined, SwapOutlined } from '@ant-design/icons';
import { Button, Card, Descriptions, Input, Modal, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { robotManageList, type RobotControlStatus, type RobotDispatchMode, type RobotExceptionStatus, type RobotManageRecord } from '../../../data/operationMaintenance/robotManageList';
import { useI18n } from '../../../i18n/I18nProvider';

export function RobotManagePage() {
  const { t } = useI18n();
  const [messageApi, contextHolder] = message.useMessage();
  const [list, setList] = useState<RobotManageRecord[]>(robotManageList);
  const [keyword, setKeyword] = useState('');
  const [detailRecord, setDetailRecord] = useState<RobotManageRecord | null>(null);
  const [logRecord, setLogRecord] = useState<RobotManageRecord | null>(null);

  const onlineText = (status: RobotManageRecord['onlineStatus']) => (status === 'online' ? t('op.robotManage.online.online') : t('op.robotManage.online.offline'));
  const dispatchText = (mode: RobotDispatchMode) =>
    mode === 'auto' ? t('op.robotManage.dispatch.auto') : mode === 'semi-auto' ? t('op.robotManage.dispatch.semiAuto') : t('op.robotManage.dispatch.manual');
  const controlText = (status: RobotControlStatus) => (status === 'running' ? t('op.robotManage.control.running') : t('op.robotManage.control.paused'));
  const exceptionText = (status: RobotExceptionStatus) =>
    status === 'normal' ? t('op.robotManage.exception.normal') : status === 'warning' ? t('op.robotManage.exception.warning') : t('op.robotManage.exception.critical');

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
    { title: t('op.robotManage.table.code'), dataIndex: 'code', key: 'code', width: 110 },
    {
      title: t('op.robotManage.table.onlineStatus'),
      dataIndex: 'onlineStatus',
      key: 'onlineStatus',
      width: 110,
      render: (_, record) => <Tag color={record.onlineStatus === 'online' ? 'success' : 'default'}>{onlineText(record.onlineStatus)}</Tag>,
    },
    { title: t('op.robotManage.table.location'), dataIndex: 'location', key: 'location', width: 180 },
    { title: t('op.robotManage.table.battery'), dataIndex: 'battery', key: 'battery', width: 90, render: (value: number) => `${value}%` },
    { title: t('op.robotManage.table.currentMap'), dataIndex: 'currentMap', key: 'currentMap', width: 150 },
    { title: t('op.robotManage.table.dispatchMode'), dataIndex: 'dispatchMode', key: 'dispatchMode', width: 120, render: (v: RobotDispatchMode) => dispatchText(v) },
    { title: t('op.robotManage.table.controlStatus'), dataIndex: 'controlStatus', key: 'controlStatus', width: 110, render: (v: RobotControlStatus) => controlText(v) },
    {
      title: t('op.robotManage.table.exceptionStatus'),
      dataIndex: 'exceptionStatus',
      key: 'exceptionStatus',
      width: 110,
      render: (v: RobotExceptionStatus) => <Tag color={v === 'critical' ? 'error' : v === 'warning' ? 'warning' : 'success'}>{exceptionText(v)}</Tag>,
    },
    { title: t('op.robotManage.table.type'), dataIndex: 'type', key: 'type', width: 160 },
    { title: t('op.robotManage.table.group'), dataIndex: 'group', key: 'group', width: 120 },
    { title: t('op.robotManage.table.ip'), dataIndex: 'ip', key: 'ip', width: 130 },
    {
      title: t('op.robotManage.table.action'),
      key: 'action',
      width: 440,
      fixed: 'right',
      render: (_, record) => (
        <Space size={2}>
          <Button type="link" icon={<EyeOutlined />} onClick={() => setDetailRecord(record)}>
            {t('op.robotManage.action.detail')}
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => setLogRecord(record)}>
            {t('op.robotManage.action.logs')}
          </Button>
          <Button type="link" icon={<SwapOutlined />} onClick={() => messageApi.success(t('op.robotManage.message.switched'))}>
            {t('op.robotManage.action.switchMap')}
          </Button>
          <Button type="link" icon={<SwapOutlined />} onClick={() => messageApi.success(t('op.robotManage.message.switched'))}>
            {t('op.robotManage.action.switchDispatch')}
          </Button>
          <Button
            type="link"
            icon={record.controlStatus === 'running' ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={() => toggleControl(record.id)}
          >
            {t('op.robotManage.action.pauseResume')}
          </Button>
          <Button type="link" danger icon={<RedoOutlined />} onClick={() => messageApi.warning(t('op.robotManage.message.resetSent'))}>
            {t('op.robotManage.action.reset')}
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
          <Input allowClear placeholder={t('op.robotManage.searchPlaceholder')} value={keyword} onChange={(event) => setKeyword(event.target.value)} />
        </Space>
      </Card>

      <Card>
        <Table rowKey="id" columns={columns} dataSource={filtered} pagination={{ pageSize: 8, showSizeChanger: false }} scroll={{ x: 1900 }} />
      </Card>

      <Modal title={t('op.robotManage.modal.detailTitle')} open={Boolean(detailRecord)} onCancel={() => setDetailRecord(null)} footer={null} width={980}>
        {detailRecord ? (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label={t('op.robotManage.table.code')}>{detailRecord.code}</Descriptions.Item>
              <Descriptions.Item label={t('op.robotManage.table.onlineStatus')}>{onlineText(detailRecord.onlineStatus)}</Descriptions.Item>
              <Descriptions.Item label={t('op.robotManage.table.location')}>{detailRecord.location}</Descriptions.Item>
              <Descriptions.Item label={t('op.robotManage.table.battery')}>{detailRecord.battery}%</Descriptions.Item>
              <Descriptions.Item label={t('op.robotManage.table.currentMap')}>{detailRecord.currentMap}</Descriptions.Item>
              <Descriptions.Item label={t('op.robotManage.table.dispatchMode')}>{dispatchText(detailRecord.dispatchMode)}</Descriptions.Item>
              <Descriptions.Item label={t('op.robotManage.table.controlStatus')}>{controlText(detailRecord.controlStatus)}</Descriptions.Item>
              <Descriptions.Item label={t('op.robotManage.table.exceptionStatus')}>{exceptionText(detailRecord.exceptionStatus)}</Descriptions.Item>
              <Descriptions.Item label={t('op.robotManage.table.type')}>{detailRecord.type}</Descriptions.Item>
              <Descriptions.Item label={t('op.robotManage.table.group')}>{detailRecord.group}</Descriptions.Item>
              <Descriptions.Item label={t('op.robotManage.table.ip')}>{detailRecord.ip}</Descriptions.Item>
              <Descriptions.Item label={t('op.robotManage.detail.video')}>{detailRecord.videoUrl}</Descriptions.Item>
            </Descriptions>
            <Typography.Text strong>{t('op.robotManage.detail.exceptionLogs')}</Typography.Text>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              {detailRecord.exceptionLogs.map((item) => (
                <Typography.Text key={item}>{item}</Typography.Text>
              ))}
            </Space>
          </Space>
        ) : null}
      </Modal>

      <Modal title={t('op.robotManage.modal.logTitle')} open={Boolean(logRecord)} onCancel={() => setLogRecord(null)} footer={null} width={900}>
        {logRecord ? (
          <Table
            rowKey="id"
            size="small"
            dataSource={logRecord.runtimeLogs}
            pagination={false}
            columns={[
              { title: t('op.robotManage.log.table.name'), dataIndex: 'name', key: 'name', width: 220 },
              { title: t('op.robotManage.log.table.type'), dataIndex: 'type', key: 'type', width: 120 },
              { title: t('op.robotManage.log.table.createdAt'), dataIndex: 'createdAt', key: 'createdAt', width: 170 },
              { title: t('op.robotManage.log.table.updatedAt'), dataIndex: 'updatedAt', key: 'updatedAt', width: 170 },
              {
                title: t('op.robotManage.log.table.action'),
                key: 'action',
                render: (_, record) => (
                  <Space size={4}>
                    <Button
                      type="link"
                      onClick={() =>
                        Modal.info({
                          title: t('op.robotManage.log.previewTitle'),
                          width: 760,
                          content: <pre style={{ whiteSpace: 'pre-wrap' }}>{record.content}</pre>,
                        })
                      }
                    >
                      {t('op.robotManage.log.preview')}
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
                      {t('op.robotManage.log.download')}
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

