import { DeleteOutlined, EditOutlined, ExclamationCircleFilled, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Modal, Space, Table, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';

interface RobotGroupRecord {
  id: string;
  groupNo: string;
  groupName: string;
  description: string;
  createdAt: string;
}

type GroupFormValues = {
  groupName: string;
  description: string;
};

const initialList: RobotGroupRecord[] = [
  {
    id: 'group-1',
    groupNo: 'RG-001',
    groupName: '巡检A组',
    description: '主产线巡检组',
    createdAt: '2026-02-21 10:00',
  },
  {
    id: 'group-2',
    groupNo: 'RG-002',
    groupName: '巡检B组',
    description: '二号产线巡检组',
    createdAt: '2026-02-21 10:15',
  },
  {
    id: 'group-3',
    groupNo: 'RG-003',
    groupName: '搬运A组',
    description: '仓储与上料搬运组',
    createdAt: '2026-02-21 10:30',
  },
  {
    id: 'group-4',
    groupNo: 'RG-004',
    groupName: '搬运B组',
    description: '下料与周转搬运组',
    createdAt: '2026-02-21 10:45',
  },
  {
    id: 'group-5',
    groupNo: 'RG-005',
    groupName: '协作臂A组',
    description: '端子压接工位协作组',
    createdAt: '2026-02-21 11:00',
  },
  {
    id: 'group-6',
    groupNo: 'RG-006',
    groupName: '协作臂B组',
    description: '装配与复检协作组',
    createdAt: '2026-02-21 11:15',
  },
];

export function RobotGroupPage() {
  const [form] = Form.useForm<GroupFormValues>();
  const [messageApi, contextHolder] = message.useMessage();
  const [list, setList] = useState<RobotGroupRecord[]>(initialList);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RobotGroupRecord | null>(null);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record: RobotGroupRecord) => {
    setEditing(record);
    form.setFieldsValue({
      groupName: record.groupName,
      description: record.description,
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
                groupName: values.groupName,
                description: values.description,
              }
            : item,
        ),
      );
      messageApi.success('分组已更新');
    } else {
      setList((prev) => [
        {
          id: `group-${Date.now()}`,
          groupNo: `RG-${String(prev.length + 1).padStart(3, '0')}`,
          groupName: values.groupName,
          description: values.description,
          createdAt: new Date().toLocaleString('zh-CN', { hour12: false }),
        },
        ...prev,
      ]);
      messageApi.success('分组已创建');
    }
    closeModal();
  };

  const deleteRecord = (record: RobotGroupRecord) => {
    Modal.confirm({
      title: '确认删除该分组吗？',
      icon: <ExclamationCircleFilled />,
      content: `${record.groupNo} - ${record.groupName}`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => setList((prev) => prev.filter((item) => item.id !== record.id)),
    });
  };

  const columns: ColumnsType<RobotGroupRecord> = [
    { title: '分组编号', dataIndex: 'groupNo', key: 'groupNo', width: 120 },
    { title: '分组名称', dataIndex: 'groupName', key: 'groupName', width: 180 },
    { title: '分组描述', dataIndex: 'description', key: 'description', width: 260 },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
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
      <Card>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            机器人分组管理
          </Typography.Title>
          <Space wrap>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              新增
            </Button>
            <Button onClick={() => messageApi.success('导入成功')}>导入</Button>
            <Button onClick={() => messageApi.success('导出成功')}>导出</Button>
          </Space>
        </Space>
      </Card>

      <Card>
        <Table rowKey="id" columns={columns} dataSource={list} pagination={{ pageSize: 8, showSizeChanger: false }} scroll={{ x: 760 }} />
      </Card>

      <Modal
        title={editing ? '编辑分组' : '新增分组'}
        open={modalOpen}
        onCancel={closeModal}
        onOk={saveRecord}
        okText="保存"
        cancelText="取消"
        width={720}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item label="分组名称" name="groupName" rules={[{ required: true, message: '请输入分组名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="分组描述" name="description" rules={[{ required: true, message: '请输入分组描述' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
