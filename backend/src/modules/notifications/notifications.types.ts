import type { NotificationAudience, Role } from '@prisma/client';
import type { PaginationQuery } from '../../common/utils/pagination';

export interface CreateNotificationInput {
  title: string;
  body: string;
  audience: NotificationAudience;
  targetRole?: Role;
  targetSectionId?: string;
  targetUserId?: string;
  sendEmail?: boolean;
}

export interface NotificationFilterQuery extends PaginationQuery {
  unreadOnly?: boolean;
}

export interface NotificationInboxItem {
  id: string; // recipient id
  notificationId: string;
  title: string;
  body: string;
  audience: NotificationAudience;
  senderName: string;
  readAt: Date | null;
  createdAt: Date;
}
