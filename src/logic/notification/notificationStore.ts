import { create } from 'zustand';

export type NotificationType = 'ng' | 'fault';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  description?: string;
  link: string;
  createdAt: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  setNotifications: (items: NotificationItem[]) => void;
}

const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  setNotifications: (notifications) => set({ notifications }),
}));

export function getNotifications(): NotificationItem[] {
  return [...useNotificationStore.getState().notifications];
}

export function setNotifications(items: NotificationItem[]): void {
  useNotificationStore.getState().setNotifications(items);
}

export function subscribeNotifications(listener: () => void): () => void {
  return useNotificationStore.subscribe(() => listener());
}

export function seedMockNotifications(): void {
  if (useNotificationStore.getState().notifications.length > 0) return;
  setNotifications([
    {
      id: 'n1',
      type: 'ng',
      title: '工单 NG',
      description: 'WO-20260228-198 质检结果 NG',
      link: '/qualityInspection/workOrderManage',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'n2',
      type: 'fault',
      title: '机器人告警',
      description: 'RB-A102 电量低于 50%',
      link: '/operationMaintenance/robot/robotManage',
      createdAt: new Date().toISOString(),
    },
  ]);
}
