import { DeleteOutlined, EditOutlined, ExclamationCircleFilled, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Col, Form, Input, Modal, Row, Select, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { useI18n } from '../../../i18n/I18nProvider';
import { useTerminalConfig } from '../../../logic/qcConfig/useTerminalConfig';
import type { TerminalConfig } from '../../../shared/types/qcConfig';

type FormValues = TerminalConfig;

export function TerminalConfigPage() {
  const [form] = Form.useForm<FormValues>();
  const { t } = useI18n();
  const { filteredList, keyword, setKeyword, createRecord, updateRecord, removeRecord, toggleOnline, workstationOptions, stationOptions } =
    useTerminalConfig();
  const [editingRecord, setEditingRecord] = useState<TerminalConfig | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const offlineCount = useMemo(() => filteredList.filter((item) => !item.online).length, [filteredList]);

  const openCreate = () => {
    form.resetFields();
    form.setFieldsValue({ online: true, currentUser: '-', boundStationIds: [] });
    setCreateOpen(true);
  };

  const openEdit = (record: TerminalConfig) => {
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

  const columns: ColumnsType<TerminalConfig> = [
    { title: t('qcConfig.terminal.table.terminalId'), dataIndex: 'terminalId', key: 'terminalId', width: 170 },
    { title: t('qcConfig.terminal.table.workstationId'), dataIndex: 'workstationId', key: 'workstationId', width: 180 },
    {
      title: t('qcConfig.terminal.table.boundStationIds'),
      dataIndex: 'boundStationIds',
      key: 'boundStationIds',
      width: 240,
      render: (stationIds: string[]) => stationIds.join(', ') || '-',
    },
    {
      title: t('qcConfig.terminal.table.online'),
      dataIndex: 'online',
      key: 'online',
      width: 120,
      render: (online: boolean) => <Tag color={online ? 'success' : 'error'}>{online ? t('qcConfig.common.online') : t('qcConfig.common.offline')}</Tag>,
    },
    { title: t('qcConfig.terminal.table.currentUser'), dataIndex: 'currentUser', key: 'currentUser', width: 150 },
    {
      title: t('qcConfig.terminal.table.action'),
      key: 'actions',
      width: 280,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => toggleOnline(record.terminalId)}>
            {record.online ? t('qcConfig.common.offline') : t('qcConfig.common.online')}
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
                content: record.terminalId,
                okText: t('qcConfig.common.delete'),
                okButtonProps: { danger: true },
                cancelText: t('qcConfig.common.cancel'),
                onOk: () => removeRecord(record.terminalId),
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
      {offlineCount > 0 ? <Alert type="warning" showIcon message={t('qcConfig.terminal.offlineAlert', { count: offlineCount })} /> : null}
      <Card>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {t('qcConfig.terminal.pageTitle')}
          </Typography.Title>
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} lg={10}>
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder={t('qcConfig.terminal.searchPlaceholder')}
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
        <Table rowKey="terminalId" columns={columns} dataSource={filteredList} pagination={{ pageSize: 8, showSizeChanger: false }} scroll={{ x: 1300 }} />
      </Card>

      <Modal
        title={createOpen ? t('qcConfig.terminal.createTitle') : t('qcConfig.terminal.editTitle')}
        open={createOpen || Boolean(editingRecord)}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText={t('qcConfig.common.save')}
        cancelText={t('qcConfig.common.cancel')}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={submit}>
          <Form.Item
            label={t('qcConfig.terminal.form.terminalId')}
            name="terminalId"
            rules={[{ required: true, message: t('qcConfig.terminal.form.terminalIdRequired') }]}
          >
            <Input disabled={Boolean(editingRecord)} />
          </Form.Item>
          <Form.Item
            label={t('qcConfig.terminal.form.workstationId')}
            name="workstationId"
            rules={[{ required: true, message: t('qcConfig.terminal.form.workstationIdRequired') }]}
          >
            <Select options={workstationOptions} />
          </Form.Item>
          <Form.Item
            label={t('qcConfig.terminal.form.boundStationIds')}
            name="boundStationIds"
            rules={[{ required: true, message: t('qcConfig.terminal.form.boundStationIdsRequired') }]}
          >
            <Select mode="multiple" options={stationOptions} />
          </Form.Item>
          <Form.Item
            label={t('qcConfig.terminal.form.online')}
            name="online"
            rules={[{ required: true, message: t('qcConfig.terminal.form.onlineRequired') }]}
          >
            <Select
              options={[
                { label: t('qcConfig.common.online'), value: true },
                { label: t('qcConfig.common.offline'), value: false },
              ]}
            />
          </Form.Item>
          <Form.Item
            label={t('qcConfig.terminal.form.currentUser')}
            name="currentUser"
            rules={[{ required: true, message: t('qcConfig.terminal.form.currentUserRequired') }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
