import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import type { ReactElement } from 'react';
import { menuList } from '../../data/menuList';
import { useCurrentRole } from '../../logic/deployConfig/useCurrentRole';
import { filterMenuTreeByRole } from '../../logic/menu/menuPermission';
import { collectRoutes, findFirstLeafPathByCode } from '../../logic/menu/menuRoute';
import { SubsystemLayout } from '../../ui/layouts/SubsystemLayout';
import { TopLevelLayout } from '../../ui/layouts/TopLevelLayout';
import { HomeDashboardPage } from '../../ui/pages/HomeDashboardPage';
import { LoginPage } from '../../ui/pages/LoginPage';
import { NotFoundPage } from '../../ui/pages/NotFoundPage';
import { OperationMonitoringPage } from '../../ui/pages/OperationMonitoringPage';
import { PlaceholderPage } from '../../ui/pages/PlaceholderPage';
import { ConfigTemplatePage } from '../../ui/pages/deployConfig/ConfigTemplatePage';
import { RobotGroupPage } from '../../ui/pages/deployConfig/RobotGroupPage';
import { RobotPartsPage } from '../../ui/pages/deployConfig/RobotPartsPage';
import { RobotTypeEditorPage } from '../../ui/pages/deployConfig/RobotTypeEditorPage';
import { RobotTypePage } from '../../ui/pages/deployConfig/RobotTypePage';
import { QualityRecordPage } from '../../ui/pages/qcBusiness/QualityRecordPage';
import { ReinspectionRecordPage } from '../../ui/pages/qcBusiness/ReinspectionRecordPage';
import { WorkOrderManagePage } from '../../ui/pages/qcBusiness/WorkOrderManagePage';
import { WorkstationManagePage } from '../../ui/pages/qcBusiness/WorkstationManagePage';
import { WorkstationPositionManagePage } from '../../ui/pages/qcBusiness/WorkstationPositionManagePage';
import { RoleManagePage } from '../../ui/pages/deployConfig/RoleManagePage';
import { ChargeStrategyPage } from '../../ui/pages/deployConfig/ChargeStrategyPage';
import { HomingStrategyPage } from '../../ui/pages/deployConfig/HomingStrategyPage';
import { MapEditorPage } from '../../ui/pages/deployConfig/MapEditorPage';
import { SceneDeviceManagePage } from '../../ui/pages/deployConfig/SceneDeviceManagePage';
import { MapManagePage } from '../../ui/pages/deployConfig/MapManagePage';
import { TaskTemplatePage } from '../../ui/pages/deployConfig/TaskTemplatePage';
import { ActionTemplatePage } from '../../ui/pages/deployConfig/ActionTemplatePage';
import { TaskDesignPage } from '../../ui/pages/deployConfig/TaskDesignPage';
import { SettingPage } from '../../ui/pages/deployConfig/SettingPage';
import { UserManagePage } from '../../ui/pages/deployConfig/UserManagePage';
import { StationConfigPage } from '../../ui/pages/qcConfig/StationConfigPage';
import { TerminalConfigPage } from '../../ui/pages/qcConfig/TerminalConfigPage';
import { WireHarnessTypePage } from '../../ui/pages/qcConfig/WireHarnessTypePage';
import { WorkstationConfigPage } from '../../ui/pages/qcConfig/WorkstationConfigPage';
import { WorkshopConfigPage } from '../../ui/pages/qcConfig/WorkshopConfigPage';
import { FileManagePage } from '../../ui/pages/operationMaintenance/FileManagePage';
import { ApiLogPage } from '../../ui/pages/operationMaintenance/ApiLogPage';
import { ExceptionNotificationPage } from '../../ui/pages/operationMaintenance/ExceptionNotificationPage';
import { LoginLogPage } from '../../ui/pages/operationMaintenance/LoginLogPage';
import { OperationLogPage } from '../../ui/pages/operationMaintenance/OperationLogPage';
import { PackageManagePage } from '../../ui/pages/operationMaintenance/PackageManagePage';
import { PublishManagePage } from '../../ui/pages/operationMaintenance/PublishManagePage';
import { RobotManagePage } from '../../ui/pages/operationMaintenance/RobotManagePage';
import { RobotManageDetailPage } from '../../ui/pages/operationMaintenance/RobotManageDetailPage';
import { ServiceManagePage } from '../../ui/pages/operationMaintenance/ServiceManagePage';
import { TaskManageDetailPage } from '../../ui/pages/operationMaintenance/TaskManageDetailPage';
import { TaskManagePage } from '../../ui/pages/operationMaintenance/TaskManagePage';
import { DeviceStatisticsPage } from '../../ui/pages/dataStatistics/DeviceStatisticsPage';
import { ExceptionStatisticsPage } from '../../ui/pages/dataStatistics/ExceptionStatisticsPage';
import { QualityReportPage } from '../../ui/pages/qcStatistics/QualityReportPage';
import { QualityStatisticsPage } from '../../ui/pages/qcStatistics/QualityStatisticsPage';

const workstationManagePath = '/qualityInspection/workstationManage';
const workstationPositionManagePath = '/qualityInspection/workstationPositionManage';
const workOrderManagePath = '/qualityInspection/workOrderManage';
const qualityRecordPath = '/qualityInspection/qualityRecord';
const reinspectionRecordPath = '/qualityInspection/reinspectionRecord';
const userManagePath = '/deployConfig/user/userManage';
const roleManagePath = '/deployConfig/user/roleManage';
const settingPath = '/deployConfig/setting';
const mapManagePath = '/deployConfig/scene/mapManage';
const deviceManagePath = '/deployConfig/scene/deviceManage';
const mapEditorPath = '/deployConfig/scene/mapManage/:mapCode/edit';
const taskTemplatePath = '/deployConfig/task/taskTemplate';
const actionTemplatePath = '/deployConfig/task/actionTemplate';
const chargeStrategyPath = '/deployConfig/robot/chargeStrategy';
const homingStrategyPath = '/deployConfig/robot/homingStrategy';
const fileManagePath = '/operationMaintenance/file/fileManage';
const serviceManagePath = '/operationMaintenance/service/serviceManage';
const packageManagePath = '/operationMaintenance/upgrade/packageManage';
const publishManagePath = '/operationMaintenance/upgrade/publishManage';
const taskManagePath = '/operationMaintenance/task/taskManage';
const taskManageDetailPath = '/operationMaintenance/task/taskManage/:taskId/detail';
const robotManagePath = '/operationMaintenance/robot/robotManage';
const robotManageDetailPath = '/operationMaintenance/robot/robotManage/:robotId/detail';
const exceptionNotificationPath = '/operationMaintenance/notification/exceptionNotification';
const loginLogPath = '/operationMaintenance/notification/loginLog';
const operationLogPath = '/operationMaintenance/notification/operationLog';
const apiLogPath = '/operationMaintenance/notification/apiLog';
const qualityStatisticsPath = '/qualityInspection/qualityStatistics';
const qualityReportPath = '/qualityInspection/qualityReport';
const deviceStatisticsPath = '/dataStatistics/deviceStatistics';
const exceptionStatisticsPath = '/dataStatistics/exceptionStatistics';
const operationMonitoringPath = '/operationMonitoring';

const qualityConfigPaths = [
  '/qualityInspection/workstationConfig',
  '/qualityInspection/workstationPositionConfig',
  '/qualityInspection/wireHarnessType',
  '/qualityInspection/terminalConfig',
  '/qualityInspection/workshopConfig',
] as const;

const deployRobotPaths = [
  '/deployConfig/robot/robotList',
  '/deployConfig/robot/robotType',
  '/deployConfig/robot/robotParts',
  '/deployConfig/robot/robotGroup',
] as const;

const explicitImplementedPaths = new Set<string>([
  workstationManagePath,
  workstationPositionManagePath,
  workOrderManagePath,
  qualityRecordPath,
  reinspectionRecordPath,
  userManagePath,
  roleManagePath,
  settingPath,
  mapManagePath,
  deviceManagePath,
  taskTemplatePath,
  actionTemplatePath,
  chargeStrategyPath,
  homingStrategyPath,
  fileManagePath,
  serviceManagePath,
  packageManagePath,
  publishManagePath,
  taskManagePath,
  robotManagePath,
  exceptionNotificationPath,
  loginLogPath,
  operationLogPath,
  apiLogPath,
  qualityStatisticsPath,
  qualityReportPath,
  deviceStatisticsPath,
  exceptionStatisticsPath,
  operationMonitoringPath,
  ...qualityConfigPaths,
  ...deployRobotPaths,
]);

function firstExisting(paths: string[]): string {
  return paths.find((path) => path && path !== '/') ?? '/';
}

export function AppRouter() {
  const { currentRole, permissionVersion } = useCurrentRole();
  const visibleMenuTree = filterMenuTreeByRole(menuList, currentRole);

  const visibleRoutePaths = new Set(
    collectRoutes(visibleMenuTree)
      .filter((route) => Boolean(route.path))
      .map((route) => route.path),
  );

  const canAccessPath = (path: string): boolean => visibleRoutePaths.has(path);

  const qualityInspectionFirstPath = findFirstLeafPathByCode(visibleMenuTree, 'qualityInspection');
  const deployConfigFirstPath = findFirstLeafPathByCode(visibleMenuTree, 'deployConfig');
  const operationMaintenanceFirstPath = findFirstLeafPathByCode(visibleMenuTree, 'operationMaintenance');
  const dataStatisticsFirstPath = findFirstLeafPathByCode(visibleMenuTree, 'dataStatistics');

  const fallbackPath = firstExisting([
    qualityInspectionFirstPath,
    deployConfigFirstPath,
    operationMaintenanceFirstPath,
    dataStatisticsFirstPath,
    canAccessPath(operationMonitoringPath) ? operationMonitoringPath : '',
  ]);

  const guard = (requiredPath: string, element: ReactElement) => {
    if (canAccessPath(requiredPath)) {
      return element;
    }
    return <Navigate to={fallbackPath} replace />;
  };

  const subsystemRoutes = collectRoutes(visibleMenuTree).filter((route) => !route.path.startsWith('/home/'));
  const placeholderRoutes = subsystemRoutes.filter((route) => !explicitImplementedPaths.has(route.path));

  const qualityInspectionEntry = canAccessPath(qualityInspectionFirstPath) ? qualityInspectionFirstPath : fallbackPath;
  const deployConfigEntry = canAccessPath(deployConfigFirstPath) ? deployConfigFirstPath : fallbackPath;
  const operationMaintenanceEntry = canAccessPath(operationMaintenanceFirstPath) ? operationMaintenanceFirstPath : fallbackPath;
  const dataStatisticsEntry = canAccessPath(dataStatisticsFirstPath) ? dataStatisticsFirstPath : fallbackPath;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/home/login" element={<LoginPage />} />
        <Route path="/home/loginCallback" element={<Navigate to="/" replace />} />

        <Route element={<TopLevelLayout />}>
          <Route index element={<HomeDashboardPage />} />

          <Route element={<SubsystemLayout />}>
            <Route path="/qualityInspection" element={<Navigate to={qualityInspectionEntry} replace />} />
            <Route path="/deployConfig" element={<Navigate to={deployConfigEntry} replace />} />
            <Route path="/operationMaintenance" element={<Navigate to={operationMaintenanceEntry} replace />} />
            <Route path="/dataStatistics" element={<Navigate to={dataStatisticsEntry} replace />} />

            <Route path={operationMonitoringPath} element={guard(operationMonitoringPath, <OperationMonitoringPage />)} />
            <Route path={workstationManagePath} element={guard(workstationManagePath, <WorkstationManagePage />)} />
            <Route path={workstationPositionManagePath} element={guard(workstationPositionManagePath, <WorkstationPositionManagePage />)} />
            <Route path={workOrderManagePath} element={guard(workOrderManagePath, <WorkOrderManagePage />)} />
            <Route path={qualityRecordPath} element={guard(qualityRecordPath, <QualityRecordPage />)} />
            <Route path={reinspectionRecordPath} element={guard(reinspectionRecordPath, <ReinspectionRecordPage />)} />
            <Route path={userManagePath} element={guard(userManagePath, <UserManagePage />)} />
            <Route path={roleManagePath} element={guard(roleManagePath, <RoleManagePage />)} />
            <Route path={settingPath} element={guard(settingPath, <SettingPage />)} />
            <Route path={mapManagePath} element={guard(mapManagePath, <MapManagePage />)} />
            <Route path={deviceManagePath} element={guard(deviceManagePath, <SceneDeviceManagePage />)} />
            <Route path={mapEditorPath} element={guard(mapManagePath, <MapEditorPage />)} />
            <Route path={taskTemplatePath} element={guard(taskTemplatePath, <TaskTemplatePage />)} />
            <Route path={actionTemplatePath} element={guard(actionTemplatePath, <ActionTemplatePage />)} />
            <Route path="/deployConfig/task/taskDesign/:step" element={guard(taskTemplatePath, <TaskDesignPage />)} />
            <Route path={chargeStrategyPath} element={guard(chargeStrategyPath, <ChargeStrategyPage />)} />
            <Route path={homingStrategyPath} element={guard(homingStrategyPath, <HomingStrategyPage />)} />
            <Route path={fileManagePath} element={guard(fileManagePath, <FileManagePage />)} />
            <Route path={serviceManagePath} element={guard(serviceManagePath, <ServiceManagePage />)} />
            <Route path={packageManagePath} element={guard(packageManagePath, <PackageManagePage />)} />
            <Route path={publishManagePath} element={guard(publishManagePath, <PublishManagePage />)} />
            <Route path={taskManagePath} element={guard(taskManagePath, <TaskManagePage />)} />
            <Route path={taskManageDetailPath} element={guard(taskManagePath, <TaskManageDetailPage />)} />
            <Route path={robotManagePath} element={guard(robotManagePath, <RobotManagePage />)} />
            <Route path={robotManageDetailPath} element={guard(robotManagePath, <RobotManageDetailPage />)} />
            <Route path={exceptionNotificationPath} element={guard(exceptionNotificationPath, <ExceptionNotificationPage />)} />
            <Route path={loginLogPath} element={guard(loginLogPath, <LoginLogPage />)} />
            <Route path={operationLogPath} element={guard(operationLogPath, <OperationLogPage />)} />
            <Route path={apiLogPath} element={guard(apiLogPath, <ApiLogPage />)} />
            <Route path={qualityStatisticsPath} element={guard(qualityStatisticsPath, <QualityStatisticsPage />)} />
            <Route path={qualityReportPath} element={guard(qualityReportPath, <QualityReportPage />)} />
            <Route path={deviceStatisticsPath} element={guard(deviceStatisticsPath, <DeviceStatisticsPage />)} />
            <Route path={exceptionStatisticsPath} element={guard(exceptionStatisticsPath, <ExceptionStatisticsPage />)} />

            <Route path="/qualityInspection/workstationConfig" element={guard('/qualityInspection/workstationConfig', <WorkstationConfigPage />)} />
            <Route path="/qualityInspection/workstationPositionConfig" element={guard('/qualityInspection/workstationPositionConfig', <StationConfigPage />)} />
            <Route path="/qualityInspection/wireHarnessType" element={guard('/qualityInspection/wireHarnessType', <WireHarnessTypePage />)} />
            <Route path="/qualityInspection/terminalConfig" element={guard('/qualityInspection/terminalConfig', <TerminalConfigPage />)} />
            <Route path="/qualityInspection/workshopConfig" element={guard('/qualityInspection/workshopConfig', <WorkshopConfigPage />)} />

            <Route path="/deployConfig/robot/robotList" element={guard('/deployConfig/robot/robotList', <ConfigTemplatePage />)} />
            <Route path="/deployConfig/robot/robotType" element={guard('/deployConfig/robot/robotType', <RobotTypePage />)} />
            <Route path="/deployConfig/robot/robotType/new" element={guard('/deployConfig/robot/robotType', <RobotTypeEditorPage />)} />
            <Route path="/deployConfig/robot/robotType/:typeId/edit" element={guard('/deployConfig/robot/robotType', <RobotTypeEditorPage />)} />
            <Route path="/deployConfig/robot/robotParts" element={guard('/deployConfig/robot/robotParts', <RobotPartsPage />)} />
            <Route path="/deployConfig/robot/robotGroup" element={guard('/deployConfig/robot/robotGroup', <RobotGroupPage />)} />

            {placeholderRoutes.map((route) => (
              <Route key={`${route.path}-${currentRole}-${permissionVersion}`} path={route.path} element={<PlaceholderPage route={route} />} />
            ))}
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

