import { DeleteOutlined, EditOutlined, ExclamationCircleFilled, PlusOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Card, Col, Form, Input, InputNumber, Modal, Row, Space, Table, Tag, Typography, Upload, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { UploadProps } from 'antd/es/upload';
import { useState } from 'react';
import { useI18n } from '../../../i18n/I18nProvider';
import { useTaskTemplateManage, type TaskTemplateFormValues, type TaskTemplateRecord } from '../../../logic/deployConfig/useTaskTemplateManage';

export function TaskTemplatePage() {
  const { t } = useI18n();
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm<TaskTemplateFormValues>();
  const { filteredList, keyword, setKeyword, createRecord, updateRecord, removeRecord, toggleEnabled } = useTaskTemplateManage();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TaskTemplateRecord | null>(null);

  const openCreate = () => {
    form.resetFields();
    form.setFieldsValue({ code: '', name: '', priority: 1 });
    setCreateOpen(true);
  };

  const openEdit = (record: TaskTemplateRecord) => {
    form.setFieldsValue({ code: record.code, name: record.name, priority: record.priority });
    setEditingRecord(record);
  };

  const closeModal = () => {
    setCreateOpen(false);
    setEditingRecord(null);
    form.resetFields();
  };

  const submit = (values: TaskTemplateFormValues) => {
    if (createOpen) {
      createRecord(values);
      messageApi.success(t('taskTemplate.message.created'));
    } else {
      updateRecord(values);
      messageApi.success(t('taskTemplate.message.updated'));
    }
    closeModal();
  };

  const exportCsv = () => {
    if (!filteredList.length) {
      messageApi.warning(t('taskTemplate.message.exportEmpty'));
      return;
    }
    const header = ['code', 'name', 'enabled', 'priority', 'createdBy', 'createdAt', 'updatedBy', 'updatedAt'];
    const rows = filteredList.map((item) => [
      item.code,
      item.name,
      item.enabled ? '1' : '0',
      item.priority,
      item.createdBy,
      item.createdAt,
      item.updatedBy,
      item.updatedAt,
    ]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `task-template-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    messageApi.success(t('taskTemplate.message.exported', { count: filteredList.length }));
  };

  const importProps: UploadProps = {
    accept: '.csv',
    showUploadList: false,
    beforeUpload: () => {
      messageApi.success(t('taskTemplate.message.imported'));
      return false;
    },
  };

  const columns: ColumnsType<TaskTemplateRecord> = [
    { title: t('taskTemplate.table.code'), dataIndex: 'code', key: 'code', width: 140 },
    { title: t('taskTemplate.table.name'), dataIndex: 'name', key: 'name', width: 160 },
    {
      title: t('taskTemplate.table.enabled'),
      dataIndex: 'enabled',
      key: 'enabled',
      width: 100,
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'success' : 'default'}>{enabled ? t('qcConfig.common.enabled') : t('qcConfig.common.disabled')}</Tag>
      ),
    },
    { title: t('taskTemplate.table.priority'), dataIndex: 'priority', key: 'priority', width: 90 },
    { title: t('taskTemplate.table.createdBy'), dataIndex: 'createdBy', key: 'createdBy', width: 110 },
    { title: t('taskTemplate.table.createdAt'), dataIndex: 'createdAt', key: 'createdAt', width: 170 },
    { title: t('taskTemplate.table.updatedBy'), dataIndex: 'updatedBy', key: 'updatedBy', width: 110 },
    { title: t('taskTemplate.table.updatedAt'), dataIndex: 'updatedAt', key: 'updatedAt', width: 170 },
    {
      title: t('taskTemplate.table.action'),
      key: 'action',
      width: 320,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            onClick={() => {
              toggleEnabled(record.code);
              messageApi.success(record.enabled ? t('taskTemplate.message.disabled') : t('taskTemplate.message.enabled'));
            }}
          >
            {record.enabled ? t('qcConfig.common.disable') : t('qcConfig.common.enable')}
          </Button>
          <Button
            type="link"
            onClick={() => window.open(`${window.location.origin}/deployConfig/task/taskDesign/1?from=taskTemplate`, '_blank')}
          >
            {t('taskTemplate.action.design')}
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
                title: t('taskTemplate.deleteConfirmTitle'),
                icon: <ExclamationCircleFilled />,
                content: `${record.name} (${record.code})`,
                okText: t('qcConfig.common.delete'),
                okButtonProps: { danger: true },
                cancelText: t('qcConfig.common.cancel'),
                onOk: () => {
                  removeRecord(record.code);
                  messageApi.success(t('taskTemplate.message.deleted'));
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
            {t('taskTemplate.pageTitle')}
          </Typography.Title>
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} lg={10}>
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder={t('taskTemplate.searchPlaceholder')}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </Col>
            <Col xs={24} lg={14}>
              <Space wrap style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                  {t('taskTemplate.toolbar.create')}
                </Button>
                <Upload {...importProps}>
                  <Button icon={<UploadOutlined />}>{t('taskTemplate.toolbar.import')}</Button>
                </Upload>
                <Button onClick={exportCsv}>{t('taskTemplate.toolbar.export')}</Button>
              </Space>
            </Col>
          </Row>
        </Space>
      </Card>

      <Card>
        <Table
          rowKey="code"
          columns={columns}
          dataSource={filteredList}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 1400 }}
        />
      </Card>

      <Modal
        title={createOpen ? t('taskTemplate.createTitle') : t('taskTemplate.editTitle')}
        open={createOpen || Boolean(editingRecord)}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText={t('qcConfig.common.save')}
        cancelText={t('qcConfig.common.cancel')}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={submit}>
          <Form.Item name="code" label={t('taskTemplate.form.code')} rules={[{ required: true, message: t('taskTemplate.form.codeRequired') }]}>
            <Input disabled={Boolean(editingRecord)} />
          </Form.Item>
          <Form.Item name="name" label={t('taskTemplate.form.name')} rules={[{ required: true, message: t('taskTemplate.form.nameRequired') }]}>
            <Input />
          </Form.Item>
          <Form.Item name="priority" label={t('taskTemplate.form.priority')} rules={[{ required: true }]} initialValue={1}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

