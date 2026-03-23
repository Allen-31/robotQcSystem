import { useEffect, useMemo } from 'react';
import { WebSocketBridgeClient } from '../../infrastructure/realtime/websocketClient';
import { useRealtimeStore } from '../../store/realtimeStore';

export function useRealtimeConnection(enabled = true) {
  const setStatus = useRealtimeStore((state) => state.setStatus);
  const setRetryCount = useRealtimeStore((state) => state.setRetryCount);
  const markHeartbeat = useRealtimeStore((state) => state.markHeartbeat);
  const pushEvent = useRealtimeStore((state) => state.pushEvent);

  const client = useMemo(
    () =>
      new WebSocketBridgeClient({
        onOpen: () => setStatus('connected'),
        onClose: () => setStatus('disconnected'),
        onError: () => setStatus('disconnected'),
        onReconnect: (retryCount) => {
          setStatus('reconnecting');
          setRetryCount(retryCount);
        },
        onMessage: (message) => {
          markHeartbeat();
          pushEvent(message.event, message.payload);
        },
      }),
    [markHeartbeat, pushEvent, setRetryCount, setStatus],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }
    setStatus('connecting');
    client.connect();
    return () => {
      client.disconnect();
    };
  }, [client, enabled, setStatus]);

  return client;
}
