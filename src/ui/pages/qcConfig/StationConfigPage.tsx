import { DeleteOutlined, EditOutlined, ExclamationCircleFilled, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Col, Form, Input, Modal, Row, Select, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import { workstationConfigList } from '../../../data/qcConfig/workstationConfigList';
import { useI18n } from '../../../i18n/I18nProvider';
import { useStationConfig } from '../../../logic/qcConfig/useStationConfig';
import type { StationConfig } from '../../../shared/types/qcConfig';

type FormValues = StationConfig;

export function StationConfigPage() {
  const [form] = Form.useForm<FormValues>();
  const { t } = useI18n();
  const { filteredList, keyword, setKeyword, createRecord, updateRecord, removeRecord, toggleEnabled } = useStationConfig();
  const [editingRecord, setEditingRecord] = useState<StationConfig | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const openCreate = () => {
    form.resetFields();
    form.setFieldsValue({ detectionEnabled: true, enabled: true, callBoxCode: '', wireHarnessType: '' });
    setCreateOpen(true);
  };

  const openEdit = (record: StationConfig) => {
    form.setFieldsValue(record);
    setEditingRecord(record);
  };

  const closeModal = () => {
    setCreateOpen(false);
    setEditingRecord(null);
    form.resetFields();
  };

  const submit = (values: FormValues) => {
    if (createOpen) {
      createRecord(values);
      messageApi.success(t('qcConfig.common.created'));
    } else if (editingRecord) {
      updateRecord(values);
      messageApi.success(t('qcConfig.common.updated'));
    }
    closeModal();
  };

  const columns: ColumnsType<StationConfig> = [
    { title: t('qcConfig.station.table.workstationId'), dataIndex: 'workstationId', key: 'workstationId', width: 180 },
    { title: t('qcConfig.station.table.stationId'), dataIndex: 'stationId', key: 'stationId', width: 150 },
    { title: t('qcConfig.station.table.mapPoint'), dataIndex: 'mapPoint', key: 'mapPoint', width: 170 },
    { title: t('qcConfig.station.table.callBoxCode'), dataIndex: 'callBoxCode', key: 'callBoxCode', width: 140 },
    { title: t('qcConfig.station.table.wireHarnessType'), dataIndex: 'wireHarnessType', key: 'wireHarnessType', width: 120 },
    {
      title: t('qcConfig.station.table.detectionEnabled'),
      dataIndex: 'detectionEnabled',
      key: 'detectionEnabled',
      width: 140,
      render: (enabled: boolean) => <Tag color={enabled ? 'processing' : 'default'}>{enabled ? t('qcConfig.common.enabled') : t('qcConfig.common.disabled')}</Tag>,
    },
    {
      title: t('qcConfig.station.table.enabled'),
      dataIndex: 'enabled',
      key: 'enabled',
      width: 120,
      render: (enabled: boolean) => <Tag color={enabled ? 'success' : 'default'}>{enabled ? t('qcConfig.common.enabled') : t('qcConfig.common.disabled')}</Tag>,
    },
    {
      title: t('qcConfig.station.table.action'),
      key: 'actions',
      width: 280,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => toggleEnabled(record.stationId)}>
            {record.enabled ? t('qcConfig.common.disable') : t('qcConfig.common.enable')}
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
                title: t('qcConfig.common.deleteConfirmTitle'),
                icon: <ExclamationCircleFilled />,
                content: record.stationId,
                okText: t('qcConfig.common.delete'),
                okButtonProps: { danger: true },
                cancelText: t('qcConfig.common.cancel'),
                onOk: () => removeRecord(record.stationId),
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
            {t('qcConfig.station.pageTitle')}
          </Typography.Title>
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} lg={10}>
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder={t('qcConfig.station.searchPlaceholder')}
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </Col>
            <Col xs={24} lg={14}>
              <Space wrap style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                  {t('qcConfig.common.create')}
                </Button>
                <Button onClick={() => messageApi.success(t('qcConfig.common.imported'))}>{t('qcConfig.common.import')}</Button>
                <Button onClick={() => messageApi.success(t('qcConfig.common.exported'))}>{t('qcConfig.common.export')}</Button>
              </Space>
            </Col>
          </Row>
        </Space>
      </Card>

      <Card>
        <Table rowKey="stationId" columns={columns} dataSource={filteredList} pagination={{ pageSize: 8, showSizeChanger: false }} scroll={{ x: 1200 }} />
      </Card>

      <Modal
        title={createOpen ? t('qcConfig.station.createTitle') : t('qcConfig.station.editTitle')}
        open={createOpen || Boolean(editingRecord)}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText={t('qcConfig.common.save')}
        cancelText={t('qcConfig.common.cancel')}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={submit}>
          <Form.Item
            label={t('qcConfig.station.form.workstationId')}
            name="workstationId"
            rules={[{ required: true, message: t('qcConfig.station.form.workstationIdRequired') }]}
          >
            <Select options={workstationConfigList.map((item) => ({ label: `${item.name} (${item.id})`, value: item.id }))} />
          </Form.Item>
          <Form.Item label={t('qcConfig.station.form.stationId')} name="stationId" rules={[{ required: true, message: t('qcConfig.station.form.stationIdRequired') }]}>
            <Input disabled={Boolean(editingRecord)} />
          </Form.Item>
          <Form.Item label={t('qcConfig.station.form.mapPoint')} name="mapPoint" rules={[{ required: true, message: t('qcConfig.station.form.mapPointRequired') }]}>
            <Input />
          </Form.Item>
          <Form.Item label={t('qcConfig.station.form.callBoxCode')} name="callBoxCode" rules={[{ required: true, message: t('qcConfig.station.form.callBoxCodeRequired') }]}>
            <Input placeholder={t('qcConfig.station.form.callBoxCodePlaceholder')} />
          </Form.Item>
          <Form.Item label={t('qcConfig.station.form.wireHarnessType')} name="wireHarnessType" rules={[{ required: true, message: t('qcConfig.station.form.wireHarnessTypeRequired') }]}>
            <Input placeholder={t('qcConfig.station.form.wireHarnessTypePlaceholder')} />
          </Form.Item>
          <Form.Item
            label={t('qcConfig.station.form.detectionEnabled')}
            name="detectionEnabled"
            rules={[{ required: true, message: t('qcConfig.station.form.detectionEnabledRequired') }]}
          >
            <Select
              options={[
                { label: t('qcConfig.common.enabled'), value: true },
                { label: t('qcConfig.common.disabled'), value: false },
              ]}
            />
          </Form.Item>
          <Form.Item
            label={t('qcConfig.station.form.enabled')}
            name="enabled"
            rules={[{ required: true, message: t('qcConfig.station.form.enabledRequired') }]}
          >
            <Select
              options={[
                { label: t('qcConfig.common.enabled'), value: true },
                { label: t('qcConfig.common.disabled'), value: false },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
