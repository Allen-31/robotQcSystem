import { DeleteOutlined, EditOutlined, ExclamationCircleFilled, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Col, Form, Input, Modal, Row, Select, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';

interface TechnicalParam {
  name: string;
  value: string;
  unit: string;
  range: string;
}

interface RobotPartRecord {
  id: string;
  partNo: string;
  name: string;
  type: string;
  model: string;
  vendor: string;
  supplier: string;
  lifecycle: string;
  status: '启用' | '停用';
  remark?: string;
  technicalParams: TechnicalParam[];
}

type PartFormValues = Omit<RobotPartRecord, 'id'>;

const typeOptions = ['电机', '传感器', '控制板', '执行件'];
const vendorOptions = ['智控科技', '海蓝电子', '星辰机电', '普航自动化'];

const initialList: RobotPartRecord[] = [
  {
    id: 'part-1',
    partNo: 'RP-001',
    name: '左手腕电机',
    type: '电机',
    model: 'MTR-LW-02',
    vendor: '星辰机电',
    supplier: '华北供应链',
    lifecycle: '5年',
    status: '启用',
    remark: '关键部件',
    technicalParams: [
      { name: '额定电压', value: '24', unit: 'V', range: '18~30' },
      { name: '最大扭矩', value: '12', unit: 'N.m', range: '0~20' },
      { name: '编码器精度', value: '0.1', unit: 'deg', range: '0~1' },
      { name: '通讯方式', value: 'CAN', unit: '-', range: 'CAN/RS485' },
    ],
  },
];

export function RobotPartsPage() {
  const [form] = Form.useForm<PartFormValues>();
  const [messageApi, contextHolder] = message.useMessage();
  const [list, setList] = useState<RobotPartRecord[]>(initialList);
  const [keyword, setKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [vendorFilter, setVendorFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<'启用' | '停用' | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RobotPartRecord | null>(null);

  const filteredList = useMemo(() => {
    return list.filter((item) => {
      const keywordMatched =
        !keyword ||
        item.partNo.toLowerCase().includes(keyword.toLowerCase()) ||
        item.name.toLowerCase().includes(keyword.toLowerCase()) ||
        item.model.toLowerCase().includes(keyword.toLowerCase());
      const typeMatched = !typeFilter || item.type === typeFilter;
      const vendorMatched = !vendorFilter || item.vendor === vendorFilter;
      const statusMatched = !statusFilter || item.status === statusFilter;
      return keywordMatched && typeMatched && vendorMatched && statusMatched;
    });
  }, [keyword, list, statusFilter, typeFilter, vendorFilter]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      partNo: `RP-${String(list.length + 1).padStart(3, '0')}`,
      type: typeOptions[0],
      vendor: vendorOptions[0],
      status: '启用',
      technicalParams: [
        { name: '额定电压', value: '', unit: 'V', range: '' },
        { name: '最大扭矩', value: '', unit: 'N.m', range: '' },
      ],
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
      supplier: record.supplier,
      lifecycle: record.lifecycle,
      status: record.status,
      remark: record.remark,
      technicalParams: record.technicalParams,
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
      setList((prev) => prev.map((item) => (item.id === editing.id ? { ...item, ...values } : item)));
      messageApi.success('零部件已更新');
    } else {
      setList((prev) => [{ id: `part-${Date.now()}`, ...values }, ...prev]);
      messageApi.success('零部件已创建');
    }
    closeModal();
  };

  const deleteRecord = (record: RobotPartRecord) => {
    Modal.confirm({
      title: '确认删除该零部件吗？',
      icon: <ExclamationCircleFilled />,
      content: `${record.partNo} - ${record.name}`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => setList((prev) => prev.filter((item) => item.id !== record.id)),
    });
  };

  const columns: ColumnsType<RobotPartRecord> = [
    { title: '编号', dataIndex: 'partNo', key: 'partNo', width: 120 },
    { title: '名称', dataIndex: 'name', key: 'name', width: 180 },
    { title: '类型', dataIndex: 'type', key: 'type', width: 100 },
    { title: '型号', dataIndex: 'model', key: 'model', width: 140 },
    { title: '厂商', dataIndex: 'vendor', key: 'vendor', width: 140 },
    { title: '生命周期', dataIndex: 'lifecycle', key: 'lifecycle', width: 100 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: RobotPartRecord['status']) => <Tag color={status === '启用' ? 'success' : 'default'}>{status}</Tag>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 230,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Button type="link" onClick={() => messageApi.info(`引用信息：${record.name} 被 2 个机器人类型使用`)}>
            查看引用
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
            机器人零部件管理
          </Typography.Title>
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} md={8}>
              <Input allowClear prefix={<SearchOutlined />} placeholder="零部件编号/名称/型号" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
            </Col>
            <Col xs={24} md={5}>
              <Select
                allowClear
                style={{ width: '100%' }}
                placeholder="类型"
                value={typeFilter}
                options={typeOptions.map((item) => ({ label: item, value: item }))}
                onChange={setTypeFilter}
              />
            </Col>
            <Col xs={24} md={5}>
              <Select
                allowClear
                style={{ width: '100%' }}
                placeholder="厂商"
                value={vendorFilter}
                options={vendorOptions.map((item) => ({ label: item, value: item }))}
                onChange={setVendorFilter}
              />
            </Col>
            <Col xs={24} md={6}>
              <Space wrap style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                  新增
                </Button>
                <Button onClick={() => messageApi.success('导入成功')}>导入</Button>
                <Button onClick={() => messageApi.success('导出成功')}>导出</Button>
              </Space>
            </Col>
          </Row>
        </Space>
      </Card>

      <Card>
        <Table rowKey="id" columns={columns} dataSource={filteredList} pagination={{ pageSize: 8, showSizeChanger: false }} scroll={{ x: 1300 }} />
      </Card>

      <Modal
        title={editing ? '编辑零部件' : '新增零部件'}
        open={modalOpen}
        onCancel={closeModal}
        onOk={saveRecord}
        width={980}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Typography.Title level={5}>基础信息</Typography.Title>
          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item label="零部件编号" name="partNo" rules={[{ required: true, message: '请输入编号' }]}>
                <Input disabled={Boolean(editing)} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="零部件名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="类型" name="type" rules={[{ required: true, message: '请选择类型' }]}>
                <Select options={typeOptions.map((item) => ({ label: item, value: item }))} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="型号" name="model" rules={[{ required: true, message: '请输入型号' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="厂商" name="vendor" rules={[{ required: true, message: '请选择厂商' }]}>
                <Select options={vendorOptions.map((item) => ({ label: item, value: item }))} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="供应商" name="supplier" rules={[{ required: true, message: '请输入供应商' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="生命周期" name="lifecycle" rules={[{ required: true, message: '请输入生命周期' }]}>
                <Input placeholder="如：5年 / 20000小时" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="状态" name="status" rules={[{ required: true, message: '请选择状态' }]}>
                <Select
                  options={[
                    { label: '启用', value: '启用' },
                    { label: '停用', value: '停用' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item label="备注" name="remark">
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
          </Row>

          <Typography.Title level={5}>技术参数</Typography.Title>
          <Form.List name="technicalParams">
            {(fields, { add, remove }) => (
              <Space direction="vertical" style={{ width: '100%' }} size={8}>
                {fields.map((field) => (
                  <Row gutter={8} key={field.key}>
                    <Col xs={24} md={6}>
                      <Form.Item
                        {...field}
                        label="参数名"
                        name={[field.name, 'name']}
                        rules={[{ required: true, message: '请输入参数名' }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={6}>
                      <Form.Item
                        {...field}
                        label="参数值"
                        name={[field.name, 'value']}
                        rules={[{ required: true, message: '请输入参数值' }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={5}>
                      <Form.Item {...field} label="单位" name={[field.name, 'unit']} rules={[{ required: true, message: '请输入单位' }]}>
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={5}>
                      <Form.Item {...field} label="合法范围" name={[field.name, 'range']} rules={[{ required: true, message: '请输入范围' }]}>
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={2}>
                      <Button danger style={{ marginTop: 30 }} onClick={() => remove(field.name)}>
                        删除
                      </Button>
                    </Col>
                  </Row>
                ))}
                <Button type="dashed" onClick={() => add({ name: '', value: '', unit: '', range: '' })}>
                  新增参数
                </Button>
              </Space>
            )}
          </Form.List>
        </Form>
      </Modal>
    </Space>
  );
}
