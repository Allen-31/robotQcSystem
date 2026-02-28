import { DeleteOutlined, EditOutlined, ExclamationCircleFilled, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Modal, Select, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { useWorkstationManage } from '../../logic/workstation/useWorkstationManage';
import type { Workstation, WorkstationStatus } from '../../shared/types/workstation';

const statusColorMap: Record<WorkstationStatus, string> = {
  running: 'success',
  maintenance: 'warning',
  idle: 'default',
};

const statusOptions: WorkstationStatus[] = ['running', 'maintenance', 'idle'];

function statusTextKey(status: WorkstationStatus): string {
  return `workstation.status.${status}`;
}

export function WorkstationManagePage() {
  const [form] = Form.useForm();
  const { t } = useI18n();
  const { keyword, setKeyword, filteredList, editingRecord, openEdit, closeEdit, saveEdit, removeWorkstation } =
    useWorkstationManage();

  useEffect(() => {
    if (!editingRecord) {
      form.resetFields();
      return;
    }

    form.setFieldsValue({
      id: editingRecord.id,
      name: editingRecord.name,
      factory: editingRecord.factory,
      location: editingRecord.location,
      status: editingRecord.status,
      stationListRaw: editingRecord.stationList.join(', '),
    });
  }, [editingRecord, form]);

  const columns: ColumnsType<Workstation> = [
    { title: t('workstation.table.id'), dataIndex: 'id', key: 'id', width: 130 },
    { title: t('workstation.table.name'), dataIndex: 'name', key: 'name', width: 220 },
    { title: t('workstation.table.factory'), dataIndex: 'factory', key: 'factory', width: 140 },
    {
      title: t('workstation.table.count'),
      dataIndex: 'inspectionStationCount',
      key: 'inspectionStationCount',
      width: 180,
      sorter: (a, b) => a.inspectionStationCount - b.inspectionStationCount,
    },
    { title: t('workstation.table.location'), dataIndex: 'location', key: 'location', width: 220 },
    {
      title: t('workstation.table.stationList'),
      dataIndex: 'stationList',
      key: 'stationList',
      render: (stationList: string[]) => (
        <Space size={[4, 4]} wrap>
          {stationList.map((item) => (
            <Tag key={item}>{item}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: t('workstation.table.status'),
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: WorkstationStatus) => <Tag color={statusColorMap[status]}>{t(statusTextKey(status))}</Tag>,
      filters: statusOptions.map((status) => ({ text: t(statusTextKey(status)), value: status })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: t('workstation.table.action'),
      key: 'actions',
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <Space size={8}>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            {t('workstation.action.edit')}
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: t('workstation.deleteConfirmTitle'),
                icon: <ExclamationCircleFilled />,
                content: t('workstation.deleteConfirmContent', { name: record.name, id: record.id }),
                okText: t('workstation.action.delete'),
                okButtonProps: { danger: true },
                cancelText: t('workstation.modal.cancel'),
                onOk: () => removeWorkstation(record.id),
              });
            }}
          >
            {t('workstation.action.delete')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {t('workstation.pageTitle')}
          </Typography.Title>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder={t('workstation.searchPlaceholder')}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </Space>
      </Card>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredList}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          scroll={{ x: 1400 }}
        />
      </Card>

      <Modal
        title={t('workstation.modal.title')}
        open={Boolean(editingRecord)}
        onCancel={closeEdit}
        onOk={() => form.submit()}
        okText={t('workstation.modal.save')}
        cancelText={t('workstation.modal.cancel')}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) =>
            saveEdit({
              id: values.id,
              name: values.name,
              factory: values.factory,
              location: values.location,
              status: values.status,
              stationListRaw: values.stationListRaw,
            })
          }
        >
          <Form.Item label={t('workstation.form.id')} name="id">
            <Input disabled />
          </Form.Item>
          <Form.Item label={t('workstation.form.name')} name="name" rules={[{ required: true, message: t('workstation.form.nameRequired') }]}>
            <Input />
          </Form.Item>
          <Form.Item label={t('workstation.form.factory')} name="factory" rules={[{ required: true, message: t('workstation.form.factoryRequired') }]}>
            <Input />
          </Form.Item>
          <Form.Item label={t('workstation.form.location')} name="location" rules={[{ required: true, message: t('workstation.form.locationRequired') }]}>
            <Input />
          </Form.Item>
          <Form.Item label={t('workstation.form.status')} name="status" rules={[{ required: true, message: t('workstation.form.statusRequired') }]}>
            <Select
              options={statusOptions.map((status) => ({
                label: t(statusTextKey(status)),
                value: status,
              }))}
            />
          </Form.Item>
          <Form.Item
            label={t('workstation.form.stationListRaw')}
            name="stationListRaw"
            rules={[{ required: true, message: t('workstation.form.stationListRequired') }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
