import {
  ApiOutlined,
  ApartmentOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  BellOutlined,
  CheckCircleOutlined,
  CloudUploadOutlined,
  ClusterOutlined,
  DeploymentUnitOutlined,
  FileTextOutlined,
  FileOutlined,
  FundProjectionScreenOutlined,
  HomeOutlined,
  HistoryOutlined,
  LockOutlined,
  NotificationOutlined,
  RadarChartOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  ShopOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  ToolOutlined,
  UnorderedListOutlined,
  UserOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';
import type { MenuNode } from '../../shared/types/menu';

const iconMapByName: Record<string, ReactNode> = {
  HomeOutlined: <HomeOutlined />,
  CheckCircleOutlined: <CheckCircleOutlined />,
  SettingOutlined: <SettingOutlined />,
  ToolOutlined: <ToolOutlined />,
  BarChartOutlined: <BarChartOutlined />,
};

const iconMapByCode: Record<string, ReactNode> = {
  qualityInspection: <CheckCircleOutlined />,
  deployConfig: <SettingOutlined />,
  operationMaintenance: <ToolOutlined />,
  dataStatistics: <BarChartOutlined />,

  business: <AppstoreOutlined />,
  config: <SettingOutlined />,
  statistics: <BarChartOutlined />,
  task: <UnorderedListOutlined />,
  robot: <RobotOutlined />,
  scene: <ApartmentOutlined />,
  setting: <SafetyCertificateOutlined />,
  user: <UserOutlined />,
  notification: <BellOutlined />,
  file: <FileOutlined />,
  upgrade: <CloudUploadOutlined />,
  service: <ApiOutlined />,

  workstationManage: <ShopOutlined />,
  workstationPositionManage: <DeploymentUnitOutlined />,
  workOrderManage: <UnorderedListOutlined />,
  qualityRecord: <FileTextOutlined />,
  reinspectionRecord: <HistoryOutlined />,
  workstationConfig: <ShopOutlined />,
  workstationPositionConfig: <DeploymentUnitOutlined />,
  wireHarnessType: <ClusterOutlined />,
  terminalConfig: <FundProjectionScreenOutlined />,
  workshopConfig: <ShopOutlined />,
  qualityStatistics: <BarChartOutlined />,
  qualityReport: <RadarChartOutlined />,

  taskOrchestration: <ClusterOutlined />,
  taskTemplate: <FileOutlined />,
  actionTemplate: <ThunderboltOutlined />,
  robotList: <RobotOutlined />,
  robotType: <AppstoreOutlined />,
  robotParts: <ToolOutlined />,
  robotGroup: <TeamOutlined />,
  chargeStrategy: <RadarChartOutlined />,
  homingStrategy: <DeploymentUnitOutlined />,
  configTemplate: <FileOutlined />,
  mapManage: <ApartmentOutlined />,
  deviceManage: <ClusterOutlined />,
  sceneDeviceManage: <VideoCameraOutlined />,
  userManage: <UserOutlined />,
  roleManage: <LockOutlined />,

  taskManage: <UnorderedListOutlined />,
  robotManage: <RobotOutlined />,
  exceptionNotification: <NotificationOutlined />,
  loginLog: <HistoryOutlined />,
  operationLog: <HistoryOutlined />,
  apiLog: <ApiOutlined />,
  fileManage: <FileOutlined />,
  packageManage: <CloudUploadOutlined />,
  publishManage: <CloudUploadOutlined />,
  serviceManage: <ApiOutlined />,

  deviceStatistics: <BarChartOutlined />,
  exceptionStatistics: <RadarChartOutlined />,
};

export function resolveMenuNodeIcon(node: MenuNode): ReactNode | undefined {
  if (node.icon && iconMapByName[node.icon]) {
    return iconMapByName[node.icon];
  }
  return iconMapByCode[node.code];
}
