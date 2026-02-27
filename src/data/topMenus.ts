export interface TopMenuItem {
  key: string;
  name: string;
  basePath: string;
}

export const topMenus: TopMenuItem[] = [
  { key: 'home', name: '首页', basePath: '/' },
  { key: 'qualityInspection', name: '质检业务', basePath: '/qualityInspection' },
  { key: 'deployConfig', name: '部署配置', basePath: '/deployConfig' },
  { key: 'operationMonitoring', name: '运行监控', basePath: '/operationMonitoring' },
  { key: 'operationMaintenance', name: '运营维护', basePath: '/operationMaintenance' },
  { key: 'dataStatistics', name: '数据统计', basePath: '/dataStatistics' },
];
