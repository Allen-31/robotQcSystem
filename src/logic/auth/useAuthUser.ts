import { useEffect } from 'react';
import { useUserStore } from '../../store/userStore';

export function useAuthUser() {
  const user = useUserStore((state) => state.user);
  const hydrateFromStorage = useUserStore((state) => state.hydrateFromStorage);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key?.includes('robot-qc-auth-user')) {
        hydrateFromStorage();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
    };
  }, [hydrateFromStorage]);

  return user;
}
