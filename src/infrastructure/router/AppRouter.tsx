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
import { WorkstationManagePage } from '../../ui/pages/WorkstationManagePage';

const allRoutes = collectRoutes(menuList);
const subsystemRoutes = allRoutes.filter((route) => !route.path.startsWith('/home/'));
const workstationManagePath = '/qualityInspection/workstationManage';
const placeholderRoutes = subsystemRoutes.filter((route) => route.path !== workstationManagePath);

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
