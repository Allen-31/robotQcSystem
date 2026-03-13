import { DeleteOutlined, EditOutlined, ExclamationCircleFilled, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { App, Button, Card, Col, Form, Input, Modal, Row, Select, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../../i18n/I18nProvider';
import { LongIdText } from '../../components/LongIdText';
import { useTerminalConfig } from '../../../logic/qcConfig/useTerminalConfig';
import { getUserListApi } from '../../../shared/api/userApi';
import type { TerminalConfig } from '../../../shared/types/qcConfig';

type FormValues = TerminalConfig;

function normalizeUserList(data: unknown): { code: string; name: string }[] {
  if (!data || typeof data !== 'object') return [];
  const list = 'list' in data ? (data as { list: unknown[] }).list : Array.isArray(data) ? data : [];
  return list.map((item: unknown) => {
    const o = item as Record<string, unknown>;
    return { code: String(o?.code ?? o?.id ?? ''), name: String(o?.name ?? '') };
  });
}

export function TerminalConfigPage() {
  const [form] = Form.useForm<FormValues>();
  const { t } = useI18n();
  const { modal: modalApi } = App.useApp();
  const { filteredList, loading, keyword, setKeyword, createRecord, updateRecord, removeRecord, workstationOptions, stationOptions } = useTerminalConfig();
  const [editingRecord, setEditingRecord] = useState<TerminalConfig | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [onlyLoggedInDevices, setOnlyLoggedInDevices] = useState(false);
  const [userOptions, setUserOptions] = useState<{ label: string; value: string }[]>([]);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    getUserListApi({ pageNum: 1, pageSize: 500 })
      .then((res) => {
        const list = normalizeUserList(res.data);
        setUserOptions(list.map((u) => ({ label: `${u.name} (${u.code})`, value: u.code })));
      })
      .catch(() => setUserOptions([]));
  }, []);

  const terminalTypeOptions = useMemo(
    () => ['工控终端', '平板终端', '手持终端'].map((item) => ({ label: item, value: item })),
    [],
  );

  const openCreate = () => {
    form.resetFields();
    form.setFieldsValue({ online: true, currentUser: '', boundStationIds: [], terminalType: '工控终端', code: '', sn: '' });
    setCreateOpen(true);
  };

  const openEdit = (record: TerminalConfig) => {
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
      createRecord(values).then(() => { messageApi.success(t('qcConfig.common.created')); closeModal(); }).catch(() => messageApi.error(t('qcConfig.common.saveFailed')));
    } else if (editingRecord) {
      updateRecord(values).then(() => { messageApi.success(t('qcConfig.common.updated')); closeModal(); }).catch(() => messageApi.error(t('qcConfig.common.saveFailed')));
    }
  };

  const displayedList = useMemo(() => {
    if (!onlyLoggedInDevices) {
      return filteredList;
    }
    return filteredList.filter((item) => item.online && item.currentUser && item.currentUser !== '-');
  }, [filteredList, onlyLoggedInDevices]);

  const columns: ColumnsType<TerminalConfig> = [
    { title: '编码', dataIndex: 'code', key: 'code', width: 140 },
    { title: 'SN', dataIndex: 'sn', key: 'sn', width: 170 },
    { title: '终端类型', dataIndex: 'terminalType', key: 'terminalType', width: 150 },
    { title: '终端IP', dataIndex: 'terminalIp', key: 'terminalIp', width: 150 },
    {
      title: t('qcConfig.terminal.table.workstationId'),
      dataIndex: 'workstationId',
      key: 'workstationId',
      width: 140,
      render: (val: string | number) => <LongIdText value={val} />,
    },
    {
      title: t('qcConfig.terminal.table.boundStationIds'),
      dataIndex: 'boundStationIds',
      key: 'boundStationIds',
      width: 240,
      render: (stationIds: string[]) => stationIds.join(', ') || '-',
    },
    {
      title: t('qcConfig.terminal.table.online'),
      dataIndex: 'online',
      key: 'online',
      width: 130,
      render: (online: boolean) => <Tag color={online ? 'success' : 'error'}>{online ? t('qcConfig.common.online') : t('qcConfig.common.offline')}</Tag>,
    },
    { title: t('qcConfig.terminal.table.currentUser'), dataIndex: 'currentUser', key: 'currentUser', width: 150 },
    {
      title: t('qcConfig.terminal.table.action'),
      key: 'actions',
      width: 220,
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
            onClick={() => {
              const instance = modalApi.confirm({
                title: t('qcConfig.common.deleteConfirmTitle'),
                icon: <ExclamationCircleFilled />,
                content: record.code || record.sn,
                okText: t('qcConfig.common.delete'),
                okButtonProps: { danger: true },
                cancelText: t('qcConfig.common.cancel'),
                onOk: () =>
                  removeRecord(record.id)
                    .then(() => {
                      messageApi.success(t('qcConfig.common.deleted'));
                      instance.destroy();
                    })
                    .catch(() => {
                      messageApi.error(t('qcConfig.common.deleteFailed'));
                      return Promise.reject();
                    }),
              });
            }}
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
            {t('qcConfig.terminal.pageTitle')}
          </Typography.Title>
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} lg={10}>
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder={t('qcConfig.terminal.searchPlaceholder')}
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </Col>
            <Col xs={24} lg={14}>
              <Space wrap style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button icon={<SearchOutlined />} onClick={() => setOnlyLoggedInDevices((prev) => !prev)} type={onlyLoggedInDevices ? 'primary' : 'default'}>
                  {onlyLoggedInDevices ? '显示全部终端' : '仅看在线已登录'}
                </Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                  新增终端
                </Button>
              </Space>
            </Col>
          </Row>
        </Space>
      </Card>

      <Card>
        <Table rowKey="id" loading={loading} columns={columns} dataSource={displayedList} pagination={{ pageSize: 8, showSizeChanger: false }} scroll={{ x: 1600 }} />
      </Card>

      <Modal
        title={createOpen ? t('qcConfig.terminal.createTitle') : t('qcConfig.terminal.editTitle')}
        open={createOpen || Boolean(editingRecord)}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText={t('qcConfig.common.save')}
        cancelText={t('qcConfig.common.cancel')}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={submit}>
          {/* 主键 id 由后端自动生成，编辑时隐藏带上传给更新接口 */}
          <Form.Item name="id" hidden>
            <Input type="number" />
          </Form.Item>
          <Form.Item label="编码" name="code" rules={[{ required: true, message: '请输入编码' }]}>
            <Input placeholder="如：PAD-001" disabled={Boolean(editingRecord)} />
          </Form.Item>
          <Form.Item label="SN" name="sn" rules={[{ required: true, message: '请输入 SN' }]}>
            <Input placeholder="终端 SN 号" />
          </Form.Item>
          <Form.Item label="终端类型" name="terminalType" rules={[{ required: true, message: '请选择终端类型' }]}>
            <Select options={terminalTypeOptions} />
          </Form.Item>
          <Form.Item label="终端IP" name="terminalIp" rules={[{ required: true, message: '请输入终端IP' }]}>
            <Input />
          </Form.Item>
          <Form.Item
            label={t('qcConfig.terminal.form.workstationId')}
            name="workstationId"
            rules={[{ required: true, message: t('qcConfig.terminal.form.workstationIdRequired') }]}
          >
            <Select options={workstationOptions} />
          </Form.Item>
          <Form.Item
            label={t('qcConfig.terminal.form.boundStationIds')}
            name="boundStationIds"
            rules={[{ required: true, message: t('qcConfig.terminal.form.boundStationIdsRequired') }]}
          >
            <Select mode="multiple" options={stationOptions} />
          </Form.Item>
          <Form.Item
            label={t('qcConfig.terminal.form.online')}
            name="online"
            rules={[{ required: true, message: t('qcConfig.terminal.form.onlineRequired') }]}
          >
            <Select
              options={[
                { label: t('qcConfig.common.online'), value: true },
                { label: t('qcConfig.common.offline'), value: false },
              ]}
            />
          </Form.Item>
          <Form.Item
            label={t('qcConfig.terminal.form.currentUser')}
            name="currentUser"
            rules={[{ required: true, message: t('qcConfig.terminal.form.currentUserRequired') }]}
          >
            <Select
              options={userOptions}
              placeholder={t('qcConfig.terminal.form.currentUserRequired')}
              showSearch
              filterOption={(input, opt) => (opt?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
