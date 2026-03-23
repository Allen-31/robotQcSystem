import { create } from 'zustand';

export type RealtimeConnectionStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export interface RealtimeEvent<T = unknown> {
  event: string;
  payload: T;
  receivedAt: string;
}

interface RealtimeState {
  status: RealtimeConnectionStatus;
  retryCount: number;
  lastHeartbeatAt: string | null;
  latestEvents: Record<string, RealtimeEvent>;
  setStatus: (status: RealtimeConnectionStatus) => void;
  setRetryCount: (retryCount: number) => void;
  markHeartbeat: () => void;
  pushEvent: <T>(event: string, payload: T) => void;
  reset: () => void;
}

export const useRealtimeStore = create<RealtimeState>((set) => ({
  status: 'idle',
  retryCount: 0,
  lastHeartbeatAt: null,
  latestEvents: {},
  setStatus: (status) => set({ status }),
  setRetryCount: (retryCount) => set({ retryCount }),
  markHeartbeat: () => set({ lastHeartbeatAt: new Date().toISOString() }),
  pushEvent: (event, payload) =>
    set((state) => ({
      latestEvents: {
        ...state.latestEvents,
        [event]: {
          event,
          payload,
          receivedAt: new Date().toISOString(),
        },
      },
    })),
  reset: () =>
    set({
      status: 'idle',
      retryCount: 0,
      lastHeartbeatAt: null,
      latestEvents: {},
    }),
}));
