import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { ForbiddenError } from '../src/common/errors';
import { NotificationsService } from '../src/modules/notifications/notifications.service';
import type { NotificationsRepository } from '../src/modules/notifications/notifications.repository';
import { FakeAudit, FakeEmail } from './helpers/fakes';

function createMockNotificationsRepo() {
  const notifications = new Map<string, any>();
  const recipients: any[] = [];

  const repo: Partial<NotificationsRepository> = {
    findTargetUsers: async (audience) => {
      if (audience === 'ALL') return [{ id: 'u1', email: 'u1@test.com' }, { id: 'u2', email: 'u2@test.com' }];
      if (audience === 'SECTION') return [{ id: 'u1', email: 'u1@test.com' }];
      return [];
    },
    createNotificationWithRecipients: async (data, userIds) => {
      const id = randomUUID();
      const n = { id, ...data };
      notifications.set(id, n);
      userIds.forEach((uId) => recipients.push({ id: randomUUID(), notificationId: id, userId: uId, readAt: null }));
      return n as any;
    },
    checkFacultyTeachesSection: async (facId, secId) => facId === 'valid-faculty',
    countUnread: async () => 3,
  };

  return { repo: repo as NotificationsRepository, notifications, recipients };
}

describe('NotificationsService', () => {
  it('sends broadcast notification to ALL and dispatches emails', async () => {
    const { repo } = createMockNotificationsRepo();
    const email = new FakeEmail();
    const audit = new FakeAudit();
    const service = new NotificationsService(repo, email, audit);

    const result = await service.sendNotification(
      {
        title: 'College Sports Day',
        body: 'Annual sports day will be held on Friday.',
        audience: 'ALL',
        sendEmail: true,
      },
      'admin-id',
      'ADMIN',
    );

    expect(result.id).toBeDefined();
    expect(result.recipientsCount).toBe(2);
    expect(email.sent.length).toBe(2);
    expect(audit.actions()).toContain('NOTIFICATION_SENT');
  });

  it('restricts faculty to send notices only to sections they teach', async () => {
    const { repo } = createMockNotificationsRepo();
    const email = new FakeEmail();
    const audit = new FakeAudit();
    const service = new NotificationsService(repo, email, audit);

    await expect(
      service.sendNotification(
        {
          title: 'Class Cancelled',
          body: 'Tomorrow class is cancelled',
          audience: 'SECTION',
          targetSectionId: 'sec-1',
        },
        'unauthorized-faculty',
        'FACULTY',
      ),
    ).rejects.toThrow(ForbiddenError);
  });
});
