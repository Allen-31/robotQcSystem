import { QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';
import { subscribeRequestLoading } from '../shared/api/client';
import { useAppStore } from '../store/appStore';
import { queryClient } from './queryClient';

function RequestLoadingSync() {
  const setPendingRequestCount = useAppStore((state) => state.setPendingRequestCount);

  useEffect(() => subscribeRequestLoading(setPendingRequestCount), [setPendingRequestCount]);
  return null;
}

export function AppProvider({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <RequestLoadingSync />
      {children}
    </QueryClientProvider>
  );
}
