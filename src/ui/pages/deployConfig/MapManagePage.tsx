import { DeleteOutlined, EditOutlined, ExclamationCircleFilled, PlusOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Card, Col, Form, Input, Modal, Row, Select, Space, Table, Tag, Typography, Upload, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { UploadProps } from 'antd/es/upload';
import { useState } from 'react';
import { useI18n } from '../../../i18n/I18nProvider';
import { useMapManage, type MapManageFormValues } from '../../../logic/deployConfig/useMapManage';
import type { MapManageRecord } from '../../../shared/types/deployConfig';

export function MapManagePage() {
  const { locale, t } = useI18n();
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm<MapManageFormValues>();
  const { records, filteredList, keyword, setKeyword, createRecord, updateRecord, removeRecord } = useMapManage(locale);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MapManageRecord | null>(null);

  const openCreate = () => {
    form.resetFields();
    form.setFieldsValue({ type: '2D', editStatus: 'editing', publishStatus: 'unpublished' });
    setCreateOpen(true);
  };

  const openEdit = (record: MapManageRecord) => {
    form.setFieldsValue({
      code: record.code,
      name: record.name,
      type: record.type,
      editStatus: record.editStatus,
      publishStatus: record.publishStatus,
    });
    setEditingRecord(record);
  };

  const closeModal = () => {
    setCreateOpen(false);
    setEditingRecord(null);
    form.resetFields();
  };

  const submit = (values: MapManageFormValues) => {
    if (createOpen) {
      createRecord(values);
      messageApi.success(t('mapManage.message.created'));
    } else {
      updateRecord(values);
      messageApi.success(t('mapManage.message.updated'));
    }
    closeModal();
  };

  const exportCsv = () => {
    if (!filteredList.length) {
      messageApi.warning(t('mapManage.message.exportEmpty'));
      return;
    }
    const header = ['code', 'name', 'type', 'editStatus', 'publishStatus', 'editedAt', 'editedBy', 'publishedAt', 'publishedBy'];
    const rows = filteredList.map((item) => [
      item.code,
      item.name,
      item.type,
      item.editStatus,
      item.publishStatus,
      item.editedAt,
      item.editedBy,
      item.publishedAt,
      item.publishedBy,
    ]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `map-manage-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    messageApi.success(t('mapManage.message.exported', { count: filteredList.length }));
  };

  const importProps: UploadProps = {
    accept: '.csv',
    showUploadList: false,
    beforeUpload: () => {
      messageApi.success(t('mapManage.message.imported'));
      return false;
    },
  };

  const columns: ColumnsType<MapManageRecord> = [
    { title: t('mapManage.table.code'), dataIndex: 'code', key: 'code', width: 140 },
    { title: t('mapManage.table.name'), dataIndex: 'name', key: 'name', width: 180 },
    { title: t('mapManage.table.type'), dataIndex: 'type', key: 'type', width: 100 },
    {
      title: t('mapManage.table.editStatus'),
      dataIndex: 'editStatus',
      key: 'editStatus',
      width: 120,
      render: (value: MapManageRecord['editStatus']) => (
        <Tag color={value === 'editing' ? 'processing' : 'success'}>{value === 'editing' ? t('mapManage.status.editing') : t('mapManage.status.completed')}</Tag>
      ),
    },
    {
      title: t('mapManage.table.publishStatus'),
      dataIndex: 'publishStatus',
      key: 'publishStatus',
      width: 120,
      render: (value: MapManageRecord['publishStatus']) => (
        <Tag color={value === 'published' ? 'success' : 'default'}>{value === 'published' ? t('mapManage.status.published') : t('mapManage.status.unpublished')}</Tag>
      ),
    },
    { title: t('mapManage.table.editedAt'), dataIndex: 'editedAt', key: 'editedAt', width: 180 },
    { title: t('mapManage.table.editedBy'), dataIndex: 'editedBy', key: 'editedBy', width: 120 },
    { title: t('mapManage.table.publishedAt'), dataIndex: 'publishedAt', key: 'publishedAt', width: 180 },
    { title: t('mapManage.table.publishedBy'), dataIndex: 'publishedBy', key: 'publishedBy', width: 120 },
    {
      title: t('mapManage.table.action'),
      key: 'action',
      width: 240,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => messageApi.info(t('mapManage.message.designing', { name: record.name }))}>
            {t('mapManage.action.design')}
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
                title: t('mapManage.deleteConfirmTitle'),
                icon: <ExclamationCircleFilled />,
                content: `${record.name} (${record.code})`,
                okText: t('qcConfig.common.delete'),
                okButtonProps: { danger: true },
                cancelText: t('qcConfig.common.cancel'),
                onOk: () => {
                  removeRecord(record.code);
                  messageApi.success(t('mapManage.message.deleted'));
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
            {t('mapManage.pageTitle')}
          </Typography.Title>
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} lg={10}>
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder={t('mapManage.searchPlaceholder')}
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </Col>
            <Col xs={24} lg={14}>
              <Space wrap style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                  {t('mapManage.toolbar.build')}
                </Button>
                <Upload {...importProps}>
                  <Button icon={<UploadOutlined />}>{t('mapManage.toolbar.import')}</Button>
                </Upload>
                <Button onClick={exportCsv}>{t('mapManage.toolbar.export')}</Button>
              </Space>
            </Col>
          </Row>
        </Space>
      </Card>

      <Card>
        <Table rowKey="code" columns={columns} dataSource={filteredList} pagination={{ pageSize: 10, showSizeChanger: false }} scroll={{ x: 1700 }} />
      </Card>

      <Modal
        title={createOpen ? t('mapManage.createTitle') : t('mapManage.editTitle')}
        open={createOpen || Boolean(editingRecord)}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText={t('qcConfig.common.save')}
        cancelText={t('qcConfig.common.cancel')}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={submit}>
          <Form.Item label={t('mapManage.form.code')} name="code" rules={[{ required: true, message: t('mapManage.form.codeRequired') }]}>
            <Input disabled={Boolean(editingRecord)} />
          </Form.Item>
          <Form.Item label={t('mapManage.form.name')} name="name" rules={[{ required: true, message: t('mapManage.form.nameRequired') }]}>
            <Input />
          </Form.Item>
          <Form.Item label={t('mapManage.form.type')} name="type" rules={[{ required: true, message: t('mapManage.form.typeRequired') }]}>
            <Select options={[{ value: '2D', label: '2D' }, { value: '3D', label: '3D' }]} />
          </Form.Item>
          <Form.Item label={t('mapManage.form.editStatus')} name="editStatus" rules={[{ required: true, message: t('mapManage.form.editStatusRequired') }]}>
            <Select
              options={[
                { value: 'editing', label: t('mapManage.status.editing') },
                { value: 'completed', label: t('mapManage.status.completed') },
              ]}
            />
          </Form.Item>
          <Form.Item
            label={t('mapManage.form.publishStatus')}
            name="publishStatus"
            rules={[{ required: true, message: t('mapManage.form.publishStatusRequired') }]}
          >
            <Select
              options={[
                { value: 'unpublished', label: t('mapManage.status.unpublished') },
                { value: 'published', label: t('mapManage.status.published') },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

