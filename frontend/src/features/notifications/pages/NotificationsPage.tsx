import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, EmptyState } from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getInbox, markAllAsRead, markAsRead, sendNotification } from '../api/notificationsApi';
import { SendNotificationModal } from '../components/SendNotificationModal';
import type { CreateNotificationPayload, NotificationItem } from '../types';

export function NotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canSend = user?.role === 'ADMIN' || user?.role === 'FACULTY';

  const [unreadOnly, setUnreadOnly] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', { unreadOnly }],
    queryFn: () => getInbox({ limit: 50, unreadOnly }),
  });

  const readMut = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const readAllMut = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const handleSendSubmit = async (payload: CreateNotificationPayload) => {
    await sendNotification(payload);
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Notifications & Notices</h1>
          <p className="text-sm text-slate-500">Official college circulars, class updates, and announcements</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => readAllMut.mutate()} loading={readAllMut.isPending}>
            Mark All as Read
          </Button>
          {canSend && (
            <Button onClick={() => setModalOpen(true)}>
              + New Notice
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-line pb-1 text-sm">
        <button
          onClick={() => setUnreadOnly(false)}
          className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
            !unreadOnly ? 'bg-slate-100 text-brand font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setUnreadOnly(true)}
          className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
            unreadOnly ? 'bg-slate-100 text-brand font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Unread Only
        </button>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-sm text-slate-500">Loading notices...</div>
      ) : data?.items.length === 0 ? (
        <EmptyState title="No notifications" description="You have no notifications in this view." />
      ) : (
        <div className="space-y-3">
          {data?.items.map((item: NotificationItem) => {
            const isUnread = !item.readAt;
            return (
              <div
                key={item.id}
                className={`rounded-xl border p-4 shadow-sm transition-all ${
                  isUnread
                    ? 'border-l-4 border-l-brand border-slate-200 bg-white ring-1 ring-blue-50'
                    : 'border-line bg-white/70'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">{item.notification.title}</h2>
                      {isUnread && <span className="h-2 w-2 rounded-full bg-brand" />}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>By {item.notification.sender.firstName} {item.notification.sender.lastName}</span>
                      <Badge tone={item.notification.sender.role === 'ADMIN' ? 'amber' : 'blue'}>
                        {item.notification.sender.role}
                      </Badge>
                      <span>•</span>
                      <span>{new Date(item.notification.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                  </div>
                  {isUnread && (
                    <Button
                      variant="ghost"
                      className="h-7 text-xs text-slate-500 hover:text-brand"
                      onClick={() => readMut.mutate(item.id)}
                    >
                      Mark read
                    </Button>
                  )}
                </div>

                <p className="mt-3 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {item.notification.body}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <SendNotificationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSendSubmit}
      />
    </div>
  );
}
