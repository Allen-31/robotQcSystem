import { DeleteOutlined, EditOutlined, ExclamationCircleFilled, PlusOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Card, Col, Form, Input, Modal, Row, Select, Space, Table, Typography, Upload, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { MouseEvent } from 'react';
import { useMemo, useState } from 'react';

interface TypePart {
  id: string;
  name: string;
  model: string;
  type: string;
}

interface AnnotationPoint {
  id: string;
  partName: string;
  x: number;
  y: number;
  rotation: number;
  remark: string;
}

interface RobotTypeRecord {
  id: string;
  typeNo: string;
  typeName: string;
  image2d: string;
  image3d: string;
  partsCount: number;
  createdAt: string;
  status: '启用' | '停用';
  points: AnnotationPoint[];
}

const partsPool: TypePart[] = [
  { id: 'pt-1', name: '左手腕电机', model: 'MTR-LW-02', type: '电机' },
  { id: 'pt-2', name: '雷达模组', model: 'LIDAR-X5', type: '传感器' },
  { id: 'pt-3', name: '主控板', model: 'CTRL-A9', type: '控制板' },
  { id: 'pt-4', name: '驱动轮', model: 'WHEEL-34', type: '执行件' },
];

const initialList: RobotTypeRecord[] = [
  {
    id: 'type-1',
    typeNo: 'RT-001',
    typeName: '巡检机器人标准型',
    image2d: 'inspection-2d.png',
    image3d: 'inspection-3d.glb',
    partsCount: 24,
    createdAt: '2026-02-18 10:20',
    status: '启用',
    points: [{ id: 'p1', partName: '雷达模组', x: 52, y: 24, rotation: 0, remark: '顶部居中' }],
  },
];

type TypeFormValues = {
  typeNo: string;
  typeName: string;
  image2d: string;
  image3d: string;
  status: '启用' | '停用';
};

export function RobotTypePage() {
  const [form] = Form.useForm<TypeFormValues>();
  const [annotationForm] = Form.useForm<AnnotationPoint>();
  const [messageApi, contextHolder] = message.useMessage();
  const [list, setList] = useState<RobotTypeRecord[]>(initialList);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'启用' | '停用' | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RobotTypeRecord | null>(null);
  const [partKeyword, setPartKeyword] = useState('');
  const [activePart, setActivePart] = useState<TypePart | null>(null);
  const [draftPoints, setDraftPoints] = useState<AnnotationPoint[]>([]);
  const [annotationModalOpen, setAnnotationModalOpen] = useState(false);
  const [pendingPointId, setPendingPointId] = useState<string | null>(null);

  const filteredList = useMemo(() => {
    return list.filter((item) => {
      const keywordMatched =
        !keyword ||
        item.typeNo.toLowerCase().includes(keyword.toLowerCase()) ||
        item.typeName.toLowerCase().includes(keyword.toLowerCase());
      const statusMatched = !statusFilter || item.status === statusFilter;
      return keywordMatched && statusMatched;
    });
  }, [keyword, list, statusFilter]);

  const filteredParts = useMemo(() => {
    return partsPool.filter((item) => !partKeyword || item.name.includes(partKeyword) || item.model.includes(partKeyword));
  }, [partKeyword]);

  const openCreate = () => {
    setEditing(null);
    setDraftPoints([]);
    form.resetFields();
    form.setFieldsValue({
      typeNo: `RT-${String(list.length + 1).padStart(3, '0')}`,
      status: '启用',
      image2d: '',
      image3d: '',
    });
    setModalOpen(true);
  };

  const openEdit = (record: RobotTypeRecord) => {
    setEditing(record);
    setDraftPoints(record.points);
    form.setFieldsValue({
      typeNo: record.typeNo,
      typeName: record.typeName,
      image2d: record.image2d,
      image3d: record.image3d,
      status: record.status,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setEditing(null);
    setModalOpen(false);
    form.resetFields();
    setActivePart(null);
    setPartKeyword('');
    setPendingPointId(null);
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
                partsCount: Math.max(item.partsCount, draftPoints.length),
                points: draftPoints,
              }
            : item,
        ),
      );
      messageApi.success('机器人类型已更新');
    } else {
      setList((prev) => [
        {
          id: `type-${Date.now()}`,
          typeNo: values.typeNo,
          typeName: values.typeName,
          image2d: values.image2d,
          image3d: values.image3d,
          partsCount: draftPoints.length,
          createdAt: new Date().toLocaleString('zh-CN', { hour12: false }),
          status: values.status,
          points: draftPoints,
        },
        ...prev,
      ]);
      messageApi.success('机器人类型已创建');
    }
    closeModal();
  };

  const deleteRecord = (record: RobotTypeRecord) => {
    Modal.confirm({
      title: '确认删除该类型吗？',
      icon: <ExclamationCircleFilled />,
      content: `${record.typeNo} - ${record.typeName}`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => setList((prev) => prev.filter((item) => item.id !== record.id)),
    });
  };

  const addAnnotationFromCanvas = (event: MouseEvent<HTMLDivElement>) => {
    if (!activePart) {
      messageApi.warning('请先在右侧选择零部件，再点击画布标注');
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Number((((event.clientX - rect.left) / rect.width) * 100).toFixed(2));
    const y = Number((((event.clientY - rect.top) / rect.height) * 100).toFixed(2));
    const pointId = `point-${Date.now()}`;
    setDraftPoints((prev) => [...prev, { id: pointId, partName: activePart.name, x, y, rotation: 0, remark: '' }]);
    setPendingPointId(pointId);
    annotationForm.setFieldsValue({ id: pointId, partName: activePart.name, x, y, rotation: 0, remark: '' });
    setAnnotationModalOpen(true);
  };

  const saveAnnotation = async () => {
    const values = await annotationForm.validateFields();
    if (!pendingPointId) {
      setAnnotationModalOpen(false);
      return;
    }
    setDraftPoints((prev) => prev.map((item) => (item.id === pendingPointId ? { ...item, ...values } : item)));
    setAnnotationModalOpen(false);
    setPendingPointId(null);
  };

  const columns: ColumnsType<RobotTypeRecord> = [
    { title: '类型编号', dataIndex: 'typeNo', key: 'typeNo', width: 120 },
    { title: '类型名称', dataIndex: 'typeName', key: 'typeName', width: 220 },
    { title: '二维图', dataIndex: 'image2d', key: 'image2d', width: 180 },
    { title: '三维图', dataIndex: 'image3d', key: 'image3d', width: 180 },
    { title: '零部件数量', dataIndex: 'partsCount', key: 'partsCount', width: 120 },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Button type="link" onClick={() => messageApi.info(`进入零部件视图: ${record.typeNo}`)}>
            零部件
          </Button>
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
            机器人类型管理
          </Typography.Title>
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} md={8}>
              <Input allowClear prefix={<SearchOutlined />} placeholder="类型编号/类型名称" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
            </Col>
            <Col xs={24} md={6}>
              <Select
                allowClear
                style={{ width: '100%' }}
                placeholder="状态"
                value={statusFilter}
                options={[
                  { label: '启用', value: '启用' },
                  { label: '停用', value: '停用' },
                ]}
                onChange={setStatusFilter}
              />
            </Col>
            <Col xs={24} md={10}>
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
        <Table rowKey="id" columns={columns} dataSource={filteredList} pagination={{ pageSize: 8, showSizeChanger: false }} scroll={{ x: 1350 }} />
      </Card>

      <Modal
        title={editing ? '编辑机器人类型' : '新增机器人类型'}
        open={modalOpen}
        onCancel={closeModal}
        onOk={saveRecord}
        okText="保存"
        cancelText="取消"
        width={1100}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Row gutter={12}>
            <Col xs={24} md={8}>
              <Form.Item label="类型编号" name="typeNo" rules={[{ required: true, message: '请输入类型编号' }]}>
                <Input disabled={Boolean(editing)} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="类型名称" name="typeName" rules={[{ required: true, message: '请输入类型名称' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="状态" name="status" rules={[{ required: true, message: '请选择状态' }]}>
                <Select options={[{ label: '启用', value: '启用' }, { label: '停用', value: '停用' }]} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item label="二维图" name="image2d" rules={[{ required: true, message: '请上传二维图文件' }]}>
                <Input placeholder="请上传二维图文件" />
              </Form.Item>
              <Upload
                maxCount={1}
                showUploadList={false}
                beforeUpload={(file) => {
                  form.setFieldValue('image2d', file.name);
                  return false;
                }}
              >
                <Button icon={<UploadOutlined />}>上传二维图</Button>
              </Upload>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="三维图" name="image3d" rules={[{ required: true, message: '请上传三维图文件' }]}>
                <Input placeholder="请上传三维图文件" />
              </Form.Item>
              <Upload
                maxCount={1}
                showUploadList={false}
                beforeUpload={(file) => {
                  form.setFieldValue('image3d', file.name);
                  return false;
                }}
              >
                <Button icon={<UploadOutlined />}>上传三维图</Button>
              </Upload>
            </Col>
          </Row>
        </Form>

        <Row gutter={12} style={{ marginTop: 12 }}>
          <Col xs={24} md={14}>
            <Card
              size="small"
              title="结构图区域"
              extra={
                <Space>
                  <Button size="small" icon={<UploadOutlined />}>
                    上传二维图
                  </Button>
                  <Button size="small">缩放+</Button>
                  <Button size="small">缩放-</Button>
                  <Button size="small">重置</Button>
                </Space>
              }
            >
              <div
                onClick={addAnnotationFromCanvas}
                style={{
                  height: 320,
                  border: '1px dashed #d9d9d9',
                  borderRadius: 8,
                  position: 'relative',
                  cursor: activePart ? 'crosshair' : 'not-allowed',
                  background: 'linear-gradient(135deg, #f5f5f5, #fafafa)',
                }}
              >
                <Typography.Text type="secondary" style={{ position: 'absolute', top: 10, left: 10 }}>
                  点击画布创建标注点，当前选择: {activePart?.name ?? '无'}
                </Typography.Text>
                {draftPoints.map((point) => (
                  <div
                    key={point.id}
                    title={`${point.partName} (${point.x}, ${point.y})`}
                    style={{
                      position: 'absolute',
                      left: `${point.x}%`,
                      top: `${point.y}%`,
                      transform: 'translate(-50%, -50%)',
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: '#ff4d4f',
                      border: '2px solid #fff',
                    }}
                  />
                ))}
              </div>
            </Card>
          </Col>
          <Col xs={24} md={10}>
            <Card size="small" title="零部件选择区" extra={<Typography.Text type="secondary">已标注 {draftPoints.length}</Typography.Text>}>
              <Input allowClear placeholder="搜索零部件" value={partKeyword} onChange={(event) => setPartKeyword(event.target.value)} style={{ marginBottom: 8 }} />
              <Table
                rowKey="id"
                size="small"
                pagination={false}
                dataSource={filteredParts}
                columns={[
                  { title: '零部件名称', dataIndex: 'name', key: 'name' },
                  { title: '型号', dataIndex: 'model', key: 'model' },
                  { title: '类型', dataIndex: 'type', key: 'type' },
                  {
                    title: '操作',
                    key: 'action',
                    render: (_, record: TypePart) => (
                      <Button type={activePart?.id === record.id ? 'primary' : 'link'} size="small" onClick={() => setActivePart(record)}>
                        选择
                      </Button>
                    ),
                  },
                ]}
              />
            </Card>
          </Col>
        </Row>
      </Modal>

      <Modal
        title="标注信息"
        open={annotationModalOpen}
        onCancel={() => setAnnotationModalOpen(false)}
        onOk={saveAnnotation}
        okText="确认"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={annotationForm} layout="vertical">
          <Form.Item label="零部件名称" name="partName" rules={[{ required: true, message: '请选择零部件' }]}>
            <Select options={partsPool.map((item) => ({ label: item.name, value: item.name }))} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="坐标X" name="x" rules={[{ required: true, message: '请输入坐标X' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="坐标Y" name="y" rules={[{ required: true, message: '请输入坐标Y' }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="旋转角度" name="rotation" rules={[{ required: true, message: '请输入旋转角度' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

