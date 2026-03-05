import { DeleteOutlined, EditOutlined, ExclamationCircleFilled, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Card, Col, Form, Grid, Input, Modal, Row, Select, Space, Table, Tree, Typography, Upload, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { UploadProps } from 'antd/es/upload';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadConfigTemplateSnapshots, saveConfigTemplateSnapshots } from '../../../logic/deployConfig/configTemplateStore';

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

type ConfigCompareRow = {
  key: string;
  categoryKey: string;
  field: string;
  currentValue: string;
  targetValue: string;
  different: boolean;
};

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

function displayIp(ip: string, id: string) {
  const trimmed = ip.trim();
  if (trimmed) {
    return trimmed;
  }
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % 200;
  }
  return `192.168.10.${hash + 20}`;
}

export function ConfigTemplatePage() {
  const navigate = useNavigate();
  const [form] = Form.useForm<RobotConfigFormValues>();
  const [messageApi, contextHolder] = message.useMessage();
  const [modalApi, modalContextHolder] = Modal.useModal();
  const screens = Grid.useBreakpoint();
  const isLaptop = !screens.xxl;

  const [list, setList] = useState<RobotConfigRecord[]>(() => {
    const stored = loadConfigTemplateSnapshots();
    return stored.length ? stored : initialList;
  });
  const [keyword, setKeyword] = useState('');
  const [editing, setEditing] = useState<RobotConfigRecord | null>(null);
  const [compareBase, setCompareBase] = useState<RobotConfigRecord | null>(null);
  const [compareTargetId, setCompareTargetId] = useState<string>();
  const [compareCategory, setCompareCategory] = useState<string>('__base');

  const filteredList = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    if (!k) {
      return list;
    }
    return list.filter((item) => `${item.code} ${item.serialNo} ${item.ip} ${item.robotType} ${item.group}`.toLowerCase().includes(k));
  }, [keyword, list]);

  useEffect(() => {
    saveConfigTemplateSnapshots(list);
  }, [list]);

  const closeEdit = () => {
    setEditing(null);
    form.resetFields();
  };

  const openEdit = (record: RobotConfigRecord) => {
    setEditing(record);
    form.setFieldsValue({
      code: record.code,
      serialNo: record.serialNo,
      ip: record.ip,
      robotType: record.robotType,
      group: record.group,
      registeredAt: record.registeredAt,
    });
  };

  const saveEdit = async () => {
    const values = await form.validateFields();
    if (!editing) {
      return;
    }
    setList((prev) => prev.map((item) => (item.id === editing.id ? { ...item, group: values.group } : item)));
    messageApi.success('已保存');
    closeEdit();
  };

  const deleteRecord = (record: RobotConfigRecord) => {
    modalApi.confirm({
      title: '确认删除该配置吗？',
      icon: <ExclamationCircleFilled />,
      content: `${record.code} - ${record.serialNo}`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        setList((prev) => prev.filter((item) => item.id !== record.id));
        const nextTemplates = loadConfigTemplateSnapshots().filter((item) => item.id !== record.id);
        saveConfigTemplateSnapshots(nextTemplates);
      },
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

  const compareTargetRecord = useMemo(() => list.find((item) => item.id === compareTargetId) ?? null, [compareTargetId, list]);
  const compareTemplateOptions = useMemo(
    () => list.filter((item) => item.id !== compareBase?.id).map((item) => ({ label: `${item.code} - ${item.serialNo}`, value: item.id })),
    [compareBase?.id, list],
  );

  useEffect(() => {
    if (!compareBase) {
      return;
    }
    const valid = compareTemplateOptions.some((item) => item.value === compareTargetId);
    if (!valid) {
      setCompareTargetId(compareTemplateOptions[0]?.value);
    }
  }, [compareBase, compareTargetId, compareTemplateOptions]);

  const compareRows = useMemo<ConfigCompareRow[]>(() => {
    if (!compareBase || !compareTargetRecord) {
      return [];
    }
    const normalize = (value: unknown) => {
      const text = String(value ?? '').trim();
      return text ? text : '-';
    };
    const baseRows: ConfigCompareRow[] = [
      { key: 'code', categoryKey: '__base', field: 'Id', currentValue: normalize(compareBase.code), targetValue: normalize(compareTargetRecord.code), different: compareBase.code !== compareTargetRecord.code },
      { key: 'serialNo', categoryKey: '__base', field: '序列号', currentValue: normalize(compareBase.serialNo), targetValue: normalize(compareTargetRecord.serialNo), different: compareBase.serialNo !== compareTargetRecord.serialNo },
      {
        key: 'ip',
        categoryKey: '__base',
        field: 'IP',
        currentValue: displayIp(compareBase.ip, compareBase.id),
        targetValue: displayIp(compareTargetRecord.ip, compareTargetRecord.id),
        different: displayIp(compareBase.ip, compareBase.id) !== displayIp(compareTargetRecord.ip, compareTargetRecord.id),
      },
      { key: 'robotType', categoryKey: '__base', field: '类型', currentValue: normalize(compareBase.robotType), targetValue: normalize(compareTargetRecord.robotType), different: compareBase.robotType !== compareTargetRecord.robotType },
      { key: 'group', categoryKey: '__base', field: '分组', currentValue: normalize(compareBase.group), targetValue: normalize(compareTargetRecord.group), different: compareBase.group !== compareTargetRecord.group },
      { key: 'registeredAt', categoryKey: '__base', field: '注册时间', currentValue: normalize(compareBase.registeredAt), targetValue: normalize(compareTargetRecord.registeredAt), different: compareBase.registeredAt !== compareTargetRecord.registeredAt },
      { key: 'paramsCount', categoryKey: '__base', field: '参数数量', currentValue: normalize(compareBase.params.length), targetValue: normalize(compareTargetRecord.params.length), different: compareBase.params.length !== compareTargetRecord.params.length },
    ];

    const baseParamMap = new Map(compareBase.params.map((item) => [`${item.categoryPath}|${item.name}`, item.value]));
    const targetParamMap = new Map(compareTargetRecord.params.map((item) => [`${item.categoryPath}|${item.name}`, item.value]));
    const paramKeys = Array.from(new Set([...baseParamMap.keys(), ...targetParamMap.keys()])).sort((a, b) => a.localeCompare(b, 'zh-CN'));
    const paramRows = paramKeys.map((key) => {
      const [categoryPath, paramName] = key.split('|');
      const currentValue = baseParamMap.get(key) ?? '-';
      const targetValue = targetParamMap.get(key) ?? '-';
      return {
        key: `param-${categoryPath}-${paramName}`,
        categoryKey: categoryPath,
        field: paramName,
        currentValue,
        targetValue,
        different: currentValue !== targetValue,
      };
    });

    return [...baseRows, ...paramRows];
  }, [compareBase, compareTargetRecord]);

  const compareDiffCategoryKeys = useMemo(() => {
    const keys = new Set<string>();
    compareRows
      .filter((row) => row.different)
      .forEach((row) => {
        if (row.categoryKey === '__base') {
          keys.add('__base');
          return;
        }
        const segments = row.categoryKey.split('/');
        let path = '';
        segments.forEach((segment) => {
          path = path ? `${path}/${segment}` : segment;
          keys.add(path);
        });
      });
    return keys;
  }, [compareRows]);

  const compareTreeData = useMemo(() => {
    const withDiffStyle = (nodes: any[]): any[] =>
      nodes.map((node) => ({
        ...node,
        title: <span style={compareDiffCategoryKeys.has(String(node.key)) ? { color: '#ff4d4f' } : undefined}>{node.title}</span>,
        children: node.children ? withDiffStyle(node.children as any[]) : undefined,
      }));

    return [
      {
        title: <span style={compareDiffCategoryKeys.has('__base') ? { color: '#ff4d4f' } : undefined}>基础信息</span>,
        key: '__base',
      },
      ...withDiffStyle(categoryTree as any[]),
    ];
  }, [compareDiffCategoryKeys]);

  const filteredCompareRows = useMemo(() => {
    if (!compareCategory) {
      return compareRows;
    }
    return compareRows.filter((row) => row.categoryKey === compareCategory || row.categoryKey.startsWith(`${compareCategory}/`));
  }, [compareCategory, compareRows]);
const columns: ColumnsType<RobotConfigRecord> = [
    { title: 'Id', dataIndex: 'code', key: 'code', width: 120 },
    { title: '序列号', dataIndex: 'serialNo', key: 'serialNo', width: 140 },
    { title: 'IP', dataIndex: 'ip', key: 'ip', width: 150, render: (value: string, record) => displayIp(value, record.id) },
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
          <Button type="link" onClick={() => navigate(`/operationMaintenance/robot/robotManage/${record.serialNo}/detail`)}>
            控制
          </Button>
          <Button type="link" onClick={() => messageApi.success(`开始建图：${record.serialNo}`)}>
            建图
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => deleteRecord(record)}>
            删除
          </Button>
          <Button
            type="link"
            onClick={() => {
              const options = list.filter((item) => item.id !== record.id);
              setCompareBase(record);
              setCompareTargetId(options[0]?.id);
              setCompareCategory('__base');
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
      {modalContextHolder}
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
        <Form form={form} layout="vertical">
          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item label="Id" name="code">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="序列号" name="serialNo">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="IP" name="ip">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="类型" name="robotType">
                <Select disabled options={robotTypes.map((item) => ({ label: item, value: item }))} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="分组" name="group" rules={[{ required: true, message: '请选择分组' }]}>
                <Select options={groups.map((item) => ({ label: item, value: item }))} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="注册时间" name="registeredAt">
                <Input disabled />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

            <Modal
        title="配置对比"
        open={Boolean(compareBase)}
        onCancel={() => {
          setCompareBase(null);
          setCompareTargetId(undefined);
          setCompareCategory('__base');
        }}
        width={isLaptop ? 960 : 1080}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setCompareBase(null);
              setCompareTargetId(undefined);
              setCompareCategory('__base');
            }}
          >
            关闭
          </Button>,
        ]}
        destroyOnClose
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Row gutter={12}>
            <Col span={12}>
              <Typography.Text type="secondary">当前配置</Typography.Text>
              <Input value={compareBase ? `${compareBase.code} - ${compareBase.serialNo}` : ''} disabled />
            </Col>
            <Col span={12}>
              <Typography.Text type="secondary">对比模板</Typography.Text>
              <Select
                style={{ width: '100%' }}
                placeholder="选择对比模板"
                value={compareTargetId}
                showSearch
                optionFilterProp="label"
                options={compareTemplateOptions}
                onChange={setCompareTargetId}
              />
            </Col>
          </Row>
          <Row gutter={12}>
            <Col xs={24} md={isLaptop ? 8 : 6}>
              <Card size="small" title="对比分组" styles={{ body: { maxHeight: 560, overflowY: 'auto' } }}>
                <Tree treeData={compareTreeData} defaultExpandAll selectedKeys={[compareCategory]} onSelect={(keys) => setCompareCategory(String(keys[0] ?? '__base'))} />
              </Card>
            </Col>
            <Col xs={24} md={isLaptop ? 16 : 18}>
              <Card size="small" title={`分组：${compareCategory === '__base' ? '基础信息' : compareCategory}`}>
                <Table
                  rowKey="key"
                  dataSource={filteredCompareRows}
                  pagination={{ pageSize: 12, showSizeChanger: false }}
                  locale={{ emptyText: '该分组暂无可对比字段' }}
                  columns={[
                    { title: '字段', dataIndex: 'field', key: 'field', width: 240 },
                    {
                      title: compareBase?.code ?? '当前配置',
                      dataIndex: 'currentValue',
                      key: 'currentValue',
                      render: (value: string, record: ConfigCompareRow) => <Typography.Text type={record.different ? 'danger' : undefined}>{value}</Typography.Text>,
                    },
                    {
                      title: compareTargetRecord?.code ?? '对比模板',
                      dataIndex: 'targetValue',
                      key: 'targetValue',
                      render: (value: string, record: ConfigCompareRow) => <Typography.Text type={record.different ? 'danger' : undefined}>{value}</Typography.Text>,
                    },
                  ]}
                />
              </Card>
            </Col>
          </Row>
        </Space>
      </Modal>
    </Space>
  );
}
