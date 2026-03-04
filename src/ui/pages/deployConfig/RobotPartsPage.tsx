import { DeleteOutlined, EditOutlined, ExclamationCircleFilled, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Col, Form, Input, Modal, Row, Space, Table, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { getStoredRobotParts, setStoredRobotParts, type RobotPartRecord } from '../../../logic/deployConfig/robotPartStore';

type PartFormValues = Pick<RobotPartRecord, 'partNo' | 'name' | 'type' | 'model' | 'vendor'>;

const typeOptions = ['电机', '传感器', '控制板', '执行件'];

export function RobotPartsPage() {
  const [form] = Form.useForm<PartFormValues>();
  const [messageApi, contextHolder] = message.useMessage();
  const [modalApi, modalContextHolder] = Modal.useModal();
  const [list, setList] = useState<RobotPartRecord[]>(getStoredRobotParts);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RobotPartRecord | null>(null);

  const filteredList = useMemo(() => list, [list]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      partNo: `RP-${String(list.length + 1).padStart(3, '0')}`,
      type: typeOptions[0],
    });
    setModalOpen(true);
  };

  const openEdit = (record: RobotPartRecord) => {
    setEditing(record);
    form.setFieldsValue({
      partNo: record.partNo,
      name: record.name,
      type: record.type,
      model: record.model,
      vendor: record.vendor,
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
      setList((prev) => {
        const next = prev.map((item) => (item.id === editing.id ? { ...item, ...values } : item));
        setStoredRobotParts(next);
        return next;
      });
      messageApi.success('零部件已更新');
    } else {
      setList((prev) => {
        const next: RobotPartRecord[] = [
          {
            id: `part-${Date.now()}`,
            partNo: values.partNo,
            name: values.name,
            type: values.type,
            model: values.model,
            vendor: values.vendor,
            position: '其他',
            supplier: '-',
            lifecycle: '-',
            status: '启用',
            remark: '',
            technicalParams: [],
          },
          ...prev,
        ];
        setStoredRobotParts(next);
        return next;
      });
      messageApi.success('零部件已创建');
    }
    closeModal();
  };

  const deleteRecord = (record: RobotPartRecord) => {
    modalApi.confirm({
      title: '确认删除该零部件吗？',
      icon: <ExclamationCircleFilled />,
      content: `${record.partNo} - ${record.name}`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        messageApi.success('删除成功');
        setList((prev) => {
          const next = prev.filter((item) => item.id !== record.id);
          setStoredRobotParts(next);
          return next;
        });
      },
    });
  };

  const columns: ColumnsType<RobotPartRecord> = [
    { title: '编码', dataIndex: 'partNo', key: 'partNo', width: 120 },
    { title: '名称', dataIndex: 'name', key: 'name', width: 180 },
    { title: '类型', dataIndex: 'type', key: 'type', width: 120 },
    { title: '型号', dataIndex: 'model', key: 'model', width: 160 },
    { title: '厂商', dataIndex: 'vendor', key: 'vendor', width: 160 },
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
            机器人零部件类型
          </Typography.Title>
          <Space wrap style={{ width: '100%', justifyContent: 'flex-start' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              新增
            </Button>
            <Button onClick={() => messageApi.success('导入成功')}>导入</Button>
            <Button onClick={() => messageApi.success('导出成功')}>导出</Button>
          </Space>
        </Space>
      </Card>

      <Card>
        <Table rowKey="id" columns={columns} dataSource={filteredList} pagination={{ pageSize: 8, showSizeChanger: false }} scroll={{ x: 900 }} />
      </Card>

      <Modal
        title={editing ? '编辑零部件' : '新增零部件'}
        open={modalOpen}
        onCancel={closeModal}
        onOk={saveRecord}
        width={760}
        style={{ top: 24 }}
        styles={{ body: { paddingTop: 12 } }}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Card size="small" styles={{ body: { background: '#fafafa', borderRadius: 8 } }}>
            <Typography.Text type="secondary">基础信息</Typography.Text>
            <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
              <Form.Item label="编码" name="partNo" rules={[{ required: true, message: '请输入编码' }]}>
                <Input disabled={Boolean(editing)} placeholder="例如：RP-001" />
              </Form.Item>
              <Form.Item label="名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
                <Input placeholder="请输入零部件名称" />
              </Form.Item>
              <Form.Item label="类型" name="type" rules={[{ required: true, message: '请输入类型' }]}>
                <Input placeholder="例如：电机" />
              </Form.Item>
              <Form.Item label="型号" name="model" rules={[{ required: true, message: '请输入型号' }]}>
                <Input placeholder="例如：MTR-LW-02" />
              </Form.Item>
              <Form.Item label="厂商" name="vendor" rules={[{ required: true, message: '请输入厂商' }]}>
                <Input placeholder="例如：星辰机电" />
              </Form.Item>
            </Form>
          </Card>
        </Space>
      </Modal>
    </Space>
  );
}
