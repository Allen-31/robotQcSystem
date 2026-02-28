import {
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleFilled,
  PlusOutlined,
  SearchOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { Button, Card, Form, Input, Modal, Space, Table, Tag, Typography, Upload, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import { useI18n } from '../../../i18n/I18nProvider';
import { useWireHarnessType } from '../../../logic/qcConfig/useWireHarnessType';
import type { WireHarnessTypeConfig } from '../../../shared/types/qcConfig';

type FormValues = WireHarnessTypeConfig;

export function WireHarnessTypePage() {
  const [form] = Form.useForm<FormValues>();
  const { t } = useI18n();
  const { filteredList, keyword, setKeyword, createRecord, updateRecord, removeRecord } = useWireHarnessType();
  const [editingRecord, setEditingRecord] = useState<WireHarnessTypeConfig | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const openCreate = () => {
    form.resetFields();
    setCreateOpen(true);
  };

  const openEdit = (record: WireHarnessTypeConfig) => {
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

  const columns: ColumnsType<WireHarnessTypeConfig> = [
    { title: t('qcConfig.wireHarness.table.id'), dataIndex: 'id', key: 'id', width: 140 },
    { title: t('qcConfig.wireHarness.table.name'), dataIndex: 'name', key: 'name', width: 180 },
    { title: t('qcConfig.wireHarness.table.taskType'), dataIndex: 'taskType', key: 'taskType', width: 180 },
    { title: t('qcConfig.wireHarness.table.planarFile'), dataIndex: 'planarStructureFile', key: 'planarStructureFile', width: 220 },
    { title: t('qcConfig.wireHarness.table.threeDFile'), dataIndex: 'threeDStructureFile', key: 'threeDStructureFile', width: 220 },
    {
      title: t('qcConfig.wireHarness.table.logic'),
      key: 'logic',
      width: 280,
      render: () => (
        <Space size={[4, 4]} wrap>
          <Tag color="processing">{t('qcConfig.wireHarness.logic.order')}</Tag>
          <Tag color="processing">{t('qcConfig.wireHarness.logic.node')}</Tag>
          <Tag color="success">{t('qcConfig.wireHarness.logic.db')}</Tag>
          <Tag color="purple">{t('qcConfig.wireHarness.logic.robot')}</Tag>
        </Space>
      ),
    },
    {
      title: t('qcConfig.wireHarness.table.action'),
      key: 'actions',
      width: 170,
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
                title: t('qcConfig.common.deleteConfirmTitle'),
                icon: <ExclamationCircleFilled />,
                content: record.id,
                okText: t('qcConfig.common.delete'),
                okButtonProps: { danger: true },
                cancelText: t('qcConfig.common.cancel'),
                onOk: () => removeRecord(record.id),
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
            {t('qcConfig.wireHarness.pageTitle')}
          </Typography.Title>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder={t('qcConfig.wireHarness.searchPlaceholder')}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </Space>
      </Card>

      <Card>
        <Table rowKey="id" columns={columns} dataSource={filteredList} pagination={{ pageSize: 8, showSizeChanger: false }} scroll={{ x: 1400 }} />
        <Space style={{ marginTop: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            {t('qcConfig.wireHarness.createButton')}
          </Button>
          <Button onClick={() => messageApi.success(t('qcConfig.common.imported'))}>{t('qcConfig.common.import')}</Button>
          <Button onClick={() => messageApi.success(t('qcConfig.common.exported'))}>{t('qcConfig.common.export')}</Button>
        </Space>
      </Card>

      <Modal
        title={createOpen ? t('qcConfig.wireHarness.createTitle') : t('qcConfig.wireHarness.editTitle')}
        open={createOpen || Boolean(editingRecord)}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText={t('qcConfig.common.save')}
        cancelText={t('qcConfig.common.cancel')}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={submit}>
          <Form.Item label={t('qcConfig.wireHarness.form.id')} name="id" rules={[{ required: true, message: t('qcConfig.wireHarness.form.idRequired') }]}>
            <Input disabled={Boolean(editingRecord)} />
          </Form.Item>
          <Form.Item label={t('qcConfig.wireHarness.form.name')} name="name" rules={[{ required: true, message: t('qcConfig.wireHarness.form.nameRequired') }]}>
            <Input />
          </Form.Item>
          <Form.Item
            label={t('qcConfig.wireHarness.form.taskType')}
            name="taskType"
            rules={[{ required: true, message: t('qcConfig.wireHarness.form.taskTypeRequired') }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={t('qcConfig.wireHarness.form.planarFile')}
            name="planarStructureFile"
            rules={[{ required: true, message: t('qcConfig.wireHarness.form.planarFileRequired') }]}
          >
            <Input />
          </Form.Item>
          <Upload
            maxCount={1}
            showUploadList={false}
            beforeUpload={(file) => {
              form.setFieldValue('planarStructureFile', file.name);
              return false;
            }}
          >
            <Button icon={<UploadOutlined />}>{t('qcConfig.wireHarness.form.importPlanar')}</Button>
          </Upload>
          <Form.Item
            label={t('qcConfig.wireHarness.form.threeDFile')}
            name="threeDStructureFile"
            rules={[{ required: true, message: t('qcConfig.wireHarness.form.threeDFileRequired') }]}
            style={{ marginTop: 12 }}
          >
            <Input />
          </Form.Item>
          <Upload
            maxCount={1}
            showUploadList={false}
            beforeUpload={(file) => {
              form.setFieldValue('threeDStructureFile', file.name);
              return false;
            }}
          >
            <Button icon={<UploadOutlined />}>{t('qcConfig.wireHarness.form.importThreeD')}</Button>
          </Upload>
        </Form>
      </Modal>
    </Space>
  );
}
