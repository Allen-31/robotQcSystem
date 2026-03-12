import { DeleteOutlined, EditOutlined, ExclamationCircleFilled, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { App, Button, Card, Col, Form, Input, Modal, Row, Space, Table, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import { useI18n } from '../../../i18n/I18nProvider';
import { useRoleManage, type RoleManageFormValues } from '../../../logic/deployConfig/useRoleManage';
import type { RoleManageRecord } from '../../../shared/types/deployConfig';
import { PermissionManagePageInner } from './PermissionManagePage';

export function RoleManagePage() {
  const { t } = useI18n();
  const { modal } = App.useApp();
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm<RoleManageFormValues>();
  const { filteredList, loading, keyword, setKeyword, createRole, updateRole, removeRole } = useRoleManage();

  const [createOpen, setCreateOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<RoleManageRecord | null>(null);
  const [permissionRoleRecord, setPermissionRoleRecord] = useState<RoleManageRecord | null>(null);

  const openCreate = () => {
    form.resetFields();
    setCreateOpen(true);
  };

  const openEdit = (record: RoleManageRecord) => {
    form.setFieldsValue({
      code: record.code,
      name: record.name,
      description: record.description,
    });
    setEditingRecord(record);
  };

  const closeModal = () => {
    setCreateOpen(false);
    setEditingRecord(null);
    form.resetFields();
  };

  const submit = async (values: RoleManageFormValues) => {
    try {
      const result = createOpen ? await createRole(values) : await updateRole(values);
      if (!result.success) {
        const errMsg = 'message' in result ? (result as { message?: string }).message : undefined;
        messageApi.error(errMsg || t('roleManage.message.duplicate'));
        return;
      }
      messageApi.success(createOpen ? t('roleManage.message.created') : t('roleManage.message.updated'));
      closeModal();
    } catch (e) {
      messageApi.error(e instanceof Error ? e.message : t('roleManage.message.updateFailed'));
    }
  };

  const columns: ColumnsType<RoleManageRecord> = [
    { title: t('roleManage.table.code'), dataIndex: 'code', key: 'code', width: 160 },
    { title: t('roleManage.table.name'), dataIndex: 'name', key: 'name', width: 180 },
    { title: t('roleManage.table.description'), dataIndex: 'description', key: 'description', width: 280 },
    { title: t('roleManage.table.updatedAt'), dataIndex: 'updatedAt', key: 'updatedAt', width: 190 },
    {
      title: t('roleManage.table.action'),
      key: 'action',
      width: 340,
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => setPermissionRoleRecord(record)}>
            {t('roleManage.action.assignPermission')}
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            {t('qcConfig.common.edit')}
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() =>
              modal.confirm({
                title: t('roleManage.deleteConfirmTitle'),
                icon: <ExclamationCircleFilled />,
                content: t('roleManage.deleteConfirmContent', { name: record.name, code: record.code }),
                okText: t('qcConfig.common.delete'),
                okButtonProps: { danger: true },
                cancelText: t('qcConfig.common.cancel'),
                onOk: async () => {
                  try {
                    const result = await removeRole(record.code);
                    if (!result.success) {
                      messageApi.warning(
                        result.error === 'last_role' ? t('roleManage.message.lastRoleForbidden') : (result as { message?: string }).message || t('roleManage.message.notFound'),
                      );
                      return Promise.reject(new Error('delete failed'));
                    }
                    messageApi.success(t('roleManage.message.deleted'));
                  } catch (e) {
                    messageApi.error(e instanceof Error ? e.message : t('roleManage.message.updateFailed'));
                    return Promise.reject(e);
                  }
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
            {t('roleManage.pageTitle')}
          </Typography.Title>
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} lg={10}>
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder={t('roleManage.searchPlaceholder')}
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
        <Table
        rowKey="code"
        columns={columns}
        dataSource={filteredList}
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: false }}
        scroll={{ x: 1200 }}
      />
      </Card>

      <Modal
        title={createOpen ? t('roleManage.createTitle') : t('roleManage.editTitle')}
        open={createOpen || Boolean(editingRecord)}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText={t('qcConfig.common.save')}
        cancelText={t('qcConfig.common.cancel')}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={submit}>
          <Form.Item label={t('roleManage.form.code')} name="code" rules={[{ required: true, message: t('roleManage.form.codeRequired') }]}>
            <Input disabled={Boolean(editingRecord)} />
          </Form.Item>
          <Form.Item label={t('roleManage.form.name')} name="name" rules={[{ required: true, message: t('roleManage.form.nameRequired') }]}>
            <Input />
          </Form.Item>
          <Form.Item label={t('roleManage.form.description')} name="description" rules={[{ required: true, message: t('roleManage.form.descriptionRequired') }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('roleManage.permissionModalTitle', { role: permissionRoleRecord?.name ?? '' })}
        open={Boolean(permissionRoleRecord)}
        onCancel={() => setPermissionRoleRecord(null)}
        width={1500}
        footer={null}
        destroyOnClose
      >
        {permissionRoleRecord ? (
          <PermissionManagePageInner
            fixedRole={permissionRoleRecord.code}
            fixedRoleName={permissionRoleRecord.name}
            hideHeaderCard={false}
          />
        ) : null}
      </Modal>
    </Space>
  );
}
