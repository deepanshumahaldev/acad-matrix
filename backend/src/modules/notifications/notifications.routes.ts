import { Router } from 'express';
import { getPrisma } from '../../common/db/prisma';
import { authenticate, requireRole, validate } from '../../common/middleware';
import { PrismaAuditLogger } from '../../common/services/audit';
import { createEmailService } from '../../common/services/email';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { NotificationsController } from './notifications.controller';
import { NotificationsRepository } from './notifications.repository';
import { createNotificationBody, idParam, inboxQuerySchema } from './notifications.schema';
import { NotificationsService } from './notifications.service';

export function createDefaultNotificationsService(): NotificationsService {
  return new NotificationsService(
    new NotificationsRepository(getPrisma),
    createEmailService(),
    new PrismaAuditLogger(getPrisma),
  );
}

export function createNotificationsRoutes(
  service: NotificationsService = createDefaultNotificationsService(),
): Router {
  const c = new NotificationsController(service);
  const router = Router();

  router.use(authenticate());

  router.get('/inbox', validate({ query: inboxQuerySchema }), asyncHandler(c.getInbox));
  router.get('/unread-count', asyncHandler(c.getUnreadCount));
  router.patch('/:id/read', validate({ params: idParam }), asyncHandler(c.markAsRead));
  router.post('/read-all', asyncHandler(c.markAllAsRead));

  router.post(
    '/send',
    requireRole('ADMIN', 'FACULTY'),
    validate({ body: createNotificationBody }),
    asyncHandler(c.sendNotification),
  );

  return router;
}
