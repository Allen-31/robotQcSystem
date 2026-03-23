export const roleQueryKeys = {
  all: ['roles'] as const,
  list: (keyword = '') => ['roles', 'list', keyword] as const,
};

export const userQueryKeys = {
  all: ['users'] as const,
  list: (params: { page: number; pageSize: number; keyword: string; role?: string; status?: string }) =>
    ['users', 'list', params.page, params.pageSize, params.keyword, params.role || '', params.status || ''] as const,
};

export const qcBusinessQueryKeys = {
  workstations: (pageNum = 1, pageSize = 200, keyword = '') => ['qcBusiness', 'workstations', pageNum, pageSize, keyword] as const,
  stationPositions: (workstationId = '', pageNum = 1, pageSize = 200) =>
    ['qcBusiness', 'stationPositions', workstationId, pageNum, pageSize] as const,
  workOrders: (params: { keyword: string; page: number; pageSize: number }) =>
    ['qcBusiness', 'workOrders', params.keyword, params.page, params.pageSize] as const,
  workOrderDetail: (id: number) => ['qcBusiness', 'workOrderDetail', id] as const,
  qualityRecords: (params: { keyword: string; onlyNg: boolean; page: number; pageSize: number }) =>
    ['qcBusiness', 'qualityRecords', params.keyword, params.onlyNg ? 'ng' : 'all', params.page, params.pageSize] as const,
  reinspections: (params: { keyword: string; page: number; pageSize: number }) =>
    ['qcBusiness', 'reinspections', params.keyword, params.page, params.pageSize] as const,
  all: ['qcBusiness'] as const,
};

export const qcConfigQueryKeys = {
  workshops: ['qcConfig', 'workshops'] as const,
  workstationConfigs: (keyword = '') => ['qcConfig', 'workstationConfigs', keyword] as const,
  stationConfigs: ['qcConfig', 'stationConfigs'] as const,
  wireHarnessTypes: ['qcConfig', 'wireHarnessTypes'] as const,
  terminalConfigs: ['qcConfig', 'terminalConfigs'] as const,
  workstationOptions: ['qcConfig', 'workstationOptions'] as const,
  stationOptions: ['qcConfig', 'stationOptions'] as const,
  all: ['qcConfig'] as const,
};

export const qualityAnalyticsQueryKeys = {
  statistics: (params: { period?: string; dimension?: string; workstationId?: string; date?: string; startDate?: string; endDate?: string }) =>
    ['qualityAnalytics', 'statistics', params.period || '', params.dimension || '', params.workstationId || '', params.date || '', params.startDate || '', params.endDate || ''] as const,
  reports: (params: { pageNum?: number; pageSize?: number; reportType?: string }) =>
    ['qualityAnalytics', 'reports', params.pageNum || 0, params.pageSize || 0, params.reportType || ''] as const,
};
