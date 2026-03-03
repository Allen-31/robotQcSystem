import { DeleteOutlined, EditOutlined, ExclamationCircleFilled, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Col, Form, Input, Modal, Row, Select, Space, Table, Tabs, Tag, Tree, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';

type ConfigStatus = '草稿' | '已发布';

interface ConfigParam {
  id: string;
  name: string;
  value: string;
  defaultValue: string;
  unit: string;
  range: string;
  remoteEditable: boolean;
  categoryPath: string;
}

interface VersionRecord {
  id: string;
  version: string;
  publishedAt: string;
  publisher: string;
  changeLog: string;
}

interface DispatchRecord {
  id: string;
  robotCode: string;
  dispatchedAt: string;
  status: '成功' | '失败' | '下发中';
  result: string;
}

interface RobotConfigRecord {
  id: string;
  configNo: string;
  configName: string;
  robotType: string;
  group: string;
  firmware: string;
  currentVersion: string;
  status: ConfigStatus;
  createdAt: string;
  updatedAt: string;
  description?: string;
  isDefault?: boolean;
  params: ConfigParam[];
  versions: VersionRecord[];
  dispatches: DispatchRecord[];
}

const robotTypes = ['搬运机器人', '巡检机器人', '协作机械臂'];
const groups = ['A组', 'B组', 'C组'];
const categoryTree = [
  {
    title: '算法',
    key: '算法',
    children: [
      { title: 'SLAM', key: '算法/SLAM' },
      { title: '路径规划', key: '算法/路径规划' },
      { title: '避障', key: '算法/避障' },
    ],
  },
  {
    title: '运动控制',
    key: '运动控制',
    children: [
      { title: '速度控制', key: '运动控制/速度控制' },
      { title: '转向控制', key: '运动控制/转向控制' },
    ],
  },
  {
    title: '电机',
    key: '电机',
    children: [
      { title: '左手腕电机', key: '电机/左手腕电机' },
      { title: '左手臂电机', key: '电机/左手臂电机' },
    ],
  },
  {
    title: '安全策略',
    key: '安全策略',
    children: [
      { title: '急停策略', key: '安全策略/急停策略' },
      { title: '限速策略', key: '安全策略/限速策略' },
    ],
  },
];

const initialList: RobotConfigRecord[] = [
  {
    id: 'cfg-1',
    configNo: 'CFG-001',
    configName: '巡检默认配置',
    robotType: '巡检机器人',
    group: 'A组',
    firmware: 'v2.3.1',
    currentVersion: 'v1.2.0',
    status: '已发布',
    createdAt: '2026-02-01 09:20',
    updatedAt: '2026-03-01 14:25',
    description: '产线巡检默认参数',
    isDefault: true,
    params: [
      { id: 'p1', name: '定位频率', value: '10', defaultValue: '10', unit: 'Hz', range: '1~20', remoteEditable: true, categoryPath: '算法/SLAM' },
      { id: 'p2', name: '避障距离', value: '0.8', defaultValue: '0.8', unit: 'm', range: '0.2~2', remoteEditable: true, categoryPath: '算法/避障' },
      { id: 'p3', name: '最大速度', value: '1.2', defaultValue: '1.0', unit: 'm/s', range: '0.2~2.0', remoteEditable: false, categoryPath: '运动控制/速度控制' },
    ],
    versions: [
      { id: 'v1', version: 'v1.2.0', publishedAt: '2026-03-01 14:20', publisher: 'admin', changeLog: '更新避障阈值与速度上限' },
      { id: 'v2', version: 'v1.1.0', publishedAt: '2026-02-20 11:10', publisher: 'admin', changeLog: '初始发布' },
    ],
    dispatches: [
      { id: 'd1', robotCode: 'RB-001', dispatchedAt: '2026-03-02 09:00', status: '成功', result: '已生效' },
      { id: 'd2', robotCode: 'RB-018', dispatchedAt: '2026-03-02 09:03', status: '下发中', result: '等待机器人上线' },
    ],
  },
];

type ConfigFormValues = {
  configNo: string;
  configName: string;
  robotType: string;
  group: string;
  firmware: string;
  description?: string;
};

export function RobotConfigPage() {
  const [form] = Form.useForm<ConfigFormValues>();
  const [messageApi, contextHolder] = message.useMessage();
  const [list, setList] = useState<RobotConfigRecord[]>(initialList);
  const [keyword, setKeyword] = useState('');
  const [robotTypeFilter, setRobotTypeFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<ConfigStatus | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RobotConfigRecord | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('算法/SLAM');
  const [versionA, setVersionA] = useState<string | undefined>();
  const [versionB, setVersionB] = useState<string | undefined>();

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      configNo: `CFG-${String(list.length + 1).padStart(3, '0')}`,
      robotType: robotTypes[0],
      group: groups[0],
      firmware: 'v2.3.1',
    });
    setSelectedCategory('算法/SLAM');
    setVersionA(undefined);
    setVersionB(undefined);
    setModalOpen(true);
  };

  const openEdit = (record: RobotConfigRecord) => {
    setEditing(record);
    form.setFieldsValue({
      configNo: record.configNo,
      configName: record.configName,
      robotType: record.robotType,
      group: record.group,
      firmware: record.firmware,
      description: record.description,
    });
    setSelectedCategory('算法/SLAM');
    setVersionA(undefined);
    setVersionB(undefined);
    setModalOpen(true);
  };

  const closeModal = () => {
    setEditing(null);
    setModalOpen(false);
    form.resetFields();
  };

  const activeRecord = editing;
  const activeParams = activeRecord?.params ?? [];
  const filteredParams = activeParams.filter((item) => item.categoryPath === selectedCategory);

  const filteredList = useMemo(() => {
    return list.filter((item) => {
      const keywordMatched =
        !keyword ||
        item.configNo.toLowerCase().includes(keyword.toLowerCase()) ||
        item.configName.toLowerCase().includes(keyword.toLowerCase());
      const typeMatched = !robotTypeFilter || item.robotType === robotTypeFilter;
      const statusMatched = !statusFilter || item.status === statusFilter;
      return keywordMatched && typeMatched && statusMatched;
    });
  }, [keyword, list, robotTypeFilter, statusFilter]);

  const saveRecord = async (nextStatus: ConfigStatus) => {
    const values = await form.validateFields();
    if (editing) {
      setList((prev) =>
        prev.map((item) =>
          item.id === editing.id
            ? {
                ...item,
                ...values,
                status: nextStatus,
                updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
              }
            : item,
        ),
      );
      messageApi.success('配置已更新');
    } else {
      const createdAt = new Date().toLocaleString('zh-CN', { hour12: false });
      const next: RobotConfigRecord = {
        id: `cfg-${Date.now()}`,
        configNo: values.configNo,
        configName: values.configName,
        robotType: values.robotType,
        group: values.group,
        firmware: values.firmware,
        currentVersion: nextStatus === '已发布' ? 'v1.0.0' : '-',
        status: nextStatus,
        createdAt,
        updatedAt: createdAt,
        description: values.description,
        isDefault: false,
        params: [],
        versions: [],
        dispatches: [],
      };
      setList((prev) => [next, ...prev]);
      messageApi.success('配置已创建');
    }
    closeModal();
  };

  const deleteRecord = (record: RobotConfigRecord) => {
    Modal.confirm({
      title: '确认删除该配置吗？',
      icon: <ExclamationCircleFilled />,
      content: `${record.configNo} - ${record.configName}`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => setList((prev) => prev.filter((item) => item.id !== record.id)),
    });
  };

  const configColumns: ColumnsType<RobotConfigRecord> = [
    { title: '配置编号', dataIndex: 'configNo', key: 'configNo', width: 120 },
    { title: '配置名称', dataIndex: 'configName', key: 'configName', width: 180 },
    { title: '机器人类型', dataIndex: 'robotType', key: 'robotType', width: 140 },
    { title: '分组', dataIndex: 'group', key: 'group', width: 100 },
    { title: '适用固件版本', dataIndex: 'firmware', key: 'firmware', width: 140 },
    { title: '当前版本', dataIndex: 'currentVersion', key: 'currentVersion', width: 120 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ConfigStatus) => <Tag color={status === '已发布' ? 'success' : 'default'}>{status}</Tag>,
    },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
    { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 170 },
    {
      title: '操作',
      key: 'actions',
      width: 360,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4} wrap>
          <Button type="link" onClick={() => messageApi.success(`已跳转到机器人管理: ${record.configNo}`)}>
            开始建图
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Button type="link" onClick={() => messageApi.info(`版本管理: ${record.configNo}`)}>
            版本管理
          </Button>
          <Button type="link" onClick={() => messageApi.info(`对比配置: ${record.configNo}`)}>
            对比
          </Button>
          <Button type="link" onClick={() => messageApi.success(`下发任务已提交: ${record.configNo}`)}>
            下发
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => deleteRecord(record)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const paramColumns: ColumnsType<ConfigParam> = [
    { title: '参数名', dataIndex: 'name', key: 'name', width: 170 },
    { title: '参数值', dataIndex: 'value', key: 'value', width: 120 },
    { title: '默认值', dataIndex: 'defaultValue', key: 'defaultValue', width: 120 },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 80 },
    { title: '合法范围', dataIndex: 'range', key: 'range', width: 160 },
    {
      title: '是否远程可改',
      dataIndex: 'remoteEditable',
      key: 'remoteEditable',
      width: 120,
      render: (value: boolean) => (value ? '是' : '否'),
    },
  ];

  const versionColumns: ColumnsType<VersionRecord> = [
    { title: '版本号', dataIndex: 'version', key: 'version', width: 120 },
    { title: '发布时间', dataIndex: 'publishedAt', key: 'publishedAt', width: 180 },
    { title: '发布人', dataIndex: 'publisher', key: 'publisher', width: 120 },
    { title: '变更说明', dataIndex: 'changeLog', key: 'changeLog' },
    {
      title: '操作',
      key: 'actions',
      width: 140,
      render: () => (
        <Space>
          <Button type="link">查看</Button>
          <Button type="link">回滚</Button>
        </Space>
      ),
    },
  ];

  const dispatchColumns: ColumnsType<DispatchRecord> = [
    { title: '机器人编号', dataIndex: 'robotCode', key: 'robotCode', width: 140 },
    { title: '下发时间', dataIndex: 'dispatchedAt', key: 'dispatchedAt', width: 180 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
    { title: '结果', dataIndex: 'result', key: 'result' },
    {
      title: '日志',
      key: 'log',
      width: 120,
      render: (_, record) => <Button type="link" onClick={() => messageApi.info(`查看日志: ${record.id}`)}>日志查看</Button>,
    },
  ];

  const versionDiff = useMemo(() => {
    if (!activeRecord || !versionA || !versionB || versionA === versionB) {
      return [];
    }
    const a = activeRecord.versions.find((item) => item.version === versionA);
    const b = activeRecord.versions.find((item) => item.version === versionB);
    if (!a || !b) {
      return [];
    }
    return a.changeLog === b.changeLog
      ? []
      : [
          {
            key: `${a.version}-${b.version}`,
            field: '变更说明',
            versionA: a.changeLog,
            versionB: b.changeLog,
          },
        ];
  }, [activeRecord, versionA, versionB]);

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {contextHolder}
      <Card>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            机器人配置管理
          </Typography.Title>
          <Row gutter={[12, 12]}>
            <Col xs={24} md={8}>
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder="配置编号/配置名称"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </Col>
            <Col xs={24} md={6}>
              <Select
                allowClear
                style={{ width: '100%' }}
                placeholder="机器人类型"
                options={robotTypes.map((item) => ({ label: item, value: item }))}
                value={robotTypeFilter}
                onChange={setRobotTypeFilter}
              />
            </Col>
            <Col xs={24} md={6}>
              <Select
                allowClear
                style={{ width: '100%' }}
                placeholder="状态"
                options={[
                  { label: '草稿', value: '草稿' },
                  { label: '已发布', value: '已发布' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
              />
            </Col>
            <Col xs={24} md={4}>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button
                  onClick={() => {
                    setKeyword('');
                    setRobotTypeFilter(undefined);
                    setStatusFilter(undefined);
                  }}
                >
                  重置
                </Button>
              </Space>
            </Col>
          </Row>
          <Space wrap>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              新增
            </Button>
            <Button onClick={() => messageApi.success('导入成功')}>导入</Button>
            <Button onClick={() => messageApi.success('导出成功')}>导出</Button>
            <Button onClick={() => messageApi.success('批量下发任务已创建')}>批量下发</Button>
          </Space>
        </Space>
      </Card>

      <Card>
        <Table rowKey="id" columns={configColumns} dataSource={filteredList} pagination={{ pageSize: 8, showSizeChanger: false }} scroll={{ x: 1900 }} />
      </Card>

      <Modal
        title={editing ? '编辑机器人配置' : '新增机器人配置'}
        open={modalOpen}
        onCancel={closeModal}
        width={1080}
        footer={[
          <Button key="cancel" onClick={closeModal}>
            取消
          </Button>,
          <Button key="draft" onClick={() => saveRecord('草稿')}>
            保存草稿
          </Button>,
          <Button key="publish" type="primary" onClick={() => saveRecord('已发布')}>
            发布版本
          </Button>,
        ]}
        destroyOnClose
      >
        <Tabs
          items={[
            {
              key: 'base',
              label: '基础信息',
              children: (
                <Form form={form} layout="vertical">
                  <Row gutter={12}>
                    <Col xs={24} md={12}>
                      <Form.Item label="配置编号" name="configNo" rules={[{ required: true, message: '请输入配置编号' }]}>
                        <Input disabled={Boolean(editing)} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="配置名称" name="configName" rules={[{ required: true, message: '请输入配置名称' }]}>
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="机器人类型" name="robotType" rules={[{ required: true, message: '请选择机器人类型' }]}>
                        <Select options={robotTypes.map((item) => ({ label: item, value: item }))} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="所属分组" name="group" rules={[{ required: true, message: '请选择分组' }]}>
                        <Select options={groups.map((item) => ({ label: item, value: item }))} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="适用固件版本" name="firmware" rules={[{ required: true, message: '请输入固件版本' }]}>
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col xs={24}>
                      <Form.Item label="描述" name="description">
                        <Input.TextArea rows={3} />
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>
              ),
            },
            {
              key: 'params',
              label: '参数配置',
              children: (
                <Row gutter={12}>
                  <Col xs={24} md={7}>
                    <Card size="small" title="参数分类">
                      <Tree treeData={categoryTree} defaultExpandAll selectedKeys={[selectedCategory]} onSelect={(keys) => setSelectedCategory(String(keys[0] ?? ''))} />
                    </Card>
                  </Col>
                  <Col xs={24} md={17}>
                    <Card
                      size="small"
                      title={`分类：${selectedCategory}`}
                      extra={
                        <Space>
                          <Button size="small" onClick={() => messageApi.info('已进入批量修改模式')}>批量修改</Button>
                          <Button size="small" onClick={() => messageApi.success('已恢复默认值')}>恢复默认</Button>
                        </Space>
                      }
                    >
                      <Table rowKey="id" columns={paramColumns} dataSource={filteredParams} pagination={false} size="small" scroll={{ x: 700 }} />
                    </Card>
                  </Col>
                </Row>
              ),
            },
            {
              key: 'versions',
              label: '版本管理',
              children: <Table rowKey="id" columns={versionColumns} dataSource={activeRecord?.versions ?? []} pagination={false} size="small" scroll={{ x: 900 }} />,
            },
            {
              key: 'compare',
              label: '对比',
              children: (
                <Space direction="vertical" style={{ width: '100%' }} size={12}>
                  <Space wrap>
                    <Select
                      allowClear
                      style={{ width: 200 }}
                      placeholder="选择版本A"
                      options={(activeRecord?.versions ?? []).map((item) => ({ label: item.version, value: item.version }))}
                      value={versionA}
                      onChange={setVersionA}
                    />
                    <Select
                      allowClear
                      style={{ width: 200 }}
                      placeholder="选择版本B"
                      options={(activeRecord?.versions ?? []).map((item) => ({ label: item.version, value: item.version }))}
                      value={versionB}
                      onChange={setVersionB}
                    />
                    <Button type="primary">开始对比</Button>
                  </Space>
                  <Table
                    rowKey="key"
                    dataSource={versionDiff}
                    pagination={false}
                    locale={{ emptyText: '暂无差异或未选择版本' }}
                    columns={[
                      { title: '字段', dataIndex: 'field', key: 'field', width: 180 },
                      { title: versionA ?? '版本A', dataIndex: 'versionA', key: 'versionA' },
                      { title: versionB ?? '版本B', dataIndex: 'versionB', key: 'versionB' },
                    ]}
                  />
                </Space>
              ),
            },
            {
              key: 'dispatch',
              label: '下发记录',
              children: <Table rowKey="id" columns={dispatchColumns} dataSource={activeRecord?.dispatches ?? []} pagination={false} size="small" />,
            },
          ]}
        />
      </Modal>
    </Space>
  );
}

