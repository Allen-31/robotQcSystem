/**
 * Shared data and structure for Home dashboard (Web + Pad).
 * UI-agnostic: no React nodes, only keys and values for i18n and display.
 */
export type HomeMetricItem = {
  labelKey: string;
  value: string;
  iconKey: string;
};

export type HomeExceptionItem = {
  key: string;
  code?: string;
  typeKey: string;
  descriptionKey?: string;
  name?: string;
  status?: 'running' | 'abnormal';
};

export type HomeOperationStats = {
  executingTasks: number;
  pendingExceptions: number;
  completionRate: string;
};

export interface HomeDashboardViewModel {
  qualityTotalMetrics: HomeMetricItem[];
  qualityTodayMetrics: HomeMetricItem[];
  deviceTotalMetrics: HomeMetricItem[];
  deviceTodayMetrics: HomeMetricItem[];
  taskExceptions: HomeExceptionItem[];
  deviceExceptions: HomeExceptionItem[];
  serviceExceptions: HomeExceptionItem[];
  operationStats: HomeOperationStats;
}

const qualityTotalMetrics: HomeMetricItem[] = [
  { labelKey: 'home.metric.qualityCount', value: '48,620', iconKey: 'DashboardOutlined' },
  { labelKey: 'home.metric.detectionRate', value: '97.52%', iconKey: 'CheckCircleOutlined' },
  { labelKey: 'home.metric.reviewRate', value: '91.36%', iconKey: 'RadarChartOutlined' },
  { labelKey: 'home.metric.duration', value: '12,680h', iconKey: 'ClockCircleOutlined' },
];

const qualityTodayMetrics: HomeMetricItem[] = [
  { labelKey: 'home.metric.qualityCount', value: '1,286', iconKey: 'DashboardOutlined' },
  { labelKey: 'home.metric.detectionRate', value: '96.71%', iconKey: 'CheckCircleOutlined' },
  { labelKey: 'home.metric.reviewRate', value: '89.28%', iconKey: 'RadarChartOutlined' },
  { labelKey: 'home.metric.duration', value: '326h', iconKey: 'ClockCircleOutlined' },
];

const deviceTotalMetrics: HomeMetricItem[] = [
  { labelKey: 'home.metric.robotRuntime', value: '22,460h', iconKey: 'ThunderboltOutlined' },
  { labelKey: 'home.metric.robotWorktime', value: '18,920h', iconKey: 'ToolOutlined' },
  { labelKey: 'home.metric.robotFailureRate', value: '2.14%', iconKey: 'BugOutlined' },
];

const deviceTodayMetrics: HomeMetricItem[] = [
  { labelKey: 'home.metric.robotOnline', value: '61 / 68', iconKey: 'RobotOutlined' },
  { labelKey: 'home.metric.avgRuntime', value: '15.8h', iconKey: 'ThunderboltOutlined' },
  { labelKey: 'home.metric.avgWorktime', value: '12.6h', iconKey: 'ToolOutlined' },
  { labelKey: 'home.metric.stationCount', value: '120 / 86 / 120', iconKey: 'ApiOutlined' },
];

const taskExceptions: HomeExceptionItem[] = [
  { key: '1', code: 'TASK-20260227-01', typeKey: 'home.type.dispatch', descriptionKey: 'home.desc.taskTimeout' },
  { key: '2', code: 'TASK-20260227-02', typeKey: 'home.type.execution', descriptionKey: 'home.desc.pathPlanningFailed' },
  { key: '3', code: 'TASK-20260227-03', typeKey: 'home.type.review', descriptionKey: 'home.desc.reviewBacklog' },
  { key: '4', code: 'TASK-20260227-04', typeKey: 'home.type.dispatch', descriptionKey: 'home.desc.queueBlocked' },
  { key: '5', code: 'TASK-20260227-05', typeKey: 'home.type.execution', descriptionKey: 'home.desc.grabTimeout' },
  { key: '6', code: 'TASK-20260227-06', typeKey: 'home.type.review', descriptionKey: 'home.desc.uploadFailed' },
];

const deviceExceptions: HomeExceptionItem[] = [
  { key: '1', code: 'DEV-20260227-01', typeKey: 'home.type.sensor', descriptionKey: 'home.desc.lidarJitter' },
  { key: '2', code: 'DEV-20260227-02', typeKey: 'home.type.power', descriptionKey: 'home.desc.lowBattery' },
  { key: '3', code: 'DEV-20260227-03', typeKey: 'home.type.communication', descriptionKey: 'home.desc.heartbeatLost' },
  { key: '4', code: 'DEV-20260227-04', typeKey: 'home.type.sensor', descriptionKey: 'home.desc.exposureAbnormal' },
  { key: '5', code: 'DEV-20260227-05', typeKey: 'home.type.driver', descriptionKey: 'home.desc.encoderLost' },
  { key: '6', code: 'DEV-20260227-06', typeKey: 'home.type.communication', descriptionKey: 'home.desc.mqttRetryExceeded' },
];

const serviceExceptions: HomeExceptionItem[] = [
  { key: '1', name: 'qc-task-service', typeKey: 'home.service.task', status: 'abnormal' },
  { key: '2', name: 'qc-device-service', typeKey: 'home.service.device', status: 'running' },
  { key: '3', name: 'qc-report-service', typeKey: 'home.service.report', status: 'abnormal' },
  { key: '4', name: 'qc-auth-service', typeKey: 'home.service.auth', status: 'running' },
  { key: '5', name: 'qc-alert-service', typeKey: 'home.service.alert', status: 'abnormal' },
  { key: '6', name: 'qc-map-service', typeKey: 'home.service.map', status: 'running' },
];

const operationStats: HomeOperationStats = {
  executingTasks: 26,
  pendingExceptions: 18,
  completionRate: '72%',
};

export function useHomeDashboard(): HomeDashboardViewModel {
  return {
    qualityTotalMetrics,
    qualityTodayMetrics,
    deviceTotalMetrics,
    deviceTodayMetrics,
    taskExceptions,
    deviceExceptions,
    serviceExceptions,
    operationStats,
  };
}
