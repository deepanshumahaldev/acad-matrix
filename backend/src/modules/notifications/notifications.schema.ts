import { NotificationAudience, Role } from '@prisma/client';
import { z } from 'zod';
import { paginationQuerySchema } from '../../common/utils/pagination';

const uuidSchema = z.string().uuid();

export const idParam = z.object({ id: uuidSchema });

export const createNotificationBody = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(2000),
  audience: z.nativeEnum(NotificationAudience),
  targetRole: z.nativeEnum(Role).optional(),
  targetSectionId: uuidSchema.optional(),
  targetUserId: uuidSchema.optional(),
  sendEmail: z.boolean().optional().default(false),
});

export const inboxQuerySchema = paginationQuerySchema.extend({
  unreadOnly: z.coerce.boolean().optional(),
});
