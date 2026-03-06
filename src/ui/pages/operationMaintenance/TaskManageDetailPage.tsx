import {
  ArrowLeftOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  CopyOutlined,
  ExpandOutlined,
  FullscreenOutlined,
  PauseCircleFilled,
  PlayCircleFilled,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { Button, Card, Empty, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTaskManageList, type TaskManageRecord } from '../../../data/operationMaintenance/taskManageList';
import { useI18n } from '../../../i18n/I18nProvider';
import './TaskManageDetailPage.css';

type JournalLog = {
  key: string;
  time: string;
  node: string;
  action: string;
  duration: string;
  type: 'start' | 'pause' | 'resume' | 'done';
};

type CommandRow = {
  key: string;
  order: number;
  node: string;
  command: string;
  params: string;
  status: string;
  duration: string;
};

type DetailRow = {
  key: string;
  label: string;
  value: string;
};

type FlowNode = {
  key: string;
  name: string;
  command: string;
  params: string;
  durationSec: number;
  status: 'done' | 'running' | 'pending';
};

function toInstanceId(task: TaskManageRecord): string {
  return task.externalCode.replace(/[^0-9A-Za-z]/g, '').toLowerCase().slice(0, 16) || task.id.toLowerCase();
}

function statusColor(status: TaskManageRecord['status']) {
  if (status === 'running') return 'processing';
  if (status === 'paused') return 'warning';
  if (status === 'completed') return 'success';
  if (status === 'stopped') return 'error';
  return 'default';
}

function statusText(status: TaskManageRecord['status'], locale: string): string {
  if (status === 'running') return locale === 'en-US' ? 'Running' : '执行中';
  if (status === 'paused') return locale === 'en-US' ? 'Paused' : '已暂停';
  if (status === 'completed') return locale === 'en-US' ? 'Completed' : '已完成';
  if (status === 'stopped') return locale === 'en-US' ? 'Stopped' : '已停止';
  return locale === 'en-US' ? 'Pending' : '待执行';
}

function toDate(raw: string): Date {
  const safe = raw.replace(' ', 'T');
  const date = new Date(safe);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function formatDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatDuration(sec: number): string {
  const total = Math.max(0, Math.floor(sec));
  const hh = Math.floor(total / 3600);
  const mm = Math.floor((total % 3600) / 60);
  const ss = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

function progressStepByStatus(status: TaskManageRecord['status'], total: number): number {
  if (status === 'pending') return 1;
  if (status === 'paused') return Math.min(2, total);
  if (status === 'running') return Math.min(total - 1, total);
  if (status === 'completed' || status === 'stopped') return total;
  return 1;
}

function buildWorkflowNodes(task: TaskManageRecord, locale: string): FlowNode[] {
  const base: Array<Omit<FlowNode, 'status'>> = [
    {
      key: 'dispatch',
      name: locale === 'en-US' ? 'Dispatch Task' : '任务下发',
      command: locale === 'en-US' ? 'Dispatch' : '下发任务',
      params: `{"taskCode":"${task.code}","robot":"${task.robot}"}`,
      durationSec: 2,
    },
    {
      key: 'delay',
      name: locale === 'en-US' ? 'Delay' : '延时',
      command: locale === 'en-US' ? 'Delay' : '延时',
      params: `{"ms":${6000 + task.priority * 1000}}`,
      durationSec: 6 + task.priority,
    },
    {
      key: 'check',
      name: locale === 'en-US' ? 'Quality Check' : '质检校验',
      command: locale === 'en-US' ? 'Inspect' : '执行质检',
      params: `{"externalCode":"${task.externalCode}"}`,
      durationSec: 8 + task.priority,
    },
    {
      key: 'write',
      name: locale === 'en-US' ? 'Write Line' : '写入产线',
      command: locale === 'en-US' ? 'WriteLine' : '写入产线',
      params: `{"value":"${task.code}"}`,
      durationSec: 3,
    },
    {
      key: 'report',
      name: locale === 'en-US' ? 'Report Upload' : '上报结果',
      command: locale === 'en-US' ? 'Report' : '上报结果',
      params: `{"result":"${task.status === 'completed' ? 'OK' : 'RUNNING'}"}`,
      durationSec: 2,
    },
  ];

  const doneStep = progressStepByStatus(task.status, base.length);
  return base.map((node, index) => ({
    ...node,
    status: index + 1 < doneStep ? 'done' : index + 1 === doneStep ? (task.status === 'completed' || task.status === 'stopped' ? 'done' : 'running') : 'pending',
  }));
}

function logIcon(type: JournalLog['type']) {
  if (type === 'pause') return <PauseCircleFilled style={{ color: '#f59e0b' }} />;
  if (type === 'resume') return <PlayCircleFilled style={{ color: '#1677ff' }} />;
  if (type === 'done') return <CheckCircleFilled style={{ color: '#22c55e' }} />;
  return <ClockCircleOutlined style={{ color: '#6b7280' }} />;
}

function buildJournalLogs(task: TaskManageRecord, locale: string, nodes: FlowNode[]): JournalLog[] {
  const logs: JournalLog[] = [];
  let currentTime = toDate(task.createdAt);
  nodes.forEach((node, index) => {
    logs.push({
      key: `${index + 1}-start`,
      time: formatDate(currentTime),
      node: node.name,
      action: locale === 'en-US' ? 'Started' : '已开始',
      duration: '00:00:00',
      type: 'start',
    });

    if (node.status === 'running' && task.status === 'paused') {
      logs.push({
        key: `${index + 1}-pause`,
        time: formatDate(new Date(currentTime.getTime() + 1000)),
        node: node.name,
        action: locale === 'en-US' ? 'Suspended' : '已暂停',
        duration: '00:00:01',
        type: 'pause',
      });
      return;
    }

    if (node.status === 'running' && task.status === 'running') {
      logs.push({
        key: `${index + 1}-resume`,
        time: formatDate(new Date(currentTime.getTime() + 1000)),
        node: node.name,
        action: locale === 'en-US' ? 'Running' : '执行中',
        duration: formatDuration(node.durationSec),
        type: 'resume',
      });
      return;
    }

    if (node.status === 'done') {
      currentTime = new Date(currentTime.getTime() + node.durationSec * 1000);
      logs.push({
        key: `${index + 1}-done`,
        time: formatDate(currentTime),
        node: node.name,
        action: locale === 'en-US' ? 'Completed' : '已完成',
        duration: formatDuration(node.durationSec),
        type: 'done',
      });
    }
  });
  return logs;
}

function buildActivityRows(task: TaskManageRecord, locale: string): DetailRow[] {
  return [
    { key: 'id', label: 'ID', value: task.id.toLowerCase() },
    { key: 'type', label: locale === 'en-US' ? 'Type' : '类型', value: locale === 'en-US' ? 'Task.Flowchart' : '任务流程图' },
    { key: 'version', label: locale === 'en-US' ? 'Version' : '版本', value: String((task.priority % 3) + 1) },
    { key: 'status', label: locale === 'en-US' ? 'Status' : '状态', value: statusText(task.status, locale) },
    { key: 'instance', label: locale === 'en-US' ? 'Instance ID' : '实例ID', value: toInstanceId(task) },
    { key: 'robot', label: locale === 'en-US' ? 'Robot' : '机器人', value: task.robot },
  ];
}

function buildWorkflowDetailRows(task: TaskManageRecord, locale: string): DetailRow[] {
  return [
    { key: 'id', label: 'ID', value: toInstanceId(task) },
    { key: 'definitionId', label: locale === 'en-US' ? 'Definition ID' : '定义ID', value: `4eca1b37e447288${task.id.slice(-1)}` },
    { key: 'definitionVersion', label: locale === 'en-US' ? 'Definition Version' : '定义版本', value: String((task.priority % 4) + 3) },
    { key: 'versionId', label: locale === 'en-US' ? 'Definition Version ID' : '定义版本ID', value: `bdb158de495d2f${task.id.slice(-1)}` },
    { key: 'incidentStrategy', label: locale === 'en-US' ? 'Incident Strategy' : '异常策略', value: locale === 'en-US' ? 'Default' : '默认' },
    { key: 'status', label: locale === 'en-US' ? 'Status' : '状态', value: task.status === 'completed' ? (locale === 'en-US' ? 'Finished' : '已完成') : statusText(task.status, locale) },
    { key: 'subStatus', label: locale === 'en-US' ? 'Sub Status' : '子状态', value: task.status === 'completed' ? (locale === 'en-US' ? 'Finished' : '已完成') : statusText(task.status, locale) },
    { key: 'incidents', label: locale === 'en-US' ? 'Incidents' : '异常数', value: task.status === 'stopped' ? '1' : '0' },
    { key: 'created', label: locale === 'en-US' ? 'Created' : '创建时间', value: task.createdAt },
    { key: 'updated', label: locale === 'en-US' ? 'Updated' : '更新时间', value: task.createdAt },
    { key: 'finished', label: locale === 'en-US' ? 'Finished' : '结束时间', value: task.endedAt === '-' ? task.createdAt : task.endedAt },
  ];
}

function buildCommandRows(locale: string, nodes: FlowNode[]): CommandRow[] {
  return nodes.map((node, index) => ({
    key: `cmd-${index + 1}`,
    order: index + 1,
    node: locale === 'en-US' ? `${node.key}-${index + 1}` : `${node.name}${index + 1}`,
    command: node.command,
    params: node.params,
    status: node.status === 'done' ? (locale === 'en-US' ? 'Done' : '已完成') : node.status === 'running' ? (locale === 'en-US' ? 'Running' : '执行中') : locale === 'en-US' ? 'Pending' : '待执行',
    duration: node.status === 'pending' ? '00:00:00' : formatDuration(node.durationSec),
  }));
}

function CopyValue({ value }: { value: string }) {
  const { locale } = useI18n();
  const [messageApi, contextHolder] = message.useMessage();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      messageApi.success(locale === 'en-US' ? 'Copied' : '已复制');
    } catch {
      messageApi.error(locale === 'en-US' ? 'Copy failed' : '复制失败');
    }
  };

  return (
    <>
      {contextHolder}
      <Button type="text" size="small" icon={<CopyOutlined />} onClick={copy} />
    </>
  );
}

export function TaskManageDetailPage() {
  const { locale } = useI18n();
  const navigate = useNavigate();
  const { taskId } = useParams<{ taskId: string }>();
  const [activeTab, setActiveTab] = useState<'activity' | 'executions'>('activity');

  const task = useMemo(() => getTaskManageList(locale).find((item) => item.id === taskId), [locale, taskId]);

  if (!task) {
    return (
      <Card>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/operationMaintenance/task/taskManage')}>
            {locale === 'en-US' ? 'Back' : '返回'}
          </Button>
          <Empty description={locale === 'en-US' ? 'Task not found' : '任务不存在'} />
        </Space>
      </Card>
    );
  }

  const workflowNodes = buildWorkflowNodes(task, locale);
  const logs = buildJournalLogs(task, locale, workflowNodes);
  const activityRows = buildActivityRows(task, locale);
  const detailRows = buildWorkflowDetailRows(task, locale);
  const commandRows = buildCommandRows(locale, workflowNodes);

  const commandColumns: ColumnsType<CommandRow> = [
    { title: locale === 'en-US' ? '#' : '序号', dataIndex: 'order', key: 'order', width: 70 },
    { title: locale === 'en-US' ? 'Node' : '节点', dataIndex: 'node', key: 'node', width: 130 },
    { title: locale === 'en-US' ? 'Command' : '指令', dataIndex: 'command', key: 'command', width: 150 },
    { title: locale === 'en-US' ? 'Parameters' : '参数', dataIndex: 'params', key: 'params', ellipsis: true },
    {
      title: locale === 'en-US' ? 'Status' : '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (value: string) => <Tag color={value === 'Done' || value === '已完成' ? 'success' : 'processing'}>{value}</Tag>,
    },
    { title: locale === 'en-US' ? 'Duration' : '耗时', dataIndex: 'duration', key: 'duration', width: 120 },
  ];

  return (
    <div className="task-detail-page">
      <div className="task-detail-page-header">
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {locale === 'en-US' ? 'Task Detail' : '任务详情'}
            </Typography.Title>
            <Tag color={statusColor(task.status)}>{statusText(task.status, locale)}</Tag>
          </Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/operationMaintenance/task/taskManage')}>
            {locale === 'en-US' ? 'Back to List' : '返回列表'}
          </Button>
        </Space>
      </div>

      <div className="task-detail-grid">
        <aside className="task-detail-journal">
          <div className="panel-title">{locale === 'en-US' ? 'JOURNAL' : '运行日志'}</div>
          <div className="journal-toolbar">
            <Button type="text" icon={<ClockCircleOutlined />} />
            <Button type="text" icon={<FullscreenOutlined />} />
            <Button type="text" icon={<PlayCircleFilled />} />
          </div>
          <div className="journal-list">
            {logs.map((log) => (
              <div className="journal-item" key={log.key}>
                <div className="journal-time">
                  <Typography.Text>{log.time.split(' ')[0]}</Typography.Text>
                  <Typography.Text type="secondary">{log.time.split(' ')[1]}</Typography.Text>
                </div>
                <div className="journal-node-icon">{logIcon(log.type)}</div>
                <div className="journal-node-text">
                  <Typography.Text strong>{log.node}</Typography.Text>
                  <Typography.Text>{log.action}</Typography.Text>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="task-detail-main">
          <div className="panel-title">{toInstanceId(task).toUpperCase()}</div>
          <div className="workflow-toolbar">
            <div>
              <Button type="text" icon={<ExpandOutlined />} />
              <Button type="text" icon={<FullscreenOutlined />} />
            </div>
            <Space>
              <UnorderedListOutlined />
              <Typography.Text>00:00:10</Typography.Text>
            </Space>
          </div>

          <div className="workflow-canvas">
            <div className="workflow-sequence">
              {workflowNodes.map((node, index) => (
                <div key={node.key} className="workflow-step">
                  <div className={`workflow-node node-${node.key} node-status-${node.status}`}>
                    <span className="workflow-node-badge">{index + 1}</span>
                    <Typography.Text strong>{node.name}</Typography.Text>
                  </div>
                  {index < workflowNodes.length - 1 ? <div className="workflow-link-arrow" aria-hidden="true" /> : null}
                </div>
              ))}
            </div>
          </div>

          <div className="activity-panel">
            <div className="activity-tabs">
              <span className={`tab ${activeTab === 'activity' ? 'active' : ''}`} onClick={() => setActiveTab('activity')}>
                {locale === 'en-US' ? 'ACTIVITY' : '活动'}
              </span>
              <span className={`tab ${activeTab === 'executions' ? 'active' : ''}`} onClick={() => setActiveTab('executions')}>
                {locale === 'en-US' ? 'EXECUTIONS 1' : '执行记录 1'}
              </span>
            </div>

            {activeTab === 'activity' ? (
              <div className="activity-table-wrap">
                <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
                  {locale === 'en-US' ? 'Activity' : '活动信息'}
                </Typography.Text>
                <div className="activity-kv-list">
                  {activityRows.map((row) => (
                    <div className="activity-kv-row" key={row.key}>
                      <span>{row.label}</span>
                      <span className="copy">
                        <CopyValue value={row.value} />
                      </span>
                      <span>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {activeTab === 'executions' ? (
              <div className="command-table-wrap">
                <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
                  {locale === 'en-US' ? 'Command List' : '指令列表'}
                </Typography.Text>
                <Table size="small" rowKey="key" columns={commandColumns} dataSource={commandRows} pagination={false} scroll={{ x: 780 }} />
              </div>
            ) : null}
          </div>
        </main>

        <aside className="task-detail-side">
          <div className="side-tabs">
            <span className="tab active">{locale === 'en-US' ? 'DETAILS' : '详情'}</span>
            <span className="tab">{locale === 'en-US' ? 'VARIA' : '变量'}</span>
          </div>
          <Card size="small" title={locale === 'en-US' ? 'Workflow' : '任务流'} styles={{ body: { padding: 0 } }}>
            <div className="detail-kv-list">
              {detailRows.map((row) => (
                <div className="detail-kv-row" key={row.key}>
                  <span className="label">{row.label}</span>
                  <span className="copy">
                    <CopyValue value={row.value} />
                  </span>
                  <span className="value">{row.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
