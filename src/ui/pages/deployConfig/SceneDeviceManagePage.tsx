import { DeleteOutlined, EditOutlined, ExclamationCircleFilled, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Modal, Select, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useState } from 'react';
import {
  createDeployDeviceApi,
  deleteDeployDeviceApi,
  getDeployDeviceListApi,
  updateDeployDeviceApi,
  type DeployDeviceVO,
} from '../../../shared/api/deployDeviceApi';

type DeviceFormValues = {
  code: string;
  name: string;
  type: string;
  mapCode: string;
  ip: string;
};

const DEFAULT_MAP_CODE = 'MAP-001';

export function SceneDeviceManagePage() {
  const [messageApi, contextHolder] = message.useMessage();
  const [modalApi, modalContextHolder] = Modal.useModal();
  const [form] = Form.useForm<DeviceFormValues>();
  const [list, setList] = useState<DeployDeviceVO[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapCode, setMapCode] = useState(DEFAULT_MAP_CODE);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DeployDeviceVO | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchList = useCallback(async () => {
    if (!mapCode.trim()) {
      setList([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getDeployDeviceListApi({ mapCode: mapCode.trim() });
      const data = res.data;
      const items = data?.list ?? [];
      setList(Array.isArray(items) ? items : []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [mapCode]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      code: '',
      name: '',
      type: 'callBox',
      mapCode: mapCode || DEFAULT_MAP_CODE,
      ip: '',
    });
    setModalOpen(true);
  };

  const openEdit = (record: DeployDeviceVO) => {
    setEditing(record);
    form.setFieldsValue({
      code: record.code,
      name: record.name,
      type: record.type,
      mapCode: record.mapCode,
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
    setSaving(true);
    try {
      if (editing) {
        await updateDeployDeviceApi(editing.id, {
          name: values.name,
          type: values.type,
          mapCode: values.mapCode,
          ip: values.ip,
        });
        messageApi.success('设备已更新');
        setList((prev) =>
          prev.map((item) =>
            String(item.id) === String(editing.id)
              ? { ...item, name: values.name, type: values.type, mapCode: values.mapCode, ip: values.ip }
              : item,
          ),
        );
      } else {
        const res = await createDeployDeviceApi({
          code: values.code,
          name: values.name,
          type: values.type,
          mapCode: values.mapCode,
          ip: values.ip,
        });
        messageApi.success('设备已创建');
        const created = res.data;
        if (created) setList((prev) => [created, ...prev]);
        else await fetchList();
      }
      closeModal();
    } catch {
      messageApi.error(editing ? '更新失败' : '创建失败');
    } finally {
      setSaving(false);
    }
  };

  const deleteRecord = (record: DeployDeviceVO) => {
    modalApi.confirm({
      title: '确定删除设备',
      icon: <ExclamationCircleFilled />,
      content: `${record.name} (${record.code})`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteDeployDeviceApi(record.id);
          setList((prev) => prev.filter((item) => item.id !== record.id));
          messageApi.success('设备已删除');
        } catch {
          messageApi.error('删除失败');
        }
      },
    });
  };

  const columns: ColumnsType<DeployDeviceVO> = [
    { title: '编码', dataIndex: 'code', key: 'code', width: 140, render: (code: string) => code ?? '-' },
    { title: '名称', dataIndex: 'name', key: 'name', width: 180 },
    { title: '类型', dataIndex: 'type', key: 'type', width: 120 },
    { title: '分组', dataIndex: 'group', key: 'group', width: 120 },
    { title: '地图编码', dataIndex: 'mapCode', key: 'mapCode', width: 120 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'online' ? 'success' : 'default'}>{status === 'online' ? '在线' : '离线'}</Tag>
      ),
    },
    { title: 'IP', dataIndex: 'ip', key: 'ip', width: 140 },
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
          <Space wrap>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="地图编码（如 MAP-001）"
              value={mapCode}
              onChange={(e) => setMapCode(e.target.value)}
              onPressEnter={fetchList}
              style={{ width: 260 }}
            />
            <Button type="primary" onClick={fetchList} loading={loading}>
              查询
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              新增
            </Button>
          </Space>
        </Space>
      </Card>

      <Card>
        <Table
          rowKey={(record) => String(record.id)}
          loading={loading}
          columns={columns}
          dataSource={list}
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
        confirmLoading={saving}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item label="编码" name="code" rules={[{ required: true, message: '请输入编码' }]}>
            <Input disabled={Boolean(editing)} placeholder="例如：DEV-001" />
          </Form.Item>
          <Form.Item label="名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="例如：呼叫盒A-01" />
          </Form.Item>
          <Form.Item label="类型" name="type" rules={[{ required: true, message: '请输入类型' }]}>
            <Select
              options={[
                { value: 'callBox', label: '呼叫盒' },
                { value: 'terminal', label: '终端' },
                { value: 'camera', label: '相机' },
              ]}
              placeholder="如：callBox、终端、相机"
              allowClear
            />
          </Form.Item>
          <Form.Item label="地图编码" name="mapCode" rules={[{ required: true, message: '请输入地图编码' }]}>
            <Input placeholder="例如：MAP-001" />
          </Form.Item>
          <Form.Item label="IP" name="ip" rules={[{ required: true, message: '请输入 IP' }]}>
            <Input placeholder="例如：10.10.5.101" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
