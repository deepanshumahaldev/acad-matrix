import type { NotificationAudience, Prisma, PrismaClient, Role } from '@prisma/client';
import { toSkipTake } from '../../common/utils/pagination';
import type { NotificationFilterQuery } from './notifications.types';

export class NotificationsRepository {
  constructor(private readonly getDb: () => PrismaClient) {}

  async findTargetUsers(audience: NotificationAudience, targetRole?: Role, targetSectionId?: string, targetUserId?: string) {
    if (audience === 'ALL') {
      return this.getDb().user.findMany({
        where: { status: 'ACTIVE', deletedAt: null },
        select: { id: true, email: true, firstName: true },
      });
    }

    if (audience === 'ROLE' && targetRole) {
      return this.getDb().user.findMany({
        where: { role: targetRole, status: 'ACTIVE', deletedAt: null },
        select: { id: true, email: true, firstName: true },
      });
    }

    if (audience === 'SECTION' && targetSectionId) {
      return this.getDb().user.findMany({
        where: {
          student: { sectionId: targetSectionId },
          status: 'ACTIVE',
          deletedAt: null,
        },
        select: { id: true, email: true, firstName: true },
      });
    }

    if (audience === 'USER' && targetUserId) {
      return this.getDb().user.findMany({
        where: { id: targetUserId, status: 'ACTIVE', deletedAt: null },
        select: { id: true, email: true, firstName: true },
      });
    }

    return [];
  }

  async createNotificationWithRecipients(
    data: Prisma.NotificationUncheckedCreateInput,
    userIds: string[],
  ) {
    return this.getDb().$transaction(async (tx) => {
      const notification = await tx.notification.create({ data });
      if (userIds.length > 0) {
        await tx.notificationRecipient.createMany({
          data: userIds.map((userId) => ({
            notificationId: notification.id,
            userId,
          })),
        });
      }
      return notification;
    });
  }

  async findUserInbox(userId: string, query: NotificationFilterQuery) {
    const { skip, take } = toSkipTake(query);
    const where: Prisma.NotificationRecipientWhereInput = {
      userId,
      ...(query.unreadOnly ? { readAt: null } : {}),
    };

    const [items, total] = await Promise.all([
      this.getDb().notificationRecipient.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          notification: {
            include: {
              sender: { select: { firstName: true, lastName: true, role: true } },
            },
          },
        },
      }),
      this.getDb().notificationRecipient.count({ where }),
    ]);

    return { items, total };
  }

  async countUnread(userId: string) {
    return this.getDb().notificationRecipient.count({
      where: { userId, readAt: null },
    });
  }

  async markAsRead(id: string, userId: string) {
    return this.getDb().notificationRecipient.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    return this.getDb().notificationRecipient.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async checkFacultyTeachesSection(facultyUserId: string, sectionId: string) {
    const count = await this.getDb().subjectAllocation.count({
      where: {
        sectionId,
        faculty: { userId: facultyUserId },
      },
    });
    return count > 0;
  }
}
