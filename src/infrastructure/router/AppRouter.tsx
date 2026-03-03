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
import { ReinspectionRecordPage } from '../../ui/pages/qcBusiness/ReinspectionRecordPage';
import { WorkOrderManagePage } from '../../ui/pages/qcBusiness/WorkOrderManagePage';
import { WorkstationManagePage } from '../../ui/pages/qcBusiness/WorkstationManagePage';
import { WorkstationPositionManagePage } from '../../ui/pages/qcBusiness/WorkstationPositionManagePage';
import { PermissionManagePage } from '../../ui/pages/deployConfig/PermissionManagePage';
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

const allRoutes = collectRoutes(menuList);
const subsystemRoutes = allRoutes.filter((route) => !route.path.startsWith('/home/'));
const workstationManagePath = '/qualityInspection/workstationManage';
const workstationPositionManagePath = '/qualityInspection/workstationPositionManage';
const workOrderManagePath = '/qualityInspection/workOrderManage';
const reinspectionRecordPath = '/qualityInspection/reinspectionRecord';
const userManagePath = '/deployConfig/user/userManage';
const roleManagePath = '/deployConfig/user/roleManage';
const permissionManagePath = '/deployConfig/user/permissionManage';
const settingPath = '/deployConfig/setting';
const mapManagePath = '/deployConfig/scene/mapManage';
const configTemplatePath = '/deployConfig/scene/configTemplate';
const chargeStrategyPath = '/deployConfig/robot/chargeStrategy';
const homingStrategyPath = '/deployConfig/robot/homingStrategy';
const qualityConfigPaths = [
  '/qualityInspection/workstationConfig',
  '/qualityInspection/workstationPositionConfig',
  '/qualityInspection/wireHarnessType',
  '/qualityInspection/terminalConfig',
];
const placeholderRoutes = subsystemRoutes.filter(
  (route) =>
    route.path !== workstationManagePath &&
    route.path !== workstationPositionManagePath &&
    route.path !== workOrderManagePath &&
    route.path !== reinspectionRecordPath &&
    route.path !== userManagePath &&
    route.path !== roleManagePath &&
    route.path !== permissionManagePath &&
    route.path !== settingPath &&
    route.path !== mapManagePath &&
    route.path !== configTemplatePath &&
    route.path !== chargeStrategyPath &&
    route.path !== homingStrategyPath &&
    !qualityConfigPaths.includes(route.path),
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
            <Route path={permissionManagePath} element={<PermissionManagePage />} />
            <Route path={settingPath} element={<SettingPage />} />
            <Route path={mapManagePath} element={<MapManagePage />} />
            <Route path={configTemplatePath} element={<ConfigTemplatePage />} />
            <Route path={chargeStrategyPath} element={<ChargeStrategyPage />} />
            <Route path={homingStrategyPath} element={<HomingStrategyPage />} />
            <Route path="/qualityInspection/workstationConfig" element={<WorkstationConfigPage />} />
            <Route path="/qualityInspection/workstationPositionConfig" element={<StationConfigPage />} />
            <Route path="/qualityInspection/wireHarnessType" element={<WireHarnessTypePage />} />
            <Route path="/qualityInspection/terminalConfig" element={<TerminalConfigPage />} />

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
