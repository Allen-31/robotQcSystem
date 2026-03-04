import { DeleteOutlined, EditOutlined, ExclamationCircleFilled, PlusOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Card, Col, Form, Input, InputNumber, Modal, Row, Select, Space, Table, Tag, Typography, Upload, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { UploadProps } from 'antd/es/upload';
import { useMemo, useState } from 'react';
import { useI18n } from '../../../i18n/I18nProvider';
import { useChargeStrategyManage, type ChargeStrategyFormValues } from '../../../logic/deployConfig/useChargeStrategyManage';
import type { ChargeMethod, ChargeStrategyRecord } from '../../../shared/types/deployConfig';

const ROBOT_TYPE_OPTION_KEYS = ['amr', 'agv', 'composite'] as const;
const ROBOT_GROUP_OPTION_KEYS = ['assemblyLine1', 'qualityLine2', 'logisticsTransfer', 'electricalTestArea'] as const;
const ROBOT_OPTIONS = ['RB-A101-1', 'RB-B203-2', 'RB-C301-4', 'RB-C301-5', 'RB-D402-1'];

export function ChargeStrategyPage() {
  const { t } = useI18n();
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm<ChargeStrategyFormValues>();
  const { records, filteredList, keyword, setKeyword, createRecord, updateRecord, removeRecord, toggleStatus } = useChargeStrategyManage();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ChargeStrategyRecord | null>(null);
  const robotTypeOptions = useMemo(
    () => ROBOT_TYPE_OPTION_KEYS.map((key) => ({ value: t(`deployConfig.option.robotType.${key}`), label: t(`deployConfig.option.robotType.${key}`) })),
    [t],
  );
  const robotGroupOptions = useMemo(
    () => ROBOT_GROUP_OPTION_KEYS.map((key) => ({ value: t(`deployConfig.option.robotGroup.${key}`), label: t(`deployConfig.option.robotGroup.${key}`) })),
    [t],
  );

  const chargeMethodOptions = useMemo(
    () => [
      { value: 'auto' as ChargeMethod, label: t('chargeStrategy.chargeMethod.auto') },
      { value: 'chargingPile' as ChargeMethod, label: t('chargeStrategy.chargeMethod.chargingPile') },
      { value: 'manualBatterySwap' as ChargeMethod, label: t('chargeStrategy.chargeMethod.manualBatterySwap') },
    ],
    [t],
  );

  const formatTriggerRule = (record: ChargeStrategyRecord) =>
    `${t('chargeStrategy.trigger.lowBattery')}<=${record.triggerRule.lowBatteryThreshold}% / ${t('chargeStrategy.trigger.minChargeTime')}${record.triggerRule.minChargeMinutes}${t('chargeStrategy.minute')} / ${chargeMethodOptions.find((item) => item.value === record.triggerRule.chargeMethod)?.label ?? '-'}`;

  const openCreate = () => {
    form.resetFields();
    form.setFieldsValue({
      status: 'enabled',
      robotType: [],
      robotGroup: [],
      robot: [],
      triggerRule: {
        lowBatteryThreshold: 20,
        minChargeMinutes: 10,
        chargeMethod: 'auto',
      },
    });
    setCreateOpen(true);
  };

  const openEdit = (record: ChargeStrategyRecord) => {
    form.setFieldsValue(record);
    setEditingRecord(record);
  };

  const closeModal = () => {
    setCreateOpen(false);
    setEditingRecord(null);
    form.resetFields();
  };

  const submit = (values: ChargeStrategyFormValues) => {
    if (createOpen) {
      createRecord(values);
      messageApi.success(t('chargeStrategy.message.created'));
    } else {
      updateRecord(values);
      messageApi.success(t('chargeStrategy.message.updated'));
    }
    closeModal();
  };

  const exportCsv = () => {
    if (!filteredList.length) {
      messageApi.warning(t('chargeStrategy.message.exportEmpty'));
      return;
    }
    const header = [
      'code',
      'name',
      'status',
      'robotType',
      'robotGroup',
      'robot',
      'lowBatteryThreshold',
      'minChargeMinutes',
      'chargeMethod',
    ];
    const rows = filteredList.map((item) => [
      item.code,
      item.name,
      item.status,
      item.robotType.join('/'),
      item.robotGroup.join('/'),
      item.robot.join('/'),
      item.triggerRule.lowBatteryThreshold,
      item.triggerRule.minChargeMinutes,
      item.triggerRule.chargeMethod,
    ]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `charge-strategy-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    messageApi.success(t('chargeStrategy.message.exported', { count: filteredList.length }));
  };

  const importProps: UploadProps = {
    accept: '.csv',
    showUploadList: false,
    beforeUpload: () => {
      messageApi.success(t('chargeStrategy.message.imported'));
      return false;
    },
  };

  const columns: ColumnsType<ChargeStrategyRecord> = [
    { title: t('chargeStrategy.table.code'), dataIndex: 'code', key: 'code', width: 140 },
    { title: t('chargeStrategy.table.name'), dataIndex: 'name', key: 'name', width: 180 },
    {
      title: t('chargeStrategy.table.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: ChargeStrategyRecord['status']) => (
        <Tag color={status === 'enabled' ? 'success' : 'default'}>{status === 'enabled' ? t('qcConfig.common.enabled') : t('qcConfig.common.disabled')}</Tag>
      ),
    },
    { title: t('chargeStrategy.table.robotType'), dataIndex: 'robotType', key: 'robotType', width: 180, render: (value: string[]) => value.join(' / ') || '-' },
    { title: t('chargeStrategy.table.robotGroup'), dataIndex: 'robotGroup', key: 'robotGroup', width: 180, render: (value: string[]) => value.join(' / ') || '-' },
    { title: t('chargeStrategy.table.robot'), dataIndex: 'robot', key: 'robot', width: 200, render: (value: string[]) => value.join(' / ') || '-' },
    { title: t('chargeStrategy.table.triggerRule'), key: 'triggerRule', width: 360, render: (_, record) => formatTriggerRule(record) },
    {
      title: t('chargeStrategy.table.action'),
      key: 'action',
      width: 300,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            onClick={() => {
              toggleStatus(record.code);
              messageApi.success(record.status === 'enabled' ? t('chargeStrategy.message.disabled') : t('chargeStrategy.message.enabled'));
            }}
          >
            {record.status === 'enabled' ? t('qcConfig.common.disable') : t('qcConfig.common.enable')}
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            {t('qcConfig.common.edit')}
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() =>
              Modal.confirm({
                title: t('chargeStrategy.deleteConfirmTitle'),
                icon: <ExclamationCircleFilled />,
                content: `${record.name} (${record.code})`,
                okText: t('qcConfig.common.delete'),
                okButtonProps: { danger: true },
                cancelText: t('qcConfig.common.cancel'),
                onOk: () => {
                  removeRecord(record.code);
                  messageApi.success(t('chargeStrategy.message.deleted'));
                },
              })
            }
          >
            {t('qcConfig.common.delete')}
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
            {t('chargeStrategy.pageTitle')}
          </Typography.Title>
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} lg={10}>
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder={t('chargeStrategy.searchPlaceholder')}
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </Col>
            <Col xs={24} lg={14}>
              <Space wrap style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                  {t('chargeStrategy.toolbar.create')}
                </Button>
                <Upload {...importProps}>
                  <Button icon={<UploadOutlined />}>{t('chargeStrategy.toolbar.import')}</Button>
                </Upload>
                <Button onClick={exportCsv}>{t('chargeStrategy.toolbar.export')}</Button>
              </Space>
            </Col>
          </Row>
        </Space>
      </Card>

      <Card>
        <Table rowKey="code" columns={columns} dataSource={filteredList} pagination={{ pageSize: 10, showSizeChanger: false }} scroll={{ x: 1900 }} />
      </Card>

      <Modal
        title={createOpen ? t('chargeStrategy.createTitle') : t('chargeStrategy.editTitle')}
        open={createOpen || Boolean(editingRecord)}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText={t('qcConfig.common.save')}
        cancelText={t('qcConfig.common.cancel')}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={submit}>
          <Form.Item label={t('chargeStrategy.form.code')} name="code" rules={[{ required: true, message: t('chargeStrategy.form.codeRequired') }]}>
            <Input disabled={Boolean(editingRecord)} />
          </Form.Item>
          <Form.Item label={t('chargeStrategy.form.name')} name="name" rules={[{ required: true, message: t('chargeStrategy.form.nameRequired') }]}>
            <Input />
          </Form.Item>
          <Form.Item label={t('chargeStrategy.form.status')} name="status" rules={[{ required: true, message: t('chargeStrategy.form.statusRequired') }]}>
            <Select
              options={[
                { value: 'enabled', label: t('qcConfig.common.enabled') },
                { value: 'disabled', label: t('qcConfig.common.disabled') },
              ]}
            />
          </Form.Item>
          <Form.Item label={t('chargeStrategy.form.robotType')} name="robotType" rules={[{ required: true, message: t('chargeStrategy.form.robotTypeRequired') }]}>
            <Select mode="multiple" options={robotTypeOptions} />
          </Form.Item>
          <Form.Item label={t('chargeStrategy.form.robotGroup')} name="robotGroup" rules={[{ required: true, message: t('chargeStrategy.form.robotGroupRequired') }]}>
            <Select mode="multiple" options={robotGroupOptions} />
          </Form.Item>
          <Form.Item label={t('chargeStrategy.form.robot')} name="robot" rules={[{ required: true, message: t('chargeStrategy.form.robotRequired') }]}>
            <Select mode="multiple" options={ROBOT_OPTIONS.map((item) => ({ value: item, label: item }))} />
          </Form.Item>
          <Typography.Text strong>{t('chargeStrategy.form.triggerRuleSection')}</Typography.Text>
          <Form.Item
            label={t('chargeStrategy.trigger.lowBattery')}
            name={['triggerRule', 'lowBatteryThreshold']}
            rules={[{ required: true, message: t('chargeStrategy.trigger.lowBatteryRequired') }]}
          >
            <InputNumber min={1} max={100} precision={0} addonAfter="%" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label={t('chargeStrategy.trigger.minChargeTime')}
            name={['triggerRule', 'minChargeMinutes']}
            rules={[{ required: true, message: t('chargeStrategy.trigger.minChargeTimeRequired') }]}
          >
            <InputNumber min={1} precision={0} addonAfter={t('chargeStrategy.minute')} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label={t('chargeStrategy.trigger.chargeMethod')}
            name={['triggerRule', 'chargeMethod']}
            rules={[{ required: true, message: t('chargeStrategy.trigger.chargeMethodRequired') }]}
          >
            <Select options={chargeMethodOptions} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
