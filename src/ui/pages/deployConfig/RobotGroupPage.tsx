import { DeleteOutlined, EditOutlined, ExclamationCircleFilled, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Modal, Space, Table, Transfer, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';

interface RobotItem {
  key: string;
  title: string;
  description: string;
}

interface RobotGroupRecord {
  id: string;
  groupNo: string;
  groupName: string;
  description: string;
  robotKeys: string[];
  createdAt: string;
}

type GroupFormValues = {
  groupName: string;
  description: string;
  robotKeys: string[];
};

const robotOptions: RobotItem[] = [
  { key: 'RB-001', title: 'RB-001', description: '巡检机器人-一号' },
  { key: 'RB-002', title: 'RB-002', description: '巡检机器人-二号' },
  { key: 'RB-003', title: 'RB-003', description: '搬运机器人-三号' },
  { key: 'RB-004', title: 'RB-004', description: '机械臂-四号' },
  { key: 'RB-005', title: 'RB-005', description: '巡检机器人-五号' },
  { key: 'RB-006', title: 'RB-006', description: '机械臂-六号' },
];

const initialList: RobotGroupRecord[] = [
  {
    id: 'group-1',
    groupNo: 'RG-001',
    groupName: '巡检A组',
    description: '主产线巡检组',
    robotKeys: ['RB-001', 'RB-002'],
    createdAt: '2026-02-21 10:00',
  },
];

export function RobotGroupPage() {
  const [form] = Form.useForm<GroupFormValues>();
  const [messageApi, contextHolder] = message.useMessage();
  const [list, setList] = useState<RobotGroupRecord[]>(initialList);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RobotGroupRecord | null>(null);
  const [robotSelectOpen, setRobotSelectOpen] = useState(false);
  const [targetKeys, setTargetKeys] = useState<string[]>([]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setTargetKeys([]);
    setModalOpen(true);
  };

  const openEdit = (record: RobotGroupRecord) => {
    setEditing(record);
    form.setFieldsValue({
      groupName: record.groupName,
      description: record.description,
      robotKeys: record.robotKeys,
    });
    setTargetKeys(record.robotKeys);
    setModalOpen(true);
  };

  const closeModal = () => {
    setEditing(null);
    setModalOpen(false);
    form.resetFields();
    setTargetKeys([]);
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
                robotKeys: values.robotKeys,
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
          robotKeys: values.robotKeys,
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
    {
      title: '机器人数量',
      key: 'robotCount',
      width: 120,
      render: (_, record) => record.robotKeys.length,
    },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Button type="link" onClick={() => messageApi.info(`${record.groupName} 机器人: ${record.robotKeys.join(', ') || '-'}`)}>
            查看机器人
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
        <Table rowKey="id" columns={columns} dataSource={list} pagination={{ pageSize: 8, showSizeChanger: false }} scroll={{ x: 900 }} />
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
        <Form form={form} layout="vertical" initialValues={{ robotKeys: [] }}>
          <Form.Item label="分组名称" name="groupName" rules={[{ required: true, message: '请输入分组名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="分组描述" name="description" rules={[{ required: true, message: '请输入分组描述' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="选择机器人" name="robotKeys" rules={[{ required: true, type: 'array', min: 1, message: '请至少选择一个机器人' }]}>
            <Input
              readOnly
              value={targetKeys.join(', ')}
              placeholder="请选择机器人"
              addonAfter={
                <Button type="link" style={{ paddingInline: 0 }} onClick={() => setRobotSelectOpen(true)}>
                  选择
                </Button>
              }
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="选择机器人"
        open={robotSelectOpen}
        onCancel={() => setRobotSelectOpen(false)}
        onOk={() => {
          form.setFieldValue('robotKeys', targetKeys);
          setRobotSelectOpen(false);
        }}
        okText="确认"
        cancelText="取消"
        width={920}
      >
        <Transfer
          dataSource={robotOptions}
          showSearch
          listStyle={{ width: 390, height: 340 }}
          targetKeys={targetKeys}
          onChange={(nextTargetKeys) => setTargetKeys(nextTargetKeys.map((item) => String(item)))}
          render={(item) => `${item.title} - ${item.description}`}
          filterOption={(inputValue, item) => item.title.includes(inputValue) || item.description.includes(inputValue)}
          titles={['机器人列表', '已选机器人']}
        />
      </Modal>
    </Space>
  );
}
