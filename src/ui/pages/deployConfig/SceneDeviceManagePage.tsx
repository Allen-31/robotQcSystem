import { DeleteOutlined, EditOutlined, ExclamationCircleFilled, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Modal, Select, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';

type SceneDeviceRecord = {
  id: string;
  code: string;
  name: string;
  type: string;
  onlineStatus: 'online' | 'offline';
  hasAlarm: boolean;
  alarmDetail: string;
  ip: string;
};

type DeviceFormValues = Pick<SceneDeviceRecord, 'code' | 'name' | 'type' | 'onlineStatus' | 'hasAlarm' | 'alarmDetail' | 'ip'>;

const defaultDevices: SceneDeviceRecord[] = [
  {
    id: 'dev-1',
    code: 'DEV-001',
    name: '主控工位终端',
    type: '终端',
    onlineStatus: 'online',
    hasAlarm: false,
    alarmDetail: '',
    ip: '192.168.1.10',
  },
  {
    id: 'dev-2',
    code: 'DEV-002',
    name: '产线相机一号',
    type: '相机',
    onlineStatus: 'offline',
    hasAlarm: true,
    alarmDetail: '网络中断',
    ip: '192.168.1.20',
  },
];

export function SceneDeviceManagePage() {
  const [messageApi, contextHolder] = message.useMessage();
  const [modalApi, modalContextHolder] = Modal.useModal();
  const [form] = Form.useForm<DeviceFormValues>();
  const [list, setList] = useState<SceneDeviceRecord[]>(defaultDevices);
  const [keyword, setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SceneDeviceRecord | null>(null);

  const filteredList = useMemo(() => {
    const value = keyword.trim().toLowerCase();
    if (!value) return list;
    return list.filter((item) =>
      `${item.code} ${item.name} ${item.type} ${item.ip}`.toLowerCase().includes(value),
    );
  }, [keyword, list]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      code: `DEV-${String(list.length + 1).padStart(3, '0')}`,
      onlineStatus: 'online',
      hasAlarm: false,
    } as Partial<DeviceFormValues>);
    setModalOpen(true);
  };

  const openEdit = (record: SceneDeviceRecord) => {
    setEditing(record);
    form.setFieldsValue({
      code: record.code,
      name: record.name,
      type: record.type,
      onlineStatus: record.onlineStatus,
      hasAlarm: record.hasAlarm,
      alarmDetail: record.alarmDetail,
      ip: record.ip,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setEditing(null);
    setModalOpen(false);
    form.resetFields();
  };

  const saveRecord = async () => {
    const values = await form.validateFields();
    if (editing) {
      setList((prev) =>
        prev.map((item) =>
          item.id === editing.id
            ? {
                ...item,
                ...values,
              }
            : item,
        ),
      );
      messageApi.success('设备已更新');
    } else {
      setList((prev) => [
        {
          id: `dev-${Date.now()}`,
          code: values.code,
          name: values.name,
          type: values.type,
          onlineStatus: values.onlineStatus,
          hasAlarm: values.hasAlarm,
          alarmDetail: values.alarmDetail ?? '',
          ip: values.ip,
        },
        ...prev,
      ]);
      messageApi.success('设备已创建');
    }
    closeModal();
  };

  const deleteRecord = (record: SceneDeviceRecord) => {
    modalApi.confirm({
      title: '确定删除设备',
      icon: <ExclamationCircleFilled />,
      content: `${record.name} (${record.code})`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        setList((prev) => prev.filter((item) => item.id !== record.id));
        messageApi.success('设备已删除');
      },
    });
  };

  const columns: ColumnsType<SceneDeviceRecord> = [
    { title: '编码', dataIndex: 'code', key: 'code', width: 140 },
    { title: '名称', dataIndex: 'name', key: 'name', width: 180 },
    { title: '类型', dataIndex: 'type', key: 'type', width: 120 },
    {
      title: '在线状态',
      dataIndex: 'onlineStatus',
      key: 'onlineStatus',
      width: 120,
      render: (value: SceneDeviceRecord['onlineStatus']) => (
        <Tag color={value === 'online' ? 'success' : 'default'}>{value === 'online' ? '在线' : '离线'}</Tag>
      ),
    },
    {
      title: '是否异常',
      dataIndex: 'hasAlarm',
      key: 'hasAlarm',
      width: 120,
      render: (value: boolean) => <Tag color={value ? 'error' : 'success'}>{value ? '是' : '否'}</Tag>,
    },
    { title: '异常详情', dataIndex: 'alarmDetail', key: 'alarmDetail', width: 220, ellipsis: true },
    { title: 'IP', dataIndex: 'ip', key: 'ip', width: 160 },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => deleteRecord(record)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {contextHolder}
      {modalContextHolder}
      <Card>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            设备管理
          </Typography.Title>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="按编码、名称、类型、IP 查询"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增
          </Button>
        </Space>
      </Card>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredList}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 1100 }}
        />
      </Card>

      <Modal
        title={editing ? '编辑设备' : '新增设备'}
        open={modalOpen}
        onCancel={closeModal}
        onOk={saveRecord}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item label="编码" name="code" rules={[{ required: true, message: '请输入编码' }]}>
            <Input disabled={Boolean(editing)} placeholder="例如：DEV-001" />
          </Form.Item>
          <Form.Item label="名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="请输入设备名称" />
          </Form.Item>
          <Form.Item label="类型" name="type" rules={[{ required: true, message: '请输入类型' }]}>
            <Input placeholder="例如：终端、相机" />
          </Form.Item>
          <Form.Item label="在线状态" name="onlineStatus" rules={[{ required: true, message: '请选择在线状态' }]}>
            <Select
              options={[
                { value: 'online', label: '在线' },
                { value: 'offline', label: '离线' },
              ]}
            />
          </Form.Item>
          <Form.Item label="是否异常" name="hasAlarm" rules={[{ required: true, message: '请选择是否异常' }]}>
            <Select
              options={[
                { value: false, label: '否' },
                { value: true, label: '是' },
              ]}
            />
          </Form.Item>
          <Form.Item label="异常详情" name="alarmDetail">
            <Input placeholder="例如：网络中断、电源故障等" />
          </Form.Item>
          <Form.Item label="IP" name="ip" rules={[{ required: true, message: '请输入 IP' }]}>
            <Input placeholder="例如：192.168.1.10" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

