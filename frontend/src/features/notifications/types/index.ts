export type NotificationAudience = 'ALL' | 'ROLE' | 'SECTION' | 'USER';

export interface NotificationItem {
  id: string; // recipient row id
  notificationId: string;
  readAt: string | null;
  createdAt: string;
  notification: {
    id: string;
    title: string;
    body: string;
    audience: NotificationAudience;
    targetRole?: string | null;
    sendEmail: boolean;
    createdAt: string;
    sender: {
      firstName: string;
      lastName: string;
      role: string;
    };
  };
}

export interface CreateNotificationPayload {
  title: string;
  body: string;
  audience: NotificationAudience;
  targetRole?: 'ADMIN' | 'FACULTY' | 'STUDENT';
  targetSectionId?: string;
  targetUserId?: string;
  sendEmail?: boolean;
}
