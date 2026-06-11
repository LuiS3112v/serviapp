import { api } from './api';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  status: 'unread' | 'read';
  priority: string;
  metadata?: Record<string, any>;
  actionUrl?: string;
  createdAt: string;
  readAt?: string;
}

export interface NotificationsResponse {
  notifications: AppNotification[];
  total: number;
  unread: number;
}

export const notificationsApi = {
  getAll: (page = 1, limit = 20) =>
    api.get<NotificationsResponse>(`/notifications?page=${page}&limit=${limit}`),

  getUnreadCount: () =>
    api.get<{ count: number }>('/notifications/unread-count'),

  markAsRead: (id: string) =>
    api.patch(`/notifications/${id}/read`),

  markAllAsRead: () =>
    api.patch('/notifications/read-all'),

  delete: (id: string) =>
    api.delete(`/notifications/${id}`),

  registerToken: (token: string, platform = 'web') =>
    api.post('/notifications/register-token', { token, platform }),
};