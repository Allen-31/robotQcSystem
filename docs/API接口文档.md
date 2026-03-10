# 机器人质检系统 - 后端 API 接口文档

**文档版本**: 1.1  
**生成说明**: 由前端页面反推，供后端实现参考。  
**基础路径**: `/api`（可根据实际项目调整为 `/api/v1` 等）

---

## 目录

- **一、登录页** — 登录与认证
- **二、首页** — 首页仪表盘
- **三、质检业务**
  - 3.1 业务 — 质检区管理、质检台管理、工单管理、复检记录
  - 3.2 配置 — 车间配置、质检区配置、质检台配置、线束类型、终端配置
  - 3.3 统计 — 质检统计、质检报表
  - 3.4 任务 — 任务模板
- **四、部署配置**
  - 4.1 任务 — 任务编排
  - 4.2 机器人 — 机器人列表、机器人类型、机器人部件、机器人班组、充电策略、回充策略、配置模板
  - 4.3 场景 — 地图管理
  - 4.4 系统设置
  - 4.5 用户 — 用户管理、角色管理
- **五、运营维护**
  - 5.1 运营监控
  - 5.2 任务 — 任务管理
  - 5.3 机器人 — 机器人管理
  - 5.4 通知 — 异常通知、登录日志、操作日志、API 日志
  - 5.5 文件 — 文件管理
  - 5.6 升级 — 安装包管理、发布管理
  - 5.7 服务 — 服务管理
- **六、数据统计**
  - 6.1 设备统计
  - 6.2 异常统计
- [附录：通用约定](#附录通用约定)

---

## 一、登录页

### 1.1 登录与认证

| 项目 | 说明 |
|------|------|
| **接口名称** | 用户登录 |
| **请求方式** | POST |
| **请求路径** | `/auth/login` |
| **请求体** | `{ "username": "", "password": "", "remember": true \| false }` |

**响应体**：`{ "token": "", "user": { "code": "", "displayName": "", "roles": [] } }`。失败返回 401 或 `{ "code": 401, "message": "" }`。

| 项目 | 说明 |
|------|------|
| **接口名称** | 登出 |
| **请求方式** | POST |
| **请求路径** | `/auth/logout` |

**响应体**：`{ "success": true }`。

| 项目 | 说明 |
|------|------|
| **接口名称** | 获取当前用户信息 |
| **请求方式** | GET |
| **请求路径** | `/auth/me` |

**响应体**：`{ "code": "", "displayName": "", "roles": [] }`，用于前端展示与权限判断。

---

## 二、首页

### 2.1 首页仪表盘数据

| 项目 | 说明 |
|------|------|
| **接口名称** | 获取首页仪表盘汇总数据 |
| **请求方式** | GET |
| **请求路径** | `/home/dashboard` |
| **说明** | 一次性返回首页所需全部汇总与异常列表，减少请求次数 |

**响应体示例**（JSON）：

```json
{
  "qualityTotalMetrics": [
    { "labelKey": "home.metric.qualityCount", "value": "48620", "iconKey": "DashboardOutlined" },
    { "labelKey": "home.metric.detectionRate", "value": "97.52%", "iconKey": "CheckCircleOutlined" },
    { "labelKey": "home.metric.reviewRate", "value": "91.36%", "iconKey": "RadarChartOutlined" },
    { "labelKey": "home.metric.duration", "value": "12680h", "iconKey": "ClockCircleOutlined" }
  ],
  "qualityTodayMetrics": [
    { "labelKey": "home.metric.qualityCount", "value": "1286", "iconKey": "DashboardOutlined" },
    { "labelKey": "home.metric.detectionRate", "value": "96.71%", "iconKey": "CheckCircleOutlined" },
    { "labelKey": "home.metric.reviewRate", "value": "89.28%", "iconKey": "RadarChartOutlined" },
    { "labelKey": "home.metric.duration", "value": "326h", "iconKey": "ClockCircleOutlined" }
  ],
  "deviceTotalMetrics": [
    { "labelKey": "home.metric.robotRuntime", "value": "22460h", "iconKey": "ThunderboltOutlined" },
    { "labelKey": "home.metric.robotWorktime", "value": "18920h", "iconKey": "ToolOutlined" },
    { "labelKey": "home.metric.robotFailureRate", "value": "2.14%", "iconKey": "BugOutlined" }
  ],
  "deviceTodayMetrics": [
    { "labelKey": "home.metric.robotOnline", "value": "61 / 68", "iconKey": "RobotOutlined" },
    { "labelKey": "home.metric.avgRuntime", "value": "15.8h", "iconKey": "ThunderboltOutlined" },
    { "labelKey": "home.metric.avgWorktime", "value": "12.6h", "iconKey": "ToolOutlined" },
    { "labelKey": "home.metric.stationCount", "value": "120 / 86 / 120", "iconKey": "ApiOutlined" }
  ],
  "taskExceptions": [
    { "key": "1", "code": "TASK-20260227-01", "typeKey": "home.type.dispatch", "descriptionKey": "home.desc.taskTimeout" }
  ],
  "deviceExceptions": [
    { "key": "1", "code": "DEV-20260227-01", "typeKey": "home.type.sensor", "descriptionKey": "home.desc.lidarJitter" }
  ],
  "serviceExceptions": [
    { "key": "1", "name": "qc-task-service", "typeKey": "home.service.task", "status": "abnormal" }
  ],
  "operationStats": {
    "executingTasks": 26,
    "pendingExceptions": 18,
    "completionRate": "72%"
  }
}
```

**字段说明**：
- `qualityTotalMetrics` / `qualityTodayMetrics`: 质检总览（累计/今日），每项含 `labelKey`（前端 i18n key）、`value`、`iconKey`。
- `deviceTotalMetrics` / `deviceTodayMetrics`: 设备总览（累计/今日），结构同上。
- `taskExceptions` / `deviceExceptions`: 任务异常、设备异常列表，每项含 `key`、`code`、`typeKey`、`descriptionKey`，可含 `name`。
- `serviceExceptions`: 服务异常列表，每项含 `key`、`name`、`typeKey`、`status`（running/abnormal）。
- `operationStats`: 运营概览（执行中任务数、待处理异常数、完成率）。

---

## 三、质检业务

### 3.1 业务

#### 3.1.1 质检区管理

| 项目 | 说明 |
|------|------|
| **接口名称** | 工位列表（含工位下质检台） |
| **请求方式** | GET |
| **请求路径** | `/quality/workstations` |

**响应体**：工位列表，每项含 `id`、`name`、`status`（running/maintenance/stopped）、`inspectionStationCount`、`stationList`（质检台编码数组）等。

| 项目 | 说明 |
|------|------|
| **接口名称** | 工位下质检台列表与统计 |
| **请求方式** | GET |
| **请求路径** | `/quality/workstations/{workstationId}/stations` |

**响应体**：质检台列表，每项含 `id`、`code`、`enabled`、`rank`、`inspectionCount`。

| 项目 | 说明 |
|------|------|
| **接口名称** | 切换质检台启用/停用 |
| **请求方式** | PUT |
| **请求路径** | `/quality/workstations/stations/{stationId}/enabled` |
| **请求体** | `{ "enabled": true \| false }` |

---

#### 3.1.2 质检台管理

| 项目 | 说明 |
|------|------|
| **接口名称** | 工位点位列表（含历史工单等） |
| **请求方式** | GET |
| **请求路径** | `/quality/workstation-positions` |
| **Query** | 可选 `workstationId`、`keyword` 等 |

**响应体**：点位列表，每项含点位编码、排序、启用状态、关联工单信息等。

| 项目 | 说明 |
|------|------|
| **接口名称** | 点位详情（含质检点列表） |
| **请求方式** | GET |
| **请求路径** | `/quality/workstation-positions/{positionId}` |

---

#### 3.1.3 工单管理

| 项目 | 说明 |
|------|------|
| **接口名称** | 工单分页列表 |
| **请求方式** | GET |
| **请求路径** | `/quality/work-orders` |
| **Query** | `page`、`pageSize`、`workOrderNo`、`harnessCode`、`stationCode`、`status`、`qualityResult`、`startDate`、`endDate` 等 |

**响应体**：分页结构，列表项含 `workOrderNo`、`harnessCode`、`harnessType`、`stationCode`、`status`、`qualityResult`、`taskIds`、`detectionDuration`、`movingDuration`、`createdAt`、`startedAt`、`endedAt` 等。

| 项目 | 说明 |
|------|------|
| **接口名称** | 工单详情（含质检点明细） |
| **请求方式** | GET |
| **请求路径** | `/quality/work-orders/{workOrderId}` |

**响应体**：工单主信息 + 质检点列表，每点含 `pointCode`、`status`、`robot`、`result`、`mediaType`、`duration`、`startedAt`、`endedAt` 等。

---

#### 3.1.4 复检记录

| 项目 | 说明 |
|------|------|
| **接口名称** | 复检记录分页列表 |
| **请求方式** | GET |
| **请求路径** | `/quality/reinspection-records` |
| **Query** | `page`、`pageSize`、`workOrderNo`、`stationCode`、`result`、时间范围等 |

**响应体**：分页结构，列表项含记录 ID、工单号、工位/质检台、复检结果、视频/图片资源标识、时间等。

| 项目 | 说明 |
|------|------|
| **接口名称** | 复检记录视频/图片资源 URL |
| **请求方式** | GET |
| **请求路径** | `/quality/reinspection-records/{recordId}/media` |
| **Query** | `type=video` 或 `type=image` |

**响应体**：`{ "url": "..." }` 或直接 302 重定向到可访问地址。

---

### 3.2 配置

#### 3.2.1 车间配置

| 项目 | 说明 |
|------|------|
| **接口名称** | 车间配置列表 |
| **请求方式** | GET |
| **请求路径** | `/quality/config/workshops` |

**响应体**：列表，每项含 `code`、`name` 等，供质检区等下拉选项使用。

---

#### 3.2.2 质检区配置

| 项目 | 说明 |
|------|------|
| **接口名称** | 质检区配置列表 |
| **请求方式** | GET |
| **请求路径** | `/quality/config/workstations` |
| **Query** | 可选 `keyword`、`workshopCode`、`enabled` |

**响应体**：列表，每项含 `id`、`name`、`workshopCode`、`wireHarnessType`、`robotGroup`、`enabled`。

| 项目 | 说明 |
|------|------|
| **接口名称** | 新增质检区配置 |
| **请求方式** | POST |
| **请求路径** | `/quality/config/workstations` |
| **请求体** | `{ "name": "", "workshopCode": "", "wireHarnessType": "", "robotGroup": "", "enabled": true }` |

| 项目 | 说明 |
|------|------|
| **接口名称** | 更新质检区配置 |
| **请求方式** | PUT |
| **请求路径** | `/quality/config/workstations/{id}` |
| **请求体** | 同新增字段（部分可省略） |

| 项目 | 说明 |
|------|------|
| **接口名称** | 删除质检区配置 |
| **请求方式** | DELETE |
| **请求路径** | `/quality/config/workstations/{id}` |

| 项目 | 说明 |
|------|------|
| **接口名称** | 启用/停用质检区配置 |
| **请求方式** | PUT |
| **请求路径** | `/quality/config/workstations/{id}/enabled` |
| **请求体** | `{ "enabled": true \| false }` |

---

#### 3.2.3 质检台配置

| 项目 | 说明 |
|------|------|
| **接口名称** | 质检台配置列表 |
| **请求方式** | GET |
| **请求路径** | `/quality/config/stations` |
| **Query** | 可选 `workstationId`、`keyword`、`enabled` |

**响应体**：列表，每项含 `workstationId`、`stationId`、`mapPoint`、`detectionEnabled`、`enabled`。

| 项目 | 说明 |
|------|------|
| **接口名称** | 新增/更新/删除质检台配置 |
| **请求方式** | POST / PUT / DELETE |
| **请求路径** | `/quality/config/stations`、`/quality/config/stations/{workstationId}/{stationId}` |

---

#### 3.2.4 线束类型

| 项目 | 说明 |
|------|------|
| **接口名称** | 线束类型配置列表 |
| **请求方式** | GET |
| **请求路径** | `/quality/config/wire-harness-types` |

**响应体**：列表，每项含 `id`、`name`、`taskType`、`planarStructureFile`、`threeDStructureFile`。

| 项目 | 说明 |
|------|------|
| **接口名称** | 新增/更新/删除线束类型 |
| **请求方式** | POST / PUT / DELETE |
| **请求路径** | `/quality/config/wire-harness-types`、`/quality/config/wire-harness-types/{id}` |

---

#### 3.2.5 终端配置

| 项目 | 说明 |
|------|------|
| **接口名称** | 终端配置列表 |
| **请求方式** | GET |
| **请求路径** | `/quality/config/terminals` |
| **Query** | 可选 `workstationId`、`terminalType`、`online` |

**响应体**：列表，每项含 `id`、`sn`、`terminalType`、`terminalIp`、`workstationId`、`boundStationIds`、`online`、`currentUser`。

| 项目 | 说明 |
|------|------|
| **接口名称** | 新增/更新/删除终端配置 |
| **请求方式** | POST / PUT / DELETE |
| **请求路径** | `/quality/config/terminals`、`/quality/config/terminals/{id}` |

---

### 3.3 统计

#### 3.3.1 质检统计

| 项目 | 说明 |
|------|------|
| **接口名称** | 质检统计数据（汇总 + 维度对比 + 趋势 + 异常） |
| **请求方式** | POST |
| **请求路径** | `/quality/statistics/analytics` |
| **请求体** | 参考 `QualityAnalyticsQuery`（见前端 shared/api/qualityAnalyticsApi.ts） |

```json
{
  "period": "day | week | month | custom",
  "startDate": "yyyy-MM-dd",
  "endDate": "yyyy-MM-dd",
  "dimension": "factory | workshop | workstation | station | inspector | wireHarness",
  "workshopIds": [],
  "workstationIds": [],
  "stationIds": [],
  "inspectorIds": [],
  "wireHarnessIds": []
}
```

**响应体**：`QualityStatisticsResponse`  
- `summary`: QualityKpiSummary（inspectionCount、defectCount、reinspectionCount、detectionRate、reinspectionRate、avgDurationMin）  
- `compare`: QualityDimensionItem[]  
- `trend`: QualityTrendItem[]  
- `anomalies`: QualityAnomalyItem[]

---

#### 3.3.2 质检报表

| 项目 | 说明 |
|------|------|
| **接口名称** | 生成质检报告 |
| **请求方式** | POST |
| **请求路径** | `/quality/reports/generate` |
| **请求体** | `QualityReportGenerateCommand`：`reportType`（daily/weekly/monthly/custom）、`periodLabel`、`query`（同 2.10） |

**响应体**：`{ "reportId": "", "reportNo": "", "status": "generated" \| "failed" }`

| 项目 | 说明 |
|------|------|
| **接口名称** | 报告列表 |
| **请求方式** | GET |
| **请求路径** | `/quality/reports` |
| **Query** | `page`、`pageSize`、`reportType`、`dimension`、时间范围 |

**响应体**：分页，列表项为 `QualityReportRecord`（id、reportNo、reportType、periodLabel、dimension、creator、createdAt、status）。

| 项目 | 说明 |
|------|------|
| **接口名称** | 报告详情（含汇总与明细） |
| **请求方式** | GET |
| **请求路径** | `/quality/reports/{reportId}` |

**响应体**：`QualityReportDetailResponse`（record、summary、detailRows、anomalies）。

| 项目 | 说明 |
|------|------|
| **接口名称** | 报告导出（PDF） |
| **请求方式** | GET |
| **请求路径** | `/quality/reports/{reportId}/export` |
| **Query** | `format=pdf` |

**响应**：文件流，Content-Type: application/pdf。

---

### 3.4 任务

#### 3.4.1 任务模板

任务模板相关接口（创建/编辑/引用任务模板）可根据实际业务在后端扩展，当前前端为占位页，暂无独立接口约定。

---

## 四、部署配置

### 4.1 任务

#### 4.1.1 任务编排

任务编排页面相关接口可根据实际业务扩展，当前前端为占位页，暂无独立接口约定。

---

### 4.2 机器人

#### 4.2.1 机器人列表（配置模板）

参见下文「4.2.7 配置模板」。

#### 4.2.2 机器人类型

| 项目 | 说明 |
|------|------|
| **接口名称** | 机器人类型列表 |
| **请求方式** | GET |
| **请求路径** | `/deploy/robot-types` |
| **Query** | 可选 `keyword` |

**响应体**：列表，每项含 `id`、`typeNo`、`typeName`、`image2d`、`partsCount`、`createdAt`。

| 项目 | 说明 |
|------|------|
| **接口名称** | 新增 / 更新 / 删除机器人类型、类型详情 |
| **请求方式** | POST / PUT / DELETE / GET |
| **请求路径** | `/deploy/robot-types`、`/deploy/robot-types/{id}` |

#### 4.2.3 机器人部件

| 项目 | 说明 |
|------|------|
| **接口名称** | 机器人部件列表、新增/更新/删除 |
| **请求方式** | GET / POST / PUT / DELETE |
| **请求路径** | `/deploy/robot-parts`、`/deploy/robot-parts/{id}` |

**响应体（列表）**：每项含 `id`、`partNo`、`name`、`type`、`model`、`vendor`、`position`、`supplier`、`lifecycle` 等。

#### 4.2.4 机器人班组

| 项目 | 说明 |
|------|------|
| **接口名称** | 机器人班组列表、新增/更新/删除 |
| **请求方式** | GET / POST / PUT / DELETE |
| **请求路径** | `/deploy/robot-groups`、`/deploy/robot-groups/{id}` |
| **请求体（新增/更新）** | `{ "groupName": "", "description": "" }`，编号可由后端生成。 |

**响应体（列表）**：每项含 `id`、`groupNo`、`groupName`、`description`、`createdAt`。

#### 4.2.5 充电策略

| 项目 | 说明 |
|------|------|
| **接口名称** | 充电策略列表、新增/更新/删除、启用/停用 |
| **请求方式** | GET / POST / PUT / DELETE / PUT |
| **请求路径** | `/deploy/charge-strategies`、`/deploy/charge-strategies/{code}`、`/deploy/charge-strategies/{code}/status` |

**响应体（列表）**：每项含 `code`、`name`、`status`、`robotType`、`robotGroup`、`robot`、`triggerRule`（lowBatteryThreshold、minChargeMinutes、chargeMethod）。

#### 4.2.6 回充策略

| 项目 | 说明 |
|------|------|
| **接口名称** | 回充策略列表、新增/更新/删除、启用/停用 |
| **请求方式** | GET / POST / PUT / DELETE / PUT |
| **请求路径** | `/deploy/homing-strategies`、`/deploy/homing-strategies/{code}`、`/deploy/homing-strategies/{code}/status` |

**响应体（列表）**：每项含 `code`、`name`、`status`、`robotType`、`robotGroup`、`robot`、`triggerRule`（idleWaitSeconds）。

#### 4.2.7 配置模板（机器人列表）

| 项目 | 说明 |
|------|------|
| **接口名称** | 机器人配置列表、配置参数分类树、单台详情、更新配置、应用模板、模板快照、导入/导出 |
| **请求方式** | GET / PUT / POST 等 |
| **请求路径** | `/deploy/robot-configs`、`/deploy/robot-configs/category-tree`、`/deploy/robot-configs/{id}`、`/deploy/robot-configs/{id}/apply-template`、`/deploy/config-templates`、`/deploy/robot-configs/import`、`/deploy/robot-configs/export` |

详见前文「十八、部署配置 - 配置模板」的完整接口说明（已合并到本节）。

---

### 4.3 场景

#### 4.3.1 地图管理

| 项目 | 说明 |
|------|------|
| **接口名称** | 地图列表、新增/更新/删除、导出/导入、获取/保存场景数据 |
| **请求方式** | GET / POST / PUT / DELETE |
| **请求路径** | `/deploy/maps`、`/deploy/maps/{code}`、`/deploy/maps/export`、`/deploy/maps/import`、`/deploy/maps/{mapCode}/scene` |

**响应体（列表）**：每项含 `code`、`name`、`type`、`editStatus`、`publishStatus`、`editedAt`、`editedBy`、`publishedAt`、`publishedBy`。场景数据为 `scene`（nodes、edges、areas）。

---

### 4.4 系统设置

| 项目 | 说明 |
|------|------|
| **接口名称** | 许可证上传、语言配置列表/更新、主题配置（可选） |
| **请求方式** | POST / GET / PUT |
| **请求路径** | `/setting/license/upload`、`/setting/languages`、`/setting/languages/{id}`、`/setting/theme` |

---

### 4.5 用户

#### 4.5.1 用户管理

| 项目 | 说明 |
|------|------|
| **接口名称** | 用户分页/列表 |
| **请求方式** | GET |
| **请求路径** | `/deploy/users` |
| **Query** | `page`、`pageSize`、`keyword`（编码/姓名/手机/邮箱/角色）、`role`、`status` |

**响应体**：分页，列表项含 `code`、`name`、`phone`、`email`、`status`（enabled/disabled）、`lastLoginAt`、`roles`（角色名称数组）。注意：不返回密码。

| 项目 | 说明 |
|------|------|
| **接口名称** | 新增用户 |
| **请求方式** | POST |
| **请求路径** | `/deploy/users` |
| **请求体** | `{ "code": "", "name": "", "phone": "", "email": "", "status": "enabled", "roles": ["角色名"], "password": "" }` |

| 项目 | 说明 |
|------|------|
| **接口名称** | 更新用户 |
| **请求方式** | PUT |
| **请求路径** | `/deploy/users/{code}` |
| **请求体** | `{ "name": "", "phone": "", "email": "", "status": "", "roles": [] }`（不含 password） |

| 项目 | 说明 |
|------|------|
| **接口名称** | 删除用户 |
| **请求方式** | DELETE |
| **请求路径** | `/deploy/users/{code}` |

| 项目 | 说明 |
|------|------|
| **接口名称** | 更新用户角色 |
| **请求方式** | PUT |
| **请求路径** | `/deploy/users/{code}/roles` |
| **请求体** | `{ "roles": ["角色名1", "角色名2"] }` |

| 项目 | 说明 |
|------|------|
| **接口名称** | 修改密码 |
| **请求方式** | PUT |
| **请求路径** | `/deploy/users/{code}/password` |
| **请求体** | `{ "oldPassword": "", "newPassword": "" }` |

**响应体**：成功 `{ "success": true }`；失败 `{ "success": false, "error": "old_password_invalid" }`。

| 项目 | 说明 |
|------|------|
| **接口名称** | 用户导出（CSV） |
| **请求方式** | GET |
| **请求路径** | `/deploy/users/export` |
| **Query** | 同列表筛选 |

**响应**：文件流，Content-Type: text/csv。

| 项目 | 说明 |
|------|------|
| **接口名称** | 用户批量导入（CSV） |
| **请求方式** | POST |
| **请求路径** | `/deploy/users/import` |
| **Content-Type** | multipart/form-data，字段名 `file` |

**响应体**：`{ "success": true, "imported": 10, "failed": 0, "errors": [] }`。

---

#### 4.5.2 角色管理

| 项目 | 说明 |
|------|------|
| **接口名称** | 角色列表 |
| **请求方式** | GET |
| **请求路径** | `/deploy/roles` |
| **Query** | 可选 `keyword`（编码/名称/描述） |

**响应体**：列表，每项含 `code`、`name`、`description`、`memberCount`、`updatedAt`。

| 项目 | 说明 |
|------|------|
| **接口名称** | 新增角色 |
| **请求方式** | POST |
| **请求路径** | `/deploy/roles` |
| **请求体** | `{ "code": "", "name": "", "description": "", "memberCount": 0 }` |

**响应体**：成功 `{ "success": true }`；编码/名称重复 `{ "success": false, "error": "duplicate" }`。

| 项目 | 说明 |
|------|------|
| **接口名称** | 更新角色 |
| **请求方式** | PUT |
| **请求路径** | `/deploy/roles/{code}` |
| **请求体** | `{ "name": "", "description": "", "memberCount": 0 }` |

| 项目 | 说明 |
|------|------|
| **接口名称** | 删除角色 |
| **请求方式** | DELETE |
| **请求路径** | `/deploy/roles/{code}` |

**响应体**：成功 `{ "success": true }`；不存在 `{ "success": false, "error": "not_found" }`；最后一个角色禁止删 `{ "success": false, "error": "last_role" }`。

| 项目 | 说明 |
|------|------|
| **接口名称** | 获取角色权限配置 |
| **请求方式** | GET |
| **请求路径** | `/deploy/roles/{code}/permissions` |

**响应体**：树形或扁平权限列表，每项含菜单/功能 key 及勾选动作（如 display、create、edit、delete、view 等），结构需与前端 `menuList` + `PermissionAction` 对应。

| 项目 | 说明 |
|------|------|
| **接口名称** | 保存角色权限配置 |
| **请求方式** | PUT |
| **请求路径** | `/deploy/roles/{code}/permissions` |
| **请求体** | `{ "permissions": [ { "menuKey": "", "actions": ["display", "create", "edit", ...] } ] }` 或等价结构 |

---

## 五、运营维护

### 5.1 运营监控

| 项目 | 说明 |
|------|------|
| **接口名称** | 可选地图列表、监控机器人实时列表 |
| **请求方式** | GET |
| **请求路径** | `/operation/monitoring/maps`、`/operation/monitoring/robots` |
| **Query（robots）** | 可选 `mapCode`、`keyword`、`filter`（all/unconnected/offline/abnormal/lowBattery） |

**响应体（robots）**：每项含 `id`、`code`、`link`、`work`、`exception`、`locate`、`control`、`battery`、`x`、`y`、`angle`、`speed`、`ip`、`point`、`task`、`alarms`。

---

### 5.2 任务

#### 5.2.1 任务管理

| 项目 | 说明 |
|------|------|
| **接口名称** | 任务列表、任务详情、创建任务、暂停/恢复/停止、导出 CSV |
| **请求方式** | GET / POST |
| **请求路径** | `/operation/tasks`、`/operation/tasks/{taskId}`、`/operation/tasks`（POST）、`/operation/tasks/{taskId}/pause`、`/resume`、`/stop`、`/operation/tasks/export` |

---

### 5.3 机器人

#### 5.3.1 机器人管理

| 项目 | 说明 |
|------|------|
| **接口名称** | 机器人列表、机器人详情、调度模式/控制状态/地图切换、底盘/机械臂模式、充电/回充/举升控制、运行日志单条 |
| **请求方式** | GET / PUT / POST |
| **请求路径** | `/operation/robots`、`/operation/robots/{robotId}`、`/operation/robots/{robotId}/dispatch-mode`、`/control-status`、`/current-map`、`/chassis-mode`、`/arm-mode`、`/charge`、`/homing`、`/lift`、`/operation/robots/{robotId}/runtime-logs/{logId}` |

---

### 5.4 通知

#### 5.4.1 异常通知

| 项目 | 说明 |
|------|------|
| **接口名称** | 异常通知列表、导出 CSV |
| **请求方式** | GET |
| **请求路径** | `/operation/exception-notifications`、`/operation/exception-notifications/export` |

#### 5.4.2 登录日志

| 项目 | 说明 |
|------|------|
| **接口名称** | 登录日志列表、导出 CSV |
| **请求方式** | GET |
| **请求路径** | `/operation/logs/login`、`/operation/logs/login/export` |

#### 5.4.3 操作日志

| 项目 | 说明 |
|------|------|
| **接口名称** | 操作日志列表、导出 CSV |
| **请求方式** | GET |
| **请求路径** | `/operation/logs/operation`、`/operation/logs/operation/export` |

#### 5.4.4 API 日志

| 项目 | 说明 |
|------|------|
| **接口名称** | API 日志列表、导出 CSV |
| **请求方式** | GET |
| **请求路径** | `/operation/logs/api`、`/operation/logs/api/export` |

---

### 5.5 文件

#### 5.5.1 文件管理

| 项目 | 说明 |
|------|------|
| **接口名称** | 文件列表 |
| **请求方式** | GET |
| **请求路径** | `/operation/files` |
| **Query** | `keyword`（名称/类型/标签/创建时间）、`page`、`pageSize`、`tags` |

**响应体**：分页，列表项含 `id`、`name`、`type`、`size`、`tags`、`createdAt`；可选 `previewUrl` 或 `previewContent`（文本类预览）。

| 项目 | 说明 |
|------|------|
| **接口名称** | 文件预览 URL 或内容 |
| **请求方式** | GET |
| **请求路径** | `/operation/files/{id}/preview` |

**响应体**：`{ "url": "" }` 或 `{ "content": "" }`（纯文本日志等）。

| 项目 | 说明 |
|------|------|
| **接口名称** | 文件下载（单或批量打包） |
| **请求方式** | GET |
| **请求路径** | `/operation/files/download` |
| **Query** | `ids=id1,id2` 或单文件 `/operation/files/{id}/download` |

**响应**：文件流或 ZIP 包。

| 项目 | 说明 |
|------|------|
| **接口名称** | 文件上传 |
| **请求方式** | POST |
| **请求路径** | `/operation/files/upload` |
| **Content-Type** | multipart/form-data，字段 `file`，可选 `tags` |

**响应体**：`{ "id": "", "name": "", "size": "", "createdAt": "" }`。

---

### 5.6 升级

#### 5.6.1 安装包管理

| 项目 | 说明 |
|------|------|
| **接口名称** | 安装包列表 |
| **请求方式** | GET |
| **请求路径** | `/operation/packages` |
| **Query** | `type=cloud|robot`、`keyword`、`page`、`pageSize` |

**响应体**：分页，列表项含 `id`、`name`、`type`（cloud/robot）、`targetParts`（`{ part, version }[]`）、`description`、`size`、`md5`、`uploader`、`uploadedAt`。

| 项目 | 说明 |
|------|------|
| **接口名称** | 上传安装包 |
| **请求方式** | POST |
| **请求路径** | `/operation/packages/upload` |
| **Content-Type** | multipart/form-data，字段 `file`，可选 `type`、`description` |

**响应体**：解析后的安装包信息（含 targetParts、md5 等）。

| 项目 | 说明 |
|------|------|
| **接口名称** | 更新安装包信息 |
| **请求方式** | PUT |
| **请求路径** | `/operation/packages/{id}` |
| **请求体** | `{ "description": "", "targetParts": [] }` |

| 项目 | 说明 |
|------|------|
| **接口名称** | 删除安装包 |
| **请求方式** | DELETE |
| **请求路径** | `/operation/packages/{id}` |

| 项目 | 说明 |
|------|------|
| **接口名称** | 安装包下载 |
| **请求方式** | GET |
| **请求路径** | `/operation/packages/{id}/download` |

**响应**：文件流。

---

#### 5.6.2 发布管理

| 项目 | 说明 |
|------|------|
| **接口名称** | 发布任务列表 |
| **请求方式** | GET |
| **请求路径** | `/operation/publishes` |
| **Query** | `keyword`、`status`（pending/running/completed/cancelled）、`page`、`pageSize` |

**响应体**：分页，列表项为 `PublishManageRecord`：`id`、`name`、`packageName`、`targetRobots`、`targetRobotGroups`、`targetRobotTypes`、`strategy`（immediate/idle/homing）、`restartAfterUpgrade`、`status`、`creator`、`createdAt`、`completedAt`、`devices`（DeviceUpgradeRecord[]：id、deviceName、ip、status、packageName、version、updatedAt、completedAt）。

| 项目 | 说明 |
|------|------|
| **接口名称** | 可升级设备目录（用于创建发布时选择目标） |
| **请求方式** | GET |
| **请求路径** | `/operation/upgrade/devices` |

**响应体**：列表，每项含 `id`、`deviceName`、`ip`、`robot`、`robotGroup`、`robotType`、`currentVersion`。

| 项目 | 说明 |
|------|------|
| **接口名称** | 创建发布任务 |
| **请求方式** | POST |
| **请求路径** | `/operation/publishes` |
| **请求体** | `{ "name": "", "packageName": "", "targetRobots": [], "targetRobotGroups": [], "targetRobotTypes": [], "strategy": "immediate|idle|homing", "restartAfterUpgrade": true }` |

**响应体**：`{ "id": "", "status": "pending", "devices": [] }`。

| 项目 | 说明 |
|------|------|
| **接口名称** | 取消发布任务 |
| **请求方式** | PUT |
| **请求路径** | `/operation/publishes/{id}/cancel` |

| 项目 | 说明 |
|------|------|
| **接口名称** | 发布任务详情 |
| **请求方式** | GET |
| **请求路径** | `/operation/publishes/{id}` |

**响应体**：完整 `PublishManageRecord`（含 devices 最新状态）。

---

### 5.7 服务

#### 5.7.1 服务管理

| 项目 | 说明 |
|------|------|
| **接口名称** | 服务列表 |
| **请求方式** | GET |
| **请求路径** | `/operation/services` |
| **Query** | `keyword`（名称/类型/版本/IP/状态）、`status` |

**响应体**：列表，每项含 `id`、`name`、`type`、`version`、`ip`、`status`（running/stopped/degraded）、`cpuUsage`、`memoryUsage`、`runtime`、`logs`（ServiceLogRecord[]：id、logName、type、createdAt、updatedAt、content 或仅元数据）。

| 项目 | 说明 |
|------|------|
| **接口名称** | 服务启停/重启 |
| **请求方式** | POST |
| **请求路径** | `/operation/services/{id}/start`、`/operation/services/{id}/stop`、`/operation/services/{id}/restart` |

**响应体**：`{ "success": true }` 或错误信息。

| 项目 | 说明 |
|------|------|
| **接口名称** | 服务历史日志列表 |
| **请求方式** | GET |
| **请求路径** | `/operation/services/{id}/logs` |

**响应体**：`ServiceLogRecord[]`（id、logName、type、createdAt、updatedAt，可不带 content）。

| 项目 | 说明 |
|------|------|
| **接口名称** | 单条日志内容（预览/下载） |
| **请求方式** | GET |
| **请求路径** | `/operation/services/{id}/logs/{logId}` |
| **Query** | `download=1` 时返回附件下载 |

**响应体**：预览时 `{ "content": "" }`；下载时文件流。

---

## 六、数据统计

### 6.1 设备统计

| 项目 | 说明 |
|------|------|
| **接口名称** | 设备统计筛选维度选项 |
| **请求方式** | GET |
| **请求路径** | `/data/device-statistics/options` |

**响应体**：`{ "workshops": [], "workstations": [], "stations": [], "robotTypes": [], "robotGroups": [] }`，供前端下拉与筛选使用。

| 项目 | 说明 |
|------|------|
| **接口名称** | 设备统计列表与汇总 |
| **请求方式** | POST 或 GET（推荐 POST 以支持复杂筛选） |
| **请求路径** | `/data/device-statistics/query` |
| **请求体** | `{ "period": "day1|day7|month1", "workshop": "", "workstation": "", "station": "", "robotType": "", "robotGroup": "", "onlineStatus": "all|online|offline", "exceptionStatus": "all|exception|normal", "keyword": "", "page": 1, "pageSize": 20 }` |

**响应体**：

```json
{
  "list": [
    {
      "id": "", "type": "", "group": "", "workshop": "", "workstation": "", "station": "",
      "online": true, "battery": 85, "runtimeHourToday": 6.2, "tasksToday": 12,
      "currentTask": "", "lastHeartbeat": "", "exceptionLevel": "none|low|medium|high", "exceptionCount": 0
    }
  ],
  "total": 100,
  "summary": {
    "total": 36, "onlineCount": 30, "onlineRate": 83.3, "exceptionDeviceCount": 16,
    "avgBattery": 58.5, "runtime": 185.4, "tasks": 414, "taskCompleteRate": 95
  },
  "onlineTrend": { "categories": ["2026-02-27", "..."], "values": [28, 30, ...] },
  "typeDistribution": [ { "name": "AMR", "value": 12 }, ... ],
  "levelDistribution": [ { "name": "none", "value": 20 }, ... ],
  "batteryDistribution": [ { "name": "0-20%", "value": 2 }, ... ]
}
```

| 项目 | 说明 |
|------|------|
| **接口名称** | 设备详情（含近期异常与任务） |
| **请求方式** | GET |
| **请求路径** | `/data/device-statistics/devices/{deviceId}/detail` |

**响应体**：设备基础信息 + `recentExceptions`（id、level、type、time）、`recentTasks`（id、status、createdAt）。

| 项目 | 说明 |
|------|------|
| **接口名称** | 设备统计导出 CSV |
| **请求方式** | GET |
| **请求路径** | `/data/device-statistics/export` |
| **Query** | 与 query 相同筛选参数 |

**响应**：CSV 文件流。

---

### 6.2 异常统计

| 项目 | 说明 |
|------|------|
| **接口名称** | 异常统计筛选维度选项 |
| **请求方式** | GET |
| **请求路径** | `/data/exception-statistics/options` |

**响应体**：`levelList`、`typeList`、`sourceList`、`workshopList`、`workstationList`、`stationList`、机器人列表等。

| 项目 | 说明 |
|------|------|
| **接口名称** | 异常统计列表与汇总 |
| **请求方式** | POST 或 GET |
| **请求路径** | `/data/exception-statistics/query` |
| **请求体** | `{ "period": "day1|day7|month1", "level": "", "type": "", "status": "", "source": "", "workshop": "", "workstation": "", "station": "", "robot": "", "keyword": "", "page": 1, "pageSize": 20 }` |

**响应体**：

```json
{
  "list": [
    {
      "id": "", "level": "P1|P2|P3", "type": "", "source": "", "workshop": "", "workstation": "", "station": "", "robot": "",
      "status": "pending|processing|closed", "createdAt": "", "firstResponseAt": "", "closedAt": "",
      "owner": "", "relatedTask": "", "description": "", "responseMinutes": 0, "closeMinutes": 0
    }
  ],
  "total": 72,
  "summary": {
    "total": 72, "pendingCount": 24, "processingCount": 24, "closedCount": 24,
    "closeRate": 33.3, "avgResponse": 18.5, "avgClose": 95.2, "highLevel": 24, "overdueResponse": 8
  },
  "trend": { "categories": ["2026-02-27", "..."], "values": [3, 5, ...] },
  "levelDistribution": [ { "name": "P1", "value": 24 }, ... ],
  "typeTop": [ { "name": "路径规划异常", "value": 18 }, ... ],
  "sourceDistribution": [ ... ],
  "recurrenceTop": [ { "name": "RB-001", "value": 5 }, ... ]
}
```

| 项目 | 说明 |
|------|------|
| **接口名称** | 异常详情 |
| **请求方式** | GET |
| **请求路径** | `/data/exception-statistics/exceptions/{id}` |

**响应体**：单条 `ExceptionRecord` 完整字段。

| 项目 | 说明 |
|------|------|
| **接口名称** | 异常统计导出 CSV |
| **请求方式** | GET |
| **请求路径** | `/data/exception-statistics/export` |
| **Query** | 与 query 相同筛选参数 |

**响应**：CSV 文件流。

---

## 附录：通用约定

1. **认证**：除登录、公开文档外，请求头需携带 `Authorization: Bearer <token>` 或项目约定方式。
2. **统一响应包装**（可选）：  
   - 成功：`{ "code": 0, "data": { ... } }`  
   - 失败：`{ "code": 非0, "message": "" }`
3. **分页**：列表接口统一使用 `page`（从 1 开始）、`pageSize`，响应含 `list`/`items` 与 `total`。
4. **时间格式**：统一 `yyyy-MM-dd HH:mm:ss`；仅日期时 `yyyy-MM-dd`。
5. **前端 i18n**：接口返回的 `labelKey`、`typeKey`、`descriptionKey` 等为前端多语言 key，后端无需翻译，保持与前端 messages 一致即可。

以上接口根据当前前端页面与数据结构反推，实际实现时可按业务微调路径与字段命名，并与前端对齐。
