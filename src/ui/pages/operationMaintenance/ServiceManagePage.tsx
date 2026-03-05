import { FileTextOutlined, PauseCircleOutlined, PlayCircleOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Input, Modal, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';
import {
  getServiceManageList,
  type ServiceLogRecord,
  type ServiceManageRecord,
  type ServiceStatus,
} from '../../../data/operationMaintenance/serviceManageList';
import { useI18n } from '../../../i18n/I18nProvider';

function downloadLog(log: ServiceLogRecord): void {
  const blob = new Blob([log.content], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = log.logName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function ServiceManagePage() {
  const { locale, t } = useI18n();
  const [messageApi, contextHolder] = message.useMessage();
  const [serviceList, setServiceList] = useState<ServiceManageRecord[]>(() => getServiceManageList(locale));
  const [historyService, setHistoryService] = useState<ServiceManageRecord | null>(null);
  const [previewLog, setPreviewLog] = useState<ServiceLogRecord | null>(null);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    setServiceList(getServiceManageList(locale));
  }, [locale]);

  const label = useMemo(() => {
    if (locale === 'en-US') {
      return {
        tableName: 'Name',
        tableType: 'Type',
        tableVersion: 'Version',
        tableIp: 'IP',
        tableStatus: 'Status',
        tableCpu: 'CPU Usage',
        tableMemory: 'Memory Usage',
        tableRuntime: 'Runtime',
        tableAction: 'Action',
        statusRunning: 'Running',
        statusStopped: 'Stopped',
        statusDegraded: 'Degraded',
        start: 'Start',
        stop: 'Stop',
        restart: 'Restart',
        historyLog: 'History Log',
        startDone: 'Service started',
        stopDone: 'Service stopped',
        restartDone: 'Service restarted',
        historyTitle: 'History Log',
        logName: 'Log Name',
        logType: 'Type',
        logCreatedAt: 'Created At',
        logUpdatedAt: 'Updated At',
        logAction: 'Action',
        preview: 'Preview',
        download: 'Download',
        downloadDone: 'Log downloaded',
        previewTitle: 'Log Preview',
        searchPlaceholder: 'Search by name, type, version, IP, status',
      };
    }
    return {
      tableName: '名称',
      tableType: '类型',
      tableVersion: '版本',
      tableIp: 'IP',
      tableStatus: '状态',
      tableCpu: 'CPU占用',
      tableMemory: '内存占用',
      tableRuntime: '运行时长',
      tableAction: '操作',
      statusRunning: '运行中',
      statusStopped: '已停止',
      statusDegraded: '异常',
      start: '启动',
      stop: '停止',
      restart: '重启',
      historyLog: '历史日志',
      startDone: '服务已启动',
      stopDone: '服务已停止',
      restartDone: '服务已重启',
      historyTitle: '历史日志',
      logName: '日志名称',
      logType: '类型',
      logCreatedAt: '创建时间',
      logUpdatedAt: '更新时间',
      logAction: '操作',
      preview: '预览',
      download: '下载',
      downloadDone: '日志下载成功',
      previewTitle: '日志预览',
      searchPlaceholder: '按名称、类型、版本、IP、状态搜索',
    };
  }, [locale]);

  const getStatusText = (status: ServiceStatus) => {
    if (status === 'running') {
      return label.statusRunning;
    }
    if (status === 'stopped') {
      return label.statusStopped;
    }
    return label.statusDegraded;
  };

  const getStatusColor = (status: ServiceStatus) => {
    if (status === 'running') {
      return 'success';
    }
    if (status === 'stopped') {
      return 'default';
    }
    return 'warning';
  };

  const updateServiceStatus = (id: string, status: ServiceStatus) => {
    setServiceList((current) =>
      current.map((item) => {
        if (item.id !== id) {
          return item;
        }
        return {
          ...item,
          status,
          cpuUsage: status === 'stopped' ? 0 : item.cpuUsage || 18.3,
          memoryUsage: status === 'stopped' ? 0 : item.memoryUsage || 44.6,
          runtime: status === 'stopped' ? '0小时' : item.runtime || '0小时 10分钟',
        };
      }),
    );
    if (historyService?.id === id) {
      setHistoryService((current) => (current ? { ...current, status } : current));
    }
  };

  const columns: ColumnsType<ServiceManageRecord> = [
    { title: label.tableName, dataIndex: 'name', key: 'name', width: 180 },
    { title: label.tableType, dataIndex: 'type', key: 'type', width: 120 },
    { title: label.tableVersion, dataIndex: 'version', key: 'version', width: 120 },
    { title: label.tableIp, dataIndex: 'ip', key: 'ip', width: 140 },
    {
      title: label.tableStatus,
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: ServiceStatus) => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>,
    },
    { title: label.tableCpu, dataIndex: 'cpuUsage', key: 'cpuUsage', width: 130, render: (value: number) => `${value}%` },
    { title: label.tableMemory, dataIndex: 'memoryUsage', key: 'memoryUsage', width: 130, render: (value: number) => `${value}%` },
    { title: label.tableRuntime, dataIndex: 'runtime', key: 'runtime', width: 140 },
    {
      title: label.tableAction,
      key: 'action',
      width: 320,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4} wrap>
          <Button
            type="link"
            icon={<PlayCircleOutlined />}
            disabled={record.status === 'running'}
            onClick={() => {
              updateServiceStatus(record.id, 'running');
              messageApi.success(label.startDone);
            }}
          >
            {label.start}
          </Button>
          <Button
            type="link"
            icon={<PauseCircleOutlined />}
            disabled={record.status === 'stopped'}
            onClick={() => {
              updateServiceStatus(record.id, 'stopped');
              messageApi.warning(label.stopDone);
            }}
          >
            {label.stop}
          </Button>
          <Button
            type="link"
            icon={<ReloadOutlined />}
            onClick={() => {
              updateServiceStatus(record.id, 'running');
              messageApi.success(label.restartDone);
            }}
          >
            {label.restart}
          </Button>
          <Button type="link" icon={<FileTextOutlined />} onClick={() => setHistoryService(record)}>
            {label.historyLog}
          </Button>
        </Space>
      ),
    },
  ];

  const filteredServiceList = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) {
      return serviceList;
    }
    return serviceList.filter((item) => {
      const text = `${item.name} ${item.type} ${item.version} ${item.ip} ${getStatusText(item.status)} ${item.status}`.toLowerCase();
      return text.includes(normalized);
    });
  }, [keyword, serviceList]);

  const historyColumns: ColumnsType<ServiceLogRecord> = [
    { title: label.logName, dataIndex: 'logName', key: 'logName', width: 240 },
    { title: label.logType, dataIndex: 'type', key: 'type', width: 140 },
    { title: label.logCreatedAt, dataIndex: 'createdAt', key: 'createdAt', width: 180 },
    { title: label.logUpdatedAt, dataIndex: 'updatedAt', key: 'updatedAt', width: 180 },
    {
      title: label.logAction,
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, log) => (
        <Space size={4}>
          <Button type="link" onClick={() => setPreviewLog(log)}>
            {label.preview}
          </Button>
          <Button
            type="link"
            onClick={() => {
              downloadLog(log);
              messageApi.success(label.downloadDone);
            }}
          >
            {label.download}
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
            {t('menu.serviceManage')}
          </Typography.Title>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder={label.searchPlaceholder}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </Space>
      </Card>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredServiceList}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          scroll={{ x: 1400 }}
        />
      </Card>

      <Modal
        title={historyService ? `${label.historyTitle} - ${historyService.name}` : label.historyTitle}
        open={Boolean(historyService)}
        onCancel={() => setHistoryService(null)}
        footer={null}
        width={940}
      >
        <Table
          rowKey="id"
          columns={historyColumns}
          dataSource={historyService?.logs ?? []}
          pagination={{ pageSize: 6, showSizeChanger: false }}
          scroll={{ x: 880 }}
          size="small"
        />
      </Modal>

      <Modal title={label.previewTitle} open={Boolean(previewLog)} onCancel={() => setPreviewLog(null)} footer={null} width={760}>
        {previewLog ? (
          <Space direction="vertical" size={10} style={{ width: '100%' }}>
            <Typography.Text strong>
              {label.logName}：{previewLog.logName}
            </Typography.Text>
            <Typography.Text>
              {label.logType}：{previewLog.type}
            </Typography.Text>
            <Typography.Text>
              {label.logUpdatedAt}：{previewLog.updatedAt}
            </Typography.Text>
            <pre
              style={{
                margin: 0,
                padding: 12,
                borderRadius: 8,
                background: '#0f172a',
                color: '#e2e8f0',
                maxHeight: 360,
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
              }}
            >
              {previewLog.content}
            </pre>
          </Space>
        ) : null}
      </Modal>
    </Space>
  );
}
