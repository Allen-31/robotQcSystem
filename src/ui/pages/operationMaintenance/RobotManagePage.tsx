import { EyeOutlined } from '@ant-design/icons';
import { Button, Card, Input, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRobotManageList, type RobotControlStatus, type RobotDispatchMode, type RobotExceptionStatus, type RobotManageRecord } from '../../../data/operationMaintenance/robotManageList';
import { useI18n } from '../../../i18n/I18nProvider';

export function RobotManagePage() {
  const navigate = useNavigate();
  const { locale, t } = useI18n();
  const list = useMemo(() => getRobotManageList(locale), [locale]);
  const [keyword, setKeyword] = useState('');

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
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/operationMaintenance/robot/robotManage/${record.id}/detail`)}>
            {t('op.robotManage.action.detail')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
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
    </Space>
  );
}
