import { DeleteOutlined, DownloadOutlined, EditOutlined, ExclamationCircleFilled, PlusOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Card, Col, Form, Grid, Input, Modal, Row, Select, Space, Table, Tabs, Tree, Typography, Upload, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { UploadProps } from 'antd/es/upload';
import type { Key } from 'react';
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

interface ConfigCompareRow {
  key: string;
  categoryKey: string;
  field: string;
  currentValue: string;
  targetValue: string;
  different: boolean;
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
  updatedBy: string;
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
    title: '底盘驱动',
    key: '底盘驱动',
    children: [
      { title: '轮速控制', key: '底盘驱动/轮速控制' },
      { title: '差速参数', key: '底盘驱动/差速参数' },
      { title: '制动策略', key: '底盘驱动/制动策略' },
    ],
  },
  {
    title: '关节执行器',
    key: '关节执行器',
    children: [
      { title: '关节基础', key: '关节执行器/关节基础' },
      { title: '关节限位', key: '关节执行器/关节限位' },
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
      { title: '里程计', key: '传感器/里程计' },
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
  { id: 'tpl-1', name: '定位频率', value: '10', defaultValue: '10', unit: 'Hz', range: '1~20', remoteEditable: true, categoryPath: '算法/SLAM' },
  { id: 'tpl-2', name: '重定位阈值', value: '0.45', defaultValue: '0.45', unit: '-', range: '0.1~1.0', remoteEditable: true, categoryPath: '算法/SLAM' },
  { id: 'tpl-3', name: '避障距离', value: '0.8', defaultValue: '0.8', unit: 'm', range: '0.2~2', remoteEditable: true, categoryPath: '算法/避障' },
  { id: 'tpl-4', name: '路径重规划间隔', value: '500', defaultValue: '500', unit: 'ms', range: '100~2000', remoteEditable: true, categoryPath: '算法/路径规划' },
  { id: 'tpl-5', name: '最大速度', value: '1.2', defaultValue: '1.0', unit: 'm/s', range: '0.2~2.0', remoteEditable: false, categoryPath: '运动控制/速度控制' },
  { id: 'tpl-6', name: '最大角速度', value: '120', defaultValue: '100', unit: 'deg/s', range: '20~180', remoteEditable: false, categoryPath: '运动控制/转向控制' },
  { id: 'tpl-7', name: '轮径', value: '0.18', defaultValue: '0.18', unit: 'm', range: '0.08~0.4', remoteEditable: false, categoryPath: '底盘驱动/轮速控制' },
  { id: 'tpl-8', name: '轮距', value: '0.52', defaultValue: '0.52', unit: 'm', range: '0.2~1.2', remoteEditable: false, categoryPath: '底盘驱动/差速参数' },
  { id: 'tpl-9', name: '轮速闭环频率', value: '100', defaultValue: '100', unit: 'Hz', range: '20~500', remoteEditable: true, categoryPath: '底盘驱动/轮速控制' },
  { id: 'tpl-10', name: '制动减速度', value: '0.8', defaultValue: '0.8', unit: 'm/s²', range: '0.2~2.0', remoteEditable: true, categoryPath: '底盘驱动/制动策略' },
  { id: 'tpl-11', name: '关节数量', value: '6', defaultValue: '6', unit: '个', range: '1~20', remoteEditable: false, categoryPath: '关节执行器/关节基础' },
  { id: 'tpl-12', name: '关节最大扭矩', value: '18', defaultValue: '18', unit: 'N·m', range: '2~80', remoteEditable: false, categoryPath: '关节执行器/关节基础' },
  { id: 'tpl-13', name: '关节角度上限', value: '160', defaultValue: '160', unit: 'deg', range: '30~180', remoteEditable: true, categoryPath: '关节执行器/关节限位' },
  { id: 'tpl-14', name: '关节角度下限', value: '-160', defaultValue: '-160', unit: 'deg', range: '-180~-30', remoteEditable: true, categoryPath: '关节执行器/关节限位' },
  { id: 'tpl-15', name: '关节P增益', value: '1.2', defaultValue: '1.2', unit: '-', range: '0.1~5', remoteEditable: true, categoryPath: '关节执行器/关节PID' },
  { id: 'tpl-16', name: '关节I增益', value: '0.08', defaultValue: '0.08', unit: '-', range: '0~1', remoteEditable: true, categoryPath: '关节执行器/关节PID' },
  { id: 'tpl-17', name: '关节D增益', value: '0.01', defaultValue: '0.01', unit: '-', range: '0~1', remoteEditable: true, categoryPath: '关节执行器/关节PID' },
  { id: 'tpl-18', name: 'RGB分辨率', value: '1920x1080', defaultValue: '1920x1080', unit: '-', range: '640x480~3840x2160', remoteEditable: true, categoryPath: '视觉相机/RGB相机' },
  { id: 'tpl-19', name: 'RGB帧率', value: '30', defaultValue: '30', unit: 'fps', range: '5~60', remoteEditable: true, categoryPath: '视觉相机/RGB相机' },
  { id: 'tpl-20', name: '深度量程', value: '0.2~8.0', defaultValue: '0.2~8.0', unit: 'm', range: '0.1~20', remoteEditable: true, categoryPath: '视觉相机/深度相机' },
  { id: 'tpl-21', name: '深度帧率', value: '30', defaultValue: '30', unit: 'fps', range: '5~90', remoteEditable: true, categoryPath: '视觉相机/深度相机' },
  { id: 'tpl-22', name: '相机外参更新周期', value: '30', defaultValue: '30', unit: 'day', range: '1~180', remoteEditable: true, categoryPath: '视觉相机/外参标定' },
  { id: 'tpl-23', name: '雷达扫描频率', value: '15', defaultValue: '15', unit: 'Hz', range: '5~30', remoteEditable: false, categoryPath: '传感器/激光雷达' },
  { id: 'tpl-24', name: '雷达角分辨率', value: '0.25', defaultValue: '0.25', unit: 'deg', range: '0.1~1.0', remoteEditable: false, categoryPath: '传感器/激光雷达' },
  { id: 'tpl-25', name: 'IMU采样率', value: '200', defaultValue: '200', unit: 'Hz', range: '50~1000', remoteEditable: false, categoryPath: '传感器/IMU' },
  { id: 'tpl-26', name: 'IMU零偏阈值', value: '0.02', defaultValue: '0.02', unit: 'g', range: '0~0.2', remoteEditable: true, categoryPath: '传感器/IMU' },
  { id: 'tpl-27', name: '里程计系数', value: '1.00', defaultValue: '1.00', unit: '-', range: '0.8~1.2', remoteEditable: true, categoryPath: '传感器/里程计' },
  { id: 'tpl-28', name: '低电量阈值', value: '20', defaultValue: '20', unit: '%', range: '5~50', remoteEditable: true, categoryPath: '电源管理/电池阈值' },
  { id: 'tpl-29', name: '临界电量阈值', value: '10', defaultValue: '10', unit: '%', range: '3~30', remoteEditable: true, categoryPath: '电源管理/电池阈值' },
  { id: 'tpl-30', name: '待机休眠时长', value: '300', defaultValue: '300', unit: 's', range: '30~3600', remoteEditable: true, categoryPath: '电源管理/功耗策略' },
  { id: 'tpl-31', name: '心跳周期', value: '1', defaultValue: '1', unit: 's', range: '0.2~10', remoteEditable: true, categoryPath: '通讯与网络/消息总线' },
  { id: 'tpl-32', name: '重连次数', value: '5', defaultValue: '5', unit: '次', range: '1~20', remoteEditable: true, categoryPath: '通讯与网络/网络配置' },
  { id: 'tpl-34', name: '急停响应时间', value: '80', defaultValue: '80', unit: 'ms', range: '20~200', remoteEditable: false, categoryPath: '安全策略/急停策略' },
  { id: 'tpl-33', name: '限速上限', value: '1.0', defaultValue: '1.0', unit: 'm/s', range: '0.2~1.5', remoteEditable: true, categoryPath: '安全策略/限速策略' },
];

function cloneConfigParams(params: ConfigParam[]): ConfigParam[] {
  return params.map((item) => ({ ...item }));
}

function buildDetailedParams(existing: ConfigParam[] = []) {
  const template = cloneConfigParams(defaultParamTemplate);
  const existingByCategoryAndName = new Map(existing.map((item) => [`${item.categoryPath}|${item.name}`, item]));

  const mergedTemplate = template.map((item) => {
    const matched = existingByCategoryAndName.get(`${item.categoryPath}|${item.name}`);
    if (!matched) {
      return item;
    }
    return {
      ...item,
      value: matched.value,
      remoteEditable: matched.remoteEditable,
      range: matched.range || item.range,
      unit: matched.unit || item.unit,
    };
  });

  const templateKeySet = new Set(mergedTemplate.map((item) => `${item.categoryPath}|${item.name}`));
  const appendExisting = existing
    .filter((item) => !templateKeySet.has(`${item.categoryPath}|${item.name}`))
    .map((item) => ({ ...item }));

  return [...mergedTemplate, ...appendExisting];
}

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
    updatedBy: 'admin',
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
  {
    id: 'cfg-2',
    configNo: 'CFG-002',
    configName: '巡检夜班配置',
    robotType: '巡检机器人',
    group: 'B组',
    firmware: 'v2.4.0',
    currentVersion: 'v1.0.3',
    status: '已发布',
    createdAt: '2026-02-10 10:05',
    updatedAt: '2026-03-02 18:40',
    updatedBy: 'admin',
    description: '夜间低速高精度巡检参数',
    isDefault: false,
    params: [
      { id: 'p21', name: '定位频率', value: '12', defaultValue: '10', unit: 'Hz', range: '1~20', remoteEditable: true, categoryPath: '算法/SLAM' },
      { id: 'p22', name: '避障距离', value: '1.1', defaultValue: '0.8', unit: 'm', range: '0.2~2', remoteEditable: true, categoryPath: '算法/避障' },
      { id: 'p23', name: '最大速度', value: '0.9', defaultValue: '1.0', unit: 'm/s', range: '0.2~2.0', remoteEditable: false, categoryPath: '运动控制/速度控制' },
      { id: 'p24', name: '轮速闭环频率', value: '140', defaultValue: '100', unit: 'Hz', range: '20~500', remoteEditable: true, categoryPath: '底盘驱动/轮速控制' },
      { id: 'p25', name: '低电量阈值', value: '25', defaultValue: '20', unit: '%', range: '5~50', remoteEditable: true, categoryPath: '电源管理/电池阈值' },
    ],
    versions: [
      { id: 'v21', version: 'v1.0.3', publishedAt: '2026-03-02 18:35', publisher: 'admin', changeLog: '夜班参数优化：降速并提高避障距离' },
      { id: 'v22', version: 'v1.0.0', publishedAt: '2026-02-12 09:20', publisher: 'admin', changeLog: '初始版本' },
    ],
    dispatches: [
      { id: 'd21', robotCode: 'RB-007', dispatchedAt: '2026-03-02 19:10', status: '成功', result: '已生效' },
      { id: 'd22', robotCode: 'RB-009', dispatchedAt: '2026-03-02 19:15', status: '失败', result: '连接超时' },
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
  const screens = Grid.useBreakpoint();
  const isLaptop = !screens.xxl;
  const [list, setList] = useState<RobotConfigRecord[]>(initialList);
  const [keyword, setKeyword] = useState('');
  const [robotTypeFilter, setRobotTypeFilter] = useState<string | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RobotConfigRecord | null>(null);
  const [draftParams, setDraftParams] = useState<ConfigParam[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('算法/SLAM');
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [baseCompareId, setBaseCompareId] = useState<string | null>(null);
  const [targetCompareId, setTargetCompareId] = useState<string | undefined>();
  const [compareCategory, setCompareCategory] = useState<string>('__base');

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
    setDraftParams(buildDetailedParams());
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
    setDraftParams(buildDetailedParams(record.params));
    setModalOpen(true);
  };

  const closeModal = () => {
    setEditing(null);
    setModalOpen(false);
    form.resetFields();
    setDraftParams([]);
  };

  const filteredParams = draftParams.filter((item) => item.categoryPath === selectedCategory);

  const filteredList = useMemo(() => {
    return list.filter((item) => {
      const keywordMatched =
        !keyword ||
        item.configNo.toLowerCase().includes(keyword.toLowerCase()) ||
        item.configName.toLowerCase().includes(keyword.toLowerCase());
      const typeMatched = !robotTypeFilter || item.robotType === robotTypeFilter;
      return keywordMatched && typeMatched;
    });
  }, [keyword, list, robotTypeFilter]);

  const saveRecord = async () => {
    const values = await form.validateFields();
    if (editing) {
      setList((prev) =>
        prev.map((item) =>
          item.id === editing.id
            ? {
                ...item,
                ...values,
                params: cloneConfigParams(draftParams),
                updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
                updatedBy: 'admin',
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
          currentVersion: '-',
          status: '草稿',
          createdAt,
          updatedAt: createdAt,
          updatedBy: 'admin',
          description: values.description,
        isDefault: false,
        params: cloneConfigParams(draftParams),
        versions: [],
        dispatches: [],
      };
      setList((prev) => [next, ...prev]);
      messageApi.success('配置已创建');
    }
    closeModal();
  };

  const updateParamValue = (id: string, value: string) => {
    setDraftParams((prev) => prev.map((item) => (item.id === id ? { ...item, value } : item)));
  };

  const restoreOneParamDefault = (id: string) => {
    setDraftParams((prev) => prev.map((item) => (item.id === id ? { ...item, value: item.defaultValue } : item)));
  };

  const restoreCategoryDefaults = () => {
    const count = filteredParams.length;
    if (!count) {
      messageApi.warning('当前分类无参数可恢复');
      return;
    }
    setDraftParams((prev) => prev.map((item) => (item.categoryPath === selectedCategory ? { ...item, value: item.defaultValue } : item)));
    messageApi.success(`已恢复当前分类 ${count} 个参数默认值`);
  };

  const handleCategorySelect = (keys: Key[]) => {
    setSelectedCategory(String(keys[0] ?? ''));
  };

  const openCompareModal = (record: RobotConfigRecord) => {
    const options = list.filter((item) => item.id !== record.id);
    setBaseCompareId(record.id);
    setTargetCompareId(options[0]?.id);
    setCompareCategory('__base');
    setCompareModalOpen(true);
  };

  const closeCompareModal = () => {
    setCompareModalOpen(false);
    setBaseCompareId(null);
    setTargetCompareId(undefined);
    setCompareCategory('__base');
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
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
    { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 170 },
    { title: '编辑人', dataIndex: 'updatedBy', key: 'updatedBy', width: 120 },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4} wrap>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Button type="link" onClick={() => openCompareModal(record)}>
            对比
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => deleteRecord(record)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const baseCompareRecord = useMemo(() => list.find((item) => item.id === baseCompareId) ?? null, [baseCompareId, list]);
  const targetCompareRecord = useMemo(() => list.find((item) => item.id === targetCompareId) ?? null, [targetCompareId, list]);

  const compareRows = useMemo<ConfigCompareRow[]>(() => {
    if (!baseCompareRecord || !targetCompareRecord) {
      return [];
    }
    const normalize = (value: unknown) => String(value ?? '');
    const baseRows: ConfigCompareRow[] = [
      { key: 'configNo', categoryKey: '__base', field: '配置编号', currentValue: normalize(baseCompareRecord.configNo), targetValue: normalize(targetCompareRecord.configNo), different: baseCompareRecord.configNo !== targetCompareRecord.configNo },
      { key: 'configName', categoryKey: '__base', field: '配置名称', currentValue: normalize(baseCompareRecord.configName), targetValue: normalize(targetCompareRecord.configName), different: baseCompareRecord.configName !== targetCompareRecord.configName },
      { key: 'robotType', categoryKey: '__base', field: '机器人类型', currentValue: normalize(baseCompareRecord.robotType), targetValue: normalize(targetCompareRecord.robotType), different: baseCompareRecord.robotType !== targetCompareRecord.robotType },
      { key: 'group', categoryKey: '__base', field: '分组', currentValue: normalize(baseCompareRecord.group), targetValue: normalize(targetCompareRecord.group), different: baseCompareRecord.group !== targetCompareRecord.group },
      { key: 'firmware', categoryKey: '__base', field: '适用固件版本', currentValue: normalize(baseCompareRecord.firmware), targetValue: normalize(targetCompareRecord.firmware), different: baseCompareRecord.firmware !== targetCompareRecord.firmware },
      { key: 'status', categoryKey: '__base', field: '状态', currentValue: normalize(baseCompareRecord.status), targetValue: normalize(targetCompareRecord.status), different: baseCompareRecord.status !== targetCompareRecord.status },
      { key: 'description', categoryKey: '__base', field: '描述', currentValue: normalize(baseCompareRecord.description ?? '-'), targetValue: normalize(targetCompareRecord.description ?? '-'), different: (baseCompareRecord.description ?? '-') !== (targetCompareRecord.description ?? '-') },
      { key: 'paramsCount', categoryKey: '__base', field: '参数数量', currentValue: normalize(baseCompareRecord.params.length), targetValue: normalize(targetCompareRecord.params.length), different: baseCompareRecord.params.length !== targetCompareRecord.params.length },
    ];

    const baseParamMap = new Map(baseCompareRecord.params.map((item) => [`${item.categoryPath}|${item.name}`, item.value]));
    const targetParamMap = new Map(targetCompareRecord.params.map((item) => [`${item.categoryPath}|${item.name}`, item.value]));
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
  }, [baseCompareRecord, targetCompareRecord]);

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
      ...withDiffStyle(categoryTree),
    ];
  }, [compareDiffCategoryKeys]);

  const filteredCompareRows = useMemo(() => {
    if (!compareCategory) {
      return compareRows;
    }
    return compareRows.filter((row) => row.categoryKey === compareCategory || row.categoryKey.startsWith(`${compareCategory}/`));
  }, [compareCategory, compareRows]);

  const buildCsvRows = (content: string): string[][] => {
    const normalized = content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = '';
    let inQuotes = false;
    for (let i = 0; i < normalized.length; i += 1) {
      const ch = normalized[i];
      if (ch === '"') {
        const next = normalized[i + 1];
        if (inQuotes && next === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }
      if (ch === ',' && !inQuotes) {
        row.push(cell.trim());
        cell = '';
        continue;
      }
      if (ch === '\n' && !inQuotes) {
        row.push(cell.trim());
        rows.push(row);
        row = [];
        cell = '';
        continue;
      }
      cell += ch;
    }
    if (cell.length || row.length) {
      row.push(cell.trim());
      rows.push(row);
    }
    return rows.filter((item) => item.some((value) => value.length));
  };

  const buildHtmlTableRows = (content: string): string[][] => {
    const doc = new DOMParser().parseFromString(content, 'text/html');
    const trs = Array.from(doc.querySelectorAll('tr'));
    const grid: string[][] = [];
    const occupied = new Map<string, true>();
    trs.forEach((tr, rowIndex) => {
      const row: string[] = grid[rowIndex] ?? [];
      let colIndex = 0;
      const cells = Array.from(tr.querySelectorAll('th,td'));
      cells.forEach((cell) => {
        while (occupied.has(`${rowIndex}-${colIndex}`)) {
          colIndex += 1;
        }
        const value = cell.textContent?.trim() ?? '';
        const colSpan = Number(cell.getAttribute('colspan') ?? '1') || 1;
        const rowSpan = Number(cell.getAttribute('rowspan') ?? '1') || 1;
        for (let r = rowIndex; r < rowIndex + rowSpan; r += 1) {
          if (!grid[r]) {
            grid[r] = [];
          }
          for (let c = colIndex; c < colIndex + colSpan; c += 1) {
            grid[r][c] = value;
            if (r !== rowIndex || c !== colIndex) {
              occupied.set(`${r}-${c}`, true);
            }
          }
        }
        colIndex += colSpan;
      });
      grid[rowIndex] = row;
    });
    return grid.map((row) => row.map((cell) => cell ?? '')).filter((row) => row.some((value) => value.length));
  };

  const importRowsToRecords = (rows: string[][]) => {
    if (rows.length <= 1) {
      return { nextRecords: [] as RobotConfigRecord[], skipped: 0 };
    }
    const knownBaseHeaders = new Set(['配置编号', 'configNo', '配置名称', 'configName', '机器人类型', 'robotType', '分组', 'group', '适用固件版本', 'firmware', '当前版本', 'currentVersion', '编辑人', 'updatedBy', '描述', 'description']);
    let header = rows[0].map((item) => item.trim());
    let dataStartIndex = 1;
    if (!header.some((item) => item.startsWith('参数/')) && rows.length > 1) {
      const topRow = rows[0].map((item) => item.trim());
      const secondRow = rows[1].map((item) => item.trim());
      const totalCols = Math.max(topRow.length, secondRow.length);
      header = Array.from({ length: totalCols }, (_, colIdx) => {
        const top = topRow[colIdx] ?? '';
        const sub = secondRow[colIdx] ?? '';
        if (knownBaseHeaders.has(top)) {
          return top;
        }
        if (knownBaseHeaders.has(sub)) {
          return sub;
        }
        if (top.startsWith('参数/')) {
          return top;
        }
        if (sub.startsWith('参数/')) {
          return sub;
        }
        if (top && sub) {
          return `参数/${top}/${sub}`;
        }
        return top || sub;
      });
      dataStartIndex = 2;
    }

    const columnIndex = {
      configNo: header.findIndex((item) => ['配置编号', 'configNo'].includes(item)),
      configName: header.findIndex((item) => ['配置名称', 'configName'].includes(item)),
      robotType: header.findIndex((item) => ['机器人类型', 'robotType'].includes(item)),
      group: header.findIndex((item) => ['分组', 'group'].includes(item)),
      firmware: header.findIndex((item) => ['适用固件版本', 'firmware'].includes(item)),
      currentVersion: header.findIndex((item) => ['当前版本', 'currentVersion'].includes(item)),
      updatedBy: header.findIndex((item) => ['编辑人', 'updatedBy'].includes(item)),
      description: header.findIndex((item) => ['描述', 'description'].includes(item)),
    };
    const paramColumns = header
      .map((item, index) => ({ item, index }))
      .filter((entry) => entry.item.startsWith('参数/'))
      .map((entry) => {
        const fullPath = entry.item.replace(/^参数\//, '').trim();
        const lastSlash = fullPath.lastIndexOf('/');
        if (lastSlash < 0) {
          return null;
        }
        const categoryPath = fullPath.slice(0, lastSlash).trim();
        const name = fullPath.slice(lastSlash + 1).trim();
        if (!categoryPath || !name) {
          return null;
        }
        return { index: entry.index, categoryPath, name };
      })
      .filter((item): item is { index: number; categoryPath: string; name: string } => Boolean(item));

    if (columnIndex.configNo === -1 || columnIndex.configName === -1) {
      return { nextRecords: [] as RobotConfigRecord[], skipped: rows.length - 1 };
    }
    const now = new Date().toLocaleString('zh-CN', { hour12: false });
    const nextRecords = rows.slice(dataStartIndex).reduce<RobotConfigRecord[]>((acc, row, idx) => {
      const configNo = row[columnIndex.configNo]?.trim();
      const configName = row[columnIndex.configName]?.trim();
      if (!configNo || !configName) {
        return acc;
      }
      const importedParams: ConfigParam[] = paramColumns.reduce<ConfigParam[]>((params, column, colIdx) => {
        const value = row[column.index]?.trim();
        if (value === undefined || value === '') {
          return params;
        }
        params.push({
          id: `imp-param-${idx}-${colIdx}`,
          name: column.name,
          value,
          defaultValue: value,
          unit: '-',
          range: '-',
          remoteEditable: true,
          categoryPath: column.categoryPath,
        });
        return params;
      }, []);

      acc.push({
        id: `cfg-import-${Date.now()}-${idx}`,
        configNo,
        configName,
        robotType: row[columnIndex.robotType]?.trim() || robotTypes[0],
        group: row[columnIndex.group]?.trim() || groups[0],
        firmware: row[columnIndex.firmware]?.trim() || 'v2.3.1',
        currentVersion: row[columnIndex.currentVersion]?.trim() || '-',
        status: '草稿',
        createdAt: now,
        updatedAt: now,
        updatedBy: row[columnIndex.updatedBy]?.trim() || 'admin',
        description: row[columnIndex.description]?.trim(),
        isDefault: false,
        params: buildDetailedParams(importedParams),
        versions: [],
        dispatches: [],
      });
      return acc;
    }, []);
    return { nextRecords, skipped: rows.length - 1 - nextRecords.length };
  };

  const importExcel: UploadProps['beforeUpload'] = async (file) => {
    const suffix = file.name.toLowerCase().split('.').pop();
    if (!['csv', 'xls'].includes(suffix ?? '')) {
      messageApi.error('仅支持 .csv 或 .xls 文件导入');
      return Upload.LIST_IGNORE;
    }
    const content = await file.text();
    const rows = suffix === 'csv' ? buildCsvRows(content) : buildHtmlTableRows(content);
    const { nextRecords, skipped } = importRowsToRecords(rows);
    if (!nextRecords.length) {
      messageApi.warning('未识别到可导入数据，请检查表头和内容');
      return Upload.LIST_IGNORE;
    }
    setList((prev) => [...nextRecords, ...prev]);
    messageApi.success(`导入成功 ${nextRecords.length} 条${skipped ? `，跳过 ${skipped} 条` : ''}`);
    return Upload.LIST_IGNORE;
  };

  const exportExcel = () => {
    const paramKeySet = new Set(defaultParamTemplate.map((param) => `${param.categoryPath}|${param.name}`));
    filteredList.forEach((item) => {
      item.params.forEach((param) => {
        paramKeySet.add(`${param.categoryPath}|${param.name}`);
      });
    });
    const paramKeys = Array.from(paramKeySet).sort((a, b) => a.localeCompare(b, 'zh-CN'));
    const moduleGroups = paramKeys.reduce<Record<string, string[]>>((acc, key) => {
      const [categoryPath] = key.split('|');
      const moduleName = categoryPath.split('/')[0] || '未分类';
      if (!acc[moduleName]) {
        acc[moduleName] = [];
      }
      acc[moduleName].push(key);
      return acc;
    }, {});
    const orderedModuleNames = ['算法', '运动控制', '底盘驱动', '关节执行器', '视觉相机', '传感器', '电源管理', '通讯与网络', '安全策略'];
    const moduleNames = [
      ...orderedModuleNames.filter((name) => moduleGroups[name]?.length),
      ...Object.keys(moduleGroups).filter((name) => !orderedModuleNames.includes(name)),
    ];
    const headers = [
      '配置编号',
      '配置名称',
      '机器人类型',
      '分组',
      '适用固件版本',
      '当前版本',
      '创建时间',
      '更新时间',
      '编辑人',
      '描述',
      ...paramKeys.map((key) => {
        const [categoryPath, name] = key.split('|');
        return `参数/${categoryPath}/${name}`;
      }),
    ];
    const escapeHtml = (value: string) =>
      value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const baseHeaderCount = 10;
    const firstHeaderRow = [
      ...headers.slice(0, baseHeaderCount).map((header) => `<th rowspan="2">${header}</th>`),
      ...moduleNames.map((moduleName) => `<th colspan="${moduleGroups[moduleName].length}">${escapeHtml(moduleName)}</th>`),
    ].join('');
    const secondHeaderRow = moduleNames
      .flatMap((moduleName) =>
        moduleGroups[moduleName].map((key) => {
          const [categoryPath, name] = key.split('|');
          const modulePrefix = `${moduleName}/`;
          const subPath = categoryPath.startsWith(modulePrefix) ? categoryPath.slice(modulePrefix.length) : categoryPath;
          const label = subPath ? `${subPath}/${name}` : name;
          return `<th>${escapeHtml(label)}</th>`;
        }),
      )
      .join('');
    const rows = filteredList
      .map(
        (item) => {
          const paramMap = new Map(item.params.map((param) => [`${param.categoryPath}|${param.name}`, param.value]));
          const paramCells = paramKeys.map((key) => `<td>${escapeHtml(paramMap.get(key) ?? '')}</td>`).join('');
          return `
      <tr>
        <td>${escapeHtml(item.configNo)}</td>
        <td>${escapeHtml(item.configName)}</td>
        <td>${escapeHtml(item.robotType)}</td>
        <td>${escapeHtml(item.group)}</td>
        <td>${escapeHtml(item.firmware)}</td>
        <td>${escapeHtml(item.currentVersion)}</td>
        <td>${escapeHtml(item.createdAt)}</td>
        <td>${escapeHtml(item.updatedAt)}</td>
        <td>${escapeHtml(item.updatedBy)}</td>
        <td>${escapeHtml(item.description ?? '')}</td>
        ${paramCells}
      </tr>`;
        },
      )
      .join('');
    const html = `
      <html>
      <head><meta charset="UTF-8"></head>
      <body>
        <table border="1">
          <tr>${firstHeaderRow}</tr>
          <tr>${secondHeaderRow}</tr>
          ${rows}
        </table>
      </body>
      </html>`;
    const blob = new Blob([`\uFEFF${html}`], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `template-config-${Date.now()}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    messageApi.success('导出成功');
  };

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
            <Col xs={24} md={10}>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button
                  onClick={() => {
                    setKeyword('');
                    setRobotTypeFilter(undefined);
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
            <Upload accept=".csv,.xls" showUploadList={false} beforeUpload={importExcel}>
              <Button icon={<UploadOutlined />}>导入Excel</Button>
            </Upload>
            <Button icon={<DownloadOutlined />} onClick={exportExcel}>
              导出Excel
            </Button>
          </Space>
        </Space>
      </Card>

      <Card>
        <Table rowKey="id" columns={configColumns} dataSource={filteredList} pagination={{ pageSize: 8, showSizeChanger: false }} scroll={{ x: 'max-content' }} />
      </Card>

      <Modal
        title={editing ? '编辑机器人配置' : '新增机器人配置'}
        open={modalOpen}
        onCancel={closeModal}
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
          <Button key="cancel" onClick={closeModal}>
            取消
          </Button>,
          <Button key="save" type="primary" onClick={() => saveRecord()}>
            保存
          </Button>,
        ]}
        destroyOnClose
      >
        <Tabs
          size="large"
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
                  <Col xs={24} md={isLaptop ? 7 : 5}>
                    <Card size="small" title="参数分类" styles={{ body: { maxHeight: 620, overflowY: 'auto' } }}>
                      <Tree treeData={categoryTree} defaultExpandAll selectedKeys={[selectedCategory]} onSelect={handleCategorySelect} />
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
        title="配置对比"
        open={compareModalOpen}
        onCancel={closeCompareModal}
        width={isLaptop ? 960 : 1080}
        footer={[
          <Button key="close" onClick={closeCompareModal}>
            关闭
          </Button>,
        ]}
        destroyOnClose
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Row gutter={12}>
            <Col span={12}>
              <Typography.Text type="secondary">当前配置</Typography.Text>
              <Input value={baseCompareRecord ? `${baseCompareRecord.configNo} - ${baseCompareRecord.configName}` : ''} disabled />
            </Col>
            <Col span={12}>
              <Typography.Text type="secondary">对比配置</Typography.Text>
              <Select
                style={{ width: '100%' }}
                placeholder="选择其他配置"
                value={targetCompareId}
                options={list
                  .filter((item) => item.id !== baseCompareId)
                  .map((item) => ({ label: `${item.configNo} - ${item.configName}`, value: item.id }))}
                onChange={setTargetCompareId}
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
                      title: baseCompareRecord?.configNo ?? '当前配置',
                      dataIndex: 'currentValue',
                      key: 'currentValue',
                      render: (value: string, record: ConfigCompareRow) => <Typography.Text type={record.different ? 'danger' : undefined}>{value}</Typography.Text>,
                    },
                    {
                      title: targetCompareRecord?.configNo ?? '对比配置',
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
