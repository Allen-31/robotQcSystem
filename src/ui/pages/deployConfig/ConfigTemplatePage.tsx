import { DeleteOutlined, EditOutlined, ExclamationCircleFilled, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Card, Col, Form, Grid, Input, Modal, Row, Select, Space, Table, Tabs, Tree, Typography, Upload, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { UploadProps } from 'antd/es/upload';
import type { Key } from 'react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type ConfigParam = {
  id: string;
  name: string;
  value: string;
  defaultValue: string;
  unit: string;
  range: string;
  categoryPath: string;
};

type RobotConfigRecord = {
  id: string;
  code: string;
  serialNo: string;
  ip: string;
  robotType: string;
  group: string;
  registeredAt: string;
  params: ConfigParam[];
};

type RobotConfigFormValues = Omit<RobotConfigRecord, 'id' | 'params'>;

const robotTypes = ['巡检机器人', '搬运机器人', '协作机械臂'];
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
    title: '底盘驱动',
    key: '底盘驱动',
    children: [
      { title: '轮速控制', key: '底盘驱动/轮速控制' },
      { title: '差速参数', key: '底盘驱动/差速参数' },
    ],
  },
  {
    title: '关节执行器',
    key: '关节执行器',
    children: [
      { title: '关节基础', key: '关节执行器/关节基础' },
      { title: '关节PID', key: '关节执行器/关节PID' },
    ],
  },
  {
    title: '视觉相机',
    key: '视觉相机',
    children: [
      { title: 'RGB相机', key: '视觉相机/RGB相机' },
      { title: '深度相机', key: '视觉相机/深度相机' },
      { title: '外参标定', key: '视觉相机/外参标定' },
    ],
  },
  {
    title: '传感器',
    key: '传感器',
    children: [
      { title: '激光雷达', key: '传感器/激光雷达' },
      { title: 'IMU', key: '传感器/IMU' },
    ],
  },
  {
    title: '电源管理',
    key: '电源管理',
    children: [
      { title: '电池阈值', key: '电源管理/电池阈值' },
      { title: '功耗策略', key: '电源管理/功耗策略' },
    ],
  },
  {
    title: '通讯与网络',
    key: '通讯与网络',
    children: [
      { title: '网络配置', key: '通讯与网络/网络配置' },
      { title: '消息总线', key: '通讯与网络/消息总线' },
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

const defaultParamTemplate: ConfigParam[] = [
  { id: 'p1', name: '定位频率', value: '10', defaultValue: '10', unit: 'Hz', range: '1~20', categoryPath: '算法/SLAM' },
  { id: 'p2', name: '重定位阈值', value: '0.45', defaultValue: '0.45', unit: '-', range: '0.1~1.0', categoryPath: '算法/SLAM' },
  { id: 'p3', name: '避障距离', value: '0.8', defaultValue: '0.8', unit: 'm', range: '0.2~2', categoryPath: '算法/避障' },
  { id: 'p4', name: '路径重规划间隔', value: '500', defaultValue: '500', unit: 'ms', range: '100~2000', categoryPath: '算法/路径规划' },
  { id: 'p5', name: '最大速度', value: '1.2', defaultValue: '1.0', unit: 'm/s', range: '0.2~2.0', categoryPath: '运动控制/速度控制' },
  { id: 'p6', name: '最大角速度', value: '120', defaultValue: '100', unit: 'deg/s', range: '20~180', categoryPath: '运动控制/转向控制' },
  { id: 'p7', name: '轮径', value: '0.18', defaultValue: '0.18', unit: 'm', range: '0.08~0.4', categoryPath: '底盘驱动/轮速控制' },
  { id: 'p8', name: '轮距', value: '0.52', defaultValue: '0.52', unit: 'm', range: '0.2~1.2', categoryPath: '底盘驱动/差速参数' },
  { id: 'p9', name: '轮速闭环频率', value: '100', defaultValue: '100', unit: 'Hz', range: '20~500', categoryPath: '底盘驱动/轮速控制' },
  { id: 'p10', name: '关节数量', value: '6', defaultValue: '6', unit: '个', range: '1~20', categoryPath: '关节执行器/关节基础' },
  { id: 'p11', name: '关节P增益', value: '1.2', defaultValue: '1.2', unit: '-', range: '0.1~5', categoryPath: '关节执行器/关节PID' },
  { id: 'p12', name: '关节I增益', value: '0.08', defaultValue: '0.08', unit: '-', range: '0~1', categoryPath: '关节执行器/关节PID' },
  { id: 'p13', name: '关节D增益', value: '0.01', defaultValue: '0.01', unit: '-', range: '0~1', categoryPath: '关节执行器/关节PID' },
  { id: 'p14', name: 'RGB分辨率', value: '1920x1080', defaultValue: '1920x1080', unit: '-', range: '640x480~3840x2160', categoryPath: '视觉相机/RGB相机' },
  { id: 'p15', name: 'RGB帧率', value: '30', defaultValue: '30', unit: 'fps', range: '5~60', categoryPath: '视觉相机/RGB相机' },
  { id: 'p16', name: 'RGB曝光时间', value: '12000', defaultValue: '12000', unit: 'us', range: '100~50000', categoryPath: '视觉相机/RGB相机' },
  { id: 'p17', name: '深度帧率', value: '30', defaultValue: '30', unit: 'fps', range: '5~90', categoryPath: '视觉相机/深度相机' },
  { id: 'p18', name: '深度最小距离', value: '0.2', defaultValue: '0.2', unit: 'm', range: '0.1~2', categoryPath: '视觉相机/深度相机' },
  { id: 'p19', name: '深度最大距离', value: '8.0', defaultValue: '8.0', unit: 'm', range: '2~20', categoryPath: '视觉相机/深度相机' },
  { id: 'p20', name: '外参X', value: '0.02', defaultValue: '0.02', unit: 'm', range: '-1~1', categoryPath: '视觉相机/外参标定' },
  { id: 'p21', name: '外参Y', value: '0.00', defaultValue: '0.00', unit: 'm', range: '-1~1', categoryPath: '视觉相机/外参标定' },
  { id: 'p22', name: '外参Z', value: '1.20', defaultValue: '1.20', unit: 'm', range: '0~3', categoryPath: '视觉相机/外参标定' },
  { id: 'p23', name: '雷达扫描频率', value: '15', defaultValue: '15', unit: 'Hz', range: '5~30', categoryPath: '传感器/激光雷达' },
  { id: 'p24', name: 'IMU采样率', value: '200', defaultValue: '200', unit: 'Hz', range: '50~1000', categoryPath: '传感器/IMU' },
  { id: 'p25', name: '低电量阈值', value: '20', defaultValue: '20', unit: '%', range: '5~50', categoryPath: '电源管理/电池阈值' },
  { id: 'p26', name: '待机休眠时长', value: '300', defaultValue: '300', unit: 's', range: '30~3600', categoryPath: '电源管理/功耗策略' },
  { id: 'p27', name: '心跳周期', value: '1', defaultValue: '1', unit: 's', range: '0.2~10', categoryPath: '通讯与网络/消息总线' },
  { id: 'p28', name: '重连次数', value: '5', defaultValue: '5', unit: '次', range: '1~20', categoryPath: '通讯与网络/网络配置' },
  { id: 'p29', name: '急停响应时间', value: '80', defaultValue: '80', unit: 'ms', range: '20~200', categoryPath: '安全策略/急停策略' },
  { id: 'p30', name: '限速上限', value: '1.0', defaultValue: '1.0', unit: 'm/s', range: '0.2~1.5', categoryPath: '安全策略/限速策略' },
];

const cloneParams = (params: ConfigParam[]) => params.map((item) => ({ ...item }));

const buildDetailedParams = (existing: ConfigParam[] = []) => {
  const template = cloneParams(defaultParamTemplate);
  const existingMap = new Map(existing.map((item) => [`${item.categoryPath}|${item.name}`, item]));
  return template.map((item) => {
    const hit = existingMap.get(`${item.categoryPath}|${item.name}`);
    return hit ? { ...item, value: hit.value } : item;
  });
};

const initialList: RobotConfigRecord[] = [
  {
    id: 'rc-1',
    code: 'RC-001',
    serialNo: 'RB-001',
    ip: '192.168.10.21',
    robotType: '巡检机器人',
    group: 'A组',
    registeredAt: '2026-01-15 08:10',
    params: buildDetailedParams(),
  },
  {
    id: 'rc-2',
    code: 'RC-002',
    serialNo: 'RB-009',
    ip: '192.168.10.39',
    robotType: '巡检机器人',
    group: 'B组',
    registeredAt: '2026-01-20 13:50',
    params: buildDetailedParams([{ ...defaultParamTemplate[4], value: '0.9' }, { ...defaultParamTemplate[24], value: '25' }]),
  },
];

function nowText() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

export function ConfigTemplatePage() {
  const navigate = useNavigate();
  const [form] = Form.useForm<RobotConfigFormValues>();
  const [messageApi, contextHolder] = message.useMessage();
  const screens = Grid.useBreakpoint();
  const isLaptop = !screens.xxl;

  const [list, setList] = useState<RobotConfigRecord[]>(initialList);
  const [keyword, setKeyword] = useState('');
  const [editing, setEditing] = useState<RobotConfigRecord | null>(null);
  const [editTab, setEditTab] = useState<'base' | 'params'>('base');
  const [draftParams, setDraftParams] = useState<ConfigParam[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('算法/SLAM');
  const [compareBase, setCompareBase] = useState<RobotConfigRecord | null>(null);
  const [compareTargetId, setCompareTargetId] = useState<string>();

  const filteredList = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    if (!k) {
      return list;
    }
    return list.filter((item) => `${item.code} ${item.serialNo} ${item.ip} ${item.robotType} ${item.group}`.toLowerCase().includes(k));
  }, [keyword, list]);

  const filteredParams = draftParams.filter((item) => item.categoryPath === selectedCategory);

  const closeEdit = () => {
    setEditing(null);
    setEditTab('base');
    setDraftParams([]);
    setSelectedCategory('算法/SLAM');
    form.resetFields();
  };

  const openEdit = (record: RobotConfigRecord, tab: 'base' | 'params' = 'base') => {
    setEditing(record);
    setEditTab(tab);
    setDraftParams(buildDetailedParams(record.params));
    form.setFieldsValue({
      code: record.code,
      serialNo: record.serialNo,
      ip: record.ip,
      robotType: record.robotType,
      group: record.group,
      registeredAt: record.registeredAt,
    });
  };

  const updateParamValue = (id: string, value: string) => {
    setDraftParams((prev) => prev.map((item) => (item.id === id ? { ...item, value } : item)));
  };

  const restoreOneParamDefault = (id: string) => {
    setDraftParams((prev) => prev.map((item) => (item.id === id ? { ...item, value: item.defaultValue } : item)));
  };

  const restoreCategoryDefaults = () => {
    setDraftParams((prev) => prev.map((item) => (item.categoryPath === selectedCategory ? { ...item, value: item.defaultValue } : item)));
    messageApi.success('已恢复当前分类默认值');
  };

  const saveEdit = async () => {
    const values = await form.validateFields();
    if (!editing) {
      return;
    }
    setList((prev) => prev.map((item) => (item.id === editing.id ? { ...item, ...values, params: cloneParams(draftParams) } : item)));
    messageApi.success('已保存');
    closeEdit();
  };

  const deleteRecord = (record: RobotConfigRecord) => {
    Modal.confirm({
      title: '确认删除该配置吗？',
      icon: <ExclamationCircleFilled />,
      content: `${record.code} - ${record.serialNo}`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => setList((prev) => prev.filter((item) => item.id !== record.id)),
    });
  };

  const exportCsv = () => {
    const header = ['Id', '序列号', 'IP', '类型', '分组', '注册时间'];
    const rows = filteredList.map((item) => [item.code, item.serialNo, item.ip, item.robotType, item.group, item.registeredAt]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `robot-config-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    messageApi.success('导出成功');
  };

  const importProps: UploadProps = {
    accept: '.csv',
    showUploadList: false,
    beforeUpload: async (file) => {
      const text = await file.text();
      const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
      if (lines.length < 2) {
        messageApi.warning('导入文件为空');
        return Upload.LIST_IGNORE;
      }
      const parse = (line: string) => line.split(',').map((cell) => cell.replace(/^"|"$/g, '').replace(/""/g, '"').trim());
      const data = lines.slice(1).map(parse);
      const imported = data
        .filter((row) => row[0] && row[1])
        .map((row, index) => ({
          id: `imp-${Date.now()}-${index}`,
          code: row[0],
          serialNo: row[1],
          ip: row[2] || '',
          robotType: row[3] || robotTypes[0],
          group: row[4] || groups[0],
          registeredAt: row[5] || nowText(),
          params: buildDetailedParams(),
        }));
      if (!imported.length) {
        messageApi.warning('未识别到有效数据');
        return Upload.LIST_IGNORE;
      }
      setList((prev) => [...imported, ...prev]);
      messageApi.success(`导入成功 ${imported.length} 条`);
      return Upload.LIST_IGNORE;
    },
  };

  const compareTargetRecord = list.find((item) => item.id === compareTargetId) ?? null;
  const compareRows = compareBase && compareTargetRecord
    ? [
        ['Id', compareBase.code, compareTargetRecord.code],
        ['序列号', compareBase.serialNo, compareTargetRecord.serialNo],
        ['IP', compareBase.ip, compareTargetRecord.ip],
        ['类型', compareBase.robotType, compareTargetRecord.robotType],
        ['分组', compareBase.group, compareTargetRecord.group],
        ['注册时间', compareBase.registeredAt, compareTargetRecord.registeredAt],
      ]
    : [];

  const columns: ColumnsType<RobotConfigRecord> = [
    { title: 'Id', dataIndex: 'code', key: 'code', width: 120 },
    { title: '序列号', dataIndex: 'serialNo', key: 'serialNo', width: 140 },
    { title: 'IP', dataIndex: 'ip', key: 'ip', width: 150 },
    { title: '类型', dataIndex: 'robotType', key: 'robotType', width: 140 },
    { title: '分组', dataIndex: 'group', key: 'group', width: 110 },
    { title: '注册时间', dataIndex: 'registeredAt', key: 'registeredAt', width: 180 },
    {
      title: '操作',
      key: 'action',
      width: 420,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4} wrap>
          <Button type="link" onClick={() => navigate('/deployConfig/scene/configTemplate')}>
            控制
          </Button>
          <Button type="link" onClick={() => messageApi.success(`开始建图：${record.serialNo}`)}>
            建图
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(record, 'base')}>
            编辑
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => deleteRecord(record)}>
            删除
          </Button>
          <Button type="link" onClick={() => openEdit(record, 'params')}>
            配置
          </Button>
          <Button
            type="link"
            onClick={() => {
              const options = list.filter((item) => item.id !== record.id);
              setCompareBase(record);
              setCompareTargetId(options[0]?.id);
            }}
          >
            对比配置
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
            机器人配置
          </Typography.Title>
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} lg={10}>
              <Input allowClear prefix={<SearchOutlined />} placeholder="Id/序列号/IP" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
            </Col>
            <Col xs={24} lg={14}>
              <Space wrap style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Upload {...importProps}>
                  <Button icon={<UploadOutlined />}>导入</Button>
                </Upload>
                <Button onClick={exportCsv}>导出</Button>
              </Space>
            </Col>
          </Row>
        </Space>
      </Card>

      <Card>
        <Table rowKey="id" columns={columns} dataSource={filteredList} pagination={{ pageSize: 10, showSizeChanger: false }} scroll={{ x: 1700 }} />
      </Card>

      <Modal
        title="机器人配置"
        open={Boolean(editing)}
        onCancel={closeEdit}
        width={isLaptop ? 960 : 1080}
        style={{ top: 16 }}
        styles={{
          body: {
            maxHeight: '80vh',
            overflowY: 'auto',
            overflowX: 'hidden',
            paddingTop: 12,
          },
        }}
        footer={[
          <Button key="cancel" onClick={closeEdit}>
            取消
          </Button>,
          <Button key="save" type="primary" onClick={saveEdit}>
            保存
          </Button>,
        ]}
        destroyOnClose
      >
        <Tabs
          size="large"
          activeKey={editTab}
          onChange={(key) => setEditTab(key as 'base' | 'params')}
          items={[
            {
              key: 'base',
              label: '基础信息',
              children: (
                <Form form={form} layout="vertical">
                  <Row gutter={12}>
                    <Col xs={24} md={12}>
                      <Form.Item label="Id" name="code" rules={[{ required: true, message: '请输入Id' }]}>
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="序列号" name="serialNo" rules={[{ required: true, message: '请输入序列号' }]}>
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="IP" name="ip" rules={[{ required: true, message: '请输入IP' }]}>
                        <Input disabled />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="类型" name="robotType" rules={[{ required: true, message: '请选择类型' }]}>
                        <Select options={robotTypes.map((item) => ({ label: item, value: item }))} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="分组" name="group" rules={[{ required: true, message: '请选择分组' }]}>
                        <Select options={groups.map((item) => ({ label: item, value: item }))} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="注册时间" name="registeredAt" rules={[{ required: true, message: '请输入注册时间' }]}>
                        <Input />
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
                  <Col xs={24} md={isLaptop ? 7 : 5}>
                    <Card size="small" title="参数分类" styles={{ body: { maxHeight: 620, overflowY: 'auto' } }}>
                      <Tree treeData={categoryTree} defaultExpandAll selectedKeys={[selectedCategory]} onSelect={(keys: Key[]) => setSelectedCategory(String(keys[0] ?? ''))} />
                    </Card>
                  </Col>
                  <Col xs={24} md={isLaptop ? 17 : 19}>
                    <Card
                      size="small"
                      title={`分类：${selectedCategory}`}
                      extra={
                        <Space>
                          <Button size="small" onClick={restoreCategoryDefaults}>
                            分类恢复默认
                          </Button>
                        </Space>
                      }
                      styles={{ body: { maxHeight: 620, overflowY: 'auto' } }}
                    >
                      <Space direction="vertical" size={10} style={{ width: '100%' }}>
                        {filteredParams.map((item) => (
                          <Card
                            key={item.id}
                            size="small"
                            title={item.name}
                            extra={
                              <Button type="link" size="small" onClick={() => restoreOneParamDefault(item.id)}>
                                恢复默认
                              </Button>
                            }
                          >
                            <Row gutter={[12, 8]}>
                              <Col xs={24} md={10}>
                                <Typography.Text type="secondary">参数值</Typography.Text>
                                <Input value={item.value} onChange={(event) => updateParamValue(item.id, event.target.value)} />
                              </Col>
                              <Col xs={24} md={6}>
                                <Typography.Text type="secondary">默认值</Typography.Text>
                                <Input value={item.defaultValue} disabled />
                              </Col>
                              <Col xs={24} md={4}>
                                <Typography.Text type="secondary">单位</Typography.Text>
                                <Input value={item.unit} disabled />
                              </Col>
                              <Col xs={24} md={4}>
                                <Typography.Text type="secondary">范围</Typography.Text>
                                <Input value={item.range} disabled />
                              </Col>
                            </Row>
                          </Card>
                        ))}
                        {!filteredParams.length && <Typography.Text type="secondary">当前分类暂无参数</Typography.Text>}
                      </Space>
                    </Card>
                  </Col>
                </Row>
              ),
            },
          ]}
        />
      </Modal>

      <Modal
        title="对比配置"
        open={Boolean(compareBase)}
        onCancel={() => {
          setCompareBase(null);
          setCompareTargetId(undefined);
        }}
        footer={null}
        destroyOnClose
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Select
            style={{ width: '100%' }}
            placeholder="选择对比对象"
            value={compareTargetId}
            options={list.filter((item) => item.id !== compareBase?.id).map((item) => ({ label: `${item.code} - ${item.serialNo}`, value: item.id }))}
            onChange={setCompareTargetId}
          />
          <Table
            rowKey={(row) => row[0]}
            pagination={false}
            dataSource={compareRows}
            columns={[
              { title: '字段', dataIndex: 0, key: 'field', width: 160 },
              {
                title: '当前配置',
                dataIndex: 1,
                key: 'base',
                render: (value: string, row: string[]) => <Typography.Text type={row[1] !== row[2] ? 'danger' : undefined}>{value}</Typography.Text>,
              },
              {
                title: '对比配置',
                dataIndex: 2,
                key: 'target',
                render: (value: string, row: string[]) => <Typography.Text type={row[1] !== row[2] ? 'danger' : undefined}>{value}</Typography.Text>,
              },
            ]}
          />
        </Space>
      </Modal>
    </Space>
  );
}
