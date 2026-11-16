import { api } from '@/lib/apiClient';
import type { CreateNotificationPayload, NotificationItem } from '../types';

const base = '/api/v1/notifications';

export const getInbox = async (params?: { page?: number; limit?: number; unreadOnly?: boolean }) => {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.unreadOnly) q.set('unreadOnly', 'true');
  const s = q.toString();
  const res = await api.get<NotificationItem[]>(`${base}/inbox${s ? `?${s}` : ''}`);
  return { items: res.data, meta: res.meta };
};

export const getUnreadCount = async () => (await api.get<{ unreadCount: number }>(`${base}/unread-count`)).data;

export const markAsRead = async (id: string) => (await api.patch<{ success: true }>(`${base}/${id}/read`)).data;

export const markAllAsRead = async () => (await api.post<{ success: true }>(`${base}/read-all`)).data;

export const sendNotification = async (body: CreateNotificationPayload) =>
  (await api.post<NotificationItem>(`${base}/send`, body)).data;
