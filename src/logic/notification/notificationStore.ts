export type NotificationType = 'ng' | 'fault';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  description?: string;
  link: string;
  createdAt: string;
}

let notifications: NotificationItem[] = [];
const listeners = new Set<() => void>();

export function getNotifications(): NotificationItem[] {
  return [...notifications];
}

export function setNotifications(items: NotificationItem[]): void {
  notifications = items;
  listeners.forEach((fn) => fn());
}

export function subscribeNotifications(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function seedMockNotifications(): void {
  if (notifications.length > 0) return;
  setNotifications([
    { id: 'n1', type: 'ng', title: '工单 NG', description: 'WO-20260228-198 质检结果 NG', link: '/qualityInspection/workOrderManage', createdAt: new Date().toISOString() },
    { id: 'n2', type: 'fault', title: '机器人告警', description: 'RB-A102 电量低于 50%', link: '/operationMaintenance/robot/robotManage', createdAt: new Date().toISOString() },
  ]);
}
