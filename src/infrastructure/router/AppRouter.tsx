import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { menuList } from '../../data/menuList';
import { collectRoutes, findFirstLeafPathByCode } from '../../logic/menu/menuRoute';
import { SubsystemLayout } from '../../ui/layouts/SubsystemLayout';
import { TopLevelLayout } from '../../ui/layouts/TopLevelLayout';
import { HomeDashboardPage } from '../../ui/pages/HomeDashboardPage';
import { LoginPage } from '../../ui/pages/LoginPage';
import { NotFoundPage } from '../../ui/pages/NotFoundPage';
import { OperationMonitoringPage } from '../../ui/pages/OperationMonitoringPage';
import { PlaceholderPage } from '../../ui/pages/PlaceholderPage';
import { ReinspectionRecordPage } from '../../ui/pages/ReinspectionRecordPage';
import { WorkOrderManagePage } from '../../ui/pages/WorkOrderManagePage';
import { WorkstationManagePage } from '../../ui/pages/WorkstationManagePage';
import { WorkstationPositionManagePage } from '../../ui/pages/WorkstationPositionManagePage';

const allRoutes = collectRoutes(menuList);
const subsystemRoutes = allRoutes.filter((route) => !route.path.startsWith('/home/'));
const workstationManagePath = '/qualityInspection/workstationManage';
const workstationPositionManagePath = '/qualityInspection/workstationPositionManage';
const workOrderManagePath = '/qualityInspection/workOrderManage';
const reinspectionRecordPath = '/qualityInspection/reinspectionRecord';
const placeholderRoutes = subsystemRoutes.filter(
  (route) =>
    route.path !== workstationManagePath &&
    route.path !== workstationPositionManagePath &&
    route.path !== workOrderManagePath &&
    route.path !== reinspectionRecordPath,
);

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/home/login" element={<LoginPage />} />

        <Route element={<TopLevelLayout />}>
          <Route index element={<HomeDashboardPage />} />

          <Route element={<SubsystemLayout />}>
            <Route
              path="/qualityInspection"
              element={<Navigate to={findFirstLeafPathByCode(menuList, 'qualityInspection')} replace />}
            />
            <Route
              path="/deployConfig"
              element={<Navigate to={findFirstLeafPathByCode(menuList, 'deployConfig')} replace />}
            />
            <Route
              path="/operationMaintenance"
              element={<Navigate to={findFirstLeafPathByCode(menuList, 'operationMaintenance')} replace />}
            />
            <Route
              path="/dataStatistics"
              element={<Navigate to={findFirstLeafPathByCode(menuList, 'dataStatistics')} replace />}
            />
            <Route path="/operationMonitoring" element={<OperationMonitoringPage />} />
            <Route path={workstationManagePath} element={<WorkstationManagePage />} />
            <Route path={workstationPositionManagePath} element={<WorkstationPositionManagePage />} />
            <Route path={workOrderManagePath} element={<WorkOrderManagePage />} />
            <Route path={reinspectionRecordPath} element={<ReinspectionRecordPage />} />

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
