import { DeleteOutlined, EditOutlined, ExclamationCircleFilled, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Modal, Select, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect } from 'react';
import { useWorkstationManage } from '../../logic/workstation/useWorkstationManage';
import type { Workstation, WorkstationStatus } from '../../shared/types/workstation';

const statusColorMap: Record<WorkstationStatus, string> = {
  运行中: 'success',
  维护中: 'warning',
  空闲: 'default',
};

export function WorkstationManagePage() {
  const [form] = Form.useForm();
  const { keyword, setKeyword, filteredList, editingRecord, openEdit, closeEdit, saveEdit, removeWorkstation } =
    useWorkstationManage();

  useEffect(() => {
    if (!editingRecord) {
      form.resetFields();
      return;
    }

    form.setFieldsValue({
      id: editingRecord.id,
      name: editingRecord.name,
      factory: editingRecord.factory,
      location: editingRecord.location,
      status: editingRecord.status,
      stationListRaw: editingRecord.stationList.join(', '),
    });
  }, [editingRecord, form]);

  const columns: ColumnsType<Workstation> = [
    { title: '作业台 ID', dataIndex: 'id', key: 'id', width: 130 },
    { title: '名称', dataIndex: 'name', key: 'name', width: 180 },
    { title: '所属工厂', dataIndex: 'factory', key: 'factory', width: 120 },
    {
      title: '质检工位数量',
      dataIndex: 'inspectionStationCount',
      key: 'inspectionStationCount',
      width: 120,
      sorter: (a, b) => a.inspectionStationCount - b.inspectionStationCount,
    },
    { title: '所属位置', dataIndex: 'location', key: 'location', width: 160 },
    {
      title: '工位列表',
      dataIndex: 'stationList',
      key: 'stationList',
      render: (stationList: string[]) => (
        <Space size={[4, 4]} wrap>
          {stationList.map((item) => (
            <Tag key={item}>{item}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '作业状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: WorkstationStatus) => <Tag color={statusColorMap[status]}>{status}</Tag>,
      filters: [
        { text: '运行中', value: '运行中' },
        { text: '维护中', value: '维护中' },
        { text: '空闲', value: '空闲' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size={8}>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: '确认删除该作业台吗？',
                icon: <ExclamationCircleFilled />,
                content: `${record.name}（${record.id}）`,
                okText: '删除',
                okButtonProps: { danger: true },
                cancelText: '取消',
                onOk: () => removeWorkstation(record.id),
              });
            }}
          >
            删除
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
            工作站管理
          </Typography.Title>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="按作业台 ID、名称、工厂、位置、工位编号搜索"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </Space>
      </Card>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredList}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title="编辑作业台"
        open={Boolean(editingRecord)}
        onCancel={closeEdit}
        onOk={() => form.submit()}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) =>
            saveEdit({
              id: values.id,
              name: values.name,
              factory: values.factory,
              location: values.location,
              status: values.status,
              stationListRaw: values.stationListRaw,
            })
          }
        >
          <Form.Item label="作业台 ID" name="id">
            <Input disabled />
          </Form.Item>
          <Form.Item label="名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="所属工厂" name="factory" rules={[{ required: true, message: '请输入所属工厂' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="所属位置" name="location" rules={[{ required: true, message: '请输入所属位置' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="作业状态" name="status" rules={[{ required: true, message: '请选择作业状态' }]}>
            <Select
              options={[
                { label: '运行中', value: '运行中' },
                { label: '维护中', value: '维护中' },
                { label: '空闲', value: '空闲' },
              ]}
            />
          </Form.Item>
          <Form.Item label="工位列表（英文逗号分隔）" name="stationListRaw" rules={[{ required: true, message: '请输入工位列表' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
