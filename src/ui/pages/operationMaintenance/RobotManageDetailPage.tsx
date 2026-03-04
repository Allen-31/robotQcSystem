import { Button, Card, Col, Descriptions, Empty, List, Row, Space, Tag, Typography, message } from 'antd';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import robot2DImage from '../../../assets/gpt_robot_image.png';
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
          <Typography.Text type="secondary">{t('op.robotManage.detail.notFound')}</Typography.Text>
          <div style={{ marginTop: 12 }}>
            <Button onClick={() => navigate('/operationMaintenance/robot/robotManage')}>{t('op.robotManage.backToList')}</Button>
          </div>
        </Card>
      </Space>
    );
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {contextHolder}
      <Card
        title={t('op.robotManage.modal.detailTitle')}
        extra={<Button onClick={() => navigate('/operationMaintenance/robot/robotManage')}>{t('op.robotManage.backToList')}</Button>}
      >
        <Descriptions size="small" column={6}>
          <Descriptions.Item label={t('op.robotManage.table.code')}>{robot.code}</Descriptions.Item>
          <Descriptions.Item label={t('op.robotManage.table.onlineStatus')}>
            <Tag color={robot.onlineStatus === 'online' ? 'success' : 'default'}>
              {robot.onlineStatus === 'online' ? t('op.robotManage.online.online') : t('op.robotManage.online.offline')}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('op.robotManage.table.battery')}>{robot.battery}%</Descriptions.Item>
          <Descriptions.Item label={t('op.robotManage.table.location')}>{robot.location}</Descriptions.Item>
          <Descriptions.Item label={t('op.robotManage.table.group')}>{robot.group}</Descriptions.Item>
          <Descriptions.Item label={t('op.robotManage.table.ip')}>{robot.ip}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Row gutter={16} style={{ width: '100%' }}>
        <Col xs={24} lg={14}>
          <Card title={t('op.robotManage.section.leftTop')} bodyStyle={{ padding: 12 }}>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Card size="small" title={t('op.robotManage.section.basicInfo')}>
                <Descriptions size="small" column={2}>
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
                </Descriptions>
              </Card>

              <Card size="small" title={t('op.robotManage.detail.exceptionLogs')}>
                {robot.exceptionLogs.length > 0 ? (
                  <List
                    size="small"
                    bordered
                    dataSource={robot.exceptionLogs}
                    renderItem={(item) => (
                      <List.Item>
                        <Typography.Text>{item}</Typography.Text>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty />
                )}
              </Card>

              <Card size="small" title={t('op.robotManage.detail.video')}>
                <Typography.Paragraph style={{ marginBottom: 8 }}>{robot.videoUrl}</Typography.Paragraph>
                <Typography.Text type="secondary">{t('workOrder.detail.videoPlaceholder')}</Typography.Text>
              </Card>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title={t('op.robotManage.section.rightTop')} bodyStyle={{ padding: 12 }}>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Card size="small" title={t('op.robotManage.section.structureImage')}>
                <img src={robot2DImage} alt="robot-2d-structure" style={{ width: '100%', display: 'block', borderRadius: 8 }} />
              </Card>
              <Card size="small" title={t('op.robotManage.section.sensorInfo')}>
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
              </Card>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title={t('op.robotManage.section.controlPanel')}>
        <Row gutter={16} style={{ width: '100%' }}>
          <Col xs={24} md={8}>
            <Card size="small" title={t('op.robotManage.section.globalControl')}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  block
                  onClick={() => {
                    const nextMode = dispatchMode === 'auto' ? 'semi-auto' : dispatchMode === 'semi-auto' ? 'manual' : 'auto';
                    setDispatchMode(nextMode);
                    messageApi.success(t('op.robotManage.message.switched'));
                  }}
                >
                  {t('op.robotManage.action.switchDispatch')}
                </Button>
                <Button
                  block
                  onClick={() => {
                    setControlStatus((prev) => (prev === 'running' ? 'paused' : 'running'));
                    messageApi.success(t('op.robotManage.message.switched'));
                  }}
                >
                  {t('op.robotManage.action.pauseResume')}
                </Button>
                <Button block danger onClick={() => messageApi.warning(t('op.robotManage.message.resetSent'))}>
                  {t('op.robotManage.action.reset')}
                </Button>
                <Button
                  block
                  onClick={() => {
                    setIsCharging((prev) => !prev);
                    messageApi.success(t('op.robotManage.message.switched'));
                  }}
                >
                  {isCharging ? t('op.robotManage.action.chargeCancel') : t('op.robotManage.action.chargeStart')}
                </Button>
                <Button
                  block
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
            <Card size="small" title={t('op.robotManage.section.chassisControl')}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  block
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
                  block
                  onClick={() => {
                    setChassisMode((prev) => (prev === 'A' ? 'B' : 'A'));
                    messageApi.success(t('op.robotManage.message.switched'));
                  }}
                >
                  {`${t('op.robotManage.action.switchOperationMode')} (${chassisMode})`}
                </Button>
                <Button block onClick={() => messageApi.success(t('op.robotManage.message.switched'))}>
                  {t('op.robotManage.action.remoteControl')}
                </Button>
              </Space>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card size="small" title={t('op.robotManage.section.armControl')}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  block
                  onClick={() => {
                    setIsLifted((prev) => !prev);
                    messageApi.success(t('op.robotManage.message.switched'));
                  }}
                >
                  {`${t('op.robotManage.action.lift')} (${isLifted ? 'ON' : 'OFF'})`}
                </Button>
                <Button block onClick={() => messageApi.success(t('op.robotManage.message.switched'))}>
                  {t('op.robotManage.action.backToOrigin')}
                </Button>
                <Button
                  block
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
    </Space>
  );
}
