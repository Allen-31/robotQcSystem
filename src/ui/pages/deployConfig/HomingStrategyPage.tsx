import { DeleteOutlined, EditOutlined, ExclamationCircleFilled, PlusOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Card, Col, Form, Input, InputNumber, Modal, Row, Select, Space, Table, Tag, Typography, Upload, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { UploadProps } from 'antd/es/upload';
import { useMemo, useState } from 'react';
import { useI18n } from '../../../i18n/I18nProvider';
import { useHomingStrategyManage, type HomingStrategyFormValues } from '../../../logic/deployConfig/useHomingStrategyManage';
import type { HomingStrategyRecord } from '../../../shared/types/deployConfig';

const ROBOT_TYPE_OPTION_KEYS = ['amr', 'agv', 'composite'] as const;
const ROBOT_GROUP_OPTION_KEYS = ['assemblyLine1', 'qualityLine2', 'logisticsTransfer', 'electricalTestArea'] as const;
const ROBOT_OPTIONS = ['RB-A101-1', 'RB-B203-2', 'RB-C301-4', 'RB-C301-5', 'RB-D402-1'];

export function HomingStrategyPage() {
  const { locale, t } = useI18n();
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm<HomingStrategyFormValues>();
  const { filteredList, keyword, setKeyword, createRecord, updateRecord, removeRecord, toggleStatus } = useHomingStrategyManage(locale);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HomingStrategyRecord | null>(null);
  const robotTypeOptions = useMemo(
    () => ROBOT_TYPE_OPTION_KEYS.map((key) => ({ value: t(`deployConfig.option.robotType.${key}`), label: t(`deployConfig.option.robotType.${key}`) })),
    [t],
  );
  const robotGroupOptions = useMemo(
    () => ROBOT_GROUP_OPTION_KEYS.map((key) => ({ value: t(`deployConfig.option.robotGroup.${key}`), label: t(`deployConfig.option.robotGroup.${key}`) })),
    [t],
  );

  const openCreate = () => {
    form.resetFields();
    form.setFieldsValue({
      status: 'enabled',
      robotType: [],
      robotGroup: [],
      robot: [],
      triggerRule: { idleWaitSeconds: 5 },
    });
    setCreateOpen(true);
  };

  const openEdit = (record: HomingStrategyRecord) => {
    form.setFieldsValue(record);
    setEditingRecord(record);
  };

  const closeModal = () => {
    setCreateOpen(false);
    setEditingRecord(null);
    form.resetFields();
  };

  const submit = (values: HomingStrategyFormValues) => {
    if (createOpen) {
      createRecord(values);
      messageApi.success(t('homingStrategy.message.created'));
    } else {
      updateRecord(values);
      messageApi.success(t('homingStrategy.message.updated'));
    }
    closeModal();
  };

  const exportCsv = () => {
    if (!filteredList.length) {
      messageApi.warning(t('homingStrategy.message.exportEmpty'));
      return;
    }
    const header = ['code', 'name', 'status', 'robotType', 'robotGroup', 'robot', 'idleWaitSeconds'];
    const rows = filteredList.map((item) => [
      item.code,
      item.name,
      item.status,
      item.robotType.join('/'),
      item.robotGroup.join('/'),
      item.robot.join('/'),
      item.triggerRule.idleWaitSeconds,
    ]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `homing-strategy-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    messageApi.success(t('homingStrategy.message.exported', { count: filteredList.length }));
  };

  const importProps: UploadProps = {
    accept: '.csv',
    showUploadList: false,
    beforeUpload: () => {
      messageApi.success(t('homingStrategy.message.imported'));
      return false;
    },
  };

  const columns: ColumnsType<HomingStrategyRecord> = [
    { title: t('homingStrategy.table.code'), dataIndex: 'code', key: 'code', width: 140 },
    { title: t('homingStrategy.table.name'), dataIndex: 'name', key: 'name', width: 180 },
    {
      title: t('homingStrategy.table.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: HomingStrategyRecord['status']) => (
        <Tag color={status === 'enabled' ? 'success' : 'default'}>{status === 'enabled' ? t('qcConfig.common.enabled') : t('qcConfig.common.disabled')}</Tag>
      ),
    },
    { title: t('homingStrategy.table.robotType'), dataIndex: 'robotType', key: 'robotType', width: 180, render: (value: string[]) => value.join(' / ') || '-' },
    { title: t('homingStrategy.table.robotGroup'), dataIndex: 'robotGroup', key: 'robotGroup', width: 180, render: (value: string[]) => value.join(' / ') || '-' },
    { title: t('homingStrategy.table.robot'), dataIndex: 'robot', key: 'robot', width: 200, render: (value: string[]) => value.join(' / ') || '-' },
    {
      title: t('homingStrategy.table.triggerRule'),
      key: 'triggerRule',
      width: 280,
      render: (_, record) => `${t('homingStrategy.trigger.idleWaitSeconds')}: ${record.triggerRule.idleWaitSeconds}${t('homingStrategy.second')}`,
    },
    {
      title: t('homingStrategy.table.action'),
      key: 'action',
      width: 300,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            onClick={() => {
              toggleStatus(record.code);
              messageApi.success(record.status === 'enabled' ? t('homingStrategy.message.disabled') : t('homingStrategy.message.enabled'));
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
                title: t('homingStrategy.deleteConfirmTitle'),
                icon: <ExclamationCircleFilled />,
                content: `${record.name} (${record.code})`,
                okText: t('qcConfig.common.delete'),
                okButtonProps: { danger: true },
                cancelText: t('qcConfig.common.cancel'),
                onOk: () => {
                  removeRecord(record.code);
                  messageApi.success(t('homingStrategy.message.deleted'));
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
            {t('homingStrategy.pageTitle')}
          </Typography.Title>
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} lg={10}>
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder={t('homingStrategy.searchPlaceholder')}
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </Col>
            <Col xs={24} lg={14}>
              <Space wrap style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                  {t('homingStrategy.toolbar.create')}
                </Button>
                <Upload {...importProps}>
                  <Button icon={<UploadOutlined />}>{t('homingStrategy.toolbar.import')}</Button>
                </Upload>
                <Button onClick={exportCsv}>{t('homingStrategy.toolbar.export')}</Button>
              </Space>
            </Col>
          </Row>
        </Space>
      </Card>

      <Card>
        <Table rowKey="code" columns={columns} dataSource={filteredList} pagination={{ pageSize: 10, showSizeChanger: false }} scroll={{ x: 1800 }} />
      </Card>

      <Modal
        title={createOpen ? t('homingStrategy.createTitle') : t('homingStrategy.editTitle')}
        open={createOpen || Boolean(editingRecord)}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText={t('qcConfig.common.save')}
        cancelText={t('qcConfig.common.cancel')}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={submit}>
          <Form.Item label={t('homingStrategy.form.code')} name="code" rules={[{ required: true, message: t('homingStrategy.form.codeRequired') }]}>
            <Input disabled={Boolean(editingRecord)} />
          </Form.Item>
          <Form.Item label={t('homingStrategy.form.name')} name="name" rules={[{ required: true, message: t('homingStrategy.form.nameRequired') }]}>
            <Input />
          </Form.Item>
          <Form.Item label={t('homingStrategy.form.status')} name="status" rules={[{ required: true, message: t('homingStrategy.form.statusRequired') }]}>
            <Select
              options={[
                { value: 'enabled', label: t('qcConfig.common.enabled') },
                { value: 'disabled', label: t('qcConfig.common.disabled') },
              ]}
            />
          </Form.Item>
          <Form.Item label={t('homingStrategy.form.robotType')} name="robotType" rules={[{ required: true, message: t('homingStrategy.form.robotTypeRequired') }]}>
            <Select mode="multiple" options={robotTypeOptions} />
          </Form.Item>
          <Form.Item label={t('homingStrategy.form.robotGroup')} name="robotGroup" rules={[{ required: true, message: t('homingStrategy.form.robotGroupRequired') }]}>
            <Select mode="multiple" options={robotGroupOptions} />
          </Form.Item>
          <Form.Item label={t('homingStrategy.form.robot')} name="robot" rules={[{ required: true, message: t('homingStrategy.form.robotRequired') }]}>
            <Select mode="multiple" options={ROBOT_OPTIONS.map((item) => ({ value: item, label: item }))} />
          </Form.Item>
          <Typography.Text strong>{t('homingStrategy.form.triggerRuleSection')}</Typography.Text>
          <Form.Item
            label={t('homingStrategy.trigger.idleWaitSeconds')}
            name={['triggerRule', 'idleWaitSeconds']}
            rules={[{ required: true, message: t('homingStrategy.trigger.idleWaitSecondsRequired') }]}
          >
            <InputNumber min={1} precision={0} addonAfter={t('homingStrategy.second')} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
