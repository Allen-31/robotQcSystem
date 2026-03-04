import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { menuList } from '../../data/menuList';
import { getCurrentRole } from '../../logic/deployConfig/permissionStore';
import { filterMenuTreeByRole } from '../../logic/menu/menuPermission';
import { collectRoutes, findFirstLeafPathByCode } from '../../logic/menu/menuRoute';
import { SubsystemLayout } from '../../ui/layouts/SubsystemLayout';
import { TopLevelLayout } from '../../ui/layouts/TopLevelLayout';
import { HomeDashboardPage } from '../../ui/pages/HomeDashboardPage';
import { LoginPage } from '../../ui/pages/LoginPage';
import { NotFoundPage } from '../../ui/pages/NotFoundPage';
import { OperationMonitoringPage } from '../../ui/pages/OperationMonitoringPage';
import { PlaceholderPage } from '../../ui/pages/PlaceholderPage';
import { RobotConfigPage } from '../../ui/pages/deployConfig/RobotConfigPage';
import { RobotGroupPage } from '../../ui/pages/deployConfig/RobotGroupPage';
import { RobotPartsPage } from '../../ui/pages/deployConfig/RobotPartsPage';
import { RobotTypePage } from '../../ui/pages/deployConfig/RobotTypePage';
import { ReinspectionRecordPage } from '../../ui/pages/qcBusiness/ReinspectionRecordPage';
import { WorkOrderManagePage } from '../../ui/pages/qcBusiness/WorkOrderManagePage';
import { WorkstationManagePage } from '../../ui/pages/qcBusiness/WorkstationManagePage';
import { WorkstationPositionManagePage } from '../../ui/pages/qcBusiness/WorkstationPositionManagePage';
import { RoleManagePage } from '../../ui/pages/deployConfig/RoleManagePage';
import { ChargeStrategyPage } from '../../ui/pages/deployConfig/ChargeStrategyPage';
import { ConfigTemplatePage } from '../../ui/pages/deployConfig/ConfigTemplatePage';
import { HomingStrategyPage } from '../../ui/pages/deployConfig/HomingStrategyPage';
import { MapManagePage } from '../../ui/pages/deployConfig/MapManagePage';
import { SettingPage } from '../../ui/pages/deployConfig/SettingPage';
import { UserManagePage } from '../../ui/pages/deployConfig/UserManagePage';
import { StationConfigPage } from '../../ui/pages/qcConfig/StationConfigPage';
import { TerminalConfigPage } from '../../ui/pages/qcConfig/TerminalConfigPage';
import { WireHarnessTypePage } from '../../ui/pages/qcConfig/WireHarnessTypePage';
import { WorkstationConfigPage } from '../../ui/pages/qcConfig/WorkstationConfigPage';
import { WorkshopConfigPage } from '../../ui/pages/qcConfig/WorkshopConfigPage';
import { FileManagePage } from '../../ui/pages/operationMaintenance/FileManagePage';
import { PackageManagePage } from '../../ui/pages/operationMaintenance/PackageManagePage';
import { PublishManagePage } from '../../ui/pages/operationMaintenance/PublishManagePage';
import { ServiceManagePage } from '../../ui/pages/operationMaintenance/ServiceManagePage';
import { TaskManagePage } from '../../ui/pages/operationMaintenance/TaskManagePage';
import { QualityReportPage } from '../../ui/pages/qcStatistics/QualityReportPage';
import { QualityStatisticsPage } from '../../ui/pages/qcStatistics/QualityStatisticsPage';

const allRoutes = collectRoutes(menuList);
const subsystemRoutes = allRoutes.filter((route) => !route.path.startsWith('/home/'));
const workstationManagePath = '/qualityInspection/workstationManage';
const workstationPositionManagePath = '/qualityInspection/workstationPositionManage';
const workOrderManagePath = '/qualityInspection/workOrderManage';
const reinspectionRecordPath = '/qualityInspection/reinspectionRecord';
const userManagePath = '/deployConfig/user/userManage';
const roleManagePath = '/deployConfig/user/roleManage';
const settingPath = '/deployConfig/setting';
const mapManagePath = '/deployConfig/scene/mapManage';
const configTemplatePath = '/deployConfig/scene/configTemplate';
const chargeStrategyPath = '/deployConfig/robot/chargeStrategy';
const homingStrategyPath = '/deployConfig/robot/homingStrategy';
const fileManagePath = '/operationMaintenance/file/fileManage';
const serviceManagePath = '/operationMaintenance/service/serviceManage';
const packageManagePath = '/operationMaintenance/upgrade/packageManage';
const publishManagePath = '/operationMaintenance/upgrade/publishManage';
const taskManagePath = '/operationMaintenance/task/taskManage';
const qualityStatisticsPath = '/qualityInspection/qualityStatistics';
const qualityReportPath = '/qualityInspection/qualityReport';
const qualityConfigPaths = [
  '/qualityInspection/workstationConfig',
  '/qualityInspection/workstationPositionConfig',
  '/qualityInspection/wireHarnessType',
  '/qualityInspection/terminalConfig',
  '/qualityInspection/workshopConfig',
];
const deployRobotPaths = [
  '/deployConfig/robot/robotList',
  '/deployConfig/robot/robotType',
  '/deployConfig/robot/robotParts',
  '/deployConfig/robot/robotGroup',
];
const placeholderRoutes = subsystemRoutes.filter(
  (route) =>
    route.path !== workstationManagePath &&
    route.path !== workstationPositionManagePath &&
    route.path !== workOrderManagePath &&
    route.path !== reinspectionRecordPath &&
    route.path !== userManagePath &&
    route.path !== roleManagePath &&
    route.path !== settingPath &&
    route.path !== mapManagePath &&
    route.path !== configTemplatePath &&
    route.path !== chargeStrategyPath &&
    route.path !== homingStrategyPath &&
    route.path !== fileManagePath &&
    route.path !== serviceManagePath &&
    route.path !== packageManagePath &&
    route.path !== publishManagePath &&
    route.path !== taskManagePath &&
    route.path !== qualityStatisticsPath &&
    route.path !== qualityReportPath &&
    !qualityConfigPaths.includes(route.path) &&
    !deployRobotPaths.includes(route.path),
);

export function AppRouter() {
  const role = getCurrentRole();
  const visibleMenuTree = filterMenuTreeByRole(menuList, role);
  const qualityInspectionFirstPath = findFirstLeafPathByCode(visibleMenuTree, 'qualityInspection');
  const deployConfigFirstPath = findFirstLeafPathByCode(visibleMenuTree, 'deployConfig');
  const operationMaintenanceFirstPath = findFirstLeafPathByCode(visibleMenuTree, 'operationMaintenance');
  const dataStatisticsFirstPath = findFirstLeafPathByCode(visibleMenuTree, 'dataStatistics');

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/home/login" element={<LoginPage />} />

        <Route element={<TopLevelLayout />}>
          <Route index element={<HomeDashboardPage />} />

          <Route element={<SubsystemLayout />}>
            <Route
              path="/qualityInspection"
              element={<Navigate to={qualityInspectionFirstPath === '/' ? '/qualityInspection' : qualityInspectionFirstPath} replace />}
            />
            <Route
              path="/deployConfig"
              element={<Navigate to={deployConfigFirstPath === '/' ? '/deployConfig' : deployConfigFirstPath} replace />}
            />
            <Route
              path="/operationMaintenance"
              element={<Navigate to={operationMaintenanceFirstPath === '/' ? '/operationMaintenance' : operationMaintenanceFirstPath} replace />}
            />
            <Route
              path="/dataStatistics"
              element={<Navigate to={dataStatisticsFirstPath === '/' ? '/dataStatistics' : dataStatisticsFirstPath} replace />}
            />
            <Route path="/operationMonitoring" element={<OperationMonitoringPage />} />
            <Route path={workstationManagePath} element={<WorkstationManagePage />} />
            <Route path={workstationPositionManagePath} element={<WorkstationPositionManagePage />} />
            <Route path={workOrderManagePath} element={<WorkOrderManagePage />} />
            <Route path={reinspectionRecordPath} element={<ReinspectionRecordPage />} />
            <Route path={userManagePath} element={<UserManagePage />} />
            <Route path={roleManagePath} element={<RoleManagePage />} />
            <Route path={settingPath} element={<SettingPage />} />
            <Route path={mapManagePath} element={<MapManagePage />} />
            <Route path={configTemplatePath} element={<RobotConfigPage />} />
            <Route path={chargeStrategyPath} element={<ChargeStrategyPage />} />
            <Route path={homingStrategyPath} element={<HomingStrategyPage />} />
            <Route path={fileManagePath} element={<FileManagePage />} />
            <Route path={serviceManagePath} element={<ServiceManagePage />} />
            <Route path={packageManagePath} element={<PackageManagePage />} />
            <Route path={publishManagePath} element={<PublishManagePage />} />
            <Route path={taskManagePath} element={<TaskManagePage />} />
            <Route path={qualityStatisticsPath} element={<QualityStatisticsPage />} />
            <Route path={qualityReportPath} element={<QualityReportPage />} />
            <Route path="/qualityInspection/workstationConfig" element={<WorkstationConfigPage />} />
            <Route path="/qualityInspection/workstationPositionConfig" element={<StationConfigPage />} />
            <Route path="/qualityInspection/wireHarnessType" element={<WireHarnessTypePage />} />
            <Route path="/qualityInspection/terminalConfig" element={<TerminalConfigPage />} />
            <Route path="/qualityInspection/workshopConfig" element={<WorkshopConfigPage />} />
            <Route path="/deployConfig/robot/robotList" element={<ConfigTemplatePage />} />
            <Route path="/deployConfig/robot/robotType" element={<RobotTypePage />} />
            <Route path="/deployConfig/robot/robotParts" element={<RobotPartsPage />} />
            <Route path="/deployConfig/robot/robotGroup" element={<RobotGroupPage />} />

            {placeholderRoutes.map((route) => (
              <Route key={route.path} path={route.path} element={<PlaceholderPage route={route} />} />
            ))}
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
