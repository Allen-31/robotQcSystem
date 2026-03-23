import type { ReactNode } from 'react';
import type { PermissionAction } from '../../shared/types/deployConfig';
import { usePermission } from '../../logic/deployConfig/usePermission';

interface PermissionProps {
  menuKey: string;
  action?: PermissionAction;
  fallback?: ReactNode;
  children: ReactNode;
}

export function Permission({
  menuKey,
  action = 'display',
  fallback = null,
  children,
}: PermissionProps) {
  const { can } = usePermission();

  if (!can(menuKey, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
