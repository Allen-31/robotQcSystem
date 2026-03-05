import { ExclamationCircleFilled, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';
import { getCurrentUser } from '../../../logic/auth/authStore';
import { getPackageManageList } from '../../../data/operationMaintenance/packageManageList';
import {
  getPublishManageList,
  getUpgradeDeviceCatalog,
  type DeviceUpgradeRecord,
  type DeviceUpgradeStatus,
  type PublishManageRecord,
  type PublishStatus,
  type UpgradeDeviceTemplate,
  type UpgradeStrategy,
} from '../../../data/operationMaintenance/publishManageList';
import { useI18n } from '../../../i18n/I18nProvider';

function nowText(): string {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function extractVersion(packageName: string): string {
  const matched = packageName.match(/v\d+\.\d+\.\d+/i)?.[0];
  if (matched) {
    return matched;
  }
  return 'v1.0.0';
}

function resolveStatusAfterDeviceChange(devices: DeviceUpgradeRecord[]): PublishStatus {
  if (devices.length === 0) {
    return 'pending';
  }
  if (devices.every((item) => item.status === 'cancelled')) {
    return 'cancelled';
  }
  if (devices.some((item) => item.status === 'upgrading')) {
    return 'running';
  }
  if (devices.some((item) => item.status === 'pending')) {
    return 'pending';
  }
  return 'completed';
}

function buildUpgradeDevices(
  packageName: string,
  targetRobots: string[],
  targetRobotGroups: string[],
  targetRobotTypes: string[],
  strategy: UpgradeStrategy,
  packageList: Array<{ name: string; type: string }>,
  deviceCatalog: UpgradeDeviceTemplate[],
): DeviceUpgradeRecord[] {
  const packageType = packageList.find((item) => item.name === packageName)?.type;
  const hasTargetFilters = targetRobots.length > 0 || targetRobotGroups.length > 0 || targetRobotTypes.length > 0;
  const filtered = deviceCatalog.filter((device) => {
    if (packageType === 'cloud') {
      return device.robotType === 'SERVER';
    }
    if (!hasTargetFilters) {
      return device.robotType !== 'SERVER';
    }
    const matchedType = targetRobotTypes.length === 0 || targetRobotTypes.includes(device.robotType);
    const matchedGroup = targetRobotGroups.length === 0 || targetRobotGroups.includes(device.robotGroup);
    const matchedRobot = targetRobots.length === 0 || targetRobots.includes(device.robot);
    return matchedType && matchedGroup && matchedRobot;
  });

  const targetDevices = filtered.length > 0 ? filtered : deviceCatalog.slice(0, 1);
  return targetDevices.map((device, index) => ({
    id: `DEV-UP-${Date.now()}-${index}`,
    deviceName: device.deviceName,
    ip: device.ip,
    status: strategy === 'immediate' && index === 0 ? 'upgrading' : 'pending',
    packageName,
    version: extractVersion(packageName),
    updatedAt: nowText(),
    completedAt: '-',
  }));
}

export function PublishManagePage() {
  const { locale, t } = useI18n();
  const [messageApi, contextHolder] = message.useMessage();
  const packageList = useMemo(() => getPackageManageList(locale), [locale]);
  const upgradeDeviceCatalog = useMemo(() => getUpgradeDeviceCatalog(locale), [locale]);
  const [tableData, setTableData] = useState<PublishManageRecord[]>(() => getPublishManageList(locale));
  const [keyword, setKeyword] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [progressTask, setProgressTask] = useState<PublishManageRecord | null>(null);
  const [form] = Form.useForm<{
    name: string;
    packageName: string;
    targetRobots: string[];
    targetRobotGroups: string[];
    targetRobotTypes: string[];
    strategy: UpgradeStrategy;
    restartAfterUpgrade: boolean;
  }>();
  const watchedPackageName = Form.useWatch('packageName', form);

  useEffect(() => {
    setTableData(getPublishManageList(locale));
  }, [locale]);

  const label = useMemo(() => {
    if (locale === 'en-US') {
      return {
        create: 'Create',
        createTitle: 'Create Publish Task',
        tableName: 'Name',
        tablePackage: 'Package',
        tableTargetRobot: 'Target Robots',
        tableTargetGroup: 'Target Robot Groups',
        tableTargetType: 'Target Robot Types',
        tableStrategy: 'Upgrade Strategy',
        tableRestart: 'Restart',
        tableStatus: 'Status',
        tableCreator: 'Creator',
        tableCreatedAt: 'Created At',
        tableCompletedAt: 'Completed At',
        tableAction: 'Action',
        actionProgress: 'Progress',
        actionCancel: 'Cancel',
        actionRestore: 'Restore',
        cancelTaskConfirmTitle: 'Cancel this publish task?',
        restoreTaskConfirmTitle: 'Restore this publish task?',
        cancelDeviceConfirmTitle: 'Cancel this device upgrade?',
        restoreDeviceConfirmTitle: 'Restore this device upgrade?',
        cancelCompletedBlocked: 'Completed task cannot be cancelled',
        cancelCompletedDeviceBlocked: 'Completed device cannot be cancelled',
        strategyImmediate: 'Immediate Upgrade',
        strategyIdle: 'Idle Upgrade',
        strategyHoming: 'Homing Upgrade',
        statusPending: 'Pending',
        statusRunning: 'Running',
        statusCompleted: 'Completed',
        statusCancelled: 'Cancelled',
        restartYes: 'Yes',
        restartNo: 'No',
        createDone: 'Publish task created',
        cancelTaskDone: 'Publish task cancelled',
        restoreTaskDone: 'Publish task restored',
        progressTitle: 'Upgrade Progress',
        progressDeviceName: 'Device Name',
        progressIp: 'IP',
        progressStatus: 'Status',
        progressPackage: 'Package',
        progressVersion: 'Version',
        progressUpdatedAt: 'Updated At',
        progressCompletedAt: 'Completed At',
        cancelDeviceDone: 'Device upgrade cancelled',
        restoreDeviceDone: 'Device upgrade restored',
        noTargetHint: 'No target selected means all matching devices of package type',
        packageDescription: 'Package Description',
        selectTypeFirst: 'Select robot type first, then robot group, then robot',
        selectGroupFirst: 'Select robot group before selecting robots',
        selectAllRobots: 'Select All',
        searchPlaceholder: 'Search by name, package, target, strategy, creator',
      };
    }
    return {
      create: '新增',
      createTitle: '新增发布任务',
      tableName: '名称',
      tablePackage: '安装包',
      tableTargetRobot: '目标机器人',
      tableTargetGroup: '目标机器人组',
      tableTargetType: '目标机器人类型',
      tableStrategy: '升级策略',
      tableRestart: '是否重启',
      tableStatus: '状态',
      tableCreator: '创建人',
      tableCreatedAt: '创建时间',
      tableCompletedAt: '完成时间',
      tableAction: '操作',
      actionProgress: '进度',
      actionCancel: '取消',
      actionRestore: '恢复',
      cancelTaskConfirmTitle: '确认取消该发布任务？',
      restoreTaskConfirmTitle: '确认恢复该发布任务？',
      cancelDeviceConfirmTitle: '确认取消该设备升级？',
      restoreDeviceConfirmTitle: '确认恢复该设备升级？',
      cancelCompletedBlocked: '已完成任务不可取消',
      cancelCompletedDeviceBlocked: '已完成设备不可取消',
      strategyImmediate: '立即升级',
      strategyIdle: '空闲升级',
      strategyHoming: '归巢升级',
      statusPending: '待执行',
      statusRunning: '升级中',
      statusCompleted: '已完成',
      statusCancelled: '已取消',
      restartYes: '是',
      restartNo: '否',
      createDone: '发布任务创建成功',
      cancelTaskDone: '发布任务已取消',
      restoreTaskDone: '发布任务已恢复',
      progressTitle: '升级进度',
      progressDeviceName: '设备名称',
      progressIp: 'IP',
      progressStatus: '状态',
      progressPackage: '安装包',
      progressVersion: '版本号',
      progressUpdatedAt: '更新时间',
      progressCompletedAt: '完成时间',
      cancelDeviceDone: '设备升级已取消',
      restoreDeviceDone: '设备升级已恢复',
      noTargetHint: '未选目标时默认匹配该安装包类型下的全部设备',
      packageDescription: '安装包描述',
      selectTypeFirst: '先选择机器人类型，再选择机器人组，最后选择机器人',
      selectGroupFirst: '请先选择机器人组后再选择机器人',
      selectAllRobots: '全选机器人',
      searchPlaceholder: '按名称、安装包、目标、策略、创建人搜索',
    };
  }, [locale]);

  const robotCandidates = useMemo(
    () => upgradeDeviceCatalog.filter((item) => item.robotType !== 'SERVER' && item.robot !== '-'),
    [],
  );

  const robotTypeOptions = useMemo(
    () => Array.from(new Set(robotCandidates.map((item) => item.robotType))),
    [robotCandidates],
  );

  const robotGroupOptions = useMemo(
    () => Array.from(new Set(robotCandidates.map((item) => item.robotGroup))),
    [robotCandidates],
  );

  const robotOptions = useMemo(
    () => Array.from(new Set(robotCandidates.map((item) => item.robot))),
    [robotCandidates],
  );

  const selectedPackage = useMemo(
    () => packageList.find((item) => item.name === watchedPackageName),
    [packageList, watchedPackageName],
  );

  const strategyText = (value: UpgradeStrategy) => {
    if (value === 'immediate') {
      return label.strategyImmediate;
    }
    if (value === 'idle') {
      return label.strategyIdle;
    }
    return label.strategyHoming;
  };

  const filteredTableData = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) {
      return tableData;
    }
    return tableData.filter((item) => {
      const text = `${item.name} ${item.packageName} ${item.targetRobots.join(' ')} ${item.targetRobotGroups.join(' ')} ${item.targetRobotTypes.join(' ')} ${strategyText(item.strategy)} ${item.creator} ${item.status}`.toLowerCase();
      return text.includes(normalized);
    });
  }, [keyword, tableData]);

  const statusText = (value: PublishStatus | DeviceUpgradeStatus) => {
    if (value === 'pending') {
      return label.statusPending;
    }
    if (value === 'running' || value === 'upgrading') {
      return label.statusRunning;
    }
    if (value === 'completed') {
      return label.statusCompleted;
    }
    return label.statusCancelled;
  };

  const statusColor = (value: PublishStatus | DeviceUpgradeStatus) => {
    if (value === 'pending') {
      return 'default';
    }
    if (value === 'running' || value === 'upgrading') {
      return 'processing';
    }
    if (value === 'completed') {
      return 'success';
    }
    return 'warning';
  };

  const refreshProgressTask = (taskId: string, nextList: PublishManageRecord[]) => {
    const next = nextList.find((item) => item.id === taskId) ?? null;
    setProgressTask(next);
  };

  const restorePublishTask = (task: PublishManageRecord) => {
    setTableData((current) => {
      const next = current.map((item) => {
        if (item.id !== task.id) {
          return item;
        }
        const recoveredDevices = item.devices.map((device) =>
          device.status === 'cancelled'
            ? {
                ...device,
                status: 'pending' as DeviceUpgradeStatus,
                updatedAt: nowText(),
                completedAt: '-',
              }
            : device,
        );
        const nextDevices =
          item.strategy === 'immediate'
            ? recoveredDevices.map((device, index) =>
                device.status === 'pending' && index === 0 ? { ...device, status: 'upgrading' as DeviceUpgradeStatus } : device,
              )
            : recoveredDevices;
        const nextStatus = resolveStatusAfterDeviceChange(nextDevices);
        return {
          ...item,
          devices: nextDevices,
          status: nextStatus,
          completedAt: nextStatus === 'completed' ? item.completedAt : '-',
        };
      });
      refreshProgressTask(task.id, next);
      return next;
    });
    messageApi.success(label.restoreTaskDone);
  };

  const cancelPublishTask = (task: PublishManageRecord) => {
    setTableData((current) => {
      const next = current.map((item) => {
        if (item.id !== task.id) {
          return item;
        }
        return {
          ...item,
          status: 'cancelled' as PublishStatus,
          completedAt: nowText(),
          devices: item.devices.map((device) =>
            device.status === 'completed'
              ? device
              : {
                  ...device,
                  status: 'cancelled' as DeviceUpgradeStatus,
                  updatedAt: nowText(),
                  completedAt: nowText(),
                },
          ),
        };
      });
      refreshProgressTask(task.id, next);
      return next;
    });
    messageApi.warning(label.cancelTaskDone);
  };

  const cancelDeviceUpgrade = (taskId: string, deviceId: string) => {
    setTableData((current) => {
      const next = current.map((task) => {
        if (task.id !== taskId) {
          return task;
        }
        const nextDevices = task.devices.map((device) =>
          device.id === deviceId && device.status !== 'completed'
            ? {
                ...device,
                status: 'cancelled' as DeviceUpgradeStatus,
                updatedAt: nowText(),
                completedAt: nowText(),
              }
            : device,
        );
        const nextStatus = resolveStatusAfterDeviceChange(nextDevices);
        return {
          ...task,
          devices: nextDevices,
          status: nextStatus,
          completedAt: nextStatus === 'completed' || nextStatus === 'cancelled' ? nowText() : '-',
        };
      });
      refreshProgressTask(taskId, next);
      return next;
    });
    messageApi.warning(label.cancelDeviceDone);
  };

  const restoreDeviceUpgrade = (taskId: string, deviceId: string) => {
    setTableData((current) => {
      const next = current.map((task) => {
        if (task.id !== taskId) {
          return task;
        }
        const nextDevices = task.devices.map((device) =>
          device.id === deviceId && device.status === 'cancelled'
            ? {
                ...device,
                status: task.strategy === 'immediate' ? ('upgrading' as DeviceUpgradeStatus) : ('pending' as DeviceUpgradeStatus),
                updatedAt: nowText(),
                completedAt: '-',
              }
            : device,
        );
        const nextStatus = resolveStatusAfterDeviceChange(nextDevices);
        return {
          ...task,
          devices: nextDevices,
          status: nextStatus,
          completedAt: nextStatus === 'completed' ? task.completedAt : '-',
        };
      });
      refreshProgressTask(taskId, next);
      return next;
    });
    messageApi.success(label.restoreDeviceDone);
  };

  const columns: ColumnsType<PublishManageRecord> = [
    { title: label.tableName, dataIndex: 'name', key: 'name', width: 220 },
    { title: label.tablePackage, dataIndex: 'packageName', key: 'packageName', width: 220 },
    {
      title: label.tableTargetRobot,
      dataIndex: 'targetRobots',
      key: 'targetRobots',
      width: 200,
      render: (value: string[]) => (value.length > 0 ? value.join(' / ') : '-'),
    },
    {
      title: label.tableTargetGroup,
      dataIndex: 'targetRobotGroups',
      key: 'targetRobotGroups',
      width: 180,
      render: (value: string[]) => (value.length > 0 ? value.join(' / ') : '-'),
    },
    {
      title: label.tableTargetType,
      dataIndex: 'targetRobotTypes',
      key: 'targetRobotTypes',
      width: 180,
      render: (value: string[]) => (value.length > 0 ? value.join(' / ') : '-'),
    },
    { title: label.tableStrategy, dataIndex: 'strategy', key: 'strategy', width: 130, render: (value: UpgradeStrategy) => strategyText(value) },
    { title: label.tableRestart, dataIndex: 'restartAfterUpgrade', key: 'restartAfterUpgrade', width: 110, render: (value: boolean) => (value ? label.restartYes : label.restartNo) },
    {
      title: label.tableStatus,
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value: PublishStatus) => <Tag color={statusColor(value)}>{statusText(value)}</Tag>,
    },
    { title: label.tableCreator, dataIndex: 'creator', key: 'creator', width: 100 },
    { title: label.tableCreatedAt, dataIndex: 'createdAt', key: 'createdAt', width: 170 },
    { title: label.tableCompletedAt, dataIndex: 'completedAt', key: 'completedAt', width: 170 },
    {
      title: label.tableAction,
      key: 'action',
      width: 170,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Button type="link" onClick={() => setProgressTask(record)}>
            {label.actionProgress}
          </Button>
          {record.status === 'cancelled' ? (
            <Popconfirm
              title={label.restoreTaskConfirmTitle}
              description={record.name}
              okText={label.actionRestore}
              cancelText={locale === 'en-US' ? 'Back' : '返回'}
              onConfirm={() => restorePublishTask(record)}
            >
              <Button type="link">{label.actionRestore}</Button>
            </Popconfirm>
          ) : (
            <Popconfirm
              title={label.cancelTaskConfirmTitle}
              description={record.name}
              okText={label.actionCancel}
              cancelText={locale === 'en-US' ? 'Back' : '返回'}
              okButtonProps={{ danger: true }}
              onConfirm={() => cancelPublishTask(record)}
            >
              <Button type="link" danger>
                {label.actionCancel}
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const progressColumns: ColumnsType<DeviceUpgradeRecord> = [
    { title: label.progressDeviceName, dataIndex: 'deviceName', key: 'deviceName', width: 190 },
    { title: label.progressIp, dataIndex: 'ip', key: 'ip', width: 150 },
    {
      title: label.progressStatus,
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value: DeviceUpgradeStatus) => <Tag color={statusColor(value)}>{statusText(value)}</Tag>,
    },
    { title: label.progressPackage, dataIndex: 'packageName', key: 'packageName', width: 220 },
    { title: label.progressVersion, dataIndex: 'version', key: 'version', width: 110 },
    { title: label.progressUpdatedAt, dataIndex: 'updatedAt', key: 'updatedAt', width: 170 },
    { title: label.progressCompletedAt, dataIndex: 'completedAt', key: 'completedAt', width: 170 },
    {
      title: label.tableAction,
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, device) => (
        progressTask ? (
          device.status === 'cancelled' ? (
            <Popconfirm
              title={label.restoreDeviceConfirmTitle}
              description={`${device.deviceName} (${device.ip})`}
              okText={label.actionRestore}
              cancelText={locale === 'en-US' ? 'Back' : '返回'}
              onConfirm={() => restoreDeviceUpgrade(progressTask.id, device.id)}
            >
              <Button type="link">{label.actionRestore}</Button>
            </Popconfirm>
          ) : (
            <Popconfirm
              title={label.cancelDeviceConfirmTitle}
              description={`${device.deviceName} (${device.ip})`}
              okText={label.actionCancel}
              cancelText={locale === 'en-US' ? 'Back' : '返回'}
              okButtonProps={{ danger: true }}
              onConfirm={() => cancelDeviceUpgrade(progressTask.id, device.id)}
            >
              <Button type="link" danger>
                {label.actionCancel}
              </Button>
            </Popconfirm>
          )
        ) : (
          <Button type="link" disabled>
            {label.actionCancel}
          </Button>
        )
      ),
    },
  ];

  const submitCreate = () => {
    form
      .validateFields()
      .then((values) => {
        const devices = buildUpgradeDevices(
          values.packageName,
          values.targetRobots ?? [],
          values.targetRobotGroups ?? [],
          values.targetRobotTypes ?? [],
          values.strategy,
          packageList,
          upgradeDeviceCatalog,
        );
        const creator = getCurrentUser()?.username ?? 'admin';
        const next: PublishManageRecord = {
          id: `PUB-${Date.now()}`,
          name: values.name,
          packageName: values.packageName,
          targetRobots: values.targetRobots ?? [],
          targetRobotGroups: values.targetRobotGroups ?? [],
          targetRobotTypes: values.targetRobotTypes ?? [],
          strategy: values.strategy,
          restartAfterUpgrade: values.restartAfterUpgrade,
          status: devices.some((item) => item.status === 'upgrading') ? 'running' : 'pending',
          creator,
          createdAt: nowText(),
          completedAt: '-',
          devices,
        };
        setTableData((current) => [next, ...current]);
        setCreateOpen(false);
        form.resetFields();
        messageApi.success(label.createDone);
      })
      .catch(() => {});
  };

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {contextHolder}
      <Card>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {t('menu.publishManage')}
          </Typography.Title>
          <Input
            allowClear
            placeholder={label.searchPlaceholder}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              {label.create}
            </Button>
          </Space>
        </Space>
      </Card>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredTableData}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          scroll={{ x: 2200 }}
        />
      </Card>

      <Modal
        title={label.createTitle}
        open={createOpen}
        onCancel={() => {
          setCreateOpen(false);
          form.resetFields();
        }}
        onOk={submitCreate}
        okText={locale === 'en-US' ? 'Create' : '创建'}
        cancelText={locale === 'en-US' ? 'Cancel' : '取消'}
        width={760}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            targetRobots: [],
            targetRobotGroups: [],
            targetRobotTypes: [],
            strategy: 'immediate',
            restartAfterUpgrade: true,
          }}
        >
          <Form.Item label={label.tableName} name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label={label.tablePackage} name="packageName" rules={[{ required: true }]}>
            <Select
              options={packageList.map((item) => ({
                label: `${item.name} (${item.description})`,
                value: item.name,
              }))}
              onChange={(value: string) => {
                const currentPackage = packageList.find((item) => item.name === value);
                if (currentPackage?.type === 'cloud') {
                  form.setFieldsValue({
                    targetRobotTypes: [],
                    targetRobotGroups: [],
                    targetRobots: [],
                  });
                }
              }}
            />
          </Form.Item>
          <Form.Item label={label.packageDescription}>
            <Input.TextArea value={selectedPackage?.description ?? '-'} readOnly rows={2} />
          </Form.Item>
          <Form.Item label={label.tableTargetType} name="targetRobotTypes">
            <Select
              mode="multiple"
              allowClear
              options={robotTypeOptions.map((item) => ({ label: item, value: item }))}
            />
          </Form.Item>
          <Form.Item label={label.tableTargetGroup} name="targetRobotGroups">
            <Select
              mode="multiple"
              allowClear
              options={robotGroupOptions.map((item) => ({ label: item, value: item }))}
            />
          </Form.Item>
          <Form.Item label={label.tableTargetRobot} name="targetRobots">
            <Select
              mode="multiple"
              allowClear
              options={robotOptions.map((item) => ({ label: item, value: item }))}
            />
          </Form.Item>
          <Typography.Text type="secondary">{label.noTargetHint}</Typography.Text>
          <Form.Item label={label.tableStrategy} name="strategy" rules={[{ required: true }]}>
            <Select
              options={[
                { label: label.strategyImmediate, value: 'immediate' },
                { label: label.strategyIdle, value: 'idle' },
                { label: label.strategyHoming, value: 'homing' },
              ]}
            />
          </Form.Item>
          <Form.Item label={label.tableRestart} name="restartAfterUpgrade" rules={[{ required: true }]}>
            <Select
              options={[
                { label: label.restartYes, value: true },
                { label: label.restartNo, value: false },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={progressTask ? `${label.progressTitle} - ${progressTask.name}` : label.progressTitle}
        open={Boolean(progressTask)}
        onCancel={() => setProgressTask(null)}
        footer={null}
        width={1080}
      >
        <Table
          rowKey="id"
          columns={progressColumns}
          dataSource={progressTask?.devices ?? []}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          scroll={{ x: 1200 }}
          size="small"
        />
      </Modal>
    </Space>
  );
}
