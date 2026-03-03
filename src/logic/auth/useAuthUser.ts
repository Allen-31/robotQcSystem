import { useEffect, useState } from 'react';
import { AUTH_CHANGED_EVENT, getCurrentUser } from './authStore';

export function useAuthUser() {
  const [user, setUser] = useState(getCurrentUser);

  useEffect(() => {
    const refresh = () => setUser(getCurrentUser());
    const onStorage = (event: StorageEvent) => {
      if (event.key?.includes('robot-qc-auth-user')) {
        refresh();
      }
    };
    window.addEventListener(AUTH_CHANGED_EVENT, refresh);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, refresh);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return user;
}

