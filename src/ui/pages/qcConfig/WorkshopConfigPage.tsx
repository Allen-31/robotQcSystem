import { DeleteOutlined, EditOutlined, ExclamationCircleFilled, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Col, Form, Input, Modal, Row, Space, Table, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { workshopConfigList, type WorkshopConfigItem } from '../../../data/qcConfig/workshopConfigList';
import { useI18n } from '../../../i18n/I18nProvider';

export function WorkshopConfigPage() {
  const [form] = Form.useForm<WorkshopConfigItem>();
  const { t } = useI18n();
  const [messageApi, contextHolder] = message.useMessage();
  const [keyword, setKeyword] = useState('');
  const [records, setRecords] = useState<WorkshopConfigItem[]>(workshopConfigList);
  const [editingRecord, setEditingRecord] = useState<WorkshopConfigItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const dataSource = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) {
      return records;
    }
    return records.filter((item) => `${item.code} ${item.name} ${item.location}`.toLowerCase().includes(normalized));
  }, [keyword, records]);

  const openCreate = () => {
    form.resetFields();
    setCreateOpen(true);
  };

  const openEdit = (record: WorkshopConfigItem) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
  };

  const closeModal = () => {
    setCreateOpen(false);
    setEditingRecord(null);
    form.resetFields();
  };

  const submit = (values: WorkshopConfigItem) => {
    if (createOpen) {
      setRecords((prev) => [values, ...prev]);
      messageApi.success(t('qcConfig.common.created'));
      closeModal();
      return;
    }
    if (!editingRecord) {
      return;
    }
    setRecords((prev) => prev.map((item) => (item.code === editingRecord.code ? { ...item, ...values, code: editingRecord.code } : item)));
    messageApi.success(t('qcConfig.common.updated'));
    closeModal();
  };

  const removeRecord = (code: string) => {
    setRecords((prev) => prev.filter((item) => item.code !== code));
    messageApi.success(t('qcConfig.common.deleted'));
  };

  const columns: ColumnsType<WorkshopConfigItem> = [
    { title: t('qcConfig.workshop.table.code'), dataIndex: 'code', key: 'code', width: 220 },
    { title: t('qcConfig.workshop.table.name'), dataIndex: 'name', key: 'name', width: 320 },
    { title: t('qcConfig.workshop.table.location'), dataIndex: 'location', key: 'location', width: 260 },
    {
      title: t('qcConfig.workshop.table.action'),
      key: 'actions',
      width: 220,
      render: (_, record) => (
        <Space>
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
                content: record.code,
                okText: t('qcConfig.common.delete'),
                cancelText: t('qcConfig.common.cancel'),
                okButtonProps: { danger: true },
                onOk: () => removeRecord(record.code),
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
            {t('qcConfig.workshop.pageTitle')}
          </Typography.Title>
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} lg={10}>
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder={t('qcConfig.workshop.searchPlaceholder')}
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </Col>
            <Col xs={24} lg={14}>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                  {t('qcConfig.common.create')}
                </Button>
              </Space>
            </Col>
          </Row>
        </Space>
      </Card>

      <Card>
        <Table rowKey="code" columns={columns} dataSource={dataSource} pagination={{ pageSize: 8, showSizeChanger: false }} scroll={{ x: 1100 }} />
      </Card>

      <Modal
        title={createOpen ? t('qcConfig.workshop.createTitle') : t('qcConfig.workshop.editTitle')}
        open={createOpen || Boolean(editingRecord)}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText={t('qcConfig.common.save')}
        cancelText={t('qcConfig.common.cancel')}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={submit}>
          <Form.Item label={t('qcConfig.workshop.form.code')} name="code" rules={[{ required: true, message: t('qcConfig.workshop.form.codeRequired') }]}>
            <Input disabled={Boolean(editingRecord)} />
          </Form.Item>
          <Form.Item label={t('qcConfig.workshop.form.name')} name="name" rules={[{ required: true, message: t('qcConfig.workshop.form.nameRequired') }]}>
            <Input />
          </Form.Item>
          <Form.Item
            label={t('qcConfig.workshop.form.location')}
            name="location"
            rules={[{ required: true, message: t('qcConfig.workshop.form.locationRequired') }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

