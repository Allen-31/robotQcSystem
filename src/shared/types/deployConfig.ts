export type UserStatus = 'enabled' | 'disabled';

export interface UserManageRecord {
  code: string;
  name: string;
  phone: string;
  email: string;
  status: UserStatus;
  lastLoginAt: string;
  roles: string[];
  password: string;
}

export type PermissionAction =
  | 'display'
  | 'create'
  | 'edit'
  | 'delete'
  | 'import'
  | 'export'
  | 'detail'
  | 'review'
  | 'cancel'
  | 'enable'
  | 'disable'
  | 'role'
  | 'changePassword'
  | 'viewVideo'
  | 'viewImage';

export interface RoleManageRecord {
  code: string;
  name: string;
  description: string;
  memberCount: number;
  updatedAt: string;
}

export type MapEditStatus = 'editing' | 'completed';
export type MapPublishStatus = 'published' | 'unpublished';

export interface MapManageRecord {
  code: string;
  name: string;
  type: string;
  editStatus: MapEditStatus;
  publishStatus: MapPublishStatus;
  editedAt: string;
  editedBy: string;
  publishedAt: string;
  publishedBy: string;
}

export interface ConfigTemplateRecord {
  code: string;
  name: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export type ChargeStrategyStatus = 'enabled' | 'disabled';
export type ChargeMethod = 'auto' | 'chargingPile' | 'manualBatterySwap';

export interface ChargeTriggerRule {
  lowBatteryThreshold: number;
  minChargeMinutes: number;
  chargeMethod: ChargeMethod;
}

export interface ChargeStrategyRecord {
  code: string;
  name: string;
  status: ChargeStrategyStatus;
  robotType: string[];
  robotGroup: string[];
  robot: string[];
  triggerRule: ChargeTriggerRule;
}

export type HomingStrategyStatus = 'enabled' | 'disabled';

export interface HomingTriggerRule {
  idleWaitSeconds: number;
}

export interface HomingStrategyRecord {
  code: string;
  name: string;
  status: HomingStrategyStatus;
  robotType: string[];
  robotGroup: string[];
  robot: string[];
  triggerRule: HomingTriggerRule;
}
