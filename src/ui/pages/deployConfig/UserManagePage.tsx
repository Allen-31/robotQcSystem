import {
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleFilled,
  LockOutlined,
  PlusOutlined,
  SearchOutlined,
  TeamOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Form, Input, Modal, Row, Select, Space, Table, Tag, Typography, Upload, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { UploadProps } from 'antd/es/upload';
import { useState } from 'react';
import { useI18n } from '../../../i18n/I18nProvider';
import { useUserManage, type UserManageFormValues } from '../../../logic/deployConfig/useUserManage';
import type { UserManageRecord } from '../../../shared/types/deployConfig';

interface PasswordFormValues {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function UserManagePage() {
  const { locale, t } = useI18n();
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm<UserManageFormValues>();
  const [roleForm] = Form.useForm<{ roles: string[] }>();
  const [passwordForm] = Form.useForm<PasswordFormValues>();
  const {
    filteredList,
    records,
    keyword,
    setKeyword,
    roleOptions,
    createRecord,
    updateRecord,
    removeRecord,
    updateRoles,
    changePassword,
  } = useUserManage(locale);

  const [createOpen, setCreateOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<UserManageRecord | null>(null);
  const [roleRecord, setRoleRecord] = useState<UserManageRecord | null>(null);
  const [passwordRecord, setPasswordRecord] = useState<UserManageRecord | null>(null);

  const openCreate = () => {
    form.resetFields();
    form.setFieldsValue({ status: 'enabled', roles: [] });
    setCreateOpen(true);
  };

  const openEdit = (record: UserManageRecord) => {
    form.setFieldsValue({
      code: record.code,
      name: record.name,
      phone: record.phone,
      email: record.email,
      status: record.status,
      roles: record.roles,
    });
    setEditingRecord(record);
  };

  const closeEditModal = () => {
    setCreateOpen(false);
    setEditingRecord(null);
    form.resetFields();
  };

  const submitUser = (values: UserManageFormValues) => {
    if (createOpen) {
      createRecord(values);
      messageApi.success(t('userManage.message.created'));
    } else if (editingRecord) {
      updateRecord(values);
      messageApi.success(t('userManage.message.updated'));
    }
    closeEditModal();
  };

  const openRoleModal = (record: UserManageRecord) => {
    roleForm.setFieldsValue({ roles: record.roles });
    setRoleRecord(record);
  };

  const submitRole = ({ roles }: { roles: string[] }) => {
    if (!roleRecord) {
      return;
    }
    updateRoles(roleRecord.code, roles);
    messageApi.success(t('userManage.message.roleUpdated'));
    setRoleRecord(null);
    roleForm.resetFields();
  };

  const openPasswordModal = (record: UserManageRecord) => {
    passwordForm.resetFields();
    setPasswordRecord(record);
  };

  const submitPassword = (values: PasswordFormValues) => {
    if (!passwordRecord) {
      return;
    }
    const result = changePassword(passwordRecord.code, values.oldPassword, values.newPassword);
    if (!result.success) {
      messageApi.error(t('userManage.message.oldPasswordInvalid'));
      return;
    }
    messageApi.success(t('userManage.message.passwordUpdated'));
    setPasswordRecord(null);
    passwordForm.resetFields();
  };

  const exportCsv = () => {
    if (!records.length) {
      messageApi.warning(t('userManage.message.exportEmpty'));
      return;
    }
    const header = ['code', 'name', 'phone', 'email', 'status', 'lastLoginAt', 'roles'];
    const rows = filteredList.map((item) => [
      item.code,
      item.name,
      item.phone,
      item.email,
      item.status,
      item.lastLoginAt,
      item.roles.join('/'),
    ]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `user-manage-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    messageApi.success(t('userManage.message.exported', { count: filteredList.length }));
  };

  const importProps: UploadProps = {
    showUploadList: false,
    accept: '.csv',
    beforeUpload: () => {
      messageApi.success(t('userManage.message.imported'));
      return false;
    },
  };

  const columns: ColumnsType<UserManageRecord> = [
    { title: t('userManage.table.code'), dataIndex: 'code', key: 'code', width: 160 },
    { title: t('userManage.table.name'), dataIndex: 'name', key: 'name', width: 120 },
    { title: t('userManage.table.phone'), dataIndex: 'phone', key: 'phone', width: 150 },
    { title: t('userManage.table.email'), dataIndex: 'email', key: 'email', width: 220 },
    {
      title: t('userManage.table.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: UserManageRecord['status']) => (
        <Tag color={status === 'enabled' ? 'success' : 'default'}>
          {status === 'enabled' ? t('userManage.status.enabled') : t('userManage.status.disabled')}
        </Tag>
      ),
    },
    { title: t('userManage.table.lastLoginAt'), dataIndex: 'lastLoginAt', key: 'lastLoginAt', width: 190 },
    {
      title: t('userManage.table.roles'),
      dataIndex: 'roles',
      key: 'roles',
      width: 240,
      render: (roles: string[]) => roles.join(' / ') || '-',
    },
    {
      title: t('userManage.table.action'),
      key: 'action',
      width: 340,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<TeamOutlined />} onClick={() => openRoleModal(record)}>
            {t('userManage.action.role')}
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            {t('userManage.action.edit')}
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() =>
              Modal.confirm({
                title: t('userManage.deleteConfirmTitle'),
                icon: <ExclamationCircleFilled />,
                content: `${record.name} (${record.code})`,
                okText: t('userManage.action.delete'),
                okButtonProps: { danger: true },
                cancelText: t('qcConfig.common.cancel'),
                onOk: () => {
                  removeRecord(record.code);
                  messageApi.success(t('userManage.message.deleted'));
                },
              })
            }
          >
            {t('userManage.action.delete')}
          </Button>
          <Button type="link" icon={<LockOutlined />} onClick={() => openPasswordModal(record)}>
            {t('userManage.action.changePassword')}
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
            {t('userManage.pageTitle')}
          </Typography.Title>
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} lg={10}>
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder={t('userManage.searchPlaceholder')}
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </Col>
            <Col xs={24} lg={14}>
              <Space wrap style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                  {t('userManage.toolbar.create')}
                </Button>
                <Upload {...importProps}>
                  <Button icon={<UploadOutlined />}>{t('userManage.toolbar.import')}</Button>
                </Upload>
                <Button onClick={exportCsv}>{t('userManage.toolbar.export')}</Button>
              </Space>
            </Col>
          </Row>
        </Space>
      </Card>

      <Card>
        <Table rowKey="code" columns={columns} dataSource={filteredList} pagination={{ pageSize: 8, showSizeChanger: false }} scroll={{ x: 1600 }} />
      </Card>

      <Modal
        title={createOpen ? t('userManage.createTitle') : t('userManage.editTitle')}
        open={createOpen || Boolean(editingRecord)}
        onCancel={closeEditModal}
        onOk={() => form.submit()}
        okText={t('qcConfig.common.save')}
        cancelText={t('qcConfig.common.cancel')}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={submitUser}>
          <Form.Item label={t('userManage.form.code')} name="code" rules={[{ required: true, message: t('userManage.form.codeRequired') }]}>
            <Input disabled={Boolean(editingRecord)} />
          </Form.Item>
          <Form.Item label={t('userManage.form.name')} name="name" rules={[{ required: true, message: t('userManage.form.nameRequired') }]}>
            <Input />
          </Form.Item>
          <Form.Item label={t('userManage.form.phone')} name="phone" rules={[{ required: true, message: t('userManage.form.phoneRequired') }]}>
            <Input />
          </Form.Item>
          <Form.Item
            label={t('userManage.form.email')}
            name="email"
            rules={[
              { required: true, message: t('userManage.form.emailRequired') },
              { type: 'email', message: t('userManage.form.emailInvalid') },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item label={t('userManage.form.status')} name="status" rules={[{ required: true, message: t('userManage.form.statusRequired') }]}>
            <Select
              options={[
                { label: t('userManage.status.enabled'), value: 'enabled' },
                { label: t('userManage.status.disabled'), value: 'disabled' },
              ]}
            />
          </Form.Item>
          <Form.Item label={t('userManage.form.roles')} name="roles" rules={[{ required: true, message: t('userManage.form.rolesRequired') }]}>
            <Select mode="multiple" options={roleOptions} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('userManage.roleTitle')}
        open={Boolean(roleRecord)}
        onCancel={() => {
          setRoleRecord(null);
          roleForm.resetFields();
        }}
        onOk={() => roleForm.submit()}
        okText={t('qcConfig.common.save')}
        cancelText={t('qcConfig.common.cancel')}
        destroyOnClose
      >
        <Form form={roleForm} layout="vertical" onFinish={submitRole}>
          <Form.Item label={t('userManage.form.roles')} name="roles" rules={[{ required: true, message: t('userManage.form.rolesRequired') }]}>
            <Select mode="multiple" options={roleOptions} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('userManage.passwordTitle')}
        open={Boolean(passwordRecord)}
        onCancel={() => {
          setPasswordRecord(null);
          passwordForm.resetFields();
        }}
        onOk={() => passwordForm.submit()}
        okText={t('qcConfig.common.save')}
        cancelText={t('qcConfig.common.cancel')}
        destroyOnClose
      >
        <Form form={passwordForm} layout="vertical" onFinish={submitPassword}>
          <Form.Item
            label={t('userManage.form.oldPassword')}
            name="oldPassword"
            rules={[{ required: true, message: t('userManage.form.oldPasswordRequired') }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            label={t('userManage.form.newPassword')}
            name="newPassword"
            rules={[{ required: true, message: t('userManage.form.newPasswordRequired') }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            label={t('userManage.form.confirmPassword')}
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: t('userManage.form.confirmPasswordRequired') },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(t('userManage.form.confirmPasswordNotMatch')));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

