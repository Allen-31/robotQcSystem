import { DeleteOutlined, EditOutlined, ExclamationCircleFilled, PlusOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Card, Col, Form, Input, Modal, Row, Space, Table, Tag, Typography, Upload, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { UploadProps } from 'antd/es/upload';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../../i18n/I18nProvider';
import { useActionTemplateManage, type ActionTemplateFormValues, type ActionTemplateRecord } from '../../../logic/deployConfig/useActionTemplateManage';

export function ActionTemplatePage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm<ActionTemplateFormValues>();
  const { filteredList, keyword, setKeyword, createRecord, updateRecord, removeRecord, toggleEnabled } = useActionTemplateManage();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ActionTemplateRecord | null>(null);

  const openCreate = () => {
    form.resetFields();
    form.setFieldsValue({ code: '', name: '' });
    setCreateOpen(true);
  };

  const openEdit = (record: ActionTemplateRecord) => {
    form.setFieldsValue({ code: record.code, name: record.name });
    setEditingRecord(record);
  };

  const closeModal = () => {
    setCreateOpen(false);
    setEditingRecord(null);
    form.resetFields();
  };

  const submit = (values: ActionTemplateFormValues) => {
    if (createOpen) {
      createRecord(values);
      messageApi.success(t('actionTemplate.message.created'));
    } else {
      updateRecord(values);
      messageApi.success(t('actionTemplate.message.updated'));
    }
    closeModal();
  };

  const exportCsv = () => {
    if (!filteredList.length) {
      messageApi.warning(t('actionTemplate.message.exportEmpty'));
      return;
    }
    const header = ['code', 'name', 'enabled', 'createdBy', 'createdAt', 'updatedBy', 'updatedAt'];
    const rows = filteredList.map((item) => [
      item.code,
      item.name,
      item.enabled ? '1' : '0',
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
    link.setAttribute('download', `action-template-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    messageApi.success(t('actionTemplate.message.exported', { count: filteredList.length }));
  };

  const importProps: UploadProps = {
    accept: '.csv',
    showUploadList: false,
    beforeUpload: () => {
      messageApi.success(t('actionTemplate.message.imported'));
      return false;
    },
  };

  const columns: ColumnsType<ActionTemplateRecord> = [
    { title: t('actionTemplate.table.code'), dataIndex: 'code', key: 'code', width: 140 },
    { title: t('actionTemplate.table.name'), dataIndex: 'name', key: 'name', width: 160 },
    {
      title: t('actionTemplate.table.enabled'),
      dataIndex: 'enabled',
      key: 'enabled',
      width: 100,
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'success' : 'default'}>{enabled ? t('qcConfig.common.enabled') : t('qcConfig.common.disabled')}</Tag>
      ),
    },
    { title: t('actionTemplate.table.createdBy'), dataIndex: 'createdBy', key: 'createdBy', width: 110 },
    { title: t('actionTemplate.table.createdAt'), dataIndex: 'createdAt', key: 'createdAt', width: 170 },
    { title: t('actionTemplate.table.updatedBy'), dataIndex: 'updatedBy', key: 'updatedBy', width: 110 },
    { title: t('actionTemplate.table.updatedAt'), dataIndex: 'updatedAt', key: 'updatedAt', width: 170 },
    {
      title: t('actionTemplate.table.action'),
      key: 'action',
      width: 320,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            onClick={() => {
              toggleEnabled(record.code);
              messageApi.success(record.enabled ? t('actionTemplate.message.disabled') : t('actionTemplate.message.enabled'));
            }}
          >
            {record.enabled ? t('qcConfig.common.disable') : t('qcConfig.common.enable')}
          </Button>
          <Button type="link" onClick={() => navigate('/deployConfig/task/taskDesign/2', { state: { from: 'actionTemplate' } })}>
            {t('actionTemplate.action.design')}
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
                title: t('actionTemplate.deleteConfirmTitle'),
                icon: <ExclamationCircleFilled />,
                content: `${record.name} (${record.code})`,
                okText: t('qcConfig.common.delete'),
                okButtonProps: { danger: true },
                cancelText: t('qcConfig.common.cancel'),
                onOk: () => {
                  removeRecord(record.code);
                  messageApi.success(t('actionTemplate.message.deleted'));
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
            {t('actionTemplate.pageTitle')}
          </Typography.Title>
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} lg={10}>
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder={t('actionTemplate.searchPlaceholder')}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </Col>
            <Col xs={24} lg={14}>
              <Space wrap style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                  {t('actionTemplate.toolbar.create')}
                </Button>
                <Upload {...importProps}>
                  <Button icon={<UploadOutlined />}>{t('actionTemplate.toolbar.import')}</Button>
                </Upload>
                <Button onClick={exportCsv}>{t('actionTemplate.toolbar.export')}</Button>
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
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title={createOpen ? t('actionTemplate.createTitle') : t('actionTemplate.editTitle')}
        open={createOpen || Boolean(editingRecord)}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText={t('qcConfig.common.save')}
        cancelText={t('qcConfig.common.cancel')}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={submit}>
          <Form.Item name="code" label={t('actionTemplate.form.code')} rules={[{ required: true, message: t('actionTemplate.form.codeRequired') }]}>
            <Input disabled={Boolean(editingRecord)} />
          </Form.Item>
          <Form.Item name="name" label={t('actionTemplate.form.name')} rules={[{ required: true, message: t('actionTemplate.form.nameRequired') }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
