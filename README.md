# robotQcSystem

机器人质检管理系统前端。

## 技术栈
- Vite + React + TypeScript + Ant Design
- 状态管理：Zustand
- 服务端数据：React Query
- 请求层：Axios（统一鉴权、错误处理、重试、请求加载态）
- 实时通信：WebSocket（含重连与心跳基础能力）

## 目录分层与职责

```text
src/
├─ app/               # 应用装配层（Provider、QueryClient、全局启动配置）
├─ infrastructure/    # 基础设施层（路由、实时连接、外部系统接入）
├─ shared/            # 共享能力层（API 客户端、接口定义、通用类型）
├─ logic/             # 业务逻辑层（按业务域组织的 hooks / 用例编排）
├─ store/             # 全局状态层（跨页面共享的 Zustand store）
├─ ui/                # 页面表现层（layouts / pages / 局部 UI 组件）
├─ components/        # 跨业务复用组件（导航、权限组件等）
├─ data/              # 本地数据源（mock、静态配置、演示数据）
├─ i18n/              # 国际化资源与 Provider
├─ utils/             # 无业务语义的通用工具函数
└─ assets/            # 静态资源
```

### app（应用装配层）
- 负责全局 Provider、启动流程、运行时初始化。
- 不写具体业务规则。

### infrastructure（基础设施层）
- 负责路由编排、WebSocket 客户端、外部连接适配。
- 只做“技术接入”和“协议转换”，不承载业务决策。

### shared（共享能力层）
- `shared/api`：统一请求入口、接口模块、query key。
- `shared/types`：跨模块复用的数据类型。
- 原则：可被各业务域复用，但不反向依赖业务模块。

### logic（业务逻辑层）
- 按业务域拆分：`qcBusiness / qcConfig / deployConfig / ...`。
- 负责：页面行为编排、业务状态加工、调用 API 与 store。
- 页面应尽量“薄”，复杂逻辑放到此层。

### store（全局状态层）
- 放跨页面共享状态，例如用户、实时连接状态等。
- 单页局部状态优先放组件内，不要滥用全局 store。

### ui + components（表现层）
- `ui/pages`：页面级组件。
- `ui/layouts`：整体布局与路由出口。
- `ui/components` / `components`：可复用展示组件。
- 原则：表现层不直接写复杂业务规则，优先调用 logic 层。

### data（本地数据层）
- 仅用于 mock、静态枚举、演示数据。
- 一旦后端接口可用，优先迁移到 `shared/api + logic`。

## 依赖方向（必须遵守）
- 推荐方向：`ui -> logic -> shared/api -> backend`
- `logic` 可读写 `store`，但 `store` 不反向依赖 `logic`
- `shared` 不依赖 `logic/ui`
- `infrastructure` 不写业务规则，只提供能力

## 标准数据流

### 普通接口数据流
1. `Page` 触发交互
2. 调用 `logic` 层 hook
3. `logic` 调用 `shared/api`
4. API 返回后更新 `store` 或直接返回给页面
5. 页面渲染

### 实时数据流
1. `infrastructure/realtime` 建立 WebSocket 连接
2. 收到事件后分发到 `logic/realtime` 或 `store`
3. 页面从 store/selectors 读取并刷新

## 新增代码落位规则
- 新页面：`src/ui/pages/<domain>/`
- 新业务 hook：`src/logic/<domain>/`
- 新接口：`src/shared/api/<domain>Api.ts`
- 新全局状态：`src/store/`
- 新路由：`src/infrastructure/router/AppRouter.tsx`
- 新实时事件处理：`src/infrastructure/realtime/` + `src/logic/realtime/`

## 常用命令
- `npm run dev`：本地开发
- `npm run build`：生产构建
- `npm run typecheck`：TypeScript 检查
- `npm run lint`：ESLint 检查
- `npm run lint:fix`：自动修复 lint 问题
- `npm run format`：Prettier 检查
- `npm run format:write`：Prettier 自动格式化

## 环境变量
- `.env.dev`
- `.env.test`
- `.env.prod`
- `.env.example`

核心变量：
- `VITE_API_BASE_URL`：后端 API 地址
- `VITE_WS_BASE_URL`：实时网关 WebSocket 地址
