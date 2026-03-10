import { DeleteOutlined, EditOutlined, ExclamationCircleFilled, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Col, Form, Input, Modal, Row, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import { useI18n } from '../../../i18n/I18nProvider';
import { useSceneDeviceManage, type SceneDeviceItem } from '../../../logic/deployConfig/useSceneDeviceManage';

interface DeviceFormValues {
  code: string;
  name: string;
  type: string;
  ip: string;
}

export function DeviceManagePage() {
  const { t } = useI18n();
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm<DeviceFormValues>();
  const {
    list,
    total,
    pageNum,
    pageSize,
    setPageNum,
    keyword,
    setKeyword,
    loading,
    createRecord,
    updateRecord,
    removeRecord,
  } = useSceneDeviceManage();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SceneDeviceItem | null>(null);

  const openCreate = () => {
    form.resetFields();
    form.setFieldsValue({ code: '', name: '', type: '', ip: '' });
    setEditingRecord(null);
    setModalOpen(true);
  };

  const openEdit = (record: SceneDeviceItem) => {
    form.setFieldsValue({
      code: record.code,
      name: record.name,
      type: record.type,
      ip: record.ip ?? '',
    });
    setEditingRecord(record);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingRecord(null);
    form.resetFields();
  };

  const submitForm = async (values: DeviceFormValues) => {
    try {
      if (editingRecord) {
        await updateRecord(editingRecord.code, {
          name: values.name,
          type: values.type,
          ip: values.ip || undefined,
        });
        messageApi.success(t('deviceManage.message.updated'));
      } else {
        await createRecord({
          code: values.code,
          name: values.name,
          type: values.type,
          ip: values.ip || undefined,
        });
        messageApi.success(t('deviceManage.message.created'));
      }
      closeModal();
    } catch (e) {
      messageApi.error(e instanceof Error ? e.message : t('deviceManage.message.saveFailed'));
    }
  };

  const columns: ColumnsType<SceneDeviceItem> = [
    { title: t('deviceManage.table.code'), dataIndex: 'code', key: 'code', width: 140 },
    { title: t('deviceManage.table.name'), dataIndex: 'name', key: 'name', width: 140 },
    { title: t('deviceManage.table.type'), dataIndex: 'type', key: 'type', width: 120 },
    {
      title: t('deviceManage.table.onlineStatus'),
      dataIndex: 'onlineStatus',
      key: 'onlineStatus',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'online' ? 'success' : 'default'}>
          {status === 'online' ? t('deviceManage.status.online') : t('deviceManage.status.offline')}
        </Tag>
      ),
    },
    {
      title: t('deviceManage.table.isAbnormal'),
      dataIndex: 'isAbnormal',
      key: 'isAbnormal',
      width: 100,
      render: (isAbnormal: boolean) => (
        <Tag color={isAbnormal ? 'error' : 'default'}>
          {isAbnormal ? t('deviceManage.status.abnormal') : t('deviceManage.status.normal')}
        </Tag>
      ),
    },
    {
      title: t('deviceManage.table.exceptionDetail'),
      dataIndex: 'exceptionDetail',
      key: 'exceptionDetail',
      ellipsis: true,
      render: (v: string | null) => v ?? '-',
    },
    { title: t('deviceManage.table.ip'), dataIndex: 'ip', key: 'ip', width: 140, render: (v: string | null) => v ?? '-' },
    {
      title: t('deviceManage.table.action'),
      key: 'action',
      width: 200,
      fixed: 'right',
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
                title: t('deviceManage.deleteConfirmTitle'),
                icon: <ExclamationCircleFilled />,
                content: `${record.name} (${record.code})`,
                okText: t('qcConfig.common.delete'),
                okButtonProps: { danger: true },
                cancelText: t('qcConfig.common.cancel'),
                onOk: async () => {
                  await removeRecord(record.code);
                  messageApi.success(t('deviceManage.message.deleted'));
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
            {t('deviceManage.pageTitle')}
          </Typography.Title>
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} lg={10}>
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder={t('deviceManage.searchPlaceholder')}
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setPageNum(1);
                }}
              />
            </Col>
            <Col xs={24} lg={14}>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                  {t('deviceManage.toolbar.create')}
                </Button>
              </Space>
            </Col>
          </Row>
        </Space>
      </Card>

      <Card>
        <Table<SceneDeviceItem>
          rowKey="code"
          loading={loading}
          columns={columns}
          dataSource={list}
          scroll={{ x: 1000 }}
          pagination={{
            current: pageNum,
            pageSize,
            total,
            showSizeChanger: false,
            showTotal: (n) => t('deviceManage.paginationTotal', { total: n }),
            onChange: setPageNum,
          }}
        />
      </Card>

      <Modal
        title={editingRecord ? t('deviceManage.editTitle') : t('deviceManage.createTitle')}
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText={t('qcConfig.common.save')}
        cancelText={t('qcConfig.common.cancel')}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={submitForm}
          initialValues={{ code: '', name: '', type: '', ip: '' }}
        >
          <Form.Item
            name="code"
            label={t('deviceManage.form.code')}
            rules={[{ required: true, message: t('deviceManage.form.codeRequired') }]}
          >
            <Input placeholder={t('deviceManage.form.codePlaceholder')} disabled={!!editingRecord} />
          </Form.Item>
          <Form.Item
            name="name"
            label={t('deviceManage.form.name')}
            rules={[{ required: true, message: t('deviceManage.form.nameRequired') }]}
          >
            <Input placeholder={t('deviceManage.form.namePlaceholder')} />
          </Form.Item>
          <Form.Item
            name="type"
            label={t('deviceManage.form.type')}
            rules={[{ required: true, message: t('deviceManage.form.typeRequired') }]}
          >
            <Input placeholder={t('deviceManage.form.typePlaceholder')} />
          </Form.Item>
          <Form.Item name="ip" label={t('deviceManage.form.ip')}>
            <Input placeholder={t('deviceManage.form.ipPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
