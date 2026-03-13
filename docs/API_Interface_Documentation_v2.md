# 机器人管理后台 API 接口文档 (V3.0 全量版)

## 1. 全局规范 (Global Standards)

### 1.1 接口基础
- **根路径 (Base URL)**: `/api/v1`
- **通信协议**: HTTP/1.1 (推荐 HTTPS)
- **内容类型 (Content-Type)**:
  - 默认: `application/json; charset=utf-8`
  - 文件上传: `multipart/form-data`
  - 文件下载: `application/octet-stream` 或 `application/zip`
- **字符编码**: UTF-8
- **时间格式**: 所有时间字段推荐使用 ISO 8601 格式 (e.g., `2023-10-27T10:00:00Z`) 或 `yyyy-MM-dd HH:mm:ss` 字符串。

### 1.2 认证鉴权
- **机制**: Bearer Token (JWT)
- **请求头**: `Authorization: Bearer <your_access_token>`
- **Token 过期处理**: 前端收到 `401 Unauthorized` 时，应尝试使用 Refresh Token 刷新或跳转登录页。

### 1.3 统一响应结构
所有 RESTful 接口（文件下载等特殊接口除外）均返回以下统一的 JSON 结构：

```json
{
  "code": 200,          // 业务状态码：200-成功, 其他-失败
  "msg": "success",     // 结果描述：成功时为 "success"，失败时为错误详情
  "data": { ... },      // 业务数据：对象或数组，无数据时为 null
  "timestamp": 1672531200, // 服务器时间戳
  "traceId": "abc-123"     // (可选) 链路追踪ID，用于排查问题
}
```

### 1.4 分页参数标准
**请求参数 (Query)**:
- `current`: 页码，默认 1
- `pageSize`: 每页条数，默认 10
- `sortField`: (可选) 排序字段
- `sortOrder`: (可选) `ascend` | `descend`

**分页响应结构 (`data` 部分)**:
```json
{
  "list": [],
  "total": 100,
  "current": 1,
  "pageSize": 10
}
```

---

## 2. 通用模块 (Auth)

### 2.1 用户登录
- **URL**: `POST /auth/login`
- **描述**: 系统用户登录，获取访问令牌。
- **请求体**:
  ```json
  {
    "username": "admin",
    "password": "hashed_pw",
    "remember": true
  }
  ```
- **响应 (`data` 部分)**:
  ```json
  {
    "accessToken": "eyJhbG...",
    "refreshToken": "...",
    "expiresIn": 3600,
    "user": {
      "id": "u1",
      "username": "admin",
      "displayName": "管理员",
      "roles": ["admin"]
    }
  }
  ```

### 2.2 获取当前用户信息
- **URL**: `GET /auth/me`
- **描述**: 根据 Token 获取当前登录用户的详细信息及权限。

### 2.3 退出登录
- **URL**: `POST /auth/logout`
- **描述**: 服务端注销当前 Token。

---

## 3. 部署配置 (Deploy)

### 3.1 机器人分组管理
*对应前端页面：`RobotGroupPage.tsx`*

#### 3.1.1 获取分组列表
- **URL**: `GET /robot-groups`
- **Query 参数**: `current`, `pageSize`, `keyword`
- **响应 (`data` 部分)**:
  ```json
  {
    "list": [
      {
        "id": "group-1",
        "groupNo": "RG-001",
        "groupName": "巡检A组",
        "description": "主产线",
        "createdAt": "2026-02-21 10:00"
      }
    ],
    "total": 1,
    "current": 1,
    "pageSize": 10
  }
  ```

#### 3.1.2 创建分组
- **URL**: `POST /robot-groups`
- **请求体**: `{ "groupName": "新分组", "description": "描述" }`

#### 3.1.3 更新分组
- **URL**: `PUT /robot-groups/{id}`

#### 3.1.4 删除分组
- **URL**: `DELETE /robot-groups/{id}`

### 3.2 机器人实例配置管理
*对应前端页面：`ConfigTemplatePage.tsx`*

#### 3.2.1 获取机器人列表 (配置侧)
- **URL**: `GET /deploy/robots`
- **Query 参数**: `current`, `pageSize`, `keyword`, `group`
- **响应 (`data` 部分)**:
  ```json
  {
    "list": [
      {
        "id": "rc-1",
        "code": "RC-001",
        "serialNo": "RB-001",
        "ip": "192.168.10.21",
        "robotType": "巡检机器人",
        "group": "A组",
        "currentTemplateId": "tpl-1"
      }
    ],
    "total": 10
  }
  ```

#### 3.2.2 更新机器人基础信息
- **URL**: `PUT /deploy/robots/{id}`

#### 3.2.3 获取配置详情
- **URL**: `GET /deploy/robots/{id}/configuration`

#### 3.2.4 应用配置模板
- **URL**: `PUT /deploy/robots/{id}/configuration`

### 3.3 配置模板管理

#### 3.3.1 获取模板快照
- **URL**: `GET /config-templates/snapshots`
- **响应**: 返回模板列表用于下拉选择。

---

## 4. 运维管理 (Operations)

### 4.1 任务管理

#### 4.1.1 任务列表
- **URL**: `GET /operation/tasks`
- **Query**: `page`, `pageSize`, `status`, `robot`

### 4.2 机器人管理 (Robot)

#### 4.2.1 获取机器人列表 (运维)
- **URL**: `GET /operation/robots`
- **描述**: 获取运维视角的机器人实时状态列表。
- **Query 参数**:
  - `current`, `pageSize`
  - `onlineStatus`: `online` | `offline`
  - `exceptionStatus`: `normal` | `warning` | `error`
  - `keyword`: 搜索编码/IP
- **响应 (`data` 部分)**:
  > **注意**: 此接口不再返回 `runtimeLogs` 字段，请使用 4.3.5 接口获取日志。
  ```json
  {
    "list": [
      {
        "id": "RB-001",
        "code": "RB-A101",
        "onlineStatus": "online",
        "location": "总装一线 / 工位 A-03",
        "battery": 82,
        "mileageKm": 1250.6,
        "currentMap": "总装一线地图",
        "dispatchMode": "auto",
        "controlStatus": "running",
        "exceptionStatus": "normal",
        "type": "巡检机器人标准型",
        "group": "总装一线",
        "ip": "10.10.3.101",
        "videoUrl": "rtsp://10.10.3.101/live/main",
        "exceptionLogs": ["2026-03-04 09:10:24 电机温升告警已恢复"]
      }
    ],
    "total": 1,
    "current": 1,
    "pageSize": 20
  }
  ```

#### 4.2.2 机器人控制 (复位/暂停/恢复)
- **URL**: `/api/operation/robots/{id}/control`
- **Method**: `POST`
- **Body**: `{ "command": "reset" | "pause" | "resume" }`

### 4.3 通知与日志 (Notifications & Logs)

#### 4.3.1 异常通知列表
- **URL**: `GET /operation/exception-notifications`

#### 4.3.2 登录日志列表
- **URL**: `GET /operation/logs/login`

#### 4.3.3 操作日志列表
- **URL**: `GET /operation/logs/operation`

#### 4.3.4 API 日志列表
- **URL**: `GET /operation/logs/api`

#### 4.3.5 运行日志列表 (Runtime Logs)
> **新增接口**: 独立查询机器人的运行日志。

- **URL**: `GET /operation/logs/runtime`
- **请求方式**: GET
- **Query 参数**:
  - `current`, `pageSize` (必填)
  - `robot`: 机器人编码或ID (可选，用于筛选特定机器人)
  - `keyword`: 日志内容关键字 (可选)
  - `dateFrom`: 开始时间 (可选, e.g., `2026-03-04 00:00:00`)
  - `dateTo`: 结束时间 (可选)
- **响应 (`data` 部分)**:
  ```json
  {
    "list": [
      {
        "id": "log-1",
        "robot": "RB-A101",
        "robotId": "RB-001",
        "name": "rb-a101-20260304.log",
        "type": "INFO",
        "content": "[INFO] navigation start\n[INFO] station=A-03",
        "createdAt": "2026-03-04 08:00:03"
      },
      {
        "id": "log-2",
        "robot": "RB-A101",
        "robotId": "RB-001",
        "name": "rb-a101-20260304.log",
        "type": "WARN",
        "content": "[WARN] obstacle detected at 2.5m",
        "createdAt": "2026-03-04 08:05:12"
      }
    ],
    "total": 2,
    "current": 1,
    "pageSize": 20
  }
  ```

### 4.4 文件管理

#### 4.4.1 文件列表
- **URL**: `GET /operation/files`

### 4.5 软件包管理
*对应前端页面：`PackageManagePage.tsx`*

#### 4.5.1 获取软件包列表
- **URL**: `GET /packages`
- **Query**: `current`, `pageSize`, `type`
- **响应**:
  ```json
  {
    "list": [
      {
        "id": "pkg-1",
        "name": "robot-firmware.zip",
        "type": "robot",
        "size": "500MB",
        "uploadedAt": "2026-02-01 12:00:00"
      }
    ],
    "total": 1
  }
  ```

#### 4.5.2 上传软件包
- **URL**: `POST /packages`

#### 4.5.3 软件包下载
- **URL**: `GET /packages/{id}/download`

### 4.6 服务管理

#### 4.6.1 服务列表
- **URL**: `GET /operation/services`

---

## 5. 附录：数据字典

### 5.1 机器人类型 (RobotType)
- `INSPECTION`: 巡检机器人
- `TRANSPORT`: 搬运机器人
- `COBOT`: 协作机械臂

### 5.2 错误码 (Error Codes)
| Code | Message | Description |
| :--- | :--- | :--- |
| 200 | success | 成功 |
| 40001 | Invalid Parameters | 参数校验失败 |
| 40100 | Unauthorized | 未登录或 Token 过期 |
| 50000 | Internal Server Error | 服务器内部错误 |