import { DeleteOutlined, EditOutlined, ExclamationCircleFilled, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Col, Form, Input, Modal, Row, Select, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { useI18n } from '../../../i18n/I18nProvider';
import { useTerminalConfig } from '../../../logic/qcConfig/useTerminalConfig';
import type { TerminalConfig } from '../../../shared/types/qcConfig';

type FormValues = TerminalConfig;

export function TerminalConfigPage() {
  const [form] = Form.useForm<FormValues>();
  const { t } = useI18n();
  const { filteredList, keyword, setKeyword, createRecord, updateRecord, removeRecord, workstationOptions, stationOptions } = useTerminalConfig();
  const [editingRecord, setEditingRecord] = useState<TerminalConfig | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [onlyLoggedInDevices, setOnlyLoggedInDevices] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const openCreate = () => {
    form.resetFields();
    form.setFieldsValue({ online: true, currentUser: '-', boundStationIds: [], terminalType: '宸ユ帶缁堢' });
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
      createRecord(values);
      messageApi.success(t('qcConfig.common.created'));
    } else if (editingRecord) {
      updateRecord(values);
      messageApi.success(t('qcConfig.common.updated'));
    }
    closeModal();
  };

  const displayedList = useMemo(() => {
    if (!onlyLoggedInDevices) {
      return filteredList;
    }
    return filteredList.filter((item) => item.online && item.currentUser && item.currentUser !== '-');
  }, [filteredList, onlyLoggedInDevices]);

  const handleSearchLoggedInDevices = () => {
    setOnlyLoggedInDevices((prev) => !prev);
  };

  const columns: ColumnsType<TerminalConfig> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 120 },
    { title: 'SN', dataIndex: 'sn', key: 'sn', width: 170 },
    { title: '绫诲瀷', dataIndex: 'terminalType', key: 'terminalType', width: 150 },
    { title: '缁堢IP', dataIndex: 'terminalIp', key: 'terminalIp', width: 150 },
    { title: t('qcConfig.terminal.table.workstationId'), dataIndex: 'workstationId', key: 'workstationId', width: 180 },
    {
      title: t('qcConfig.terminal.table.boundStationIds'),
      dataIndex: 'boundStationIds',
      key: 'boundStationIds',
      width: 240,
      render: (stationIds: string[]) => stationIds.join(', ') || '-',
    },
    {
      title: '鏄惁鍦ㄧ嚎',
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
                <Button icon={<SearchOutlined />} onClick={handleSearchLoggedInDevices} type={onlyLoggedInDevices ? 'primary' : 'default'}>
                  鎼滅储鐧诲綍璁惧
                </Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                  鎵嬪姩娣诲姞
                </Button>
              </Space>
            </Col>
          </Row>
        </Space>
      </Card>

      <Card>
        <Table rowKey="id" columns={columns} dataSource={displayedList} pagination={{ pageSize: 8, showSizeChanger: false }} scroll={{ x: 1600 }} />
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
          <Form.Item label="ID" name="id" rules={[{ required: true, message: '璇疯緭鍏D' }]}>
            <Input disabled={Boolean(editingRecord)} />
          </Form.Item>
          <Form.Item label="SN" name="sn" rules={[{ required: true, message: '璇疯緭鍏N' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="绫诲瀷" name="terminalType" rules={[{ required: true, message: '璇烽€夋嫨绫诲瀷' }]}>
            <Select options={['宸ユ帶缁堢', '骞虫澘缁堢', '鎵嬫寔缁堢'].map((item) => ({ label: item, value: item }))} />
          </Form.Item>
          <Form.Item label="缁堢IP" name="terminalIp" rules={[{ required: true, message: '璇疯緭鍏ョ粓绔疘P' }]}>
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
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
