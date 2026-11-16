import { BadRequestError, ForbiddenError } from '../../common/errors';
import type { AuditLogger } from '../../common/services/audit';
import type { EmailService } from '../../common/services/email';
import type { NotificationsRepository } from './notifications.repository';
import type { CreateNotificationInput, NotificationFilterQuery } from './notifications.types';

export class NotificationsService {
  constructor(
    private readonly repo: NotificationsRepository,
    private readonly email: EmailService,
    private readonly audit: AuditLogger,
  ) {}

  async sendNotification(
    input: CreateNotificationInput,
    senderId: string,
    senderRole: string,
    ip?: string,
  ) {
    if (senderRole === 'FACULTY') {
      if (input.audience !== 'SECTION' || !input.targetSectionId) {
        throw new ForbiddenError('Faculty can only send notifications to their assigned sections');
      }
      const teaches = await this.repo.checkFacultyTeachesSection(senderId, input.targetSectionId);
      if (!teaches) {
        throw new ForbiddenError('You do not teach this section');
      }
    }

    if (input.audience === 'ROLE' && !input.targetRole) {
      throw new BadRequestError('Target role is required when audience is ROLE');
    }
    if (input.audience === 'SECTION' && !input.targetSectionId) {
      throw new BadRequestError('Target section is required when audience is SECTION');
    }
    if (input.audience === 'USER' && !input.targetUserId) {
      throw new BadRequestError('Target user is required when audience is USER');
    }

    const targetUsers = await this.repo.findTargetUsers(
      input.audience,
      input.targetRole,
      input.targetSectionId,
      input.targetUserId,
    );

    const userIds = targetUsers.map((u) => u.id);

    const notification = await this.repo.createNotificationWithRecipients(
      {
        senderId,
        title: input.title,
        body: input.body,
        audience: input.audience,
        targetRole: input.targetRole,
        targetSectionId: input.targetSectionId,
        sendEmail: input.sendEmail ?? false,
      },
      userIds,
    );

    if (input.sendEmail && targetUsers.length > 0) {
      for (const u of targetUsers) {
        this.email.send({
          to: u.email,
          subject: `[AcadMatrix Notification] ${input.title}`,
          text: `${input.title}\n\n${input.body}`,
          html: `<div style="font-family:Arial,sans-serif;color:#1e293b;padding:16px;">
            <h2 style="color:#1f4fd8;margin-top:0;">${input.title}</h2>
            <p style="line-height:1.6;white-space:pre-wrap;">${input.body}</p>
          </div>`,
        }).catch(() => undefined);
      }
    }

    await this.audit.log({
      actorId: senderId,
      action: 'NOTIFICATION_SENT',
      entity: 'Notification',
      entityId: notification.id,
      metadata: { audience: input.audience, recipientsCount: userIds.length },
      ipAddress: ip,
    });

    return { ...notification, recipientsCount: userIds.length };
  }

  async getInbox(userId: string, query: NotificationFilterQuery) {
    return this.repo.findUserInbox(userId, query);
  }

  async getUnreadCount(userId: string) {
    const count = await this.repo.countUnread(userId);
    return { unreadCount: count };
  }

  async markAsRead(id: string, userId: string) {
    await this.repo.markAsRead(id, userId);
    return { success: true };
  }

  async markAllAsRead(userId: string) {
    await this.repo.markAllAsRead(userId);
    return { success: true };
  }
}
