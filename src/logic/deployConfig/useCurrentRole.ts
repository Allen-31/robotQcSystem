import { useEffect, useState } from 'react';
import { CURRENT_ROLE_CHANGED_EVENT, PERMISSION_UPDATED_EVENT, getCurrentRole, setCurrentRole } from './permissionStore';

export function useCurrentRole() {
  const [currentRole, setCurrentRoleState] = useState(getCurrentRole);
  const [permissionVersion, setPermissionVersion] = useState(0);

  useEffect(() => {
    const onRoleChanged = () => {
      setCurrentRoleState(getCurrentRole());
    };
    const onPermissionChanged = () => {
      setPermissionVersion((value) => value + 1);
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key?.includes('robot-qc-current-role')) {
        onRoleChanged();
      }
      if (event.key?.includes('robot-qc-permission-config')) {
        onPermissionChanged();
      }
    };

    window.addEventListener(CURRENT_ROLE_CHANGED_EVENT, onRoleChanged);
    window.addEventListener(PERMISSION_UPDATED_EVENT, onPermissionChanged);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(CURRENT_ROLE_CHANGED_EVENT, onRoleChanged);
      window.removeEventListener(PERMISSION_UPDATED_EVENT, onPermissionChanged);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const updateCurrentRole = (role: string) => {
    setCurrentRole(role);
    setCurrentRoleState(role);
  };

  return { currentRole, setCurrentRole: updateCurrentRole, permissionVersion };
}

