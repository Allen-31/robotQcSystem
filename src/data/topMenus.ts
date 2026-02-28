export interface TopMenuItem {
  key: string;
  name: string;
  basePath: string;
}

export const topMenus: TopMenuItem[] = [
  { key: 'home', name: 'menu.home', basePath: '/' },
  { key: 'qualityInspection', name: 'menu.qualityInspection', basePath: '/qualityInspection' },
  { key: 'deployConfig', name: 'menu.deployConfig', basePath: '/deployConfig' },
  { key: 'operationMonitoring', name: 'menu.operationMonitoring', basePath: '/operationMonitoring' },
  { key: 'operationMaintenance', name: 'menu.operationMaintenance', basePath: '/operationMaintenance' },
  { key: 'dataStatistics', name: 'menu.dataStatistics', basePath: '/dataStatistics' },
];
