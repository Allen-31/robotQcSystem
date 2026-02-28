import { DeleteOutlined, EditOutlined, ExclamationCircleFilled, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Modal, Select, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import { useI18n } from '../../../i18n/I18nProvider';
import { useWorkstationConfig } from '../../../logic/qcConfig/useWorkstationConfig';
import type { WorkstationConfig } from '../../../shared/types/qcConfig';

type FormValues = WorkstationConfig;

const wireHarnessOptions = ['主驱线束-A', '控制线束-B', '高压线束-C', '通用线束-D'];
const robotGroupOptions = ['RG-01', 'RG-02', 'RG-03', 'RG-04'];

export function WorkstationConfigPage() {
  const [form] = Form.useForm<FormValues>();
  const { t } = useI18n();
  const { filteredList, keyword, setKeyword, createRecord, updateRecord, removeRecord, toggleEnabled } = useWorkstationConfig();
  const [editingRecord, setEditingRecord] = useState<WorkstationConfig | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const openCreate = () => {
    form.resetFields();
    form.setFieldsValue({ enabled: true });
    setCreateOpen(true);
  };

  const openEdit = (record: WorkstationConfig) => {
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

  const columns: ColumnsType<WorkstationConfig> = [
    { title: t('qcConfig.workstation.table.id'), dataIndex: 'id', key: 'id', width: 140 },
    { title: t('qcConfig.workstation.table.name'), dataIndex: 'name', key: 'name', width: 220 },
    { title: t('qcConfig.workstation.table.wireHarnessType'), dataIndex: 'wireHarnessType', key: 'wireHarnessType', width: 180 },
    { title: t('qcConfig.workstation.table.robotGroup'), dataIndex: 'robotGroup', key: 'robotGroup', width: 160 },
    {
      title: t('qcConfig.workstation.table.enabled'),
      dataIndex: 'enabled',
      key: 'enabled',
      width: 120,
      render: (enabled: boolean) => <Tag color={enabled ? 'success' : 'default'}>{enabled ? t('qcConfig.common.enabled') : t('qcConfig.common.disabled')}</Tag>,
    },
    {
      title: t('qcConfig.workstation.table.action'),
      key: 'actions',
      width: 280,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => toggleEnabled(record.id)}>
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
            {t('qcConfig.workstation.pageTitle')}
          </Typography.Title>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder={t('qcConfig.workstation.searchPlaceholder')}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </Space>
      </Card>

      <Card>
        <Table rowKey="id" columns={columns} dataSource={filteredList} pagination={{ pageSize: 8, showSizeChanger: false }} scroll={{ x: 1200 }} />
        <Space style={{ marginTop: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            {t('qcConfig.common.create')}
          </Button>
          <Button onClick={() => messageApi.success(t('qcConfig.common.imported'))}>{t('qcConfig.common.import')}</Button>
          <Button onClick={() => messageApi.success(t('qcConfig.common.exported'))}>{t('qcConfig.common.export')}</Button>
        </Space>
      </Card>

      <Modal
        title={createOpen ? t('qcConfig.workstation.createTitle') : t('qcConfig.workstation.editTitle')}
        open={createOpen || Boolean(editingRecord)}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText={t('qcConfig.common.save')}
        cancelText={t('qcConfig.common.cancel')}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={submit}>
          <Form.Item label={t('qcConfig.workstation.form.id')} name="id" rules={[{ required: true, message: t('qcConfig.workstation.form.idRequired') }]}>
            <Input disabled={Boolean(editingRecord)} />
          </Form.Item>
          <Form.Item label={t('qcConfig.workstation.form.name')} name="name" rules={[{ required: true, message: t('qcConfig.workstation.form.nameRequired') }]}>
            <Input />
          </Form.Item>
          <Form.Item
            label={t('qcConfig.workstation.form.wireHarnessType')}
            name="wireHarnessType"
            rules={[{ required: true, message: t('qcConfig.workstation.form.wireHarnessTypeRequired') }]}
          >
            <Select options={wireHarnessOptions.map((item) => ({ label: item, value: item }))} />
          </Form.Item>
          <Form.Item
            label={t('qcConfig.workstation.form.robotGroup')}
            name="robotGroup"
            rules={[{ required: true, message: t('qcConfig.workstation.form.robotGroupRequired') }]}
          >
            <Select options={robotGroupOptions.map((item) => ({ label: item, value: item }))} />
          </Form.Item>
          <Form.Item
            label={t('qcConfig.workstation.form.enabled')}
            name="enabled"
            rules={[{ required: true, message: t('qcConfig.workstation.form.enabledRequired') }]}
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
