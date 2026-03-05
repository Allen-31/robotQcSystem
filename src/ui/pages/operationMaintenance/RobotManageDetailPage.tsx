import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Card, Col, Descriptions, Divider, Row, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import robot2DImage from '../../../assets/gpt_robot_image.png';
import { exceptionNotificationList, type ExceptionNotificationRecord } from '../../../data/operationMaintenance/exceptionNotificationList';
import { robotManageList } from '../../../data/operationMaintenance/robotManageList';
import { useI18n } from '../../../i18n/I18nProvider';

export function RobotManageDetailPage() {
  const navigate = useNavigate();
  const { robotId } = useParams<{ robotId: string }>();
  const { t } = useI18n();
  const [messageApi, contextHolder] = message.useMessage();

  const robot = useMemo(() => robotManageList.find((item) => item.id === robotId), [robotId]);
  const [dispatchMode, setDispatchMode] = useState<'auto' | 'semi-auto' | 'manual'>('auto');
  const [controlStatus, setControlStatus] = useState<'running' | 'paused'>('running');
  const [isCharging, setIsCharging] = useState(false);
  const [isHoming, setIsHoming] = useState(false);
  const [mapIndex, setMapIndex] = useState(0);
  const [chassisMode, setChassisMode] = useState<'A' | 'B'>('A');
  const [armMode, setArmMode] = useState<'A' | 'B'>('A');
  const [isLifted, setIsLifted] = useState(false);

  const mapOptions = useMemo(() => {
    if (!robot) {
      return [];
    }
    return [robot.currentMap, `${robot.currentMap}-B`, `${robot.currentMap}-C`];
  }, [robot]);

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

  const robotExceptionLogs = useMemo(() => exceptionNotificationList.filter((item) => item.robot === robot.code), [robot.code]);

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
  ];

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
                <Button
                  type="primary"
                  onClick={() => {
                    const nextMode = dispatchMode === 'auto' ? 'semi-auto' : dispatchMode === 'semi-auto' ? 'manual' : 'auto';
                    setDispatchMode(nextMode);
                    messageApi.success(t('op.robotManage.message.switched'));
                  }}
                >
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
                <Button
                  type="primary"
                  onClick={() => {
                    if (mapOptions.length === 0) {
                      return;
                    }
                    setMapIndex((prev) => (prev + 1) % mapOptions.length);
                    messageApi.success(t('op.robotManage.message.switched'));
                  }}
                >
                  {t('op.robotManage.action.switchMap')}
                </Button>
                <Button
                  onClick={() => {
                    setChassisMode((prev) => (prev === 'A' ? 'B' : 'A'));
                    messageApi.success(t('op.robotManage.message.switched'));
                  }}
                >
                  {`${t('op.robotManage.action.switchOperationMode')} (${chassisMode})`}
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
                <Button
                  onClick={() => {
                    setArmMode((prev) => (prev === 'A' ? 'B' : 'A'));
                    messageApi.success(t('op.robotManage.message.switched'));
                  }}
                >
                  {`${t('op.robotManage.action.switchOperationMode')} (${armMode})`}
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
              </Descriptions>

              <Divider style={{ margin: '4px 0' }} />
              <Typography.Text strong>{t('op.robotManage.detail.video')}</Typography.Text>
              <div
                style={{
                  width: '100%',
                  height: 260,
                  borderRadius: 10,
                  border: '1px solid #e6eaf0',
                  background: 'linear-gradient(160deg, #0f172a 0%, #1f2937 100%)',
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
              <div
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
                }}
              >
                <img src={robot2DImage} alt="robot-2d-structure" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} />
              </div>

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

      <Card title={t('menu.exceptionNotification')}>
        <Table
          rowKey="id"
          columns={exceptionColumns}
          dataSource={robotExceptionLogs}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          scroll={{ x: 1500 }}
        />
      </Card>
    </Space>
  );
}
