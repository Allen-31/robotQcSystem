import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Card, Col, Descriptions, Divider, Modal, Row, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import robot2DImage from '../../../assets/gpt_robot_image.png';
import { getExceptionNotificationList, type ExceptionNotificationRecord } from '../../../data/operationMaintenance/exceptionNotificationList';
import { getRobotManageList } from '../../../data/operationMaintenance/robotManageList';
import { useI18n } from '../../../i18n/I18nProvider';

type SelectorKind = 'dispatch' | 'map' | 'mode';
type ModeTarget = 'chassis' | 'arm';
type OperationMode = 'mapping' | 'teach' | 'auto';

export function RobotManageDetailPage() {
  const navigate = useNavigate();
  const { robotId } = useParams<{ robotId: string }>();
  const { locale, t } = useI18n();
  const [messageApi, contextHolder] = message.useMessage();
  const exceptionNotificationList = useMemo(() => getExceptionNotificationList(locale), [locale]);
  const robotManageList = useMemo(() => getRobotManageList(locale), [locale]);

  const robot = useMemo(() => robotManageList.find((item) => item.id === robotId), [robotId, robotManageList]);
  const [dispatchMode, setDispatchMode] = useState<'auto' | 'semi-auto' | 'manual'>('auto');
  const [controlStatus, setControlStatus] = useState<'running' | 'paused'>('running');
  const [isCharging, setIsCharging] = useState(false);
  const [isHoming, setIsHoming] = useState(false);
  const [mapIndex, setMapIndex] = useState(0);
  const [chassisMode, setChassisMode] = useState<OperationMode>('mapping');
  const [armMode, setArmMode] = useState<OperationMode>('auto');
  const [isLifted, setIsLifted] = useState(false);

  const [imageScale, setImageScale] = useState(1);
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });
  const [isImagePanning, setIsImagePanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);

  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectorKind, setSelectorKind] = useState<SelectorKind>('map');
  const [modeTarget, setModeTarget] = useState<ModeTarget>('chassis');
  const [selectorValue, setSelectorValue] = useState('');
  const [previewLogRecord, setPreviewLogRecord] = useState<ExceptionNotificationRecord | null>(null);

  const mapOptions = useMemo(() => {
    if (!robot) {
      return [];
    }
    return [robot.currentMap, `${robot.currentMap}-B`, `${robot.currentMap}-C`];
  }, [robot]);
  const operationModeText = (mode: OperationMode, target: ModeTarget) => {
    if (mode === 'auto') {
      return t('op.robotManage.mode.auto');
    }
    if (target === 'chassis') {
      return t('op.robotManage.mode.mapping');
    }
    return t('op.robotManage.mode.teach');
  };

  if (!robot) {
    return (
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        {contextHolder}
        <Card>
          <Space direction="vertical" size={12}>
            <Typography.Text type="secondary">{t('op.robotManage.detail.notFound')}</Typography.Text>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/operationMaintenance/robot/robotManage')}>
              {t('op.robotManage.backToList')}
            </Button>
          </Space>
        </Card>
      </Space>
    );
  }

  const robotExceptionLogs = useMemo(() => exceptionNotificationList.filter((item) => item.robot === robot.code), [exceptionNotificationList, robot.code]);

  const exceptionColumns: ColumnsType<ExceptionNotificationRecord> = [
    { title: t('op.exception.table.id'), dataIndex: 'id', key: 'id', width: 170 },
    {
      title: t('op.exception.table.level'),
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (value) => <Tag color={value === 'P1' ? 'error' : value === 'P2' ? 'warning' : 'default'}>{value}</Tag>,
    },
    { title: t('op.exception.table.type'), dataIndex: 'type', key: 'type', width: 120 },
    { title: t('op.exception.table.sourceSystem'), dataIndex: 'sourceSystem', key: 'sourceSystem', width: 170 },
    { title: t('op.exception.table.issue'), dataIndex: 'issue', key: 'issue', width: 280 },
    {
      title: t('op.exception.table.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (value) => <Tag color={value === 'pending' ? 'error' : value === 'processing' ? 'warning' : 'success'}>{t(`op.exception.status.${value}`)}</Tag>,
    },
    { title: t('op.exception.table.relatedTask'), dataIndex: 'relatedTask', key: 'relatedTask', width: 160 },
    { title: t('op.exception.table.robot'), dataIndex: 'robot', key: 'robot', width: 120 },
    { title: t('op.exception.table.createdAt'), dataIndex: 'createdAt', key: 'createdAt', width: 170 },
    {
      title: t('op.robotManage.log.table.action'),
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Button
            type="link"
            onClick={() => setPreviewLogRecord(record)}
          >
            {t('op.robotManage.log.preview')}
          </Button>
          <Button
            type="link"
            onClick={() => {
              const content = `id:${record.id}\nlevel:${record.level}\ntype:${record.type}\nsourceSystem:${record.sourceSystem}\nissue:${record.issue}\nstatus:${record.status}\nrelatedTask:${record.relatedTask}\nrobot:${record.robot}\ncreatedAt:${record.createdAt}\n`;
              const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `${record.id}.txt`;
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
  ];

  const selectorRows = useMemo(() => {
    if (selectorKind === 'dispatch') {
      return [
        { key: 'auto', label: t('op.robotManage.dispatch.auto') },
        { key: 'semi-auto', label: t('op.robotManage.dispatch.semiAuto') },
        { key: 'manual', label: t('op.robotManage.dispatch.manual') },
      ];
    }
    if (selectorKind === 'map') {
      return mapOptions.map((name) => ({ key: name, label: name }));
    }
    if (modeTarget === 'chassis') {
      return [
        { key: 'mapping', label: t('op.robotManage.mode.mapping') },
        { key: 'auto', label: t('op.robotManage.mode.auto') },
      ];
    }
    return [
      { key: 'teach', label: t('op.robotManage.mode.teach') },
      { key: 'auto', label: t('op.robotManage.mode.auto') },
    ];
  }, [mapOptions, modeTarget, selectorKind, t]);

  const openSelector = (kind: SelectorKind, target: ModeTarget = 'chassis') => {
    setSelectorKind(kind);
    setModeTarget(target);
    if (kind === 'dispatch') {
      setSelectorValue(dispatchMode);
    } else if (kind === 'map') {
      setSelectorValue(mapOptions[mapIndex] ?? '');
    } else {
      setSelectorValue(target === 'chassis' ? chassisMode : armMode);
    }
    setSelectorOpen(true);
  };

  const applySelector = () => {
    if (!selectorValue) {
      return;
    }
    if (selectorKind === 'dispatch') {
      setDispatchMode(selectorValue as 'auto' | 'semi-auto' | 'manual');
    } else if (selectorKind === 'map') {
      const nextIndex = mapOptions.findIndex((item) => item === selectorValue);
      if (nextIndex >= 0) {
        setMapIndex(nextIndex);
      }
    } else if (modeTarget === 'chassis') {
      setChassisMode(selectorValue as OperationMode);
    } else {
      setArmMode(selectorValue as OperationMode);
    }
    setSelectorOpen(false);
    messageApi.success(t('op.robotManage.message.switched'));
  };

  const zoomIn = () => setImageScale((prev) => Number(Math.min(2.5, prev + 0.2).toFixed(2)));
  const zoomOut = () => setImageScale((prev) => Number(Math.max(1, prev - 0.2).toFixed(2)));
  const resetZoom = () => {
    setImageScale(1);
    setImageOffset({ x: 0, y: 0 });
  };

  const onImageMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !event.ctrlKey || imageScale <= 1) {
      return;
    }
    event.preventDefault();
    setIsImagePanning(true);
    setPanStart({ x: event.clientX, y: event.clientY });
  };

  const onImageMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isImagePanning || !panStart) {
      return;
    }
    const dx = event.clientX - panStart.x;
    const dy = event.clientY - panStart.y;
    setPanStart({ x: event.clientX, y: event.clientY });
    setImageOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const onImageMouseUp = () => {
    setIsImagePanning(false);
    setPanStart(null);
  };

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      {contextHolder}

      <Space align="center">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/operationMaintenance/robot/robotManage')}>
          {t('op.robotManage.backToList')}
        </Button>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {t('op.robotManage.modal.detailTitle')}
        </Typography.Title>
      </Space>

      <Card bodyStyle={{ paddingTop: 10 }}>
        <Row gutter={12} style={{ width: '100%' }}>
          <Col xs={24} md={8}>
            <Card size="small" style={{ background: '#fafcff', border: '1px solid #e8eef6' }} bodyStyle={{ padding: 12 }}>
              <Typography.Text strong>{t('op.robotManage.section.globalControl')}</Typography.Text>
              <Space wrap style={{ width: '100%', marginTop: 10 }} size={[8, 8]}>
                <Button type="primary" onClick={() => openSelector('dispatch')}>
                  {t('op.robotManage.action.switchDispatch')}
                </Button>
                <Button
                  onClick={() => {
                    setControlStatus((prev) => (prev === 'running' ? 'paused' : 'running'));
                    messageApi.success(t('op.robotManage.message.switched'));
                  }}
                >
                  {t('op.robotManage.action.pauseResume')}
                </Button>
                <Button danger onClick={() => messageApi.warning(t('op.robotManage.message.resetSent'))}>
                  {t('op.robotManage.action.reset')}
                </Button>
                <Button
                  onClick={() => {
                    setIsCharging((prev) => !prev);
                    messageApi.success(t('op.robotManage.message.switched'));
                  }}
                >
                  {isCharging ? t('op.robotManage.action.chargeCancel') : t('op.robotManage.action.chargeStart')}
                </Button>
                <Button
                  onClick={() => {
                    setIsHoming((prev) => !prev);
                    messageApi.success(t('op.robotManage.message.switched'));
                  }}
                >
                  {isHoming ? t('op.robotManage.action.homingCancel') : t('op.robotManage.action.homingStart')}
                </Button>
              </Space>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card size="small" style={{ background: '#fafcff', border: '1px solid #e8eef6' }} bodyStyle={{ padding: 12 }}>
              <Typography.Text strong>{t('op.robotManage.section.chassisControl')}</Typography.Text>
              <Space wrap style={{ width: '100%', marginTop: 10 }} size={[8, 8]}>
                <Button type="primary" onClick={() => openSelector('map')}>
                  {t('op.robotManage.action.switchMap')}
                </Button>
                <Button onClick={() => openSelector('mode', 'chassis')}>
                  {`${t('op.robotManage.action.switchOperationMode')} (${operationModeText(chassisMode, 'chassis')})`}
                </Button>
                <Button onClick={() => messageApi.success(t('op.robotManage.message.switched'))}>{t('op.robotManage.action.remoteControl')}</Button>
              </Space>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card size="small" style={{ background: '#fafcff', border: '1px solid #e8eef6' }} bodyStyle={{ padding: 12 }}>
              <Typography.Text strong>{t('op.robotManage.section.armControl')}</Typography.Text>
              <Space wrap style={{ width: '100%', marginTop: 10 }} size={[8, 8]}>
                <Button
                  type="primary"
                  onClick={() => {
                    setIsLifted((prev) => !prev);
                    messageApi.success(t('op.robotManage.message.switched'));
                  }}
                >
                  {`${t('op.robotManage.action.lift')} (${isLifted ? 'ON' : 'OFF'})`}
                </Button>
                <Button onClick={() => messageApi.success(t('op.robotManage.message.switched'))}>{t('op.robotManage.action.backToOrigin')}</Button>
                <Button onClick={() => openSelector('mode', 'arm')}>
                  {`${t('op.robotManage.action.switchOperationMode')} (${operationModeText(armMode, 'arm')})`}
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>

      <Row gutter={12} style={{ width: '100%' }}>
        <Col xs={24} lg={12} style={{ display: 'flex' }}>
          <Card bodyStyle={{ padding: 12 }} style={{ width: '100%', minHeight: 700 }}>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Typography.Text strong>{t('op.robotManage.section.basicInfo')}</Typography.Text>
              <Descriptions size="small" column={2}>
                <Descriptions.Item label={t('op.robotManage.table.code')}>{robot.code}</Descriptions.Item>
                <Descriptions.Item label={t('op.robotManage.table.onlineStatus')}>
                  <Tag color={robot.onlineStatus === 'online' ? 'success' : 'default'}>
                    {robot.onlineStatus === 'online' ? t('op.robotManage.online.online') : t('op.robotManage.online.offline')}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label={t('op.robotManage.table.location')}>{robot.location}</Descriptions.Item>
                <Descriptions.Item label={t('op.robotManage.table.battery')}>{robot.battery}%</Descriptions.Item>
                <Descriptions.Item label={t('op.robotManage.table.currentMap')}>{mapOptions[mapIndex]}</Descriptions.Item>
                <Descriptions.Item label={t('op.robotManage.table.dispatchMode')}>
                  {dispatchMode === 'auto'
                    ? t('op.robotManage.dispatch.auto')
                    : dispatchMode === 'semi-auto'
                      ? t('op.robotManage.dispatch.semiAuto')
                      : t('op.robotManage.dispatch.manual')}
                </Descriptions.Item>
                <Descriptions.Item label={t('op.robotManage.table.controlStatus')}>
                  {controlStatus === 'running' ? t('op.robotManage.control.running') : t('op.robotManage.control.paused')}
                </Descriptions.Item>
                <Descriptions.Item label={t('op.robotManage.table.exceptionStatus')}>
                  <Tag color={robot.exceptionStatus === 'critical' ? 'error' : robot.exceptionStatus === 'warning' ? 'warning' : 'success'}>
                    {robot.exceptionStatus === 'normal'
                      ? t('op.robotManage.exception.normal')
                      : robot.exceptionStatus === 'warning'
                        ? t('op.robotManage.exception.warning')
                        : t('op.robotManage.exception.critical')}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label={t('op.robotManage.table.type')}>{robot.type}</Descriptions.Item>
                <Descriptions.Item label={t('op.robotManage.table.group')}>{robot.group}</Descriptions.Item>
                <Descriptions.Item label={t('op.robotManage.table.ip')}>{robot.ip}</Descriptions.Item>
                <Descriptions.Item label={t('op.robotManage.table.chassisMode')}>{operationModeText(chassisMode, 'chassis')}</Descriptions.Item>
                <Descriptions.Item label={t('op.robotManage.table.armMode')}>{operationModeText(armMode, 'arm')}</Descriptions.Item>
              </Descriptions>

              <Divider style={{ margin: '4px 0' }} />
              <Typography.Text strong>{t('op.robotManage.detail.video')}</Typography.Text>
              <div
                style={{
                  width: '100%',
                  height: 260,
                  borderRadius: 10,
                  border: '1px solid #000',
                  background: '#000',
                  color: '#d1d5db',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Typography.Text style={{ color: '#f3f4f6' }}>{t('workOrder.detail.videoPlaceholder')}</Typography.Text>
                <Typography.Text style={{ color: '#9ca3af', fontSize: 12 }}>{robot.videoUrl}</Typography.Text>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12} style={{ display: 'flex' }}>
          <Card bodyStyle={{ padding: 12 }} style={{ width: '100%', minHeight: 700 }}>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Typography.Text strong>{t('op.robotManage.section.structureImage')}</Typography.Text>
              <Space size={8}>
                <Button size="small" onClick={zoomOut} disabled={imageScale <= 1}>
                  -
                </Button>
                <Button size="small" onClick={zoomIn} disabled={imageScale >= 2.5}>
                  +
                </Button>
                <Button size="small" onClick={resetZoom} disabled={imageScale === 1 && imageOffset.x === 0 && imageOffset.y === 0}>
                  {t('op.robotManage.image.reset')}
                </Button>
                <Typography.Text type="secondary">{Math.round(imageScale * 100)}%</Typography.Text>
              </Space>
              <div
                onMouseDown={onImageMouseDown}
                onMouseMove={onImageMouseMove}
                onMouseUp={onImageMouseUp}
                onMouseLeave={onImageMouseUp}
                style={{
                  width: '100%',
                  height: 420,
                  borderRadius: 10,
                  border: '1px solid #e6eaf0',
                  background: '#fafcff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 12,
                  overflow: 'hidden',
                  cursor: imageScale > 1 ? (isImagePanning ? 'grabbing' : 'grab') : 'default',
                }}
              >
                <img
                  src={robot2DImage}
                  alt="robot-2d-structure"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    display: 'block',
                    transform: `translate(${imageOffset.x}px, ${imageOffset.y}px) scale(${imageScale})`,
                    transformOrigin: 'center center',
                    transition: isImagePanning ? 'none' : 'transform 0.12s ease',
                    userSelect: 'none',
                    pointerEvents: 'none',
                  }}
                />
              </div>
              <Typography.Text type="secondary">{t('op.robotManage.image.panHint')}</Typography.Text>

              <Divider style={{ margin: '4px 0' }} />
              <Typography.Text strong>{t('op.robotManage.section.sensorInfo')}</Typography.Text>
              <Descriptions size="small" column={1}>
                <Descriptions.Item label={t('op.robotManage.sensor.lidar')}>
                  <Tag color="success">{t('op.robotManage.sensor.normal')}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label={t('op.robotManage.sensor.camera')}>
                  <Tag color="success">{t('op.robotManage.sensor.normal')}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label={t('op.robotManage.sensor.imu')}>
                  <Tag color="success">{t('op.robotManage.sensor.normal')}</Tag>
                </Descriptions.Item>
              </Descriptions>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title={t('op.robotManage.detail.exceptionLogs')}>
        <Table
          rowKey="id"
          columns={exceptionColumns}
          dataSource={robotExceptionLogs}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          scroll={{ x: 1500 }}
        />
      </Card>

      <Modal
        open={selectorOpen}
        onCancel={() => setSelectorOpen(false)}
        onOk={applySelector}
        okButtonProps={{ disabled: !selectorValue }}
        title={
          selectorKind === 'dispatch'
            ? t('op.robotManage.action.switchDispatch')
            : selectorKind === 'map'
              ? t('op.robotManage.action.switchMap')
              : t('op.robotManage.action.switchOperationMode')
        }
      >
        <Table
          rowKey="key"
          size="small"
          pagination={false}
          dataSource={selectorRows}
          columns={[{ title: t('op.robotManage.selector.option'), dataIndex: 'label', key: 'label' }]}
          rowSelection={{
            type: 'radio',
            selectedRowKeys: selectorValue ? [selectorValue] : [],
            onChange: (keys) => setSelectorValue(String(keys[0] ?? '')),
          }}
        />
      </Modal>

      <Modal
        title={t('op.robotManage.log.previewTitle')}
        open={Boolean(previewLogRecord)}
        onCancel={() => setPreviewLogRecord(null)}
        footer={null}
        width={760}
      >
        {previewLogRecord ? (
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Typography.Text>
              ID: {previewLogRecord.id}
            </Typography.Text>
            <Typography.Text>
              {t('op.exception.table.type')}: {previewLogRecord.type}
            </Typography.Text>
            <Typography.Text>
              {t('op.exception.table.sourceSystem')}: {previewLogRecord.sourceSystem}
            </Typography.Text>
            <Typography.Text>
              {t('op.exception.table.createdAt')}: {previewLogRecord.createdAt}
            </Typography.Text>
            <Typography.Text>
              {t('op.exception.table.issue')}:
            </Typography.Text>
            <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{previewLogRecord.issue}</pre>
          </Space>
        ) : null}
      </Modal>
    </Space>
  );
}
