import { CopyOutlined, DeleteOutlined, EditOutlined, ExclamationCircleFilled, PlusOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Card, Col, Form, Input, Modal, Row, Space, Table, Typography, Upload, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { UploadProps } from 'antd/es/upload';
import { useState } from 'react';
import { useI18n } from '../../../i18n/I18nProvider';
import { useConfigTemplateManage, type ConfigTemplateFormValues } from '../../../logic/deployConfig/useConfigTemplateManage';
import type { ConfigTemplateRecord } from '../../../shared/types/deployConfig';

export function ConfigTemplatePage() {
  const { t } = useI18n();
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm<ConfigTemplateFormValues>();
  const { records, filteredList, keyword, setKeyword, createRecord, updateRecord, copyRecord, removeRecord } = useConfigTemplateManage();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ConfigTemplateRecord | null>(null);

  const openCreate = () => {
    form.resetFields();
    setCreateOpen(true);
  };

  const openEdit = (record: ConfigTemplateRecord) => {
    form.setFieldsValue({ code: record.code, name: record.name });
    setEditingRecord(record);
  };

  const closeModal = () => {
    setCreateOpen(false);
    setEditingRecord(null);
    form.resetFields();
  };

  const submit = (values: ConfigTemplateFormValues) => {
    if (createOpen) {
      createRecord(values);
      messageApi.success(t('configTemplate.message.created'));
    } else {
      updateRecord(values);
      messageApi.success(t('configTemplate.message.updated'));
    }
    closeModal();
  };

  const exportCsv = () => {
    if (!filteredList.length) {
      messageApi.warning(t('configTemplate.message.exportEmpty'));
      return;
    }
    const header = ['code', 'name', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy'];
    const rows = filteredList.map((item) => [item.code, item.name, item.createdAt, item.createdBy, item.updatedAt, item.updatedBy]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `config-template-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    messageApi.success(t('configTemplate.message.exported', { count: filteredList.length }));
  };

  const importProps: UploadProps = {
    accept: '.csv',
    showUploadList: false,
    beforeUpload: () => {
      messageApi.success(t('configTemplate.message.imported'));
      return false;
    },
  };

  const columns: ColumnsType<ConfigTemplateRecord> = [
    { title: t('configTemplate.table.code'), dataIndex: 'code', key: 'code', width: 180 },
    { title: t('configTemplate.table.name'), dataIndex: 'name', key: 'name', width: 240 },
    { title: t('configTemplate.table.createdAt'), dataIndex: 'createdAt', key: 'createdAt', width: 190 },
    { title: t('configTemplate.table.createdBy'), dataIndex: 'createdBy', key: 'createdBy', width: 140 },
    { title: t('configTemplate.table.updatedAt'), dataIndex: 'updatedAt', key: 'updatedAt', width: 190 },
    { title: t('configTemplate.table.updatedBy'), dataIndex: 'updatedBy', key: 'updatedBy', width: 140 },
    {
      title: t('configTemplate.table.action'),
      key: 'action',
      width: 260,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<CopyOutlined />}
            onClick={() => {
              const result = copyRecord(record.code);
              if (result) {
                messageApi.success(t('configTemplate.message.copied'));
              }
            }}
          >
            {t('configTemplate.action.copy')}
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
                title: t('configTemplate.deleteConfirmTitle'),
                icon: <ExclamationCircleFilled />,
                content: `${record.name} (${record.code})`,
                okText: t('qcConfig.common.delete'),
                okButtonProps: { danger: true },
                cancelText: t('qcConfig.common.cancel'),
                onOk: () => {
                  removeRecord(record.code);
                  messageApi.success(t('configTemplate.message.deleted'));
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
            {t('configTemplate.pageTitle')}
          </Typography.Title>
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} lg={10}>
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder={t('configTemplate.searchPlaceholder')}
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </Col>
            <Col xs={24} lg={14}>
              <Space wrap style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                  {t('configTemplate.toolbar.create')}
                </Button>
                <Upload {...importProps}>
                  <Button icon={<UploadOutlined />}>{t('configTemplate.toolbar.import')}</Button>
                </Upload>
                <Button onClick={exportCsv}>{t('configTemplate.toolbar.export')}</Button>
              </Space>
            </Col>
          </Row>
        </Space>
      </Card>

      <Card>
        <Table rowKey="code" columns={columns} dataSource={filteredList} pagination={{ pageSize: 10, showSizeChanger: false }} scroll={{ x: 1500 }} />
      </Card>

      <Modal
        title={createOpen ? t('configTemplate.createTitle') : t('configTemplate.editTitle')}
        open={createOpen || Boolean(editingRecord)}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText={t('qcConfig.common.save')}
        cancelText={t('qcConfig.common.cancel')}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={submit}>
          <Form.Item label={t('configTemplate.form.code')} name="code" rules={[{ required: true, message: t('configTemplate.form.codeRequired') }]}>
            <Input disabled={Boolean(editingRecord)} />
          </Form.Item>
          <Form.Item label={t('configTemplate.form.name')} name="name" rules={[{ required: true, message: t('configTemplate.form.nameRequired') }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

