import { ExportOutlined, PauseCircleOutlined, PlayCircleOutlined, PlusOutlined, StopOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, InputNumber, Modal, Select, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTaskManageList, type TaskManageRecord, type TaskStatus } from '../../../data/operationMaintenance/taskManageList';
import { useI18n } from '../../../i18n/I18nProvider';
import { getCurrentUser } from '../../../logic/auth/authStore';

function escapeCsv(value: string | number): string {
  const text = String(value ?? '');
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function buildCsv(rows: TaskManageRecord[]): string {
  const headers = ['code', 'externalCode', 'status', 'robot', 'priority', 'createdAt', 'endedAt'];
  const lines = rows.map((row) =>
    [row.code, row.externalCode, row.status, row.robot, row.priority, row.createdAt, row.endedAt].map((value) => escapeCsv(value)).join(','),
  );
  return `${headers.join(',')}\n${lines.join('\n')}`;
}

function downloadCsv(content: string, fileName: string): void {
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function nowText(): string {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function TaskManagePage() {
  const { locale, t } = useI18n();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [tableData, setTableData] = useState<TaskManageRecord[]>(() => getTaskManageList(locale));
  const [createOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm<{ code: string; externalCode: string; robot: string; priority: number; description: string }>();

  useEffect(() => {
    setTableData(getTaskManageList(locale));
  }, [locale]);

  const label = useMemo(() => {
    if (locale === 'en-US') {
      return {
        create: 'Create',
        export: 'Export',
        tableCode: 'Code',
        tableExternalCode: 'External Code',
        tableStatus: 'Status',
        tableRobot: 'Robot',
        tablePriority: 'Priority',
        tableCreatedAt: 'Created At',
        tableEndedAt: 'Ended At',
        tableAction: 'Action',
        actionPause: 'Pause',
        actionResume: 'Resume',
        actionStop: 'Stop',
        actionDetail: 'Detail',
        statusPending: 'Pending',
        statusRunning: 'Running',
        statusPaused: 'Paused',
        statusCompleted: 'Completed',
        statusStopped: 'Stopped',
        createTitle: 'Create Dispatch',
        createDone: 'Dispatch created',
        exportDone: 'Dispatch list exported',
        stopDone: 'Dispatch stopped',
        pauseDone: 'Dispatch paused',
        resumeDone: 'Dispatch resumed',
      };
    }

    return {
      create: '新增',
      export: '导出',
      tableCode: '码',
      tableExternalCode: '外部编码',
      tableStatus: '状态',
      tableRobot: '机器人',
      tablePriority: '优先级',
      tableCreatedAt: '创建时间',
      tableEndedAt: '结束时间',
      tableAction: '操作',
      actionPause: '暂停',
      actionResume: '恢复',
      actionStop: '停止',
      actionDetail: '详情',
      statusPending: '待执行',
      statusRunning: '执行中',
      statusPaused: '已暂停',
      statusCompleted: '已完成',
      statusStopped: '已停止',
      createTitle: '新增调度',
      createDone: '调度创建成功',
      exportDone: '调度列表导出成功',
      stopDone: '调度已停止',
      pauseDone: '调度已暂停',
      resumeDone: '调度已恢复',
    };
  }, [locale]);

  const statusText = (status: TaskStatus) => {
    if (status === 'pending') return label.statusPending;
    if (status === 'running') return label.statusRunning;
    if (status === 'paused') return label.statusPaused;
    if (status === 'completed') return label.statusCompleted;
    return label.statusStopped;
  };

  const statusColor = (status: TaskStatus) => {
    if (status === 'pending') return 'default';
    if (status === 'running') return 'processing';
    if (status === 'paused') return 'warning';
    if (status === 'completed') return 'success';
    return 'error';
  };

  const updateStatus = (id: string, status: TaskStatus) => {
    setTableData((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              endedAt: status === 'stopped' ? nowText() : item.endedAt,
            }
          : item,
      ),
    );
  };

  const columns: ColumnsType<TaskManageRecord> = [
    { title: label.tableCode, dataIndex: 'code', key: 'code', width: 180 },
    { title: label.tableExternalCode, dataIndex: 'externalCode', key: 'externalCode', width: 190 },
    {
      title: label.tableStatus,
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value: TaskStatus) => <Tag color={statusColor(value)}>{statusText(value)}</Tag>,
    },
    { title: label.tableRobot, dataIndex: 'robot', key: 'robot', width: 130 },
    { title: label.tablePriority, dataIndex: 'priority', key: 'priority', width: 110 },
    { title: label.tableCreatedAt, dataIndex: 'createdAt', key: 'createdAt', width: 170 },
    { title: label.tableEndedAt, dataIndex: 'endedAt', key: 'endedAt', width: 170 },
    {
      title: label.tableAction,
      key: 'action',
      width: 260,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Button
            type="link"
            icon={record.status === 'paused' ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
            disabled={record.status === 'completed' || record.status === 'stopped'}
            onClick={() => {
              if (record.status === 'paused') {
                updateStatus(record.id, 'running');
                messageApi.success(label.resumeDone);
              } else {
                updateStatus(record.id, 'paused');
                messageApi.warning(label.pauseDone);
              }
            }}
          >
            {record.status === 'paused' ? label.actionResume : label.actionPause}
          </Button>
          <Button
            type="link"
            danger
            icon={<StopOutlined />}
            disabled={record.status === 'completed' || record.status === 'stopped'}
            onClick={() => {
              Modal.confirm({
                title: locale === 'en-US' ? 'Stop this dispatch?' : '确认停止该调度？',
                content: record.code,
                okButtonProps: { danger: true },
                onOk: () => {
                  updateStatus(record.id, 'stopped');
                  messageApi.warning(label.stopDone);
                },
              });
            }}
          >
            {label.actionStop}
          </Button>
          <Button type="link" onClick={() => navigate(`/operationMaintenance/task/taskManage/${record.id}/detail`)}>
            {label.actionDetail}
          </Button>
        </Space>
      ),
    },
  ];

  const submitCreate = () => {
    form
      .validateFields()
      .then((values) => {
        const creator = getCurrentUser()?.username ?? 'admin';
        const next: TaskManageRecord = {
          id: `TASK-${Date.now()}`,
          code: values.code,
          externalCode: values.externalCode,
          status: 'pending',
          robot: values.robot,
          priority: values.priority,
          createdAt: nowText(),
          endedAt: '-',
          description: `${values.description}${values.description ? ' | ' : ''}${locale === 'en-US' ? `creator:${creator}` : `创建人:${creator}`}`,
        };
        setTableData((current) => [next, ...current]);
        setCreateOpen(false);
        form.resetFields();
        messageApi.success(label.createDone);
      })
      .catch(() => {});
  };

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {contextHolder}
      <Card>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {t('menu.taskManage')}
          </Typography.Title>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button
              icon={<ExportOutlined />}
              onClick={() => {
                downloadCsv(buildCsv(tableData), `dispatch-manage-${new Date().toISOString().slice(0, 10)}.csv`);
                messageApi.success(label.exportDone);
              }}
            >
              {label.export}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              {label.create}
            </Button>
          </Space>
        </Space>
      </Card>

      <Card>
        <Table rowKey="id" columns={columns} dataSource={tableData} pagination={{ pageSize: 8, showSizeChanger: false }} scroll={{ x: 1400 }} />
      </Card>

      <Modal
        title={label.createTitle}
        open={createOpen}
        onCancel={() => {
          setCreateOpen(false);
          form.resetFields();
        }}
        onOk={submitCreate}
        okText={locale === 'en-US' ? 'Create' : '创建'}
        cancelText={locale === 'en-US' ? 'Cancel' : '取消'}
      >
        <Form form={form} layout="vertical" initialValues={{ priority: 2 }}>
          <Form.Item label={label.tableCode} name="code" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label={label.tableExternalCode} name="externalCode" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label={label.tableRobot} name="robot" rules={[{ required: true }]}>
            <Select
              options={Array.from(new Set(tableData.map((item) => item.robot))).map((item) => ({
                label: item,
                value: item,
              }))}
            />
          </Form.Item>
          <Form.Item label={label.tablePriority} name="priority" rules={[{ required: true }]}>
            <InputNumber min={1} max={9} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label={locale === 'en-US' ? 'Description' : '描述'} name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

    </Space>
  );
}
